using Microsoft.EntityFrameworkCore.Migrations;

#nullable disable

namespace ChattingApplicationProject.Migrations
{
    /// <inheritdoc />
    public partial class AddEmojiToMessage : Migration
    {
        /// <inheritdoc />
        protected override void Up(MigrationBuilder migrationBuilder)
        {
            migrationBuilder.AddColumn<string>(
                name: "Emoji",
                table: "Messages",
                type: "nvarchar(max)",
                nullable: false,
                defaultValue: "");
        }

        /// <inheritdoc />
        protected override void Down(MigrationBuilder migrationBuilder)
        {
            migrationBuilder.DropColumn(
                name: "Emoji",
                table: "Messages");
        }
    }
}
