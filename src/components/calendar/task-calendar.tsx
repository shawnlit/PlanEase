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
        let backgroundColor = '#334155'; // Slate 700
        let borderColor = '#1e293b';

        if (task.type === 'exam') {
          backgroundColor = '#be123c'; // Rose 700
          borderColor = '#9f1239';
        } else if (task.type === 'assignment') {
          backgroundColor = '#3730a3'; // Indigo 800
          borderColor = '#312e81';
        }

        const isCompleted = task.status === 'completed';
        const title = isCompleted ? `✓ ${task.title}` : task.title;
        const hasTime = task.deadline!.includes('T');

        return {
          id: String(task.id),
          title,
          start: task.deadline!,
          allDay: !hasTime,
          backgroundColor: isCompleted ? '#52525b' : backgroundColor,
          borderColor: isCompleted ? '#3f3f46' : borderColor,
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
    <Card className="overflow-hidden border border-zinc-200 dark:border-zinc-800 bg-white dark:bg-zinc-900 shadow-2xs">
      <CardHeader className="pb-3 border-b border-zinc-100 dark:border-zinc-800">
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2">
          <div>
            <CardTitle className="text-sm font-semibold flex items-center gap-2">
              <CalendarIcon className="h-4 w-4 text-zinc-500" aria-hidden="true" />
              Academic Calendar
            </CardTitle>
            <CardDescription className="text-xs">
              Deadlines and scheduled times for exams, assignments, and tasks. Click any day or time slot to schedule a task.
            </CardDescription>
          </div>

          {/* Color legend with clear text */}
          <div className="flex items-center gap-3 text-xs text-zinc-600 dark:text-zinc-400 shrink-0" aria-label="Calendar Event Types">
            <div className="flex items-center gap-1.5">
              <span className="h-2 w-2 rounded-full bg-rose-700" aria-hidden="true" />
              <span className="font-medium">Exam</span>
            </div>
            <div className="flex items-center gap-1.5">
              <span className="h-2 w-2 rounded-full bg-indigo-700" aria-hidden="true" />
              <span className="font-medium">Assignment</span>
            </div>
            <div className="flex items-center gap-1.5">
              <span className="h-2 w-2 rounded-full bg-slate-700" aria-hidden="true" />
              <span className="font-medium">General</span>
            </div>
          </div>
        </div>
      </CardHeader>

      <CardContent className="p-3 sm:p-5">
        <div className="fullcalendar-wrapper overflow-x-auto">
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
            eventTimeFormat={{
              hour: 'numeric',
              minute: '2-digit',
              meridiem: 'short',
            }}
            slotLabelFormat={{
              hour: 'numeric',
              minute: '2-digit',
              meridiem: 'short',
            }}
            slotMinTime="06:00:00"
            height="auto"
            aspectRatio={1.4}
            dayMaxEvents={3}
            editable={false}
            selectable={true}
          />
        </div>

        <div className="mt-3 flex items-center gap-1.5 text-xs text-zinc-500 dark:text-zinc-400">
          <Info className="h-3.5 w-3.5 shrink-0" aria-hidden="true" />
          <span>Events represent deadlines. Tasks without deadlines are listed on the checklist only.</span>
        </div>
      </CardContent>
    </Card>
  );
}
