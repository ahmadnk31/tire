"use client";

import { useTranslations } from "next-intl";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import * as z from "zod";
import { CalendarIcon, Loader2, Terminal, Check } from "lucide-react";
import { format } from "date-fns";
import { useState } from "react";
import { useQuery } from "@tanstack/react-query";
import {
  MultiSelector,
  MultiSelectorContent,
  MultiSelectorInput,
  MultiSelectorItem,
  MultiSelectorList,
  MultiSelectorTrigger,
} from "@/components/ui/multi-select";

import { Button } from "@/components/ui/button";
import {
  Form,
  FormControl,
  FormField,
  FormItem,
  FormLabel,
  FormMessage,
  FormDescription,
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
import { useCreatePromotion } from "@/hooks/use-promotion-actions";
import { PromotionType, PromotionTarget } from "@prisma/client";
import { Checkbox } from "@/components/ui/checkbox";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { ScrollArea } from "@/components/ui/scroll-area";
import { Badge } from "@/components/ui/badge";

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
  termsAndConditions: z.string().optional().nullable(),
  howToRedeem: z.string().optional().nullable(),
  promoCode: z.string().optional().nullable(),
  models: z.array(z.string()).optional()
});

// Types for products, brands, and categories
interface Product {
  id: string;
  name: string;
  brand?: {
    name: string;
  };
  model?: {
    name: string;
  };
  retailPrice: number;
}

interface Brand {
  id: string;
  name: string;
}

interface Category {
  id: string;
  name: string;
}

interface SubscriberGroup {
  id: string;
  name: string;
}

interface Model {
  id: string;
  name: string;
}


type FormValues = z.infer<typeof formSchema>;

interface AddPromotionFormProps {
  onSuccess: () => void;
}

export function AddPromotionForm({ onSuccess }: AddPromotionFormProps) {  const t = useTranslations("Dashboard.Promotions");
  const { mutate: createPromotion, isPending } = useCreatePromotion();

  // Fetch brands with React Query
  const { 
    data: brandsData,
    isLoading: loadingBrands,
    error: brandsError
  } = useQuery({
    queryKey: ['brands'],
    queryFn: async () => {
      const response = await fetch('/api/brands');
      if (!response.ok) throw new Error('Failed to fetch brands');
      const data = await response.json();
      return data.brands || [];
    }
  });

  // Fetch categories with React Query
  const { 
    data: categoriesData,
    isLoading: loadingCategories,
    error: categoriesError
  } = useQuery({
    queryKey: ['categories'],
    queryFn: async () => {
      const response = await fetch('/api/categories');
      if (!response.ok) throw new Error('Failed to fetch categories');
      const data = await response.json();
      return data.categories || [];
    }
  });

  // Fetch products with React Query
  const { 
    data: productsData,
    isLoading: loadingProducts,
    error: productsError
  } = useQuery({
    queryKey: ['products', 'promotion-form'],
    queryFn: async () => {
      const response = await fetch('/api/products?limit=100');
      if (!response.ok) throw new Error('Failed to fetch products');
      const data = await response.json();
      return data.products || [];
    }
  });

  const {
    data: modelsData,
    isLoading: loadingModels,
    error: modelsError
  } = useQuery({
    queryKey: ['models'],
    queryFn: async () => {
      const response = await fetch('/api/models');
      if (!response.ok) throw new Error('Failed to fetch models');
      const data = await response.json();
      return data || [];
    }
  });

  const {
    data: subscriberGroupsData,
    isLoading: loadingSubscriberGroups,
    error: subscriberGroupsError
  } = useQuery({
    queryKey: ['subscriber-groups'],
    queryFn: async () => {
      const response = await fetch('/api/newsletters/groups');
      if (!response.ok) throw new Error('Failed to fetch subscriber groups');
      const data = await response.json();
      return data || [];
    }
  });

  // Extract data from query results
  const brands = brandsData || [];
  const categories = categoriesData || [];
  const products = productsData || [];
  console.log("Products:", products);
  console.log("Brands:", brands);
  console.log("Categories:", categories);
  const models = modelsData || [];
  const subscriberGroups = subscriberGroupsData || [];
  console.log("Subscriber Groups:", subscriberGroups);
  console.log("Models:", models);
  const form = useForm<FormValues>({
    resolver: zodResolver(formSchema),    defaultValues: {
      title: "",
      description: "",
      type: "percentage",
      value: 0,
      minPurchaseAmount: null,
      buyQuantity: null,
      getQuantity: null,
      imageUrl: null,
      badgeType: "discount",
      colorScheme: "#4CAF50",
      startDate: new Date(),
      endDate: null,
      isActive: true,
      code: null,
      promoCode: null,
      usageLimit: null,
      target: "ALL",
      products: [],
      brands: [],
      categories: [],
      models: [],
      subscriberGroups: [],
      termsAndConditions: null,
      howToRedeem: null,
    },
  });
  const type = form.watch("type");
  const target = form.watch("target");
  const endDate = form.watch("endDate");

  function onSubmit(values: FormValues) {
    createPromotion(values, {
      onSuccess: () => {
        onSuccess();
        form.reset();
      },
    });
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
                <FormLabel>{t("form.type")}</FormLabel>
                <Select 
                  onValueChange={field.onChange} 
                  defaultValue={field.value}
                >
                  <FormControl>
                    <SelectTrigger>
                      <SelectValue placeholder={t("form.selectType")} />
                    </SelectTrigger>
                  </FormControl>                
                  <SelectContent>
                    <SelectItem value="percentage">{t("types.percentage")}</SelectItem>
                    <SelectItem value="fixed">{t("types.fixedAmount")}</SelectItem>
                    <SelectItem value="bogo">{t("types.buyXGetY")}</SelectItem>
                    <SelectItem value="free_shipping">{t("types.freeShipping")}</SelectItem>
                    <SelectItem value="gift">{t("types.gift")}</SelectItem>
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
          
          {/* Conditional fields based on promotion type */}          {type === "bogo" && (
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
                <FormLabel>{t("form.badgeType")}</FormLabel>
                <Select 
                  onValueChange={field.onChange} 
                  defaultValue={field.value}
                >
                  <FormControl>
                    <SelectTrigger>
                      <SelectValue placeholder={t("form.selectBadgeType")} />
                    </SelectTrigger>
                  </FormControl>
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
                <FormLabel>{t("form.colorScheme")}</FormLabel>
                <Select 
                  onValueChange={field.onChange} 
                  defaultValue={field.value}
                >
                  <FormControl>
                    <SelectTrigger>
                      <SelectValue placeholder={t("form.selectColor")} />
                    </SelectTrigger>
                  </FormControl>                
                  <SelectContent>
                    <SelectItem value="#2196F3">{t("colors.blue")}</SelectItem>
                    <SelectItem value="#4CAF50">{t("colors.green")}</SelectItem>
                    <SelectItem value="#F44336">{t("colors.red")}</SelectItem>
                    <SelectItem value="#9C27B0">{t("colors.purple")}</SelectItem>
                    <SelectItem value="#FF9800">{t("colors.orange")}</SelectItem>
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
                      disabled={(date) => date < new Date()}
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
                      onSelect={(date) => {
                        field.onChange(date);
                        form.setValue("endDate", date);
                        // Don't close popover automatically
                      }}
                      disabled={(date) => {
                        if (!date) return false;
                        const startDate = form.getValues("startDate");
                        return date < new Date() || (startDate && date < startDate);
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
                <FormLabel>{t("form.target")}</FormLabel>
                <Select 
                  onValueChange={field.onChange} 
                  defaultValue={field.value}
                >
                  <FormControl>
                    <SelectTrigger>
                      <SelectValue placeholder={t("form.selectTarget")} />
                    </SelectTrigger>
                  </FormControl>
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

        {/* Products, Brands, and Categories Targeting */}        <div className="grid grid-cols-1 gap-6 mt-4">
          <div>
            <h3 className="text-lg font-medium mb-3">Target Specific Products, Brands, or Categories</h3>
            <p className="text-sm text-muted-foreground mb-4">
              Select which products, brands, or categories this promotion applies to.
              Leave all unselected to apply to all products.
            </p>
          </div>

          <div className="grid grid-cols-1 gap-4">            
            <FormField
              control={form.control}
              name="products"
              render={({ field }) => (
                <FormItem className="col-span-1">
                  <FormLabel>{t("form.products")}</FormLabel>
                  <MultiSelector
                     values={field.value || []}
                     onValuesChange={field.onChange}
                  >
                    <MultiSelectorTrigger className={loadingProducts ? "opacity-50" : ""}>
                      <MultiSelectorInput placeholder={t("form.selectProducts")} />
                    </MultiSelectorTrigger>
                    <MultiSelectorContent>
                      {products.map((product: Product) => (
                        <MultiSelectorItem key={product.id} value={product.id}>
                          {product.name} {product.brand && `(${product.brand.name})`}
                        </MultiSelectorItem>
                      ))}
                    </MultiSelectorContent>
                  </MultiSelector>
                  <FormMessage />
                </FormItem>
              )}
            />

            <FormField
              control={form.control}
              name="brands"
              render={({ field }) => (
                <FormItem className="col-span-1">
                  <FormLabel>{t("form.brands")}</FormLabel>
                  <MultiSelector
                    values={field.value || []}
                    onValuesChange={field.onChange}
                  >
                    <MultiSelectorTrigger className={loadingBrands ? "opacity-50" : ""}>
                      <MultiSelectorInput placeholder={t("form.selectBrands")} />
                    </MultiSelectorTrigger>
                    <MultiSelectorContent>
                      {brands?.map((brand: Brand) => (
                        <MultiSelectorItem key={brand.id} value={brand.id}>
                          {brand.name}
                        </MultiSelectorItem>
                      ))}
                    </MultiSelectorContent>
                  </MultiSelector>
                  <FormMessage />
                </FormItem>
              )}
            />
            <FormField
              control={form.control}
              name="models"
              render={({ field }) => (
                <FormItem className="col-span-1">
                  <FormLabel>{t("form.models")}</FormLabel>
                  <MultiSelector
                    values={field.value || []}
                    onValuesChange={field.onChange}
                  >
                    <MultiSelectorTrigger className={loadingModels ? "opacity-50" : ""}>
                      <MultiSelectorInput placeholder={t("form.selectModels")} />
                    </MultiSelectorTrigger>
                    <MultiSelectorContent>
                      {modelsData?.map((model: Model) => (
                        <MultiSelectorItem key={model.id} value={model.id}>
                          {model.name}
                        </MultiSelectorItem>
                      ))}
                    </MultiSelectorContent>
                  </MultiSelector>
                  <FormMessage />
                </FormItem>
              )}
            />
            <FormField
              control={form.control}
              name="categories"
              render={({ field }) => (
                <FormItem className="col-span-1">
                  <FormLabel>{t("form.categories")}</FormLabel>
                  <MultiSelector
                    values={field.value || []}
                    onValuesChange={field.onChange}
                  >
                    <MultiSelectorTrigger className={loadingCategories ? "opacity-50" : ""}>
                      <MultiSelectorInput placeholder={t("form.selectCategories")} />
                    </MultiSelectorTrigger>
                    <MultiSelectorContent>
                      {categories?.map((category: Category) => (
                        <MultiSelectorItem key={category.id} value={category.id}>
                          {category.name}
                        </MultiSelectorItem>
                      ))}
                    </MultiSelectorContent>
                  </MultiSelector>
                  <FormMessage />
                </FormItem>
              )}
            />
          </div>
          </div>
        <div className="grid grid-cols-1 gap-4">
          <FormField
            control={form.control}
            name="subscriberGroups"
            render={({ field }) => (
              <FormItem className="col-span-1">
                <FormLabel>{t("form.subscriberGroups")}</FormLabel>
                <MultiSelector
                  values={field.value || []}
                  onValuesChange={field.onChange}
                >
                  <MultiSelectorTrigger className={loadingSubscriberGroups ? "opacity-50" : ""}>
                    <MultiSelectorInput placeholder={t("form.selectSubscriberGroups")} />
                  </MultiSelectorTrigger>
                  <MultiSelectorContent>
                    {subscriberGroupsData?.map((group: SubscriberGroup) => (
                      <MultiSelectorItem key={group.id} value={group.id}>
                        {group.name}
                      </MultiSelectorItem>
                    ))}
                  </MultiSelectorContent>
                </MultiSelector>
                <FormMessage />
              </FormItem>
            )}
          />
        </div>
        {/* Terms & Conditions and How to Redeem */}
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          <FormField
            control={form.control}
            name="termsAndConditions"
            render={({ field }) => (
              <FormItem>
                <FormLabel>{t("form.termsAndConditions")} ({t("form.optional")})</FormLabel>
                <FormControl>
                  <Textarea 
                    {...field} 
                    value={field.value || ""} 
                    className="min-h-[100px]"
                  />
                </FormControl>
                <FormMessage />
              </FormItem>
            )}
          />
          
          <FormField
            control={form.control}
            name="howToRedeem"
            render={({ field }) => (
              <FormItem>
                <FormLabel>{t("form.howToRedeem")} ({t("form.optional")})</FormLabel>
                <FormControl>
                  <Textarea 
                    {...field} 
                    value={field.value || ""} 
                    className="min-h-[100px]"
                  />
                </FormControl>
                <FormMessage />
              </FormItem>
            )}
          />
        </div>
        
        {/* Active Status */}
        <div className="flex items-center space-x-2">
          <FormField
            control={form.control}
            name="isActive"
            render={({ field }) => (
              <FormItem className="flex flex-row items-center space-x-3 space-y-0 rounded-md border p-4">
                <FormControl>
                  <Switch
                    checked={field.value}
                    onCheckedChange={field.onChange}
                  />
                </FormControl>
                <div className="space-y-1 leading-none">
                  <FormLabel>
                    {field.value ? t("form.active") : t("form.inactive")}
                  </FormLabel>
                  <FormDescription>
                    {t("form.activeDescription")}
                  </FormDescription>
                </div>
                <FormMessage />
              </FormItem>
            )}
          />
        </div>

        {/* Submit Button */}
        <Button type="submit" disabled={isPending} className="w-full md:w-auto">
          {isPending ? (
            <>
              <Loader2 className="mr-2 h-4 w-4 animate-spin" />
              {t("form.creating")}
            </>
          ) : (
            t("form.create")
          )}
        </Button>
      </form>
    </Form>
  );
}
