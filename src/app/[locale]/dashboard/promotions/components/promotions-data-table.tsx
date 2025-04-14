"use client";

import { useState } from "react";
import { useTranslations } from "next-intl";
import {
  ColumnDef,
  flexRender,
  getCoreRowModel,
  useReactTable,
  getPaginationRowModel,
  getSortedRowModel,
  SortingState,
  ColumnFiltersState,
  getFilteredRowModel,
} from "@tanstack/react-table";
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
  DropdownMenuLabel,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import {
  MoreHorizontal,
  PenLine,
  Trash2,
  Eye,
  EyeOff,
  AlertTriangle,
  CheckCircle,
} from "lucide-react";
import { Badge } from "@/components/ui/badge";
import { useAllPromotions } from "@/hooks/use-promotions";
import { useDeletePromotion, useTogglePromotionActive } from "@/hooks/use-promotion-actions";
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { EditPromotionForm } from "./edit-promotion-form";
import { formatDate } from "@/lib/utils";
import { 
  AlertDialog, 
  AlertDialogAction, 
  AlertDialogCancel, 
  AlertDialogContent, 
  AlertDialogDescription, 
  AlertDialogFooter, 
  AlertDialogHeader, 
  AlertDialogTitle 
} from "@/components/ui/alert-dialog";
import { Promotion } from "@prisma/client";

export function PromotionsDataTable() {
  const t = useTranslations("Dashboard.Promotions");
  const { data: promotions = [] } = useAllPromotions();
  const { mutate: deletePromotion } = useDeletePromotion();
  const { mutate: toggleActive } = useTogglePromotionActive();
  
  const [sorting, setSorting] = useState<SortingState>([]);
  const [columnFilters, setColumnFilters] = useState<ColumnFiltersState>([]);
  
  const [selectedPromotion, setSelectedPromotion] = useState<Promotion | null>(null);
  const [isEditDialogOpen, setIsEditDialogOpen] = useState(false);
  const [isDeleteDialogOpen, setIsDeleteDialogOpen] = useState(false);
  
  const handleDelete = () => {
    if (selectedPromotion) {
      deletePromotion(selectedPromotion.id);
      setIsDeleteDialogOpen(false);
    }
  };

  const columns: ColumnDef<Promotion>[] = [    {
      accessorKey: "title",
      header: t("table.title"),
      cell: ({ row }) => {
        return (
          <div className="flex items-center gap-3 max-w-[300px]">
            {row.original.imageUrl && (
              <img
                src={row.original.imageUrl}
                alt={row.original.title}
                className="h-10 w-10 rounded object-cover"
              />
            )}
            <div className="font-medium truncate">{row.original.title}</div>
          </div>
        );
      },
    },
    {
      accessorKey: "value",
      header: t("table.value"),
      cell: ({ row }) => {
        return row.original.type === 'PERCENTAGE' ? `${row.original.value}%` : `$${row.original.value}`;
      },
    },
    {
      accessorKey: "badgeType",
      header: t("table.badgeType"),
      cell: ({ row }) => {
        const badgeType = row.original.badgeType;
        return (
          <Badge variant="outline" className="capitalize">
            {badgeType}
          </Badge>
        );
      },
    },    {
      accessorKey: "startDate",
      header: t("table.startDate"),
      cell: ({ row }) => formatDate(new Date(row.original.startDate)),
    },
    {
      accessorKey: "endDate",
      header: t("table.endDate"),
      cell: ({ row }) => (row.original.endDate ? formatDate(new Date(row.original.endDate)) : t("form.noEndDate")),
    },
    {
      accessorKey: "status",
      header: t("table.status"),
      cell: ({ row }) => {
        const isActive = row.original.isActive;
        const now = new Date();
        const endDate = row.original.endDate ? new Date(row.original.endDate) : null;
        const startDate = new Date(row.original.startDate);
        
        let status = "active";
        let badgeVariant: "default" | "secondary" | "destructive" | "outline" = "default";
        
        if (!isActive) {
          status = "inactive";
          badgeVariant = "outline";
        } else if (now < startDate) {
          status = "scheduled";
          badgeVariant = "secondary";
        } else if (endDate && now > endDate) {
          status = "expired";
          badgeVariant = "destructive";
        }
        
        return (
          <Badge variant={badgeVariant} className="capitalize">
            {t(`status.${status}`)}
          </Badge>
        );
      },
    },
    {
      accessorKey: "actions",
      header: "",
      cell: ({ row }) => {
        const promotion = row.original;

        return (
          <DropdownMenu>
            <DropdownMenuTrigger asChild>
              <Button variant="ghost" className="h-8 w-8 p-0">
                <span className="sr-only">Open menu</span>
                <MoreHorizontal className="h-4 w-4" />
              </Button>
            </DropdownMenuTrigger>
            <DropdownMenuContent align="end">
              <DropdownMenuLabel>{t("actions")}</DropdownMenuLabel>
              <DropdownMenuItem
                onClick={() => {
                  setSelectedPromotion(promotion);
                  setIsEditDialogOpen(true);
                }}
              >
                <PenLine className="mr-2 h-4 w-4" />
                {t("edit")}
              </DropdownMenuItem>
              <DropdownMenuItem
                onClick={() => toggleActive({ id: promotion.id, isActive: !promotion.isActive })}
              >
                {promotion.isActive ? (
                  <>
                    <EyeOff className="mr-2 h-4 w-4" />
                    {t("deactivate")}
                  </>
                ) : (
                  <>
                    <Eye className="mr-2 h-4 w-4" />
                    {t("activate")}
                  </>
                )}
              </DropdownMenuItem>
              <DropdownMenuSeparator />
              <DropdownMenuItem
                className="text-destructive focus:text-destructive"
                onClick={() => {
                  setSelectedPromotion(promotion);
                  setIsDeleteDialogOpen(true);
                }}
              >
                <Trash2 className="mr-2 h-4 w-4" />
                {t("delete")}
              </DropdownMenuItem>
            </DropdownMenuContent>
          </DropdownMenu>
        );
      },
    },
  ];

  const table = useReactTable({
    data: promotions,
    columns,
    getCoreRowModel: getCoreRowModel(),
    getPaginationRowModel: getPaginationRowModel(),
    onSortingChange: setSorting,
    getSortedRowModel: getSortedRowModel(),
    onColumnFiltersChange: setColumnFilters,
    getFilteredRowModel: getFilteredRowModel(),
    state: {
      sorting,
      columnFilters,
    },
  });

  return (
    <div>
      <div className="flex items-center py-4">
        <Input
          placeholder={t("searchPlaceholder")}
          value={(table.getColumn("title")?.getFilterValue() as string) ?? ""}
          onChange={(event) => table.getColumn("title")?.setFilterValue(event.target.value)}
          className="max-w-sm"
        />
      </div>
      <div className="rounded-md border">
        <Table>
          <TableHeader>
            {table.getHeaderGroups().map((headerGroup) => (
              <TableRow key={headerGroup.id}>
                {headerGroup.headers.map((header) => {
                  return (
                    <TableHead key={header.id}>
                      {header.isPlaceholder
                        ? null
                        : flexRender(header.column.columnDef.header, header.getContext())}
                    </TableHead>
                  );
                })}
              </TableRow>
            ))}
          </TableHeader>
          <TableBody>
            {table.getRowModel().rows?.length ? (
              table.getRowModel().rows.map((row) => (
                <TableRow key={row.id} data-state={row.getIsSelected() && "selected"}>
                  {row.getVisibleCells().map((cell) => (
                    <TableCell key={cell.id}>
                      {flexRender(cell.column.columnDef.cell, cell.getContext())}
                    </TableCell>
                  ))}
                </TableRow>
              ))
            ) : (
              <TableRow>                
                <TableCell colSpan={columns.length} className="h-24 text-center">
                  {t("table.noPromotions")}
                </TableCell>
              </TableRow>
            )}
          </TableBody>
        </Table>
      </div>
      <div className="flex items-center justify-end space-x-2 py-4">        <div className="text-sm text-muted-foreground">
          {`${table.getState().pagination.pageIndex * table.getState().pagination.pageSize + 1}-${Math.min(
              (table.getState().pagination.pageIndex + 1) * table.getState().pagination.pageSize,
              table.getFilteredRowModel().rows.length
            )} ${t("table.of")} ${table.getFilteredRowModel().rows.length}`}
        </div>       
        <Button
          variant="outline"
          size="sm"
          onClick={() => table.previousPage()}
          disabled={!table.getCanPreviousPage()}
        >
          {t("table.previous")}
        </Button>
        <Button
          variant="outline"
          size="sm"
          onClick={() => table.nextPage()}
          disabled={!table.getCanNextPage()}
        >
          {t("table.next")}
        </Button>
      </div>

      {/* Edit Dialog */}
      {selectedPromotion && (
        <Dialog open={isEditDialogOpen} onOpenChange={setIsEditDialogOpen}>
          <DialogContent className="sm:max-w-[600px] max-h-[90vh] overflow-y-auto">
            <DialogHeader>
              <DialogTitle>{t("editPromotion")}</DialogTitle>
            </DialogHeader>
            <EditPromotionForm 
              promotion={selectedPromotion} 
              onSuccess={() => setIsEditDialogOpen(false)}
            />
          </DialogContent>
        </Dialog>
      )}

      {/* Delete Confirmation Dialog */}
      <AlertDialog open={isDeleteDialogOpen} onOpenChange={setIsDeleteDialogOpen}>
        <AlertDialogContent>          <AlertDialogHeader>
            <AlertDialogTitle>{t("deleteConfirm")}</AlertDialogTitle>
            <AlertDialogDescription>
              {t("deleteDescription")}
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel>{t("cancel")}</AlertDialogCancel>
            <AlertDialogAction 
              onClick={handleDelete}
              className="bg-destructive text-destructive-foreground hover:bg-destructive/90"
            >
              {t("delete")}
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </div>
  );
}
