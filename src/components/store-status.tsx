"use client";

import { useState, useEffect } from "react";
import { Badge } from "@/components/ui/badge";
import { Clock, AlertCircle } from "lucide-react";
import { format } from "date-fns";
import { 
  Tooltip,
  TooltipContent,
  TooltipProvider,
  TooltipTrigger,
} from "@/components/ui/tooltip";
import { useTranslations } from "next-intl";
import useBusinessHours from "@/hooks/use-business-hours";

export function StoreStatus() {
  const t = useTranslations("StoreStatus");
  const [isOpen, setIsOpen] = useState(false);
  const [showDetails, setShowDetails] = useState(false);
  const [nextStatus, setNextStatus] = useState<{time: string; isOpen: boolean} | null>(null);
  const [currentDay, setCurrentDay] = useState<number>(new Date().getDay());
  const [currentTime, setCurrentTime] = useState<string>(
    format(new Date(), "HH:mm")
  );
  // Handle dropdown toggle
  const [showDropdown, setShowDropdown] = useState(false);
  
  // Use our custom hook to fetch business hours with TanStack Query
  const { 
    data: hours = [], 
    isLoading, 
    isError 
  } = useBusinessHours();

  // Effect for handling outside clicks to close dropdown
  useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      if (showDropdown) {
        setShowDropdown(false);
      }
    };

    document.addEventListener("mousedown", handleClickOutside);
    return () => {
      document.removeEventListener("mousedown", handleClickOutside);
    };
  }, [showDropdown]);

  // Check if store is currently open
  useEffect(() => {
    const checkIfOpen = () => {
      if (hours.length === 0) return;

      // Get current day and time
      const now = new Date();
      const dayOfWeek = now.getDay();
      const currentTimeStr = format(now, "HH:mm");
      
      setCurrentDay(dayOfWeek);
      setCurrentTime(currentTimeStr);

      // Find today's hours
      const todayHours = hours.find(h => h.dayOfWeek === dayOfWeek);
      
      if (todayHours) {
        if (!todayHours.isOpen) {
          setIsOpen(false);
        } else {
          // Check if current time is within business hours
          const isCurrentlyOpen = 
            currentTimeStr >= todayHours.openTime && 
            currentTimeStr < todayHours.closeTime;
          
          setIsOpen(isCurrentlyOpen);
        }

        // Calculate next status change
        if (todayHours.isOpen) {
          if (currentTimeStr < todayHours.openTime) {
            setNextStatus({
              time: todayHours.openTime,
              isOpen: true
            });
          } else if (currentTimeStr < todayHours.closeTime) {
            setNextStatus({
              time: todayHours.closeTime,
              isOpen: false
            });
          } else {
            // Find next day that's open
            let nextDay = (dayOfWeek + 1) % 7;
            let nextDayHours;
            
            for (let i = 0; i < 7; i++) {
              nextDayHours = hours.find(h => h.dayOfWeek === nextDay);
              if (nextDayHours && nextDayHours.isOpen) break;
              nextDay = (nextDay + 1) % 7;
            }
            
            if (nextDayHours && nextDayHours.isOpen) {
              setNextStatus({
                time: `${getDayName(nextDay)} at ${formatTime(nextDayHours.openTime)}`,
                isOpen: true
              });
            }
          }
        } else {
          // Today is closed, find next open day
          let nextDay = (dayOfWeek + 1) % 7;
          let nextDayHours;
          
          for (let i = 0; i < 7; i++) {
            nextDayHours = hours.find(h => h.dayOfWeek === nextDay);
            if (nextDayHours && nextDayHours.isOpen) break;
            nextDay = (nextDay + 1) % 7;
          }
          
          if (nextDayHours && nextDayHours.isOpen) {
            setNextStatus({
              time: `${getDayName(nextDay)} at ${formatTime(nextDayHours.openTime)}`,
              isOpen: true
            });
          }
        }
      }
    };

    checkIfOpen();
    
    // Update every minute
    const interval = setInterval(checkIfOpen, 60000);
    return () => clearInterval(interval);
  }, [hours]);

  // Format time from 24-hour format to 12-hour format
  const formatTime = (time24: string): string => {
    if (!time24 || !time24.includes(':')) return '--:--';
    
    const [hours, minutes] = time24.split(':');
    if (isNaN(parseInt(hours, 10)) || isNaN(parseInt(minutes, 10))) {
      return '--:--';
    }
    
    const hour = parseInt(hours, 10);
    const period = hour >= 12 ? 'PM' : 'AM';
    const hour12 = hour % 12 || 12;
    return `${hour12}:${minutes} ${period}`;
  };

  // Get day name from day number
  const getDayName = (day: number): string => {
    const days = ["Sunday", "Monday", "Tuesday", "Wednesday", "Thursday", "Friday", "Saturday"];
    return t(`days.${days[day].toLowerCase()}`);
  };

  // Get today's hours
  const getTodaysHours = (): string => {
    const todayHours = hours.find(h => h.dayOfWeek === currentDay);
    
    if (!todayHours) return t("closed");
    if (!todayHours.isOpen) return t("closed");
    
    return `${formatTime(todayHours.openTime)} - ${formatTime(todayHours.closeTime)}`;
  };

  // Format all business hours for the tooltip
  const getAllHours = () => {
    return (
      <div className="space-y-1 text-sm">
        {[0, 1, 2, 3, 4, 5, 6].map(day => {
          const dayHours = hours.find(h => h.dayOfWeek === day);
          const isToday = day === currentDay;
          
          return (
            <div key={day} className={`flex justify-between ${isToday ? "font-medium" : ""}`}>
              <span className={isToday ? "text-primary" : ""}>
                {getDayName(day)}
                {isToday && <span className="ml-1">({t("today")})</span>}
              </span>
              <span>
                {dayHours?.isOpen 
                  ? `${formatTime(dayHours.openTime)} - ${formatTime(dayHours.closeTime)}`
                  : t("closed")}
              </span>
            </div>
          );
        })}
      </div>
    );
  };

  // Get today's opening and closing hours
  const getTodayOpeningHours = () => {
    const todayHours = hours.find(h => h.dayOfWeek === currentDay);
    if (!todayHours || !todayHours.isOpen) return null;
    return { open: todayHours.openTime, close: todayHours.closeTime };
  };

  const todayHours = getTodayOpeningHours();

  const toggleDetails = () => {
    setShowDetails(!showDetails);
  };
  
  const toggleDropdown = (e: React.MouseEvent) => {
    e.preventDefault();
    e.stopPropagation();
    setShowDropdown(!showDropdown);
  };

  if (isLoading) {
    return (
      <div className="flex items-center gap-2">
        <Clock className="h-4 w-4 animate-pulse" />
        <span className="text-sm animate-pulse">{t("loading")}</span>
      </div>
    );
  }

  // TanStack Query error state
  if (isError) {
    return (
      <div className="flex items-center gap-2 text-red-500">
        <AlertCircle className="h-4 w-4" />
        <span className="text-sm">{t("error")}</span>
      </div>
    );
  }

  return (
    <div className="relative">
      <TooltipProvider>
      <Tooltip defaultOpen={false} open={!showDropdown ? undefined : false}>
        <TooltipTrigger asChild>
          <div 
            className={`flex items-center gap-2 cursor-pointer transition-all duration-300`}
            onClick={toggleDropdown}
          >            <Badge 
              variant={isOpen ? "outline" : "secondary"} 
              className={`px-2 py-0.5 ${isOpen 
                ? "bg-green-50 text-green-700 border-green-200 hover:bg-green-100" 
                : "bg-red-50 text-red-700 border-red-200 hover:bg-red-100"}`}
            >
              <div className={`w-2 h-2 rounded-full mr-1.5 ${isOpen ? "bg-green-500" : "bg-red-500"} animate-pulse`} />
              {isOpen ? t("open") : t("closed")}
            </Badge>
          </div>
        </TooltipTrigger>
        <TooltipContent className="p-4 w-[280px]">
          <div>
            <div className="flex items-center justify-between mb-2">
              <h4 className="font-medium">{t("businessHours")}</h4>
              <Badge variant={isOpen ? "default" : "destructive"} className="text-xs">
                {isOpen ? t("currentlyOpen") : t("currentlyClosed")}
              </Badge>
            </div>
            
            {getAllHours()}
            
            {nextStatus && (
              <div className="mt-3 pt-3 border-t text-sm">
                <span className="text-muted-foreground">
                  {nextStatus.isOpen ? t("willOpen") : t("willClose")}{" "}
                  <span className="font-medium text-foreground">{nextStatus.time}</span>
                </span>
              </div>
            )}
            
            <div className="mt-3 pt-3 border-t text-xs text-muted-foreground">
              {t("clickToToggle")}
            </div>
          </div>
        </TooltipContent>
      </Tooltip>
    </TooltipProvider>
      {/* Dropdown that appears when clicked */}
    {showDropdown && (
      <div className="absolute z-50 mt-2 w-[300px] rounded-md shadow-lg bg-white dark:bg-gray-800 ring-1 ring-black ring-opacity-5 p-4 transform duration-200 ease-in-out right-0 origin-top-right">
        <div className="flex items-center justify-between mb-3">
          <h4 className="font-medium text-lg">{t("businessHours")}</h4>
          <Badge 
            variant={isOpen ? "outline" : "secondary"}
            className={`px-2 py-0.5 ${isOpen 
              ? "bg-green-50 text-green-700 border-green-200" 
              : "bg-red-50 text-red-700 border-red-200"}`}
          >
            {isOpen ? t("currentlyOpen") : t("currentlyClosed")}
          </Badge>
        </div>
        
        {/* Today's hours section */}
        <div className="mb-4 pb-3 border-b">
          <h5 className="font-medium mb-2">{t("todayHours")}</h5>
          
          {todayHours ? (
            <div className="flex flex-col space-y-2">
              <div className="flex justify-between items-center">
                <span className="text-sm text-muted-foreground">{t("opens")}</span>
                <span className="font-medium text-green-600">{formatTime(todayHours.open)}</span>
              </div>
              <div className="flex justify-between items-center">
                <span className="text-sm text-muted-foreground">{t("closes")}</span>
                <span className="font-medium text-red-600">{formatTime(todayHours.close)}</span>
              </div>
            </div>
          ) : (
            <div className="text-red-500 font-medium">{t("closedToday")}</div>
          )}
          
          {nextStatus && (
            <div className="mt-2 pt-2 border-t text-sm">
              <span className="text-muted-foreground">
                {nextStatus.isOpen ? t("willOpen") : t("willClose")}{" "}
                <span className="font-medium text-foreground">{nextStatus.time}</span>
              </span>
            </div>
          )}
        </div>
        
        {/* Weekly hours section */}
        <div>
          <h5 className="font-medium mb-2">{t("weeklyHours")}</h5>
          {getAllHours()}
        </div>
      </div>
    )}
    </div>
  );
}