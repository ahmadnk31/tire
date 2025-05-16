"use client";

import { useState, useEffect, useCallback } from "react";
import { useRouter, useSearchParams } from 'next/navigation';
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import { Slider } from "@/components/ui/slider";
import { Checkbox } from "@/components/ui/checkbox";
import { Label } from "@/components/ui/label";
import { Badge } from "@/components/ui/badge";
import { X } from "lucide-react";
import { useTranslations } from "next-intl";
import {
  Accordion,
  AccordionContent,
  AccordionItem,
  AccordionTrigger,
} from "@/components/ui/accordion";
import { 
  Select, 
  SelectContent, 
  SelectItem, 
  SelectTrigger, 
  SelectValue 
} from "@/components/ui/select";

// Interface for the filter state
interface FilterState {
  brands: string[];
  categories: string[];
  tireType: string[];
  widths: number[];
  aspectRatios: number[];
  rimDiameters: number[];
  speedRatings: string[];
  runFlat: boolean | null;
  reinforced: boolean | null;
  minPrice: number;
  maxPrice: number;
}

// Interface for filter options
interface FilterOptions {
  brands: {id: string; name: string}[];
  categories: {id: string; name: string}[];
  tireType: string[];
  widths: number[];
  aspectRatios: number[];
  rimDiameters: number[];
  speedRatings: string[];
}

export function ProductFilters() {
  const t = useTranslations("Products");
  const router = useRouter();
  const searchParams = useSearchParams();
  const [priceRange, setPriceRange] = useState([50, 500]);
  const [loading, setLoading] = useState(true);
  const [activeFiltersCount, setActiveFiltersCount] = useState(0);
  const [filterOptions, setFilterOptions] = useState<FilterOptions>({
    brands: [],
    categories: [],
    tireType: [],
    widths: [],
    aspectRatios: [],
    rimDiameters: [],
    speedRatings: []
  });

  // Initialize filters from URL search params
  const [filters, setFilters] = useState<FilterState>({
    brands: [],
    categories: [],
    tireType: [],
    widths: [],
    aspectRatios: [],
    rimDiameters: [],
    speedRatings: [],
    runFlat: null,
    reinforced: null,
    minPrice: 50,
    maxPrice: 500
  });

  // Effect to count active filters
  useEffect(() => {
    let count = 0;
    if (filters.brands.length) count += filters.brands.length;
    if (filters.categories.length) count += filters.categories.length;
    if (filters.tireType.length) count += filters.tireType.length;
    if (filters.widths.length) count += 1;
    if (filters.aspectRatios.length) count += 1;
    if (filters.rimDiameters.length) count += 1;
    if (filters.speedRatings.length) count += filters.speedRatings.length;
    if (filters.runFlat !== null) count += 1;
    if (filters.reinforced !== null) count += 1;
    if (filters.minPrice !== 50 || filters.maxPrice !== 500) count += 1;
    
    setActiveFiltersCount(count);
  }, [filters]);

  // Fetch filter options
  useEffect(() => {
    const fetchFilterOptions = async () => {
      setLoading(true);
      try {
        const response = await fetch('/api/products/filter-options');
        if (!response.ok) {
          throw new Error('Failed to fetch filter options');
        }
        const data = await response.json();
        setFilterOptions(data);
      } catch (error) {
        console.error('Error fetching filter options:', error);
      } finally {
        setLoading(false);
      }
    };

    fetchFilterOptions();
  }, []);
  // Load filters from URL on initial load
  useEffect(() => {
    // Parse URL parameters here
    const brandIds = searchParams.get('brand')?.split(',') || [];
    const categoryIds = searchParams.get('category')?.split(',') || [];
    const tireType = searchParams.get('tireType')?.split(',') || [];
    const widths = searchParams.get('width')?.split(',').map(Number) || [];
    const aspectRatios = searchParams.get('aspectRatio')?.split(',').map(Number) || [];
    const rimDiameters = searchParams.get('rimDiameter')?.split(',').map(Number) || [];
    const speedRatings = searchParams.get('speedRating')?.split(',') || [];
    const runFlat = searchParams.get('runFlat') === 'true' ? true : searchParams.get('runFlat') === 'false' ? false : null;
    const reinforced = searchParams.get('reinforced') === 'true' ? true : searchParams.get('reinforced') === 'false' ? false : null;
    const minPrice = Number(searchParams.get('minPrice') || 50);
    const maxPrice = Number(searchParams.get('maxPrice') || 500);

    // Update filters state
    setFilters({
      brands: brandIds,
      categories: categoryIds,
      tireType,
      widths,
      aspectRatios,
      rimDiameters,
      speedRatings,
      runFlat,
      reinforced,
      minPrice,
      maxPrice
    });

    // Update price range slider
    setPriceRange([minPrice, maxPrice]);
  }, [searchParams]);
  // Apply filters
  const applyFilters = () => {
    const params = new URLSearchParams();
    const locale = window.location.pathname.split('/')[1] || 'en'; // Default to 'en' if no locale found

    // Add all active filters to the URL
    if (filters.brands.length > 0) params.set('brand', filters.brands.join(','));
    if (filters.categories.length > 0) params.set('category', filters.categories.join(','));
    if (filters.tireType.length > 0) params.set('tireType', filters.tireType[0]); // API only supports single tire type
    if (filters.widths.length > 0) params.set('width', filters.widths[0].toString());
    if (filters.aspectRatios.length > 0) params.set('aspectRatio', filters.aspectRatios[0].toString());
    if (filters.rimDiameters.length > 0) params.set('rimDiameter', filters.rimDiameters[0].toString());
    if (filters.speedRatings.length > 0) params.set('speedRating', filters.speedRatings.join(','));
    if (filters.runFlat !== null) params.set('runFlat', filters.runFlat.toString());
    if (filters.reinforced !== null) params.set('reinforced', filters.reinforced.toString());    params.set('minPrice', filters.minPrice.toString());
    params.set('maxPrice', filters.maxPrice.toString());

    // Update the URL with locale
    router.push(`/${locale}/products?${params.toString()}`);
  };
  // Clear all filters
  const clearAllFilters = () => {
    const locale = window.location.pathname.split('/')[1] || 'en'; // Default to 'en' if no locale found
    
    setFilters({
      brands: [],
      categories: [],
      tireType: [],
      widths: [],
      aspectRatios: [],
      rimDiameters: [],
      speedRatings: [],
      runFlat: null,
      reinforced: null,
      minPrice: 50,
      maxPrice: 500
    });
    
    // Update price range slider
    setPriceRange([50, 500]);
    
    // Clear URL params and redirect
    router.push(`/${locale}/products`);
  };

  // Render loading state
  if (loading) {
    return (
      <div className="space-y-4">
        {[1, 2, 3, 4].map((i) => (
          <div key={i} className="space-y-2">
            <div className="h-6 bg-gray-200 rounded animate-pulse w-1/3" />
            <div className="h-12 bg-gray-200 rounded animate-pulse" />
          </div>
        ))}
      </div>
    );
  }

  // Show active filters summary
  const renderActiveFiltersBadge = () => {
    if (activeFiltersCount === 0) return null;
    
    return (
      <div className="flex items-center mb-4 flex-wrap gap-2">
        <Badge variant="outline" className="py-1 px-3">
          {t("filters.title")}: {activeFiltersCount}
        </Badge>
        <Button 
          variant="ghost" 
          size="sm" 
          onClick={clearAllFilters}
          className="h-8 px-2 text-xs text-muted-foreground hover:text-foreground flex items-center"
        >
          <X className="h-3 w-3 mr-1" />
          {t("filters.clear")}
        </Button>
      </div>
    );
  };

  return (
    <div className="space-y-6  px-4 lg:px-6 py-4 overflow-y-auto lg:py-6 bg-white rounded-lg shadow-sm border">
      {renderActiveFiltersBadge()}
      
      <Accordion type="multiple" defaultValue={["brands", "categories", "tireTypes"]}>
        {/* Brand filter */}
        <AccordionItem value="brands" className="border-b">
          <AccordionTrigger className="py-3 text-base hover:no-underline">
            {t("filters.brands")}
          </AccordionTrigger>
          <AccordionContent className="pt-1 pb-3">
            <div className="space-y-2 max-h-48 overflow-y-auto pr-2">
              {filterOptions.brands.map((brand) => (
                <div key={brand.id} className="flex items-center space-x-2">
                  <Checkbox 
                    id={`brand-${brand.id}`} 
                    checked={filters.brands.includes(brand.id)}
                    onCheckedChange={(checked) => {
                      if (checked) {
                        setFilters({...filters, brands: [...filters.brands, brand.id]});
                      } else {
                        setFilters({...filters, brands: filters.brands.filter(id => id !== brand.id)});
                      }
                    }}
                  />
                  <Label 
                    htmlFor={`brand-${brand.id}`}
                    className="text-sm cursor-pointer flex-grow"
                  >
                    {brand.name}
                  </Label>
                </div>
              ))}
            </div>
          </AccordionContent>
        </AccordionItem>
        
        {/* Category filter */}
        <AccordionItem value="categories" className="border-b">
          <AccordionTrigger className="py-3 text-base hover:no-underline">
            {t("filters.categories")}
          </AccordionTrigger>
          <AccordionContent className="pt-1 pb-3">
            <div className="space-y-2 max-h-48 overflow-y-auto pr-2">
              {filterOptions.categories.map((category) => (
                <div key={category.id} className="flex items-center space-x-2">
                  <Checkbox 
                    id={`category-${category.id}`} 
                    checked={filters.categories.includes(category.id)}
                    onCheckedChange={(checked) => {
                      if (checked) {
                        setFilters({...filters, categories: [...filters.categories, category.id]});
                      } else {
                        setFilters({...filters, categories: filters.categories.filter(id => id !== category.id)});
                      }
                    }}
                  />
                  <Label 
                    htmlFor={`category-${category.id}`}
                    className="text-sm cursor-pointer flex-grow"
                  >
                    {category.name}
                  </Label>
                </div>
              ))}
            </div>
          </AccordionContent>
        </AccordionItem>
        
        {/* Tire Type filter */}
        <AccordionItem value="tireTypes" className="border-b">
          <AccordionTrigger className="py-3 text-base hover:no-underline">
            {t("filters.tireTypes")}
          </AccordionTrigger>
          <AccordionContent className="pt-1 pb-3">
            <div className="space-y-2 max-h-48 overflow-y-auto pr-2">
              {filterOptions.tireType.map((type) => (
                <div key={type} className="flex items-center space-x-2">
                  <Checkbox 
                    id={`type-${type}`} 
                    checked={filters.tireType.includes(type)}
                    onCheckedChange={(checked) => {
                      if (checked) {
                        setFilters({...filters, tireType: [...filters.tireType, type]});
                      } else {
                        setFilters({...filters, tireType: filters.tireType.filter(t => t !== type)});
                      }
                    }}
                  />
                  <Label 
                    htmlFor={`type-${type}`}
                    className="text-sm cursor-pointer flex-grow"
                  >
                    {type.replace(/_/g, ' ')}
                  </Label>
                </div>
              ))}
            </div>
          </AccordionContent>
        </AccordionItem>
        
        {/* Price Range filter */}
        <AccordionItem value="priceRange" className="border-b">
          <AccordionTrigger className="py-3 text-base hover:no-underline">
            {t("filters.priceRange")}
          </AccordionTrigger>
          <AccordionContent className="pt-1 pb-3">
            <div className="space-y-6 px-1 pt-4">              
              <Slider
                defaultValue={priceRange}
                min={0}
                max={1000}
                step={10}
                onValueChange={(value) => {
                  setPriceRange(value);
                  setFilters({
                    ...filters,
                    minPrice: value[0],
                    maxPrice: value[1]
                  });
                }}
              />
              <div className="flex items-center justify-between">
                <p className="text-sm">
                  {priceRange[0]} - {priceRange[1]}
                </p>
              </div>
            </div>
          </AccordionContent>
        </AccordionItem>
        
        {/* Tire Sizes filter */}
        <AccordionItem value="tireSizes" className="border-b">
          <AccordionTrigger className="py-3 text-base hover:no-underline">
            {t("filters.sizes")}
          </AccordionTrigger>
          <AccordionContent className="pt-1 pb-3">
            <div className="space-y-3">
              <div className="space-y-1">                <Label className="text-sm text-muted-foreground">{t("filters.width")}</Label>                <Select
                  value={filters.widths[0]?.toString() || ""}
                  onValueChange={(value) => {
                    if (value === "all") {
                      setFilters({...filters, widths: []});
                    } else {
                      setFilters({...filters, widths: [parseInt(value)]});
                    }
                  }}
                >
                  <SelectTrigger className="h-8">
                    <SelectValue placeholder={t("filters.selectWidth")} />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="all">{t("filters.any")}</SelectItem>
                    {filterOptions.widths.map((width) => (
                      <SelectItem key={width} value={width.toString()}>
                        {width}mm
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>
                <div className="space-y-1">
                <Label className="text-sm text-muted-foreground">{t("filters.aspectRatio")}</Label>
                <Select
                  value={filters.aspectRatios[0]?.toString() || ""}
                  onValueChange={(value) => {
                    setFilters({...filters, aspectRatios: value ? [parseInt(value)] : []});
                  }}
                >
                  <SelectTrigger className="h-8">
                    <SelectValue placeholder={t("filters.selectRatio")} />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="all">{t("filters.any")}</SelectItem>
                    {filterOptions.aspectRatios.map((ratio) => (
                      <SelectItem key={ratio} value={ratio.toString()}>
                        {ratio}%
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>
                <div className="space-y-1">
                <Label className="text-sm text-muted-foreground">{t("filters.rimDiameter")}</Label>
                <Select
                  value={filters.rimDiameters[0]?.toString() || ""}
                  onValueChange={(value) => {
                    setFilters({...filters, rimDiameters: value ? [parseInt(value)] : []});
                  }}
                >
                  <SelectTrigger className="h-8">
                    <SelectValue placeholder={t("filters.selectDiameter")} />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="all">{t("filters.any")}</SelectItem>
                    {filterOptions.rimDiameters.map((diameter) => (
                      <SelectItem key={diameter} value={diameter.toString()}>
                        {diameter}"
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>
            </div>
          </AccordionContent>
        </AccordionItem>
      </Accordion>
        {/* Apply filters button - visible on all screen sizes */}
      <div className="pt-2">
        <Button 
          className="w-full" 
          onClick={applyFilters}
        >
          {t("filters.apply")}
        </Button>
      </div>
    </div>
  );
}