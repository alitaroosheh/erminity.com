using System.Security.Claims;
using Erminity.Api.Domain.Entities;
using Erminity.Api.Infrastructure.Data;
using Microsoft.AspNetCore.Authorization;
using Microsoft.AspNetCore.Mvc;
using Microsoft.EntityFrameworkCore;

namespace Erminity.Api.Controllers;

[ApiController]
[Authorize(Roles = "Admin")]
[Route("api/admin")]
public class AdminController : ControllerBase
{
    private readonly AppDbContext _db;

    public AdminController(AppDbContext db) => _db = db;

    [HttpGet("settings")]
    public async Task<IActionResult> GetSettings(CancellationToken ct)
    {
        var s = await _db.SiteSettings.AsNoTracking().FirstAsync(ct);
        return Ok(s);
    }

    [HttpPut("settings")]
    public async Task<IActionResult> UpdateSettings([FromBody] SiteSettingsUpdate dto, CancellationToken ct)
    {
        var s = await _db.SiteSettings.FirstAsync(ct);
        s.SiteName = dto.SiteName;
        s.Slogan = dto.Slogan;
        s.FaviconMediaId = dto.FaviconMediaId;
        s.LogoMediaId = dto.LogoMediaId;
        s.LegalName = dto.LegalName;
        s.LegalAddress = dto.LegalAddress;
        s.PrivacyEmail = dto.PrivacyEmail;
        s.Jurisdiction = dto.Jurisdiction;
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
        p.Currency = dto.Currency;
        p.ProMonthlyPrice = dto.ProMonthlyPrice;
        p.ProYearlyPrice = dto.ProYearlyPrice;
        p.PaddlePriceIdMonthly = dto.PaddlePriceIdMonthly;
        p.PaddlePriceIdYearly = dto.PaddlePriceIdYearly;
        p.ShowComingSoonWhenEmpty = dto.ShowComingSoonWhenEmpty;
        p.UpdatedAt = DateTimeOffset.UtcNow;
        await _db.SaveChangesAsync(ct);
        await Audit("pricing.update", nameof(PricingConfig), p.Id.ToString(), ct);
        return Ok(p);
    }

    [HttpGet("contacts")]
    public async Task<IActionResult> Contacts(CancellationToken ct) =>
        Ok(await _db.ContactRequests.AsNoTracking().OrderByDescending(c => c.CreatedAt).Take(200).ToListAsync(ct));

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

    public sealed record SiteSettingsUpdate(
        string SiteName,
        string Slogan,
        string? FaviconMediaId,
        string? LogoMediaId,
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
}
