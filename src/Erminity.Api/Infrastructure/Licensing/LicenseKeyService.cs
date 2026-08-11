using System.Security.Cryptography;
using System.Text;
using System.Text.Json;
using Erminity.Api.Domain.Entities;
using Microsoft.AspNetCore.DataProtection;

namespace Erminity.Api.Infrastructure.Licensing;

public sealed class LicenseKeyService
{
    private readonly IDataProtector _protector;
    private readonly byte[] _signingKey;

    public LicenseKeyService(IDataProtectionProvider dataProtection, IConfiguration config)
    {
        _protector = dataProtection.CreateProtector("Erminity.LicenseKeys.v1");
        var raw = config["License:SigningKey"] ?? "dev-only-change-me-erminity-license-signing-key";
        _signingKey = SHA256.HashData(Encoding.UTF8.GetBytes(raw));
    }

    public (string rawKey, string prefix, string hash, string protectedKey) Issue(LicensePlan plan)
    {
        var planCode = plan switch
        {
            LicensePlan.Enterprise => "ENT",
            LicensePlan.Pro => "PRO",
            _ => "FREE"
        };

        var body = Convert.ToHexString(RandomNumberGenerator.GetBytes(10));
        var rawKey = $"ERM-{planCode}-{body[..5]}-{body[5..10]}-{body[10..]}";
        var prefix = rawKey[..Math.Min(12, rawKey.Length)];
        return (rawKey, prefix, Hash(rawKey), _protector.Protect(rawKey));
    }

    public string? Reveal(string protectedKey)
    {
        try { return _protector.Unprotect(protectedKey); }
        catch { return null; }
    }

    public static string Hash(string rawKey)
    {
        var bytes = SHA256.HashData(Encoding.UTF8.GetBytes(rawKey.Trim().ToUpperInvariant()));
        return Convert.ToHexString(bytes);
    }

    public string CreateOfflineToken(License license, TimeSpan validity)
    {
        var payload = new OfflineTokenPayload(
            license.Id,
            license.Plan.ToString(),
            license.Status.ToString(),
            DateTimeOffset.UtcNow.Add(validity),
            FeaturesFor(license.Plan));
        var json = JsonSerializer.Serialize(payload);
        var data = Encoding.UTF8.GetBytes(json);
        var sig = HMACSHA256.HashData(_signingKey, data);
        return $"{Base64Url(data)}.{Base64Url(sig)}";
    }

    public bool TryValidateOfflineToken(string token, out OfflineTokenPayload? payload)
    {
        payload = null;
        var parts = token.Split('.', 2);
        if (parts.Length != 2) return false;
        try
        {
            var data = Base64UrlDecode(parts[0]);
            var sig = Base64UrlDecode(parts[1]);
            var expected = HMACSHA256.HashData(_signingKey, data);
            if (!CryptographicOperations.FixedTimeEquals(sig, expected)) return false;
            payload = JsonSerializer.Deserialize<OfflineTokenPayload>(data);
            return payload is not null && payload.Exp > DateTimeOffset.UtcNow;
        }
        catch
        {
            return false;
        }
    }

    public static string[] FeaturesFor(LicensePlan plan) => plan switch
    {
        LicensePlan.Pro or LicensePlan.Enterprise => ["code_symbol_binding", "mqtt_protocol_binding"],
        _ => []
    };

    private static string Base64Url(byte[] bytes) =>
        Convert.ToBase64String(bytes).TrimEnd('=').Replace('+', '-').Replace('/', '_');

    private static byte[] Base64UrlDecode(string input)
    {
        var s = input.Replace('-', '+').Replace('_', '/');
        switch (s.Length % 4)
        {
            case 2: s += "=="; break;
            case 3: s += "="; break;
        }
        return Convert.FromBase64String(s);
    }
}

public sealed record OfflineTokenPayload(
    Guid LicenseId,
    string Plan,
    string Status,
    DateTimeOffset Exp,
    string[] Features);
