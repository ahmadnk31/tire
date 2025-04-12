"use client";

import * as React from "react";
import { CalendarIcon } from "lucide-react";
import { addDays, format } from "date-fns";
import { DateRange } from "react-day-picker";
import { Button } from "@/components/ui/button";
import { Calendar } from "@/components/ui/calendar";
import {
  Popover,
  PopoverContent,
  PopoverTrigger,
} from "@/components/ui/popover";
import { cn } from "@/lib/utils";

interface DateRangePickerProps extends Omit<React.HTMLAttributes<HTMLDivElement>, 'onChange'> {
  from?: Date;
  to?: Date;
  onChange?: (range: { from: Date; to: Date }) => void;
  align?: 'start' | 'center' | 'end';
}

export function DateRangePicker({
  className,
  from,
  to,
  onChange,
  align = 'end',
}: DateRangePickerProps) {
  // Initialize with props if provided, otherwise use default values
  const [date, setDate] = React.useState<DateRange | undefined>({
    from: from || addDays(new Date(), -30),
    to: to || new Date(),
  });

  // Update internal state when props change
  React.useEffect(() => {
    if (from && to) {
      setDate({ from, to });
    }
  }, [from, to]);

  // Handle date changes
  const handleDateChange = (newDate: DateRange | undefined) => {
    setDate(newDate);
    
    // Call the onChange handler if it exists and both dates are set
    if (onChange && newDate?.from && newDate?.to) {
      onChange({ from: newDate.from, to: newDate.to });
    }
  };
  
  return (
    <div className={cn("grid gap-2", className)}>
      <Popover>
        <PopoverTrigger asChild>
          <Button
            id="date"
            variant={"outline"}
            className={cn(
              "w-[260px] justify-start text-left font-normal",
              !date && "text-muted-foreground"
            )}
          >
            <CalendarIcon className="mr-2 h-4 w-4" />
            {date?.from ? (
              date.to ? (
                <>
                  {format(date.from, "LLL dd, y")} -{" "}
                  {format(date.to, "LLL dd, y")}
                </>
              ) : (
                format(date.from, "LLL dd, y")
              )
            ) : (
              <span>Pick a date range</span>
            )}
          </Button>
        </PopoverTrigger>        <PopoverContent className="w-auto p-0" align={align}>
          <Calendar
            initialFocus
            mode="range"
            defaultMonth={date?.from}
            selected={date}
            onSelect={handleDateChange}
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
                handleDateChange({ from: lastMonth, to: today });
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
                handleDateChange({ from: lastWeek, to: today });
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