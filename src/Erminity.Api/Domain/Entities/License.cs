namespace Erminity.Api.Domain.Entities;

public enum LicensePlan
{
    Free = 0,
    Pro = 1,
    Enterprise = 2
}

public enum LicenseStatus
{
    Active = 0,
    PastDue = 1,
    Cancelled = 2,
    Revoked = 3,
    Expired = 4
}

public class License
{
    public Guid Id { get; set; } = Guid.NewGuid();
    public string UserId { get; set; } = string.Empty;
    public ApplicationUser? User { get; set; }
    public LicensePlan Plan { get; set; } = LicensePlan.Pro;
    public LicenseStatus Status { get; set; } = LicenseStatus.Active;
    public string KeyHash { get; set; } = string.Empty;
    public string KeyPrefix { get; set; } = string.Empty;
    public string? PaddleSubscriptionId { get; set; }
    public string BillingInterval { get; set; } = "month";
    public DateTimeOffset? CurrentPeriodEnd { get; set; }
    public DateTimeOffset CreatedAt { get; set; } = DateTimeOffset.UtcNow;
    public DeviceActivation? Device { get; set; }
}

public class DeviceActivation
{
    public Guid Id { get; set; } = Guid.NewGuid();
    public Guid LicenseId { get; set; }
    public License? License { get; set; }
    public string DeviceFingerprintHash { get; set; } = string.Empty;
    public string? DeviceLabel { get; set; }
    public string? IdeProduct { get; set; }
    public DateTimeOffset ActivatedAt { get; set; } = DateTimeOffset.UtcNow;
    public DateTimeOffset? LastSeenAt { get; set; }
}
