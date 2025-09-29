# ChatGOV - Government Services AI Assistant

ChatGOV is an intelligent AI-powered chatbot designed to assist Vietnamese citizens with government administrative procedures and public services. The system provides personalized guidance, step-by-step instructions, and comprehensive information about various government services.

## 🌟 Features

### Core Functionality

- **Intelligent Service Search**: AI-powered search for government services based on natural language queries
- **Personalized Assistance**: Customized responses based on user profile (age, location, etc.)
- **Step-by-Step Guidance**: Detailed procedural instructions with visual step indicators
- **Multi-language Support**: Vietnamese and English language support
- **Real-time Chat**: Interactive chat interface with typing indicators and smooth scrolling

### User Management

- **Authentication System**: Complete auth flow with Supabase integration
- **User Profiles**: Comprehensive profile management with validation
- **Password Management**: Secure password change functionality
- **Session Management**: Persistent chat sessions with history

### Technical Features

- **Responsive Design**: Mobile-first design with adaptive layouts
- **Modern UI/UX**: Clean interface with theme support and smooth animations
- **Real-time Streaming**: Server-sent events for real-time AI responses
- **Markdown Support**: Rich text formatting for better content presentation

## 🚀 Getting Started

### Prerequisites

- Node.js 18+ and npm
- Python 3.9+
- Supabase account
- Google AI API key (for Gemini models)

### Frontend Setup

```bash
cd frontend
npm install
npm run dev
```

The frontend will be available at `http://localhost:5173`

### Backend Setup

1. **Install dependencies:**

```bash
cd backend
pip install -r requirements.txt
```

2. **Environment configuration:**
   Create a `.env` file in the `2_backend` directory:

```env
# Supabase Configuration
SUPABASE_URL=your_supabase_url
SUPABASE_SERVICE_ROLE_KEY=your_service_role_key

# Google AI Configuration
GOOGLE_API_KEY=your_google_ai_api_key
GEMINI_MODEL=gemini-2.5-flash

# Backend Configuration
BACKEND_COOKIE_DOMAIN=
BACKEND_COOKIE_SECURE=false
CORS_ALLOW_ORIGINS=http://localhost:5173

# Optional: LangSmith Tracing
LANGSMITH_TRACING=True
LANGSMITH_ENDPOINT=https://api.smith.langchain.com
LANGSMITH_API_KEY=your_langsmith_key
LANGSMITH_PROJECT=GovService-Chatbot
```

3. **Run the backend:**

```bash
uvicorn main:app --reload --port 8000
```

The backend API will be available at `http://localhost:8000`

## 🛠️ Technology Stack

### Frontend

- **React 19** - Modern React with concurrent features
- **TypeScript** - Type-safe development
- **Vite** - Fast build tool and development server
- **Styled Components** - CSS-in-JS styling solution
- **React Router** - Client-side routing
- **Axios** - HTTP client for API communication
- **React Markdown** - Markdown rendering with syntax highlighting

### Backend

- **FastAPI** - High-performance async Python web framework
- **LangChain** - LLM application development framework
- **LangGraph** - Workflow orchestration for AI agents
- **Google Gemini** - Large language model for AI responses
- **Supabase** - Backend-as-a-Service for auth and database
- **Pydantic** - Data validation and serialization

### Database & Services

- **Supabase PostgreSQL** - Primary database with vector search
- **Supabase Auth** - User authentication and session management
- **Google AI Platform** - AI/ML services and embeddings

## 📋 Key Features Implementation

### AI-Powered Service Search

The system uses a sophisticated AI pipeline:

1. **Natural Language Processing**: User queries are processed using Google Gemini
2. **Fuzzy Search**: Service matching using fuzzy search
3. **Contextual Responses**: Personalized answers based on user profile
4. **Tool Integration**: Structured data retrieval with LangChain tools

### User Experience

- **Progressive Web App**: Responsive design works on all devices
- **Accessibility**: ARIA labels, keyboard navigation, screen reader support
- **Internationalization**: Built-in i18n with Vietnamese and English support
- **Real-time Updates**: Live chat with typing indicators and auto-scroll

### Security & Privacy

- **JWT Authentication**: Secure token-based authentication
- **HTTP-only Cookies**: Secure session management
- **CORS Protection**: Proper cross-origin resource sharing
- **Input Validation**: Comprehensive data validation and sanitization

## 🔧 API Endpoints

### Authentication

- `POST /api/auth/login` - User login
- `POST /api/auth/register` - User registration
- `POST /api/auth/logout` - User logout
- `POST /api/auth/forgot-password` - Password reset


### Chat & Sessions

- `POST /api/chat/start_session` - Start new chat session
- `POST /api/chat/` - Send message and get AI response (streaming)

### User Management

- `GET /api/profile/` - Get user profile
- `PUT /api/profile/` - Update user profile
- `POST /api/profile/change-password` - Change password

### Utilities

- `GET /api/graph/` - Visualize AI workflow graph

## 🎯 Core Components

### Frontend Components

- [`SessionList`](1_frontend/src/components/common/chat/SessionList.tsx) - Chat session management
- [`ChatMessage`](1_frontend/src/components/common/chat/ChatMessage.tsx) - Message display with markdown
- [`PromptInput`](1_frontend/src/components/common/chat/PromptInput.tsx) - Auto-resizing chat input
- [`Sidebar`](1_frontend/src/components/layout/Sidebar.tsx) - Navigation and session history
- [`AppLayout`](1_frontend/src/components/layout/AppLayout.tsx) - Main application layout

### Backend Services

- [`tools.py`](2_backend/tools.py) - AI tools for service search and information retrieval
- [`graph.py`](2_backend/graph.py) - LangGraph workflow for AI responses
- [`database.py`](2_backend/database.py) - Database operations and queries
- [`prompts.py`](2_backend/prompts.py) - System prompts for AI behavior

## 🔄 Development Workflow

### Frontend Development

```bash
# Development server with hot reload
npm run dev

# Type checking
npm run build

# Linting
npm run lint
```

### Backend Development

```bash
# Run with auto-reload
uvicorn main:app --reload

# Load data from CSV
python -m utils.load_csv data.csv
```

## 🚀 Deployment

### Frontend Deployment

The frontend is configured for deployment on platforms like Vercel, Netlify, or similar:

```bash
npm run build
# Deploy the 'dist' folder
```

### Backend Deployment

The FastAPI backend can be deployed on platforms like Railway, Render, or Docker:

```bash
# Using uvicorn in production
uvicorn main:app --host 0.0.0.0 --port 8000
```

## 🤝 Contributing

1. Fork the repository
2. Create a feature branch (`git checkout -b feature/amazing-feature`)
3. Commit your changes (`git commit -m 'Add some amazing feature'`)
4. Push to the branch (`git push origin feature/amazing-feature`)
5. Open a Pull Request

## 📄 License

This project is licensed under the MIT License - see the LICENSE file for details.

## 🆘 Support

For support and questions:

- Create an issue in the GitHub repository
- Contact the development team

---

**Note**: This project is currently in development. Some features may not be fully implemented yet.
