"use client"

import { useState } from "react"
import { useRouter } from "next/navigation"
import { zodResolver } from "@hookform/resolvers/zod"
import { useForm } from "react-hook-form"
import { useMutation, useQueryClient } from "@tanstack/react-query"
import { toast } from "sonner"
import * as z from "zod"
import Image from "next/image"

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
import { Slider } from "@/components/ui/slider"

// Interface matching our enhanced FileUpload component
interface UploadedFile {
  fileUrl: string;
  name: string;
  size: number;
  type: string;
  lastModified: number;
}

const brandFormSchema = z.object({
  name: z.string().min(2, { message: "Brand name must be at least 2 characters" }),
  description: z.string().optional(),
  logo: z.any().optional(),
  popularityScore: z.number().min(0).max(10).default(5),
  isActive: z.boolean().default(true),
})

type BrandFormValues = z.infer<typeof brandFormSchema>

interface BrandFormProps {
  initialData?: {
    id: string
    name: string
    description?: string | null
    logoUrl?: string | null
    logoKey?: string | null
    popularityScore?: number | null
    isActive?: boolean
  } | null
  onClose?: () => void
}

export function BrandForm({ initialData, onClose }: BrandFormProps) {
  const router = useRouter()
  const queryClient = useQueryClient()
  const [uploadedFiles, setUploadedFiles] = useState<UploadedFile[]>(() => {
    // If we have initialData with a logo, convert it to UploadedFile format
    if (initialData?.logoUrl) {
      return [{
        fileUrl: initialData.logoUrl,
        key: initialData.logoKey || 'unknown-key',
        name: initialData.logoUrl.split('/').pop() || 'logo',
        size: 0, // We don't know the size
        type: initialData.logoUrl.endsWith('.svg') ? 'image/svg+xml' : 
              initialData.logoUrl.endsWith('.png') ? 'image/png' : 'image/jpeg',
        lastModified: Date.now(),
      }];
    }
    return [];
  });
  
  const [uploadProgress, setUploadProgress] = useState(0);
  const form = useForm<BrandFormValues>({
    resolver: zodResolver(brandFormSchema),
    defaultValues: {
      name: initialData?.name || "",
      description: initialData?.description || "",
      popularityScore: initialData?.popularityScore !== null && initialData?.popularityScore !== undefined 
        ? initialData.popularityScore 
        : 10,
      isActive: initialData?.isActive !== undefined ? initialData.isActive : true,
    },
  })
  const { mutate: createBrand, isPending: isCreating } = useMutation({
    mutationFn: async (values: BrandFormValues & { logo?: UploadedFile }) => {
      // First check if a brand with this name already exists
      const checkResponse = await fetch(`/api/brands?query=${encodeURIComponent(values.name)}&perPage=1`);
      const checkData = await checkResponse.json();
      
      if (checkData.brands && checkData.brands.some((brand: any) => 
          brand.name.toLowerCase() === values.name.toLowerCase() && 
          brand.id !== initialData?.id)) {
        throw new Error("A brand with this name already exists");
      }
      
      const formData = new FormData()
      formData.append("name", values.name)
      
      if (values.description) {
        formData.append("description", values.description)
      }
        // Add the uploaded logo data
      if (values.logo) {
        formData.append("logoUrl", values.logo.fileUrl)
        formData.append("logoKey", values.logo.key)
      }
      
      // Add the database schema fields
      formData.append("popularityScore", values.popularityScore.toString())
      formData.append("isActive", values.isActive.toString())
      
      const response = await fetch("/api/brands", {
        method: "POST",
        body: formData,
      })
      
      if (!response.ok) {
        const errorData = await response.json();
        if (response.status === 409) {
          throw new Error("A brand with this name already exists");
        }
        throw new Error(errorData.error || "Failed to create brand")
      }
      
      return response.json()
    },
    onSuccess: () => {
      toast.success("Brand created successfully")
      queryClient.invalidateQueries({ queryKey: ["brands"] })
      router.refresh()
      onClose?.()
    },
    onError: (error) => {
      toast.error(error.message || "Something went wrong")
    },
  })

  const { mutate: updateBrand, isPending: isUpdating } = useMutation({
    mutationFn: async (values: BrandFormValues & { logo?: UploadedFile }) => {
      const formData = new FormData()
      formData.append("name", values.name)
      
      if (values.description) {
        formData.append("description", values.description)
      }
        // Add the uploaded logo data
      if (values.logo) {
        formData.append("logoUrl", values.logo.fileUrl)
        formData.append("logoKey", values.logo.key)
      }
      
      // Add the database schema fields
      formData.append("popularityScore", values.popularityScore.toString())
      formData.append("isActive", values.isActive.toString())
      
      const response = await fetch(`/api/brands/${initialData?.id}`, {
        method: "PATCH",
        body: formData,
      })
      
      if (!response.ok) {
        throw new Error("Failed to update brand")
      }
      
      return response.json()
    },
    onSuccess: () => {
      toast.success("Brand updated successfully")
      queryClient.invalidateQueries({ queryKey: ["brands"] })
      router.refresh()
      onClose?.()
    },
    onError: (error) => {
      toast.error(error.message || "Something went wrong")
    },
  })

  const { mutate: deleteBrand, isPending: isDeleting } = useMutation({
    mutationFn: async () => {
      const response = await fetch(`/api/brands/${initialData?.id}`, {
        method: "DELETE",
      })
      
      if (!response.ok) {
        throw new Error("Failed to delete brand")
      }
      
      return response.json()
    },
    onSuccess: () => {
      toast.success("Brand deleted successfully")
      queryClient.invalidateQueries({ queryKey: ["brands"] })
      router.refresh()
      onClose?.()
    },
    onError: (error) => {
      toast.error(error.message || "Something went wrong")
    },
  })

  const onSubmit = async (values: BrandFormValues) => {
    try {
      // Include uploadedFiles in the values
      const dataToSubmit = {
        ...values,
        logo: uploadedFiles.length > 0 ? uploadedFiles[0] : undefined,
      };
      
      if (initialData) {
        updateBrand(dataToSubmit)
      } else {
        createBrand(dataToSubmit)
      }
    } catch (error) {
      toast.error("Something went wrong")
    }
  }

  const handleDelete = () => {
    if (window.confirm("Are you sure you want to delete this brand?")) {
      deleteBrand()
    }
  }

  // Update the FileUpload handler to work with UploadedFile
  const handleFileChange = (files: UploadedFile[]) => {
    setUploadedFiles(files)
  }

  return (
    <Card className="w-full max-w-2xl mx-auto h-[90vh] overflow-y-auto">
      <CardHeader>
        <CardTitle>{initialData ? "Edit Brand" : "Create Brand"}</CardTitle>
      </CardHeader>
      <CardContent>
        <Form {...form}>
          <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-6">
            <FormField
              control={form.control}
              name="name"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>Brand Name</FormLabel>
                  <FormControl>
                    <Input 
                      placeholder="Enter brand name" 
                      {...field} 
                      disabled={isCreating || isUpdating}
                    />
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
                    <Textarea 
                      placeholder="Enter brand description" 
                      {...field} 
                      disabled={isCreating || isUpdating}
                    />
                  </FormControl>
                  <FormMessage />
                </FormItem>
              )}
            />            <FormField
              control={form.control}
              name="logo"
              render={() => (
                <FormItem>
                  <FormLabel>Logo</FormLabel>
                  <FormControl>
                    <div className="space-y-4">
                      <FileUpload 
                        onChange={handleFileChange} 
                        multiple={false} 
                        value={uploadedFiles}
                        folder="brands"
                        maxSize={2}
                        allowedTypes={['image/jpeg', 'image/png', 'image/webp', 'image/svg+xml']}
                        onUploadProgress={setUploadProgress}
                      />
                    </div>
                  </FormControl>
                  <FormDescription>
                    Upload a logo image for the brand
                  </FormDescription>
                  <FormMessage />
                </FormItem>
              )}
            />
            
            <FormField
              control={form.control}
              name="popularityScore"
              render={({ field: { value, onChange } }) => (
                <FormItem>
                  <FormLabel>Popularity Score (1-10)</FormLabel>
                  <FormControl>
                    <div className="space-y-2">
                      <Slider
                        min={0}
                        max={10}
                        step={1}
                        value={[value]}
                        onValueChange={(vals) => onChange(vals[0])}
                      />
                      <div className="flex justify-between">
                        <span>0</span>
                        <span className="font-bold">{value}</span>
                        <span>10</span>
                      </div>
                    </div>
                  </FormControl>
                  <FormDescription>
                    Rate the brand popularity from 0 (lowest) to 10 (highest) for sorting and display purposes
                  </FormDescription>
                  <FormMessage />
                </FormItem>
              )}
            />
            
            <FormField
              control={form.control}
              name="isActive"
              render={({ field }) => (
                <FormItem className="flex flex-row items-start space-x-3 space-y-0 rounded-md border p-4">
                  <FormControl>
                    <input
                      type="checkbox"
                      checked={field.value}
                      onChange={field.onChange}
                      className="h-4 w-4 rounded border-gray-300 text-primary focus:ring-primary"
                    />
                  </FormControl>
                  <div className="space-y-1 leading-none">
                    <FormLabel>Active</FormLabel>
                    <FormDescription>
                      Mark this brand as active to display it on the site
                    </FormDescription>
                  </div>
                </FormItem>
              )}
            />
          </form>
        </Form>
      </CardContent>
      <CardFooter className="flex justify-between">
        {initialData && (
          <Button
            type="button"
            variant="destructive"
            onClick={handleDelete}
            disabled={isDeleting}
          >
            {isDeleting ? "Deleting..." : "Delete Brand"}
          </Button>
        )}
        <div className="flex space-x-2">
          <Button
            type="button"
            variant="outline"
            onClick={onClose}
            disabled={isCreating || isUpdating || isDeleting}
          >
            Cancel
          </Button>
          <Button
            type="submit"
            onClick={form.handleSubmit(onSubmit)}
            disabled={isCreating || isUpdating || isDeleting}
          >
            {isCreating ? "Creating..." : isUpdating ? "Updating..." : initialData ? "Update Brand" : "Create Brand"}
          </Button>
        </div>
      </CardFooter>
    </Card>
  )
}