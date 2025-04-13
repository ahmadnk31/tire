"use client";

import { useState, useEffect } from "react";
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
import { Search, SlidersHorizontal } from "lucide-react";
import { Sheet, SheetContent, SheetTrigger } from "@/components/ui/sheet";
import { Badge } from "@/components/ui/badge";
import { ProductFilters } from "./product-filters";

export function ProductsHeader() {
  const t = useTranslations("Products");
  const router = useRouter();
  const searchParams = useSearchParams();
  
  // Define sort options using translations
  const SORT_OPTIONS = [
    { value: "featured", label: t("sort.featured") },
    { value: "price_asc", label: t("sort.priceAsc") },
    { value: "price_desc", label: t("sort.priceDesc") },
    { value: "newest", label: t("sort.newest") },
    { value: "popular", label: t("sort.popular") }
  ];
  
  const [sortOption, setSortOption] = useState(searchParams.get('sort') || "featured");
  const [searchQuery, setSearchQuery] = useState(searchParams.get('q') || "");
  const [activeFiltersCount, setActiveFiltersCount] = useState(0);
  
  // Calculate the number of active filters
  useEffect(() => {
    let count = 0;
    
    // Count each type of filter from the URL
    if (searchParams.has('brandIds')) count += searchParams.get('brandIds')!.split(',').length;
    if (searchParams.has('categoryIds')) count += searchParams.get('categoryIds')!.split(',').length;
    if (searchParams.has('tireType')) count += searchParams.get('tireType')!.split(',').length;
    if (searchParams.has('widths')) count += 1;
    if (searchParams.has('aspectRatios')) count += 1;
    if (searchParams.has('rimDiameters')) count += 1;
    if (searchParams.has('speedRatings')) count += searchParams.get('speedRatings')!.split(',').length;
    if (searchParams.has('runFlat')) count += 1;
    if (searchParams.has('reinforced')) count += 1;
    
    // Consider price range as 1 filter if it's not the default
    const minPrice = searchParams.has('minPrice') ? Number(searchParams.get('minPrice')) : 50;
    const maxPrice = searchParams.has('maxPrice') ? Number(searchParams.get('maxPrice')) : 500;
    if (minPrice !== 50 || maxPrice !== 500) count += 1;
    
    setActiveFiltersCount(count);
  }, [searchParams]);
  
  // Apply sorting
  const handleSortChange = (value: string) => {
    setSortOption(value);
    const params = new URLSearchParams(searchParams.toString());
    params.set('sort', value);
    router.push(`/products?${params.toString()}`);
  };
  
  // Handle search form submission
  const handleSearch = (e: React.FormEvent) => {
    e.preventDefault();
    
    const params = new URLSearchParams(searchParams.toString());
    if (searchQuery.trim()) {
      params.set('q', searchQuery.trim());
    } else {
      params.delete('q');
    }
    
    router.push(`/products?${params.toString()}`);
  };
  
  // Clear all filters and search
  const clearAll = () => {
    router.push('/products');
    setSearchQuery('');
    setSortOption('featured');
  };
  
  return (
    <div className="mb-6 md:mb-8 space-y-4 md:space-y-6">
      <div>
        <h1 className="text-2xl md:text-3xl font-bold tracking-tight">{t("title")}</h1>
        <p className="text-muted-foreground text-sm md:text-base mt-1">
          {t("description")}
        </p>
      </div>
      
      <div className="flex flex-wrap items-center justify-between gap-4">
        {/* Mobile filters button - only shown on small screens */}
        <div className="flex items-center gap-2 lg:hidden">
          <Sheet>
            <SheetTrigger asChild>
              <Button variant="outline" className="flex items-center gap-2" size="sm">
                <SlidersHorizontal className="h-4 w-4" />
                <span>{t("filters.title")}</span>
                {activeFiltersCount > 0 && (
                  <Badge variant="secondary" className="ml-1 text-xs">
                    {activeFiltersCount}
                  </Badge>
                )}
              </Button>
            </SheetTrigger>
            <SheetContent side="left" className="w-[300px] sm:w-[400px] overflow-y-auto">
              <div className="py-6">
                <h2 className="text-lg font-semibold mb-4">{t("filters.title")}</h2>
                <ProductFilters />
              </div>
            </SheetContent>
          </Sheet>
          
          {activeFiltersCount > 0 && (
            <Button 
              variant="ghost" 
              size="sm"
              onClick={clearAll}
              className="text-xs"
            >
              {t("filters.clear")}
            </Button>
          )}
        </div>
        
        {/* Search and sort controls */}
        <div className="flex flex-1 flex-col sm:flex-row sm:items-center gap-3 w-full sm:w-auto">
          <form onSubmit={handleSearch} className="relative flex-1 max-w-md">
            <Input
              type="search"
              placeholder="Search tires..."
              className="pr-10"
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
            />
            <Button 
              type="submit"
              size="icon"
              variant="ghost"
              className="absolute right-0 top-0 h-full"
            >
              <Search className="h-4 w-4" />
              <span className="sr-only">Search</span>
            </Button>
          </form>
          
          <div className="flex items-center gap-2">
            <span className="text-sm text-muted-foreground hidden sm:inline">
              {t("sort.title")}:
            </span>
            <Select
              value={sortOption}
              onValueChange={handleSortChange}
            >
              <SelectTrigger className="w-[180px] h-9">
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                {SORT_OPTIONS.map((option) => (
                  <SelectItem key={option.value} value={option.value}>
                    {option.label}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>
        </div>
      </div>
    </div>
  );
}