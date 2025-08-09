using System;
using System.Collections.Generic;
using System.Linq;
using System.Threading.Tasks;
using ChattingApplicationProject.Models;
using Microsoft.EntityFrameworkCore;

namespace ChattingApplicationProject.Data
{
    public class DataContext : DbContext
    {
        public DataContext(DbContextOptions<DataContext> options)
            : base(options) { }

        public DbSet<AppUser> Users { get; set; }
        public DbSet<Photo> Photos { get; set; }
        public DbSet<UserLike> UserLikes { get; set; }
        public DbSet<Message> Messages { get; set; }
        public DbSet<UserSession> UserSessions { get; set; }

        protected override void OnModelCreating(ModelBuilder modelBuilder)
        {
            modelBuilder.Entity<AppUser>().HasKey(u => u.Id);
            modelBuilder.Entity<AppUser>().Property(u => u.UserName).IsRequired().HasMaxLength(255);
            modelBuilder.Entity<AppUser>().Property(u => u.Role).IsRequired().HasMaxLength(255);

            modelBuilder.Entity<Photo>().HasKey(p => p.Id);
            modelBuilder.Entity<Photo>().Property(p => p.Url).IsRequired();
            modelBuilder.Entity<Photo>().Property(p => p.IsMain).IsRequired();
            modelBuilder
                .Entity<Photo>()
                .HasOne(p => p.AppUser)
                .WithMany(u => u.Photos)
                .HasForeignKey(p => p.AppUserId);

            // UserLike Configuration - Fixed to prevent multiple cascade paths
            modelBuilder.Entity<UserLike>().HasKey(k => new { k.SourceUserId, k.LikedUserId });
            modelBuilder
                .Entity<UserLike>()
                .HasOne(s => s.SourceUser)
                .WithMany(l => l.LikedUsers)
                .HasForeignKey(s => s.SourceUserId)
                .OnDelete(DeleteBehavior.Cascade);
            modelBuilder
                .Entity<UserLike>()
                .HasOne(s => s.LikedUser)
                .WithMany(l => l.LikedByUsers)
                .HasForeignKey(s => s.LikedUserId)
                .OnDelete(DeleteBehavior.NoAction);

            // Message Configuration
            modelBuilder.Entity<Message>().HasKey(k => k.Id);

            modelBuilder
                .Entity<Message>()
                .HasOne(s => s.Sender)
                .WithMany(m => m.MessagesSent)
                .HasForeignKey(s => s.SenderId)
                .OnDelete(DeleteBehavior.Restrict);

            modelBuilder
                .Entity<Message>()
                .HasOne(r => r.Recipient)
                .WithMany(m => m.MessagesReceived)
                .HasForeignKey(r => r.RecipientId)
                .OnDelete(DeleteBehavior.Restrict);

            // UserSession Configuration
            modelBuilder.Entity<UserSession>().HasKey(s => s.Id);
            modelBuilder
                .Entity<UserSession>()
                .Property(s => s.SessionToken)
                .IsRequired()
                .HasMaxLength(1000);
            modelBuilder
                .Entity<UserSession>()
                .Property(s => s.RefreshToken)
                .IsRequired()
                .HasMaxLength(1000);
            modelBuilder
                .Entity<UserSession>()
                .Property(s => s.DeviceInfo)
                .IsRequired()
                .HasMaxLength(500);
            modelBuilder
                .Entity<UserSession>()
                .Property(s => s.IpAddress)
                .IsRequired()
                .HasMaxLength(45);

            modelBuilder
                .Entity<UserSession>()
                .HasOne(s => s.User)
                .WithMany()
                .HasForeignKey(s => s.UserId)
                .OnDelete(DeleteBehavior.Cascade);
        }
    }
}
