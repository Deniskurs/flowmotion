/**
 * App Providers
 * 
 * Wraps the app with necessary providers for authentication and state management
 * Initializes user session and auth state
 */

'use client';

import { SessionProvider, useSession } from 'next-auth/react';
import { useAuthStore } from '@/features/auth/authStore';
import { useEffect } from 'react';
import { createUserInDatabase } from '@/features/auth/authStore';

// Session sync component
const SessionSync = ({ children }: { children: React.ReactNode }) => {
  const { data: session, status } = useSession();
  const { setUser, setLoading } = useAuthStore();

  useEffect(() => {
    setLoading(status === 'loading');

    if (status === 'authenticated' && session?.user) {
      // Convert NextAuth user to FlowMotion user format
      const flowMotionUser = {
        id: session.user.id,
        email: session.user.email!,
        name: session.user.name || undefined,
        image: session.user.image || undefined,
        googleCalendarConnected: false, // Will be updated by database fetch
        createdAt: new Date(),
        updatedAt: new Date(),
      };

      setUser(flowMotionUser);

      // Fetch full user data from database to get calendar connection status
      createUserInDatabase({
        id: session.user.id,
        email: session.user.email!,
        name: session.user.name || undefined,
        image: session.user.image || undefined,
      }).then(dbUser => {
        if (dbUser) {
          setUser(dbUser);
        }
      });
    } else if (status === 'unauthenticated') {
      setUser(null);
    }
  }, [session, status, setUser, setLoading]);

  return <>{children}</>;
};

export function Providers({ children }: { children: React.ReactNode }) {
  return (
    <SessionProvider>
      <SessionSync>
        {children}
      </SessionSync>
    </SessionProvider>
  );
}