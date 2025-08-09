using System;
using System.Collections.Generic;
using System.Linq;
using System.Threading.Tasks;

namespace ChattingApplicationProject.Errors
{
    public class ApiException : Exception
    {
        public int StatusCode { get; set; }
        public string? Details { get; set; }

        public new string? Message { get; set; }

        public ApiException(int statusCode, string? message = null, string? details = null)
        {
            this.StatusCode = statusCode;
            this.Message = message;
            this.Details = details;
        }
    }
}
