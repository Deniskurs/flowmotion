/**
 * Modern TaskManager Component
 * 
 * Fully modernized with shadcn/ui components, consistent with chat interface quality
 * Handles all task operations with beautiful, professional design
 */

'use client';

import { useState, useMemo } from 'react';
import { useTaskStore } from './taskStore';
import { Task, TaskFormData, DEFAULT_CATEGORIES, PRIORITY_COLORS } from './TaskTypes';
import { 
  validateTaskForm, 
  formatTaskDuration, 
  formatTaskDate, 
  isTaskOverdue,
  sortTasksByScore,
  groupTasksByStatus 
} from './taskUtils';

// Modern shadcn/ui imports
import { Card, CardContent } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Badge } from '@/components/ui/badge';
import { 
  Dialog, 
  DialogContent, 
  DialogHeader, 
  DialogTitle, 
  DialogTrigger,
  DialogFooter 
} from '@/components/ui/dialog';
import { 
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue 
} from '@/components/ui/select';
import { 
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
  DropdownMenuSeparator
} from '@/components/ui/dropdown-menu';

// Icons
import { 
  Plus, 
  Search, 
  Calendar, 
  Clock, 
  AlertCircle, 
  CheckCircle2, 
  Circle, 
  Play, 
  Trash2, 
  MoreHorizontal,
  Edit,
  Copy,
  Target
} from 'lucide-react';

export const ModernTaskManager = () => {
  const { tasks, createTask, updateTask, deleteTask, duplicateTask, filter, setFilter } = useTaskStore();
  
  // Local state
  const [showCreateModal, setShowCreateModal] = useState(false);
  const [editingTask, setEditingTask] = useState<Task | null>(null);
  const [searchQuery, setSearchQuery] = useState('');
  const [formData, setFormData] = useState<TaskFormData>({
    title: '',
    description: '',
    priority: 'medium',
    estimatedDuration: 30,
    category: DEFAULT_CATEGORIES[0].id,
    deadline: undefined,
    isFlexible: true
  });
  const [formErrors, setFormErrors] = useState<Record<string, string>>({});

  // Filter and sort tasks
  const filteredTasks = useMemo(() => {
    const filtered = tasks.filter(task => {
      const matchesSearch = task.title.toLowerCase().includes(searchQuery.toLowerCase()) ||
                           task.description?.toLowerCase().includes(searchQuery.toLowerCase());
      const matchesFilter = !filter.status || task.status === filter.status;
      const matchesPriority = !filter.priority || task.priority === filter.priority;
      const matchesCategory = !filter.category || task.category === filter.category;
      
      return matchesSearch && matchesFilter && matchesPriority && matchesCategory;
    });

    return sortTasksByScore(filtered);
  }, [tasks, searchQuery, filter]);

  // Group tasks by status
  const groupedTasks = useMemo(() => groupTasksByStatus(filteredTasks), [filteredTasks]);

  const handleCreateTask = async () => {
    const errors = validateTaskForm(formData);
    setFormErrors(errors);
    
    if (Object.keys(errors).length > 0) return;

    try {
      await createTask(formData);
      setShowCreateModal(false);
      resetForm();
    } catch (error) {
      console.error('Failed to create task:', error);
    }
  };

  const handleUpdateTask = async () => {
    if (!editingTask) return;
    
    const errors = validateTaskForm(formData);
    setFormErrors(errors);
    
    if (Object.keys(errors).length > 0) return;

    try {
      await updateTask(editingTask.id, formData);
      setEditingTask(null);
      resetForm();
    } catch (error) {
      console.error('Failed to update task:', error);
    }
  };

  const handleDeleteTask = async (taskId: string) => {
    try {
      await deleteTask(taskId);
    } catch (error) {
      console.error('Failed to delete task:', error);
    }
  };

  const handleToggleTask = async (task: Task) => {
    const newStatus = task.status === 'completed' ? 'todo' : 'completed';
    try {
      await updateTask(task.id, { status: newStatus });
    } catch (error) {
      console.error('Failed to toggle task:', error);
    }
  };

  const resetForm = () => {
    setFormData({
      title: '',
      description: '',
      priority: 'medium',
      estimatedDuration: 30,
      category: DEFAULT_CATEGORIES[0].id,
      deadline: undefined,
      isFlexible: true
    });
    setFormErrors({});
  };

  const openEditModal = (task: Task) => {
    setEditingTask(task);
    setFormData({
      title: task.title,
      description: task.description || '',
      priority: task.priority,
      estimatedDuration: task.estimatedDuration,
      category: task.category,
      deadline: task.deadline,
      isFlexible: task.isFlexible
    });
  };

  const TaskCard = ({ task }: { task: Task }) => {
    const isOverdue = isTaskOverdue(task);
    const priorityColor = PRIORITY_COLORS[task.priority];

    return (
      <Card className="hover:shadow-md transition-all duration-200 border-l-4" 
            style={{ borderLeftColor: priorityColor }}>
        <CardContent className="p-4">
          <div className="flex items-start justify-between">
            <div className="flex items-start space-x-3 flex-1">
              <Button
                variant="ghost"
                size="sm"
                onClick={() => handleToggleTask(task)}
                className="mt-1 p-0 h-6 w-6"
              >
                {task.status === 'completed' ? (
                  <CheckCircle2 className="w-5 h-5 text-green-600" />
                ) : task.status === 'in-progress' ? (
                  <Play className="w-5 h-5 text-blue-600" />
                ) : (
                  <Circle className="w-5 h-5 text-gray-400" />
                )}
              </Button>
              
              <div className="flex-1 min-w-0">
                <h3 className={`text-lg font-semibold ${
                  task.status === 'completed' ? 'line-through text-gray-500' : 'text-gray-900'
                }`}>
                  {task.title}
                </h3>
                
                {task.description && (
                  <p className="text-gray-600 text-sm mt-1">{task.description}</p>
                )}
                
                <div className="flex flex-wrap items-center gap-2 mt-3">
                  <Badge variant="secondary" style={{ backgroundColor: `${priorityColor}20`, color: priorityColor }}>
                    {task.priority}
                  </Badge>
                  
                  <Badge variant="outline" className="text-xs">
                    <Clock className="w-3 h-3 mr-1" />
                    {formatTaskDuration(task.estimatedDuration)}
                  </Badge>
                  
                  <Badge variant="outline" className="text-xs">
                    {DEFAULT_CATEGORIES.find(cat => cat.id === task.category)?.name || task.category}
                  </Badge>
                  
                  {task.deadline && (
                    <Badge variant={isOverdue ? "destructive" : "outline"} className="text-xs">
                      <Calendar className="w-3 h-3 mr-1" />
                      {formatTaskDate(task.deadline)}
                    </Badge>
                  )}
                  
                  {isOverdue && (
                    <Badge variant="destructive" className="text-xs">
                      <AlertCircle className="w-3 h-3 mr-1" />
                      Overdue
                    </Badge>
                  )}
                </div>
              </div>
            </div>
            
            <DropdownMenu>
              <DropdownMenuTrigger asChild>
                <Button variant="ghost" size="sm">
                  <MoreHorizontal className="w-4 h-4" />
                </Button>
              </DropdownMenuTrigger>
              <DropdownMenuContent>
                <DropdownMenuItem onClick={() => openEditModal(task)}>
                  <Edit className="w-4 h-4 mr-2" />
                  Edit
                </DropdownMenuItem>
                <DropdownMenuItem onClick={() => duplicateTask(task.id)}>
                  <Copy className="w-4 h-4 mr-2" />
                  Duplicate
                </DropdownMenuItem>
                <DropdownMenuSeparator />
                <DropdownMenuItem 
                  onClick={() => handleDeleteTask(task.id)}
                  className="text-red-600"
                >
                  <Trash2 className="w-4 h-4 mr-2" />
                  Delete
                </DropdownMenuItem>
              </DropdownMenuContent>
            </DropdownMenu>
          </div>
        </CardContent>
      </Card>
    );
  };

  const TaskForm = () => (
    <div className="space-y-4">
      <div>
        <label className="text-sm font-medium text-gray-700 mb-2 block">Title</label>
        <Input
          value={formData.title}
          onChange={(e) => setFormData(prev => ({ ...prev, title: e.target.value }))}
          placeholder="Enter task title..."
          className={formErrors.title ? 'border-red-500' : ''}
        />
        {formErrors.title && (
          <p className="text-red-500 text-sm mt-1">{formErrors.title}</p>
        )}
      </div>

      <div>
        <label className="text-sm font-medium text-gray-700 mb-2 block">Description</label>
        <Input
          value={formData.description}
          onChange={(e) => setFormData(prev => ({ ...prev, description: e.target.value }))}
          placeholder="Enter task description..."
        />
      </div>

      <div className="grid grid-cols-2 gap-4">
        <div>
          <label className="text-sm font-medium text-gray-700 mb-2 block">Priority</label>
          <Select 
            value={formData.priority}
            onValueChange={(value: 'low' | 'medium' | 'high') => 
              setFormData(prev => ({ ...prev, priority: value }))
            }
          >
            <SelectTrigger>
              <SelectValue />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="low">Low</SelectItem>
              <SelectItem value="medium">Medium</SelectItem>
              <SelectItem value="high">High</SelectItem>
            </SelectContent>
          </Select>
        </div>

        <div>
          <label className="text-sm font-medium text-gray-700 mb-2 block">Duration (minutes)</label>
          <Input
            type="number"
            value={formData.estimatedDuration}
            onChange={(e) => setFormData(prev => ({ 
              ...prev, 
              estimatedDuration: parseInt(e.target.value) || 30 
            }))}
            min="5"
            max="480"
          />
        </div>
      </div>

      <div>
        <label className="text-sm font-medium text-gray-700 mb-2 block">Category</label>
        <Select 
          value={formData.category}
          onValueChange={(value) => setFormData(prev => ({ ...prev, category: value }))}
        >
          <SelectTrigger>
            <SelectValue />
          </SelectTrigger>
          <SelectContent>
            {DEFAULT_CATEGORIES.map(category => (
              <SelectItem key={category.id} value={category.id}>{category.name}</SelectItem>
            ))}
          </SelectContent>
        </Select>
      </div>

      <div>
        <label className="text-sm font-medium text-gray-700 mb-2 block">Deadline (optional)</label>
        <Input
          type="datetime-local"
          value={formData.deadline ? 
            new Date(formData.deadline.getTime() - formData.deadline.getTimezoneOffset() * 60000)
              .toISOString().slice(0, 16) : ''}
          onChange={(e) => setFormData(prev => ({ 
            ...prev, 
            deadline: e.target.value ? new Date(e.target.value) : undefined 
          }))}
        />
      </div>
    </div>
  );

  return (
    <div className="space-y-6 p-6 bg-gradient-to-br from-gray-50 via-white to-gray-50 min-h-screen">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-4xl font-bold text-gray-900 mb-2">Tasks</h1>
          <p className="text-gray-600 text-lg">Manage your tasks and stay productive</p>
        </div>
        
        <Dialog open={showCreateModal} onOpenChange={setShowCreateModal}>
          <DialogTrigger asChild>
            <Button className="gap-2 bg-gradient-to-r from-blue-500 to-blue-600 hover:from-blue-600 hover:to-blue-700">
              <Plus className="w-4 h-4" />
              Add Task
            </Button>
          </DialogTrigger>
          <DialogContent>
            <DialogHeader>
              <DialogTitle>Create New Task</DialogTitle>
            </DialogHeader>
            <TaskForm />
            <DialogFooter>
              <Button variant="outline" onClick={() => setShowCreateModal(false)}>
                Cancel
              </Button>
              <Button onClick={handleCreateTask}>
                Create Task
              </Button>
            </DialogFooter>
          </DialogContent>
        </Dialog>
      </div>

      {/* Search and Filters */}
      <Card className="border-0 shadow-lg">
        <CardContent className="p-4">
          <div className="flex flex-col md:flex-row gap-4">
            <div className="flex-1 relative">
              <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400 w-4 h-4" />
              <Input
                placeholder="Search tasks..."
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                className="pl-10"
              />
            </div>
            
            <div className="flex gap-2">
              <Select value={filter.status || 'all'} onValueChange={(value) => 
                setFilter({ ...filter, status: value === 'all' ? undefined : value as 'todo' | 'in-progress' | 'completed' })
              }>
                <SelectTrigger className="w-32">
                  <SelectValue placeholder="Status" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="all">All</SelectItem>
                  <SelectItem value="todo">To Do</SelectItem>
                  <SelectItem value="in-progress">In Progress</SelectItem>
                  <SelectItem value="completed">Completed</SelectItem>
                </SelectContent>
              </Select>
              
              <Select value={filter.priority || 'all'} onValueChange={(value) => 
                setFilter({ ...filter, priority: value === 'all' ? undefined : value as 'low' | 'medium' | 'high' })
              }>
                <SelectTrigger className="w-32">
                  <SelectValue placeholder="Priority" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="all">All</SelectItem>
                  <SelectItem value="high">High</SelectItem>
                  <SelectItem value="medium">Medium</SelectItem>
                  <SelectItem value="low">Low</SelectItem>
                </SelectContent>
              </Select>
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Tasks Grid */}
      {tasks.length === 0 ? (
        <Card className="border-0 shadow-lg">
          <CardContent className="text-center py-12">
            <Target className="w-16 h-16 mx-auto text-gray-400 mb-4" />
            <h3 className="text-xl font-semibold text-gray-900 mb-2">No tasks yet</h3>
            <p className="text-gray-600 mb-6">Create your first task to get started with productivity tracking</p>
            <Button onClick={() => setShowCreateModal(true)} className="gap-2">
              <Plus className="w-4 h-4" />
              Create First Task
            </Button>
          </CardContent>
        </Card>
      ) : (
        <div className="grid gap-6">
          {Object.entries(groupedTasks).map(([status, statusTasks]) => (
            statusTasks.length > 0 && (
              <div key={status}>
                <div className="flex items-center gap-2 mb-4">
                  <h2 className="text-xl font-semibold text-gray-900 capitalize">
                    {status.replace('-', ' ')}
                  </h2>
                  <Badge variant="outline">{statusTasks.length}</Badge>
                </div>
                <div className="grid gap-3">
                  {statusTasks.map(task => (
                    <TaskCard key={task.id} task={task} />
                  ))}
                </div>
              </div>
            )
          ))}
        </div>
      )}

      {/* Edit Task Dialog */}
      <Dialog open={!!editingTask} onOpenChange={(open) => !open && setEditingTask(null)}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Edit Task</DialogTitle>
          </DialogHeader>
          <TaskForm />
          <DialogFooter>
            <Button variant="outline" onClick={() => setEditingTask(null)}>
              Cancel
            </Button>
            <Button onClick={handleUpdateTask}>
              Update Task
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
};