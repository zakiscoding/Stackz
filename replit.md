# StackzFit AI - Fitness & Nutrition App

## Overview

StackzFit AI is a modern, AI-powered fitness and nutrition application designed for Gen Z and young adults. The app provides personalized workout plans, meal recommendations, and progress tracking through a sleek mobile-first interface with PWA capabilities. It features a jet black and electric blue design theme with Apple iOS-style UI components.

## User Preferences

Preferred communication style: Simple, everyday language.

## System Architecture

### Frontend Architecture
- **Framework**: React 18 with TypeScript
- **Routing**: Wouter (lightweight React router)
- **State Management**: TanStack React Query for server state management
- **UI Library**: ShadCN UI components built on Radix UI primitives
- **Styling**: Tailwind CSS with custom design tokens
- **Build Tool**: Vite with custom configuration for monorepo structure
- **PWA Support**: Progressive Web App with manifest.json and service worker capabilities

### Backend Architecture
- **Framework**: Express.js with TypeScript
- **Authentication**: Replit Auth with OpenID Connect integration
- **Session Management**: Express sessions with PostgreSQL storage
- **API Design**: RESTful endpoints with structured error handling
- **File Structure**: Modular route handlers and service layer separation

### Database Architecture
- **Database**: PostgreSQL with Neon serverless hosting
- **ORM**: Drizzle ORM with type-safe schema definitions
- **Migrations**: Drizzle Kit for database schema management
- **Connection**: Connection pooling via @neondatabase/serverless

## Key Components

### Authentication System
- **Provider**: Replit Auth integration for seamless user management
- **Session Storage**: PostgreSQL-backed sessions with configurable TTL
- **User Management**: User profiles with fitness preferences and subscription tiers
- **Security**: HTTPS-only cookies, secure session handling

### AI Integration
- **Provider**: Google Gemini AI for content generation
- **Workout Generation**: Personalized exercise plans based on user preferences
- **Meal Planning**: Custom nutrition plans considering dietary restrictions
- **Insights**: AI-powered analytics and recommendations

### Payment Processing
- **Provider**: Stripe integration for subscription management
- **Tiers**: Free, Premium, and Elite subscription levels
- **Features**: Payment processing, subscription status tracking

### User Interface
- **Design System**: Custom CSS variables with dark theme support
- **Components**: Comprehensive UI component library with variants
- **Mobile Optimization**: Touch-friendly interactions and responsive design
- **Accessibility**: ARIA compliance and keyboard navigation support

## Data Flow

### User Onboarding
1. User lands on marketing page with swipe-friendly onboarding
2. Authentication through Replit Auth system
3. Multi-step profile creation capturing fitness goals and preferences
4. AI generates initial workout and meal plans based on user data

### Content Generation
1. User requests new workout/meal plan through UI
2. Frontend sends request to Express API endpoints
3. Backend validates user subscription tier and rate limits
4. Gemini AI generates personalized content based on user profile
5. Generated content stored in PostgreSQL for future reference
6. Response sent back to frontend with structured data

### Progress Tracking
1. Users log workouts, meals, and body measurements
2. Data stored in normalized database tables
3. AI analyzes progress patterns and generates insights
4. Dashboard displays progress visualizations and recommendations

## External Dependencies

### Core Services
- **Neon Database**: PostgreSQL hosting with serverless architecture
- **Google Gemini AI**: Content generation and analysis
- **Stripe**: Payment processing and subscription management
- **Replit Auth**: User authentication and session management

### Development Tools
- **Vite**: Fast development server and build tool
- **TypeScript**: Type safety across the entire stack
- **Tailwind CSS**: Utility-first styling framework
- **React Query**: Powerful data fetching and caching

### UI Dependencies
- **Radix UI**: Accessible component primitives
- **Lucide React**: Consistent icon library
- **React Hook Form**: Form state management with validation
- **Zod**: Runtime type validation for forms and API responses

## Deployment Strategy

### Production Build
- **Frontend**: Vite builds optimized React bundle with code splitting
- **Backend**: ESBuild compiles TypeScript server code for Node.js
- **Static Assets**: Served through Express with proper caching headers
- **PWA**: Service worker registration for offline capabilities

### Environment Configuration
- **Database**: PostgreSQL connection via DATABASE_URL environment variable
- **API Keys**: Secure storage of Gemini AI and Stripe credentials
- **Sessions**: Configurable session secrets and cookie settings
- **CORS**: Proper cross-origin request handling for production

### Monitoring & Performance
- **Logging**: Structured request/response logging for API endpoints
- **Error Handling**: Centralized error middleware with proper status codes
- **Database**: Connection pooling and query optimization
- **Caching**: React Query provides intelligent client-side caching

The application follows modern web development best practices with a focus on type safety, performance, and user experience. The modular architecture allows for easy feature additions and maintenance while the AI integration provides unique value through personalized fitness and nutrition recommendations.