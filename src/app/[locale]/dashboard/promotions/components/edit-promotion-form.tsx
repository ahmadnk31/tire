"use client";

import { useEffect } from "react";
import { useTranslations } from "next-intl";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import * as z from "zod";
import { CalendarIcon, Loader2 } from "lucide-react";
import { format } from "date-fns";

import { Button } from "@/components/ui/button";
import {
  Form,
  FormControl,
  FormField,
  FormItem,
  FormLabel,
  FormMessage,
} from "@/components/ui/form";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Calendar } from "@/components/ui/calendar";
import {
  Popover,
  PopoverContent,
  PopoverTrigger,
} from "@/components/ui/popover";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { Switch } from "@/components/ui/switch";
import { FileUpload } from "@/components/file-upload";
import { useUpdatePromotion } from "@/hooks/use-promotion-actions";
import { Promotion, PromotionType, PromotionTarget } from "@prisma/client";

const formSchema = z.object({
  title: z.string().min(1, "Title is required"),
  description: z.string().min(1, "Description is required"),
  type: z.nativeEnum(PromotionType),
  value: z.number().min(0, "Value must be positive"),
  minPurchaseAmount: z.number().min(0, "Must be positive").optional().nullable(),
  buyQuantity: z.number().int().min(0, "Must be positive").optional().nullable(),
  getQuantity: z.number().int().min(0, "Must be positive").optional().nullable(),
  imageUrl: z.string().url("Must be a valid URL").optional().nullable(),
  badgeType: z.string().default("discount"),
  colorScheme: z.string().default("blue"),
  startDate: z.date(),
  endDate: z.date().optional().nullable(),
  isActive: z.boolean().default(true),
  code: z.string().optional().nullable(),
  usageLimit: z.number().int().min(0, "Must be positive").optional().nullable(),
  target: z.nativeEnum(PromotionTarget).default(PromotionTarget.ALL),
  products: z.array(z.string()).optional(),
  brands: z.array(z.string()).optional(),
  categories: z.array(z.string()).optional(),
  subscriberGroups: z.array(z.string()).optional(),
});

type FormValues = z.infer<typeof formSchema>;

interface EditPromotionFormProps {
  onSuccess: () => void;
  promotion: Promotion;
}

export function EditPromotionForm({ onSuccess, promotion }: EditPromotionFormProps) {
  const t = useTranslations("Dashboard.Promotions");
  const { mutate: updatePromotion, isPending } = useUpdatePromotion();
  
  const form = useForm<FormValues>({
    resolver: zodResolver(formSchema),
    defaultValues: {
      title: "",
      description: "",
      type: PromotionType.percentage,
      value: 0,
      minPurchaseAmount: null,
      buyQuantity: null,
      getQuantity: null,
      imageUrl: null,
      badgeType: "discount",
      colorScheme: "blue",
      startDate: new Date(),
      endDate: null,
      isActive: true,
      code: null,
      usageLimit: null,
      target: PromotionTarget.ALL,
      products: [],
      brands: [],
      categories: [],
      subscriberGroups: [],
    },
  });

  // Set form values when promotion data is available
  useEffect(() => {
    if (promotion) {
      form.reset({
        title: promotion.title,
        description: promotion.description,
        type: promotion.type,
        value: promotion.value,
        minPurchaseAmount: promotion.minPurchaseAmount,
        buyQuantity: promotion.buyQuantity,
        getQuantity: promotion.getQuantity,
        imageUrl: promotion.imageUrl || null,
        badgeType: promotion.badgeType,
        colorScheme: promotion.colorScheme,
        startDate: promotion.startDate ? new Date(promotion.startDate) : new Date(),
        endDate: promotion.endDate ? new Date(promotion.endDate) : null,
        isActive: promotion.isActive,
        code: promotion.code || null,
        usageLimit: promotion.usageLimit,
        target: promotion.target,
        // These would ideally be populated from the related entities
        products: [],
        brands: [],
        categories: [],
        subscriberGroups: [],
      });
    }
  }, [promotion, form]);

  const type = form.watch("type");
  const target = form.watch("target");

  function onSubmit(values: FormValues) {
    updatePromotion(
      { 
        id: promotion.id, 
        data: values 
      }, 
      {
        onSuccess: () => {
          onSuccess();
        },
      }
    );
  }

  return (
    <Form {...form}>
      <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-6">
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          {/* Basic Information */}
          <FormField
            control={form.control}
            name="title"
            render={({ field }) => (
              <FormItem>
                <FormLabel>{t("form.title")}</FormLabel>
                <FormControl>
                  <Input {...field} />
                </FormControl>
                <FormMessage />
              </FormItem>
            )}
          />
          
          <div className="space-y-2">
            <FormLabel>{t("form.image")}</FormLabel>
            <FormField
              control={form.control}
              name="imageUrl"
              render={({ field }) => (
                <FormItem>
                  <FormControl>                      
                    <FileUpload
                      folder="promotions"
                      value={field.value ? [
                        {
                          fileUrl: field.value,
                          name: field.value.split('/').pop() || '',
                          size: 0,
                          type: '',
                          lastModified: 0
                        }
                      ] : []}
                      onChange={(files) => field.onChange(files[0]?.fileUrl || null)}
                    />
                  </FormControl>
                  <FormMessage />
                </FormItem>
              )}
            />
          </div>
          
          <FormField
            control={form.control}
            name="description"
            render={({ field }) => (
              <FormItem className="col-span-2">
                <FormLabel>{t("form.description")}</FormLabel>
                <FormControl>
                  <Textarea 
                    {...field} 
                    className="min-h-[100px]" 
                  />
                </FormControl>
                <FormMessage />
              </FormItem>
            )}
          />
        </div>
        
        {/* Promotion Type and Value */}
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          <FormField
            control={form.control}
            name="type"
            render={({ field }) => (
              <FormItem>
                <FormLabel>{t("form.type")}</FormLabel>                <Select 
                  onValueChange={field.onChange} 
                  value={field.value}
                >
                  <SelectTrigger>
                    <SelectValue placeholder={t("form.selectType")} />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value={PromotionType.percentage}>{t("types.percentage")}</SelectItem>
                    <SelectItem value={PromotionType.fixed}>{t("types.fixedAmount")}</SelectItem>
                    <SelectItem value={PromotionType.bogo}>{t("types.buyXGetY")}</SelectItem>
                    <SelectItem value={PromotionType.free_shipping}>{t("types.freeShipping")}</SelectItem>
                    <SelectItem value={PromotionType.gift}>{t("types.gift")}</SelectItem>
                  </SelectContent>
                </Select>
                <FormMessage />
              </FormItem>
            )}
          />
          
          <FormField
            control={form.control}
            name="value"
            render={({ field }) => (
              <FormItem>
                <FormLabel>
                  {type === PromotionType.percentage 
                    ? t("form.percentageValue") 
                    : type === PromotionType.fixed 
                      ? t("form.fixedValue")
                      : t("form.value")
                  }
                </FormLabel>                
                <FormControl>
                  <Input 
                    {...field}
                    type="number"
                    value={field.value || 0}
                    onChange={e => field.onChange(e.target.value === "" ? 0 : parseFloat(e.target.value))}
                  />
                </FormControl>
                <FormMessage />
              </FormItem>
            )}
          />
          
          {/* Conditional fields based on promotion type */}
          {type === PromotionType.bogo && (
            <>
              <FormField
                control={form.control}
                name="buyQuantity"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>{t("form.buyQuantity")}</FormLabel>
                    <FormControl>
                      <Input 
                        {...field}
                        type="number"
                        value={field.value || ""}
                        onChange={e => field.onChange(e.target.value ? parseInt(e.target.value) : null)}
                      />
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />
              
              <FormField
                control={form.control}
                name="getQuantity"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>{t("form.getQuantity")}</FormLabel>
                    <FormControl>
                      <Input 
                        {...field}
                        type="number"
                        value={field.value || ""}
                        onChange={e => field.onChange(e.target.value ? parseInt(e.target.value) : null)}
                      />
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />
            </>
          )}
          
          <FormField
            control={form.control}
            name="minPurchaseAmount"
            render={({ field }) => (
              <FormItem>
                <FormLabel>{t("form.minPurchaseAmount")}</FormLabel>
                <FormControl>
                  <Input 
                    {...field}
                    type="number"
                    value={field.value || ""}
                    onChange={e => field.onChange(e.target.value ? parseFloat(e.target.value) : null)}
                  />
                </FormControl>
                <FormMessage />
              </FormItem>
            )}
          />
        </div>
        
        {/* UI Styling */}
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          <FormField
            control={form.control}
            name="badgeType"
            render={({ field }) => (
              <FormItem>
                <FormLabel>{t("form.badgeType")}</FormLabel>                <Select 
                  onValueChange={field.onChange} 
                  value={field.value}
                >
                  <SelectTrigger>
                    <SelectValue placeholder={t("form.selectBadgeType")} />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="discount">{t("badgeTypes.discount")}</SelectItem>
                    <SelectItem value="tag">{t("badgeTypes.tag")}</SelectItem>
                    <SelectItem value="gift">{t("badgeTypes.gift")}</SelectItem>
                    <SelectItem value="new">{t("badgeTypes.new")}</SelectItem>
                    <SelectItem value="sale">{t("badgeTypes.sale")}</SelectItem>
                  </SelectContent>
                </Select>
                <FormMessage />
              </FormItem>
            )}
          />
          
          <FormField
            control={form.control}
            name="colorScheme"
            render={({ field }) => (
              <FormItem>
                <FormLabel>{t("form.colorScheme")}</FormLabel>                <Select 
                  onValueChange={field.onChange} 
                  value={field.value}
                >
                  <SelectTrigger>
                    <SelectValue placeholder={t("form.selectColor")} />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="blue">{t("colors.blue")}</SelectItem>
                    <SelectItem value="green">{t("colors.green")}</SelectItem>
                    <SelectItem value="red">{t("colors.red")}</SelectItem>
                    <SelectItem value="purple">{t("colors.purple")}</SelectItem>
                    <SelectItem value="orange">{t("colors.orange")}</SelectItem>
                  </SelectContent>
                </Select>
                <FormMessage />
              </FormItem>
            )}
          />
        </div>
        
        {/* Dates */}
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          <FormField
            control={form.control}
            name="startDate"
            render={({ field }) => (
              <FormItem className="flex flex-col">
                <FormLabel>{t("form.startDate")}</FormLabel>
                <Popover>
                  <PopoverTrigger asChild>
                    <FormControl>
                      <Button
                        variant="outline"
                        className="w-full pl-3 text-left font-normal"
                      >
                        {field.value ? (
                          format(field.value, "PPP")
                        ) : (
                          <span>Pick a date</span>
                        )}
                        <CalendarIcon className="ml-auto h-4 w-4 opacity-50" />
                      </Button>
                    </FormControl>
                  </PopoverTrigger>                  
                  <PopoverContent className="w-auto p-0" align="start" onOpenAutoFocus={(e) => e.preventDefault()}>
                    <Calendar
                      mode="single"
                      selected={field.value}
                      onSelect={field.onChange}
                      initialFocus
                    />
                  </PopoverContent>
                </Popover>
                <FormMessage />
              </FormItem>
            )}
          />
          
          <FormField
            control={form.control}
            name="endDate"
            render={({ field }) => (
              <FormItem className="flex flex-col">
                <FormLabel>{t("form.endDate")} ({t("form.optional")})</FormLabel>
                <Popover>
                  <PopoverTrigger asChild>
                    <FormControl>
                      <Button
                        variant="outline"
                        className="w-full pl-3 text-left font-normal"
                      >
                        {field.value ? (
                          format(field.value, "PPP")
                        ) : (
                          <span>{t("form.noEndDate")}</span>
                        )}
                        <CalendarIcon className="ml-auto h-4 w-4 opacity-50" />
                      </Button>
                    </FormControl>
                  </PopoverTrigger>                  
                  <PopoverContent className="w-auto p-0" align="start" onOpenAutoFocus={(e) => e.preventDefault()}>
                    <Calendar
                      mode="single"
                      selected={field.value || undefined}
                      onSelect={field.onChange}
                      disabled={(date) => {
                        if (!date) return false;
                        const startDate = form.getValues("startDate");
                        return startDate && date < startDate;
                      }}
                      initialFocus
                    />
                  </PopoverContent>
                </Popover>
                <FormMessage />
              </FormItem>
            )}
          />
        </div>
        
        {/* Promotion Code & Usage */}
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          <FormField
            control={form.control}
            name="code"
            render={({ field }) => (
              <FormItem>
                <FormLabel>{t("form.promoCode")} ({t("form.optional")})</FormLabel>
                <FormControl>
                  <Input 
                    {...field} 
                    value={field.value || ""} 
                    placeholder="SUMMER2023" 
                  />
                </FormControl>
                <FormMessage />
              </FormItem>
            )}
          />
          
          <FormField
            control={form.control}
            name="usageLimit"
            render={({ field }) => (
              <FormItem>
                <FormLabel>{t("form.usageLimit")} ({t("form.optional")})</FormLabel>
                <FormControl>
                  <Input 
                    {...field}
                    type="number"
                    value={field.value || ""}
                    onChange={e => field.onChange(e.target.value ? parseInt(e.target.value) : null)}
                    placeholder="100"
                  />
                </FormControl>
                <FormMessage />
              </FormItem>
            )}
          />
        </div>
        
        {/* Targeting */}
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          <FormField
            control={form.control}
            name="target"
            render={({ field }) => (
              <FormItem>
                <FormLabel>{t("form.target")}</FormLabel>                <Select 
                  onValueChange={field.onChange} 
                  value={field.value}
                >
                  <SelectTrigger>
                    <SelectValue placeholder={t("form.selectTarget")} />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value={PromotionTarget.ALL}>{t("targets.all")}</SelectItem>
                    <SelectItem value={PromotionTarget.REGISTERED_USERS}>{t("targets.registeredUsers")}</SelectItem>
                    <SelectItem value={PromotionTarget.FIRST_TIME_CUSTOMERS}>{t("targets.firstTimeCustomers")}</SelectItem>
                    <SelectItem value={PromotionTarget.RETURNING_CUSTOMERS}>{t("targets.returningCustomers")}</SelectItem>
                    <SelectItem value={PromotionTarget.SPECIFIC_GROUP}>{t("targets.specificGroup")}</SelectItem>
                  </SelectContent>
                </Select>
                <FormMessage />
              </FormItem>
            )}
          />
        </div>
        
        {/* Status */}
        <div>
          <FormField
            control={form.control}
            name="isActive"
            render={({ field }) => (
              <FormItem className="flex flex-row items-center justify-between rounded-lg border p-4">
                <div className="space-y-0.5">
                  <FormLabel className="text-base">
                    {t("form.isActive")}
                  </FormLabel>
                  <div className="text-sm text-muted-foreground">
                    {t("form.isActiveDescription")}
                  </div>
                </div>
                <FormControl>
                  <Switch
                    checked={field.value}
                    onCheckedChange={field.onChange}
                  />
                </FormControl>
              </FormItem>
            )}
          />
        </div>
        
        {/* Submit Button */}
        <Button type="submit" className="w-full" disabled={isPending}>
          {isPending ? (
            <>
              <Loader2 className="mr-2 h-4 w-4 animate-spin" />
              {t("updating")}
            </>
          ) : (
            t("updatePromotion")
          )}
        </Button>
      </form>
    </Form>
  );
}
