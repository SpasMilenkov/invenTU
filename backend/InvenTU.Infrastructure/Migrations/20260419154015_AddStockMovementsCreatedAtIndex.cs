using Microsoft.EntityFrameworkCore.Migrations;

#nullable disable

namespace InvenTU.Infrastructure.Migrations
{
    /// <inheritdoc />
    public partial class AddStockMovementsCreatedAtIndex : Migration
    {
        /// <inheritdoc />
        protected override void Up(MigrationBuilder migrationBuilder)
        {
            migrationBuilder.CreateIndex(
                name: "ix_stock_movements_created_at",
                table: "StockMovements",
                column: "CreatedAt",
                descending: new bool[0]);
        }

        /// <inheritdoc />
        protected override void Down(MigrationBuilder migrationBuilder)
        {
            migrationBuilder.DropIndex(
                name: "ix_stock_movements_created_at",
                table: "StockMovements");
        }
    }
}
