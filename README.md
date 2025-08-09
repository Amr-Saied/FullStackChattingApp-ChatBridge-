
### Key API Endpoints

#### Authentication
- `POST /api/account/register` - User registration
- `POST /api/account/login` - User login
- `POST /api/account/refresh-token` - Refresh JWT token
- `POST /api/account/forgot-password` - Password reset request
- `POST /api/account/reset-password` - Reset password

#### Users
- `GET /api/users` - Get all users (paginated)
- `GET /api/users/{id}` - Get user by ID
- `PUT /api/users` - Update user profile
- `POST /api/users/add-photo` - Upload profile photo

#### Messages
- `GET /api/messages` - Get user's conversations
- `GET /api/messages/{userId}` - Get messages with specific user
- `POST /api/messages` - Send text message
- `POST /api/messages/voice` - Send voice message
- `DELETE /api/messages/{id}` - Delete message

#### Likes
- `POST /api/likes/{userId}` - Like/unlike user
- `GET /api/likes` - Get user's likes and liked by

#### Admin (Admin role required)
- `GET /api/admin/users` - Get all users for admin
- `PUT /api/admin/edit-user/{id}` - Edit user as admin
- `POST /api/admin/ban-user` - Ban user

## 🎨 Features in Detail

### Real-Time Messaging
- **WebSocket connection** via SignalR for instant communication
- **Message persistence** with SQL Server database
- **Voice message support** with audio recording and playback
- **Emoji integration** with rich emoji picker
- **Message status indicators** (sent, delivered, read)
- **Typing indicators** with timeout handling

### User Experience
- **Responsive design** that adapts to all screen sizes
- **Theme switching** between light and dark modes
- **Internationalization** ready with translation service
- **Loading states** with consistent spinner implementation
- **Error handling** with user-friendly notifications
- **Offline handling** with connection status indicators

### Security Features
- **Encrypted local storage** for sensitive data
- **JWT token management** with automatic refresh
- **CORS protection** with configurable origins
- **Input validation** on both client and server
- **SQL injection prevention** with parameterized queries
- **XSS protection** with proper sanitization

## 🔧 Configuration

### Environment Variables

#### Backend (appsettings.json)
```json
{
  "ConnectionStrings": {
    "DefaultConnection": "your-sql-server-connection-string"
  },
  "TokenKey": "your-jwt-secret-key",
  "FrontendUrl": "https://your-frontend-domain.com",
  "CloudinarySettings": {
    "CloudName": "your-cloudinary-cloud-name",
    "ApiKey": "your-cloudinary-api-key",
    "ApiSecret": "your-cloudinary-api-secret"
  },
  "GoogleSettings": {
    "ClientId": "your-google-oauth-client-id",
    "ClientSecret": "your-google-oauth-client-secret"
  }
}
```

#### Frontend (environment.ts)
```typescript
export const environment = {
  production: false,
  apiUrl: 'https://localhost:7001/api',
  hubUrl: 'https://localhost:7001/messagehub'
};
```

## 🧪 Testing

### Backend Testing
```bash
cd ChattingApplicationProject
dotnet test
```

### Frontend Testing
```bash
cd AngularChattingAppFrontEnd
npm test
```

## 📦 Deployment

### Backend Deployment
1. **Build the application**
   ```bash
   dotnet publish -c Release -o ./publish
   ```

2. **Deploy to your hosting platform**
   - Azure App Service
   - AWS Elastic Beanstalk
   - IIS
   - Docker containers

### Frontend Deployment
1. **Build for production**
   ```bash
   ng build --configuration=production
   ```

2. **Deploy the `dist/` folder to:**
   - Vercel (currently deployed)
   - Netlify
   - Azure Static Web Apps
   - AWS S3 + CloudFront

## 🔒 Security Considerations

### Production Checklist
- [ ] Change all default secrets and keys
- [ ] Enable HTTPS
- [ ] Configure CORS for production domains
- [ ] Set up proper logging and monitoring
- [ ] Implement rate limiting
- [ ] Regular security updates
- [ ] Backup strategy for database

### Security Features Implemented
- ✅ JWT token encryption in local storage
- ✅ Password hashing with salt
- ✅ Email confirmation for registration
- ✅ Role-based authorization
- ✅ Input validation and sanitization
- ✅ CORS protection
- ✅ Exception handling middleware

## 🤝 Contributing

### To Individual Repositories:
- **Frontend**: Create issues and PRs in the [Angular Frontend Repository](https://github.com/Amr-Saied/AngularchattingApplicationFrontEnd)
- **Backend**: Create issues and PRs in the [Backend Repository](https://github.com/Amr-Saied/ChattingApplication)

### General Contribution Process:
1. Fork the relevant repository
2. Create a feature branch (`git checkout -b feature/amazing-feature`)
3. Commit your changes (`git commit -m 'Add some amazing feature'`)
4. Push to the branch (`git push origin feature/amazing-feature`)
5. Open a Pull Request

## 📋 Future Enhancements

- [ ] File sharing capabilities
- [ ] Group chat functionality
- [ ] Video calling integration
- [ ] Push notifications
- [ ] Mobile app with Ionic/React Native
- [ ] Message encryption
- [ ] Advanced admin analytics
- [ ] Message search functionality

## 📞 Support

If you encounter any issues or have questions:
- Frontend issues: Open an issue in the [Frontend Repository](https://github.com/Amr-Saied/AngularchattingApplicationFrontEnd/issues)
- Backend issues: Open an issue in the [Backend Repository](https://github.com/Amr-Saied/ChattingApplication/issues)
- General questions: Check the existing documentation
- API questions: Review the API documentation via Swagger

## 📄 License

This project is licensed under the MIT License - see the [LICENSE](LICENSE) file for details.

## 🙏 Acknowledgments

- Built with modern web technologies
- Inspired by popular messaging applications
- Community feedback and contributions
- Open source libraries and frameworks

---

**Made with ❤️ by [Amr](https://github.com/Amr-Saied)** - A full-stack developer passionate about creating modern web applications.

> **Note**: This application is designed for educational and demonstration purposes. For production use, ensure all security measures are properly implemented and tested.

## 🔗 Related Links

- **[Frontend Repository](https://github.com/Amr-Saied/AngularchattingApplicationFrontEnd)** - Complete Angular application with full commit history
- **[Backend Repository](https://github.com/Amr-Saied/ChattingApplication)** - Complete .NET API with full commit history
- **[Live Demo](https://angular-chatting-app-front-end.vercel.app)** - Try the application online
- **[Developer Portfolio](https://github.com/Amr-Saied)** - More projects by Amr
