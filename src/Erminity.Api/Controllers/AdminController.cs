using System.Security.Claims;
using Erminity.Api.Domain.Entities;
using Erminity.Api.Infrastructure.Data;
using Erminity.Api.Infrastructure.Licensing;
using Microsoft.AspNetCore.Authorization;
using Microsoft.AspNetCore.Identity;
using Microsoft.AspNetCore.Mvc;
using Microsoft.EntityFrameworkCore;

namespace Erminity.Api.Controllers;

[ApiController]
[Authorize(Roles = "Admin")]
[Route("api/admin")]
public class AdminController : ControllerBase
{
    private static readonly HashSet<string> AllowedImageTypes = new(StringComparer.OrdinalIgnoreCase)
    {
        "image/png", "image/jpeg", "image/webp", "image/gif", "image/svg+xml", "image/x-icon", "image/vnd.microsoft.icon"
    };

    private readonly AppDbContext _db;
    private readonly IWebHostEnvironment _env;
    private readonly LicenseKeyService _keys;
    private readonly UserManager<ApplicationUser> _users;

    public AdminController(
        AppDbContext db,
        IWebHostEnvironment env,
        LicenseKeyService keys,
        UserManager<ApplicationUser> users)
    {
        _db = db;
        _env = env;
        _keys = keys;
        _users = users;
    }

    [HttpGet("settings")]
    public async Task<IActionResult> GetSettings(CancellationToken ct) =>
        Ok(await _db.SiteSettings.AsNoTracking().FirstAsync(ct));

    [HttpPut("settings")]
    public async Task<IActionResult> UpdateSettings([FromBody] SiteSettingsUpdate dto, CancellationToken ct)
    {
        var s = await _db.SiteSettings.FirstAsync(ct);
        s.SiteName = dto.SiteName.Trim();
        s.Slogan = dto.Slogan.Trim();
        s.FaviconMediaId = NullIfEmpty(dto.FaviconMediaId);
        s.LogoMediaId = NullIfEmpty(dto.LogoMediaId);
        s.DefaultOgImageMediaId = NullIfEmpty(dto.DefaultOgImageMediaId);
        s.LegalName = NullIfEmpty(dto.LegalName);
        s.LegalAddress = NullIfEmpty(dto.LegalAddress);
        s.PrivacyEmail = NullIfEmpty(dto.PrivacyEmail);
        s.Jurisdiction = NullIfEmpty(dto.Jurisdiction);
        s.UpdatedAt = DateTimeOffset.UtcNow;
        await _db.SaveChangesAsync(ct);
        await Audit("settings.update", nameof(SiteSettings), s.Id.ToString(), ct);
        return Ok(s);
    }

    [HttpGet("pricing")]
    public async Task<IActionResult> GetPricing(CancellationToken ct) =>
        Ok(await _db.PricingConfigs.AsNoTracking().FirstAsync(ct));

    [HttpPut("pricing")]
    public async Task<IActionResult> UpdatePricing([FromBody] PricingUpdate dto, CancellationToken ct)
    {
        var p = await _db.PricingConfigs.FirstAsync(ct);
        p.Currency = string.IsNullOrWhiteSpace(dto.Currency) ? "USD" : dto.Currency.Trim().ToUpperInvariant();
        p.ProMonthlyPrice = dto.ProMonthlyPrice;
        p.ProYearlyPrice = dto.ProYearlyPrice;
        p.PaddlePriceIdMonthly = NullIfEmpty(dto.PaddlePriceIdMonthly);
        p.PaddlePriceIdYearly = NullIfEmpty(dto.PaddlePriceIdYearly);
        p.ShowComingSoonWhenEmpty = dto.ShowComingSoonWhenEmpty;
        p.UpdatedAt = DateTimeOffset.UtcNow;
        await _db.SaveChangesAsync(ct);
        await Audit("pricing.update", nameof(PricingConfig), p.Id.ToString(), ct);
        return Ok(p);
    }

    [HttpGet("contacts")]
    public async Task<IActionResult> Contacts(CancellationToken ct) =>
        Ok(await _db.ContactRequests.AsNoTracking().OrderByDescending(c => c.CreatedAt).Take(200).ToListAsync(ct));

    [HttpGet("licenses")]
    public async Task<IActionResult> ListLicenses(CancellationToken ct)
    {
        var items = await _db.Licenses.AsNoTracking()
            .Include(l => l.User)
            .Include(l => l.Device)
            .OrderByDescending(l => l.CreatedAt)
            .Take(300)
            .Select(l => new
            {
                l.Id,
                l.Plan,
                l.Status,
                l.KeyPrefix,
                l.BillingInterval,
                l.CurrentPeriodEnd,
                l.CreatedAt,
                userEmail = l.User != null ? l.User.Email : null,
                deviceLabel = l.Device != null ? l.Device.DeviceLabel : null,
                ideProduct = l.Device != null ? l.Device.IdeProduct : null,
                hasDevice = l.Device != null
            })
            .ToListAsync(ct);
        return Ok(items);
    }

    [HttpPost("licenses")]
    public async Task<IActionResult> IssueLicense([FromBody] IssueLicenseRequest dto, CancellationToken ct)
    {
        if (string.IsNullOrWhiteSpace(dto.UserEmail))
            return BadRequest(new { error = "email_required" });

        var user = await _users.FindByEmailAsync(dto.UserEmail.Trim());
        if (user is null) return NotFound(new { error = "user_not_found" });

        if (!Enum.TryParse<LicensePlan>(dto.Plan, true, out var plan) || plan == LicensePlan.Free)
            plan = LicensePlan.Pro;

        var interval = string.Equals(dto.BillingInterval, "year", StringComparison.OrdinalIgnoreCase) ? "year" : "month";
        var days = dto.PeriodDays is > 0 and <= 3660 ? dto.PeriodDays.Value : (interval == "year" ? 365 : 30);
        var (rawKey, prefix, hash, protectedKey) = _keys.Issue(plan);

        var license = new License
        {
            UserId = user.Id,
            Plan = plan,
            Status = LicenseStatus.Active,
            KeyHash = hash,
            KeyPrefix = prefix,
            KeyProtected = protectedKey,
            BillingInterval = interval,
            CurrentPeriodEnd = DateTimeOffset.UtcNow.AddDays(days)
        };
        _db.Licenses.Add(license);
        await _db.SaveChangesAsync(ct);
        await Audit("license.issue", nameof(License), license.Id.ToString(), ct);

        return Ok(new
        {
            license.Id,
            plan = license.Plan.ToString(),
            status = license.Status.ToString(),
            key = rawKey,
            keyPrefix = prefix,
            billingInterval = license.BillingInterval,
            currentPeriodEnd = license.CurrentPeriodEnd,
            userEmail = user.Email
        });
    }

    [HttpPost("licenses/{id:guid}/revoke")]
    public async Task<IActionResult> RevokeLicense(Guid id, CancellationToken ct)
    {
        var license = await _db.Licenses.Include(l => l.Device).FirstOrDefaultAsync(l => l.Id == id, ct);
        if (license is null) return NotFound();
        license.Status = LicenseStatus.Revoked;
        if (license.Device is not null) _db.DeviceActivations.Remove(license.Device);
        await _db.SaveChangesAsync(ct);
        await Audit("license.revoke", nameof(License), id.ToString(), ct);
        return Ok(new { ok = true });
    }

    [HttpPost("licenses/{id:guid}/force-deactivate")]
    public async Task<IActionResult> ForceDeactivate(Guid id, CancellationToken ct)
    {
        var license = await _db.Licenses.Include(l => l.Device).FirstOrDefaultAsync(l => l.Id == id, ct);
        if (license is null) return NotFound();
        if (license.Device is not null) _db.DeviceActivations.Remove(license.Device);
        await _db.SaveChangesAsync(ct);
        await Audit("license.force_deactivate", nameof(License), id.ToString(), ct);
        return Ok(new { ok = true });
    }

    [HttpPost("contacts/{id:guid}/handled")]
    public async Task<IActionResult> MarkContactHandled(Guid id, CancellationToken ct)
    {
        var c = await _db.ContactRequests.FirstOrDefaultAsync(x => x.Id == id, ct);
        if (c is null) return NotFound();
        c.IsHandled = true;
        await _db.SaveChangesAsync(ct);
        await Audit("contact.handled", nameof(ContactRequest), id.ToString(), ct);
        return Ok(c);
    }

    [HttpGet("media")]
    public async Task<IActionResult> ListMedia(CancellationToken ct)
    {
        var items = await _db.MediaAssets.AsNoTracking()
            .OrderByDescending(m => m.CreatedAt)
            .Take(200)
            .Select(m => new
            {
                m.Id,
                m.FileName,
                m.ContentType,
                m.AltText,
                m.Title,
                m.Caption,
                m.SizeBytes,
                m.CreatedAt,
                url = $"/api/public/media/{m.Id}"
            })
            .ToListAsync(ct);
        return Ok(items);
    }

    [HttpPost("media")]
    [RequestSizeLimit(8_000_000)]
    public async Task<IActionResult> UploadMedia(
        IFormFile file,
        [FromForm] string altText,
        [FromForm] string? title,
        [FromForm] string? caption,
        CancellationToken ct)
    {
        if (file is null || file.Length == 0) return BadRequest(new { error = "file_required" });
        if (string.IsNullOrWhiteSpace(altText)) return BadRequest(new { error = "alt_required" });
        if (file.Length > 5_000_000) return BadRequest(new { error = "file_too_large" });
        if (!AllowedImageTypes.Contains(file.ContentType)) return BadRequest(new { error = "invalid_type" });

        var id = Guid.NewGuid();
        var ext = Path.GetExtension(file.FileName);
        if (string.IsNullOrWhiteSpace(ext) || ext.Length > 8) ext = GuessExtension(file.ContentType);
        var safeName = $"{id:N}{ext.ToLowerInvariant()}";
        var mediaRoot = Path.Combine(_env.ContentRootPath, "media");
        Directory.CreateDirectory(mediaRoot);
        var path = Path.Combine(mediaRoot, safeName);

        await using (var stream = System.IO.File.Create(path))
            await file.CopyToAsync(stream, ct);

        var asset = new MediaAsset
        {
            Id = id,
            FileName = Path.GetFileName(file.FileName),
            ContentType = file.ContentType,
            StoragePath = safeName,
            AltText = altText.Trim(),
            Title = NullIfEmpty(title),
            Caption = NullIfEmpty(caption),
            SizeBytes = file.Length
        };
        _db.MediaAssets.Add(asset);
        await _db.SaveChangesAsync(ct);
        await Audit("media.upload", nameof(MediaAsset), id.ToString(), ct);

        return Ok(new
        {
            asset.Id,
            asset.FileName,
            asset.ContentType,
            asset.AltText,
            asset.Title,
            asset.Caption,
            asset.SizeBytes,
            asset.CreatedAt,
            url = $"/api/public/media/{asset.Id}"
        });
    }

    [HttpPut("media/{id:guid}")]
    public async Task<IActionResult> UpdateMedia(Guid id, [FromBody] MediaUpdate dto, CancellationToken ct)
    {
        if (string.IsNullOrWhiteSpace(dto.AltText)) return BadRequest(new { error = "alt_required" });
        var asset = await _db.MediaAssets.FirstOrDefaultAsync(m => m.Id == id, ct);
        if (asset is null) return NotFound();
        asset.AltText = dto.AltText.Trim();
        asset.Title = NullIfEmpty(dto.Title);
        asset.Caption = NullIfEmpty(dto.Caption);
        await _db.SaveChangesAsync(ct);
        await Audit("media.update", nameof(MediaAsset), id.ToString(), ct);
        return Ok(asset);
    }

    [HttpDelete("media/{id:guid}")]
    public async Task<IActionResult> DeleteMedia(Guid id, CancellationToken ct)
    {
        var asset = await _db.MediaAssets.FirstOrDefaultAsync(m => m.Id == id, ct);
        if (asset is null) return NotFound();
        var path = Path.Combine(_env.ContentRootPath, "media", asset.StoragePath);
        if (System.IO.File.Exists(path)) System.IO.File.Delete(path);
        _db.MediaAssets.Remove(asset);
        await _db.SaveChangesAsync(ct);
        await Audit("media.delete", nameof(MediaAsset), id.ToString(), ct);
        return NoContent();
    }

    [HttpGet("pages")]
    public async Task<IActionResult> ListPages(CancellationToken ct)
    {
        var pages = await _db.CmsPages.AsNoTracking()
            .Include(p => p.Locales)
            .OrderBy(p => p.Slug)
            .Select(p => new
            {
                p.Id,
                p.Slug,
                p.IsPublished,
                p.UpdatedAt,
                locales = p.Locales.Select(l => l.Locale).ToArray()
            })
            .ToListAsync(ct);
        return Ok(pages);
    }

    [HttpGet("pages/{id:guid}")]
    public async Task<IActionResult> GetPage(Guid id, [FromQuery] string locale = "en", CancellationToken ct = default)
    {
        locale = NormalizeLocale(locale);
        var page = await _db.CmsPages.AsNoTracking()
            .Include(p => p.Locales).ThenInclude(l => l.Sections).ThenInclude(s => s.Blocks)
            .FirstOrDefaultAsync(p => p.Id == id, ct);
        if (page is null) return NotFound();
        return Ok(MapAdminPage(page, locale));
    }

    [HttpPost("pages")]
    public async Task<IActionResult> CreatePage([FromBody] CreatePageRequest dto, CancellationToken ct)
    {
        var slug = dto.Slug.Trim().ToLowerInvariant();
        if (string.IsNullOrWhiteSpace(slug)) return BadRequest(new { error = "slug_required" });
        if (await _db.CmsPages.AnyAsync(p => p.Slug == slug, ct))
            return Conflict(new { error = "slug_taken" });

        var page = new CmsPage { Id = Guid.NewGuid(), Slug = slug, IsPublished = false };
        foreach (var loc in new[] { "en", "de", "fr", "ar", "fa" })
        {
            page.Locales.Add(new CmsPageLocale
            {
                Id = Guid.NewGuid(),
                Locale = loc,
                Title = string.IsNullOrWhiteSpace(dto.Title) ? slug : dto.Title.Trim(),
                Sections =
                {
                    new CmsSection
                    {
                        Id = Guid.NewGuid(),
                        Key = "hero",
                        SortOrder = 0,
                        Blocks =
                        {
                            new CmsBlock { Id = Guid.NewGuid(), Type = "text", Text = "Headline", SortOrder = 0 },
                            new CmsBlock { Id = Guid.NewGuid(), Type = "text", Text = "Supporting sentence", SortOrder = 1 },
                            new CmsBlock { Id = Guid.NewGuid(), Type = "cta", CtaLabel = "Get Pro", CtaHref = "/pricing", SortOrder = 2 }
                        }
                    }
                }
            });
        }

        _db.CmsPages.Add(page);
        await _db.SaveChangesAsync(ct);
        await Audit("page.create", nameof(CmsPage), page.Id.ToString(), ct);
        return Ok(MapAdminPage(page, "en"));
    }

    [HttpPut("pages/{id:guid}")]
    public async Task<IActionResult> UpdatePage(Guid id, [FromBody] UpdatePageRequest dto, CancellationToken ct)
    {
        var locale = NormalizeLocale(dto.Locale);
        var page = await _db.CmsPages
            .Include(p => p.Locales).ThenInclude(l => l.Sections).ThenInclude(s => s.Blocks)
            .FirstOrDefaultAsync(p => p.Id == id, ct);
        if (page is null) return NotFound();

        page.IsPublished = dto.IsPublished;
        page.UpdatedAt = DateTimeOffset.UtcNow;

        var loc = page.Locales.FirstOrDefault(l => l.Locale == locale);
        if (loc is null)
        {
            loc = new CmsPageLocale { Id = Guid.NewGuid(), Locale = locale, PageId = page.Id };
            page.Locales.Add(loc);
        }

        loc.Title = dto.Title.Trim();
        loc.MetaDescription = NullIfEmpty(dto.MetaDescription);
        loc.CanonicalPath = NullIfEmpty(dto.CanonicalPath);
        loc.Robots = string.IsNullOrWhiteSpace(dto.Robots) ? "index,follow" : dto.Robots.Trim();
        loc.OgTitle = NullIfEmpty(dto.OgTitle);
        loc.OgDescription = NullIfEmpty(dto.OgDescription);
        loc.OgImageMediaId = dto.OgImageMediaId;

        _db.CmsBlocks.RemoveRange(loc.Sections.SelectMany(s => s.Blocks));
        _db.CmsSections.RemoveRange(loc.Sections);
        loc.Sections.Clear();

        var order = 0;
        foreach (var section in dto.Sections ?? [])
        {
            var sec = new CmsSection
            {
                Id = Guid.NewGuid(),
                Key = string.IsNullOrWhiteSpace(section.Key) ? $"section-{order}" : section.Key.Trim(),
                SortOrder = order++
            };
            var bOrder = 0;
            foreach (var block in section.Blocks ?? [])
            {
                if (block.Type == "image" && block.MediaId is null)
                    return BadRequest(new { error = "image_media_required" });

                sec.Blocks.Add(new CmsBlock
                {
                    Id = Guid.NewGuid(),
                    Type = string.IsNullOrWhiteSpace(block.Type) ? "text" : block.Type.Trim(),
                    Text = block.Text,
                    MediaId = block.MediaId,
                    CtaLabel = block.CtaLabel,
                    CtaHref = block.CtaHref,
                    SortOrder = bOrder++
                });
            }

            loc.Sections.Add(sec);
        }

        await _db.SaveChangesAsync(ct);
        await Audit("page.update", nameof(CmsPage), page.Id.ToString(), ct);
        return Ok(MapAdminPage(page, locale));
    }

    private object MapAdminPage(CmsPage page, string locale)
    {
        var loc = page.Locales.FirstOrDefault(l => l.Locale == locale)
                  ?? page.Locales.FirstOrDefault(l => l.Locale == "en")
                  ?? page.Locales.FirstOrDefault();

        return new
        {
            page.Id,
            page.Slug,
            page.IsPublished,
            page.UpdatedAt,
            locale = loc?.Locale ?? locale,
            availableLocales = page.Locales.Select(l => l.Locale).OrderBy(x => x).ToArray(),
            title = loc?.Title ?? "",
            metaDescription = loc?.MetaDescription,
            canonicalPath = loc?.CanonicalPath,
            robots = loc?.Robots ?? "index,follow",
            ogTitle = loc?.OgTitle,
            ogDescription = loc?.OgDescription,
            ogImageMediaId = loc?.OgImageMediaId,
            sections = (loc?.Sections ?? []).OrderBy(s => s.SortOrder).Select(s => new
            {
                key = s.Key,
                blocks = s.Blocks.OrderBy(b => b.SortOrder).Select(b => new
                {
                    type = b.Type,
                    text = b.Text,
                    mediaId = b.MediaId,
                    ctaLabel = b.CtaLabel,
                    ctaHref = b.CtaHref
                })
            })
        };
    }

    private async Task Audit(string action, string entityType, string? entityId, CancellationToken ct)
    {
        _db.AuditLogs.Add(new AuditLogEntry
        {
            ActorUserId = User.FindFirstValue(ClaimTypes.NameIdentifier),
            Action = action,
            EntityType = entityType,
            EntityId = entityId,
            IpAddress = HttpContext.Connection.RemoteIpAddress?.ToString()
        });
        await _db.SaveChangesAsync(ct);
    }

    private static string NormalizeLocale(string locale) =>
        locale.ToLowerInvariant() switch
        {
            "de" or "fr" or "ar" or "fa" or "en" => locale.ToLowerInvariant(),
            _ => "en"
        };

    private static string? NullIfEmpty(string? value) =>
        string.IsNullOrWhiteSpace(value) ? null : value.Trim();

    private static string GuessExtension(string contentType) => contentType.ToLowerInvariant() switch
    {
        "image/png" => ".png",
        "image/jpeg" => ".jpg",
        "image/webp" => ".webp",
        "image/gif" => ".gif",
        "image/svg+xml" => ".svg",
        "image/x-icon" or "image/vnd.microsoft.icon" => ".ico",
        _ => ".bin"
    };

    public sealed record SiteSettingsUpdate(
        string SiteName,
        string Slogan,
        string? FaviconMediaId,
        string? LogoMediaId,
        string? DefaultOgImageMediaId,
        string? LegalName,
        string? LegalAddress,
        string? PrivacyEmail,
        string? Jurisdiction);

    public sealed record PricingUpdate(
        string Currency,
        decimal? ProMonthlyPrice,
        decimal? ProYearlyPrice,
        string? PaddlePriceIdMonthly,
        string? PaddlePriceIdYearly,
        bool ShowComingSoonWhenEmpty);

    public sealed record IssueLicenseRequest(
        string UserEmail,
        string Plan,
        string? BillingInterval,
        int? PeriodDays);

    public sealed record MediaUpdate(string AltText, string? Title, string? Caption);

    public sealed record CreatePageRequest(string Slug, string? Title);

    public sealed record UpdatePageRequest(
        string Locale,
        bool IsPublished,
        string Title,
        string? MetaDescription,
        string? CanonicalPath,
        string? Robots,
        string? OgTitle,
        string? OgDescription,
        Guid? OgImageMediaId,
        List<SectionDto>? Sections);

    public sealed record SectionDto(string Key, List<BlockDto>? Blocks);

    public sealed record BlockDto(
        string Type,
        string? Text,
        Guid? MediaId,
        string? CtaLabel,
        string? CtaHref);
}
