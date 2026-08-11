using Erminity.Api.Domain.Entities;
using Microsoft.AspNetCore.Identity.EntityFrameworkCore;
using Microsoft.EntityFrameworkCore;

namespace Erminity.Api.Infrastructure.Data;

public class AppDbContext : IdentityDbContext<ApplicationUser>
{
    public AppDbContext(DbContextOptions<AppDbContext> options) : base(options)
    {
    }

    public DbSet<License> Licenses => Set<License>();
    public DbSet<DeviceActivation> DeviceActivations => Set<DeviceActivation>();
    public DbSet<SiteSettings> SiteSettings => Set<SiteSettings>();
    public DbSet<PricingConfig> PricingConfigs => Set<PricingConfig>();
    public DbSet<MediaAsset> MediaAssets => Set<MediaAsset>();
    public DbSet<CmsPage> CmsPages => Set<CmsPage>();
    public DbSet<CmsPageLocale> CmsPageLocales => Set<CmsPageLocale>();
    public DbSet<CmsSection> CmsSections => Set<CmsSection>();
    public DbSet<CmsBlock> CmsBlocks => Set<CmsBlock>();
    public DbSet<ContactRequest> ContactRequests => Set<ContactRequest>();
    public DbSet<ConsentRecord> ConsentRecords => Set<ConsentRecord>();
    public DbSet<AuditLogEntry> AuditLogs => Set<AuditLogEntry>();

    protected override void OnModelCreating(ModelBuilder builder)
    {
        base.OnModelCreating(builder);

        builder.Entity<License>(e =>
        {
            e.HasIndex(x => x.KeyHash).IsUnique();
            e.HasIndex(x => x.KeyPrefix);
            e.HasIndex(x => x.PaddleSubscriptionId);
            e.HasOne(x => x.User).WithMany(u => u.Licenses).HasForeignKey(x => x.UserId);
            e.HasOne(x => x.Device).WithOne(d => d.License).HasForeignKey<DeviceActivation>(d => d.LicenseId);
        });

        builder.Entity<CmsPage>(e =>
        {
            e.HasIndex(x => x.Slug).IsUnique();
            e.HasMany(x => x.Locales).WithOne(l => l.Page!).HasForeignKey(l => l.PageId);
        });

        builder.Entity<CmsPageLocale>(e =>
        {
            e.HasIndex(x => new { x.PageId, x.Locale }).IsUnique();
            e.HasMany(x => x.Sections).WithOne(s => s.PageLocale!).HasForeignKey(s => s.PageLocaleId);
        });

        builder.Entity<CmsSection>(e =>
        {
            e.HasMany(x => x.Blocks).WithOne(b => b.Section!).HasForeignKey(b => b.SectionId);
        });

        builder.Entity<MediaAsset>(e =>
        {
            e.Property(x => x.AltText).IsRequired();
        });

        builder.Entity<SiteSettings>().HasData(new SiteSettings
        {
            Id = Guid.Parse("11111111-1111-1111-1111-111111111111"),
            SiteName = "Erminity",
            Slogan = "Ermine Community",
            LegalNamePlaceholder = "Configure in Admin",
            LegalAddressPlaceholder = "Configure in Admin",
            PrivacyEmailPlaceholder = "privacy@erminity.com",
            JurisdictionPlaceholder = "Configure in Admin"
        });

        builder.Entity<PricingConfig>().HasData(new PricingConfig
        {
            Id = Guid.Parse("22222222-2222-2222-2222-222222222222"),
            Currency = "USD",
            ShowComingSoonWhenEmpty = true
        });
    }
}
