using Erminity.Api.Domain.Entities;
using Erminity.Api.Infrastructure.Data;
using Erminity.Api.Infrastructure.Email;
using Erminity.Api.Infrastructure.Security;
using Microsoft.AspNetCore.Identity;
using Microsoft.EntityFrameworkCore;
using OpenIddict.Abstractions;
using static OpenIddict.Abstractions.OpenIddictConstants;

var builder = WebApplication.CreateBuilder(args);

builder.WebHost.ConfigureKestrel(options =>
{
    options.AddServerHeader = false;
});

builder.Services.AddDbContext<AppDbContext>(options =>
{
    var cs = builder.Configuration.GetConnectionString("Default")
             ?? "Host=localhost;Port=5432;Database=erminity;Username=erminity;Password=erminity";
    options.UseNpgsql(cs);
    options.UseOpenIddict();
});

var hasResendKey = !string.IsNullOrWhiteSpace(builder.Configuration["Email:Resend:ApiKey"]);

builder.Services
    .AddIdentity<ApplicationUser, IdentityRole>(options =>
    {
        options.Password.RequiredLength = 10;
        options.Password.RequireDigit = true;
        options.Password.RequireUppercase = true;
        options.Password.RequireNonAlphanumeric = true;
        options.User.RequireUniqueEmail = true;
        // Require confirmed email only when Resend is configured (or force later).
        options.SignIn.RequireConfirmedEmail = hasResendKey && !builder.Environment.IsDevelopment();
    })
    .AddEntityFrameworkStores<AppDbContext>()
    .AddDefaultTokenProviders();

builder.Services.ConfigureApplicationCookie(options =>
{
    options.Cookie.Name = "erminity.auth";
    options.Cookie.HttpOnly = true;
    options.Cookie.SameSite = SameSiteMode.Lax;
    options.Cookie.SecurePolicy = CookieSecurePolicy.SameAsRequest;
    options.SlidingExpiration = true;
    options.ExpireTimeSpan = TimeSpan.FromDays(14);
    options.Events.OnRedirectToLogin = context =>
    {
        context.Response.StatusCode = StatusCodes.Status401Unauthorized;
        return Task.CompletedTask;
    };
    options.Events.OnRedirectToAccessDenied = context =>
    {
        context.Response.StatusCode = StatusCodes.Status403Forbidden;
        return Task.CompletedTask;
    };
});

builder.Services.AddOpenIddict()
    .AddCore(options => options.UseEntityFrameworkCore().UseDbContext<AppDbContext>())
    .AddServer(options =>
    {
        options.SetAuthorizationEndpointUris("/connect/authorize")
            .SetTokenEndpointUris("/connect/token")
            .SetUserInfoEndpointUris("/connect/userinfo")
            .SetEndSessionEndpointUris("/connect/logout");

        options.AllowAuthorizationCodeFlow()
            .RequireProofKeyForCodeExchange()
            .AllowRefreshTokenFlow();

        options.RegisterScopes(Scopes.Email, Scopes.Profile, Scopes.Roles, "api");

        if (builder.Environment.IsDevelopment())
        {
            options.AddDevelopmentEncryptionCertificate()
                .AddDevelopmentSigningCertificate();
        }
        else
        {
            // Replace with persistent certs/keys in real production.
            options.AddEphemeralEncryptionKey()
                .AddEphemeralSigningKey();
        }

        options.DisableAccessTokenEncryption();
        options.UseAspNetCore()
            .EnableAuthorizationEndpointPassthrough()
            .EnableTokenEndpointPassthrough()
            .EnableUserInfoEndpointPassthrough()
            .EnableEndSessionEndpointPassthrough();
    })
    .AddValidation(options =>
    {
        options.UseLocalServer();
        options.UseAspNetCore();
    });

var auth = builder.Services.AddAuthentication();
var googleClientId = builder.Configuration["Auth:Google:ClientId"];
if (!string.IsNullOrWhiteSpace(googleClientId))
{
    auth.AddGoogle(options =>
    {
        options.ClientId = googleClientId;
        options.ClientSecret = builder.Configuration["Auth:Google:ClientSecret"] ?? "";
    });
}

var msClientId = builder.Configuration["Auth:Microsoft:ClientId"];
if (!string.IsNullOrWhiteSpace(msClientId))
{
    auth.AddMicrosoftAccount(options =>
    {
        options.ClientId = msClientId;
        options.ClientSecret = builder.Configuration["Auth:Microsoft:ClientSecret"] ?? "";
    });
}

var githubClientId = builder.Configuration["Auth:GitHub:ClientId"];
if (!string.IsNullOrWhiteSpace(githubClientId))
{
    auth.AddGitHub(options =>
    {
        options.ClientId = githubClientId;
        options.ClientSecret = builder.Configuration["Auth:GitHub:ClientSecret"] ?? "";
    });
}

builder.Services.AddAuthorization();
builder.Services.AddControllers();
builder.Services.AddHttpClient<IEmailSender, ResendEmailSender>();

var corsOrigins = builder.Configuration.GetSection("Cors:Origins").Get<string[]>()
                  ?? ["http://localhost:5173", "http://localhost:3000", "http://localhost:8088"];
builder.Services.AddCors(options =>
{
    options.AddPolicy("Web", policy =>
        policy.WithOrigins(corsOrigins)
            .AllowAnyHeader()
            .AllowAnyMethod()
            .AllowCredentials());
});

builder.Services.Configure<IdentityOptions>(options =>
{
    options.Lockout.MaxFailedAccessAttempts = 8;
    options.Lockout.DefaultLockoutTimeSpan = TimeSpan.FromMinutes(15);
});

var app = builder.Build();

app.UseMiddleware<SecurityHeadersMiddleware>();

if (!app.Environment.IsDevelopment())
{
    app.UseExceptionHandler(err =>
    {
        err.Run(async context =>
        {
            context.Response.StatusCode = StatusCodes.Status500InternalServerError;
            context.Response.ContentType = "application/json";
            await context.Response.WriteAsJsonAsync(new { error = "server_error" });
        });
    });
    app.UseHsts();
}

app.UseCors("Web");
app.UseAuthentication();
app.UseAuthorization();
app.MapControllers();
app.MapGet("/healthz", () => Results.Ok(new { status = "ok" }));

using (var scope = app.Services.CreateScope())
{
    var db = scope.ServiceProvider.GetRequiredService<AppDbContext>();
    var roleManager = scope.ServiceProvider.GetRequiredService<RoleManager<IdentityRole>>();
    var userManager = scope.ServiceProvider.GetRequiredService<UserManager<ApplicationUser>>();
    var appManager = scope.ServiceProvider.GetRequiredService<IOpenIddictApplicationManager>();

    await db.Database.EnsureCreatedAsync();

    foreach (var role in new[] { "User", "Admin" })
    {
        if (!await roleManager.RoleExistsAsync(role))
            await roleManager.CreateAsync(new IdentityRole(role));
    }

    if (await appManager.FindByClientIdAsync("erminity-web") is null)
    {
        await appManager.CreateAsync(new OpenIddictApplicationDescriptor
        {
            ClientId = "erminity-web",
            DisplayName = "Erminity Web",
            ClientType = ClientTypes.Public,
            ConsentType = ConsentTypes.Implicit,
            RedirectUris =
            {
                new Uri("http://localhost:5173/auth/callback"),
                new Uri("https://erminity.com/auth/callback")
            },
            PostLogoutRedirectUris =
            {
                new Uri("http://localhost:5173/"),
                new Uri("https://erminity.com/")
            },
            Permissions =
            {
                Permissions.Endpoints.Authorization,
                Permissions.Endpoints.Token,
                Permissions.Endpoints.EndSession,
                Permissions.GrantTypes.AuthorizationCode,
                Permissions.GrantTypes.RefreshToken,
                Permissions.ResponseTypes.Code,
                Permissions.Scopes.Email,
                Permissions.Scopes.Profile,
                Permissions.Scopes.Roles,
                Permissions.Prefixes.Scope + "api"
            },
            Requirements =
            {
                Requirements.Features.ProofKeyForCodeExchange
            }
        });
    }

    var adminEmail = builder.Configuration["Seed:AdminEmail"] ?? "admin@erminity.com";
    var adminPassword = builder.Configuration["Seed:AdminPassword"] ?? "ChangeMe!Erminity1";
    var admin = await userManager.FindByEmailAsync(adminEmail);
    if (admin is null)
    {
        admin = new ApplicationUser
        {
            UserName = adminEmail,
            Email = adminEmail,
            EmailConfirmed = true,
            DisplayName = "Admin"
        };
        await userManager.CreateAsync(admin, adminPassword);
        await userManager.AddToRoleAsync(admin, "Admin");
        await userManager.AddToRoleAsync(admin, "User");
    }

    Directory.CreateDirectory(Path.Combine(app.Environment.ContentRootPath, "media"));

    if (!await db.CmsPages.AnyAsync(p => p.Slug == "home"))
    {
        var home = new CmsPage
        {
            Id = Guid.NewGuid(),
            Slug = "home",
            IsPublished = true,
            Locales =
            {
                SeedLocale("en", "Home", "EmbeddedFlow for exact embedded UI",
                    "Beyond static design tools — bind UI to code symbols, and soon to MQTT and protocols.",
                    "Get Pro", "Start free"),
                SeedLocale("de", "Startseite", "EmbeddedFlow für präzise UI-Systeme",
                    "Mehr als statische Design-Tools — UI an Code-Symbole binden.",
                    "Pro holen", "Kostenlos starten"),
                SeedLocale("fr", "Accueil", "EmbeddedFlow pour des interfaces exactes",
                    "Au-delà des outils de design statiques — liez l’UI aux symboles du code.",
                    "Passer à Pro", "Commencer gratuitement"),
                SeedLocale("ar", "الرئيسية", "EmbeddedFlow لواجهات مدمجة دقيقة",
                    "أبعد من أدوات التصميم الثابتة — اربط الواجهة برموز الشيفرة.",
                    "الحصول على Pro", "ابدأ مجاناً"),
                SeedLocale("fa", "خانه", "EmbeddedFlow برای رابط کاربری دقیق embedded",
                    "فراتر از ابزارهای طراحی ایستا — اتصال UI به سیمبل‌های کد.",
                    "دریافت Pro", "شروع رایگان"),
            }
        };
        db.CmsPages.Add(home);
        await db.SaveChangesAsync();
    }
    else
    {
        var home = await db.CmsPages.Include(p => p.Locales).FirstAsync(p => p.Slug == "home");
        if (!home.Locales.Any(l => l.Locale == "fa"))
        {
            home.Locales.Add(SeedLocale("fa", "خانه", "EmbeddedFlow برای رابط کاربری دقیق embedded",
                "فراتر از ابزارهای طراحی ایستا — اتصال UI به سیمبل‌های کد.",
                "دریافت Pro", "شروع رایگان"));
            home.UpdatedAt = DateTimeOffset.UtcNow;
            await db.SaveChangesAsync();
        }
    }
}

app.Run();

static CmsPageLocale SeedLocale(string locale, string title, string headline, string lead, string ctaPro, string ctaFree) =>
    new()
    {
        Id = Guid.NewGuid(),
        Locale = locale,
        Title = title,
        MetaDescription = lead,
        Robots = "index,follow",
        Sections =
        {
            new CmsSection
            {
                Id = Guid.NewGuid(),
                Key = "hero",
                SortOrder = 0,
                Blocks =
                {
                    new CmsBlock { Id = Guid.NewGuid(), Type = "text", Text = headline, SortOrder = 0 },
                    new CmsBlock { Id = Guid.NewGuid(), Type = "text", Text = lead, SortOrder = 1 },
                    new CmsBlock { Id = Guid.NewGuid(), Type = "cta", CtaLabel = ctaPro, CtaHref = "/pricing", SortOrder = 2 },
                    new CmsBlock { Id = Guid.NewGuid(), Type = "cta", CtaLabel = ctaFree, CtaHref = "/download", SortOrder = 3 },
                }
            }
        }
    };
