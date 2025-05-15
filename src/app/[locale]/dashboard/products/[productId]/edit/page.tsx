'use client';

import { useRouter } from "next/navigation";
import { useQuery } from "@tanstack/react-query";
import { ProductForm } from "../../components/product-form";
import { Card, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { ChevronLeft, Loader2 } from "lucide-react";

export default function EditProductPage({ params }: { params: { productId: string } }) {
  const router = useRouter();
  const productId = params.productId;

  // Fetch the product details
  const { data: product, isLoading, error } = useQuery({
    queryKey: ["product", productId],
    queryFn: async () => {
      const response = await fetch(`/api/products/${productId}`);
      if (!response.ok) {
        throw new Error("Failed to fetch product");
      }
      return response.json();
    },
  });

  const handleClose = () => {
    router.push('/dashboard/products');
  };

  if (isLoading) {
    return (
      <div className="flex justify-center items-center h-64">
        <Loader2 className="h-8 w-8 animate-spin text-primary" />
      </div>
    );
  }

  if (error) {
    return (
      <div className="p-8 text-center">
        <h2 className="text-xl font-semibold text-destructive">Error loading product</h2>
        <p className="text-muted-foreground">Unable to load product details. Please try again.</p>
        <Button onClick={handleClose} className="mt-4">Back to Products</Button>
      </div>
    );
  }

  return (
    <div className="container mx-auto py-8">
      <div className="flex items-center mb-6">
        <Button 
          variant="ghost" 
          className="mr-4" 
          onClick={handleClose}
        >
          <ChevronLeft className="h-4 w-4 mr-2" />
          Back to Products
        </Button>
        <h1 className="text-3xl font-bold">Edit Product: {product?.name}</h1>
      </div>
      
      <ProductForm initialData={product} onClose={handleClose} />
    </div>
  );
}
