using System;
using System.Collections.Generic;
using System.Linq;
using System.Threading.Tasks;

namespace ChattingApplicationProject.Interfaces
{
    public interface IPhotoService
    {
        Task<string> UploadPhotoAsync(Microsoft.AspNetCore.Http.IFormFile file);
    }
}
