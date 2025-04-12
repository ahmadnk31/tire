'use client';

import * as React from 'react';
import { format } from 'date-fns';
import { Calendar as CalendarIcon } from 'lucide-react';
import { DateRange } from 'react-day-picker';
import { cn } from '@/lib/utils';

import { Button } from '@/components/ui/button';
import { Calendar } from '@/components/ui/calendar';
import {
  Popover,
  PopoverContent,
  PopoverTrigger,
} from '@/components/ui/popover';

interface DateRangePickerProps {
  from: Date;
  to: Date;
  onChange: (range: { from: Date; to: Date }) => void;
  className?: string;
  align?: 'start' | 'center' | 'end';
  size?: 'sm' | 'md' | 'lg';
}

export function DateRangePicker({
  from,
  to,
  onChange,
  className,
  align = 'start',
  size = 'md',
}: DateRangePickerProps) {
  const [date, setDate] = React.useState<DateRange | undefined>({
    from,
    to,
  });

  // Update internal state when props change
  React.useEffect(() => {
    setDate({ from, to });
  }, [from, to]);

  // Update parent when internal state changes
  React.useEffect(() => {
    if (date?.from && date?.to) {
      onChange({ from: date.from, to: date.to });
    }
  }, [date, onChange]);

  // Size variants for the button
  const buttonSizeClasses = {
    sm: 'h-8 px-3 text-xs',
    md: 'h-9 px-4',
    lg: 'h-10 px-6',
  };

  return (
    <div className={cn('grid gap-2', className)}>
      <Popover>
        <PopoverTrigger asChild>
          <Button
            id="date"
            variant="outline"
            className={cn(
              'w-full justify-start text-left font-normal',
              !date && 'text-muted-foreground',
              buttonSizeClasses[size]
            )}
          >
            <CalendarIcon className="mr-2 h-4 w-4" />
            {date?.from ? (
              date.to ? (
                <>
                  {format(date.from, 'LLL dd, y')} - {format(date.to, 'LLL dd, y')}
                </>
              ) : (
                format(date.from, 'LLL dd, y')
              )
            ) : (
              <span>Pick a date range</span>
            )}
          </Button>
        </PopoverTrigger>
        <PopoverContent className="w-auto p-0" align={align}>
          <Calendar
            initialFocus
            mode="range"
            defaultMonth={date?.from}
            selected={date}
            onSelect={setDate}
            numberOfMonths={2}
          />
          <div className="flex items-center justify-between p-3 border-t">
            <Button
              variant="ghost"
              size="sm"
              onClick={() => {
                const today = new Date();
                const lastMonth = new Date();
                lastMonth.setMonth(today.getMonth() - 1);
                setDate({ from: lastMonth, to: today });
              }}
            >
              Last 30 Days
            </Button>
            <Button
              variant="ghost"
              size="sm"
              onClick={() => {
                const today = new Date();
                const lastWeek = new Date();
                lastWeek.setDate(today.getDate() - 7);
                setDate({ from: lastWeek, to: today });
              }}
            >
              Last 7 Days
            </Button>
          </div>
        </PopoverContent>
      </Popover>
    </div>
  );
}
