/**
 * FlowMotion - Motion.app Clone
 * 
 * Main application entry point with navigation and layout
 */

'use client';

import { useState, useEffect } from 'react';
import { ModernTaskManager } from '@/features/tasks/ModernTaskManager';
import { CalendarView } from '@/features/calendar/CalendarView';
import { ModernDashboard } from '@/features/dashboard/ModernDashboard';
import { GoogleSignIn } from '@/features/auth/GoogleSignIn';
import { CalendarSync } from '@/features/calendar-sync/CalendarSync';
import { ChatWindow } from '@/components/Chat/ChatWindow';
import { useAuthStore } from '@/features/auth/authStore';
import { useTaskStore } from '@/features/tasks/taskStore';
import { 
  CheckSquare, 
  Calendar, 
  BarChart3, 
  Settings, 
  Menu,
  X,
  Mic
} from 'lucide-react';

type ActiveView = 'tasks' | 'calendar' | 'dashboard' | 'settings' | 'voice';

export default function Home() {
  const [activeView, setActiveView] = useState<ActiveView>('voice');
  const [sidebarOpen, setSidebarOpen] = useState(false);
  const { isAuthenticated, user } = useAuthStore();
  const { initializeStore, migrateLocalTasks } = useTaskStore();

  // Initialize task store and handle authentication changes
  useEffect(() => {
    initializeStore();
  }, [initializeStore]);

  // Migrate local tasks when user signs in
  useEffect(() => {
    if (isAuthenticated && user) {
      migrateLocalTasks(user.id);
    }
  }, [isAuthenticated, user, migrateLocalTasks]);

  const navigation = [
    { id: 'voice', name: 'Voice Assistant', icon: Mic },
    { id: 'tasks', name: 'Tasks', icon: CheckSquare },
    { id: 'calendar', name: 'Calendar', icon: Calendar },
    { id: 'dashboard', name: 'Dashboard', icon: BarChart3 },
    { id: 'settings', name: 'Settings', icon: Settings },
  ];

  const renderActiveView = () => {
    switch (activeView) {
      case 'voice':
        return <ChatWindow mode="scheduling" className="h-full" />;
      case 'tasks':
        return <ModernTaskManager />;
      case 'calendar':
        return <CalendarView />;
      case 'dashboard':
        return <ModernDashboard />;
      case 'settings':
        return <SettingsView />;
      default:
        return <ChatWindow mode="scheduling" className="h-full" />;
    }
  };

  const SettingsView = () => (
    <div className="p-6 max-w-4xl mx-auto space-y-6">
      <h1 className="text-3xl font-bold text-gray-900">Settings</h1>
      
      {/* Authentication Section */}
      <div>
        <h2 className="text-xl font-semibold text-gray-900 mb-4">Account</h2>
        <GoogleSignIn variant="profile" showCalendarSync={true} />
      </div>

      {/* Calendar Sync Section */}
      {isAuthenticated && user?.googleCalendarConnected && (
        <div>
          <h2 className="text-xl font-semibold text-gray-900 mb-4">Calendar Sync</h2>
          <CalendarSync variant="full" />
        </div>
      )}
    </div>
  );

  return (
    <div className="flex h-screen bg-gray-50">
      {/* Sidebar */}
      <div className={`
        fixed inset-y-0 left-0 z-50 w-64 bg-white shadow-lg transform transition-transform duration-300 ease-in-out scrollable
        ${sidebarOpen ? 'translate-x-0' : '-translate-x-full'}
        lg:translate-x-0 lg:static lg:inset-0 lg:flex-shrink-0
      `}>
        <div className="flex items-center justify-between h-16 px-4 md:px-6 border-b">
          <div className="flex items-center space-x-2 min-w-0">
            <div className="w-8 h-8 bg-blue-600 rounded-lg flex items-center justify-center flex-shrink-0">
              <CheckSquare className="w-5 h-5 text-white" />
            </div>
            <h1 className="text-lg md:text-xl font-bold text-gray-900 truncate">FlowMotion</h1>
          </div>
          <div className="flex items-center space-x-2 flex-shrink-0">
            {/* Auth status for desktop */}
            <div className="hidden lg:block">
              <GoogleSignIn variant="compact" />
            </div>
            <button
              onClick={() => setSidebarOpen(false)}
              className="lg:hidden p-2 rounded-lg hover:bg-gray-100"
            >
              <X className="w-5 h-5" />
            </button>
          </div>
        </div>
        
        <nav className="mt-6">
          {navigation.map((item) => {
            const Icon = item.icon;
            return (
              <button
                key={item.id}
                onClick={() => {
                  setActiveView(item.id as ActiveView);
                  setSidebarOpen(false);
                }}
                className={`
                  w-full flex items-center space-x-3 px-4 md:px-6 py-3 text-left
                  transition-colors hover:bg-gray-50
                  ${activeView === item.id 
                    ? 'bg-blue-50 text-blue-600 border-r-2 border-blue-600' 
                    : 'text-gray-700'
                  }
                `}
              >
                <Icon className="w-5 h-5" />
                <span className="font-medium text-sm md:text-base">{item.name}</span>
              </button>
            );
          })}
        </nav>
      </div>

      {/* Main Content */}
      <div className="flex-1 flex flex-col min-w-0 h-screen">
        {/* Mobile Header */}
        <div className="lg:hidden bg-white border-b px-4 py-3 flex items-center justify-between flex-shrink-0">
          <button
            onClick={() => setSidebarOpen(true)}
            className="p-2 rounded-lg hover:bg-gray-100 flex-shrink-0"
          >
            <Menu className="w-5 h-5" />
          </button>
          <h1 className="text-lg font-semibold truncate">FlowMotion</h1>
          {/* Auth for mobile */}
          <div className="flex-shrink-0">
            <GoogleSignIn variant="compact" />
          </div>
        </div>

        {/* Page Content */}
        <div className="flex-1 min-h-0">
          {renderActiveView()}
        </div>
      </div>

      {/* Sidebar Overlay */}
      {sidebarOpen && (
        <div 
          className="fixed inset-0 bg-black bg-opacity-50 z-40 lg:hidden"
          onClick={() => setSidebarOpen(false)}
        />
      )}
    </div>
  );
}