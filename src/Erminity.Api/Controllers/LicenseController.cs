using System.ComponentModel.DataAnnotations;
using System.Security.Claims;
using Erminity.Api.Domain.Entities;
using Erminity.Api.Infrastructure.Data;
using Erminity.Api.Infrastructure.Licensing;
using Microsoft.AspNetCore.Authorization;
using Microsoft.AspNetCore.Mvc;
using Microsoft.AspNetCore.RateLimiting;
using Microsoft.EntityFrameworkCore;

namespace Erminity.Api.Controllers;

[ApiController]
[Route("api/license")]
public class LicenseController : ControllerBase
{
    private readonly AppDbContext _db;
    private readonly LicenseKeyService _keys;

    public LicenseController(AppDbContext db, LicenseKeyService keys)
    {
        _db = db;
        _keys = keys;
    }

    [HttpPost("activate")]
    [AllowAnonymous]
    [EnableRateLimiting("license")]
    public async Task<IActionResult> Activate([FromBody] ActivateRequest req, CancellationToken ct)
    {
        if (string.IsNullOrWhiteSpace(req.Key) || string.IsNullOrWhiteSpace(req.DeviceFingerprint))
            return BadRequest(new { error = "invalid_request" });

        var hash = LicenseKeyService.Hash(req.Key);
        var license = await _db.Licenses.Include(l => l.Device)
            .FirstOrDefaultAsync(l => l.KeyHash == hash, ct);
        if (license is null)
            return Unauthorized(new { error = "invalid_key" });
        if (!IsUsable(license))
            return Unauthorized(new { error = "license_inactive" });

        var fpHash = LicenseKeyService.Hash(req.DeviceFingerprint);
        if (license.Device is not null &&
            !string.Equals(license.Device.DeviceFingerprintHash, fpHash, StringComparison.Ordinal))
        {
            return Conflict(new { error = "device_bound", message = "Deactivate the current device from your account first." });
        }

        if (license.Device is null)
        {
            license.Device = new DeviceActivation
            {
                LicenseId = license.Id,
                DeviceFingerprintHash = fpHash,
                DeviceLabel = Truncate(req.DeviceLabel, 128),
                IdeProduct = Truncate(req.IdeProduct, 64),
                ActivatedAt = DateTimeOffset.UtcNow,
                LastSeenAt = DateTimeOffset.UtcNow
            };
            _db.DeviceActivations.Add(license.Device);
        }
        else
        {
            license.Device.LastSeenAt = DateTimeOffset.UtcNow;
            license.Device.DeviceLabel = Truncate(req.DeviceLabel, 128) ?? license.Device.DeviceLabel;
            license.Device.IdeProduct = Truncate(req.IdeProduct, 64) ?? license.Device.IdeProduct;
        }

        await _db.SaveChangesAsync(ct);
        var token = _keys.CreateOfflineToken(license, TimeSpan.FromDays(7));
        return Ok(new
        {
            plan = license.Plan.ToString(),
            status = license.Status.ToString(),
            features = LicenseKeyService.FeaturesFor(license.Plan),
            periodEnd = license.CurrentPeriodEnd,
            offlineToken = token,
            offlineTokenExpiresAt = DateTimeOffset.UtcNow.AddDays(7)
        });
    }

    [HttpPost("validate")]
    [AllowAnonymous]
    [EnableRateLimiting("license")]
    public async Task<IActionResult> Validate([FromBody] ValidateRequest req, CancellationToken ct)
    {
        if (string.IsNullOrWhiteSpace(req.Key) || string.IsNullOrWhiteSpace(req.DeviceFingerprint))
            return BadRequest(new { error = "invalid_request" });

        var hash = LicenseKeyService.Hash(req.Key);
        var license = await _db.Licenses.Include(l => l.Device)
            .FirstOrDefaultAsync(l => l.KeyHash == hash, ct);
        if (license is null)
            return Unauthorized(new { error = "invalid_key" });
        if (!IsUsable(license))
            return Unauthorized(new { error = "license_inactive" });

        var fpHash = LicenseKeyService.Hash(req.DeviceFingerprint);
        if (license.Device is null ||
            !string.Equals(license.Device.DeviceFingerprintHash, fpHash, StringComparison.Ordinal))
            return Conflict(new { error = "device_mismatch" });

        license.Device.LastSeenAt = DateTimeOffset.UtcNow;
        await _db.SaveChangesAsync(ct);

        var token = _keys.CreateOfflineToken(license, TimeSpan.FromDays(7));
        return Ok(new
        {
            plan = license.Plan.ToString(),
            status = license.Status.ToString(),
            features = LicenseKeyService.FeaturesFor(license.Plan),
            periodEnd = license.CurrentPeriodEnd,
            offlineToken = token,
            offlineTokenExpiresAt = DateTimeOffset.UtcNow.AddDays(7)
        });
    }

    [HttpGet("me")]
    [Authorize]
    public async Task<IActionResult> MyLicenses(CancellationToken ct)
    {
        var userId = User.FindFirstValue(ClaimTypes.NameIdentifier);
        if (userId is null) return Unauthorized();

        var licenses = await _db.Licenses.AsNoTracking()
            .Include(l => l.Device)
            .Where(l => l.UserId == userId)
            .OrderByDescending(l => l.CreatedAt)
            .ToListAsync(ct);

        return Ok(licenses.Select(MapMine));
    }

    [HttpPost("me/{id:guid}/deactivate-device")]
    [Authorize]
    public async Task<IActionResult> DeactivateMine(Guid id, CancellationToken ct)
    {
        var userId = User.FindFirstValue(ClaimTypes.NameIdentifier);
        if (userId is null) return Unauthorized();

        var license = await _db.Licenses.Include(l => l.Device)
            .FirstOrDefaultAsync(l => l.Id == id && l.UserId == userId, ct);
        if (license is null) return NotFound();
        if (license.Device is null) return Ok(new { ok = true, alreadyFree = true });

        _db.DeviceActivations.Remove(license.Device);
        await _db.SaveChangesAsync(ct);

        _db.AuditLogs.Add(new AuditLogEntry
        {
            ActorUserId = userId,
            Action = "license.device_deactivate",
            EntityType = nameof(License),
            EntityId = id.ToString(),
            IpAddress = HttpContext.Connection.RemoteIpAddress?.ToString()
        });
        await _db.SaveChangesAsync(ct);

        return Ok(new { ok = true });
    }

    private object MapMine(License l) => new
    {
        id = l.Id,
        plan = l.Plan.ToString(),
        status = l.Status.ToString(),
        keyPrefix = l.KeyPrefix,
        key = _keys.Reveal(l.KeyProtected),
        billingInterval = l.BillingInterval,
        currentPeriodEnd = l.CurrentPeriodEnd,
        features = LicenseKeyService.FeaturesFor(l.Plan),
        createdAt = l.CreatedAt,
        device = l.Device is null ? null : new
        {
            label = l.Device.DeviceLabel,
            ideProduct = l.Device.IdeProduct,
            activatedAt = l.Device.ActivatedAt,
            lastSeenAt = l.Device.LastSeenAt
        }
    };

    private static bool IsUsable(License license) =>
        license.Status == LicenseStatus.Active &&
        (license.CurrentPeriodEnd is null || license.CurrentPeriodEnd > DateTimeOffset.UtcNow);

    private static string? Truncate(string? value, int max) =>
        string.IsNullOrWhiteSpace(value) ? null : (value.Trim().Length <= max ? value.Trim() : value.Trim()[..max]);

    public sealed class ActivateRequest
    {
        [Required] public string Key { get; set; } = "";
        [Required] public string DeviceFingerprint { get; set; } = "";
        public string? DeviceLabel { get; set; }
        public string? IdeProduct { get; set; }
    }

    public sealed class ValidateRequest
    {
        [Required] public string Key { get; set; } = "";
        [Required] public string DeviceFingerprint { get; set; } = "";
    }
}
