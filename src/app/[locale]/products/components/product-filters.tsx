"use client";

import { useState, useEffect } from "react";
import { useRouter, useSearchParams } from 'next/navigation';
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import { Slider } from "@/components/ui/slider";
import { Checkbox } from "@/components/ui/checkbox";
import { Label } from "@/components/ui/label";
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
  tireTypes: string[];
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
  tireTypes: string[];
  widths: number[];
  aspectRatios: number[];
  rimDiameters: number[];
  speedRatings: string[];
}

export function ProductFilters() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const [priceRange, setPriceRange] = useState([50, 500]);
  const [loading, setLoading] = useState(true);
  const [filterOptions, setFilterOptions] = useState<FilterOptions>({
    brands: [],
    categories: [],
    tireTypes: [],
    widths: [],
    aspectRatios: [],
    rimDiameters: [],
    speedRatings: []
  });

  // Initialize filters from URL search params
  const [filters, setFilters] = useState<FilterState>({
    brands: [],
    categories: [],
    tireTypes: [],
    widths: [],
    aspectRatios: [],
    rimDiameters: [],
    speedRatings: [],
    runFlat: null,
    reinforced: null,
    minPrice: 50,
    maxPrice: 500
  });

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
    const brandIds = searchParams.get('brandIds')?.split(',') || [];
    const categoryIds = searchParams.get('categoryIds')?.split(',') || [];
    const tireTypes = searchParams.get('tireTypes')?.split(',') || [];
    const widths = searchParams.get('widths')?.split(',').map(Number) || [];
    const aspectRatios = searchParams.get('aspectRatios')?.split(',').map(Number) || [];
    const rimDiameters = searchParams.get('rimDiameters')?.split(',').map(Number) || [];
    const speedRatings = searchParams.get('speedRatings')?.split(',') || [];
    const runFlat = searchParams.get('runFlat') === 'true' ? true : searchParams.get('runFlat') === 'false' ? false : null;
    const reinforced = searchParams.get('reinforced') === 'true' ? true : searchParams.get('reinforced') === 'false' ? false : null;
    const minPrice = Number(searchParams.get('minPrice') || 50);
    const maxPrice = Number(searchParams.get('maxPrice') || 500);

    // Update filters state
    setFilters({
      brands: brandIds,
      categories: categoryIds,
      tireTypes,
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

    // Add all active filters to the URL
    if (filters.brands.length > 0) params.set('brandIds', filters.brands.join(','));
    if (filters.categories.length > 0) params.set('categoryIds', filters.categories.join(','));
    if (filters.tireTypes.length > 0) params.set('tireTypes', filters.tireTypes.join(','));
    if (filters.widths.length > 0) params.set('widths', filters.widths.join(','));
    if (filters.aspectRatios.length > 0) params.set('aspectRatios', filters.aspectRatios.join(','));
    if (filters.rimDiameters.length > 0) params.set('rimDiameters', filters.rimDiameters.join(','));
    if (filters.speedRatings.length > 0) params.set('speedRatings', filters.speedRatings.join(','));
    if (filters.runFlat !== null) params.set('runFlat', filters.runFlat.toString());
    if (filters.reinforced !== null) params.set('reinforced', filters.reinforced.toString());
    params.set('minPrice', filters.minPrice.toString());
    params.set('maxPrice', filters.maxPrice.toString());

    // Update the URL
    router.push(`/products?${params.toString()}`);
  };

  // Reset all filters
  const resetFilters = () => {
    setFilters({
      brands: [],
      categories: [],
      tireTypes: [],
      widths: [],
      aspectRatios: [],
      rimDiameters: [],
      speedRatings: [],
      runFlat: null,
      reinforced: null,
      minPrice: 50,
      maxPrice: 500
    });
    setPriceRange([50, 500]);

    // Clear URL parameters
    router.push('/products');
  };

  // Handle brand selection change
  const handleBrandChange = (brandId: string) => {
    setFilters(prev => ({
      ...prev,
      brands: prev.brands.includes(brandId)
        ? prev.brands.filter(b => b !== brandId)
        : [...prev.brands, brandId]
    }));
  };

  // Handle category selection change
  const handleCategoryChange = (categoryId: string) => {
    setFilters(prev => ({
      ...prev,
      categories: prev.categories.includes(categoryId)
        ? prev.categories.filter(c => c !== categoryId)
        : [...prev.categories, categoryId]
    }));
  };

  // Handle tire type selection change
  const handleTireTypeChange = (tireType: string) => {
    setFilters(prev => ({
      ...prev,
      tireTypes: prev.tireTypes.includes(tireType)
        ? prev.tireTypes.filter(t => t !== tireType)
        : [...prev.tireTypes, tireType]
    }));
  };

  return (
    <div className="space-y-6 sticky top-24">
      <Card>
        <CardContent className="p-6">
          <div className="mb-6">
            <h3 className="text-lg font-semibold mb-2">Find Your Tire Size</h3>
            
            <div className="space-y-4">
              <div className="grid grid-cols-3 gap-3">
                <div>
                  <Label htmlFor="width">Width</Label>
                  <Select 
                    value={filters.widths.length === 1 ? String(filters.widths[0]) : ""}
                    onValueChange={(value) => {
                      const width = Number(value);
                      setFilters(prev => ({
                        ...prev,
                        widths: value ? [width] : []
                      }));
                    }}
                  >
                    <SelectTrigger id="width">
                      <SelectValue placeholder="Width" />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="0">Any</SelectItem>
                      {filterOptions.widths.length > 0 ? (
                        filterOptions.widths.map(width => (
                          <SelectItem key={width} value={String(width)}>{width}</SelectItem>
                        ))
                      ) : (
                        <SelectItem value="0" disabled>No options available</SelectItem>
                      )}
                    </SelectContent>
                  </Select>
                </div>
                
                <div>
                  <Label htmlFor="aspectRatio">Aspect Ratio</Label>
                  <Select
                    value={filters.aspectRatios.length === 1 ? String(filters.aspectRatios[0]) : ""}
                    onValueChange={(value) => {
                      const aspectRatio = Number(value);
                      setFilters(prev => ({
                        ...prev,
                        aspectRatios: value ? [aspectRatio] : []
                      }));
                    }}
                  >
                    <SelectTrigger id="aspectRatio">
                      <SelectValue placeholder="Ratio" />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="0">Any</SelectItem>
                      {filterOptions.aspectRatios.length > 0 ? (
                        filterOptions.aspectRatios.map(ratio => (
                          <SelectItem key={ratio} value={String(ratio)}>{ratio}</SelectItem>
                        ))
                      ) : (
                        <SelectItem value="0" disabled>No options available</SelectItem>
                      )}
                    </SelectContent>
                  </Select>
                </div>
                
                <div>
                  <Label htmlFor="rimDiameter">Rim Diameter</Label>
                  <Select
                    value={filters.rimDiameters.length === 1 ? String(filters.rimDiameters[0]) : ""}
                    onValueChange={(value) => {
                      const diameter = Number(value);
                      setFilters(prev => ({
                        ...prev,
                        rimDiameters: value ? [diameter] : []
                      }));
                    }}
                  >
                    <SelectTrigger id="rimDiameter">
                      <SelectValue placeholder="Rim" />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="0">Any</SelectItem>
                      {filterOptions.rimDiameters.length > 0 ? (
                        filterOptions.rimDiameters.map(diameter => (
                          <SelectItem key={diameter} value={String(diameter)}>{diameter}"</SelectItem>
                        ))
                      ) : (
                        <SelectItem value="0" disabled>No options available</SelectItem>
                      )}
                    </SelectContent>
                  </Select>
                </div>
              </div>
              
              <Button 
                className="w-full" 
                onClick={applyFilters}
              >
                Find Tires
              </Button>
              
              <p className="text-sm text-gray-500 mt-2">
                Not sure about your tire size? 
                <a href="/tire-finder" className="text-blue-500 ml-1 hover:underline">
                  Use our Tire Finder
                </a>
              </p>
            </div>
          </div>
          
          <Accordion type="multiple" defaultValue={["price", "types"]}>
            <AccordionItem value="price">
              <AccordionTrigger className="text-base font-medium">Price Range</AccordionTrigger>
              <AccordionContent>
                <div className="pt-2 px-1">
                  <Slider
                    value={priceRange}
                    onValueChange={(values) => {
                      setPriceRange(values as number[]);
                      setFilters(prev => ({
                        ...prev,
                        minPrice: values[0],
                        maxPrice: values[1]
                      }));
                    }}
                    min={0}
                    max={1000}
                    step={10}
                  />
                  <div className="flex justify-between mt-2 text-sm">
                    <span>${priceRange[0]}</span>
                    <span>${priceRange[1]}</span>
                  </div>
                </div>
              </AccordionContent>
            </AccordionItem>
            
            <AccordionItem value="brands">
              <AccordionTrigger className="text-base font-medium">Brands</AccordionTrigger>
              <AccordionContent>
                <div className="space-y-2 max-h-48 overflow-y-auto pr-2">
                  {loading ? (
                    <div className="text-sm text-gray-500">Loading brands...</div>
                  ) : (
                    filterOptions.brands.map(brand => (
                      <div key={brand.id} className="flex items-center space-x-2">
                        <Checkbox 
                          id={`brand-${brand.id}`} 
                          checked={filters.brands.includes(brand.id)}
                          onCheckedChange={() => handleBrandChange(brand.id)}
                        />
                        <Label htmlFor={`brand-${brand.id}`} className="text-sm font-normal cursor-pointer">
                          {brand.name}
                        </Label>
                      </div>
                    ))
                  )}
                </div>
              </AccordionContent>
            </AccordionItem>
            
            <AccordionItem value="categories">
              <AccordionTrigger className="text-base font-medium">Categories</AccordionTrigger>
              <AccordionContent>
                <div className="space-y-2">
                  {loading ? (
                    <div className="text-sm text-gray-500">Loading categories...</div>
                  ) : (
                    filterOptions.categories.map(category => (
                      <div key={category.id} className="flex items-center space-x-2">
                        <Checkbox 
                          id={`category-${category.id}`} 
                          checked={filters.categories.includes(category.id)}
                          onCheckedChange={() => handleCategoryChange(category.id)}
                        />
                        <Label htmlFor={`category-${category.id}`} className="text-sm font-normal cursor-pointer">
                          {category.name}
                        </Label>
                      </div>
                    ))
                  )}
                </div>
              </AccordionContent>
            </AccordionItem>
            
            <AccordionItem value="types">
              <AccordionTrigger className="text-base font-medium">Tire Types</AccordionTrigger>
              <AccordionContent>
                <div className="space-y-2">
                  {loading ? (
                    <div className="text-sm text-gray-500">Loading tire types...</div>
                  ) : (
                    filterOptions.tireTypes.map(tireType => (
                      <div key={tireType} className="flex items-center space-x-2">
                        <Checkbox 
                          id={`type-${tireType}`} 
                          checked={filters.tireTypes.includes(tireType)}
                          onCheckedChange={() => handleTireTypeChange(tireType)}
                        />
                        <Label htmlFor={`type-${tireType}`} className="text-sm font-normal cursor-pointer">
                          {tireType.replace('_', ' ')}
                        </Label>
                      </div>
                    ))
                  )}
                </div>
              </AccordionContent>
            </AccordionItem>
            
            <AccordionItem value="advanced">
              <AccordionTrigger className="text-base font-medium">Advanced Options</AccordionTrigger>
              <AccordionContent>
                <div className="space-y-4">
                  <div>
                    <Label htmlFor="speed-rating">Speed Rating</Label>
                    <Select
                      value={filters.speedRatings.length === 1 ? filters.speedRatings[0] : ""}
                      onValueChange={(value) => {
                        setFilters(prev => ({
                          ...prev,
                          speedRatings: value ? [value] : []
                        }));
                      }}
                    >
                      <SelectTrigger id="speed-rating">
                        <SelectValue placeholder="Any" />
                      </SelectTrigger>
                      <SelectContent>
                        <SelectItem value="0">Any</SelectItem>
                        {filterOptions.speedRatings.length > 0 ? (
                          filterOptions.speedRatings.map(rating => (
                            <SelectItem key={rating} value={rating}>{rating}</SelectItem>
                          ))
                        ) : (
                          <SelectItem value="0" disabled>No options available</SelectItem>
                        )}
                      </SelectContent>
                    </Select>
                  </div>
                  
                  <div className="flex items-center space-x-2">
                    <Checkbox 
                      id="run-flat" 
                      checked={filters.runFlat === true}
                      onCheckedChange={(value) => {
                        setFilters(prev => ({
                          ...prev,
                          runFlat: value === true ? true : value === false ? null : false
                        }));
                      }}
                    />
                    <Label htmlFor="run-flat" className="text-sm font-normal cursor-pointer">
                      Run Flat Technology
                    </Label>
                  </div>
                  
                  <div className="flex items-center space-x-2">
                    <Checkbox 
                      id="reinforced" 
                      checked={filters.reinforced === true}
                      onCheckedChange={(value) => {
                        setFilters(prev => ({
                          ...prev,
                          reinforced: value === true ? true : value === false ? null : false
                        }));
                      }}
                    />
                    <Label htmlFor="reinforced" className="text-sm font-normal cursor-pointer">
                      Reinforced
                    </Label>
                  </div>
                </div>
              </AccordionContent>
            </AccordionItem>
          </Accordion>
          
          <div className="flex gap-2 mt-6">
            <Button 
              variant="default" 
              className="flex-1"
              onClick={applyFilters}
            >
              Apply Filters
            </Button>
            
            <Button 
              variant="outline" 
              className="flex-1"
              onClick={resetFilters}
            >
              Reset
            </Button>
          </div>
        </CardContent>
      </Card>
    </div>
  );
}