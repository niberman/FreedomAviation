# Freedom Aviation - Unified Web Application

## Overview
Freedom Aviation is a production-ready web application designed for owner-pilots at Centennial Airport (KAPA), offering premium aircraft management and expert flight instruction. The platform consolidates marketing content with a secure owner dashboard, aiming to streamline operations, enhance client interaction, and provide a robust, scalable, and user-friendly solution with a premium aesthetic. The project's ambition is to serve as a comprehensive tool for an aviation business, targeting owner-pilots as its core market.

## User Preferences
I prefer simple language and clear, concise explanations. I want iterative development with frequent, small updates rather than large, infrequent ones. Please ask for my approval before making any major architectural changes or introducing new significant dependencies. I prefer detailed explanations of proposed changes and their impact. Do not make changes to the `attached_assets/` folder.

## System Architecture

### UI/UX Decisions
The application features an aviation-themed design with a deep blue palette and monospace fonts for tail numbers. It prioritizes a premium aesthetic with clean typography (Inter & JetBrains Mono), responsive design (mobile-first), and full dark mode support. Custom UI components like `StatusPill`, `Money`, and `CreditAmount` ensure data consistency. Recent updates include a redesigned pricing page with enhanced card designs and a "No Hangar" option, and the consolidation of hangar partner pages into a single, dynamic `/hangar-locations` route for improved navigation and scalability.

### Technical Implementations
The frontend is built with React 18, TypeScript, and Vite, using Wouter for routing, Tailwind CSS and shadcn/ui for styling, and TanStack Query for state management. Supabase provides authentication and PostgreSQL database services, with auto-generated types and Zod validation ensuring type safety. An Express.js backend can be integrated for custom API needs. Global error handling is managed via an `ErrorBoundary`. The system also incorporates a feature flag (`VITE_PRICING_MODE`) to switch between fixed (static) and configurator (database-driven) pricing models. Comprehensive SEO infrastructure is implemented using `react-helmet-async` for dynamic meta tags, Open Graph, Twitter Card support, and JSON-LD structured data, with a dedicated keywords system.

### Feature Specifications
The application includes public marketing pages and protected dashboards for Owners, Admins, and CFIs. Key features:
- **Owner Dashboard**: Aircraft management, service requests, billing, and document management. Includes demo mode support with read-only guards to prevent mutations when accessed via `?readonly=1` query parameter.
- **Owner Portal Demo**: Embedded live demo iframe on homepage showing the owner dashboard in read-only mode.
- **Contact Page**: FormSubmit.co integration at `/contact` with source tracking via query parameters for attribution analytics.
- **Demo Mode Infrastructure**: Complete read-only demo system with `useDemoMode` hook, `DemoBanner` component, and mutation guards in `QuickActions` to prevent database writes while showing informative toast messages.
- **Admin Panel**: Kanban board, aircraft management, and a unified pricing configurator for packages, service classes, hangar locations, and cost assumptions, with a snapshot system for publishing pricing versions.
- **CFI Panel**: Scheduling and student management.
- **Authentication**: Supabase Auth with global state management and protected routes.
- **Pricing System**: A comprehensive package pricing configurator with service tiers, hangar partnership locations, global cost assumptions, aircraft-specific overrides, and a snapshot system for publishing. A dual-mode pricing system (fixed vs. configurator) is implemented, controlled by an environment flag.

### System Design Choices
The project employs a component-based frontend architecture with clear separation of UI components, feature modules, pages, and utilities. Supabase Row Level Security (RLS) is extensively used for data privacy and access control, ensuring users only access relevant data. Environment variables are validated on startup. Auth state is managed globally and persists across sessions.

## External Dependencies
- **Supabase**: PostgreSQL database, authentication (`@supabase/supabase-js`), and Row Level Security (RLS).
- **React 18**: Frontend library.
- **TypeScript**: For type-safe development.
- **Vite**: Frontend build tool.
- **Wouter**: Client-side routing.
- **Tailwind CSS**: Utility-first CSS framework.
- **shadcn/ui**: UI component library.
- **TanStack Query (React Query)**: Data fetching and state management.
- **Zod**: Schema validation library.
- **Express.js**: (Optional) Backend framework.
- **react-helmet-async**: For managing document head tags and SEO.