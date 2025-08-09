using System;
using System.Collections.Generic;
using System.Linq;
using System.Threading.Tasks;
using AutoMapper;
using ChattingApplicationProject.DTO;
using ChattingApplicationProject.Models;

namespace ChattingApplicationProject.Helpers
{
    public class AutoMapperProfiles : Profile
    {
        public AutoMapperProfiles()
        {
            CreateMap<AppUser, MemeberDTO>()
                .ForMember(
                    dest => dest.PhotoUrl,
                    opt => opt.MapFrom(src => GetMainPhotoUrl(src.Photos))
                )
                .ForMember(dest => dest.age, opt => opt.MapFrom(src => src.GetAge()));

            CreateMap<Photo, PhotoDTO>();
            CreateMap<PhotoDTO, Photo>();
            CreateMap<MemeberDTO, AppUser>();

            // Add mapping from RegisterDTO to AppUser
            CreateMap<RegisterDTO, AppUser>()
                .ForMember(
                    dest => dest.UserName,
                    opt => opt.MapFrom(src => (src.Username ?? string.Empty).ToLower())
                )
                .ForMember(dest => dest.Email, opt => opt.MapFrom(src => src.Email))
                .ForMember(dest => dest.DateOfBirth, opt => opt.MapFrom(src => src.DateOfBirth))
                .ForMember(dest => dest.KnownAs, opt => opt.MapFrom(src => src.KnownAs))
                .ForMember(dest => dest.Gender, opt => opt.MapFrom(src => src.Gender))
                .ForMember(dest => dest.City, opt => opt.MapFrom(src => src.City))
                .ForMember(dest => dest.Country, opt => opt.MapFrom(src => src.Country))
                .ForMember(dest => dest.Created, opt => opt.MapFrom(src => DateTime.Now))
                .ForMember(dest => dest.LastActive, opt => opt.MapFrom(src => DateTime.Now))
                .ForMember(dest => dest.Role, opt => opt.MapFrom(src => "User"));

            CreateMap<Message, MessageDto>();
            CreateMap<MessageDto, Message>();

            // Admin DTOs mappings
            CreateMap<AppUser, AdminUserResponseDTO>()
                .ForMember(dest => dest.Age, opt => opt.MapFrom(src => src.GetAge()))
                .ForMember(dest => dest.PhotoUrl, opt => opt.Ignore()); // Set manually in service

            CreateMap<AdminEditUserDTO, AppUser>()
                .ForMember(
                    dest => dest.UserName,
                    opt => opt.Condition(src => !string.IsNullOrEmpty(src.UserName))
                )
                .ForMember(
                    dest => dest.KnownAs,
                    opt => opt.Condition(src => !string.IsNullOrEmpty(src.KnownAs))
                )
                .ForMember(
                    dest => dest.DateOfBirth,
                    opt => opt.Condition(src => src.DateOfBirth != default)
                )
                .ForMember(
                    dest => dest.Gender,
                    opt => opt.Condition(src => !string.IsNullOrEmpty(src.Gender))
                )
                .ForMember(
                    dest => dest.Introduction,
                    opt => opt.Condition(src => !string.IsNullOrEmpty(src.Introduction))
                )
                .ForMember(
                    dest => dest.LookingFor,
                    opt => opt.Condition(src => !string.IsNullOrEmpty(src.LookingFor))
                )
                .ForMember(
                    dest => dest.Interests,
                    opt => opt.Condition(src => !string.IsNullOrEmpty(src.Interests))
                )
                .ForMember(
                    dest => dest.City,
                    opt => opt.Condition(src => !string.IsNullOrEmpty(src.City))
                )
                .ForMember(
                    dest => dest.Country,
                    opt => opt.Condition(src => !string.IsNullOrEmpty(src.Country))
                )
                .ForMember(
                    dest => dest.Role,
                    opt => opt.Condition(src => !string.IsNullOrEmpty(src.Role))
                );
        }

        private static string GetMainPhotoUrl(ICollection<Photo>? photos)
        {
            if (photos == null || !photos.Any())
                return string.Empty;

            var mainPhoto = photos.FirstOrDefault(x => x.IsMain);
            return mainPhoto?.Url ?? string.Empty;
        }
    }
}
