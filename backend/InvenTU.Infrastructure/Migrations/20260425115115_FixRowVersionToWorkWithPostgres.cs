using Microsoft.EntityFrameworkCore.Migrations;

#nullable disable

namespace InvenTU.Infrastructure.Migrations
{
    /// <inheritdoc />
    public partial class FixRowVersionToWorkWithPostgres : Migration
    {
        /// <inheritdoc />
        protected override void Up(MigrationBuilder migrationBuilder)
        {
            migrationBuilder.DropColumn(
                name: "RowVersion",
                table: "StockItems");
        }

        /// <inheritdoc />
        protected override void Down(MigrationBuilder migrationBuilder)
        {
            migrationBuilder.AddColumn<byte[]>(
                name: "RowVersion",
                table: "StockItems",
                type: "bytea",
                rowVersion: true,
                nullable: false,
                defaultValue: new byte[0]);

        }
    }
}
