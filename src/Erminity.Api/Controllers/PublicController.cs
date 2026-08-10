using Erminity.Api.Domain.Entities;
using Erminity.Api.Infrastructure.Data;
using Microsoft.AspNetCore.Mvc;
using Microsoft.EntityFrameworkCore;

namespace Erminity.Api.Controllers;

[ApiController]
[Route("api/public")]
public class PublicController : ControllerBase
{
    private readonly AppDbContext _db;
    private readonly IWebHostEnvironment _env;

    public PublicController(AppDbContext db, IWebHostEnvironment env)
    {
        _db = db;
        _env = env;
    }

    [HttpGet("site")]
    public async Task<IActionResult> GetSite(CancellationToken ct)
    {
        var settings = await _db.SiteSettings.AsNoTracking().FirstAsync(ct);
        var pricing = await _db.PricingConfigs.AsNoTracking().FirstAsync(ct);

        return Ok(new
        {
            siteName = settings.SiteName,
            slogan = settings.Slogan,
            faviconMediaId = settings.FaviconMediaId,
            faviconUrl = string.IsNullOrWhiteSpace(settings.FaviconMediaId)
                ? null
                : $"/api/public/media/{settings.FaviconMediaId}",
            logoMediaId = settings.LogoMediaId,
            logoUrl = string.IsNullOrWhiteSpace(settings.LogoMediaId)
                ? null
                : $"/api/public/media/{settings.LogoMediaId}",
            legal = new
            {
                name = settings.LegalName ?? settings.LegalNamePlaceholder,
                address = settings.LegalAddress ?? settings.LegalAddressPlaceholder,
                privacyEmail = settings.PrivacyEmail ?? settings.PrivacyEmailPlaceholder,
                jurisdiction = settings.Jurisdiction ?? settings.JurisdictionPlaceholder,
                isConfigured = !string.IsNullOrWhiteSpace(settings.LegalName)
            },
            pricing = new
            {
                currency = pricing.Currency,
                proMonthly = pricing.ProMonthlyPrice,
                proYearly = pricing.ProYearlyPrice,
                showComingSoon = pricing.ShowComingSoonWhenEmpty &&
                                 pricing.ProMonthlyPrice is null &&
                                 pricing.ProYearlyPrice is null
            }
        });
    }

    [HttpGet("media/{id:guid}")]
    [ResponseCache(Duration = 3600, Location = ResponseCacheLocation.Any)]
    public async Task<IActionResult> GetMedia(Guid id, CancellationToken ct)
    {
        var asset = await _db.MediaAssets.AsNoTracking().FirstOrDefaultAsync(m => m.Id == id, ct);
        if (asset is null) return NotFound();
        var path = Path.Combine(_env.ContentRootPath, "media", asset.StoragePath);
        if (!System.IO.File.Exists(path)) return NotFound();
        return PhysicalFile(path, asset.ContentType, enableRangeProcessing: true);
    }

    [HttpGet("pages/{slug}")]
    public async Task<IActionResult> GetPage(string slug, [FromQuery] string locale = "en", CancellationToken ct = default)
    {
        locale = NormalizeLocale(locale);
        var page = await _db.CmsPages.AsNoTracking()
            .Include(p => p.Locales).ThenInclude(l => l.Sections).ThenInclude(s => s.Blocks).ThenInclude(b => b.Media)
            .FirstOrDefaultAsync(p => p.Slug == slug && p.IsPublished, ct);

        if (page is null)
        {
            return Ok(GetSeedPage(slug, locale));
        }

        var loc = page.Locales.FirstOrDefault(l => l.Locale == locale)
                  ?? page.Locales.FirstOrDefault(l => l.Locale == "en");
        if (loc is null) return NotFound();

        return Ok(MapPage(page.Slug, loc));
    }

    [HttpPost("contact")]
    public async Task<IActionResult> Contact([FromBody] ContactDto dto, CancellationToken ct)
    {
        if (string.IsNullOrWhiteSpace(dto.Email) || string.IsNullOrWhiteSpace(dto.Message))
            return BadRequest(new { error = "invalid_request" });

        _db.ContactRequests.Add(new ContactRequest
        {
            Name = dto.Name?.Trim() ?? "",
            Email = dto.Email.Trim(),
            Company = dto.Company?.Trim() ?? "",
            Message = dto.Message.Trim(),
            Locale = NormalizeLocale(dto.Locale ?? "en"),
            IsEnterpriseInquiry = dto.IsEnterpriseInquiry
        });
        await _db.SaveChangesAsync(ct);
        return Accepted();
    }

    private static string NormalizeLocale(string locale) =>
        locale.ToLowerInvariant() switch
        {
            "de" or "fr" or "ar" or "en" => locale.ToLowerInvariant(),
            _ => "en"
        };

    private static object GetSeedPage(string slug, string locale) => slug switch
    {
        "home" => MapSeedHome(locale),
        _ => new { slug, locale, title = slug, sections = Array.Empty<object>() }
    };

    private static object MapSeedHome(string locale)
    {
        var (title, headline, sub, ctaPro, ctaFree) = locale switch
        {
            "de" => ("Startseite", "EmbeddedFlow für präzise UI-Systeme",
                "Vom Design zur Laufzeit — Symbol-Bindung und Protokoll-Integrationen für Pro.",
                "Pro holen", "Kostenlos starten"),
            "fr" => ("Accueil", "EmbeddedFlow pour des interfaces exactes",
                "Du design à l’exécution — liaison de symboles et protocoles pour Pro.",
                "Passer à Pro", "Commencer gratuitement"),
            "ar" => ("الرئيسية", "EmbeddedFlow لواجهات مدمجة دقيقة",
                "من التصميم إلى التشغيل — ربط الرموز والبروتوكولات في خطة Pro.",
                "الحصول على Pro", "ابدأ مجاناً"),
            _ => ("Home", "EmbeddedFlow for exact embedded UI",
                "Beyond static design tools — bind UI to code symbols, and soon to MQTT and protocols.",
                "Get Pro", "Start free")
        };

        return new
        {
            slug = "home",
            locale,
            title,
            metaDescription = sub,
            robots = "index,follow",
            sections = new object[]
            {
                new
                {
                    key = "hero",
                    blocks = new object[]
                    {
                        new { type = "text", text = headline },
                        new { type = "text", text = sub },
                        new { type = "cta", ctaLabel = ctaPro, ctaHref = "/pricing" },
                        new { type = "cta", ctaLabel = ctaFree, ctaHref = "/download" }
                    }
                }
            }
        };
    }

    private static object MapPage(string slug, CmsPageLocale loc) => new
    {
        slug,
        locale = loc.Locale,
        title = loc.Title,
        metaDescription = loc.MetaDescription,
        canonicalPath = loc.CanonicalPath,
        robots = loc.Robots,
        ogTitle = loc.OgTitle,
        ogDescription = loc.OgDescription,
        ogImageMediaId = loc.OgImageMediaId,
        sections = loc.Sections.OrderBy(s => s.SortOrder).Select(s => new
        {
            key = s.Key,
            blocks = s.Blocks.OrderBy(b => b.SortOrder).Select(b => new
            {
                type = b.Type,
                text = b.Text,
                ctaLabel = b.CtaLabel,
                ctaHref = b.CtaHref,
                media = b.Media is null ? null : new
                {
                    id = b.Media.Id,
                    alt = b.Media.AltText,
                    title = b.Media.Title,
                    caption = b.Media.Caption,
                    contentType = b.Media.ContentType
                }
            })
        })
    };

    public sealed record ContactDto(
        string? Name,
        string Email,
        string? Company,
        string Message,
        string? Locale,
        bool IsEnterpriseInquiry = true);
}
