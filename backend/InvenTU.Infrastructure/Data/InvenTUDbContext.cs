using InvenTU.Core.Entities;
using Microsoft.AspNetCore.Identity;
using Microsoft.AspNetCore.Identity.EntityFrameworkCore;
using Microsoft.EntityFrameworkCore;

namespace InvenTU.Infrastructure.Data;

public sealed class InvenTUDbContext(DbContextOptions<InvenTUDbContext> options) : IdentityDbContext<User, IdentityRole<Guid>, Guid,
                                                                                   IdentityUserClaim<Guid>, IdentityUserRole<Guid>,
                                                                                   IdentityUserLogin<Guid>, IdentityRoleClaim<Guid>,
                                                                                   IdentityUserToken<Guid>>(options)
{
    public DbSet<Product> Products { get; set; } = null!;
    public DbSet<Warehouse> Warehouses { get; set; } = null!;
    public DbSet<Category> Categories { get; set; } = null!;
    public DbSet<StockMovement> StockMovements { get; set; } = null!;

    protected override void OnModelCreating(ModelBuilder builder)
    {
        ArgumentNullException.ThrowIfNull(builder);
        base.OnModelCreating(builder);

        builder.Entity<User>(b => b.ToTable("Users"));
        builder.Entity<IdentityRole<Guid>>(b => b.ToTable("Roles"));
        builder.Entity<IdentityUserRole<Guid>>(b => b.ToTable("UserRoles"));
        builder.Entity<IdentityUserClaim<Guid>>(b => b.ToTable("UserClaims"));
        builder.Entity<IdentityUserLogin<Guid>>(b => b.ToTable("UserLogins"));
        builder.Entity<IdentityRoleClaim<Guid>>(b => b.ToTable("RoleClaims"));
        builder.Entity<IdentityUserToken<Guid>>(b => b.ToTable("UserTokens"));

        builder.Entity<StockMovement>(b =>
        {
            b.HasOne(sm => sm.Warehouse)
             .WithMany()
             .HasForeignKey(sm => sm.WarehouseId)
             .OnDelete(DeleteBehavior.Restrict);

            b.HasOne(sm => sm.DestinationWarehouse)
             .WithMany()
             .HasForeignKey(sm => sm.DestinationWarehouseId)
             .OnDelete(DeleteBehavior.Restrict);

            b.HasOne(sm => sm.User)
             .WithMany()
             .HasForeignKey(sm => sm.UserId)
             .OnDelete(DeleteBehavior.SetNull);
        });
    }
}
