using System;
using Microsoft.EntityFrameworkCore.Migrations;

#nullable disable

namespace InvenTU.Infrastructure.Migrations
{
    /// <inheritdoc />
    public partial class AddStockAdjustmentFields : Migration
    {
        /// <inheritdoc />
        protected override void Up(MigrationBuilder migrationBuilder)
        {
            migrationBuilder.AddColumn<decimal>(
                name: "CountedQuantity",
                table: "StockMovements",
                type: "numeric",
                nullable: true);

            migrationBuilder.AddColumn<DateTime>(
                name: "ReviewedAt",
                table: "StockMovements",
                type: "timestamp with time zone",
                nullable: true);

            migrationBuilder.AddColumn<Guid>(
                name: "ReviewedByUserId",
                table: "StockMovements",
                type: "uuid",
                nullable: true);

            migrationBuilder.CreateIndex(
                name: "IX_StockMovements_ReviewedByUserId",
                table: "StockMovements",
                column: "ReviewedByUserId");

            migrationBuilder.AddForeignKey(
                name: "FK_StockMovements_Users_ReviewedByUserId",
                table: "StockMovements",
                column: "ReviewedByUserId",
                principalTable: "Users",
                principalColumn: "Id",
                onDelete: ReferentialAction.Restrict);
        }

        /// <inheritdoc />
        protected override void Down(MigrationBuilder migrationBuilder)
        {
            migrationBuilder.DropForeignKey(
                name: "FK_StockMovements_Users_ReviewedByUserId",
                table: "StockMovements");

            migrationBuilder.DropIndex(
                name: "IX_StockMovements_ReviewedByUserId",
                table: "StockMovements");

            migrationBuilder.DropColumn(
                name: "CountedQuantity",
                table: "StockMovements");

            migrationBuilder.DropColumn(
                name: "ReviewedAt",
                table: "StockMovements");

            migrationBuilder.DropColumn(
                name: "ReviewedByUserId",
                table: "StockMovements");
        }
    }
}
