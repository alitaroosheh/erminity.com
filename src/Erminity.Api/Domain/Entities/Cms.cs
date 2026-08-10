namespace Erminity.Api.Domain.Entities;

public class SiteSettings
{
    public Guid Id { get; set; } = Guid.NewGuid();
    public string SiteName { get; set; } = "Erminity";
    public string Slogan { get; set; } = "Ermine Community";
    public string? FaviconMediaId { get; set; }
    public string? LogoMediaId { get; set; }
    public string? DefaultOgImageMediaId { get; set; }
    public string LegalNamePlaceholder { get; set; } = "Configure in Admin";
    public string LegalAddressPlaceholder { get; set; } = "Configure in Admin";
    public string PrivacyEmailPlaceholder { get; set; } = "privacy@erminity.com";
    public string JurisdictionPlaceholder { get; set; } = "Configure in Admin";
    public string? LegalName { get; set; }
    public string? LegalAddress { get; set; }
    public string? PrivacyEmail { get; set; }
    public string? Jurisdiction { get; set; }
    public DateTimeOffset UpdatedAt { get; set; } = DateTimeOffset.UtcNow;
}

public class PricingConfig
{
    public Guid Id { get; set; } = Guid.NewGuid();
    public string Currency { get; set; } = "USD";
    public decimal? ProMonthlyPrice { get; set; }
    public decimal? ProYearlyPrice { get; set; }
    public string? PaddlePriceIdMonthly { get; set; }
    public string? PaddlePriceIdYearly { get; set; }
    public bool ShowComingSoonWhenEmpty { get; set; } = true;
    public DateTimeOffset UpdatedAt { get; set; } = DateTimeOffset.UtcNow;
}

public class MediaAsset
{
    public Guid Id { get; set; } = Guid.NewGuid();
    public string FileName { get; set; } = string.Empty;
    public string ContentType { get; set; } = string.Empty;
    public string StoragePath { get; set; } = string.Empty;
    public string AltText { get; set; } = string.Empty;
    public string? Title { get; set; }
    public string? Caption { get; set; }
    public long SizeBytes { get; set; }
    public DateTimeOffset CreatedAt { get; set; } = DateTimeOffset.UtcNow;
}

public class CmsPage
{
    public Guid Id { get; set; } = Guid.NewGuid();
    public string Slug { get; set; } = string.Empty;
    public bool IsPublished { get; set; }
    public DateTimeOffset UpdatedAt { get; set; } = DateTimeOffset.UtcNow;
    public ICollection<CmsPageLocale> Locales { get; set; } = new List<CmsPageLocale>();
}

public class CmsPageLocale
{
    public Guid Id { get; set; } = Guid.NewGuid();
    public Guid PageId { get; set; }
    public CmsPage? Page { get; set; }
    public string Locale { get; set; } = "en";
    public string Title { get; set; } = string.Empty;
    public string? MetaDescription { get; set; }
    public string? CanonicalPath { get; set; }
    public string Robots { get; set; } = "index,follow";
    public string? OgTitle { get; set; }
    public string? OgDescription { get; set; }
    public Guid? OgImageMediaId { get; set; }
    public string? JsonLdExtra { get; set; }
    public ICollection<CmsSection> Sections { get; set; } = new List<CmsSection>();
}

public class CmsSection
{
    public Guid Id { get; set; } = Guid.NewGuid();
    public Guid PageLocaleId { get; set; }
    public CmsPageLocale? PageLocale { get; set; }
    public string Key { get; set; } = string.Empty;
    public int SortOrder { get; set; }
    public ICollection<CmsBlock> Blocks { get; set; } = new List<CmsBlock>();
}

public class CmsBlock
{
    public Guid Id { get; set; } = Guid.NewGuid();
    public Guid SectionId { get; set; }
    public CmsSection? Section { get; set; }
    public string Type { get; set; } = "text";
    public string? Text { get; set; }
    public Guid? MediaId { get; set; }
    public MediaAsset? Media { get; set; }
    public string? CtaLabel { get; set; }
    public string? CtaHref { get; set; }
    public int SortOrder { get; set; }
}

public class ContactRequest
{
    public Guid Id { get; set; } = Guid.NewGuid();
    public string Name { get; set; } = string.Empty;
    public string Email { get; set; } = string.Empty;
    public string Company { get; set; } = string.Empty;
    public string Message { get; set; } = string.Empty;
    public string Locale { get; set; } = "en";
    public bool IsEnterpriseInquiry { get; set; } = true;
    public DateTimeOffset CreatedAt { get; set; } = DateTimeOffset.UtcNow;
    public bool IsHandled { get; set; }
}

public class ConsentRecord
{
    public Guid Id { get; set; } = Guid.NewGuid();
    public string? UserId { get; set; }
    public ApplicationUser? User { get; set; }
    public string AnonymousId { get; set; } = string.Empty;
    public string Locale { get; set; } = "en";
    public string PolicyVersion { get; set; } = "1";
    public bool Necessary { get; set; } = true;
    public bool Preferences { get; set; }
    public bool Analytics { get; set; }
    public bool Marketing { get; set; }
    public DateTimeOffset CreatedAt { get; set; } = DateTimeOffset.UtcNow;
}

public class AuditLogEntry
{
    public Guid Id { get; set; } = Guid.NewGuid();
    public string? ActorUserId { get; set; }
    public string Action { get; set; } = string.Empty;
    public string EntityType { get; set; } = string.Empty;
    public string? EntityId { get; set; }
    public string? Detail { get; set; }
    public string? IpAddress { get; set; }
    public DateTimeOffset CreatedAt { get; set; } = DateTimeOffset.UtcNow;
}
