# Frontend Project Structure

This document outlines the reorganized frontend structure for the OMR (Optical Mark Recognition) system.

## 📁 Folder Structure

```
src/
├── components/           # Reusable UI components
│   ├── ui/              # ShadCN UI components (buttons, cards, etc.)
│   ├── layout/          # Layout components (sidebar, header, etc.)
│   ├── features/        # Feature-specific components (BubbleOverlay, etc.)
│   └── common/          # Common shared components
├── pages/               # Page components organized by feature
│   ├── auth/            # Authentication pages
│   ├── dashboard/       # Dashboard and processing pages
│   ├── upload/          # File upload pages
│   ├── results/         # Results display pages
│   ├── review/          # Review and correction pages
│   ├── analytics/       # Analytics and reporting pages
│   └── export/          # Export functionality pages
├── hooks/               # Custom React hooks
├── services/            # API services and external integrations
├── types/               # TypeScript type definitions
├── utils/               # Utility functions and helpers
├── constants/           # Application constants and configuration
└── assets/              # Static assets
    ├── images/          # Image files
    └── icons/           # Icon files
```

## 🏗️ Architecture Overview

### Components
- **UI Components**: Reusable ShadCN UI components in `components/ui/`
- **Layout Components**: Navigation, sidebar, and layout structure
- **Feature Components**: Complex components specific to OMR functionality

### Pages
- **Auth Pages**: Login, authentication, and user management
- **Dashboard Pages**: Processing queue, status monitoring
- **Upload Pages**: File upload and camera capture
- **Results Pages**: Results display and filtering
- **Review Pages**: Interactive review and correction tools
- **Analytics Pages**: Performance metrics and insights
- **Export Pages**: Data export and reporting

### Services
- **API Service**: Centralized API calls and mock data
- **Type Definitions**: TypeScript interfaces for all data structures
- **Constants**: Application-wide constants and configuration

## 🔧 Key Features

### Type Safety
- Comprehensive TypeScript interfaces in `types/index.ts`
- Strongly typed API responses and component props
- Type-safe navigation and state management

### Modular Design
- Feature-based page organization
- Reusable component architecture
- Separation of concerns between UI and business logic

### Scalability
- Easy to add new features by creating new page folders
- Component reusability across different pages
- Centralized configuration and constants

## 🚀 Getting Started

1. **Install Dependencies**:
   ```bash
   npm install
   ```

2. **Start Development Server**:
   ```bash
   npm run dev
   ```

3. **Build for Production**:
   ```bash
   npm run build
   ```

## 📝 Adding New Features

### Adding a New Page
1. Create a new folder in `src/pages/[feature-name]/`
2. Add your page component
3. Update the routing in `App.tsx`
4. Add navigation item to `constants/index.ts`

### Adding a New Component
1. Determine if it's UI, layout, feature, or common
2. Place in appropriate `components/` subfolder
3. Export from the component file
4. Import where needed

### Adding New Types
1. Add interfaces to `types/index.ts`
2. Use throughout the application for type safety
3. Update API services to use new types

## 🔗 Integration Points

This frontend structure is designed to easily integrate with:
- **Backend API**: Update `services/api.ts` with real endpoints
- **Authentication**: Extend auth pages and services
- **State Management**: Add Redux/Zustand if needed
- **Testing**: Add test files alongside components
- **Documentation**: Add Storybook for component documentation

## 📋 Next Steps

When adding the backend:
1. Replace mock API calls in `services/api.ts`
2. Add proper error handling and loading states
3. Implement real authentication flow
4. Add environment-specific configuration
5. Set up proper API client with interceptors
