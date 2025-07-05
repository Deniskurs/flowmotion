/**
 * Modern Dashboard Component
 * 
 * Fully modernized with shadcn/ui components, beautiful design patterns,
 * and consistent with the chat interface quality
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
  AlertCircle,
  ArrowUpRight,
  MoreHorizontal,
  Plus
} from 'lucide-react';

// Modern shadcn/ui imports
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Progress } from '@/components/ui/progress';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Separator } from '@/components/ui/separator';
import { 
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger 
} from '@/components/ui/dropdown-menu';

export const ModernDashboard = () => {
  const { tasks, getTaskStats, getOverdueTasks } = useTaskStore();

  // Calculate various metrics
  const stats = useMemo(() => getTaskStats(), [getTaskStats]);
  const overdueTasks = useMemo(() => getOverdueTasks(), [getOverdueTasks]);

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
        isToday: isToday(day)
      };
    });
  }, [tasks]);

  const completionRate = stats.total > 0 ? (stats.completed / stats.total) * 100 : 0;
  const weeklyCompletionRate = weeklyData.reduce((acc, day) => acc + day.percentage, 0) / 7;

  return (
    <div className="space-y-8 p-6 bg-gradient-to-br from-gray-50 via-white to-gray-50 min-h-screen">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-4xl font-bold text-gray-900 mb-2">Dashboard</h1>
          <p className="text-gray-600 text-lg">Welcome back! Here&apos;s what&apos;s happening today.</p>
        </div>
        <div className="flex gap-3">
          <Button variant="outline" className="gap-2">
            <Calendar className="w-4 h-4" />
            View Calendar
          </Button>
          <Button className="gap-2 bg-gradient-to-r from-blue-500 to-blue-600 hover:from-blue-600 hover:to-blue-700">
            <Plus className="w-4 h-4" />
            Add Task
          </Button>
        </div>
      </div>

      {/* Stats Grid */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
        {/* Total Tasks */}
        <Card className="border-0 shadow-lg bg-gradient-to-br from-blue-50 to-blue-100 hover:shadow-xl transition-all duration-200">
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium text-blue-700">Total Tasks</CardTitle>
            <Target className="h-5 w-5 text-blue-600" />
          </CardHeader>
          <CardContent>
            <div className="text-3xl font-bold text-blue-900">{stats.total}</div>
            <div className="flex items-center text-sm text-blue-600 mt-2">
              <ArrowUpRight className="w-4 h-4 mr-1" />
              <span>+12% from last week</span>
            </div>
          </CardContent>
        </Card>

        {/* Completed Tasks */}
        <Card className="border-0 shadow-lg bg-gradient-to-br from-green-50 to-green-100 hover:shadow-xl transition-all duration-200">
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium text-green-700">Completed</CardTitle>
            <CheckCircle2 className="h-5 w-5 text-green-600" />
          </CardHeader>
          <CardContent>
            <div className="text-3xl font-bold text-green-900">{stats.completed}</div>
            <div className="flex items-center justify-between mt-2">
              <span className="text-sm text-green-600">{completionRate.toFixed(1)}% completion rate</span>
              <Badge variant="secondary" className="bg-green-100 text-green-800">{stats.completed}/{stats.total}</Badge>
            </div>
          </CardContent>
        </Card>

        {/* Pending Tasks */}
        <Card className="border-0 shadow-lg bg-gradient-to-br from-amber-50 to-amber-100 hover:shadow-xl transition-all duration-200">
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium text-amber-700">Pending</CardTitle>
            <Clock className="h-5 w-5 text-amber-600" />
          </CardHeader>
          <CardContent>
            <div className="text-3xl font-bold text-amber-900">{stats.inProgress}</div>
            <div className="flex items-center text-sm text-amber-600 mt-2">
              <Activity className="w-4 h-4 mr-1" />
              <span>Active tasks</span>
            </div>
          </CardContent>
        </Card>

        {/* Overdue Tasks */}
        <Card className="border-0 shadow-lg bg-gradient-to-br from-red-50 to-red-100 hover:shadow-xl transition-all duration-200">
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium text-red-700">Overdue</CardTitle>
            <AlertCircle className="h-5 w-5 text-red-600" />
          </CardHeader>
          <CardContent>
            <div className="text-3xl font-bold text-red-900">{overdueTasks.length}</div>
            <div className="flex items-center text-sm text-red-600 mt-2">
              {overdueTasks.length > 0 ? (
                <Badge variant="destructive" className="bg-red-100 text-red-800">Needs attention</Badge>
              ) : (
                <Badge variant="secondary" className="bg-gray-100 text-gray-600">Up to date</Badge>
              )}
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Main Content Grid */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
        {/* Weekly Progress */}
        <Card className="lg:col-span-2 border-0 shadow-lg">
          <CardHeader>
            <div className="flex items-center justify-between">
              <CardTitle className="text-xl font-semibold">Weekly Progress</CardTitle>
              <DropdownMenu>
                <DropdownMenuTrigger asChild>
                  <Button variant="ghost" size="sm">
                    <MoreHorizontal className="w-4 h-4" />
                  </Button>
                </DropdownMenuTrigger>
                <DropdownMenuContent>
                  <DropdownMenuItem>View Details</DropdownMenuItem>
                  <DropdownMenuItem>Export Data</DropdownMenuItem>
                </DropdownMenuContent>
              </DropdownMenu>
            </div>
            <p className="text-gray-600">Your productivity this week</p>
          </CardHeader>
          <CardContent className="space-y-6">
            {/* Overall Weekly Progress */}
            <div className="space-y-2">
              <div className="flex items-center justify-between">
                <span className="text-sm font-medium">Overall Completion</span>
                <span className="text-sm text-gray-600">{weeklyCompletionRate.toFixed(1)}%</span>
              </div>
              <Progress value={weeklyCompletionRate} className="h-2" />
            </div>

            <Separator />

            {/* Daily Breakdown */}
            <div className="space-y-4">
              <h4 className="font-medium text-gray-900">Daily Breakdown</h4>
              <div className="grid grid-cols-7 gap-2">
                {weeklyData.map((day, index) => (
                  <div key={index} className="text-center space-y-2">
                    <div className={`text-xs font-medium ${day.isToday ? 'text-blue-600' : 'text-gray-600'}`}>
                      {day.day}
                    </div>
                    <div className="space-y-1">
                      <Progress 
                        value={day.percentage} 
                        className={`h-2 ${day.isToday ? 'bg-blue-100' : ''}`}
                      />
                      <div className="text-xs text-gray-500">
                        {day.completed}/{day.total}
                      </div>
                    </div>
                    {day.isToday && (
                      <Badge variant="secondary" className="text-xs bg-blue-100 text-blue-700">
                        Today
                      </Badge>
                    )}
                  </div>
                ))}
              </div>
            </div>
          </CardContent>
        </Card>

        {/* Quick Actions & Insights */}
        <div className="space-y-6">
          {/* Quick Actions */}
          <Card className="border-0 shadow-lg">
            <CardHeader>
              <CardTitle className="text-lg font-semibold">Quick Actions</CardTitle>
            </CardHeader>
            <CardContent className="space-y-3">
              <Button variant="outline" className="w-full justify-start gap-3 h-12">
                <Plus className="w-4 h-4" />
                Create New Task
              </Button>
              <Button variant="outline" className="w-full justify-start gap-3 h-12">
                <Calendar className="w-4 h-4" />
                Schedule Meeting
              </Button>
              <Button variant="outline" className="w-full justify-start gap-3 h-12">
                <TrendingUp className="w-4 h-4" />
                View Analytics
              </Button>
              <Button variant="outline" className="w-full justify-start gap-3 h-12">
                <Zap className="w-4 h-4" />
                AI Suggestions
              </Button>
            </CardContent>
          </Card>

          {/* Recent Activity */}
          <Card className="border-0 shadow-lg">
            <CardHeader>
              <CardTitle className="text-lg font-semibold">Recent Activity</CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              {tasks.slice(0, 3).map((task) => (
                <div key={task.id} className="flex items-center space-x-3 p-3 rounded-lg bg-gray-50 hover:bg-gray-100 transition-colors">
                  <div className={`w-2 h-2 rounded-full ${task.status === 'completed' ? 'bg-green-500' : 'bg-amber-500'}`} />
                  <div className="flex-1 min-w-0">
                    <p className="text-sm font-medium text-gray-900 truncate">{task.title}</p>
                    <p className="text-xs text-gray-500">
                      {task.priority} priority • {formatTaskDuration(task.estimatedDuration)}
                    </p>
                  </div>
                  <Badge variant={task.status === 'completed' ? "secondary" : "default"} className="text-xs">
                    {task.status === 'completed' ? "Done" : "Pending"}
                  </Badge>
                </div>
              ))}
              {tasks.length === 0 && (
                <div className="text-center py-6 text-gray-500">
                  <Activity className="w-8 h-8 mx-auto mb-2 opacity-50" />
                  <p className="text-sm">No recent activity</p>
                </div>
              )}
            </CardContent>
          </Card>
        </div>
      </div>
    </div>
  );
};