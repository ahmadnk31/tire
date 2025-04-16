"use client";

import { useState } from "react";
import { useTranslations } from "next-intl";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Calendar } from "@/components/ui/calendar";
import {
  Popover,
  PopoverContent,
  PopoverTrigger,
} from "@/components/ui/popover";
import { format } from "date-fns";
import { CalendarIcon, SearchIcon, XIcon } from "lucide-react";
import { cn } from "@/lib/utils";

interface InstallationsFilterProps {
  currentFilters: {
    search?: string;
    dateFrom?: string;
    dateTo?: string;
  };
  onFilterChange: (filters: any) => void;
}

export function InstallationsFilter({ currentFilters, onFilterChange }: InstallationsFilterProps) {
  const t = useTranslations("Dashboard.installations");
  
  // Local state for the date picker
  const [date, setDate] = useState<{
    from: Date | undefined;
    to: Date | undefined;
  }>({
    from: currentFilters.dateFrom ? new Date(currentFilters.dateFrom) : undefined,
    to: currentFilters.dateTo ? new Date(currentFilters.dateTo) : undefined,
  });

  // Local state for search input
  const [searchInput, setSearchInput] = useState(currentFilters.search || "");
  
  // Handle date selection
  const handleDateSelect = (range: { from?: Date; to?: Date } | undefined) => {
    setDate({
      from: range?.from || undefined,
      to: range?.to || undefined
    });
    
    // Only update filters when both dates are selected or when clearing dates
    if ((range?.from && range?.to) || (!range?.from && !range?.to)) {
      onFilterChange({
        dateFrom: range?.from ? format(range.from, "yyyy-MM-dd") : undefined,
        dateTo: range?.to ? format(range.to, "yyyy-MM-dd") : undefined,
      });
    }
  };
  
  // Handle search action
  const handleSearch = () => {
    onFilterChange({ search: searchInput });
  };
  
  // Handle search input key press (Enter)
  const handleSearchKeyPress = (e: React.KeyboardEvent) => {
    if (e.key === "Enter") {
      handleSearch();
    }
  };
  
  // Reset all filters
  const handleResetFilters = () => {
    setSearchInput("");
    setDate({ from: undefined, to: undefined });
    onFilterChange({
      search: "",
      dateFrom: undefined,
      dateTo: undefined,
    });
  };
  
  // Check if any filters are applied
  const hasFilters = !!(currentFilters.search || currentFilters.dateFrom || currentFilters.dateTo);

  return (
    <div className="flex flex-col md:flex-row gap-4">
      <div className="flex-1 flex gap-2">
        <div className="relative flex-1">
          <SearchIcon className="absolute left-2.5 top-2.5 h-4 w-4 text-muted-foreground" />
          <Input
            placeholder={t("filters.searchPlaceholder")}
            className="pl-8"
            value={searchInput}
            onChange={(e) => setSearchInput(e.target.value)}
            onKeyDown={handleSearchKeyPress}
          />
        </div>
        <Button variant="default" onClick={handleSearch}>
          {t("filters.search")}
        </Button>
      </div>
      
      <div className="flex gap-2">
        <Popover>
          <PopoverTrigger asChild>
            <Button
              variant="outline"
              className={cn(
                "justify-start text-left font-normal",
                date.from && "text-primary"
              )}
            >
              <CalendarIcon className="mr-2 h-4 w-4" />
              {date.from ? (
                date.to ? (
                  <>
                    {format(date.from, "PPP")} - {format(date.to, "PPP")}
                  </>
                ) : (
                  format(date.from, "PPP")
                )
              ) : (
                t("filters.dateRange")
              )}
            </Button>
          </PopoverTrigger>
          <PopoverContent className="w-auto p-0" align="end">
            <Calendar
              mode="range"
              selected={date}
              onSelect={handleDateSelect}
              numberOfMonths={2}
              initialFocus
            />
          </PopoverContent>
        </Popover>
        
        {hasFilters && (
          <Button variant="ghost" onClick={handleResetFilters} size="icon">
            <XIcon className="h-4 w-4" />
          </Button>
        )}
      </div>
    </div>
  );
}
