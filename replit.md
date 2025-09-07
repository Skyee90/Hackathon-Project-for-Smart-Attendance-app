# EduGamify - Smart Attendance & Learning Platform

## Overview

EduGamify is a comprehensive gamified education platform that combines attendance tracking, homework management, and achievement systems. The platform supports multiple user roles (students, teachers, and parents) with real-time QR code attendance scanning, progress tracking, and a points-based gamification system. Built with modern web technologies, it features a responsive dark-themed UI with interactive 3D elements and comprehensive dashboard analytics.

## User Preferences

Preferred communication style: Simple, everyday language.

## System Architecture

### Frontend Architecture
- **Framework**: React 18 with TypeScript for type safety and modern development
- **Build Tool**: Vite for fast development and optimized production builds
- **Routing**: Wouter for lightweight client-side routing
- **State Management**: TanStack Query for server state management and caching
- **UI Framework**: Shadcn/ui components built on Radix UI primitives
- **Styling**: Tailwind CSS with custom CSS variables for theming
- **3D Graphics**: Three.js with React Three Fiber for interactive medal components
- **Charts**: Chart.js with React integration for attendance analytics

### Backend Architecture
- **Runtime**: Node.js with Express.js framework
- **Language**: TypeScript with ES modules for modern JavaScript features
- **Authentication**: JWT-based stateless authentication
- **API Design**: RESTful endpoints with role-based access control
- **File Structure**: Monorepo structure with shared schema validation

### Database & ORM
- **Database**: PostgreSQL with Neon serverless hosting
- **ORM**: Drizzle ORM for type-safe database operations
- **Schema Management**: Centralized schema definitions with Zod validation
- **Migrations**: Drizzle Kit for database schema management

### Data Models
- **Users**: Role-based system (student, teacher, parent) with hierarchical relationships
- **Attendance**: Daily tracking with multiple check-in methods (manual, QR, teacher override)
- **Gamification**: XP system with levels, streaks, and achievement unlocking
- **Homework**: Assignment creation, submission tracking, and grading
- **QR Codes**: Dynamic QR code generation for contactless attendance

### Authentication & Authorization
- **JWT Tokens**: Stateless authentication with role-based claims
- **Password Security**: Bcrypt hashing for secure password storage
- **Route Protection**: Middleware-based authentication verification
- **Role Permissions**: Granular access control based on user roles

### Real-time Features
- **QR Code Scanning**: Browser-based camera integration for attendance
- **Live Dashboards**: Real-time updates using React Query invalidation
- **Progress Tracking**: Instant XP and achievement updates

### Development & Deployment
- **Development Server**: Vite dev server with HMR and error overlays
- **Build Process**: Separate client and server build pipelines
- **Environment**: Replit-optimized with development banners and cartographer integration
- **Error Handling**: Comprehensive error boundaries and API error responses

## External Dependencies

### Core Dependencies
- **@neondatabase/serverless**: Neon PostgreSQL serverless driver for database connectivity
- **drizzle-orm**: Type-safe ORM with PostgreSQL dialect support
- **drizzle-zod**: Integration between Drizzle schemas and Zod validation

### UI & Styling
- **@radix-ui/react-***: Comprehensive UI primitive components for accessibility
- **tailwindcss**: Utility-first CSS framework with custom configuration
- **class-variance-authority**: Type-safe variant-based component styling
- **lucide-react**: Consistent icon system

### Authentication & Security
- **jsonwebtoken**: JWT token generation and verification
- **bcryptjs**: Password hashing and verification

### Data Visualization
- **chart.js**: Flexible charting library for attendance analytics
- **react-chartjs-2**: React wrapper for Chart.js integration

### 3D Graphics
- **three**: 3D graphics library for medal components
- **@react-three/fiber**: React renderer for Three.js
- **@react-three/drei**: Useful helpers and abstractions for React Three Fiber

### Development Tools
- **@tanstack/react-query**: Server state management and caching
- **wouter**: Lightweight React router
- **react-hook-form**: Performant form handling with validation
- **@hookform/resolvers**: Form validation resolvers

### Build & Development
- **vite**: Fast build tool and development server
- **@vitejs/plugin-react**: React plugin for Vite
- **typescript**: Static type checking
- **tsx**: TypeScript execution engine
- **esbuild**: Fast JavaScript bundler for server builds