using Microsoft.AspNetCore.Http;

namespace ChattingApplicationProject.Interfaces
{
    public interface IVoiceService
    {
        Task<string> UploadVoiceAsync(IFormFile voiceFile);
        Task<bool> DeleteVoiceAsync(string voiceUrl);
    }
}
