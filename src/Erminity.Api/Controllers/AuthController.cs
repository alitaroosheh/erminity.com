using System.ComponentModel.DataAnnotations;
using System.Security.Claims;
using Erminity.Api.Domain.Entities;
using Microsoft.AspNetCore.Authorization;
using Microsoft.AspNetCore.Identity;
using Microsoft.AspNetCore.Mvc;

namespace Erminity.Api.Controllers;

[ApiController]
[Route("api/auth")]
public class AuthController : ControllerBase
{
    private readonly UserManager<ApplicationUser> _users;
    private readonly SignInManager<ApplicationUser> _signIn;
    private readonly IConfiguration _config;
    private readonly IHostEnvironment _env;

    public AuthController(
        UserManager<ApplicationUser> users,
        SignInManager<ApplicationUser> signIn,
        IConfiguration config,
        IHostEnvironment env)
    {
        _users = users;
        _signIn = signIn;
        _config = config;
        _env = env;
    }

    [HttpPost("register")]
    [AllowAnonymous]
    public async Task<IActionResult> Register([FromBody] RegisterRequest req)
    {
        if (!ModelState.IsValid) return ValidationProblem(ModelState);

        var existing = await _users.FindByEmailAsync(req.Email.Trim());
        if (existing is not null)
            return Conflict(new { error = "email_taken" });

        var user = new ApplicationUser
        {
            UserName = req.Email.Trim(),
            Email = req.Email.Trim(),
            DisplayName = string.IsNullOrWhiteSpace(req.DisplayName) ? req.Email.Trim() : req.DisplayName.Trim(),
            EmailConfirmed = CanAutoConfirmEmail()
        };

        var result = await _users.CreateAsync(user, req.Password);
        if (!result.Succeeded)
            return BadRequest(new { error = "registration_failed", details = result.Errors.Select(e => e.Code) });

        await _users.AddToRoleAsync(user, "User");
        await _signIn.SignInAsync(user, isPersistent: true);
        return Ok(await ToUserDto(user));
    }

    [HttpPost("login")]
    [AllowAnonymous]
    public async Task<IActionResult> Login([FromBody] LoginRequest req)
    {
        if (!ModelState.IsValid) return ValidationProblem(ModelState);

        var user = await _users.FindByEmailAsync(req.Email.Trim());
        if (user is null || user.IsDisabled)
            return Unauthorized(new { error = "invalid_credentials" });

        var result = await _signIn.PasswordSignInAsync(user, req.Password, isPersistent: true, lockoutOnFailure: true);
        if (result.IsLockedOut)
            return StatusCode(StatusCodes.Status429TooManyRequests, new { error = "locked_out" });
        if (result.IsNotAllowed)
            return Unauthorized(new { error = "email_not_confirmed" });
        if (!result.Succeeded)
            return Unauthorized(new { error = "invalid_credentials" });

        return Ok(await ToUserDto(user));
    }

    [HttpPost("logout")]
    [Authorize]
    public async Task<IActionResult> Logout()
    {
        await _signIn.SignOutAsync();
        return Ok(new { ok = true });
    }

    [HttpGet("me")]
    [Authorize]
    public async Task<IActionResult> Me()
    {
        var user = await _users.GetUserAsync(User);
        if (user is null) return Unauthorized();
        return Ok(await ToUserDto(user));
    }

    private bool CanAutoConfirmEmail()
    {
        var hasResend = !string.IsNullOrWhiteSpace(_config["Email:Resend:ApiKey"]);
        return _env.IsDevelopment() || !hasResend;
    }

    private async Task<object> ToUserDto(ApplicationUser user)
    {
        var roles = await _users.GetRolesAsync(user);
        return new
        {
            id = user.Id,
            email = user.Email,
            displayName = user.DisplayName,
            roles,
            emailConfirmed = user.EmailConfirmed
        };
    }

    public sealed class RegisterRequest
    {
        [Required, EmailAddress, MaxLength(256)]
        public string Email { get; set; } = "";

        [Required, MinLength(10), MaxLength(128)]
        public string Password { get; set; } = "";

        [MaxLength(128)]
        public string? DisplayName { get; set; }
    }

    public sealed class LoginRequest
    {
        [Required, EmailAddress]
        public string Email { get; set; } = "";

        [Required]
        public string Password { get; set; } = "";
    }
}
