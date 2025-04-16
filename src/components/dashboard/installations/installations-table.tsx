"use client";

import { useTranslations } from "next-intl";
import { Installation, InstallationStatus } from "@/types";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import { 
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger 
} from "@/components/ui/dropdown-menu";
import { format } from "date-fns";
import { 
  EllipsisVerticalIcon, 
  EyeIcon,
  PencilIcon,
  CalendarIcon,
  CheckIcon,
  XIcon,
  PlayIcon,
  SearchIcon,
  ChevronDownIcon,
  ChevronUpIcon,
  FilterIcon,
} from "lucide-react";
import { useRouter } from "next/navigation";
import { useUpdateInstallationStatus } from "@/hooks/use-installations";
import { Skeleton } from "@/components/ui/skeleton";
import { useState, useMemo } from "react";
import { Input } from "@/components/ui/input";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Popover, PopoverContent, PopoverTrigger } from "@/components/ui/popover";
import { DateRange } from "react-day-picker";
import { DatePickerWithRange } from "@/components/ui/date-range-picker";
import { CustomPagination } from "@/components/ui/custom-pagination";

interface InstallationsTableProps {
  installations: Installation[];
  isLoading: boolean;
  pagination: {
    page: number;
    pageSize: number;
    totalItems: number;
    onPageChange: (page: number) => void;
  };
  // Optional server-side filtering props
  onServerFilter?: (filters: {
    search?: string;
    status?: InstallationStatus;
    dateRange?: DateRange;
  }) => void;
  isServerFiltered?: boolean;
}

type SortField = 'date' | 'customer' | 'vehicle' | 'service' | 'status';
type SortDirection = 'asc' | 'desc';

export function InstallationsTable({ 
  installations, 
  isLoading, 
  pagination,
  onServerFilter,
  isServerFiltered = false
}: InstallationsTableProps) {
  const t = useTranslations("Dashboard.installations");
  const router = useRouter();
  const [updatingId, setUpdatingId] = useState<string | null>(null);
  const [searchTerm, setSearchTerm] = useState("");
  const [statusFilter, setStatusFilter] = useState<InstallationStatus | "all">("all");
  const [dateRange, setDateRange] = useState<DateRange | undefined>(undefined);
  const [sortField, setSortField] = useState<SortField | null>(null);
  const [sortDirection, setSortDirection] = useState<SortDirection>('asc');
  
  const { mutate: updateStatus } = useUpdateInstallationStatus();

  // Handle sorting
  const handleSort = (field: SortField) => {
    if (sortField === field) {
      setSortDirection(sortDirection === 'asc' ? 'desc' : 'asc');
    } else {
      setSortField(field);
      setSortDirection('asc');
    }
  };

  const getSortIcon = (field: SortField) => {
    if (sortField !== field) return null;
    return sortDirection === 'asc' ? 
      <ChevronUpIcon className="h-4 w-4 ml-1" /> : 
      <ChevronDownIcon className="h-4 w-4 ml-1" />;
  };

  // Client-side filtering and sorting logic
  const filteredAndSortedInstallations = useMemo(() => {
    if (isServerFiltered) return installations;
    
    let filtered = [...installations];
    
    // Apply filters
    if (searchTerm) {
      const lowercaseSearch = searchTerm.toLowerCase();
      filtered = filtered.filter(installation => 
        installation.customerName.toLowerCase().includes(lowercaseSearch) ||
        installation.vehicleMake.toLowerCase().includes(lowercaseSearch) ||
        installation.vehicleModel.toLowerCase().includes(lowercaseSearch) ||
        installation.customerPhone.includes(searchTerm)
      );
    }
    
    if (statusFilter !== "all") {
      filtered = filtered.filter(installation => 
        installation.status === statusFilter
      );
    }
    
    if (dateRange?.from) {
      const fromDate = new Date(dateRange.from);
      fromDate.setHours(0, 0, 0, 0);
      
      filtered = filtered.filter(installation => {
        const appointmentDate = new Date(installation.appointmentDate);
        return appointmentDate >= fromDate;
      });
    }
    
    if (dateRange?.to) {
      const toDate = new Date(dateRange.to);
      toDate.setHours(23, 59, 59, 999);
      
      filtered = filtered.filter(installation => {
        const appointmentDate = new Date(installation.appointmentDate);
        return appointmentDate <= toDate;
      });
    }
    
    // Apply sorting if selected
    if (sortField) {
      filtered.sort((a, b) => {
        let comparison = 0;
        
        switch (sortField) {
          case 'date':
            comparison = new Date(a.appointmentDate).getTime() - new Date(b.appointmentDate).getTime();
            break;
          case 'customer':
            comparison = a.customerName.localeCompare(b.customerName);
            break;
          case 'vehicle':
            comparison = `${a.vehicleYear} ${a.vehicleMake} ${a.vehicleModel}`.localeCompare(
              `${b.vehicleYear} ${b.vehicleMake} ${b.vehicleModel}`
            );
            break;
          case 'service':
            comparison = a.serviceType.localeCompare(b.serviceType);
            break;
          case 'status':
            comparison = a.status.localeCompare(b.status);
            break;
        }
        
        return sortDirection === 'asc' ? comparison : -comparison;
      });
    }
    
    return filtered;
  }, [installations, searchTerm, statusFilter, dateRange, sortField, sortDirection, isServerFiltered]);

  // Handle server-side filtering
  const handleFilterChange = () => {
    if (onServerFilter) {
      onServerFilter({
        search: searchTerm || undefined,
        status: statusFilter !== "all" ? statusFilter : undefined,
        dateRange: dateRange
      });
    }
  };

  const handleStatusUpdate = (id: string, status: InstallationStatus) => {
    setUpdatingId(id);
    updateStatus({ id, status }, {
      onSuccess: () => {
        setUpdatingId(null);
      },
      onError: () => {
        setUpdatingId(null);
      }
    });
  };

  const getStatusBadge = (status: InstallationStatus) => {
    switch (status) {
      case 'SCHEDULED':
        return <Badge variant="outline">{t("tabs.scheduled")}</Badge>;
      case 'CONFIRMED':
        return <Badge variant="secondary">{t("tabs.confirmed")}</Badge>;
      case 'IN_PROGRESS':
        return <Badge variant="default">{t("tabs.inProgress")}</Badge>;
      case 'COMPLETED':
        return <Badge variant="default">{t("tabs.completed")}</Badge>;
      case 'CANCELED':
        return <Badge variant="destructive">{t("tabs.canceled")}</Badge>;
      case 'RESCHEDULED':
        return <Badge variant="default">{t("tabs.rescheduled")}</Badge>;
      default:
        return <Badge variant="outline">{status}</Badge>;
    }
  };

  // Loading state UI
  if (isLoading) {
    return (
      <div className="space-y-4">
        <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
          <Skeleton className="h-10 w-64" />
          <div className="flex gap-2">
            <Skeleton className="h-10 w-32" />
            <Skeleton className="h-10 w-32" />
          </div>
        </div>
        <div className="w-full overflow-auto">
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead>{t("table.date")}</TableHead>
                <TableHead>{t("table.customerName")}</TableHead>
                <TableHead>{t("table.vehicleInfo")}</TableHead>
                <TableHead>{t("table.serviceType")}</TableHead>
                <TableHead>{t("table.status")}</TableHead>
                <TableHead className="text-right">{t("table.actions")}</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {Array(5).fill(0).map((_, index) => (
                <TableRow key={index}>
                  <TableCell><Skeleton className="h-6 w-24" /></TableCell>
                  <TableCell><Skeleton className="h-6 w-36" /></TableCell>
                  <TableCell><Skeleton className="h-6 w-32" /></TableCell>
                  <TableCell><Skeleton className="h-6 w-24" /></TableCell>
                  <TableCell><Skeleton className="h-6 w-20" /></TableCell>
                  <TableCell><Skeleton className="h-6 w-12 ml-auto" /></TableCell>
                </TableRow>
              ))}
            </TableBody>
          </Table>
        </div>
      </div>
    );
  }

  return (
    <div className="space-y-4">
      {/* Filter controls */}
      <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
        <div className="relative">
          <SearchIcon className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" />
          <Input 
            placeholder={t("filters.searchPlaceholder")} 
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
            onKeyDown={(e) => {
              if (e.key === 'Enter' && isServerFiltered) handleFilterChange();
            }}
            className="pl-9 w-full sm:w-64"
          />
        </div>
        
        <div className="flex flex-wrap gap-2 items-center">
          <Select 
            value={statusFilter} 
            onValueChange={(value: string) => {
              setStatusFilter(value as InstallationStatus | "all");
              if (isServerFiltered) handleFilterChange();
            }}
          >
            <SelectTrigger className="w-[180px]">
              <SelectValue placeholder={t("filters.status")} />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="all">{t("filters.allStatuses")}</SelectItem>
              <SelectItem value={'SCHEDULED'}>{t("status.scheduled")}</SelectItem>
              <SelectItem value={'CONFIRMED'}>{t("status.confirmed")}</SelectItem>
              <SelectItem value={'IN_PROGRESS'}>{t("status.inProgress")}</SelectItem>
              <SelectItem value={'COMPLETED'}>{t("status.completed")}</SelectItem>
              <SelectItem value={'CANCELED'}>{t("status.canceled")}</SelectItem>
              <SelectItem value={'RESCHEDULED'}>{t("status.rescheduled")}</SelectItem>
            </SelectContent>
          </Select>
          
          <Popover>
            <PopoverTrigger asChild>
              <Button variant="outline" className="flex items-center gap-2">
                <CalendarIcon className="h-4 w-4" />
                {dateRange?.from ? (
                  dateRange.to ? (
                    <>
                      {format(dateRange.from, "LLL dd, y")} - {format(dateRange.to, "LLL dd, y")}
                    </>
                  ) : (
                    format(dateRange.from, "LLL dd, y")
                  )
                ) : (
                  <span>{t("filters.dateRange")}</span>
                )}
              </Button>
            </PopoverTrigger>
            <PopoverContent className="w-auto p-0" align="end">              <DatePickerWithRange 
                value={dateRange} 
                onChange={(range: DateRange | undefined) => {
                  setDateRange(range);
                  if (isServerFiltered && range) handleFilterChange();
                }} 
              />
            </PopoverContent>
          </Popover>
          
          {isServerFiltered && (
            <Button onClick={handleFilterChange}>
              <FilterIcon className="h-4 w-4 mr-2" />
              {t("filters.apply")}
            </Button>
          )}
        </div>
      </div>

      {/* Table */}
      <div className="rounded-md border overflow-x-auto">
        <Table>
          <TableHeader>
            <TableRow>
              <TableHead 
                className="cursor-pointer"
                onClick={() => handleSort('date')}
              >
                <div className="flex items-center">
                  {t("table.date")}
                  {getSortIcon('date')}
                </div>
              </TableHead>
              <TableHead 
                className="cursor-pointer"
                onClick={() => handleSort('customer')}
              >
                <div className="flex items-center">
                  {t("table.customerName")}
                  {getSortIcon('customer')}
                </div>
              </TableHead>
              <TableHead 
                className="cursor-pointer"
                onClick={() => handleSort('vehicle')}
              >
                <div className="flex items-center">
                  {t("table.vehicleInfo")}
                  {getSortIcon('vehicle')}
                </div>
              </TableHead>
              <TableHead 
                className="cursor-pointer"
                onClick={() => handleSort('service')}
              >
                <div className="flex items-center">
                  {t("table.serviceType")}
                  {getSortIcon('service')}
                </div>
              </TableHead>
              <TableHead 
                className="cursor-pointer"
                onClick={() => handleSort('status')}
              >
                <div className="flex items-center">
                  {t("table.status")}
                  {getSortIcon('status')}
                </div>
              </TableHead>
              <TableHead className="text-right">{t("table.actions")}</TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            {filteredAndSortedInstallations.length === 0 ? (
              <TableRow>
                <TableCell colSpan={6} className="h-24 text-center">
                  {searchTerm || statusFilter !== "all" || dateRange ? 
                    t("noFilteredInstallations") : 
                    t("noInstallations")}
                </TableCell>
              </TableRow>
            ) : (
              filteredAndSortedInstallations.map((installation) => (
                <TableRow key={installation.id} className="hover:bg-muted/50">
                  <TableCell>
                    {format(new Date(installation.appointmentDate), "PPP p")}
                  </TableCell>
                  <TableCell>
                    <div className="font-medium">{installation.customerName}</div>
                    <div className="text-sm text-muted-foreground">{installation.customerPhone}</div>
                  </TableCell>
                  <TableCell>
                    <div>{installation.vehicleYear} {installation.vehicleMake} {installation.vehicleModel}</div>
                    <div className="text-sm text-muted-foreground">{installation.tireSize} ({installation.tireQuantity} tires)</div>
                  </TableCell>
                  <TableCell>
                    <div>{t(`serviceType.${installation.serviceType}`)}</div>
                    <div className="text-sm text-muted-foreground">${installation.totalPrice.toFixed(2)}</div>
                  </TableCell>
                  <TableCell>
                    {getStatusBadge(installation.status)}
                  </TableCell>
                  <TableCell className="text-right">
                    <DropdownMenu>
                      <DropdownMenuTrigger disabled={updatingId === installation.id} asChild>
                        <Button variant="ghost" className="h-8 w-8 p-0">
                          {updatingId === installation.id ? (
                            <div className="h-4 w-4 animate-spin rounded-full border-2 border-primary border-t-transparent" />
                          ) : (
                            <EllipsisVerticalIcon className="h-4 w-4" />
                          )}
                          <span className="sr-only">Open menu</span>
                        </Button>
                      </DropdownMenuTrigger>
                      <DropdownMenuContent align="end">
                        <DropdownMenuItem onClick={() => router.push(`/dashboard/installations/${installation.id}`)}>
                          <EyeIcon className="mr-2 h-4 w-4" />
                          {t("actions.view")}
                        </DropdownMenuItem>
                        <DropdownMenuItem onClick={() => router.push(`/dashboard/installations/${installation.id}/edit`)}>
                          <PencilIcon className="mr-2 h-4 w-4" />
                          {t("actions.edit")}
                        </DropdownMenuItem>
                        
                        {/* Status update actions - show relevant ones based on current status */}
                        {installation.status === InstallationStatus.SCHEDULED && (
                          <DropdownMenuItem onClick={() => handleStatusUpdate(installation.id, InstallationStatus.CONFIRMED)}>
                            <CheckIcon className="mr-2 h-4 w-4" />
                            {t("actions.confirm")}
                          </DropdownMenuItem>
                        )}
                        
                        {(installation.status === InstallationStatus.SCHEDULED || 
                         installation.status === InstallationStatus.CONFIRMED) && (
                          <DropdownMenuItem onClick={() => handleStatusUpdate(installation.id, InstallationStatus.CANCELED)}>
                            <XIcon className="mr-2 h-4 w-4" />
                            {t("actions.cancel")}
                          </DropdownMenuItem>
                        )}
                        
                        {installation.status === InstallationStatus.CONFIRMED && (
                          <DropdownMenuItem onClick={() => handleStatusUpdate(installation.id, InstallationStatus.IN_PROGRESS)}>
                            <PlayIcon className="mr-2 h-4 w-4" />
                            {t("actions.startWork")}
                          </DropdownMenuItem>
                        )}
                        
                        {installation.status === InstallationStatus.IN_PROGRESS && (
                          <DropdownMenuItem onClick={() => handleStatusUpdate(installation.id, InstallationStatus.COMPLETED)}>
                            <CheckIcon className="mr-2 h-4 w-4" />
                            {t("actions.complete")}
                          </DropdownMenuItem>
                        )}
                        
                        {(installation.status === InstallationStatus.SCHEDULED || 
                         installation.status === InstallationStatus.CONFIRMED) && (
                          <DropdownMenuItem onClick={() => handleStatusUpdate(installation.id, InstallationStatus.RESCHEDULED)}>
                            <CalendarIcon className="mr-2 h-4 w-4" />
                            {t("actions.reschedule")}
                          </DropdownMenuItem>
                        )}
                      </DropdownMenuContent>
                    </DropdownMenu>
                  </TableCell>
                </TableRow>
              ))
            )}
          </TableBody>
        </Table>
      </div>
        {/* Pagination */}
      {installations.length > 0 && (
        <CustomPagination
          totalItems={pagination.totalItems}
          pageSize={pagination.pageSize}
          currentPage={pagination.page}
          onPageChange={pagination.onPageChange}
        />
      )}
    </div>
  );
}
