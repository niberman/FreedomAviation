# Freedom Aviation - Unified Web Application

## Overview
Freedom Aviation is a production-ready web application providing premium aircraft management and expert flight instruction for owner-pilots at Centennial Airport (KAPA). The platform unifies marketing pages with a secure owner dashboard. Its core purpose is to streamline aircraft management, flight instruction, and client interaction for an aviation business. The project aims to deliver a robust, scalable, and user-friendly solution with a premium aesthetic, targeting owner-pilots as its primary market.

## User Preferences
I prefer simple language and clear, concise explanations. I want iterative development with frequent, small updates rather than large, infrequent ones. Please ask for my approval before making any major architectural changes or introducing new significant dependencies. I prefer detailed explanations of proposed changes and their impact. Do not make changes to the `attached_assets/` folder.

## System Architecture

### UI/UX Decisions
The application features an aviation-themed design with a deep blue palette (215 85% 25%) and monospace fonts for tail numbers. It employs a premium aesthetic with clean typography (Inter & JetBrains Mono), is responsive with a mobile-first approach, and includes full dark mode support based on system preferences. UI components like `StatusPill`, `Money`, and `CreditAmount` ensure consistent display of data.

### Technical Implementations
The frontend is built with React 18, TypeScript, and Vite, utilizing Wouter for routing, Tailwind CSS and shadcn/ui for styling, and TanStack Query for state management. Supabase provides authentication and database services (PostgreSQL). An Express.js backend can be integrated for custom API endpoints if needed. Type safety is maintained through auto-generated Supabase types and Zod validation for data hooks (`useAircraft`, `useServiceRequests`). Global error handling is managed via an `ErrorBoundary`.

### Feature Specifications
The application includes public marketing pages (`/`, `/login`) and protected dashboards for Owners (`/dashboard`, `/dashboard/more`), Admins (`/admin`), and CFIs (`/cfi`). Key features include:
- **Owner Dashboard**: Aircraft management, service requests, billing, and document management.
- **Admin Panel**: Kanban board and aircraft management.
- **CFI Panel**: Scheduling and student management.
- **Authentication**: Supabase Auth with global state management and protected routes.
- **Pricing System**: A comprehensive package pricing configurator that integrates hangar costs. This includes configurable service tiers, hangar partnership locations, global cost assumptions, aircraft-specific overrides, and a snapshot system for publishing pricing versions. An admin interface allows managing these configurations, and a public pricing page dynamically displays package options.

### System Design Choices
The project uses a component-based architecture for the frontend, organizing code into reusable UI components, feature modules, and pages. Utilities and infrastructure are separated into a `lib/` directory. Supabase Row Level Security (RLS) is extensively used to ensure data privacy and access control, with policies ensuring users only access their relevant data (owners their aircraft, CFIs their clients, admins full access). Environment variables are validated on startup to prevent silent failures. Auth state is managed globally and persists across sessions.

## Development Tools

### Dev Toolbar (Development Mode Only)
A floating toolbar appears in the bottom-right corner during development to streamline navigation between pages and dashboards.

**Features:**
- **Quick Navigation**: Dropdown menus for Marketing Pages and Dashboards
- **Current Route Display**: Shows which page you're currently on
- **Minimizable**: Collapse to a single button when not needed
- **Auto-Hidden in Production**: Only appears when `import.meta.env.PROD === false`

**Usage:**
1. Look for the yellow "DEV MODE" toolbar in the bottom-right corner
2. Click "Marketing Pages" to navigate to Home, Pricing, Partner pages, or Login
3. Click "Dashboards" to switch between Owner, Admin, CFI, and Configurator views
4. Click minimize (down arrow) to collapse the toolbar

**Available Pages:**
- **Marketing**: Home, Pricing, Sky Harbour, FA Hangar, Login
- **Dashboards**: Owner Dashboard, Owner More, Admin, Pricing Configurator, Package Configurator, CFI

**Implementation:**
- Component: `client/src/components/dev-toolbar.tsx`
- Integrated in: `client/src/App.tsx`

## External Dependencies
- **Supabase**: Used for PostgreSQL database, authentication (`@supabase/supabase-js`), and Row Level Security (RLS).
- **React 18**: Frontend library.
- **TypeScript**: For type-safe development.
- **Vite**: Frontend build tool.
- **Wouter**: Client-side routing.
- **Tailwind CSS**: Utility-first CSS framework.
- **shadcn/ui**: UI component library built on Tailwind CSS.
- **TanStack Query (React Query)**: Data fetching and state management.
- **Zod**: Schema validation library.
- **Express.js**: (Optional) Backend framework for custom API endpoints.