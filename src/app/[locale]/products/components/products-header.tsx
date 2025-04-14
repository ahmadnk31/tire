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
    <div className="mb-8 space-y-6">
      {/* Header with animated gradient background */}
      <div className="bg-gradient-to-r from-slate-100 to-slate-200 dark:from-slate-800 dark:to-slate-900 p-6 md:p-8 rounded-xl shadow-sm transition-all duration-300 border border-slate-200 dark:border-slate-800">
        <h1 className="text-2xl md:text-3xl lg:text-4xl font-extrabold tracking-tight bg-clip-text text-transparent bg-gradient-to-r from-slate-900 to-slate-600 dark:from-slate-100 dark:to-slate-400">
          {t("title")}
        </h1>
        <p className="text-muted-foreground text-sm md:text-base mt-2 max-w-2xl">
          {t("description")}
        </p>
      </div>
      
      {/* Filter and search controls in responsive container */}
      <div className="bg-white dark:bg-slate-950 rounded-lg border border-slate-200 dark:border-slate-800 p-4 shadow-sm">
        <div className="grid grid-cols-1 lg:grid-cols-12 gap-4 items-start lg:items-center">
          {/* Mobile filters - left side on mobile, hidden on large screens */}
          <div className="flex items-center gap-2 lg:col-span-3 lg:order-2">
            {/* Mobile filter sheet */}
            <Sheet>
              <SheetTrigger asChild>
                <Button variant="outline" className="flex items-center gap-2 lg:hidden">
                  <SlidersHorizontal className="h-4 w-4" />
                  <span>{t("filters.title")}</span>
                  {activeFiltersCount > 0 && (
                    <Badge variant="secondary" className="ml-1 text-xs rounded-full h-5 min-w-5 flex items-center justify-center">
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
            
            {/* Clear filters button - shown when filters are active */}
            {activeFiltersCount > 0 && (
              <Button 
                variant="ghost" 
                size="sm"
                onClick={clearAll}
                className="text-xs hover:bg-red-50 hover:text-red-600 transition-colors dark:hover:bg-red-950"
              >
                {t("filters.clear")}
              </Button>
            )}
          </div>
          
          {/* Search bar - takes up most of the space */}
          <div className="lg:col-span-5 lg:order-1 w-full">
            <form onSubmit={handleSearch} className="relative w-full">
              <Input
                type="search"
                placeholder={`${t("search.placeholder", { fallback: "Search tires..." })}`}
                className="pr-10 w-full transition-all duration-300 focus-within:shadow-md"
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
          </div>
          
          {/* Sort options - right side */}
          <div className="flex items-center gap-2 justify-end lg:justify-end lg:col-span-4 lg:order-3">
            <span className="text-sm text-muted-foreground hidden md:inline whitespace-nowrap">
              {t("sort.title")}:
            </span>
            <Select
              value={sortOption}
              onValueChange={handleSortChange}
            >
              <SelectTrigger className="w-full sm:w-[180px] h-10 transition-all duration-300 hover:border-slate-400 dark:hover:border-slate-500">
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
        
        {/* Active filters count indicator - desktop only */}
        {activeFiltersCount > 0 && (
          <div className="hidden lg:flex items-center mt-4 text-sm text-muted-foreground">
            <Badge variant="secondary" className="mr-2">
              {activeFiltersCount} {activeFiltersCount === 1 ? t("filters.activeFilter") : t("filters.activeFilters")}
            </Badge>
            <Button 
              variant="ghost" 
              size="sm"
              onClick={clearAll}
              className="text-xs hover:text-red-600"
            >
              {t("filters.clearAll")}
            </Button>
          </div>
        )}
      </div>
    </div>
  );
}