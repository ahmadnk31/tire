"use client";

import { useState } from "react";
import { useTranslations } from "next-intl";
import { Button } from "@/components/ui/button";
import { Plus } from "lucide-react";
import { PromotionsDataTable } from "./components/promotions-data-table";
import { AddPromotionForm } from "./components/add-promotion-form";
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { DataTableSkeleton } from "@/components/ui/data-table-skeleton";
import { useAllPromotions } from "@/hooks/use-promotions";
import { Separator } from "@/components/ui/separator";

export default function PromotionsPage() {
  const t = useTranslations("Dashboard.Promotions");
  const [isAddDialogOpen, setIsAddDialogOpen] = useState(false);
  
  // Using TanStack Query hook
  const { data, isLoading, error } = useAllPromotions();

  return (
    <div className="container mx-auto py-8 space-y-6">
      <div className="flex justify-between items-center">
        <div>
          <h1 className="text-3xl font-bold">{t("title")}</h1>
          <p className="text-muted-foreground">{t("description")}</p>
        </div>
        <Button onClick={() => setIsAddDialogOpen(true)}>
          <Plus className="mr-2 h-4 w-4" />
          {t("addPromotion")}
        </Button>
      </div>
      
      <Separator className="my-6" />
      
      {isLoading ? (
        <DataTableSkeleton columnCount={5} rowCount={5} />
      ) : error ? (
        <div className="bg-red-50 border border-red-200 text-red-800 rounded p-4 my-4">
          {t("errorLoading")}: {error.message}
        </div>
      ) : (
        <PromotionsDataTable />
      )}
      
      <Dialog open={isAddDialogOpen} onOpenChange={setIsAddDialogOpen}>
        <DialogContent className="sm:max-w-[600px] max-h-[90vh] overflow-y-auto">
          <DialogHeader>
            <DialogTitle>{t("addNewPromotion")}</DialogTitle>
          </DialogHeader>
          <AddPromotionForm onSuccess={() => setIsAddDialogOpen(false)} />
        </DialogContent>
      </Dialog>
    </div>
  );
}