'use client';

import * as React from 'react';
import FullCalendar from '@fullcalendar/react';
import dayGridPlugin from '@fullcalendar/daygrid';
import timeGridPlugin from '@fullcalendar/timegrid';
import interactionPlugin from '@fullcalendar/interaction';
import { TaskItem } from '@/lib/validation';
import { Card, CardHeader, CardTitle, CardDescription, CardContent } from '@/components/ui/card';
import { Calendar as CalendarIcon, Info } from 'lucide-react';

interface TaskCalendarProps {
  tasks: TaskItem[];
  onTaskClick: (task: TaskItem) => void;
  onDateClick: (dateStr: string) => void;
}

export function TaskCalendar({
  tasks,
  onTaskClick,
  onDateClick,
}: TaskCalendarProps) {
  // Map tasks with deadlines to FullCalendar events
  const events = React.useMemo(() => {
    return tasks
      .filter((task) => task.deadline !== null && task.deadline !== undefined)
      .map((task) => {
        let backgroundColor = '#475569';
        let borderColor = '#334155';

        if (task.type === 'exam') {
          backgroundColor = '#e11d48'; // Rose 600
          borderColor = '#be123c';
        } else if (task.type === 'assignment') {
          backgroundColor = '#4f46e5'; // Indigo 600
          borderColor = '#4338ca';
        }

        const isCompleted = task.status === 'completed';
        const title = isCompleted ? `✓ ${task.title}` : task.title;

        return {
          id: String(task.id),
          title,
          start: task.deadline!,
          allDay: true,
          backgroundColor: isCompleted ? '#71717a' : backgroundColor,
          borderColor: isCompleted ? '#52525b' : borderColor,
          textColor: '#ffffff',
          extendedProps: {
            task,
          },
        };
      });
  }, [tasks]);

  const handleEventClick = (clickInfo: { event: { extendedProps: { task?: TaskItem }; id: string } }) => {
    const task = clickInfo.event.extendedProps.task;
    if (task) {
      onTaskClick(task);
    } else {
      const found = tasks.find((t) => String(t.id) === clickInfo.event.id);
      if (found) onTaskClick(found);
    }
  };

  const handleDateClick = (arg: { dateStr: string }) => {
    onDateClick(arg.dateStr);
  };

  return (
    <Card className="overflow-hidden">
      <CardHeader className="pb-3 border-b border-zinc-100 dark:border-zinc-800/80">
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2">
          <div>
            <CardTitle className="text-base flex items-center gap-2">
              <CalendarIcon className="h-4 w-4 text-zinc-500" />
              Academic Calendar
            </CardTitle>
            <CardDescription>
              Deadlines for exams, assignments, and tasks. Click any date to add a deadline.
            </CardDescription>
          </div>

          {/* Color legend */}
          <div className="flex items-center gap-3 text-xs text-zinc-600 dark:text-zinc-400">
            <div className="flex items-center gap-1.5">
              <span className="h-2 w-2 rounded-full bg-rose-600" />
              <span>Exam</span>
            </div>
            <div className="flex items-center gap-1.5">
              <span className="h-2 w-2 rounded-full bg-indigo-600" />
              <span>Assignment</span>
            </div>
            <div className="flex items-center gap-1.5">
              <span className="h-2 w-2 rounded-full bg-slate-600" />
              <span>General</span>
            </div>
          </div>
        </div>
      </CardHeader>

      <CardContent className="p-4 sm:p-6">
        <div className="fullcalendar-wrapper">
          <FullCalendar
            plugins={[dayGridPlugin, timeGridPlugin, interactionPlugin]}
            initialView="dayGridMonth"
            headerToolbar={{
              left: 'prev,next today',
              center: 'title',
              right: 'dayGridMonth,timeGridWeek',
            }}
            events={events}
            eventClick={handleEventClick}
            dateClick={handleDateClick}
            height="auto"
            aspectRatio={1.5}
            dayMaxEvents={3}
            editable={false}
            selectable={true}
          />
        </div>

        <div className="mt-4 flex items-center gap-2 text-xs text-zinc-400 dark:text-zinc-500">
          <Info className="h-3.5 w-3.5" />
          <span>Events represent deadlines. Tasks without deadlines are listed on the checklist only.</span>
        </div>
      </CardContent>
    </Card>
  );
}
