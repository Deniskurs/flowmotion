/**
 * Dashboard Component
 * 
 * Analytics and overview dashboard displaying:
 * - Task completion statistics
 * - Productivity metrics
 * - Time tracking visualizations
 * - Quick actions and insights
 * 
 * State: Uses taskStore for data
 * Related: TaskManager, CalendarView
 */

'use client';

import { useMemo } from 'react';
import { useTaskStore } from '../tasks/taskStore';
import { formatTaskDuration } from '../tasks/taskUtils';
import { format, startOfWeek, endOfWeek, eachDayOfInterval, isToday } from 'date-fns';
import { 
  CheckCircle2, 
  Clock, 
  TrendingUp, 
  Calendar,
  Target,
  Activity,
  Zap,
  AlertCircle
} from 'lucide-react';

export const Dashboard = () => {
  const { tasks, getTaskStats, getOverdueTasks } = useTaskStore();

  // Calculate various metrics
  const stats = useMemo(() => getTaskStats(), [getTaskStats]);
  const overdueTasks = useMemo(() => getOverdueTasks(), [getOverdueTasks]);
  // const completionStats = useMemo(() => getCompletionStats(tasks), [tasks]);

  // Weekly completion data
  const weeklyData = useMemo(() => {
    const now = new Date();
    const weekStart = startOfWeek(now);
    const weekEnd = endOfWeek(now);
    const weekDays = eachDayOfInterval({ start: weekStart, end: weekEnd });

    return weekDays.map(day => {
      const dayTasks = tasks.filter(task => {
        const taskDate = task.updatedAt.toDateString();
        return taskDate === day.toDateString();
      });
      
      const completed = dayTasks.filter(task => task.status === 'completed').length;
      const total = dayTasks.length;
      
      return {
        day: format(day, 'EEE'),
        date: day,
        completed,
        total,
        percentage: total > 0 ? (completed / total) * 100 : 0,
        isToday: isToday(day),
      };
    });
  }, [tasks]);

  // Priority distribution
  const priorityStats = useMemo(() => {
    const counts = { high: 0, medium: 0, low: 0 };
    tasks.forEach(task => {
      if (task.status !== 'completed') {
        counts[task.priority]++;
      }
    });
    return counts;
  }, [tasks]);

  // Category breakdown
  const categoryStats = useMemo(() => {
    const categories = new Map<string, number>();
    tasks.forEach(task => {
      const current = categories.get(task.category) || 0;
      categories.set(task.category, current + 1);
    });
    return Array.from(categories.entries())
      .map(([category, count]) => ({ category, count }))
      .sort((a, b) => b.count - a.count);
  }, [tasks]);

  // Recent activity
  const recentActivity = useMemo(() => {
    return tasks
      .filter(task => task.status === 'completed')
      .sort((a, b) => b.updatedAt.getTime() - a.updatedAt.getTime())
      .slice(0, 5);
  }, [tasks]);

  const StatCard = ({ 
    title, 
    value, 
    subtitle, 
    icon: Icon, 
    color = 'blue',
    trend 
  }: {
    title: string;
    value: string | number;
    subtitle?: string;
    icon: typeof CheckCircle2;
    color?: 'blue' | 'green' | 'orange' | 'red';
    trend?: { value: number; label: string };
  }) => {
    const colorClasses = {
      blue: 'bg-blue-50 text-blue-600',
      green: 'bg-green-50 text-green-600',
      orange: 'bg-orange-50 text-orange-600',
      red: 'bg-red-50 text-red-600',
    };

    return (
      <div className="bg-white rounded-lg shadow-sm p-6">
        <div className="flex items-center justify-between">
          <div>
            <p className="text-sm font-medium text-gray-600">{title}</p>
            <p className="text-2xl font-semibold text-gray-900">{value}</p>
            {subtitle && (
              <p className="text-sm text-gray-500 mt-1">{subtitle}</p>
            )}
          </div>
          <div className={`p-3 rounded-full ${colorClasses[color]}`}>
            <Icon className="w-6 h-6" />
          </div>
        </div>
        {trend && (
          <div className="mt-4 flex items-center">
            <TrendingUp className="w-4 h-4 text-green-500 mr-1" />
            <span className="text-sm text-gray-600">
              {trend.value > 0 ? '+' : ''}{trend.value}% {trend.label}
            </span>
          </div>
        )}
      </div>
    );
  };

  return (
    <div className="h-full scrollable">
      <div className="p-6 max-w-7xl mx-auto">
      <div className="mb-8">
        <h1 className="text-3xl font-bold text-gray-900">Dashboard</h1>
        <p className="text-gray-600 mt-2">
          Track your productivity and manage your workflow
        </p>
      </div>

      {/* Stats Grid */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6 mb-8">
        <StatCard
          title="Total Tasks"
          value={stats.total}
          subtitle="Active tasks"
          icon={Target}
          color="blue"
        />
        <StatCard
          title="Completed"
          value={stats.completed}
          subtitle={`${stats.completionRate.toFixed(1)}% completion rate`}
          icon={CheckCircle2}
          color="green"
        />
        <StatCard
          title="In Progress"
          value={stats.inProgress}
          subtitle="Currently working on"
          icon={Activity}
          color="orange"
        />
        <StatCard
          title="Overdue"
          value={overdueTasks.length}
          subtitle="Need attention"
          icon={AlertCircle}
          color="red"
        />
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6 mb-8">
        {/* Weekly Progress */}
        <div className="bg-white rounded-lg shadow-sm p-6">
          <h3 className="text-lg font-semibold text-gray-900 mb-4">
            Weekly Progress
          </h3>
          <div className="space-y-3">
            {weeklyData.map((day) => (
              <div key={day.day} className="flex items-center justify-between">
                <div className="flex items-center space-x-3">
                  <div className={`w-8 h-8 rounded-full flex items-center justify-center text-sm font-medium ${
                    day.isToday ? 'bg-blue-600 text-white' : 'bg-gray-100 text-gray-600'
                  }`}>
                    {day.day.charAt(0)}
                  </div>
                  <span className="text-sm font-medium text-gray-900">{day.day}</span>
                </div>
                <div className="flex items-center space-x-2">
                  <div className="w-32 bg-gray-200 rounded-full h-2">
                    <div 
                      className="bg-blue-600 h-2 rounded-full"
                      style={{ width: `${day.percentage}%` }}
                    />
                  </div>
                  <span className="text-sm text-gray-600 w-12 text-right">
                    {day.completed}/{day.total}
                  </span>
                </div>
              </div>
            ))}
          </div>
        </div>

        {/* Priority Breakdown */}
        <div className="bg-white rounded-lg shadow-sm p-6">
          <h3 className="text-lg font-semibold text-gray-900 mb-4">
            Priority Breakdown
          </h3>
          <div className="space-y-4">
            {Object.entries(priorityStats).map(([priority, count]) => {
              const colors = {
                high: 'bg-red-500',
                medium: 'bg-yellow-500',
                low: 'bg-green-500',
              };
              
              return (
                <div key={priority} className="flex items-center justify-between">
                  <div className="flex items-center space-x-3">
                    <div className={`w-3 h-3 rounded-full ${colors[priority as keyof typeof colors]}`} />
                    <span className="text-sm font-medium text-gray-900 capitalize">
                      {priority} Priority
                    </span>
                  </div>
                  <span className="text-sm text-gray-600">{count} tasks</span>
                </div>
              );
            })}
          </div>
        </div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* Recent Activity */}
        <div className="bg-white rounded-lg shadow-sm p-6">
          <h3 className="text-lg font-semibold text-gray-900 mb-4">
            Recent Completions
          </h3>
          <div className="space-y-3">
            {recentActivity.length > 0 ? (
              recentActivity.map((task) => (
                <div key={task.id} className="flex items-center space-x-3">
                  <CheckCircle2 className="w-5 h-5 text-green-500" />
                  <div className="flex-1 min-w-0">
                    <p className="text-sm font-medium text-gray-900 truncate">
                      {task.title}
                    </p>
                    <p className="text-xs text-gray-500">
                      {format(task.updatedAt, 'MMM d, h:mm a')}
                    </p>
                  </div>
                  <div className="text-xs text-gray-500">
                    {formatTaskDuration(task.estimatedDuration)}
                  </div>
                </div>
              ))
            ) : (
              <div className="text-center py-8 text-gray-500">
                <CheckCircle2 className="w-12 h-12 mx-auto mb-3 text-gray-300" />
                <p>No completed tasks yet</p>
              </div>
            )}
          </div>
        </div>

        {/* Category Distribution */}
        <div className="bg-white rounded-lg shadow-sm p-6">
          <h3 className="text-lg font-semibold text-gray-900 mb-4">
            Category Distribution
          </h3>
          <div className="space-y-3">
            {categoryStats.length > 0 ? (
              categoryStats.map(({ category, count }) => (
                <div key={category} className="flex items-center justify-between">
                  <div className="flex items-center space-x-3">
                    <div className="w-3 h-3 rounded-full bg-blue-500" />
                    <span className="text-sm font-medium text-gray-900 capitalize">
                      {category}
                    </span>
                  </div>
                  <span className="text-sm text-gray-600">{count} tasks</span>
                </div>
              ))
            ) : (
              <div className="text-center py-8 text-gray-500">
                <Target className="w-12 h-12 mx-auto mb-3 text-gray-300" />
                <p>No categories yet</p>
              </div>
            )}
          </div>
        </div>
      </div>

      {/* Quick Actions */}
      <div className="mt-8 bg-white rounded-lg shadow-sm p-6">
        <h3 className="text-lg font-semibold text-gray-900 mb-4">
          Quick Actions
        </h3>
        <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
          <button className="flex items-center space-x-3 p-4 border border-gray-200 rounded-lg hover:bg-gray-50 transition-colors">
            <Zap className="w-5 h-5 text-blue-600" />
            <div className="text-left">
              <p className="font-medium text-gray-900">Auto-Schedule</p>
              <p className="text-sm text-gray-500">Schedule unplanned tasks</p>
            </div>
          </button>
          <button className="flex items-center space-x-3 p-4 border border-gray-200 rounded-lg hover:bg-gray-50 transition-colors">
            <Calendar className="w-5 h-5 text-green-600" />
            <div className="text-left">
              <p className="font-medium text-gray-900">Plan Week</p>
              <p className="text-sm text-gray-500">Review upcoming tasks</p>
            </div>
          </button>
          <button className="flex items-center space-x-3 p-4 border border-gray-200 rounded-lg hover:bg-gray-50 transition-colors">
            <Clock className="w-5 h-5 text-orange-600" />
            <div className="text-left">
              <p className="font-medium text-gray-900">Time Tracking</p>
              <p className="text-sm text-gray-500">Start focused work session</p>
            </div>
          </button>
        </div>
      </div>
      </div>
    </div>
  );
};