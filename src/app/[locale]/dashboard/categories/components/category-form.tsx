"use client"

import { useState } from "react"
import { useRouter } from "next/navigation"
import { zodResolver } from "@hookform/resolvers/zod"
import { useForm } from "react-hook-form"
import { useMutation, useQueryClient } from "@tanstack/react-query"
import { toast } from "sonner"
import * as z from "zod"

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

// Interface matching our enhanced FileUpload component
interface UploadedFile {
  fileUrl: string;
  name: string;
  size: number;
  type: string;
  lastModified: number;
}

const categoryFormSchema = z.object({
  name: z.string().min(2, { message: "Category name must be at least 2 characters" }),
  description: z.string().optional(),
  image: z.any().optional(),
  isActive: z.boolean().default(true),
  displayOrder: z.coerce.number().int().default(0),
})

type CategoryFormValues = z.infer<typeof categoryFormSchema>

interface CategoryFormProps {
  initialData?: {
    id: string
    name: string
    description?: string | null
    imageUrl?: string | null
    isActive?: boolean
    displayOrder?: number
  } | null
  onClose?: () => void
}

export function CategoryForm({ initialData, onClose }: CategoryFormProps) {
  const router = useRouter()
  const queryClient = useQueryClient()
  const [uploadedFiles, setUploadedFiles] = useState<UploadedFile[]>(() => {
    // If we have initialData with an image, convert it to UploadedFile format
    if (initialData?.imageUrl) {
      return [{
        fileUrl: initialData.imageUrl,
        name: initialData.imageUrl.split('/').pop() || 'image',
        size: 0, // We don't know the size
        type: initialData.imageUrl.endsWith('.svg') ? 'image/svg+xml' : 
              initialData.imageUrl.endsWith('.png') ? 'image/png' : 'image/jpeg',
        lastModified: Date.now(),
      }];
    }
    return [];
  });
  
  const [uploadProgress, setUploadProgress] = useState(0);
  const form = useForm<CategoryFormValues>({
    resolver: zodResolver(categoryFormSchema),
    defaultValues: {
      name: initialData?.name || "",
      description: initialData?.description || "",
      isActive: initialData?.isActive !== undefined ? initialData.isActive : true,
      displayOrder: initialData?.displayOrder !== undefined ? initialData.displayOrder : 0,
    },
  })
  const { mutate: createCategory, isPending: isCreating } = useMutation({
    mutationFn: async (values: CategoryFormValues & { image?: UploadedFile }) => {
      const formData = new FormData()
      formData.append("name", values.name)
      
      if (values.description) {
        formData.append("description", values.description)
      }
      
      // Add the uploaded image data
      if (values.image) {
        formData.append("imageUrl", values.image.fileUrl)
        if (values.image.key) {
          formData.append("imageKey", values.image.key)
        }
      }
      
      // Add the new database schema fields
      formData.append("isActive", values.isActive.toString())
      formData.append("displayOrder", values.displayOrder.toString())
      const response = await fetch("/api/categories", {
        method: "POST",
        body: formData,
      })
      
      if (!response.ok) {
        throw new Error("Failed to create category")
      }
      
      return response.json()
    },
    onSuccess: () => {
      toast.success("Category created successfully")
      queryClient.invalidateQueries({ queryKey: ["categories"] })
      router.refresh()
      onClose?.()
    },
    onError: (error) => {
      toast.error(error.message || "Something went wrong")
    },
  })
  const { mutate: updateCategory, isPending: isUpdating } = useMutation({
    mutationFn: async (values: CategoryFormValues & { image?: UploadedFile }) => {
      const formData = new FormData()
      formData.append("name", values.name)
      
      if (values.description) {
        formData.append("description", values.description)
      }
      
      // Add the uploaded image data
      if (values.image) {
        formData.append("imageUrl", values.image.fileUrl)
        if (values.image.key) {
          formData.append("imageKey", values.image.key)
        }
      }
      
      // Add the new database schema fields
      formData.append("isActive", values.isActive.toString())
      formData.append("displayOrder", values.displayOrder.toString())
      
      const response = await fetch(`/api/categories/${initialData?.id}`, {
        method: "PATCH",
        body: formData,
      })
      
      if (!response.ok) {
        throw new Error("Failed to update category")
      }
      
      return response.json()
    },
    onSuccess: () => {
      toast.success("Category updated successfully")
      queryClient.invalidateQueries({ queryKey: ["categories"] })
      router.refresh()
      onClose?.()
    },
    onError: (error) => {
      toast.error(error.message || "Something went wrong")
    },
  })

  const { mutate: deleteCategory, isPending: isDeleting } = useMutation({
    mutationFn: async () => {
      const response = await fetch(`/api/categories/${initialData?.id}`, {
        method: "DELETE",
      })
      
      if (!response.ok) {
        throw new Error("Failed to delete category")
      }
      
      return response.json()
    },
    onSuccess: () => {
      toast.success("Category deleted successfully")
      queryClient.invalidateQueries({ queryKey: ["categories"] })
      router.refresh()
      onClose?.()
    },
    onError: (error) => {
      toast.error(error.message || "Something went wrong")
    },
  })

  const onSubmit = async (values: CategoryFormValues) => {
    try {
      // Include uploadedFiles in the values
      const dataToSubmit = {
        ...values,
        image: uploadedFiles.length > 0 ? uploadedFiles[0] : undefined,
      };
      
      if (initialData) {
        updateCategory(dataToSubmit)
      } else {
        createCategory(dataToSubmit)
      }
    } catch (error) {
      toast.error("Something went wrong")
    }
  }

  const handleDelete = () => {
    if (window.confirm("Are you sure you want to delete this category?")) {
      deleteCategory()
    }
  }

  // Update the FileUpload handler to work with UploadedFile
  const handleFileChange = (files: UploadedFile[]) => {
    setUploadedFiles(files)
  }

  return (
    <Card className="w-full max-w-2xl mx-auto h-[90vh] overflow-y-auto">
      <CardHeader>
        <CardTitle>{initialData ? "Edit Category" : "Create Category"}</CardTitle>
      </CardHeader>
      <CardContent>
        <Form {...form}>
          <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-6">
            <FormField
              control={form.control}
              name="name"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>Category Name</FormLabel>
                  <FormControl>
                    <Input 
                      placeholder="Enter category name" 
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
                      placeholder="Enter category description" 
                      {...field} 
                      disabled={isCreating || isUpdating}
                    />
                  </FormControl>
                  <FormMessage />
                </FormItem>
              )}
            />            <FormField
              control={form.control}
              name="image"
              render={() => (
                <FormItem>
                  <FormLabel>Image</FormLabel>
                  <FormControl>
                    <div className="space-y-4">
                      <FileUpload 
                        onChange={handleFileChange} 
                        multiple={false} 
                        value={uploadedFiles}
                        folder="categories"
                        maxSize={2}
                        allowedTypes={['image/jpeg', 'image/png', 'image/webp', 'image/svg+xml']}
                        onUploadProgress={setUploadProgress}
                      />
                    </div>
                  </FormControl>
                  <FormDescription>
                    Upload an image for the category
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
                      Mark this category as active to display it on the site
                    </FormDescription>
                  </div>
                </FormItem>
              )}
            />
            <FormField
              control={form.control}
              name="displayOrder"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>Display Order</FormLabel>
                  <FormControl>
                    <Input 
                      type="number" 
                      placeholder="Enter display order" 
                      {...field} 
                      disabled={isCreating || isUpdating}
                    />
                  </FormControl>
                  <FormDescription>
                    Lower numbers will appear first. Categories with the same display order will be sorted alphabetically.
                  </FormDescription>
                  <FormMessage />
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
            {isDeleting ? "Deleting..." : "Delete Category"}
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
            {isCreating ? "Creating..." : isUpdating ? "Updating..." : initialData ? "Update Category" : "Create Category"}
          </Button>
        </div>
      </CardFooter>
    </Card>
  )
}