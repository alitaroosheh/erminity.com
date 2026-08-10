using Microsoft.AspNetCore.Identity;

namespace Erminity.Api.Domain.Entities;

public class ApplicationUser : IdentityUser
{
    public string? DisplayName { get; set; }
    public DateTimeOffset CreatedAt { get; set; } = DateTimeOffset.UtcNow;
    public bool IsDisabled { get; set; }
    public ICollection<License> Licenses { get; set; } = new List<License>();
    public ICollection<ConsentRecord> Consents { get; set; } = new List<ConsentRecord>();
}
