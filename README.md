# **ChatBridge – Full-Stack Real-Time Chat Application**

## 🔗 Repositories & Commit History
- **Frontend**: [AngularchattingApplicationFrontEnd](https://github.com/Amr-Saied/AngularchattingApplicationFrontEnd)  
  _(Browse [full commit history](https://github.com/Amr-Saied/AngularchattingApplicationFrontEnd/commits))_
- **Backend**: [ChattingApplication](https://github.com/Amr-Saied/ChattingApplication)  
  _(Browse [full commit history](https://github.com/Amr-Saied/ChattingApplication/commits))_

---

A modern, high-performance **social messaging platform** built with **ASP.NET Core Web API (Backend)** and **Angular (Frontend)**.  
The system delivers **secure, scalable, and interactive communication** with **real-time messaging, profile management, and administrative oversight**.  

It is architected to support **thousands of concurrent connections** with **low latency**, leveraging **SignalR**, **SQL Server**, and **Cloudinary** for a rich, responsive user experience.

---

## **📜 Project Overview**

ChatBridge follows a **modular, service-oriented architecture (SOA)**, with strict separation of concerns between backend API services and frontend client rendering.  

**Architecture Flow:**
1. **Angular Frontend** – SPA (Single-Page Application) for rendering the UI, managing user state, and consuming REST + WebSocket endpoints.
2. **ASP.NET Core Backend** – Hosts REST APIs for CRUD operations and a SignalR hub for real-time event streaming.
3. **SQL Server Database** – Persistent storage for user profiles, messages, likes, and audit logs.
4. **Cloudinary** – External cloud storage for user profile photos and shared images.
5. **JWT Authentication** – Stateless token-based security for API requests.
6. **SignalR WebSockets** – Pushes messages, presence updates, and typing indicators to connected clients instantly.

---

## **🚀 Features**

### **Core Features**
- **Real-Time Messaging** – WebSocket-based messaging with SignalR.
- **Online Presence Tracking** – Live user online/offline updates.
- **Typing Indicators** – Notifies conversation participants when someone is typing.
- **Message History & Read Receipts** – Full conversation logs with delivery status.
- **User Profiles** – Editable profiles with bio, images, and personal details.
- **Photo Management** – Upload and manage photos via Cloudinary integration.
- **Like System** – Social interaction via profile likes.

### **Advanced Features**
- **Admin Dashboard** – Manage users, ban accounts, and review reports.
- **Role-Based Access Control (RBAC)** – Permissions split between Admin and User roles.
- **Rate Limiting & Anti-Spam** – Prevents abuse and spam attacks.
- **Centralized Error Handling** – Consistent API error responses.
- **CORS Configuration** – Secured for defined frontend domains.
- **Emoji Support** – Optional in chat input.

---

## **🛠 Technology Stack**

| Layer            | Technologies |
|------------------|--------------|
| **Backend**      | ASP.NET Core 9.0, Entity Framework Core, SQL Server, SignalR, AutoMapper, JWT |
| **Frontend**     | Angular 20.0.5, TypeScript, RxJS, HTML5, SCSS |
| **Cloud Hosting**| Cloudinary (media), Vercel/Netlify (frontend hosting), MonsterASP.NET (backend) |
| **Documentation**| Swagger / OpenAPI |

---

## 📂 Project Structure
```
ChatBridge/
├── backend/ChattingApplicationProject/
│   ├── Controllers/       # API endpoints
│   ├── Models/            # Entity models
│   ├── DTO/               # Data Transfer Objects
│   ├── Services/          # Business logic
│   ├── Interfaces/        # Service contracts
│   ├── Hubs/              # SignalR hubs
│   ├── Data/              # EF Core DbContext & Migrations
│   ├── Helpers/           # Utilities & AutoMapper profiles
│   ├── Middlewares/       # Custom middleware
│   ├── Errors/            # Centralized error handling
│   └── wwwroot/           # Static backend assets
│
└── frontend/ChatBridge-Frontend/
    ├── src/app/           # Angular modules, components, services
    ├── assets/            # Static resources
    ├── environments/      # Environment configs
    └── styles/            # Global SCSS/CSS
```



---

## **⚙ Getting Started**

### **1. Prerequisites**
- **.NET 9.0 SDK**
- **SQL Server** (Express or Standard)
- **Node.js 18+** & npm
- (Optional) **Cloudinary Account** for media hosting

---

### **2. Backend Setup**

```bash
git clone https://github.com/Amr-Saied/FullStackChattingApp-ChatBridge-.git
cd ChattingApplicationProject

Configure Database

Update appsettings.json with your SQL Server connection string.

Apply migrations:

bash
Copy
Edit
dotnet ef database update
Cloudinary Setup (optional)

Add your Cloudinary credentials in appsettings.json.

JWT Token Key

Add a secure token key in appsettings.json:

json
Copy
Edit
{
  "TokenKey": "your-super-secret-key"
}
Run Backend

bash
Copy
Edit
dotnet run
Access API at: https://localhost:7001

3. Frontend Setup
bash
Copy
Edit
cd AngularChattingAppFrontEnd
npm install
Run Development Server

bash
Copy
Edit
ng serve
Visit: http://localhost:4200

Build for Production

bash
Copy
Edit
ng build
Output is in the dist/ directory.

📚 API Documentation
Once the backend is running, Swagger UI is available at:
https://localhost:7001/swagger

🧪 Testing
Backend Tests:

bash
Copy
Edit
dotnet test
Frontend Unit Tests:

bash
Copy
Edit
ng test
📦 Deployment
Backend Deployment
bash
Copy
Edit
dotnet publish -c Release
Deploy to Azure, AWS, or any .NET-capable hosting.

Frontend Deployment
bash
Copy
Edit
ng build --configuration production
Deploy to Vercel, Netlify, or any static hosting.

📐 High-Level Architecture Diagram
css
Copy
Edit
[ Angular SPA ] <---- REST API ----> [ ASP.NET Core Backend ] <----> [ SQL Server DB ]
       │                                  │
       └------ SignalR WebSocket ---------┘
                (Real-Time Messaging)
       │
   [ Cloudinary Media Storage ]
🤝 Contributing
Fork the repository

Create a feature branch:

bash
Copy
Edit
git checkout -b feature/amazing-feature
Commit changes & push:

bash
Copy
Edit
git commit -m "Add amazing feature"
git push origin feature/amazing-feature
Open a Pull Request
