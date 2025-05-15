'use client';

import { useRouter } from "next/navigation";
import { ProductForm } from "../components/product-form";
import { Card, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { ChevronLeft } from "lucide-react";

export default function CreateProductPage() {
  const router = useRouter();

  const handleClose = () => {
    router.push('/dashboard/products');
  };

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
        <h1 className="text-3xl font-bold">Create New Product</h1>
      </div>
      
      <ProductForm onClose={handleClose} />
    </div>
  );
}
