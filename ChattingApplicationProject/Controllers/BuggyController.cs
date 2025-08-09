using System;
using System.Collections.Generic;
using System.Linq;
using System.Threading.Tasks;
using ChattingApplicationProject.Models;
using Microsoft.AspNetCore.Authorization;
using Microsoft.AspNetCore.Mvc;

namespace ChattingApplicationProject.Controllers
{
    [ApiController]
    [Route("[controller]")]
    [Authorize(Roles = "Admin")]
    public class BuggyController : ControllerBase
    {
        [HttpGet("auth")]
        public ActionResult<string> GetSecret()
        {
            return Unauthorized("You are not authorized");
        }

        [HttpGet("not-found")]
        public ActionResult<AppUser> GetNotFound()
        {
            string thing = null;
            return NotFound("Not found error");
        }

        [HttpGet("server-error")]
        public ActionResult<string> GetServerError()
        {
            string thing = null;
            var thingToReturn = thing.ToString();
            return Ok();
        }

        [HttpGet("bad-request")]
        public ActionResult<string> GetBadRequest()
        {
            return BadRequest("Bad request error");
        }
    }
}
