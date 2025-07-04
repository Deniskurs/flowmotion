/**
 * Google Sign-In Component
 * 
 * Handles Google OAuth authentication with clean UI
 * Integrates with NextAuth and updates auth store
 * 
 * Used by: App header, authentication pages
 * Related: authStore.ts, NextAuth configuration
 */

'use client';

import { useState } from 'react';
import { useAuthStore } from './authStore';
import { Chrome, LogIn, LogOut, User, Calendar } from 'lucide-react';

interface GoogleSignInProps {
  variant?: 'button' | 'compact' | 'profile';
  showCalendarSync?: boolean;
}

export const GoogleSignIn = ({ 
  variant = 'button',
  showCalendarSync = false 
}: GoogleSignInProps) => {
  const { 
    user, 
    isAuthenticated, 
    isLoading, 
    error, 
    signIn, 
    signOut,
    connectGoogleCalendar,
    disconnectGoogleCalendar,
    clearError 
  } = useAuthStore();
  
  const [showDropdown, setShowDropdown] = useState(false);

  const handleSignIn = async () => {
    clearError();
    await signIn('google');
  };

  const handleSignOut = async () => {
    clearError();
    await signOut();
    setShowDropdown(false);
  };

  const handleCalendarConnect = async () => {
    clearError();
    await connectGoogleCalendar();
  };

  const handleCalendarDisconnect = async () => {
    clearError();
    await disconnectGoogleCalendar();
  };

  // Error display
  if (error) {
    return (
      <div className="bg-red-50 border border-red-200 rounded-lg p-3 text-sm text-red-600">
        {error}
        <button 
          onClick={clearError}
          className="ml-2 underline hover:no-underline"
        >
          Dismiss
        </button>
      </div>
    );
  }

  // Compact variant (for mobile)
  if (variant === 'compact') {
    if (!isAuthenticated) {
      return (
        <button
          onClick={handleSignIn}
          disabled={isLoading}
          className="flex items-center justify-center w-8 h-8 rounded-full bg-blue-600 text-white hover:bg-blue-700 disabled:opacity-50"
        >
          {isLoading ? (
            <div className="w-4 h-4 border-2 border-white border-t-transparent rounded-full animate-spin" />
          ) : (
            <LogIn className="w-4 h-4" />
          )}
        </button>
      );
    }

    return (
      <div className="relative">
        <button
          onClick={() => setShowDropdown(!showDropdown)}
          className="flex items-center justify-center w-8 h-8 rounded-full overflow-hidden bg-gray-200 hover:bg-gray-300"
        >
          {user?.image ? (
            <img 
              src={user.image} 
              alt={user.name || 'User'} 
              className="w-full h-full object-cover"
            />
          ) : (
            <User className="w-4 h-4 text-gray-600" />
          )}
        </button>

        {showDropdown && (
          <div className="absolute right-0 top-10 w-48 bg-white rounded-lg shadow-lg border z-50">
            <div className="p-3 border-b">
              <div className="font-medium text-sm text-gray-900">{user?.name}</div>
              <div className="text-xs text-gray-500">{user?.email}</div>
            </div>
            <div className="p-1">
              <button
                onClick={handleSignOut}
                className="w-full flex items-center space-x-2 px-3 py-2 text-sm text-gray-700 hover:bg-gray-100 rounded"
              >
                <LogOut className="w-4 h-4" />
                <span>Sign Out</span>
              </button>
            </div>
          </div>
        )}
      </div>
    );
  }

  // Profile variant (for settings page)
  if (variant === 'profile') {
    if (!isAuthenticated) {
      return (
        <div className="bg-gray-50 rounded-lg p-6 text-center">
          <Chrome className="w-12 h-12 mx-auto mb-4 text-gray-400" />
          <h3 className="text-lg font-semibold text-gray-900 mb-2">Sign in to sync your tasks</h3>
          <p className="text-gray-600 mb-4">
            Connect your Google account to save tasks across devices and sync with Google Calendar.
          </p>
          <button
            onClick={handleSignIn}
            disabled={isLoading}
            className="inline-flex items-center space-x-2 bg-blue-600 text-white px-4 py-2 rounded-lg hover:bg-blue-700 disabled:opacity-50"
          >
            {isLoading ? (
              <div className="w-4 h-4 border-2 border-white border-t-transparent rounded-full animate-spin" />
            ) : (
              <Chrome className="w-4 h-4" />
            )}
            <span>{isLoading ? 'Signing in...' : 'Sign in with Google'}</span>
          </button>
        </div>
      );
    }

    return (
      <div className="bg-white rounded-lg border p-6">
        <div className="flex items-center space-x-4 mb-4">
          {user?.image ? (
            <img 
              src={user.image} 
              alt={user.name || 'User'} 
              className="w-12 h-12 rounded-full"
            />
          ) : (
            <div className="w-12 h-12 bg-gray-200 rounded-full flex items-center justify-center">
              <User className="w-6 h-6 text-gray-600" />
            </div>
          )}
          <div>
            <h3 className="font-semibold text-gray-900">{user?.name}</h3>
            <p className="text-gray-600">{user?.email}</p>
          </div>
        </div>

        {showCalendarSync && (
          <div className="border-t pt-4 mt-4">
            <div className="flex items-center justify-between mb-2">
              <div className="flex items-center space-x-2">
                <Calendar className="w-4 h-4 text-gray-600" />
                <span className="text-sm font-medium text-gray-900">Google Calendar</span>
              </div>
              <span className={`text-xs px-2 py-1 rounded-full ${
                user?.googleCalendarConnected 
                  ? 'bg-green-100 text-green-700' 
                  : 'bg-gray-100 text-gray-700'
              }`}>
                {user?.googleCalendarConnected ? 'Connected' : 'Not connected'}
              </span>
            </div>
            <p className="text-xs text-gray-600 mb-3">
              {user?.googleCalendarConnected 
                ? 'Your tasks can sync with Google Calendar automatically.'
                : 'Connect to sync tasks with your Google Calendar.'
              }
            </p>
            {user?.googleCalendarConnected ? (
              <button
                onClick={handleCalendarDisconnect}
                disabled={isLoading}
                className="text-xs text-red-600 hover:text-red-700 disabled:opacity-50"
              >
                {isLoading ? 'Disconnecting...' : 'Disconnect Calendar'}
              </button>
            ) : (
              <button
                onClick={handleCalendarConnect}
                disabled={isLoading}
                className="text-xs text-blue-600 hover:text-blue-700 disabled:opacity-50"
              >
                {isLoading ? 'Connecting...' : 'Connect Calendar'}
              </button>
            )}
          </div>
        )}

        <div className="border-t pt-4 mt-4">
          <button
            onClick={handleSignOut}
            disabled={isLoading}
            className="flex items-center space-x-2 text-sm text-gray-600 hover:text-gray-800 disabled:opacity-50"
          >
            <LogOut className="w-4 h-4" />
            <span>{isLoading ? 'Signing out...' : 'Sign Out'}</span>
          </button>
        </div>
      </div>
    );
  }

  // Default button variant
  if (!isAuthenticated) {
    return (
      <button
        onClick={handleSignIn}
        disabled={isLoading}
        className="inline-flex items-center space-x-2 bg-white border border-gray-300 text-gray-700 px-4 py-2 rounded-lg hover:bg-gray-50 disabled:opacity-50 transition-colors"
      >
        {isLoading ? (
          <div className="w-4 h-4 border-2 border-gray-300 border-t-blue-600 rounded-full animate-spin" />
        ) : (
          <Chrome className="w-4 h-4 text-blue-600" />
        )}
        <span>{isLoading ? 'Signing in...' : 'Sign in with Google'}</span>
      </button>
    );
  }

  return (
    <div className="flex items-center space-x-3">
      <div className="flex items-center space-x-2">
        {user?.image ? (
          <img 
            src={user.image} 
            alt={user.name || 'User'} 
            className="w-8 h-8 rounded-full"
          />
        ) : (
          <div className="w-8 h-8 bg-gray-200 rounded-full flex items-center justify-center">
            <User className="w-4 h-4 text-gray-600" />
          </div>
        )}
        <span className="text-sm font-medium text-gray-900">{user?.name}</span>
      </div>
      <button
        onClick={handleSignOut}
        disabled={isLoading}
        className="text-sm text-gray-600 hover:text-gray-800 disabled:opacity-50"
      >
        {isLoading ? 'Signing out...' : 'Sign Out'}
      </button>
    </div>
  );
};