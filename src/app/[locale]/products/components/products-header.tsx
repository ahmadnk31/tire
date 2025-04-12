"use client";

import { useState, useEffect, SetStateAction } from "react";
import { useRouter, useSearchParams } from "next/navigation";
import { useTranslations } from "next-intl";
import { Button } from "@/components/ui/button";
import { 
  Select, 
  SelectContent, 
  SelectItem, 
  SelectTrigger, 
  SelectValue 
} from "@/components/ui/select";
import { Tabs, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Input } from "@/components/ui/input";
import { Search } from "lucide-react";

export function ProductsHeader() {
  const t = useTranslations("productsHeader");
  const router = useRouter();
  const searchParams = useSearchParams();
  
  // Get sort options from translations
  const SORT_OPTIONS = [
    { value: "featured", label: t("sort.options.featured") },
    { value: "price_low", label: t("sort.options.price_low") },
    { value: "price_high", label: t("sort.options.price_high") },
    { value: "newest", label: t("sort.options.newest") },
    { value: "rating", label: t("sort.options.rating") },
    { value: "discount", label: t("sort.options.discount") }
  ];
  
  const [sortOption, setSortOption] = useState(searchParams.get('sort') || "featured");
  const [searchQuery, setSearchQuery] = useState(searchParams.get('q') || "");
  
  // Apply sorting
  const handleSortChange = (value: string) => {
    // Ensure the value is valid by checking if it exists in our options
    if (!SORT_OPTIONS.some(option => option.value === value)) {
      value = "featured"; // Default to "featured" if invalid
    }
    
    setSortOption(value);
    const params = new URLSearchParams(searchParams.toString());
    params.set('sort', value);
    router.push(`/products?${params.toString()}`);
  };
  
  // Handle search form submission
  const handleSearch = (e: { preventDefault: () => void; }) => {
    e.preventDefault();
    if (!searchQuery.trim()) return;
    
    const params = new URLSearchParams(searchParams.toString());
    params.set('q', searchQuery);
    router.push(`/products?${params.toString()}`);
  };
  
  // Handle category filter tabs
  const handleTabChange = (value: string) => {
    const params = new URLSearchParams(searchParams.toString());
    
    if (value === "all") {
      params.delete('category');
    } else {
      params.set('category', value);
    }
    
    router.push(`/products?${params.toString()}`);
  };
  
  // Validate sortOption exists in options on component mount or URL change
  useEffect(() => {
    const currentSort = searchParams.get('sort');
    if (currentSort && !SORT_OPTIONS.some(option => option.value === currentSort)) {
      const params = new URLSearchParams(searchParams.toString());
      params.set('sort', 'featured');
      router.replace(`/products?${params.toString()}`);
    }
  }, [searchParams, router, SORT_OPTIONS]);
  
  return (
    <div className="mb-8 space-y-6">
      <div>
        <h1 className="text-3xl font-bold tracking-tight">{t("title")}</h1>
        <p className="text-gray-500 mt-1">
          {t("description")}
        </p>
      </div>
      
      <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4">
        <form onSubmit={handleSearch} className="relative w-full sm:w-auto sm:min-w-[300px]">
          <Input
            type="search"
            placeholder={t("search.placeholder")}
            className="pr-10"
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
          />
          <Button 
            type="submit" 
            variant="ghost" 
            size="sm"
            className="absolute right-0 top-0 h-full px-3"
            aria-label={t("search.button")}
          >
            <Search className="h-4 w-4" />
          </Button>
        </form>
        <div className="flex items-center space-x-2 w-full sm:w-auto">
          <span className="text-sm text-gray-500 whitespace-nowrap">{t("sort.label")}</span>
          <Select
            value={sortOption}
            onValueChange={handleSortChange}
            defaultValue="featured"
          >
            <SelectTrigger className="w-full sm:w-[180px]">
              <SelectValue placeholder={t("sort.placeholder")} />
            </SelectTrigger>
            <SelectContent>
              {SORT_OPTIONS.map(option => (
                <SelectItem key={option.value} value={option.value}>
                  {option.label}
                </SelectItem>
              ))}
            </SelectContent>
          </Select>
        </div>
      </div>
      
      <Tabs 
        defaultValue="all" 
        value={searchParams.get('category') || 'all'}
        onValueChange={handleTabChange}
        className="w-full"
      >
        <TabsList className="w-full justify-start overflow-x-auto">
          <TabsTrigger value="all" className="text-sm">
            {t("categories.all")}
          </TabsTrigger>
          <TabsTrigger value="all_season" className="text-sm">
            {t("categories.all_season")}
          </TabsTrigger>
          <TabsTrigger value="summer" className="text-sm">
            {t("categories.summer")}
          </TabsTrigger>
          <TabsTrigger value="winter" className="text-sm">
            {t("categories.winter")}
          </TabsTrigger>
          <TabsTrigger value="all_terrain" className="text-sm">
            {t("categories.all_terrain")}
          </TabsTrigger>
          <TabsTrigger value="high_performance" className="text-sm">
            {t("categories.high_performance")}
          </TabsTrigger>
          <TabsTrigger value="sale" className="text-sm">
            {t("categories.sale")}
          </TabsTrigger>
        </TabsList>
      </Tabs>
    </div>
  );
}