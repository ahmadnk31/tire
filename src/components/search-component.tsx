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
  CommandInput,
  CommandList,
  CommandEmpty,
  CommandGroup,
  CommandItem,
} from "@/components/ui/command";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { useDebounce } from "@/hooks/use-debounce";
import { cn } from "@/lib/utils";

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
  discount: number;
  salePrice?: number;
}

interface SearchResponse {
  products: SearchProduct[];
  total: number;
}

export function SearchComponent({placeholder}: {placeholder?: string}) {
  const router = useRouter();
  const commandRef = useRef<HTMLDivElement>(null);
  const [query, setQuery] = useState("");
  const [isOpen, setIsOpen] = useState(false);
  const [results, setResults] = useState<SearchProduct[]>([]);
  const [loading, setLoading] = useState(false);
  const [hasSearched, setHasSearched] = useState(false);
  
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
    
    search();
  }, [debouncedSearchTerm]);
  
  // Close dropdown when clicking outside
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
  
  // Format price with discount
  const formatPrice = (product: SearchProduct) => {
    if (product.discount > 0) {
      const finalPrice = product.salePrice ?? (product.retailPrice - (product.retailPrice * product.discount / 100));
      return (
        <div className="flex items-center gap-1.5">
          <span className="font-medium">${finalPrice.toFixed(2)}</span>
          <span className="text-sm text-muted-foreground line-through">${product.retailPrice.toFixed(2)}</span>
        </div>
      );
    }
    
    return <span className="font-medium">${product.retailPrice.toFixed(2)}</span>;
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
  };
  
  return (
    <div className="relative w-full max-w-md" ref={commandRef}>
      <form onSubmit={handleSearchSubmit} className="flex w-full items-center">
        <div className="relative w-full">
          <SearchIcon className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" />
          
          <input
            type="text"
            className={cn(
              "flex h-10 w-full rounded-md border border-input pl-10 pr-10 bg-background",
              "py-2 text-sm ring-offset-background file:border-0 file:bg-transparent",
              "file:text-sm file:font-medium placeholder:text-muted-foreground",
              "focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring",
              "focus-visible:ring-offset-2 disabled:cursor-not-allowed disabled:opacity-50"
            )}
            placeholder={placeholder || "Search products..."}
            value={query}
            onChange={(e) => {
              setQuery(e.target.value);
              setIsOpen(!!e.target.value.trim());
            }}
            onFocus={() => {
              if (query.trim()) {
                setIsOpen(true);
              }
            }}
          />
          
          {query && (
            <Button
              type="button"
              variant="ghost"
              className="absolute right-0 top-0 h-full px-3 py-0 hover:bg-transparent"
              onClick={() => {
                setQuery("");
                setIsOpen(false);
                setResults([]);
              }}
            >
              <CloseIcon className="h-4 w-4 text-muted-foreground" />
              <span className="sr-only">Clear search</span>
            </Button>
          )}
        </div>
        
        <Button type="submit" className="ml-2 px-4 h-10" variant="default">
          Search
        </Button>
      </form>
      
      {isOpen && (
        <div className="absolute top-full left-0 z-50 w-full mt-1 rounded-md border border-border bg-popover shadow-md overflow-hidden">
          <Command className="rounded-lg border shadow-md">
            <CommandList>
              {loading && (
                <div className="py-6 text-center">
                  <LoaderIcon className="h-6 w-6 animate-spin mx-auto text-primary" />
                  <p className="text-sm text-muted-foreground mt-2">Searching...</p>
                </div>
              )}
              
              {!loading && results.length === 0 && hasSearched && (
                <CommandEmpty className="py-6 text-center">
                  <p>No results found for &quot;{query}&quot;</p>
                  <p className="text-sm text-muted-foreground mt-1">Try using different keywords or filters</p>
                </CommandEmpty>
              )}
              
              {!loading && results.length > 0 && (
                <CommandGroup heading="Products">
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
                              <span className="text-xs text-muted-foreground">No image</span>
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
                        <span>View all results</span>
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