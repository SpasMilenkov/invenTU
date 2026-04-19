using Microsoft.EntityFrameworkCore.Migrations;

#nullable disable

namespace InvenTU.Infrastructure.Migrations
{
    /// <inheritdoc />
    public partial class AddProductSearchIndexes : Migration
    {
        /// <inheritdoc />
        protected override void Up(MigrationBuilder migrationBuilder)
        {
            migrationBuilder.DropIndex(
                name: "IX_Products_SKU",
                table: "Products");

            migrationBuilder.CreateIndex(
                name: "ix_products_sku_unique",
                table: "Products",
                column: "SKU",
                unique: true);

            migrationBuilder.Sql("CREATE EXTENSION IF NOT EXISTS pg_trgm;");

            migrationBuilder.CreateIndex(
                name: "ix_products_barcode_trgm",
                table: "Products",
                column: "Barcode",
                filter: "\"Barcode\" IS NOT NULL")
                .Annotation("Npgsql:IndexMethod", "GIN")
                .Annotation("Npgsql:IndexOperators", new[] { "gin_trgm_ops" });

            migrationBuilder.CreateIndex(
                name: "ix_products_name_trgm",
                table: "Products",
                column: "Name")
                .Annotation("Npgsql:IndexMethod", "GIN")
                .Annotation("Npgsql:IndexOperators", new[] { "gin_trgm_ops" });

            migrationBuilder.CreateIndex(
                name: "ix_products_sku_trgm",
                table: "Products",
                column: "SKU",
                unique: false)
                .Annotation("Npgsql:IndexMethod", "GIN")
                .Annotation("Npgsql:IndexOperators", new[] { "gin_trgm_ops" });
        }

        /// <inheritdoc />
        protected override void Down(MigrationBuilder migrationBuilder)
        {
            migrationBuilder.DropIndex(
                name: "ix_products_barcode_trgm",
                table: "Products");

            migrationBuilder.DropIndex(
                name: "ix_products_name_trgm",
                table: "Products");

            migrationBuilder.DropIndex(
                name: "ix_products_sku_trgm",
                table: "Products");

            migrationBuilder.CreateIndex(
                name: "IX_Products_SKU",
                table: "Products",
                column: "SKU",
                unique: true);
        }
    }
}
