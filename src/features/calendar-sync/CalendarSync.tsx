/**
 * Calendar Sync Component
 * 
 * Main interface for Google Calendar integration
 * Handles sync settings, status display, and manual sync operations
 * 
 * Used by: Settings page, Calendar view
 * Related: googleCalendar.ts, authStore.ts
 */

'use client';

import { useState, useEffect } from 'react';
import { useAuthStore } from '@/features/auth/authStore';
import { googleCalendarService } from './googleCalendar';
import { 
  CalendarSyncState, 
  DEFAULT_SYNC_SETTINGS,
  CalendarSyncResult 
} from './CalendarSyncTypes';
import { 
  Calendar, 
  RefreshCw, 
  Settings, 
  CheckCircle, 
  AlertCircle,
  Clock,
  RotateCcw,
  ChevronDown,
  ChevronRight
} from 'lucide-react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Input } from '@/components/ui/input';
import { Checkbox } from '@/components/ui/checkbox';

interface CalendarSyncProps {
  variant?: 'full' | 'compact' | 'status-only';
  onSyncComplete?: (result: CalendarSyncResult) => void;
}

export const CalendarSync = ({ 
  variant = 'full',
  onSyncComplete 
}: CalendarSyncProps) => {
  const { user, isAuthenticated } = useAuthStore();
  
  const [syncState, setSyncState] = useState<CalendarSyncState>({
    isConnected: false,
    isLoading: false,
    calendars: [],
    syncSettings: DEFAULT_SYNC_SETTINGS,
  });
  
  const [isExpanded, setIsExpanded] = useState(false);
  const [isSyncing, setIsSyncing] = useState(false);

  // Check connection status on mount
  useEffect(() => {
    if (isAuthenticated && user?.googleCalendarConnected) {
      checkConnectionStatus();
    }
  }, [isAuthenticated, user?.googleCalendarConnected]); // eslint-disable-line react-hooks/exhaustive-deps

  const checkConnectionStatus = async () => {
    setSyncState(prev => ({ ...prev, isLoading: true }));
    
    try {
      const hasPermissions = await googleCalendarService.hasCalendarPermissions();
      setSyncState(prev => ({ 
        ...prev, 
        isConnected: hasPermissions,
        isLoading: false 
      }));
      
      if (hasPermissions) {
        loadCalendars();
      }
    } catch (error) {
      setSyncState(prev => ({ 
        ...prev, 
        isConnected: false,
        isLoading: false,
        error: error instanceof Error ? error.message : 'Connection check failed'
      }));
    }
  };

  const loadCalendars = async () => {
    try {
      const calendars = await googleCalendarService.getCalendars();
      setSyncState(prev => ({ 
        ...prev, 
        calendars,
        selectedCalendarId: prev.selectedCalendarId || calendars.find(c => c.primary)?.id
      }));
    } catch (error) {
      setSyncState(prev => ({ 
        ...prev, 
        error: error instanceof Error ? error.message : 'Failed to load calendars'
      }));
    }
  };

  const performSync = async () => {
    if (!syncState.isConnected || !syncState.selectedCalendarId) {
      return;
    }

    setIsSyncing(true);
    setSyncState(prev => ({ ...prev, error: undefined }));

    try {
      // Get events from the last 30 days and next 90 days
      const timeMin = new Date();
      timeMin.setDate(timeMin.getDate() - 30);
      
      const timeMax = new Date();
      timeMax.setDate(timeMax.getDate() + 90);

      const events = await googleCalendarService.getEvents(
        syncState.selectedCalendarId,
        timeMin,
        timeMax
      );

      // Convert to our format
      const selectedCalendar = syncState.calendars.find(c => c.id === syncState.selectedCalendarId);
      if (!selectedCalendar) throw new Error('Selected calendar not found');

      const syncedEvents = googleCalendarService.convertToSyncedEvents(events, selectedCalendar);

      // Update sync state
      setSyncState(prev => ({
        ...prev,
        lastSyncTime: new Date()
      }));

      // Create sync result
      const result: CalendarSyncResult = {
        success: true,
        eventsAdded: syncedEvents.length,
        eventsUpdated: 0,
        eventsRemoved: 0,
        tasksCreated: 0,
        tasksUpdated: 0,
        errors: []
      };

      onSyncComplete?.(result);

      console.log(`Synced ${syncedEvents.length} events from Google Calendar`);
    } catch (error) {
      const errorMessage = error instanceof Error ? error.message : 'Sync failed';
      setSyncState(prev => ({ ...prev, error: errorMessage }));
      
      const result: CalendarSyncResult = {
        success: false,
        eventsAdded: 0,
        eventsUpdated: 0,
        eventsRemoved: 0,
        tasksCreated: 0,
        tasksUpdated: 0,
        errors: [errorMessage]
      };

      onSyncComplete?.(result);
    } finally {
      setIsSyncing(false);
    }
  };

  const updateSyncSettings = (updates: Partial<CalendarSyncState['syncSettings']>) => {
    setSyncState(prev => ({
      ...prev,
      syncSettings: { ...prev.syncSettings, ...updates }
    }));
    
    // Save to localStorage or user preferences
    try {
      localStorage.setItem('calendar-sync-settings', JSON.stringify({
        ...syncState.syncSettings,
        ...updates
      }));
    } catch (error) {
      console.error('Failed to save sync settings:', error);
    }
  };

  // Status-only variant
  if (variant === 'status-only') {
    if (!isAuthenticated || !user?.googleCalendarConnected) {
      return null;
    }

    return (
      <div className="flex items-center space-x-2 text-sm">
        {syncState.isConnected ? (
          <>
            <CheckCircle className="w-4 h-4 text-green-500" />
            <span className="text-green-700">Calendar connected</span>
          </>
        ) : (
          <>
            <AlertCircle className="w-4 h-4 text-amber-500" />
            <span className="text-amber-700">Calendar disconnected</span>
          </>
        )}
        {syncState.lastSyncTime && (
          <span className="text-gray-500">
            • Last sync: {syncState.lastSyncTime.toLocaleTimeString()}
          </span>
        )}
      </div>
    );
  }

  // Compact variant
  if (variant === 'compact') {
    return (
      <Card>
        <CardContent className="p-4">
          <div className="flex items-center justify-between">
            <div className="flex items-center space-x-3">
              <Calendar className="w-5 h-5 text-blue-600" />
              <div>
                <h4 className="font-medium text-gray-900">Google Calendar</h4>
                <p className="text-sm text-gray-600">
                  {syncState.isConnected ? 'Connected' : 'Not connected'}
                </p>
              </div>
            </div>
            
            {syncState.isConnected && (
              <Button
                onClick={performSync}
                disabled={isSyncing}
                className="gap-2"
              >
                <RotateCcw className={`w-4 h-4 ${isSyncing ? 'animate-spin' : ''}`} />
                <span>{isSyncing ? 'Syncing...' : 'Sync'}</span>
              </Button>
            )}
          </div>

          {syncState.error && (
            <div className="mt-3 p-2 bg-red-50 border border-red-200 rounded text-sm text-red-600">
              {syncState.error}
            </div>
          )}
        </CardContent>
      </Card>
    );
  }

  // Full variant
  return (
    <div className="space-y-6">
      {/* Connection Status */}
      <Card>
        <CardHeader>
          <div className="flex items-center justify-between">
            <div className="flex items-center space-x-3">
              <Calendar className="w-6 h-6 text-blue-600" />
              <div>
                <CardTitle className="text-lg">Google Calendar Sync</CardTitle>
                <p className="text-gray-600">
                  Sync your tasks with Google Calendar for seamless scheduling
                </p>
              </div>
            </div>
            
            <Badge variant={syncState.isConnected ? "default" : "secondary"} className={`${
              syncState.isConnected 
                ? 'bg-green-100 text-green-700' 
                : 'bg-gray-100 text-gray-700'
            }`}>
              {syncState.isConnected ? 'Connected' : 'Not connected'}
            </Badge>
          </div>
        </CardHeader>

        <CardContent>
          {syncState.isConnected && (
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4 mb-4">
              {/* Calendar Selection */}
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Default Calendar
                </label>
                <Select
                  value={syncState.selectedCalendarId || ''}
                  onValueChange={(value) => setSyncState(prev => ({ 
                    ...prev, 
                    selectedCalendarId: value 
                  }))}
                >
                  <SelectTrigger>
                    <SelectValue placeholder="Select calendar" />
                  </SelectTrigger>
                  <SelectContent>
                    {syncState.calendars.map(calendar => (
                      <SelectItem key={calendar.id} value={calendar.id}>
                        {calendar.summary} {calendar.primary ? '(Primary)' : ''}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>

              {/* Last Sync Time */}
              <div className="flex items-center space-x-2">
                <Clock className="w-4 h-4 text-gray-500" />
                <div>
                  <div className="text-sm font-medium text-gray-700">Last Sync</div>
                  <div className="text-sm text-gray-600">
                    {syncState.lastSyncTime 
                      ? syncState.lastSyncTime.toLocaleString()
                      : 'Never'
                    }
                  </div>
                </div>
              </div>
            </div>
          )}

          {/* Sync Button */}
          <div className="flex items-center space-x-3">
            <Button
              onClick={performSync}
              disabled={!syncState.isConnected || isSyncing}
              className="gap-2"
            >
              <RotateCcw className={`w-4 h-4 ${isSyncing ? 'animate-spin' : ''}`} />
              <span>{isSyncing ? 'Syncing...' : 'Sync Now'}</span>
            </Button>
            
            <Button
              variant="outline"
              onClick={checkConnectionStatus}
              disabled={syncState.isLoading}
              className="gap-2"
            >
              <RefreshCw className={`w-4 h-4 ${syncState.isLoading ? 'animate-spin' : ''}`} />
              <span>Check Status</span>
            </Button>
          </div>

          {syncState.error && (
            <div className="mt-4 p-3 bg-red-50 border border-red-200 rounded-lg text-sm text-red-600">
              <div className="flex items-center space-x-2">
                <AlertCircle className="w-4 h-4" />
                <span>{syncState.error}</span>
              </div>
            </div>
          )}
        </CardContent>
      </Card>

      {/* Sync Settings */}
      {syncState.isConnected && (
        <Card>
          <CardHeader>
            <Button
              variant="ghost"
              onClick={() => setIsExpanded(!isExpanded)}
              className="flex items-center justify-between w-full p-0 h-auto"
            >
              <div className="flex items-center space-x-2">
                <Settings className="w-5 h-5 text-gray-600" />
                <CardTitle className="text-base">Sync Settings</CardTitle>
              </div>
              {isExpanded ? (
                <ChevronDown className="w-5 h-5 text-gray-600" />
              ) : (
                <ChevronRight className="w-5 h-5 text-gray-600" />
              )}
            </Button>
          </CardHeader>

          {isExpanded && (
            <CardContent className="space-y-4 border-t pt-4">
              {/* Sync Direction */}
              <div className="flex items-center space-x-2">
                <Checkbox
                  id="sync-tasks-to-calendar"
                  checked={syncState.syncSettings.syncTasksToCalendar}
                  onCheckedChange={(checked) => updateSyncSettings({ 
                    syncTasksToCalendar: !!checked 
                  })}
                />
                <div className="grid gap-1.5 leading-none">
                  <label
                    htmlFor="sync-tasks-to-calendar"
                    className="text-sm font-medium leading-none peer-disabled:cursor-not-allowed peer-disabled:opacity-70"
                  >
                    Sync FlowMotion tasks to Google Calendar
                  </label>
                  <p className="text-xs text-gray-600">
                    Create calendar events when you schedule tasks
                  </p>
                </div>
              </div>

              <div className="flex items-center space-x-2">
                <Checkbox
                  id="sync-calendar-to-tasks"
                  checked={syncState.syncSettings.syncCalendarToTasks}
                  onCheckedChange={(checked) => updateSyncSettings({ 
                    syncCalendarToTasks: !!checked 
                  })}
                />
                <div className="grid gap-1.5 leading-none">
                  <label
                    htmlFor="sync-calendar-to-tasks"
                    className="text-sm font-medium leading-none peer-disabled:cursor-not-allowed peer-disabled:opacity-70"
                  >
                    Block time for Google Calendar events
                  </label>
                  <p className="text-xs text-gray-600">
                    Show calendar events as blocked time in FlowMotion
                  </p>
                </div>
              </div>

              {/* Other Settings */}
              <div className="flex items-center space-x-2">
                <Checkbox
                  id="include-completed-tasks"
                  checked={syncState.syncSettings.includeCompletedTasks}
                  onCheckedChange={(checked) => updateSyncSettings({ 
                    includeCompletedTasks: !!checked 
                  })}
                />
                <div className="grid gap-1.5 leading-none">
                  <label
                    htmlFor="include-completed-tasks"
                    className="text-sm font-medium leading-none peer-disabled:cursor-not-allowed peer-disabled:opacity-70"
                  >
                    Keep completed tasks in calendar
                  </label>
                </div>
              </div>

              {/* Default Duration */}
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Default task duration (minutes)
                </label>
                <Input
                  type="number"
                  min="15"
                  max="480"
                  step="15"
                  value={syncState.syncSettings.defaultTaskDuration}
                  onChange={(e) => updateSyncSettings({ 
                    defaultTaskDuration: parseInt(e.target.value) || 60 
                  })}
                  className="w-24"
                />
              </div>
            </CardContent>
          )}
        </Card>
      )}
    </div>
  );
};