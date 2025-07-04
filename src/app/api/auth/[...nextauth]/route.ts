/**
 * NextAuth Configuration
 * 
 * Handles authentication with Google OAuth
 * Integrates with Supabase for user management
 * Supports Google Calendar scope for calendar integration
 */

import NextAuth, { AuthOptions } from 'next-auth';
import GoogleProvider from 'next-auth/providers/google';
import { createUserInDatabase } from '@/features/auth/authStore';

const authOptions: AuthOptions = {
  providers: [
    GoogleProvider({
      clientId: process.env.GOOGLE_CLIENT_ID!,
      clientSecret: process.env.GOOGLE_CLIENT_SECRET!,
      authorization: {
        params: {
          scope: 'openid email profile https://www.googleapis.com/auth/calendar',
        },
      },
    }),
  ],
  
  callbacks: {
    async signIn({ user, account }) {
      if (account?.provider === 'google') {
        // Create or update user in our database
        const dbUser = await createUserInDatabase({
          id: user.id,
          email: user.email!,
          name: user.name || undefined,
          image: user.image || undefined,
        });
        
        return !!dbUser;
      }
      return true;
    },
    
    async jwt({ token, account, user }) {
      // Store access token and refresh token in JWT
      if (account) {
        token.accessToken = account.access_token;
        token.refreshToken = account.refresh_token;
      }
      
      if (user) {
        token.id = user.id;
      }
      
      return token;
    },
    
    async session({ session, token }) {
      // Send properties to the client
      if (session.user) {
        session.user.id = token.id as string;
        session.accessToken = token.accessToken as string;
        session.refreshToken = token.refreshToken as string;
      }
      
      return session;
    },
  },
  
  session: {
    strategy: 'jwt',
  },
  
  pages: {
    signIn: '/auth/signin',
    error: '/auth/error',
  },
  
  events: {
    async signIn({ user, account, isNewUser }) {
      console.log('User signed in:', { user: user.email, isNewUser });
      
      // If this is a new user and they have Google Calendar access, 
      // update their calendar connection status
      if (isNewUser && account?.scope?.includes('calendar')) {
        try {
          await createUserInDatabase({
            id: user.id,
            email: user.email!,
            name: user.name || undefined,
            image: user.image || undefined,
          });
        } catch (error) {
          console.error('Failed to update user calendar status:', error);
        }
      }
    },
  },
  
  debug: process.env.NODE_ENV === 'development',
};

const handler = NextAuth(authOptions);

export { handler as GET, handler as POST };