/**
 * Task State Management Store
 * 
 * Zustand store for managing all task-related state and operations
 * Handles: task CRUD, filtering, scheduling integration, user-specific data
 * 
 * Used by: TaskManager.tsx, CalendarView.tsx
 * Related: scheduling.ts for auto-scheduling, authStore.ts for user data
 */

import { create } from 'zustand';
import { Task, TaskFormData, TaskFilter, TaskStats } from './TaskTypes';
import { supabase, isSupabaseConfigured, DatabaseTask } from '@/lib/supabase';
import { useAuthStore } from '@/features/auth/authStore';

interface TaskStore {
  // State
  tasks: Task[];
  selectedTask: Task | null;
  filter: TaskFilter;
  isLoading: boolean;
  isInitialized: boolean; // Track if store has been initialized
  
  // Task CRUD Actions
  createTask: (data: TaskFormData) => Promise<void>;
  updateTask: (id: string, data: Partial<Task>) => Promise<void>;
  deleteTask: (id: string) => Promise<void>;
  duplicateTask: (id: string) => Promise<void>;
  
  // Task Status Actions
  markCompleted: (id: string) => Promise<void>;
  markInProgress: (id: string) => Promise<void>;
  markTodo: (id: string) => Promise<void>;
  
  // Selection Actions
  selectTask: (task: Task | null) => void;
  
  // Filter Actions
  setFilter: (filter: Partial<TaskFilter>) => void;
  clearFilter: () => void;
  
  // Bulk Actions
  markMultipleCompleted: (ids: string[]) => Promise<void>;
  deleteMultipleTasks: (ids: string[]) => Promise<void>;
  
  // Schedule Actions
  scheduleTask: (id: string, start: Date, end: Date) => Promise<void>;
  unscheduleTask: (id: string) => Promise<void>;
  
  // Reorder Actions
  reorderTasks: (fromIndex: number, toIndex: number) => void;
  
  // Analytics
  getTaskStats: () => TaskStats;
  
  // Utilities
  getFilteredTasks: () => Task[];
  getTaskById: (id: string) => Task | undefined;
  getTasksByCategory: (category: string) => Task[];
  getOverdueTasks: () => Task[];
  getTasksForDate: (date: Date) => Task[];
  
  // Data Management
  loadUserTasks: (userId: string) => Promise<void>;
  migrateLocalTasks: (userId: string) => Promise<void>;
  syncWithCloud: () => Promise<void>;
  initializeStore: () => Promise<void>;
}

// Helper functions for localStorage
const STORAGE_KEY = 'flowmotion-tasks';

const saveToLocalStorage = (tasks: Task[]) => {
  try {
    localStorage.setItem(STORAGE_KEY, JSON.stringify(tasks));
  } catch (error) {
    console.error('Failed to save tasks to localStorage:', error);
  }
};

const loadFromLocalStorage = (): Task[] => {
  try {
    const stored = localStorage.getItem(STORAGE_KEY);
    if (stored) {
      const parsed = JSON.parse(stored);
      return parsed.map((task: Record<string, unknown>) => ({
        ...task,
        createdAt: new Date(task.createdAt as string),
        updatedAt: new Date(task.updatedAt as string),
        deadline: task.deadline ? new Date(task.deadline as string) : undefined,
        scheduledStart: task.scheduledStart ? new Date(task.scheduledStart as string) : undefined,
        scheduledEnd: task.scheduledEnd ? new Date(task.scheduledEnd as string) : undefined,
      }));
    }
  } catch (error) {
    console.error('Failed to load tasks from localStorage:', error);
  }
  return [];
};

// Helper to convert database task to app task
const convertDatabaseTask = (dbTask: DatabaseTask): Task => ({
  id: dbTask.id,
  title: dbTask.title,
  description: dbTask.description,
  priority: dbTask.priority,
  estimatedDuration: dbTask.estimated_duration,
  deadline: dbTask.deadline ? new Date(dbTask.deadline) : undefined,
  category: dbTask.category,
  status: dbTask.status,
  createdAt: new Date(dbTask.created_at),
  updatedAt: new Date(dbTask.updated_at),
  scheduledStart: dbTask.scheduled_start ? new Date(dbTask.scheduled_start) : undefined,
  scheduledEnd: dbTask.scheduled_end ? new Date(dbTask.scheduled_end) : undefined,
  dependencies: dbTask.dependencies || [],
  isFlexible: dbTask.is_flexible,
  userId: dbTask.user_id,
  googleEventId: dbTask.google_event_id,
  syncToCalendar: dbTask.sync_to_calendar,
});

// Helper to convert app task to database task
const convertToDatabase = (task: Task, userId: string): Omit<DatabaseTask, 'created_at' | 'updated_at'> => ({
  id: task.id,
  user_id: userId,
  title: task.title,
  description: task.description,
  priority: task.priority,
  estimated_duration: task.estimatedDuration,
  deadline: task.deadline?.toISOString(),
  category: task.category,
  status: task.status,
  scheduled_start: task.scheduledStart?.toISOString(),
  scheduled_end: task.scheduledEnd?.toISOString(),
  dependencies: task.dependencies || [],
  is_flexible: task.isFlexible,
  google_event_id: task.googleEventId,
  sync_to_calendar: task.syncToCalendar || false,
});

export const useTaskStore = create<TaskStore>((set, get) => ({
  // Initial State
  tasks: [],
  selectedTask: null,
  filter: {},
  isLoading: false,
  isInitialized: false,
  
  // Initialize store - load tasks based on auth status
  initializeStore: async () => {
    if (get().isInitialized) return;
    
    set({ isLoading: true });
    
    try {
      // Get current user from auth store
      const authState = useAuthStore.getState();
      
      if (authState.isAuthenticated && authState.user && isSupabaseConfigured()) {
        // Load user's tasks from Supabase
        await get().loadUserTasks(authState.user.id);
      } else {
        // Load tasks from localStorage
        const localTasks = loadFromLocalStorage();
        set({ tasks: localTasks });
      }
      
      set({ isInitialized: true, isLoading: false });
    } catch (error) {
      console.error('Failed to initialize task store:', error);
      set({ isLoading: false });
    }
  },
  
  // Load user tasks from Supabase
  loadUserTasks: async (userId: string) => {
    if (!isSupabaseConfigured()) return;
    
    set({ isLoading: true });
    
    try {
      const { data, error } = await supabase!
        .from('tasks')
        .select('*')
        .eq('user_id', userId)
        .order('created_at', { ascending: false });
      
      if (error) throw error;
      
      const tasks = data?.map(convertDatabaseTask) || [];
      set({ tasks, isLoading: false });
    } catch (error) {
      console.error('Failed to load user tasks:', error);
      set({ isLoading: false });
    }
  },
  
  // Migrate local tasks to cloud when user signs in
  migrateLocalTasks: async (userId: string) => {
    if (!isSupabaseConfigured()) return;
    
    const localTasks = loadFromLocalStorage();
    if (localTasks.length === 0) return;
    
    set({ isLoading: true });
    
    try {
      // Convert local tasks to database format
      const tasksToInsert = localTasks.map(task => ({
        ...convertToDatabase(task, userId),
        created_at: task.createdAt.toISOString(),
        updated_at: task.updatedAt.toISOString(),
      }));
      
      const { error } = await supabase!
        .from('tasks')
        .insert(tasksToInsert);
      
      if (error) throw error;
      
      // Clear localStorage after successful migration
      localStorage.removeItem(STORAGE_KEY);
      
      // Reload tasks from database
      await get().loadUserTasks(userId);
      
      console.log(`Migrated ${localTasks.length} tasks to cloud`);
    } catch (error) {
      console.error('Failed to migrate local tasks:', error);
      set({ isLoading: false });
    }
  },
  
  // Sync with cloud
  syncWithCloud: async () => {
    const authState = useAuthStore.getState();
    if (authState.isAuthenticated && authState.user) {
      await get().loadUserTasks(authState.user.id);
    }
  },
  
  // Task CRUD Actions
  createTask: async (data: TaskFormData) => {
    const authState = useAuthStore.getState();
    const userId = authState.user?.id;
    
    const newTask: Task = {
      id: crypto.randomUUID(),
      ...data,
      status: 'todo',
      createdAt: new Date(),
      updatedAt: new Date(),
      userId,
    };
    
    set((state) => ({
      tasks: [...state.tasks, newTask],
    }));
    
    // Save to appropriate storage
    if (userId && isSupabaseConfigured()) {
      try {
        const { error } = await supabase!
          .from('tasks')
          .insert({
            ...convertToDatabase(newTask, userId),
            created_at: newTask.createdAt.toISOString(),
            updated_at: newTask.updatedAt.toISOString(),
          });
        
        if (error) throw error;
      } catch (error) {
        console.error('Failed to save task to cloud:', error);
        // Remove from local state if cloud save failed
        set((state) => ({
          tasks: state.tasks.filter(t => t.id !== newTask.id),
        }));
      }
    } else {
      // Save to localStorage
      saveToLocalStorage(get().tasks);
    }
  },
  
  updateTask: async (id: string, data: Partial<Task>) => {
    const authState = useAuthStore.getState();
    const userId = authState.user?.id;
    
    const updatedData = { ...data, updatedAt: new Date() };
    
    set((state) => ({
      tasks: state.tasks.map((task) =>
        task.id === id
          ? { ...task, ...updatedData }
          : task
      ),
    }));
    
    // Save to appropriate storage
    if (userId && isSupabaseConfigured()) {
      try {
        const { error } = await supabase!
          .from('tasks')
          .update({
            ...convertToDatabase({ ...get().getTaskById(id)!, ...updatedData }, userId),
            updated_at: updatedData.updatedAt.toISOString(),
          })
          .eq('id', id);
        
        if (error) throw error;
      } catch (error) {
        console.error('Failed to update task in cloud:', error);
        // Revert local changes if cloud update failed
        set((state) => ({
          tasks: state.tasks.map((task) =>
            task.id === id
              ? { ...task, ...data }
              : task
          ),
        }));
      }
    } else {
      // Save to localStorage
      saveToLocalStorage(get().tasks);
    }
  },
  
  deleteTask: async (id: string) => {
    const authState = useAuthStore.getState();
    const userId = authState.user?.id;
    const taskToDelete = get().getTaskById(id);
    
    set((state) => ({
      tasks: state.tasks.filter((task) => task.id !== id),
      selectedTask: state.selectedTask?.id === id ? null : state.selectedTask,
    }));
    
    // Delete from appropriate storage
    if (userId && isSupabaseConfigured()) {
      try {
        const { error } = await supabase!
          .from('tasks')
          .delete()
          .eq('id', id);
        
        if (error) throw error;
      } catch (error) {
        console.error('Failed to delete task from cloud:', error);
        // Restore task if cloud delete failed
        if (taskToDelete) {
          set((state) => ({
            tasks: [...state.tasks, taskToDelete],
          }));
        }
      }
    } else {
      // Save to localStorage
      saveToLocalStorage(get().tasks);
    }
  },
  
  duplicateTask: async (id: string) => {
    const task = get().getTaskById(id);
    if (task) {
      const duplicatedTaskData: TaskFormData = {
        title: `${task.title} (Copy)`,
        description: task.description || '',
        priority: task.priority,
        estimatedDuration: task.estimatedDuration,
        deadline: task.deadline,
        category: task.category,
        isFlexible: task.isFlexible,
        dependencies: task.dependencies,
        syncToCalendar: false, // Don't duplicate calendar sync
      };
      
      await get().createTask(duplicatedTaskData);
    }
  },
  
  // Task Status Actions
  markCompleted: async (id: string) => {
    await get().updateTask(id, { status: 'completed' });
  },
  
  markInProgress: async (id: string) => {
    await get().updateTask(id, { status: 'in-progress' });
  },
  
  markTodo: async (id: string) => {
    await get().updateTask(id, { status: 'todo' });
  },
  
  // Selection Actions
  selectTask: (task: Task | null) => {
    set({ selectedTask: task });
  },
  
  // Filter Actions
  setFilter: (filter: Partial<TaskFilter>) => {
    set((state) => ({
      filter: { ...state.filter, ...filter },
    }));
  },
  
  clearFilter: () => {
    set({ filter: {} });
  },
  
  // Bulk Actions
  markMultipleCompleted: async (ids: string[]) => {
    // Update multiple tasks in parallel
    await Promise.all(ids.map(id => get().markCompleted(id)));
  },
  
  deleteMultipleTasks: async (ids: string[]) => {
    // Delete multiple tasks in parallel
    await Promise.all(ids.map(id => get().deleteTask(id)));
  },
  
  // Schedule Actions
  scheduleTask: async (id: string, start: Date, end: Date) => {
    await get().updateTask(id, {
      scheduledStart: start,
      scheduledEnd: end,
    });
  },
  
  unscheduleTask: async (id: string) => {
    await get().updateTask(id, {
      scheduledStart: undefined,
      scheduledEnd: undefined,
    });
  },
  
  // Reorder Actions
  reorderTasks: (fromIndex: number, toIndex: number) => {
    set((state) => {
      const tasks = [...state.tasks];
      const [movedTask] = tasks.splice(fromIndex, 1);
      tasks.splice(toIndex, 0, movedTask);
      return { tasks };
    });
  },
  
  // Analytics
  getTaskStats: (): TaskStats => {
    const tasks = get().tasks;
    const completed = tasks.filter((t) => t.status === 'completed').length;
    const inProgress = tasks.filter((t) => t.status === 'in-progress').length;
    const overdue = tasks.filter((t) => 
      t.deadline && t.deadline < new Date() && t.status !== 'completed'
    ).length;
    
    return {
      total: tasks.length,
      completed,
      inProgress,
      overdue,
      completionRate: tasks.length > 0 ? (completed / tasks.length) * 100 : 0,
      averageCompletionTime: 0, // Calculate based on actual completion times
    };
  },
  
  // Utilities
  getFilteredTasks: (): Task[] => {
    const { tasks, filter } = get();
    
    return tasks.filter((task) => {
      if (filter.status && task.status !== filter.status) return false;
      if (filter.priority && task.priority !== filter.priority) return false;
      if (filter.category && task.category !== filter.category) return false;
      if (filter.dateRange) {
        const taskDate = task.scheduledStart || task.createdAt;
        if (taskDate < filter.dateRange.start || taskDate > filter.dateRange.end) {
          return false;
        }
      }
      return true;
    });
  },
  
  getTaskById: (id: string) => {
    return get().tasks.find((task) => task.id === id);
  },
  
  getTasksByCategory: (category: string) => {
    return get().tasks.filter((task) => task.category === category);
  },
  
  getOverdueTasks: () => {
    const now = new Date();
    return get().tasks.filter((task) =>
      task.deadline && task.deadline < now && task.status !== 'completed'
    );
  },
  
  getTasksForDate: (date: Date) => {
    return get().tasks.filter((task) => {
      if (!task.scheduledStart) return false;
      const taskDate = new Date(task.scheduledStart);
      return taskDate.toDateString() === date.toDateString();
    });
  },
}));