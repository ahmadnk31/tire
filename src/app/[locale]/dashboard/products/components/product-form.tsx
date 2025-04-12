"use client"

import { useState } from "react"
import { useRouter } from "next/navigation"
import { useForm } from "react-hook-form"
import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query"
import { toast } from "sonner"
import * as z from "zod"
import { zodResolver } from "@hookform/resolvers/zod"
import { InfoIcon, Loader2, Save, Trash } from "lucide-react"

import { Button } from "@/components/ui/button"
import {
  Form,
  FormControl,
  FormDescription,
  FormField,
  FormItem,
  FormLabel,
  FormMessage,
} from "@/components/ui/form"
import { Input } from "@/components/ui/input"
import { FileUpload } from "@/components/file-upload"
import { Textarea } from "@/components/ui/textarea"
import { Card, CardContent, CardFooter, CardHeader, CardTitle } from "@/components/ui/card"
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select"
import {
  Tabs,
  TabsContent,
  TabsList,
  TabsTrigger,
} from "@/components/ui/tabs"
import { Badge } from "@/components/ui/badge"
import { Checkbox } from "@/components/ui/checkbox"
import { Tooltip, TooltipContent, TooltipTrigger } from "@/components/ui/tooltip"

// Interface matching our enhanced FileUpload component
interface UploadedFile {
  fileUrl: string;
  name: string;
  size: number;
  type: string;
  lastModified: number;
  key?: string;
}

const productFormSchema = z.object({
  // Basic info
  name: z.string().min(2, { message: "Product name must be at least 2 characters" }),
  description: z.string().optional(),
  brandId: z.string().min(1, { message: "Brand is required" }),
  modelId: z.string().min(1, { message: "Model is required" }),
  categoryId: z.string().min(1, { message: "Category is required" }),
  
  // Tire specs
  width: z.string().refine((val) => !isNaN(Number(val)) && Number(val) >= 0, {
    message: "Width must be a valid number",
  }),
  aspectRatio: z.string().refine((val) => !isNaN(Number(val)) && Number(val) >= 0, {
    message: "Aspect ratio must be a valid number",
  }),
  rimDiameter: z.string().refine((val) => !isNaN(Number(val)) && Number(val) >= 0, {
    message: "Rim diameter must be a valid number",
  }),
  loadIndex: z.string().refine((val) => !isNaN(Number(val)) && Number(val) >= 0, {
    message: "Load index must be a valid number",
  }),
  speedRating: z.string().min(1, { message: "Speed rating is required" }),
  treadDepth: z.string().refine((val) => !isNaN(Number(val)) && Number(val) >= 0, {
    message: "Tread depth must be a valid number",
  }),
  sidewallType: z.string().min(1, { message: "Sidewall type is required" }),
  tireType: z.string().min(1, { message: "Tire type is required" }),
  constructionType: z.string().optional(),
  maxInflationPressure: z.string().optional(),
  maxLoad: z.string().optional(),
  runFlat: z.boolean().default(false),
  reinforced: z.boolean().default(false),
  
  // Performance ratings
  treadPattern: z.string().min(1, { message: "Tread pattern is required" }),
  wetGrip: z.string().min(1, { message: "Wet grip rating is required" }),
  fuelEfficiency: z.string().min(1, { message: "Fuel efficiency rating is required" }),
  noiseLevel: z.string().min(1, { message: "Noise level is required" }),
  snowRating: z.string().min(1, { message: "Snow rating is required" }),
  treadwear: z.string().refine((val) => !isNaN(Number(val)) && Number(val) >= 0, {
    message: "Treadwear must be a valid number",
  }),
  traction: z.string().min(1, { message: "Traction rating is required" }),
  temperature: z.string().min(1, { message: "Temperature rating is required" }),
  
  // Additional specs
  mileageWarranty: z.string().refine((val) => val === "" || (!isNaN(Number(val)) && Number(val) >= 0), {
    message: "Mileage warranty must be a valid number",
  }).optional(),
  plyRating: z.string().refine((val) => !isNaN(Number(val)) && Number(val) >= 0, {
    message: "Ply rating must be a valid number",
  }),
  manufacturerPartNumber: z.string().min(1, { message: "Manufacturer part number is required" }),
  certifications: z.string().min(1, { message: "Certifications are required" }),
  countryOfOrigin: z.string().min(1, { message: "Country of origin is required" }),
  
  // Pricing and inventory
  retailPrice: z.string().refine((val) => !isNaN(Number(val)) && Number(val) >= 0, {
    message: "Retail price must be a valid number",
  }),
  wholesalePrice: z.string().refine((val) => !isNaN(Number(val)) && Number(val) >= 0, {
    message: "Wholesale price must be a valid number",
  }),
  discount: z.string().refine((val) => !isNaN(Number(val)) && Number(val) >= 0, {
    message: "Discount must be a valid number",
  }),
  retailerDiscount: z.string().refine((val) => !isNaN(Number(val)) && Number(val) >= 0, {
    message: "Retailer discount must be a valid number",
  }),
  stock: z.string().refine((val) => !isNaN(Number(val)) && Number(val) >= 0, {
    message: "Stock must be a valid number",
  }),
  
  // Visibility and featuring
  isVisible: z.boolean().default(true).optional(),
  isFeatured: z.boolean().default(false).optional(),
  isDiscontinued: z.boolean().default(false).optional(),
  
  // Images
  images: z.any().optional(),
})

type ProductFormValues = z.infer<typeof productFormSchema>

interface ProductFormProps {
  initialData?: {
    id: string
    name: string
    description?: string | null
    brandId: string
    modelId: string
    categoryId: string
    width: number
    aspectRatio: number
    rimDiameter: number
    loadIndex: number
    speedRating: string
    treadDepth: number
    sidewallType: string
    runFlat: boolean
    reinforced: boolean
    tireType: string
    constructionType?: string | null
    maxInflationPressure?: string | null
    maxLoad?: string | null
    treadPattern: string
    wetGrip: string
    fuelEfficiency: string
    noiseLevel: string
    snowRating: string
    treadwear: number
    traction: string
    temperature: string
    mileageWarranty?: number | null
    plyRating: number
    retailPrice: number
    discount: number
    stock: number
    manufacturerPartNumber: string
    certifications: string
    countryOfOrigin: string
    isVisible: boolean
    wholesalePrice: number
    isFeatured: boolean
    isDiscontinued: boolean
    retailerDiscount: number
    images: string[]
  }
  onClose?: () => void
}

export function ProductForm({ initialData, onClose }: ProductFormProps) {
  const router = useRouter()
  const queryClient = useQueryClient()
  const [activeTab, setActiveTab] = useState("basic")
  const [uploadedFiles, setUploadedFiles] = useState<UploadedFile[]>(() => {
    // If we have initialData with images, convert them to UploadedFile format
    if (initialData?.images && initialData.images.length > 0) {
      return initialData.images.map((imageUrl, index) => ({
        fileUrl: imageUrl,
        key: `product-image-${index}`,
        name: imageUrl.split('/').pop() || 'image',
        size: 0,
        type: 'image/jpeg',
        lastModified: Date.now(),
      }));
    }
    return [];
  });
  
  const [uploadProgress, setUploadProgress] = useState(0);

  const form = useForm<ProductFormValues>({
    resolver: zodResolver(productFormSchema),
    defaultValues: {
      name: initialData?.name || "",
      description: initialData?.description || "",
      brandId: initialData?.brandId || "",
      modelId: initialData?.modelId || "",
      categoryId: initialData?.categoryId || "",
      width: initialData?.width?.toString() || "",
      aspectRatio: initialData?.aspectRatio?.toString() || "",
      rimDiameter: initialData?.rimDiameter?.toString() || "",
      loadIndex: initialData?.loadIndex?.toString() || "",
      speedRating: initialData?.speedRating || "",
      treadDepth: initialData?.treadDepth?.toString() || "",
      sidewallType: initialData?.sidewallType || "",
      runFlat: initialData?.runFlat || false,
      reinforced: initialData?.reinforced || false,
      tireType: initialData?.tireType || "",
      constructionType: initialData?.constructionType || "",
      maxInflationPressure: initialData?.maxInflationPressure || "",
      maxLoad: initialData?.maxLoad || "",
      treadPattern: initialData?.treadPattern || "",
      wetGrip: initialData?.wetGrip || "",
      fuelEfficiency: initialData?.fuelEfficiency || "",
      noiseLevel: initialData?.noiseLevel || "",
      snowRating: initialData?.snowRating || "",
      treadwear: initialData?.treadwear?.toString() || "",
      traction: initialData?.traction || "",
      temperature: initialData?.temperature || "",
      mileageWarranty: initialData?.mileageWarranty?.toString() || "",
      plyRating: initialData?.plyRating?.toString() || "",
      retailPrice: initialData?.retailPrice?.toString() || "",
      wholesalePrice: initialData?.wholesalePrice?.toString() || "",
      discount: initialData?.discount?.toString() || "0",
      retailerDiscount: initialData?.retailerDiscount?.toString() || "0",
      stock: initialData?.stock?.toString() || "0",
      manufacturerPartNumber: initialData?.manufacturerPartNumber || "",
      certifications: initialData?.certifications || "",
      countryOfOrigin: initialData?.countryOfOrigin || "",
      isVisible: initialData?.isVisible !== undefined ? initialData.isVisible : true,
      isFeatured: initialData?.isFeatured !== undefined ? initialData.isFeatured : false,
      isDiscontinued: initialData?.isDiscontinued !== undefined ? initialData.isDiscontinued : false,
      images: undefined
    },
  })

  // Fetch brands data with React Query
  const { data: brandsData, isLoading: brandsLoading } = useQuery({
    queryKey: ["brands"],
    queryFn: async () => {
      const response = await fetch("/api/brands")
      if (!response.ok) {
        throw new Error("Failed to fetch brands")
      }
      return response.json()
    },
  })
  
  // Extract brands array from the response data
  const brands = brandsData?.brands || []
  
  // Fetch categories with React Query
  const { data: categoriesData, isLoading: categoriesLoading } = useQuery({
    queryKey: ["categories"],
    queryFn: async () => {
      const response = await fetch("/api/categories")
      if (!response.ok) {
        throw new Error("Failed to fetch categories")
      }
      return response.json()
    },
  })
  
  const categories = categoriesData?.categories || []
  console.log("Categories:", categories)
  // Fetch models for selected brand with React Query - only enabled when brandId is set
  const { data: models, isLoading: modelsLoading } = useQuery({
    queryKey: ["models", form.watch("brandId")],
    queryFn: async () => {
      const brandId = form.watch("brandId");
      if (!brandId) return [];
      
      const response = await fetch(`/api/brands/${brandId}/models`);
      if (!response.ok) {
        throw new Error("Failed to fetch models");
      }
      return response.json();
    },
    enabled: !!form.watch("brandId"),
  })

  // Create product mutation
  const createProductMutation = useMutation({
    mutationFn: async (formData: FormData) => {
      const response = await fetch("/api/products", {
        method: "POST",
        body: formData,
      });
      
      if (!response.ok) {
        const errorData = await response.json();
        throw new Error(errorData.error || "Failed to create product");
      }
      
      return response.json();
    },
    onSuccess: () => {
      toast.success("Product created successfully");
      queryClient.invalidateQueries({ queryKey: ["products"] });
      router.refresh();
      onClose?.();
    },
    onError: (error: Error) => {
      toast.error(error.message || "Failed to create product");
    }
  });

  // Update product mutation
  const updateProductMutation = useMutation({
    mutationFn: async (data: { id: string, formData: FormData }) => {
      const response = await fetch(`/api/products/${data.id}`, {
        method: "PATCH",
        body: data.formData,
      });
      
      if (!response.ok) {
        const errorData = await response.json();
        throw new Error(errorData.error || "Failed to update product");
      }
      
      return response.json();
    },
    onSuccess: () => {
      toast.success("Product updated successfully");
      queryClient.invalidateQueries({ queryKey: ["products"] });
      router.refresh();
      onClose?.();
    },
    onError: (error: Error) => {
      toast.error(error.message || "Failed to update product");
      console.error("Error updating product:", error);
    }
  });

  // Delete product mutation
  const deleteProductMutation = useMutation({
    mutationFn: async (id: string) => {
      const response = await fetch(`/api/products/${id}`, {
        method: "DELETE",
      });
      
      if (!response.ok) {
        const errorData = await response.json();
        throw new Error(errorData.error || "Failed to delete product");
      }
      
      return response.json();
    },
    onSuccess: () => {
      toast.success("Product deleted successfully");
      queryClient.invalidateQueries({ queryKey: ["products"] });
      router.refresh();
      onClose?.();
    },
    onError: (error: Error) => {
      toast.error(error.message || "Failed to delete product");
    }
  });

  const onSubmit = async (values: ProductFormValues) => {
    try {
      // Create a FormData object
      const formData = new FormData();
      
      // Add all form fields to formData
      Object.entries(values).forEach(([key, value]) => {
        if (value !== undefined && key !== "images") {
          formData.append(key, value.toString());
        }
      });

      // Add boolean values properly
      formData.set("isVisible", values.isVisible ? "true" : "false");
      formData.set("isFeatured", values.isFeatured ? "true" : "false");
      formData.set("isDiscontinued", values.isDiscontinued ? "true" : "false");
      formData.set("runFlat", values.runFlat ? "true" : "false");
      formData.set("reinforced", values.reinforced ? "true" : "false");
      
      // Improved image handling for both creation and updates
      if (uploadedFiles && uploadedFiles.length > 0) {
        // Clear approach: convert all images to JSON string
        formData.append('images', JSON.stringify(uploadedFiles.map(file => file.fileUrl)));
        
        // For each individual file URL
        uploadedFiles.forEach((file, index) => {
          formData.append(`images[${index}]`, file.fileUrl);
        });
        
        console.log("Sending images:", uploadedFiles.map(file => file.fileUrl));
      } else if (initialData) {
        // If we're updating but no images are selected, explicitly set empty array
        // to ensure backend knows we're intentionally removing all images
        formData.append('images', JSON.stringify([]));
        console.log("Clearing all images");
      }
      
      // Submit based on whether we're creating or updating
      if (initialData) {
        updateProductMutation.mutate({
          id: initialData.id,
          formData
        });
      } else {
        createProductMutation.mutate(formData);
      }
    } catch (error: any) {
      toast.error(error.message || "Something went wrong");
    }
  }

  const handleDelete = () => {
    if (initialData && window.confirm("Are you sure you want to delete this product?")) {
      deleteProductMutation.mutate(initialData.id);
    }
  }

  const handleFileChange = (files: UploadedFile[]) => {
    console.log("Files received in product form:", files);
    setUploadedFiles(files);
    
    // Immediately after setting the uploaded files, also update the form data
    // This ensures the form has the latest image data
    if (files && files.length > 0) {
      form.setValue('images', files);
    }
  }

  const isLoading = brandsLoading || categoriesLoading || (!!form.watch("brandId") && modelsLoading);
  const isPending = createProductMutation.isPending || updateProductMutation.isPending || deleteProductMutation.isPending;

  // Get validation errors for each tab to show on badges
  const getTabErrors = (tabName: string) => {
    const formErrors = form.formState.errors;
    const errorCount = Object.keys(formErrors).filter(key => {
      switch (tabName) {
        case "basic":
          return ["name", "description", "brandId", "modelId", "categoryId", "isVisible", "isFeatured", "isDiscontinued"].includes(key);
        case "specs":
          return ["width", "aspectRatio", "rimDiameter", "loadIndex", "speedRating", "treadDepth", "sidewallType", "runFlat", "reinforced", "tireType", "constructionType", "maxInflationPressure", "maxLoad"].includes(key);
        case "performance":
          return ["treadPattern", "wetGrip", "fuelEfficiency", "noiseLevel", "snowRating", "treadwear", "traction", "temperature"].includes(key);
        case "additional":
          return ["mileageWarranty", "plyRating", "manufacturerPartNumber", "certifications", "countryOfOrigin"].includes(key);
        case "pricing":
          return ["retailPrice", "discount", "stock"].includes(key);
        case "images":
          return ["images"].includes(key);
        default:
          return false;
      }
    }).length;
    
    return errorCount;
  };

  if (isLoading) {
    return (
      <div className="flex justify-center items-center h-64">
        <Loader2 className="h-8 w-8 animate-spin text-primary" />
      </div>
    );
  }

  return (
    <Card className=" min-h-[600px] w-full overflow-y-auto">
      <CardHeader>
        <CardTitle>{initialData ? "Edit Product" : "Create Product"}</CardTitle>
      </CardHeader>
      <Form {...form}>
        <form onSubmit={form.handleSubmit(onSubmit)}>
          <Tabs value={activeTab} onValueChange={setActiveTab} className="w-full">
            <TabsList className="grid grid-cols-6 w-full">
              <TabsTrigger value="basic" className="relative">
                Basic Info
                {getTabErrors("basic") > 0 && (
                  <Badge variant="destructive" className="absolute -top-2 -right-2 h-5 w-5 p-0 flex items-center justify-center rounded-full">
                    {getTabErrors("basic")}
                  </Badge>
                )}
              </TabsTrigger>
              <TabsTrigger value="specs" className="relative">
                Specs
                {getTabErrors("specs") > 0 && (
                  <Badge variant="destructive" className="absolute -top-2 -right-2 h-5 w-5 p-0 flex items-center justify-center rounded-full">
                    {getTabErrors("specs")}
                  </Badge>
                )}
              </TabsTrigger>
              <TabsTrigger value="performance" className="relative">
                Performance
                {getTabErrors("performance") > 0 && (
                  <Badge variant="destructive" className="absolute -top-2 -right-2 h-5 w-5 p-0 flex items-center justify-center rounded-full">
                    {getTabErrors("performance")}
                  </Badge>
                )}
              </TabsTrigger>
              <TabsTrigger value="additional" className="relative">
                Additional
                {getTabErrors("additional") > 0 && (
                  <Badge variant="destructive" className="absolute -top-2 -right-2 h-5 w-5 p-0 flex items-center justify-center rounded-full">
                    {getTabErrors("additional")}
                  </Badge>
                )}
              </TabsTrigger>
              <TabsTrigger value="pricing" className="relative">
                Pricing
                {getTabErrors("pricing") > 0 && (
                  <Badge variant="destructive" className="absolute -top-2 -right-2 h-5 w-5 p-0 flex items-center justify-center rounded-full">
                    {getTabErrors("pricing")}
                  </Badge>
                )}
              </TabsTrigger>
              <TabsTrigger value="images" className="relative">
                Images
                {getTabErrors("images") > 0 && (
                  <Badge variant="destructive" className="absolute -top-2 -right-2 h-5 w-5 p-0 flex items-center justify-center rounded-full">
                    {getTabErrors("images")}
                  </Badge>
                )}
              </TabsTrigger>
            </TabsList>
            
            <CardContent className="pt-6">
              {/* Basic Information Tab */}
              <TabsContent value="basic" className="space-y-4">
                <div className="grid grid-cols-1 gap-4">
                  <FormField
                    control={form.control}
                    name="name"
                    render={({ field }) => (
                      <FormItem>
                        <FormLabel>Product Name</FormLabel>
                        <FormControl>
                          <Input placeholder="Enter product name" {...field} disabled={isPending} />
                        </FormControl>
                        <FormMessage />
                      </FormItem>
                    )}
                  />
                  
                  <FormField
                    control={form.control}
                    name="description"
                    render={({ field }) => (
                      <FormItem>
                        <FormLabel>Description</FormLabel>
                        <FormControl>
                          <Textarea placeholder="Enter product description" {...field} disabled={isPending} />
                        </FormControl>
                        <FormMessage />
                      </FormItem>
                    )}
                  />
                </div>
                
                <div className="grid grid-cols-3 gap-4">
                  <FormField
                    control={form.control}
                    name="brandId"
                    render={({ field }) => (
                      <FormItem>
                        <FormLabel>Brand</FormLabel>
                        <Select onValueChange={field.onChange} defaultValue={field.value} disabled={isPending}>
                          <FormControl>
                            <SelectTrigger>
                              <SelectValue placeholder="Select a brand" />
                            </SelectTrigger>
                          </FormControl>
                          <SelectContent>
                            {brands?.map((brand: any) => (
                              <SelectItem key={brand.id} value={brand.id}>
                                {brand.name}
                              </SelectItem>
                            ))}
                          </SelectContent>
                        </Select>
                        <FormMessage />
                      </FormItem>
                    )}
                  />
                  
                  <FormField
                    control={form.control}
                    name="modelId"
                    render={({ field }) => (
                      <FormItem>
                        <FormLabel>Model</FormLabel>
                        <Select 
                          onValueChange={field.onChange} 
                          defaultValue={field.value} 
                          disabled={isPending || !form.watch("brandId") || modelsLoading}
                        >
                          <FormControl>
                            <SelectTrigger>
                              {modelsLoading ? (
                                <div className="flex items-center">
                                  <Loader2 className="h-4 w-4 mr-2 animate-spin" />
                                  Loading...
                                </div>
                              ) : (
                                <SelectValue placeholder="Select a model" />
                              )}
                            </SelectTrigger>
                          </FormControl>
                          <SelectContent>
                            {models?.map((model: any) => (
                              <SelectItem key={model.id} value={model.id}>
                                {model.name}
                              </SelectItem>
                            ))}
                          </SelectContent>
                        </Select>
                        <FormMessage />
                      </FormItem>
                    )}
                  />
                  
                  <FormField
                    control={form.control}
                    name="categoryId"
                    render={({ field }) => (
                      <FormItem>
                        <FormLabel>Category</FormLabel>
                        <Select onValueChange={field.onChange} defaultValue={field.value} disabled={isPending}>
                          <FormControl>
                            <SelectTrigger>
                              <SelectValue placeholder="Select a category" />
                            </SelectTrigger>
                          </FormControl>
                          <SelectContent>
                            {categories?.map((category: any) => (
                              <SelectItem key={category.id} value={category.id}>
                                {category.name}
                              </SelectItem>
                            ))}
                          </SelectContent>
                        </Select>
                        <FormMessage />
                      </FormItem>
                    )}
                  />
                </div>

                {/* Product visibility controls */}
                <div className="space-y-4 mt-4">
                  <h3 className="text-lg font-medium">Product Visibility</h3>
                  <div className="grid grid-cols-3 gap-4">
                    <FormField
                      control={form.control}
                      name="isVisible"
                      render={({ field }) => (
                        <FormItem className="flex flex-row items-start space-x-3 space-y-0 rounded-md border p-4">
                          <FormControl>
                            <Checkbox
                              checked={field.value}
                              onCheckedChange={field.onChange}
                              disabled={isPending}
                            />
                          </FormControl>
                          <div className="space-y-1 leading-none">
                            <FormLabel>Visible</FormLabel>
                            <FormDescription>
                              Product is visible in catalog and search results
                            </FormDescription>
                          </div>
                        </FormItem>
                      )}
                    />
                    
                    <FormField
                      control={form.control}
                      name="isFeatured"
                      render={({ field }) => (
                        <FormItem className="flex flex-row items-start space-x-3 space-y-0 rounded-md border p-4">
                          <FormControl>
                            <Checkbox
                              checked={field.value}
                              onCheckedChange={field.onChange}
                              disabled={isPending}
                            />
                          </FormControl>
                          <div className="space-y-1 leading-none">
                            <FormLabel>Featured</FormLabel>
                            <FormDescription>
                              Highlighted on homepage and category pages
                            </FormDescription>
                          </div>
                        </FormItem>
                      )}
                    />
                    
                    <FormField
                      control={form.control}
                      name="isDiscontinued"
                      render={({ field }) => (
                        <FormItem className="flex flex-row items-start space-x-3 space-y-0 rounded-md border p-4">
                          <FormControl>
                            <Checkbox
                              checked={field.value}
                              onCheckedChange={field.onChange}
                              disabled={isPending}
                            />
                          </FormControl>
                          <div className="space-y-1 leading-none">
                            <FormLabel>Discontinued</FormLabel>
                            <FormDescription>
                              Mark product as discontinued (still visible but with discontinued label)
                            </FormDescription>
                          </div>
                        </FormItem>
                      )}
                    />
                  </div>
                </div>
              </TabsContent>
              
              {/* Tire Specifications Tab */}
              <TabsContent value="specs" className="space-y-4">
                <div className="grid grid-cols-3 gap-4">
                  <FormField
                    control={form.control}
                    name="width"
                    render={({ field }) => (
                      <FormItem>
                        <FormLabel>Width (mm)</FormLabel>
                        <FormControl>
                          <Input type="number" placeholder="e.g., 225" {...field} disabled={isPending} />
                        </FormControl>
                        <FormMessage />
                      </FormItem>
                    )}
                  />
                  
                  <FormField
                    control={form.control}
                    name="aspectRatio"
                    render={({ field }) => (
                      <FormItem>
                        <FormLabel>Aspect Ratio</FormLabel>
                        <FormControl>
                          <Input type="number" placeholder="e.g., 65" {...field} disabled={isPending} />
                        </FormControl>
                        <FormMessage />
                      </FormItem>
                    )}
                  />
                  
                  <FormField
                    control={form.control}
                    name="rimDiameter"
                    render={({ field }) => (
                      <FormItem>
                        <FormLabel>Rim Diameter (inches)</FormLabel>
                        <FormControl>
                          <Input type="number" placeholder="e.g., 17" {...field} disabled={isPending} />
                        </FormControl>
                        <FormMessage />
                      </FormItem>
                    )}
                  />
                </div>
                
                <div className="grid grid-cols-3 gap-4">
                  <FormField
                    control={form.control}
                    name="loadIndex"
                    render={({ field }) => (
                      <FormItem>
                        <FormLabel>Load Index</FormLabel>
                        <FormControl>
                          <Input type="number" placeholder="e.g., 94" {...field} disabled={isPending} />
                        </FormControl>
                        <FormMessage />
                      </FormItem>
                    )}
                  />
                  
                  <FormField
                    control={form.control}
                    name="speedRating"
                    render={({ field }) => (
                      <FormItem>
                        <FormLabel>Speed Rating</FormLabel>
                        <FormControl>
                          <Input placeholder="e.g., H" {...field} disabled={isPending} />
                        </FormControl>
                        <FormMessage />
                      </FormItem>
                    )}
                  />
                  
                  <FormField
                    control={form.control}
                    name="treadDepth"
                    render={({ field }) => (
                      <FormItem>
                        <FormLabel>Tread Depth (mm)</FormLabel>
                        <FormControl>
                          <Input
                            type="number"
                            step="0.1"
                            placeholder="e.g., 8.5"
                            {...field}
                            disabled={isPending}
                          />
                        </FormControl>
                        <FormMessage />
                      </FormItem>
                    )}
                  />
                </div>
                
                <div className="grid grid-cols-3 gap-4">
                  <FormField
                    control={form.control}
                    name="sidewallType"
                    render={({ field }) => (
                      <FormItem>
                        <FormLabel>Sidewall Type</FormLabel>
                        <FormControl>
                          <Input placeholder="e.g., Black" {...field} disabled={isPending} />
                        </FormControl>
                        <FormMessage />
                      </FormItem>
                    )}
                  />
                  
                  <FormField
                    control={form.control}
                    name="runFlat"
                    render={({ field }) => (
                      <FormItem className="flex flex-row items-start space-x-3 space-y-0 rounded-md border p-4">
                        <FormControl>
                          <Checkbox
                            checked={field.value}
                            onCheckedChange={field.onChange}
                            disabled={isPending}
                          />
                        </FormControl>
                        <div className="space-y-1 leading-none">
                          <FormLabel>Run Flat</FormLabel>
                          <FormDescription>
                            Tire can temporarily be used when flat
                          </FormDescription>
                        </div>
                      </FormItem>
                    )}
                  />
                  
                  <FormField
                    control={form.control}
                    name="reinforced"
                    render={({ field }) => (
                      <FormItem className="flex flex-row items-start space-x-3 space-y-0 rounded-md border p-4">
                        <FormControl>
                          <Checkbox
                            checked={field.value}
                            onCheckedChange={field.onChange}
                            disabled={isPending}
                          />
                        </FormControl>
                        <div className="space-y-1 leading-none">
                          <FormLabel>Reinforced</FormLabel>
                          <FormDescription>
                            Has reinforced sidewalls for extra durability
                          </FormDescription>
                        </div>
                      </FormItem>
                    )}
                  />
                </div>

                <div className="grid grid-cols-3 gap-4">
                  <FormField
                    control={form.control}
                    name="tireType"
                    render={({ field }) => (
                      <FormItem>
                        <FormLabel>Tire Type</FormLabel>
                        <Select onValueChange={field.onChange} defaultValue={field.value} disabled={isPending}>
                          <FormControl>
                            <SelectTrigger>
                              <SelectValue placeholder="Select tire type" />
                            </SelectTrigger>
                          </FormControl>
                          <SelectContent>
                            <SelectItem value="ALL_SEASON">All Season</SelectItem>
                            <SelectItem value="SUMMER">Summer</SelectItem>
                            <SelectItem value="WINTER">Winter</SelectItem>
                            <SelectItem value="ALL_TERRAIN">All Terrain</SelectItem>
                            <SelectItem value="MUD_TERRAIN">Mud Terrain</SelectItem>
                            <SelectItem value="HIGH_PERFORMANCE">High Performance</SelectItem>
                            <SelectItem value="TOURING">Touring</SelectItem>
                            <SelectItem value="HIGHWAY">Highway</SelectItem>
                            <SelectItem value="COMMERCIAL">Commercial</SelectItem>
                            <SelectItem value="TRACK">Track</SelectItem>
                          </SelectContent>
                        </Select>
                        <FormMessage />
                      </FormItem>
                    )}
                  />
                  
                  <FormField
                    control={form.control}
                    name="constructionType"
                    render={({ field }) => (
                      <FormItem>
                        <FormLabel>Construction Type</FormLabel>
                        <Select onValueChange={field.onChange} defaultValue={field.value} disabled={isPending}>
                          <FormControl>
                            <SelectTrigger>
                              <SelectValue placeholder="Select construction type" />
                            </SelectTrigger>
                          </FormControl>
                          <SelectContent>
                            <SelectItem value="Radial">Radial</SelectItem>
                            <SelectItem value="Bias">Bias</SelectItem>
                            <SelectItem value="Bias-Belted">Bias-Belted</SelectItem>
                          </SelectContent>
                        </Select>
                        <FormMessage />
                      </FormItem>
                    )}
                  />
                  
                  <FormField
                    control={form.control}
                    name="maxInflationPressure"
                    render={({ field }) => (
                      <FormItem>
                        <FormLabel>Max Inflation Pressure (psi)</FormLabel>
                        <FormControl>
                          <Input type="number" placeholder="e.g., 44" {...field} disabled={isPending} />
                        </FormControl>
                        <FormMessage />
                      </FormItem>
                    )}
                  />
                </div>

                <div className="grid grid-cols-3 gap-4">
                  <FormField
                    control={form.control}
                    name="maxLoad"
                    render={({ field }) => (
                      <FormItem>
                        <FormLabel>Max Load (lbs)</FormLabel>
                        <FormControl>
                          <Input type="number" placeholder="e.g., 1700" {...field} disabled={isPending} />
                        </FormControl>
                        <FormMessage />
                      </FormItem>
                    )}
                  />
                </div>
              </TabsContent>
              
              {/* Performance Ratings Tab */}
              <TabsContent value="performance" className="space-y-4">
                <div className="grid grid-cols-2 gap-4">
                  <FormField
                    control={form.control}
                    name="treadPattern"
                    render={({ field }) => (
                      <FormItem>
                        <FormLabel>Tread Pattern</FormLabel>
                        <FormControl>
                          <Input placeholder="e.g., Symmetrical" {...field} disabled={isPending} />
                        </FormControl>
                        <FormMessage />
                      </FormItem>
                    )}
                  />
                  
                  <FormField
                    control={form.control}
                    name="wetGrip"
                    render={({ field }) => (
                      <FormItem>
                        <FormLabel>Wet Grip Rating</FormLabel>
                        <FormControl>
                          <Input placeholder="e.g., A" {...field} disabled={isPending} />
                        </FormControl>
                        <FormMessage />
                      </FormItem>
                    )}
                  />
                </div>
                
                <div className="grid grid-cols-3 gap-4">
                  <FormField
                    control={form.control}
                    name="fuelEfficiency"
                    render={({ field }) => (
                      <FormItem>
                        <FormLabel>Fuel Efficiency</FormLabel>
                        <FormControl>
                          <Input placeholder="e.g., B" {...field} disabled={isPending} />
                        </FormControl>
                        <FormMessage />
                      </FormItem>
                    )}
                  />
                  
                  <FormField
                    control={form.control}
                    name="noiseLevel"
                    render={({ field }) => (
                      <FormItem>
                        <FormLabel>Noise Level</FormLabel>
                        <FormControl>
                          <Input placeholder="e.g., 70dB" {...field} disabled={isPending} />
                        </FormControl>
                        <FormMessage />
                      </FormItem>
                    )}
                  />
                  
                  <FormField
                    control={form.control}
                    name="snowRating"
                    render={({ field }) => (
                      <FormItem>
                        <FormLabel>Snow Rating</FormLabel>
                        <FormControl>
                          <Input placeholder="e.g., 3PMSF" {...field} disabled={isPending} />
                        </FormControl>
                        <FormMessage />
                      </FormItem>
                    )}
                  />
                </div>
                
                <div className="grid grid-cols-3 gap-4">
                  <FormField
                    control={form.control}
                    name="treadwear"
                    render={({ field }) => (
                      <FormItem>
                        <FormLabel>Treadwear Rating</FormLabel>
                        <FormControl>
                          <Input
                            type="number"
                            step="0.01"
                            placeholder="Enter treadwear rating"
                            {...field}
                            disabled={isPending}
                          />
                        </FormControl>
                        <FormMessage />
                      </FormItem>
                    )}
                  />
                  
                  <FormField
                    control={form.control}
                    name="traction"
                    render={({ field }) => (
                      <FormItem>
                        <FormLabel>Traction Rating</FormLabel>
                        <FormControl>
                          <Input placeholder="e.g., A" {...field} disabled={isPending} />
                        </FormControl>
                        <FormMessage />
                      </FormItem>
                    )}
                  />
                  
                  <FormField
                    control={form.control}
                    name="temperature"
                    render={({ field }) => (
                      <FormItem>
                        <FormLabel>Temperature Rating</FormLabel>
                        <FormControl>
                          <Input placeholder="e.g., B" {...field} disabled={isPending} />
                        </FormControl>
                        <FormMessage />
                      </FormItem>
                    )}
                  />
                </div>
              </TabsContent>
              
              {/* Additional Information Tab */}
              <TabsContent value="additional" className="space-y-4">
                <div className="grid grid-cols-2 gap-4">
                  <FormField
                    control={form.control}
                    name="mileageWarranty"
                    render={({ field }) => (
                      <FormItem>
                        <FormLabel>Mileage Warranty (miles)</FormLabel>
                        <FormControl>
                          <Input type="number" placeholder="e.g., 50000" {...field} disabled={isPending} />
                        </FormControl>
                        <FormMessage />
                      </FormItem>
                    )}
                  />
                  
                  <FormField
                    control={form.control}
                    name="plyRating"
                    render={({ field }) => (
                      <FormItem>
                        <FormLabel>Ply Rating</FormLabel>
                        <FormControl>
                          <Input type="number" placeholder="e.g., 4" {...field} disabled={isPending} />
                        </FormControl>
                        <FormMessage />
                      </FormItem>
                    )}
                  />
                </div>
                
                <div className="grid grid-cols-3 gap-4">
                  <FormField
                    control={form.control}
                    name="manufacturerPartNumber"
                    render={({ field }) => (
                      <FormItem>
                        <FormLabel>Manufacturer Part Number</FormLabel>
                        <FormControl>
                          <Input placeholder="Enter part number" {...field} disabled={isPending} />
                        </FormControl>
                        <FormMessage />
                      </FormItem>
                    )}
                  />
                  
                  <FormField
                    control={form.control}
                    name="certifications"
                    render={({ field }) => (
                      <FormItem>
                        <FormLabel>Certifications</FormLabel>
                        <FormControl>
                          <Input placeholder="e.g., DOT, ECE" {...field} disabled={isPending} />
                        </FormControl>
                        <FormMessage />
                      </FormItem>
                    )}
                  />
                  
                  <FormField
                    control={form.control}
                    name="countryOfOrigin"
                    render={({ field }) => (
                      <FormItem>
                        <FormLabel>Country of Origin</FormLabel>
                        <FormControl>
                          <Input placeholder="e.g., Japan" {...field} disabled={isPending} />
                        </FormControl>
                        <FormMessage />
                      </FormItem>
                    )}
                  />
                </div>
              </TabsContent>
              
              {/* Pricing and Inventory Tab */}
              <TabsContent value="pricing" className="space-y-4">
                <div className="grid grid-cols-3 gap-4">
                  <FormField
                    control={form.control}
                    name="retailPrice"
                    render={({ field }) => (
                      <FormItem>
                        <div className="flex items-center gap-2">
                          <FormLabel>Retail Price ($)</FormLabel>
                          <Tooltip>
                            <TooltipTrigger asChild>
                              <InfoIcon className="h-4 w-4 text-muted-foreground" />
                            </TooltipTrigger>
                            <TooltipContent className="max-w-80">
                              <p>Set the base retail price for individual customers. The retail price should typically be higher than the wholesale price to provide margin for retailers.</p>
                            </TooltipContent>
                          </Tooltip>
                        </div>
                        <FormControl>
                          <Input type="number" min={0} step={0.01} placeholder="0.00" {...field} />
                        </FormControl>
                        <FormMessage />
                      </FormItem>
                    )}
                  />
                  
                  <FormField
                    control={form.control}
                    name="wholesalePrice"
                    render={({ field }) => (
                      <FormItem>
                        <FormLabel>Wholesale Price</FormLabel>
                        <FormControl>
                          <Input
                            type="number"
                            step="0.01"
                            placeholder="Enter wholesale price"
                            {...field}
                            disabled={isPending}
                          />
                        </FormControl>
                        <FormMessage />
                      </FormItem>
                    )}
                  />
                  
                  <FormField
                    control={form.control}
                    name="discount"
                    render={({ field }) => (
                      <FormItem>
                        <FormLabel>Discount (%)</FormLabel>
                        <FormControl>
                          <Input
                            type="number"
                            min="0"
                            max="100"
                            step="0.1"
                            placeholder="Enter discount percentage"
                            {...field}
                            disabled={isPending}
                          />
                        </FormControl>
                        <FormMessage />
                      </FormItem>
                    )}
                  />
                  
                  <FormField
                    control={form.control}
                    name="retailerDiscount"
                    render={({ field }) => (
                      <FormItem>
                        <FormLabel>Retailer Discount (%)</FormLabel>
                        <FormControl>
                          <Input
                            type="number"
                            min="0"
                            max="100"
                            step="0.1"
                            placeholder="Enter retailer discount percentage"
                            {...field}
                            disabled={isPending}
                          />
                        </FormControl>
                        <FormMessage />
                      </FormItem>
                    )}
                  />
                  
                  <FormField
                    control={form.control}
                    name="stock"
                    render={({ field }) => (
                      <FormItem>
                        <FormLabel>Stock</FormLabel>
                        <FormControl>
                          <Input type="number" placeholder="Enter stock" {...field} disabled={isPending} />
                        </FormControl>
                        <FormMessage />
                      </FormItem>
                    )}
                  />
                </div>
                
                {/* Sale price calculator */}
                <div className="rounded-md border p-4 bg-gray-50">
                  <div className="text-lg font-medium mb-4">Price Comparison</div>
                  <div className="grid grid-cols-2 gap-6">
                    {/* Retail pricing card */}
                    <div className="rounded-md border bg-white p-4 shadow-sm">
                      <div className="text-md font-semibold mb-3 text-blue-600">Retail Customer Pricing</div>
                      <div className="space-y-2">
                        <div className="flex justify-between">
                          <span>Base Price:</span>
                          <span className="font-medium">${form.watch("retailPrice") || "0.00"}</span>
                        </div>
                        <div className="flex justify-between">
                          <span>Discount ({form.watch("discount") || "0"}%):</span>
                          <span className="font-medium text-red-500">
                            -${(parseFloat(form.watch("retailPrice") || "0") * parseFloat(form.watch("discount") || "0") / 100).toFixed(2)}
                          </span>
                        </div>
                        <div className="h-px bg-gray-200 my-2"></div>
                        <div className="flex justify-between">
                          <span className="font-bold">Final Price:</span>
                          <span className="font-bold text-green-600">
                            ${(parseFloat(form.watch("retailPrice") || "0") * (1 - parseFloat(form.watch("discount") || "0") / 100)).toFixed(2)}
                          </span>
                        </div>
                      </div>
                    </div>
                    
                    {/* Wholesale pricing card */}
                    <div className="rounded-md border bg-white p-4 shadow-sm">
                      <div className="text-md font-semibold mb-3 text-amber-600">Retailer Wholesale Pricing</div>
                      <div className="space-y-2">
                        <div className="flex justify-between">
                          <span>Base Price:</span>
                          <span className="font-medium">${form.watch("wholesalePrice") || "0.00"}</span>
                        </div>
                        <div className="flex justify-between">
                          <span>Retailer Discount ({form.watch("retailerDiscount") || "0"}%):</span>
                          <span className="font-medium text-red-500">
                            -${(parseFloat(form.watch("wholesalePrice") || "0") * parseFloat(form.watch("retailerDiscount") || "0") / 100).toFixed(2)}
                          </span>
                        </div>
                        <div className="h-px bg-gray-200 my-2"></div>
                        <div className="flex justify-between">
                          <span className="font-bold">Final Price:</span>
                          <span className="font-bold text-amber-600">
                            ${(parseFloat(form.watch("wholesalePrice") || "0") * (1 - parseFloat(form.watch("retailerDiscount") || "0") / 100)).toFixed(2)}
                          </span>
                        </div>
                      </div>
                    </div>
                  </div>
                  
                  {/* Profit comparison */}
                  <div className="mt-4 p-3 border rounded-md bg-white">
                    <div className="text-sm font-medium mb-2">Profit Analysis</div>
                    <div className="grid grid-cols-2 gap-4">
                      <div>
                        <div className="text-xs text-gray-500">Retail-Wholesale Price Difference:</div>
                        <div className="font-medium">
                          ${(Math.max(
                            0,
                            parseFloat(form.watch("retailPrice") || "0") - parseFloat(form.watch("discount") || "0")
                          ) - Math.max(
                            0,
                            parseFloat(form.watch("wholesalePrice") || "0") - parseFloat(form.watch("retailerDiscount") || "0")
                          )).toFixed(2)}
                        </div>
                      </div>
                      <div>
                        <div className="text-xs text-gray-500">Retailer Margin:</div>
                        <div className="font-medium">
                          {parseFloat(form.watch("wholesalePrice") || "0") > 0 ? 
                            ((parseFloat(form.watch("retailPrice") || "0") - parseFloat(form.watch("wholesalePrice") || "0")) / 
                              parseFloat(form.watch("retailPrice") || "1") * 100).toFixed(1) + "%" 
                            : "0.0%"}
                        </div>
                      </div>
                    </div>
                  </div>
                </div>
              </TabsContent>
              
              {/* Images Tab */}
              <TabsContent value="images" className="space-y-4">
                <FormField
                  control={form.control}
                  name="images"
                  render={() => (
                    <FormItem>
                      <FormLabel>Product Images</FormLabel>
                      <FormControl>
                        <div className="space-y-4">
                          <FileUpload
                            onChange={handleFileChange}
                            multiple={true}
                            value={uploadedFiles}
                            folder="products"
                            maxSize={5}
                            allowedTypes={['image/jpeg', 'image/png', 'image/webp']}
                            onUploadProgress={setUploadProgress}
                          />
                          
                          {uploadProgress > 0 && uploadProgress < 100 && (
                            <div className="w-full bg-gray-200 rounded-full h-2.5">
                              <div className="bg-primary h-2.5 rounded-full" style={{ width: `${uploadProgress}%` }}></div>
                            </div>
                          )}
                          
                          {uploadedFiles.length > 0 && (
                            <div className="grid grid-cols-4 gap-4 mt-4">
                              {uploadedFiles.map((file, index) => (
                                <div key={index} className="relative group rounded-md overflow-hidden border h-24">
                                  <img 
                                    src={file.fileUrl} 
                                    alt={file.name}
                                    className="w-full h-full object-cover"
                                  />
                                </div>
                              ))}
                            </div>
                          )}
                        </div>
                      </FormControl>
                      <FormDescription>
                        Upload one or more images for the product. Maximum size: 5MB per image.
                        Supported formats: JPG, PNG, WebP.
                      </FormDescription>
                      <FormMessage />
                    </FormItem>
                  )}
                />
              </TabsContent>
            </CardContent>
          </Tabs>
          
          <CardFooter className="flex justify-between border-t pt-6">
            <div>
              {initialData && (
                <Button
                  type="button"
                  variant="destructive"
                  onClick={handleDelete}
                  disabled={isPending}
                >
                  {deleteProductMutation.isPending ? (
                    <>
                      <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                      Deleting...
                    </>
                  ) : (
                    <>
                      <Trash className="mr-2 h-4 w-4" />
                      Delete Product
                    </>
                  )}
                </Button>
              )}
            </div>
            
            <div className="flex gap-2">
              <Button
                type="button"
                variant="outline"
                onClick={onClose}
                disabled={isPending}
              >
                Cancel
              </Button>
              
              <Button
                type="submit"
                disabled={isPending}
              >
                {isPending ? (
                  <>
                    <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                    {initialData ? "Updating..." : "Creating..."}
                  </>
                ) : (
                  <>
                    <Save className="mr-2 h-4 w-4" />
                    {initialData ? "Update Product" : "Create Product"}
                  </>
                )}
              </Button>
            </div>
          </CardFooter>
        </form>
      </Form>
    </Card>
  )
}