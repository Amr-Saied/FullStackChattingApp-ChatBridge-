# ChattingApplicationProject

A modern, full-stack chat application built with ASP.NET Core Web API backend and Angular frontend, featuring real-time messaging, user profiles, photo sharing, and admin functionality.

## 🚀 Features

### Core Features

- **Real-time Messaging**: Instant message delivery using SignalR
- **User Authentication**: JWT-based authentication system
- **User Profiles**: Detailed user profiles with photos and personal information
- **Photo Management**: Cloudinary integration for photo uploads and storage
- **Like System**: Users can like other users' profiles
- **Admin Panel**: Comprehensive admin functionality for user management
- **Online Status**: Real-time online/offline status tracking
- **Message History**: Persistent message storage with read receipts
- **Typing Indicators**: Real-time typing indicators during conversations

### Advanced Features

- **User Banning**: Admin can ban users temporarily or permanently
- **Message Emojis**: Optional emoji support for messages
- **Error Handling**: Comprehensive error handling and logging
- **CORS Support**: Cross-origin resource sharing for frontend integration
- **Rate Limiting**: Protection against spam and abuse

## 🛠️ Technology Stack

### Backend (.NET 9.0)

- **ASP.NET Core Web API**: RESTful API framework
- **Entity Framework Core**: ORM for database operations
- **SQL Server**: Primary database
- **SignalR**: Real-time communication hub
- **JWT Authentication**: Secure token-based authentication
- **AutoMapper**: Object mapping utilities
- **Cloudinary**: Cloud image storage and management
- **Swagger/OpenAPI**: API documentation

## 📁 Project Structure

````
ChattingApplicationProject/
├── Controllers/          # API endpoints
├── Models/              # Database entities
├── DTO/                 # Data transfer objects
├── Services/            # Business logic services
├── Interfaces/          # Service contracts
├── Hubs/               # SignalR hubs for real-time features
├── Data/               # Database context and migrations
├── Helpers/            # Utility classes and AutoMapper profiles
├── Middlwares/         # Custom middleware
├── Errors/             # Exception handling
└── wwwroot/            # Static files

## 🚀 Getting Started

### Prerequisites

- .NET 9.0 SDK
- SQL Server (or SQL Server Express)
- Node.js 18+ and npm

### Backend Setup

1. **Clone the repository**

   ```bash
   git clone <repository-url>
   cd ChattingApplicationProject
````

2. **Configure database connection**

   - Update the connection string in `appsettings.json`
   - Run Entity Framework migrations:

   ```bash
   dotnet ef database update
   ```

3. **Configure Cloudinary (optional)**

   - Add your Cloudinary credentials to `appsettings.json`
   - Or remove Cloudinary references if not using photo features

4. **Set JWT secret key**

   - Add a secure token key to `appsettings.json`:

   ```json
   {
     "TokenKey": "your-super-secret-key-here"
   }
   ```

5. **Run the backend**
   ```bash
   dotnet run
   ```
   The API will be available at `https://localhost:7001`

## 📚 API Documentation

Once the backend is running, you can access the Swagger documentation at:

```
https://localhost:7001/swagger
```

### Key API Endpoints

- **Authentication**: `/api/account/login`, `/api/account/register`
- **Users**: `/api/users`, `/api/users/{id}`
- **Messages**: `/api/messages`, `/api/messages/{id}`
- **Likes**: `/api/likes`
- **Admin**: `/api/admin/*`

## 🔧 Configuration

### Environment Variables

- `TokenKey`: JWT secret key for authentication
- `DefaultConnection`: SQL Server connection string
- `CloudinarySettings`: Cloudinary configuration (optional)

### CORS Settings

The application is configured to allow requests from:

- `http://localhost:4200`
- `https://localhost:4200`

## 🧪 Testing

### Backend Testing

```bash
dotnet test
```

## 📦 Deployment

### Backend Deployment

1. Build the application:
   ```bash
   dotnet publish -c Release
   ```
2. Deploy to your preferred hosting platform (Azure, AWS, etc.)

## 🤝 Contributing

1. Fork the repository
2. Create a feature branch (`git checkout -b feature/amazing-feature`)
3. Commit your changes (`git commit -m 'Add some amazing feature'`)
4. Push to the branch (`git push origin feature/amazing-feature`)
5. Open a Pull Request

## 📝 License

This project is licensed under the MIT License - see the [LICENSE](LICENSE) file for details.

## 📞 Support

If you encounter any issues or have questions, please open an issue in the GitHub repository.

---
