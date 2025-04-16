"use client";

import { useTranslations } from "next-intl";
import { useAdditionalServices } from "@/hooks/use-additional-services";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { Badge } from "@/components/ui/badge";
import { WrenchIcon, ShieldCheckIcon } from "lucide-react";
import { Skeleton } from "@/components/ui/skeleton";
import { formatPrice } from "@/lib/utils";

export function AdditionalServicesList() {
  const t = useTranslations("Homepage.services.installationPage");
  const { data: services, isLoading, error } = useAdditionalServices();

  if (isLoading) {
    return (
      <Card className="w-full">
        <CardHeader>
          <CardTitle className="text-xl font-bold">{t("additionalServices.title")}</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="space-y-2">
            {[1, 2, 3].map((i) => (
              <div key={i} className="flex justify-between items-center">
                <Skeleton className="h-6 w-2/3" />
                <Skeleton className="h-6 w-20" />
              </div>
            ))}
          </div>
        </CardContent>
      </Card>
    );
  }

  if (error || !services) {
    return (
      <Card className="w-full">
        <CardHeader>
          <CardTitle className="text-xl font-bold">{t("additionalServices.title")}</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="text-center text-muted-foreground py-4">
            {t("additionalServices.error")}
          </div>
        </CardContent>
      </Card>
    );
  }

  return (
    <Card className="w-full">
      <CardHeader>
        <CardTitle className="text-xl font-bold">
          <WrenchIcon className="inline-block mr-2 h-5 w-5" />
          {t("additionalServices.title")}
        </CardTitle>
      </CardHeader>
      <CardContent>
        {services.length > 0 ? (
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead>{t("additionalServices.serviceColumn")}</TableHead>
                <TableHead>{t("additionalServices.descriptionColumn")}</TableHead>
                <TableHead className="text-right">{t("additionalServices.priceColumn")}</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {services.map((service) => (
                <TableRow key={service.id}>
                  <TableCell className="font-medium">{service.serviceName}</TableCell>
                  <TableCell>{service.description || "-"}</TableCell>
                  <TableCell className="text-right">
                    {formatPrice(service.price)}
                  </TableCell>
                </TableRow>
              ))}
            </TableBody>
          </Table>
        ) : (
          <div className="text-center text-muted-foreground py-4">
            {t("additionalServices.empty")}
          </div>
        )}
      </CardContent>
    </Card>
  );
}
