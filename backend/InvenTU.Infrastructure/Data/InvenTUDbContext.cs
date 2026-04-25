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
    public DbSet<RefreshToken> RefreshTokens { get; set; }
    public DbSet<Category> Categories { get; set; }
    public DbSet<Product> Products { get; set; }
    public DbSet<Warehouse> Warehouses { get; set; }
    public DbSet<StockLocation> StockLocations { get; set; }
    public DbSet<StockItem> StockItems { get; set; }
    public DbSet<StockMovement> StockMovements { get; set; }
    public DbSet<Alert> Alerts { get; set; }
    public DbSet<AlertUserState> AlertUserStates { get; set; }
    public DbSet<Supplier> Suppliers { get; set; }
    public DbSet<ProductSupplier> ProductSuppliers { get; set; }
    public DbSet<PurchaseOrder> PurchaseOrders { get; set; }
    public DbSet<PurchaseOrderLine> PurchaseOrderLines { get; set; }

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

        builder.Entity<ProductSupplier>()
            .HasKey(ps => new { ps.ProductId, ps.SupplierId });

        builder.Entity<AlertUserState>()
            .HasKey(aus => new { aus.AlertId, aus.UserId });

        builder.Entity<Product>().HasIndex(p => p.SKU).IsUnique();

        builder.Entity<Product>()
            .Property(p => p.CreatedAt)
            .HasDefaultValueSql("NOW()");

        builder.Entity<Product>().HasIndex(p => p.DeletedAt);

        builder.Entity<Product>()
            .HasIndex(p => p.Name)
            .HasDatabaseName("ix_products_name_trgm")
            .HasMethod("GIN")
            .HasOperators("gin_trgm_ops");

        builder.Entity<Product>()
            .HasIndex(p => p.SKU)
            .IsUnique()
            .HasDatabaseName("ix_products_sku_unique");

        builder.Entity<Product>()
            .HasIndex(p => p.SKU)
            .HasDatabaseName("ix_products_sku_trgm")
            .HasMethod("GIN")
            .HasOperators("gin_trgm_ops");

        builder.Entity<StockMovement>()
            .HasIndex(sm => sm.CreatedAt)
            .IsDescending()
            .HasDatabaseName("ix_stock_movements_created_at");

        builder.Entity<Product>()
            .HasIndex(p => p.Barcode)
            .HasDatabaseName("ix_products_barcode_trgm")
            .HasMethod("GIN")
            .HasOperators("gin_trgm_ops")
            .HasFilter("\"Barcode\" IS NOT NULL");

        builder.Entity<Warehouse>().HasIndex(w => w.Code).IsUnique();

        builder.Entity<StockItem>().Property(s => s.RowVersion).IsRowVersion();
        
        builder.Entity<StockItem>()
            .Property(p => p.RowVersion)
            .IsRowVersion()
            .HasColumnName("xmin")
            .HasColumnType("xid");
        builder.Entity<StockMovement>(entity =>
        {
            entity.HasOne(sm => sm.SourceWarehouse)
                .WithMany(w => w.SourceMovements)
                .HasForeignKey(sm => sm.SourceWarehouseId)
                .OnDelete(DeleteBehavior.Restrict);

            entity.HasOne(sm => sm.DestinationWarehouse)
                .WithMany(w => w.DestinationMovements)
                .HasForeignKey(sm => sm.DestinationWarehouseId)
                .OnDelete(DeleteBehavior.Restrict);

            entity.HasOne(sm => sm.User)
                .WithMany(u => u.CreatedStockMovements)
                .HasForeignKey(sm => sm.UserId)
                .OnDelete(DeleteBehavior.Restrict);
        });

        builder.Entity<PurchaseOrder>()
            .HasOne(po => po.CreatedByUser)
            .WithMany(u => u.CreatedPurchaseOrders)
            .HasForeignKey(po => po.CreatedByUserId)
            .OnDelete(DeleteBehavior.Restrict);

        builder.Entity<Category>()
            .HasOne(c => c.ParentCategory)
            .WithMany(c => c.SubCategories)
            .HasForeignKey(c => c.ParentCategoryId)
            .OnDelete(DeleteBehavior.Restrict);

        builder.Entity<StockMovement>().Property(sm => sm.MovementType).HasConversion<string>();
        builder.Entity<StockMovement>().Property(sm => sm.Status).HasConversion<string>();
        builder.Entity<Alert>().Property(a => a.AlertType).HasConversion<string>();
        builder.Entity<PurchaseOrder>().Property(po => po.Status).HasConversion<string>();
    }
}
