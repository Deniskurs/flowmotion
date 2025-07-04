# FlowMotion Architecture

## AI-Friendly Design Principles

This codebase is optimized for both human readability and AI comprehension/modification.

## Component Relationships

### Enhanced Task Flow (with Authentication & Sync)
TaskManager.tsx -> taskStore.ts -> [Supabase/localStorage] -> CalendarView.tsx -> scheduling.ts
                ↓
            authStore.ts -> GoogleSignIn.tsx -> CalendarSync.tsx -> googleCalendar.ts

### Data Flow
1. User creates task in TaskManager
2. Task saved to taskStore (Zustand) with user context
3. If authenticated: save to Supabase, else localStorage
4. Auto-scheduler (scheduling.ts) processes task
5. If calendar sync enabled: sync to Google Calendar
6. CalendarView renders scheduled tasks + Google Calendar events
7. Dashboard displays analytics

### Authentication Flow
1. User signs in with Google (NextAuth.js)
2. User profile saved/updated in Supabase
3. Local tasks migrated to user's cloud storage
4. Calendar permissions requested if needed

## Directory Structure

```
src/
├── features/           # Feature-based organization
│   ├── tasks/
│   │   ├── TaskManager.tsx      # Complete task management (400 lines)
│   │   ├── TaskTypes.ts         # All task-related types + sync fields
│   │   ├── taskStore.ts         # Task state management + Supabase integration
│   │   └── taskUtils.ts         # Task helper functions
│   ├── calendar/
│   │   ├── CalendarView.tsx     # Complete calendar implementation
│   │   ├── CalendarTypes.ts     # Calendar types
│   │   └── scheduling.ts        # Auto-scheduling algorithm
│   ├── auth/                    # NEW: Authentication system
│   │   ├── GoogleSignIn.tsx     # Google OAuth components
│   │   ├── AuthTypes.ts         # Authentication types
│   │   └── authStore.ts         # Authentication state management
│   ├── calendar-sync/           # NEW: Google Calendar integration
│   │   ├── CalendarSync.tsx     # Calendar sync UI and management
│   │   ├── CalendarSyncTypes.ts # Calendar sync types
│   │   └── googleCalendar.ts    # Google Calendar API service
│   └── shared/
│       └── components/          # Truly reusable components only
├── app/
│   ├── api/auth/               # NEW: NextAuth API routes
│   ├── providers.tsx           # NEW: Session and auth providers
│   ├── layout.tsx              # Updated with providers
│   └── page.tsx                # Updated with auth integration
└── lib/
    └── supabase.ts             # NEW: Supabase configuration
```

## Key Design Decisions

### 1. Feature Cohesion Over Line Count
- Components are 200-300 lines for complete features
- Related logic stays together
- Clear section comments divide logical areas

### 2. Clear Documentation
- Each file starts with purpose comment
- Explicit component relationships
- Clear naming conventions

### 3. State Management
- Single Zustand store per feature
- Clear action names
- Predictable state updates
- **NEW**: Hybrid storage (Supabase + localStorage fallback)
- **NEW**: User-scoped data isolation

### 4. AI-Friendly Patterns
- Direct, clear code paths
- Obvious file naming
- Co-located related code
- Minimal abstractions
- **NEW**: Clear separation of concerns for auth and sync

### 5. Authentication Architecture
- NextAuth.js for OAuth handling
- Supabase for user data persistence
- Graceful degradation to local-only mode
- Automatic data migration on sign-in

### 6. Calendar Integration
- Google Calendar API service layer
- Two-way sync capabilities
- Conflict resolution and error handling
- User-configurable sync settings

## Naming Conventions

- Components: PascalCase (TaskManager.tsx, GoogleSignIn.tsx)
- Stores: camelCase + "Store" (taskStore.ts, authStore.ts)
- Types: PascalCase (TaskTypes.ts, AuthTypes.ts, CalendarSyncTypes.ts)
- Utils: camelCase + "Utils" (taskUtils.ts)
- Services: camelCase + "Service" (googleCalendarService)
- Actions: verb + noun (createTask, updateTask, connectCalendar)

## New Environment Variables Required

```env
# Authentication
GOOGLE_CLIENT_ID=your_google_client_id
GOOGLE_CLIENT_SECRET=your_google_client_secret
NEXTAUTH_SECRET=your_nextauth_secret
NEXTAUTH_URL=http://localhost:3000

# Database
SUPABASE_URL=your_supabase_url
SUPABASE_ANON_KEY=your_supabase_anon_key
SUPABASE_SERVICE_ROLE_KEY=your_supabase_service_role_key
```

## Migration Strategy

### From Local-Only to Cloud-Enabled

1. **Backwards Compatibility**: App works without authentication
2. **Graceful Upgrade**: Local tasks automatically migrate on sign-in
3. **Fallback Strategy**: If Supabase unavailable, falls back to localStorage
4. **Progressive Enhancement**: Calendar sync only available when authenticated

### Database Schema (Supabase Tables)

```sql
-- Users table
CREATE TABLE users (
  id TEXT PRIMARY KEY,
  email TEXT NOT NULL,
  name TEXT,
  avatar_url TEXT,
  google_calendar_connected BOOLEAN DEFAULT FALSE,
  google_refresh_token TEXT,
  created_at TIMESTAMP DEFAULT NOW(),
  updated_at TIMESTAMP DEFAULT NOW()
);

-- Tasks table
CREATE TABLE tasks (
  id TEXT PRIMARY KEY,
  user_id TEXT REFERENCES users(id) ON DELETE CASCADE,
  title TEXT NOT NULL,
  description TEXT,
  priority TEXT CHECK (priority IN ('low', 'medium', 'high')),
  estimated_duration INTEGER NOT NULL,
  deadline TIMESTAMP,
  category TEXT NOT NULL,
  status TEXT CHECK (status IN ('todo', 'in-progress', 'completed')),
  created_at TIMESTAMP DEFAULT NOW(),
  updated_at TIMESTAMP DEFAULT NOW(),
  scheduled_start TIMESTAMP,
  scheduled_end TIMESTAMP,
  dependencies JSONB DEFAULT '[]',
  is_flexible BOOLEAN DEFAULT TRUE,
  google_event_id TEXT,
  sync_to_calendar BOOLEAN DEFAULT FALSE
);
```

This architecture maintains all the AI-friendly principles while adding robust authentication and calendar sync capabilities.