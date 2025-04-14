"use client";

import { useState, useEffect, useRef } from "react";
import { useRouter } from "next/navigation";
import Image from "next/image";
import { 
  Search as SearchIcon,
  X as CloseIcon, 
  Loader2 as LoaderIcon 
} from "lucide-react";
import { 
  Command,
  CommandList,
  CommandEmpty,
  CommandGroup,
  CommandItem,
} from "@/components/ui/command";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { useDebounce } from "@/hooks/use-debounce";
import { cn } from "@/lib/utils";
import { useTranslations } from "next-intl";
import {formatPrice as FormatPrice} from '@/lib/utils'
import { useSession } from "next-auth/react";

// Types for search results
interface SearchProduct {
  id: string;
  name: string;
  brand: {
    name: string;
  };
  width: number;
  aspectRatio: number;
  rimDiameter: number;
  speedRating: string;
  images: string[];
  retailPrice: number;
  wholesalePrice: number;
  discount: number;
  retailerDiscount: number;
  salePrice?: number;
  wholesaleSalePrice?: number;
}

interface SearchResponse {
  products: SearchProduct[];
  total: number;
}

export function SearchComponent({placeholder, showButton=false}: {placeholder?: string, showButton?: boolean}) {
  const router = useRouter();
  const commandRef = useRef<HTMLDivElement>(null);
  const inputRef = useRef<HTMLInputElement>(null);
  const [query, setQuery] = useState("");
  const [isOpen, setIsOpen] = useState(false);
  const [isFullscreen, setIsFullscreen] = useState(false);
  const [isFocused, setIsFocused] = useState(false);
  const [results, setResults] = useState<SearchProduct[]>([]);
  const [loading, setLoading] = useState(false);
  const [hasSearched, setHasSearched] = useState(false);
  
    // Get translations
  const t = useTranslations("Search");
  const { data: session } = useSession();
  const userRole = session?.user?.role; // Fetch user role on component mount
  

  // Debounce search query to prevent excessive API calls
  const debouncedSearchTerm = useDebounce(query, 300);
    // Fetch search results when debounced term changes
  useEffect(() => {
    const search = async () => {
      if (!debouncedSearchTerm.trim()) {
        setResults([]);
        setLoading(false);
        return;
      }
      
      setLoading(true);
      
      try {
        const response = await fetch(`/api/search?query=${encodeURIComponent(debouncedSearchTerm)}&limit=5`);
        
        if (!response.ok) {
          throw new Error(`Error fetching search results: ${response.status}`);
        }
        
        const data: SearchResponse = await response.json();
        setResults(data.products);
        setHasSearched(true);
      } catch (error) {
        console.error('Search error:', error);
        setResults([]);
      } finally {
        setLoading(false);
      }
    };
    
    // Always search when a debounced term exists, regardless of isOpen state
    if (debouncedSearchTerm.trim()) {
      search();
    }
  }, [debouncedSearchTerm]);
    // Handle clicks outside to close dropdown
  useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      if (commandRef.current && !commandRef.current.contains(event.target as Node)) {
        setIsOpen(false);
      }
    };
    
    document.addEventListener("mousedown", handleClickOutside);
    return () => {
      document.removeEventListener("mousedown", handleClickOutside);
    };
  }, []);
  
  // Handle keyboard escape key to close dropdown
  useEffect(() => {
    const handleEscape = (event: KeyboardEvent) => {
      if (event.key === 'Escape') {
        setIsOpen(false);
      }
    };
    
    document.addEventListener('keydown', handleEscape);
    return () => {
      document.removeEventListener('keydown', handleEscape);
    };
  }, []);
  
  // Focus the input when the dropdown opens
  useEffect(() => {
    if (isOpen && inputRef.current) {
      inputRef.current.focus();
    }
  }, [isOpen]);
    // Format price with discount
  const formatPrice = (product: SearchProduct) => {
    // Determine if user is a retailer
    const isRetailer = userRole === "RETAILER";
    
    // Select the appropriate price based on user role
    const basePrice = isRetailer ? product.wholesalePrice : product.retailPrice;
    const discountPercentage = isRetailer ? product.retailerDiscount : product.discount;
    const discountedPrice = isRetailer ? product.wholesaleSalePrice : product.salePrice;
    
    // Calculate if there is a discount to apply
    const hasDiscount = isRetailer ? product.retailerDiscount > 0 : product.discount > 0;
    
    // Calculate the final price with discount if applicable
    const finalPrice = hasDiscount
      ? discountedPrice ?? (basePrice - (basePrice * discountPercentage / 100))
      : basePrice;
    
    if (hasDiscount) {
      return (
        <div className="flex flex-col items-end gap-0.5">
          <div className="flex items-center gap-1.5">
            <span className="font-medium">{FormatPrice(finalPrice)}</span>
            <span className="text-sm text-muted-foreground line-through">{FormatPrice(basePrice)}</span>
          </div>
          {isRetailer && (
            <Badge variant="secondary" className="text-xs bg-blue-100">Wholesale</Badge>
          )}
        </div>
      );
    }
    
    return (
      <div className="flex flex-col items-end">
        <span className="font-medium">{FormatPrice(basePrice)}</span>
        {isRetailer && (
          <Badge variant="secondary" className="text-xs bg-blue-100">Wholesale</Badge>
        )}
      </div>
    );
  };
  
  // Format tire size
  const formatTireSize = (product: SearchProduct) => {
    return `${product.width}/${product.aspectRatio}R${product.rimDiameter} ${product.speedRating}`;
  };
  
  // Handle product selection
  const handleSelect = (productId: string) => {
    router.push(`/products/${productId}`);
    setIsOpen(false);
    setQuery("");
  };
    // Handle search form submission
  const handleSearchSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!query.trim()) return;
    
    router.push(`/products?query=${encodeURIComponent(query.trim())}`);
    setIsOpen(false);
    setIsFullscreen(false);
  };
    // Toggle fullscreen mode
  const toggleFullscreen = () => {
    setIsFullscreen(!isFullscreen);
    setIsOpen(true);
    if (!isFullscreen) {
      // When entering fullscreen, ensure the input is focused
      setTimeout(() => {
        inputRef.current?.focus();
      }, 100);
    }
  };
  
  return (
    <div 
      className={cn(
        "relative w-full max-w-md transition-all duration-300 ease-in-out",
        isFullscreen && "fixed inset-0 z-50 w-full max-w-none h-full bg-background/95 backdrop-blur-sm p-4 flex flex-col"
      )} 
      ref={commandRef}
    >
      {isFullscreen && (
        <div className="flex justify-between items-center mb-4">
          <Button 
            variant="ghost" 
            size="sm" 
            className="text-muted-foreground" 
            onClick={() => {
              setIsFullscreen(false);
              setIsOpen(false);
            }}
          >
            <CloseIcon className="h-5 w-5 mr-2" />
            {t("clearSearch")}
          </Button>
        </div>
      )}
      
      <form onSubmit={handleSearchSubmit} className={cn(
        "flex w-full items-center",
        isFullscreen && "max-w-2xl mx-auto"
      )}>        <div className="relative w-full">
          <SearchIcon className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" />
          
          <input
            ref={inputRef}
            type="text"
            className={cn(
              "flex h-10 w-full rounded-md border border-input pl-10 pr-10 bg-background",
              "py-2 text-sm ring-offset-background file:border-0 file:bg-transparent",
              "file:text-sm file:font-medium placeholder:text-muted-foreground",
              "focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring",
              "focus-visible:ring-offset-2 disabled:cursor-not-allowed disabled:opacity-50",
              "transition-all duration-200",
              isFullscreen && "text-lg h-12"
            )}
            placeholder={placeholder || t("placeholder")}
            value={query}
            onChange={(e) => {
              setQuery(e.target.value);
              if (e.target.value.trim()) {
                setIsOpen(true);
              } else {
                setIsOpen(false);
              }
            }}
            onFocus={() => {
              setIsFocused(true);
              // Open dropdown on focus if there's a query or unconditionally for better UX
              setIsOpen(true);
            }}
            onBlur={() => {
              setIsFocused(false);
              // Don't close dropdown on blur - we'll handle this with the click outside handler
            }}            onClick={() => {
              // Always open dropdown when clicking on the input
              setIsOpen(true);
              // Enable fullscreen mode on click
              setIsFullscreen(true);
            }}
          />
          
          {query && (
            <Button
              type="button"
              variant="ghost"
              className="absolute right-0 top-0 h-full px-3 py-0 hover:bg-transparent"
              onClick={(e) => {
                e.stopPropagation();
                setQuery("");
                setIsOpen(false);
                setResults([]);
                inputRef.current?.focus();
              }}
            >
              <CloseIcon className="h-4 w-4 text-muted-foreground" />
              <span className="sr-only">{t("clearSearch")}</span>
            </Button>
          )}
        </div>
        
       {
        showButton&&(
          <Button type="submit" className="ml-2 px-4 h-10" variant="default">
          {t("searchButton")}
        </Button>
        )
       }
      </form>
        {isOpen && (
        <div className={cn(
          "w-full rounded-md border border-border bg-popover shadow-md overflow-hidden",
          isFullscreen 
            ? "mt-4 mx-auto max-w-2xl" 
            : "absolute top-full left-0 z-50 mt-1"
        )}>
          <Command className="rounded-lg border shadow-md">
            <CommandList>
              {loading && (
                <div className="py-6 text-center">
                  <LoaderIcon className="h-6 w-6 animate-spin mx-auto text-primary" />
                  <p className="text-sm text-muted-foreground mt-2">{t("searching")}</p>
                </div>
              )}
              
              {!loading && query.trim() && results.length === 0 && hasSearched && (
                <CommandEmpty className="py-6 text-center">
                  <p>{t("noResults", {query: query})}</p>
                  <p className="text-sm text-muted-foreground mt-1">{t("tryDifferentKeywords")}</p>
                </CommandEmpty>
              )}
              
              {!loading && !query.trim() && (
                <div className="py-6 text-center">
                  <SearchIcon className="h-8 w-8 text-muted-foreground/70 mx-auto" />
                  <p className="text-sm text-muted-foreground mt-2">{t("placeholder")}</p>
                </div>
              )}
              
              {!loading && results.length > 0 && (
                <CommandGroup heading={t("products")}>
                  {results.map((product) => (
                    <CommandItem
                      key={product.id}
                      value={product.id}
                      onSelect={() => handleSelect(product.id)}
                      className="py-3 px-4 cursor-pointer"
                    >
                      <div className="flex items-center gap-4">
                        <div className="h-14 w-14 bg-muted rounded-md overflow-hidden flex-shrink-0">
                          {product.images?.[0] ? (
                            <Image
                              src={product.images[0]}
                              alt={product.name}
                              width={56}
                              height={56}
                              className="h-full w-full object-contain"
                            />
                          ) : (
                            <div className="h-full w-full flex items-center justify-center bg-muted">
                              <span className="text-xs text-muted-foreground">{t("noImage")}</span>
                            </div>
                          )}
                        </div>
                        
                        <div className="flex-1 min-w-0">
                          <div className="flex items-center">
                            <p className="text-sm text-muted-foreground">{product.brand.name}</p>
                          </div>
                          <p className="font-medium truncate">{product.name}</p>
                          <div className="flex items-center justify-between mt-1">
                            <Badge variant="outline" className="text-xs">
                              {formatTireSize(product)}
                            </Badge>
                            <div className="text-right">
                              {formatPrice(product)}
                            </div>
                          </div>
                        </div>
                      </div>
                    </CommandItem>
                  ))}
                  
                  {results.length > 0 && (
                    <div className="py-2 px-4 border-t">
                      <Button 
                        variant="ghost" 
                        className="w-full justify-between text-sm text-muted-foreground"
                        onClick={() => {
                          router.push(`/products?query=${encodeURIComponent(query.trim())}`);
                          setIsOpen(false);
                        }}
                      >
                        <span>{t("viewAllResults")}</span>
                        <span className="text-xs bg-muted px-2 py-0.5 rounded-full">
                          Enter ↵
                        </span>
                      </Button>
                    </div>
                  )}
                </CommandGroup>
              )}
            </CommandList>
          </Command>
        </div>
      )}
    </div>
  );
}