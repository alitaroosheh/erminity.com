namespace Erminity.Api.Infrastructure.Email;

public interface IEmailSender
{
    Task SendAsync(string to, string subject, string htmlBody, CancellationToken ct = default);
}

public sealed class ResendEmailSender : IEmailSender
{
    private readonly IConfiguration _config;
    private readonly ILogger<ResendEmailSender> _logger;
    private readonly HttpClient _http;

    public ResendEmailSender(IConfiguration config, ILogger<ResendEmailSender> logger, HttpClient http)
    {
        _config = config;
        _logger = logger;
        _http = http;
    }

    public async Task SendAsync(string to, string subject, string htmlBody, CancellationToken ct = default)
    {
        var apiKey = _config["Email:Resend:ApiKey"];
        var from = _config["Email:Resend:From"] ?? "Erminity <noreply@erminity.com>";

        if (string.IsNullOrWhiteSpace(apiKey))
        {
            _logger.LogWarning("Resend API key missing; email to {To} with subject {Subject} skipped.", to, subject);
            return;
        }

        using var req = new HttpRequestMessage(HttpMethod.Post, "https://api.resend.com/emails");
        req.Headers.Authorization = new System.Net.Http.Headers.AuthenticationHeaderValue("Bearer", apiKey);
        req.Content = JsonContent.Create(new { from, to = new[] { to }, subject, html = htmlBody });
        var res = await _http.SendAsync(req, ct);
        if (!res.IsSuccessStatusCode)
        {
            var body = await res.Content.ReadAsStringAsync(ct);
            _logger.LogError("Resend failed ({Status}): {Body}", res.StatusCode, body);
            throw new InvalidOperationException("Email delivery failed.");
        }
    }
}
