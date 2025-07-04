/**
 * TaskManager Component
 * 
 * Handles all task-related operations including:
 * - Task creation and editing with form validation
 * - Task list display with filtering and sorting
 * - Drag-and-drop reordering functionality
 * - Task status management and bulk operations
 * - Integration with auto-scheduler
 * 
 * State: Uses taskStore (Zustand)
 * Related: CalendarView, scheduling.ts
 */

'use client';

import { useState, useMemo } from 'react';
import { useTaskStore } from './taskStore';
import { useAuthStore } from '@/features/auth/authStore';
import { Task, TaskFormData, DEFAULT_CATEGORIES, PRIORITY_COLORS } from './TaskTypes';
import { 
  validateTaskForm, 
  formatTaskDuration, 
  formatTaskDate, 
  isTaskOverdue,
  sortTasksByScore,
  groupTasksByStatus 
} from './taskUtils';
// Removed drag-and-drop dependencies for cleaner build
import { 
  Plus, 
  Search, 
  Filter, 
  Calendar, 
  Clock, 
  AlertCircle, 
  CheckCircle2, 
  Circle, 
  Play, 
  Trash2, 
  Edit3
} from 'lucide-react';
// Voice functionality moved to main Voice Assistant

// Task Form Component
const TaskForm = ({ 
  task, 
  onSubmit, 
  onCancel 
}: { 
  task?: Task; 
  onSubmit: (data: TaskFormData) => void; 
  onCancel: () => void; 
}) => {
  const { isAuthenticated, user } = useAuthStore();
  const [formData, setFormData] = useState<TaskFormData>({
    title: task?.title || '',
    description: task?.description || '',
    priority: task?.priority || 'medium',
    estimatedDuration: task?.estimatedDuration || 60,
    deadline: task?.deadline || undefined,
    category: task?.category || 'personal',
    isFlexible: task?.isFlexible ?? true,
    dependencies: task?.dependencies || [],
    syncToCalendar: task?.syncToCalendar ?? false,
  });

  const [errors, setErrors] = useState<string[]>([]);

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    const validationErrors = validateTaskForm(formData);
    
    if (validationErrors.length > 0) {
      setErrors(validationErrors);
      return;
    }

    onSubmit(formData);
    setErrors([]);
  };

  return (
    <form onSubmit={handleSubmit} className="bg-white p-6 rounded-lg shadow-md space-y-4">
      <div className="flex items-center justify-between">
        <h3 className="text-lg font-semibold">
          {task ? 'Edit Task' : 'New Task'}
        </h3>
        <button
          type="button"
          onClick={onCancel}
          className="text-gray-500 hover:text-gray-700"
        >
          ×
        </button>
      </div>

      {errors.length > 0 && (
        <div className="bg-red-50 border border-red-200 rounded-md p-3">
          <ul className="text-sm text-red-600">
            {errors.map((error, index) => (
              <li key={index}>• {error}</li>
            ))}
          </ul>
        </div>
      )}

      <div>
        <label className="block text-sm font-medium text-gray-700 mb-1">
          Title *
        </label>
        <input
          type="text"
          value={formData.title}
          onChange={(e) => setFormData({ ...formData, title: e.target.value })}
          className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
          placeholder="Enter task title"
        />
      </div>

      <div>
        <label className="block text-sm font-medium text-gray-700 mb-1">
          Description
        </label>
        <textarea
          value={formData.description}
          onChange={(e) => setFormData({ ...formData, description: e.target.value })}
          className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
          placeholder="Enter task description"
          rows={3}
        />
      </div>

      <div className="grid grid-cols-2 gap-4">
        <div>
          <label className="block text-sm font-medium text-gray-700 mb-1">
            Priority
          </label>
          <select
            value={formData.priority}
            onChange={(e) => setFormData({ ...formData, priority: e.target.value as 'low' | 'medium' | 'high' })}
            className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
          >
            <option value="low">Low</option>
            <option value="medium">Medium</option>
            <option value="high">High</option>
          </select>
        </div>

        <div>
          <label className="block text-sm font-medium text-gray-700 mb-1">
            Category
          </label>
          <select
            value={formData.category}
            onChange={(e) => setFormData({ ...formData, category: e.target.value })}
            className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
          >
            {DEFAULT_CATEGORIES.map((cat) => (
              <option key={cat.id} value={cat.id}>
                {cat.name}
              </option>
            ))}
          </select>
        </div>
      </div>

      <div className="grid grid-cols-2 gap-4">
        <div>
          <label className="block text-sm font-medium text-gray-700 mb-1">
            Duration (minutes)
          </label>
          <input
            type="number"
            value={formData.estimatedDuration}
            onChange={(e) => setFormData({ ...formData, estimatedDuration: parseInt(e.target.value) || 0 })}
            className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
            min="1"
          />
        </div>

        <div>
          <label className="block text-sm font-medium text-gray-700 mb-1">
            Deadline
          </label>
          <input
            type="datetime-local"
            value={formData.deadline ? new Date(formData.deadline.getTime() - formData.deadline.getTimezoneOffset() * 60000).toISOString().slice(0, 16) : ''}
            onChange={(e) => setFormData({ ...formData, deadline: e.target.value ? new Date(e.target.value) : undefined })}
            className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
          />
        </div>
      </div>

      <div className="space-y-3">
        <div className="flex items-center">
          <input
            type="checkbox"
            id="isFlexible"
            checked={formData.isFlexible}
            onChange={(e) => setFormData({ ...formData, isFlexible: e.target.checked })}
            className="h-4 w-4 text-blue-600 focus:ring-blue-500 border-gray-300 rounded"
          />
          <label htmlFor="isFlexible" className="ml-2 block text-sm text-gray-700">
            Allow auto-scheduler to move this task
          </label>
        </div>

        {isAuthenticated && user?.googleCalendarConnected && (
          <div className="flex items-center">
            <input
              type="checkbox"
              id="syncToCalendar"
              checked={formData.syncToCalendar}
              onChange={(e) => setFormData({ ...formData, syncToCalendar: e.target.checked })}
              className="h-4 w-4 text-blue-600 focus:ring-blue-500 border-gray-300 rounded"
            />
            <label htmlFor="syncToCalendar" className="ml-2 block text-sm text-gray-700">
              Sync to Google Calendar
            </label>
          </div>
        )}
      </div>

      <div className="flex justify-end space-x-3">
        <button
          type="button"
          onClick={onCancel}
          className="px-4 py-2 text-gray-700 border border-gray-300 rounded-md hover:bg-gray-50"
        >
          Cancel
        </button>
        <button
          type="submit"
          className="px-4 py-2 bg-blue-600 text-white rounded-md hover:bg-blue-700"
        >
          {task ? 'Update' : 'Create'} Task
        </button>
      </div>
    </form>
  );
};

// Simple Task Item Component
const TaskItem = ({ task, onEdit, onDelete, onStatusChange }: {
  task: Task;
  onEdit: (task: Task) => void;
  onDelete: (id: string) => void;
  onStatusChange: (id: string, status: Task['status']) => void;
}) => {

  const getStatusIcon = (status: Task['status']) => {
    switch (status) {
      case 'completed':
        return <CheckCircle2 className="w-5 h-5 text-green-500" />;
      case 'in-progress':
        return <Play className="w-5 h-5 text-blue-500" />;
      default:
        return <Circle className="w-5 h-5 text-gray-400" />;
    }
  };

  const priorityColor = PRIORITY_COLORS[task.priority];
  const isOverdue = isTaskOverdue(task);

  return (
    <div
      className={`bg-white border rounded-lg p-4 hover:shadow-md transition-shadow ${
        isOverdue ? 'border-red-200' : 'border-gray-200'
      }`}
    >
      <div className="flex items-start justify-between">
        <div className="flex items-start space-x-3 flex-1">
          
          <button
            onClick={() => {
              const newStatus = task.status === 'completed' ? 'todo' : 
                              task.status === 'todo' ? 'in-progress' : 'completed';
              onStatusChange(task.id, newStatus);
            }}
            className="mt-1"
          >
            {getStatusIcon(task.status)}
          </button>

          <div className="flex-1 min-w-0">
            <div className="flex items-center space-x-2">
              <h4 className={`font-medium ${task.status === 'completed' ? 'line-through text-gray-500' : ''}`}>
                {task.title}
              </h4>
              <div
                className="w-2 h-2 rounded-full"
                style={{ backgroundColor: priorityColor }}
              />
            </div>
            
            {task.description && (
              <p className="text-sm text-gray-600 mt-1">
                {task.description}
              </p>
            )}
            
            <div className="flex items-center space-x-4 mt-2 text-sm text-gray-500">
              <span className="flex items-center space-x-1">
                <Clock className="w-4 h-4" />
                <span>{formatTaskDuration(task.estimatedDuration)}</span>
              </span>
              
              {task.deadline && (
                <span className={`flex items-center space-x-1 ${isOverdue ? 'text-red-500' : ''}`}>
                  <AlertCircle className="w-4 h-4" />
                  <span>{formatTaskDate(task.deadline)}</span>
                </span>
              )}
              
              {task.scheduledStart && (
                <span className="flex items-center space-x-1">
                  <Calendar className="w-4 h-4" />
                  <span>Scheduled: {formatTaskDate(task.scheduledStart)}</span>
                </span>
              )}
            </div>
          </div>
        </div>

        <div className="flex items-center space-x-2">
          <button
            onClick={() => onEdit(task)}
            className="p-1 text-gray-400 hover:text-blue-500"
          >
            <Edit3 className="w-4 h-4" />
          </button>
          <button
            onClick={() => onDelete(task.id)}
            className="p-1 text-gray-400 hover:text-red-500"
          >
            <Trash2 className="w-4 h-4" />
          </button>
        </div>
      </div>
    </div>
  );
};

// Main TaskManager Component
export const TaskManager = () => {
  const {
    filter,
    getFilteredTasks,
    createTask,
    updateTask,
    deleteTask,
    markCompleted,
    markInProgress,
    markTodo,
    setFilter,
    clearFilter,
  } = useTaskStore();

  const [showForm, setShowForm] = useState(false);
  const [editingTask, setEditingTask] = useState<Task | null>(null);
  const [searchTerm, setSearchTerm] = useState('');
  const [sortBy, setSortBy] = useState<'score' | 'created' | 'deadline'>('score');

  // Filter and sort tasks
  const filteredTasks = useMemo(() => {
    let filtered = getFilteredTasks();
    
    if (searchTerm) {
      filtered = filtered.filter(task =>
        task.title.toLowerCase().includes(searchTerm.toLowerCase()) ||
        task.description?.toLowerCase().includes(searchTerm.toLowerCase())
      );
    }
    
    switch (sortBy) {
      case 'score':
        return sortTasksByScore(filtered);
      case 'created':
        return filtered.sort((a, b) => b.createdAt.getTime() - a.createdAt.getTime());
      case 'deadline':
        return filtered.sort((a, b) => {
          if (!a.deadline && !b.deadline) return 0;
          if (!a.deadline) return 1;
          if (!b.deadline) return -1;
          return a.deadline.getTime() - b.deadline.getTime();
        });
      default:
        return filtered;
    }
  }, [getFilteredTasks, searchTerm, sortBy]);

  const groupedTasks = useMemo(() => {
    return groupTasksByStatus(filteredTasks);
  }, [filteredTasks]);

  const handleFormSubmit = (data: TaskFormData) => {
    if (editingTask) {
      updateTask(editingTask.id, data);
      setEditingTask(null);
    } else {
      createTask(data);
    }
    setShowForm(false);
  };

  const handleFormCancel = () => {
    setShowForm(false);
    setEditingTask(null);
  };


  const handleEdit = (task: Task) => {
    setEditingTask(task);
    setShowForm(true);
  };

  const handleStatusChange = (id: string, status: Task['status']) => {
    switch (status) {
      case 'completed':
        markCompleted(id);
        break;
      case 'in-progress':
        markInProgress(id);
        break;
      case 'todo':
        markTodo(id);
        break;
    }
  };

  // Drag and drop functionality removed for cleaner build

  return (
    <div className="h-full scrollable">
      <div className="max-w-6xl mx-auto p-4 md:p-6">
      <div className="flex items-center justify-between mb-4 md:mb-6">
        <h1 className="text-2xl md:text-3xl font-bold text-gray-900">Tasks</h1>
        <div className="flex items-center space-x-3">
          <button
            onClick={() => setShowForm(true)}
            className="flex items-center space-x-2 bg-blue-600 text-white px-3 md:px-4 py-2 rounded-lg hover:bg-blue-700"
          >
            <Plus className="w-5 h-5" />
            <span className="hidden sm:inline">New Task</span>
            <span className="sm:hidden">New</span>
          </button>
        </div>
      </div>

      {/* Search and Filter Controls */}
      <div className="mb-4 md:mb-6 space-y-4">
        <div className="flex flex-col sm:flex-row sm:items-center space-y-3 sm:space-y-0 sm:space-x-4">
          <div className="flex-1 relative">
            <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400 w-5 h-5" />
            <input
              type="text"
              placeholder="Search tasks..."
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              className="w-full pl-10 pr-4 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
            />
          </div>
          
          <select
            value={sortBy}
            onChange={(e) => setSortBy(e.target.value as 'score' | 'created' | 'deadline')}
            className="px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 w-full sm:w-auto"
          >
            <option value="score">Sort by Priority</option>
            <option value="created">Sort by Created</option>
            <option value="deadline">Sort by Deadline</option>
          </select>
        </div>

        {/* Filter Pills */}
        <div className="flex items-center space-x-2 overflow-x-auto pb-2">
          <Filter className="w-4 h-4 text-gray-500 flex-shrink-0" />
          <button
            onClick={() => setFilter({ status: 'todo' })}
            className={`px-3 py-1 rounded-full text-sm whitespace-nowrap ${
              filter.status === 'todo' 
                ? 'bg-blue-100 text-blue-700' 
                : 'bg-gray-100 text-gray-700'
            }`}
          >
            To Do
          </button>
          <button
            onClick={() => setFilter({ status: 'in-progress' })}
            className={`px-3 py-1 rounded-full text-sm whitespace-nowrap ${
              filter.status === 'in-progress' 
                ? 'bg-blue-100 text-blue-700' 
                : 'bg-gray-100 text-gray-700'
            }`}
          >
            In Progress
          </button>
          <button
            onClick={() => setFilter({ status: 'completed' })}
            className={`px-3 py-1 rounded-full text-sm whitespace-nowrap ${
              filter.status === 'completed' 
                ? 'bg-blue-100 text-blue-700' 
                : 'bg-gray-100 text-gray-700'
            }`}
          >
            Completed
          </button>
          {Object.keys(filter).length > 0 && (
            <button
              onClick={clearFilter}
              className="px-3 py-1 rounded-full text-sm bg-red-100 text-red-700 whitespace-nowrap"
            >
              Clear Filters
            </button>
          )}
        </div>
      </div>

      {/* Task Form Modal */}
      {showForm && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center p-4 z-50">
          <div className="w-full max-w-md max-h-[90vh] scrollable">
            <TaskForm
              task={editingTask || undefined}
              onSubmit={handleFormSubmit}
              onCancel={handleFormCancel}
            />
          </div>
        </div>
      )}

      {/* Voice functionality available in Voice Assistant tab */}

      {/* Task List */}
      <div className="space-y-6">
        {Object.entries(groupedTasks).map(([status, tasks]) => (
          <div key={status} className="space-y-3">
            <h2 className="text-lg font-semibold text-gray-700 capitalize">
              {status.replace('-', ' ')} ({tasks.length})
            </h2>
            
            <div className="space-y-3">
              {tasks.map((task) => (
                <TaskItem
                  key={task.id}
                  task={task}
                  onEdit={handleEdit}
                  onDelete={deleteTask}
                  onStatusChange={handleStatusChange}
                />
              ))}
            </div>
          </div>
        ))}
        </div>

        {filteredTasks.length === 0 && (
          <div className="text-center py-12">
            <div className="text-gray-400 text-lg">
              {searchTerm ? 'No tasks found matching your search.' : 'No tasks yet. Create your first task!'}
            </div>
          </div>
        )}
      </div>
    </div>
  );
};