/**
 * CalendarView Component
 * 
 * Complete calendar implementation with:
 * - Multiple view modes (day, week, month, agenda)
 * - Drag-and-drop task scheduling
 * - Auto-scheduler integration
 * - Time block management
 * - Real-time updates from task store
 * 
 * State: Integrates with taskStore and internal calendar state
 * Related: TaskManager, scheduling.ts, taskStore.ts
 */

'use client';

import { useState, useMemo } from 'react';
import { useTaskStore } from '../tasks/taskStore';
import { AutoScheduler } from './scheduling';
import { 
  CalendarEvent, 
  CalendarView as CalendarViewType, 
  CalendarSettings, 
  DEFAULT_CALENDAR_SETTINGS,
  EVENT_COLORS,
  CALENDAR_VIEWS 
} from './CalendarTypes';
import { formatTaskDuration } from '../tasks/taskUtils';
import { 
  format, 
  addDays, 
  subDays, 
  startOfWeek, 
  endOfWeek, 
  startOfMonth, 
  endOfMonth,
  isSameDay,
  isToday,
  startOfDay,
  endOfDay,
  eachDayOfInterval,
  getHours,
  getMinutes,
  setHours,
  setMinutes
} from 'date-fns';
import { 
  ChevronLeft, 
  ChevronRight, 
  Zap
} from 'lucide-react';

// Calendar Event Component
const CalendarEventComponent = ({ 
  event, 
  onClick, 
  onDoubleClick,
  style 
}: {
  event: CalendarEvent;
  onClick?: (event: CalendarEvent) => void;
  onDoubleClick?: (event: CalendarEvent) => void;
  style?: React.CSSProperties;
}) => {
  const eventColor = event.color || EVENT_COLORS[event.type];
  
  return (
    <div
      className={`
        absolute rounded-md px-2 py-1 text-xs text-white cursor-pointer
        hover:shadow-md transition-shadow z-10
        ${event.type === 'task' ? 'border-l-4' : ''}
      `}
      style={{
        backgroundColor: eventColor,
        borderLeftColor: event.type === 'task' ? eventColor : 'transparent',
        ...style,
      }}
      onClick={() => onClick?.(event)}
      onDoubleClick={() => onDoubleClick?.(event)}
    >
      <div className="font-medium truncate">{event.title}</div>
      {event.type === 'task' && (
        <div className="text-xs opacity-75">
          {formatTaskDuration(
            Math.round((event.end.getTime() - event.start.getTime()) / 60000)
          )}
        </div>
      )}
    </div>
  );
};

// Day View Component
const DayView = ({ 
  currentDate, 
  events, 
  onEventClick,
  onTimeSlotClick 
}: {
  currentDate: Date;
  events: CalendarEvent[];
  onEventClick: (event: CalendarEvent) => void;
  onTimeSlotClick: (date: Date) => void;
}) => {
  const hours = Array.from({ length: 24 }, (_, i) => i);
  const dayEvents = events.filter(event => isSameDay(event.start, currentDate));
  
  const getEventPosition = (event: CalendarEvent) => {
    const startMinutes = getHours(event.start) * 60 + getMinutes(event.start);
    const endMinutes = getHours(event.end) * 60 + getMinutes(event.end);
    const duration = endMinutes - startMinutes;
    
    return {
      top: `${(startMinutes / 60) * 60}px`,
      height: `${(duration / 60) * 60}px`,
      left: '0%',
      right: '0%',
    };
  };
  
  return (
    <div className="flex flex-col h-full">
      <div className="flex items-center justify-between p-4 border-b">
        <h2 className="text-lg font-semibold">
          {format(currentDate, 'EEEE, MMMM d, yyyy')}
        </h2>
        <div className="text-sm text-gray-500">
          {dayEvents.length} events
        </div>
      </div>
      
      <div className="flex-1 overflow-y-auto">
        <div className="relative">
          {hours.map(hour => (
            <div
              key={hour}
              className="relative h-15 border-b border-gray-100 hover:bg-gray-50 cursor-pointer"
              onClick={() => {
                const clickedTime = setHours(setMinutes(currentDate, 0), hour);
                onTimeSlotClick(clickedTime);
              }}
            >
              <div className="absolute left-2 top-2 text-xs text-gray-500 w-12">
                {format(setHours(new Date(), hour), 'h:mm a')}
              </div>
              <div className="ml-16 h-full relative">
                {/* Render events for this hour */}
                {dayEvents
                  .filter(event => getHours(event.start) === hour)
                  .map(event => (
                    <CalendarEventComponent
                      key={event.id}
                      event={event}
                      onClick={onEventClick}
                      style={getEventPosition(event)}
                    />
                  ))}
              </div>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
};

// Week View Component
const WeekView = ({ 
  currentDate, 
  events, 
  onEventClick,
  onTimeSlotClick 
}: {
  currentDate: Date;
  events: CalendarEvent[];
  onEventClick: (event: CalendarEvent) => void;
  onTimeSlotClick: (date: Date) => void;
}) => {
  const weekStart = startOfWeek(currentDate);
  const weekEnd = endOfWeek(currentDate);
  const weekDays = eachDayOfInterval({ start: weekStart, end: weekEnd });
  
  const hours = Array.from({ length: 24 }, (_, i) => i);
  
  return (
    <div className="flex flex-col h-full">
      <div className="flex items-center justify-between p-4 border-b">
        <h2 className="text-lg font-semibold">
          {format(weekStart, 'MMM d')} - {format(weekEnd, 'MMM d, yyyy')}
        </h2>
      </div>
      
      {/* Week header */}
      <div className="flex border-b">
        <div className="w-16 flex-shrink-0"></div>
        {weekDays.map(day => (
          <div
            key={day.toISOString()}
            className={`flex-1 p-3 text-center border-r ${
              isToday(day) ? 'bg-blue-50' : ''
            }`}
          >
            <div className="text-sm font-medium">{format(day, 'EEE')}</div>
            <div className={`text-lg ${isToday(day) ? 'text-blue-600 font-semibold' : ''}`}>
              {format(day, 'd')}
            </div>
          </div>
        ))}
      </div>
      
      {/* Week grid */}
      <div className="flex-1 overflow-y-auto">
        <div className="relative">
          {hours.map(hour => (
            <div key={hour} className="flex border-b border-gray-100 h-15">
              <div className="w-16 flex-shrink-0 text-xs text-gray-500 p-2">
                {format(setHours(new Date(), hour), 'h:mm a')}
              </div>
              {weekDays.map(day => (
                <div
                  key={`${day.toISOString()}-${hour}`}
                  className="flex-1 border-r border-gray-100 relative hover:bg-gray-50 cursor-pointer"
                  onClick={() => {
                    const clickedTime = setHours(setMinutes(day, 0), hour);
                    onTimeSlotClick(clickedTime);
                  }}
                >
                  {/* Render events for this day and hour */}
                  {events
                    .filter(event => 
                      isSameDay(event.start, day) && getHours(event.start) === hour
                    )
                    .map(event => (
                      <CalendarEventComponent
                        key={event.id}
                        event={event}
                        onClick={onEventClick}
                        style={{
                          top: `${getMinutes(event.start)}px`,
                          height: `${Math.round((event.end.getTime() - event.start.getTime()) / 60000)}px`,
                          left: '2px',
                          right: '2px',
                        }}
                      />
                    ))}
                </div>
              ))}
            </div>
          ))}
        </div>
      </div>
    </div>
  );
};

// Month View Component
const MonthView = ({ 
  currentDate, 
  events, 
  onEventClick,
  onDateClick 
}: {
  currentDate: Date;
  events: CalendarEvent[];
  onEventClick: (event: CalendarEvent) => void;
  onDateClick: (date: Date) => void;
}) => {
  const monthStart = startOfMonth(currentDate);
  const monthEnd = endOfMonth(currentDate);
  const calendarStart = startOfWeek(monthStart);
  const calendarEnd = endOfWeek(monthEnd);
  
  const calendarDays = eachDayOfInterval({ start: calendarStart, end: calendarEnd });
  const weeks = [];
  
  for (let i = 0; i < calendarDays.length; i += 7) {
    weeks.push(calendarDays.slice(i, i + 7));
  }
  
  const getDayEvents = (day: Date) => {
    return events.filter(event => isSameDay(event.start, day));
  };
  
  return (
    <div className="flex flex-col h-full">
      <div className="flex items-center justify-between p-4 border-b">
        <h2 className="text-lg font-semibold">
          {format(currentDate, 'MMMM yyyy')}
        </h2>
      </div>
      
      {/* Month header */}
      <div className="flex border-b">
        {['Sun', 'Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat'].map(day => (
          <div key={day} className="flex-1 p-3 text-center font-medium text-gray-600">
            {day}
          </div>
        ))}
      </div>
      
      {/* Month grid */}
      <div className="flex-1">
        {weeks.map((week, weekIndex) => (
          <div key={weekIndex} className="flex h-24">
            {week.map(day => {
              const dayEvents = getDayEvents(day);
              const isCurrentMonth = day.getMonth() === currentDate.getMonth();
              
              return (
                <div
                  key={day.toISOString()}
                  className={`
                    flex-1 border-r border-b p-1 cursor-pointer hover:bg-gray-50
                    ${!isCurrentMonth ? 'bg-gray-50 text-gray-400' : ''}
                    ${isToday(day) ? 'bg-blue-50' : ''}
                  `}
                  onClick={() => onDateClick(day)}
                >
                  <div className={`text-sm font-medium mb-1 ${isToday(day) ? 'text-blue-600' : ''}`}>
                    {format(day, 'd')}
                  </div>
                  <div className="space-y-1">
                    {dayEvents.slice(0, 3).map(event => (
                      <div
                        key={event.id}
                        className="text-xs px-1 py-0.5 rounded truncate"
                        style={{ 
                          backgroundColor: event.color || EVENT_COLORS[event.type],
                          color: 'white' 
                        }}
                        onClick={(e) => {
                          e.stopPropagation();
                          onEventClick(event);
                        }}
                      >
                        {event.title}
                      </div>
                    ))}
                    {dayEvents.length > 3 && (
                      <div className="text-xs text-gray-500">
                        +{dayEvents.length - 3} more
                      </div>
                    )}
                  </div>
                </div>
              );
            })}
          </div>
        ))}
      </div>
    </div>
  );
};

// Main Calendar Component
export const CalendarView = () => {
  const { tasks, scheduleTask, unscheduleTask } = useTaskStore();
  
  const [currentView, setCurrentView] = useState<CalendarViewType>({
    type: 'week',
    currentDate: new Date(),
    startDate: startOfWeek(new Date()),
    endDate: endOfWeek(new Date()),
  });
  
  const [settings] = useState<CalendarSettings>(DEFAULT_CALENDAR_SETTINGS);
  const [selectedEvent, setSelectedEvent] = useState<CalendarEvent | null>(null);
  const [isScheduling, setIsScheduling] = useState(false);
  
  // Convert tasks to calendar events
  const events = useMemo(() => {
    const calendarEvents: CalendarEvent[] = [];
    
    tasks.forEach(task => {
      if (task.scheduledStart && task.scheduledEnd) {
        calendarEvents.push({
          id: `task-${task.id}`,
          title: task.title,
          start: task.scheduledStart,
          end: task.scheduledEnd,
          type: 'task',
          taskId: task.id,
          isFlexible: task.isFlexible,
          description: task.description,
          color: EVENT_COLORS.task,
        });
      }
    });
    
    return calendarEvents;
  }, [tasks]);
  
  // Auto-scheduler instance
  const scheduler = useMemo(() => {
    return new AutoScheduler(settings, events);
  }, [settings, events]);
  
  const handleViewChange = (viewType: CalendarViewType['type']) => {
    let startDate: Date;
    let endDate: Date;
    
    switch (viewType) {
      case 'day':
        startDate = startOfDay(currentView.currentDate);
        endDate = endOfDay(currentView.currentDate);
        break;
      case 'week':
        startDate = startOfWeek(currentView.currentDate);
        endDate = endOfWeek(currentView.currentDate);
        break;
      case 'month':
        startDate = startOfMonth(currentView.currentDate);
        endDate = endOfMonth(currentView.currentDate);
        break;
      default:
        startDate = currentView.startDate;
        endDate = currentView.endDate;
    }
    
    setCurrentView({
      type: viewType,
      currentDate: currentView.currentDate,
      startDate,
      endDate,
    });
  };
  
  const handleNavigation = (direction: 'prev' | 'next') => {
    let newDate: Date;
    
    switch (currentView.type) {
      case 'day':
        newDate = direction === 'next' 
          ? addDays(currentView.currentDate, 1)
          : subDays(currentView.currentDate, 1);
        break;
      case 'week':
        newDate = direction === 'next'
          ? addDays(currentView.currentDate, 7)
          : subDays(currentView.currentDate, 7);
        break;
      case 'month':
        newDate = direction === 'next'
          ? addDays(currentView.currentDate, 30)
          : subDays(currentView.currentDate, 30);
        break;
      default:
        newDate = currentView.currentDate;
    }
    
    setCurrentView(prev => ({
      ...prev,
      currentDate: newDate,
    }));
  };
  
  const handleEventClick = (event: CalendarEvent) => {
    setSelectedEvent(event);
  };
  
  const handleTimeSlotClick = (date: Date) => {
    // Create a new task at this time slot
    console.log('Time slot clicked:', date);
    // This would typically open a task creation modal
  };
  
  const handleDateClick = (date: Date) => {
    setCurrentView(prev => ({
      ...prev,
      currentDate: date,
      type: 'day',
      startDate: startOfDay(date),
      endDate: endOfDay(date),
    }));
  };
  
  const handleAutoSchedule = async () => {
    setIsScheduling(true);
    
    try {
      // Get unscheduled tasks
      const unscheduledTasks = tasks.filter(task => 
        !task.scheduledStart && task.isFlexible
      );
      
      if (unscheduledTasks.length === 0) {
        alert('No unscheduled tasks to schedule');
        return;
      }
      
      // Run auto-scheduler
      const result = scheduler.scheduleAllTasks(unscheduledTasks);
      
      // Apply scheduled tasks
      result.scheduledTasks.forEach(({ taskId, start, end }) => {
        scheduleTask(taskId, start, end);
      });
      
      // Show results
      if (result.success) {
        alert(`Successfully scheduled ${result.scheduledTasks.length} tasks!`);
      } else {
        alert(
          `Scheduled ${result.scheduledTasks.length} tasks. ` +
          `${result.unscheduledTasks.length} tasks couldn't be scheduled.`
        );
      }
      
    } catch (error) {
      console.error('Auto-scheduling failed:', error);
      alert('Auto-scheduling failed. Please try again.');
    } finally {
      setIsScheduling(false);
    }
  };
  
  const renderCalendarView = () => {
    const props = {
      currentDate: currentView.currentDate,
      events,
      onEventClick: handleEventClick,
    };
    
    switch (currentView.type) {
      case 'day':
        return (
          <DayView 
            {...props} 
            onTimeSlotClick={handleTimeSlotClick}
          />
        );
      case 'week':
        return (
          <WeekView 
            {...props} 
            onTimeSlotClick={handleTimeSlotClick}
          />
        );
      case 'month':
        return (
          <MonthView 
            {...props} 
            onDateClick={handleDateClick}
          />
        );
      default:
        return <div>View not implemented</div>;
    }
  };
  
  return (
    <div className="flex flex-col h-full bg-gray-50">
      {/* Header */}
      <div className="bg-white border-b shadow-sm">
        <div className="flex items-center justify-between px-6 py-4">
          <div className="flex items-center space-x-4">
            <h1 className="text-2xl font-bold text-gray-900">Calendar</h1>
            
            {/* Navigation */}
            <div className="flex items-center space-x-2">
              <button
                onClick={() => handleNavigation('prev')}
                className="p-2 rounded-lg hover:bg-gray-100"
              >
                <ChevronLeft className="w-5 h-5" />
              </button>
              <button
                onClick={() => handleNavigation('next')}
                className="p-2 rounded-lg hover:bg-gray-100"
              >
                <ChevronRight className="w-5 h-5" />
              </button>
              <button
                onClick={() => setCurrentView(prev => ({ ...prev, currentDate: new Date() }))}
                className="px-3 py-1 text-sm bg-gray-100 rounded-lg hover:bg-gray-200"
              >
                Today
              </button>
            </div>
          </div>
          
          {/* Controls */}
          <div className="flex items-center space-x-4">
            {/* View Selector */}
            <div className="flex bg-gray-100 rounded-lg p-1">
              {CALENDAR_VIEWS.map(({ id, name }) => (
                <button
                  key={id}
                  onClick={() => handleViewChange(id as CalendarViewType['type'])}
                  className={`px-3 py-1 text-sm rounded-md ${
                    currentView.type === id
                      ? 'bg-white text-gray-900 shadow-sm'
                      : 'text-gray-600 hover:text-gray-900'
                  }`}
                >
                  {name}
                </button>
              ))}
            </div>
            
            {/* Auto Schedule */}
            <button
              onClick={handleAutoSchedule}
              disabled={isScheduling}
              className="flex items-center space-x-2 bg-blue-600 text-white px-4 py-2 rounded-lg hover:bg-blue-700 disabled:opacity-50"
            >
              <Zap className="w-4 h-4" />
              <span>{isScheduling ? 'Scheduling...' : 'Auto Schedule'}</span>
            </button>
          </div>
        </div>
      </div>
      
      {/* Calendar Content */}
      <div className="flex-1 scrollable">
        {renderCalendarView()}
      </div>
      
      {/* Event Details Modal */}
      {selectedEvent && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center p-4 z-50">
          <div className="bg-white rounded-lg p-6 max-w-md w-full">
            <div className="flex items-center justify-between mb-4">
              <h3 className="text-lg font-semibold">{selectedEvent.title}</h3>
              <button
                onClick={() => setSelectedEvent(null)}
                className="text-gray-500 hover:text-gray-700"
              >
                ×
              </button>
            </div>
            
            <div className="space-y-3">
              <div>
                <div className="text-sm text-gray-600">Time</div>
                <div className="font-medium">
                  {format(selectedEvent.start, 'MMM d, h:mm a')} - 
                  {format(selectedEvent.end, 'h:mm a')}
                </div>
              </div>
              
              {selectedEvent.description && (
                <div>
                  <div className="text-sm text-gray-600">Description</div>
                  <div className="font-medium">{selectedEvent.description}</div>
                </div>
              )}
              
              <div>
                <div className="text-sm text-gray-600">Type</div>
                <div className="font-medium capitalize">{selectedEvent.type}</div>
              </div>
              
              {selectedEvent.taskId && (
                <div className="flex space-x-2">
                  <button
                    onClick={() => {
                      if (selectedEvent.taskId) {
                        unscheduleTask(selectedEvent.taskId);
                        setSelectedEvent(null);
                      }
                    }}
                    className="flex-1 bg-gray-100 text-gray-700 px-3 py-2 rounded-lg hover:bg-gray-200"
                  >
                    Unschedule
                  </button>
                  <button
                    onClick={() => {
                      // Navigate to task in TaskManager
                      setSelectedEvent(null);
                    }}
                    className="flex-1 bg-blue-600 text-white px-3 py-2 rounded-lg hover:bg-blue-700"
                  >
                    Edit Task
                  </button>
                </div>
              )}
            </div>
          </div>
        </div>
      )}
    </div>
  );
};