using Microsoft.EntityFrameworkCore.Migrations;

#nullable disable

namespace ChattingApplicationProject.Migrations
{
    /// <inheritdoc />
    public partial class AddVoiceMessageSupport : Migration
    {
        /// <inheritdoc />
        protected override void Up(MigrationBuilder migrationBuilder)
        {
            migrationBuilder.AddColumn<string>(
                name: "MessageType",
                table: "Messages",
                type: "nvarchar(max)",
                nullable: false,
                defaultValue: "");

            migrationBuilder.AddColumn<int>(
                name: "VoiceDuration",
                table: "Messages",
                type: "int",
                nullable: true);

            migrationBuilder.AddColumn<string>(
                name: "VoiceUrl",
                table: "Messages",
                type: "nvarchar(max)",
                nullable: true);
        }

        /// <inheritdoc />
        protected override void Down(MigrationBuilder migrationBuilder)
        {
            migrationBuilder.DropColumn(
                name: "MessageType",
                table: "Messages");

            migrationBuilder.DropColumn(
                name: "VoiceDuration",
                table: "Messages");

            migrationBuilder.DropColumn(
                name: "VoiceUrl",
                table: "Messages");
        }
    }
}
