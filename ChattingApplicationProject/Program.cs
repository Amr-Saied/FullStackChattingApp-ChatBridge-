using System.Text;
using ChattingApplicationProject;
using ChattingApplicationProject.Data;
using ChattingApplicationProject.Helpers;
using ChattingApplicationProject.Hubs;
using ChattingApplicationProject.Interfaces;
using ChattingApplicationProject.Middlwares;
using ChattingApplicationProject.Models;
using ChattingApplicationProject.Services;
using Microsoft.AspNetCore.Authentication.JwtBearer;
using Microsoft.AspNetCore.SignalR;
using Microsoft.EntityFrameworkCore;
using Microsoft.IdentityModel.Tokens;

var builder = WebApplication.CreateBuilder(args);

// Add services to the container.

builder
    .Services.AddControllers(options =>
    {
        // Add global action filter for all controllers
        options.Filters.Add<LogUserActivityFilter>();
    })
    .AddJsonOptions(options =>
    {
        options.JsonSerializerOptions.DefaultIgnoreCondition = System
            .Text
            .Json
            .Serialization
            .JsonIgnoreCondition
            .WhenWritingNull;
    });

builder.Services.AddEndpointsApiExplorer();
builder.Services.AddSwaggerGen(c =>
{
    c.AddSecurityDefinition(
        "Bearer",
        new Microsoft.OpenApi.Models.OpenApiSecurityScheme
        {
            Type = Microsoft.OpenApi.Models.SecuritySchemeType.Http,
            Scheme = "Bearer",
            BearerFormat = "JWT"
        }
    );

    c.AddSecurityRequirement(
        new Microsoft.OpenApi.Models.OpenApiSecurityRequirement
        {
            {
                new Microsoft.OpenApi.Models.OpenApiSecurityScheme
                {
                    Reference = new Microsoft.OpenApi.Models.OpenApiReference
                    {
                        Type = Microsoft.OpenApi.Models.ReferenceType.SecurityScheme,
                        Id = "Bearer"
                    }
                },
                new string[] { }
            }
        }
    );
});
builder.Services.AddScoped<IUserService, UserService>();
builder.Services.AddScoped<ITokenService, TokenService>();
builder.Services.AddScoped<IPhotoService, PhotoService>();
builder.Services.AddScoped<IVoiceService, VoiceService>();
builder.Services.AddScoped<ILikeService, LikesService>();
builder.Services.AddScoped<IMessageService, MessageService>();
builder.Services.AddScoped<IAdminService, AdminService>();
builder.Services.AddScoped<IEmailService, EmailService>();
builder.Services.AddScoped<IUserCleanupService, UserCleanupService>();

builder.Services.AddScoped<ISessionService, SessionService>();

// Add Background Cleanup Service
builder.Services.AddHostedService<UserCleanupService>();

// Add SignalR
builder.Services.AddSignalR();
builder.Services.AddAutoMapper(
    typeof(ChattingApplicationProject.Helpers.AutoMapperProfiles).Assembly
);

builder
    .Services.AddAuthentication(JwtBearerDefaults.AuthenticationScheme)
    .AddJwtBearer(options =>
    {
        var tokenKey =
            builder.Configuration["TokenKey"]
            ?? throw new InvalidOperationException("TokenKey not found in configuration");
        options.TokenValidationParameters = new TokenValidationParameters
        {
            ValidateIssuerSigningKey = true,
            IssuerSigningKey = new SymmetricSecurityKey(Encoding.UTF8.GetBytes(tokenKey)),
            ValidateIssuer = false,
            ValidateAudience = false
        };

        // Configure SignalR to use JWT authentication
        options.Events = new JwtBearerEvents
        {
            OnMessageReceived = context =>
            {
                var accessToken = context.Request.Query["access_token"];
                var path = context.HttpContext.Request.Path;
                if (!string.IsNullOrEmpty(accessToken) && path.StartsWithSegments("/messagehub"))
                {
                    context.Token = accessToken;
                }
                return Task.CompletedTask;
            }
        };
    });

// Add CORS
var frontendUrl = builder.Configuration["FrontendUrl"] ?? "https://angular-chatting-app-front-end.vercel.app";
var frontendUrlHttps = frontendUrl.Replace("http://", "https://");

builder.Services.AddCors(options =>
{
    options.AddPolicy(
        "DevelopmentCorsPolicy",
        builder =>
        {
            builder
                .WithOrigins(frontendUrl, frontendUrlHttps) // Angular app domains
                .AllowAnyHeader()
                .AllowAnyMethod()
                .AllowCredentials(); // Required for SignalR
        }
    );
});

builder.Services.AddDbContext<DataContext>(options =>
    options.UseSqlServer(builder.Configuration.GetConnectionString("DefaultConnection"))
);

// Add Authorization
builder.Services.AddAuthorization();

builder.Services.Configure<CloudinaryOptions>(
    builder.Configuration.GetSection("CloudinarySettings")
);

builder.Services.Configure<GoogleSettings>(builder.Configuration.GetSection("GoogleSettings"));

var app = builder.Build();

// // Seed data
// using (var scope = app.Services.CreateScope())
// {
//     var context = scope.ServiceProvider.GetRequiredService<DataContext>();
//     await Seeder.SeedUsers(context);
// }

// Enable CORS
app.UseCors("DevelopmentCorsPolicy");

app.UseSwagger();
app.UseSwaggerUI();

// Add Exception Handling Middleware
app.UseMiddleware<ExceptionHandlingMiddlware>();

app.UseWebSockets();

// Map SignalR Hub
app.MapHub<MessageHub>("/messagehub");

app.UseHttpsRedirection();

// Serve static files from wwwroot
app.UseStaticFiles();

app.UseAuthorization();

app.Use(
    async (context, next) =>
    {
        if (context.Request.Path == "/ws")
        {
            if (context.WebSockets.IsWebSocketRequest)
            {
                var webSocket = await context.WebSockets.AcceptWebSocketAsync();
                // You can now handle the WebSocket connection here
                // For now, just close it immediately
                await webSocket.CloseAsync(
                    System.Net.WebSockets.WebSocketCloseStatus.NormalClosure,
                    "Closing",
                    System.Threading.CancellationToken.None
                );
            }
            else
            {
                context.Response.StatusCode = 400;
            }
        }
        else
        {
            await next();
        }
    }
);

app.MapControllers();

app.Run();
