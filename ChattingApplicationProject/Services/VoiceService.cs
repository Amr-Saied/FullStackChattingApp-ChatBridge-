using ChattingApplicationProject.Interfaces;
using CloudinaryDotNet;
using CloudinaryDotNet.Actions;
using Microsoft.AspNetCore.Http;
using Microsoft.Extensions.Options;

namespace ChattingApplicationProject.Services
{
    public class VoiceService : IVoiceService
    {
        private readonly Cloudinary _cloudinary;

        public VoiceService(IOptions<CloudinaryOptions> config)
        {
            var acc = new Account(
                config.Value.CloudName,
                config.Value.ApiKey,
                config.Value.ApiSecret
            );
            _cloudinary = new Cloudinary(acc);
        }

        public async Task<string> UploadVoiceAsync(IFormFile voiceFile)
        {
            if (voiceFile == null || voiceFile.Length == 0)
                return null;

            // Validate file type
            var allowedTypes = new[]
            {
                "audio/mp3",
                "audio/wav",
                "audio/webm",
                "audio/mpeg",
                "audio/ogg"
            };
            if (!allowedTypes.Contains(voiceFile.ContentType.ToLower()))
                throw new ArgumentException(
                    "Invalid voice file format. Supported formats: MP3, WAV, WebM, OGG"
                );

            // Validate file size (max 10MB)
            if (voiceFile.Length > 10 * 1024 * 1024)
                throw new ArgumentException("Voice file size too large. Maximum size: 10MB");

            using var stream = voiceFile.OpenReadStream();
            var uploadParams = new VideoUploadParams
            {
                File = new FileDescription(voiceFile.FileName, stream),
                Folder = "voice_messages",
                Format = "mp3", // Convert to MP3 for better compatibility
                Transformation = new Transformation().AudioCodec("mp3").Quality("auto:low") // Optimize for voice quality
            };

            var uploadResult = await _cloudinary.UploadAsync(uploadParams);
            return uploadResult.SecureUrl?.AbsoluteUri;
        }

        public async Task<bool> DeleteVoiceAsync(string voiceUrl)
        {
            if (string.IsNullOrEmpty(voiceUrl))
                return false;

            try
            {
                // Extract public ID from URL
                var uri = new Uri(voiceUrl);
                var pathSegments = uri.AbsolutePath.Split('/');
                var publicId = string.Join("/", pathSegments.Skip(2)); // Skip /v1/ and cloud_name
                publicId = publicId.Substring(0, publicId.LastIndexOf('.')); // Remove extension

                var deleteParams = new DeletionParams(publicId)
                {
                    ResourceType = ResourceType.Video
                };

                var result = await _cloudinary.DestroyAsync(deleteParams);
                return result.Result == "ok";
            }
            catch
            {
                return false;
            }
        }
    }
}
