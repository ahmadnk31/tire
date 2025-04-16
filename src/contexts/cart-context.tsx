"use client";

import { 
  createContext, 
  useContext, 
  useState, 
  useEffect, 
  ReactNode 
} from "react";
import { usePromotion, calculateTotalDiscount } from "./promotion-context";
import { Promotion } from "@/hooks/use-promotions";

// Types
export interface CartItem {
  id: string;
  name: string;
  price: number;
  originalPrice?: number;
  discountPercent?: number;
  quantity: number;
  image: string;
  size: string;
  brandName: string;
  productId: string;
  weight?: number;
  dimensions?: {
    length: number;
    width: number;
    height: number;
  };
}

export interface ShippingAddress {
  firstName: string;
  lastName: string;
  email: string;
  phone: string;
  addressLine1: string;
  addressLine2?: string;
  city: string;
  state: string;
  postalCode: string;
  country: string;
}

export interface ShippingOption {
  id: string;
  name: string;
  price: number;
  estimatedDelivery: string;
  description?: string;
  provider?: string;
  serviceLevel?: string;
}

export interface CartSummary {
  subtotal: number;
  tax: number;
  shipping: number;
  discount: number;
  promotionsDiscount: number;
  total: number;
}

interface CartContextType {
  items: CartItem[];
  addItem: (item: CartItem) => void;
  updateItemQuantity: (id: string, quantity: number) => void;
  removeItem: (id: string) => void;
  clearCart: () => void;
  itemCount: number;
  summary: CartSummary;
  shippingAddress: ShippingAddress | null;
  setShippingAddress: (address: ShippingAddress) => void;
  shippingOptions: ShippingOption[];
  setShippingOptions: (options: ShippingOption[]) => void;
  selectedShippingOption: ShippingOption | null;
  setSelectedShippingOption: (option: ShippingOption) => void;
  updateSummary: (newShipping?: number) => void;
  applyPromoCode: (code: string) => Promise<boolean>;
  removePromotion: (id: string) => void;
  appliedPromotions: Promotion[];
}

// Import default shipping options from centralized configuration
import { DEFAULT_SHIPPING_OPTIONS } from '@/lib/shipping/shipping-options';

// Default shipping options
export const defaultShippingOptions = DEFAULT_SHIPPING_OPTIONS;

// Create context with default values
const CartContext = createContext<CartContextType>({
  items: [],
  addItem: () => {},
  updateItemQuantity: () => {},
  removeItem: () => {},
  clearCart: () => {},
  itemCount: 0,
  summary: {
    subtotal: 0,
    tax: 0,
    shipping: 0,
    discount: 0,
    promotionsDiscount: 0,
    total: 0,
  },
  shippingAddress: null,
  setShippingAddress: () => {},
  applyPromoCode: async () => false,
  removePromotion: () => {},
  appliedPromotions: [],
  shippingOptions: defaultShippingOptions,
  setShippingOptions: () => {},
  selectedShippingOption: null,
  setSelectedShippingOption: () => {},
  updateSummary: () => {},
});

// Provider component
export function CartProvider({ children }: { children: ReactNode }) {
  const [items, setItems] = useState<CartItem[]>([]);
  const [shippingAddress, setShippingAddress] = useState<ShippingAddress | null>(null);
  const [shippingOptions, setShippingOptions] = useState<ShippingOption[]>(defaultShippingOptions);
  const [selectedShippingOption, setSelectedShippingOption] = useState<ShippingOption | null>(null);
  const { activePromotions, appliedPromotions, applyPromoCode, removePromotion } = usePromotion();
  
  // Load cart from localStorage on initial render
  useEffect(() => {
    const savedCart = localStorage.getItem("cart");
    const savedShippingAddress = localStorage.getItem("shippingAddress");
    const savedShippingOption = localStorage.getItem("shippingOption");
    
    if (savedCart) {
      try {
        setItems(JSON.parse(savedCart));
      } catch (error) {
        console.error("Failed to parse saved cart:", error);
      }
    }
    
    if (savedShippingAddress) {
      try {
        setShippingAddress(JSON.parse(savedShippingAddress));
      } catch (error) {
        console.error("Failed to parse saved shipping address:", error);
      }
    }
    
    if (savedShippingOption) {
      try {
        setSelectedShippingOption(JSON.parse(savedShippingOption));
      } catch (error) {
        console.error("Failed to parse saved shipping option:", error);
      }
    }
  }, []);
  
  // Save cart to localStorage whenever it changes
  useEffect(() => {
    localStorage.setItem("cart", JSON.stringify(items));
  }, [items]);
  
  // Save shipping address to localStorage
  useEffect(() => {
    if (shippingAddress) {
      localStorage.setItem("shippingAddress", JSON.stringify(shippingAddress));
    }
  }, [shippingAddress]);
  
  // Save selected shipping option to localStorage
  useEffect(() => {
    if (selectedShippingOption) {
      localStorage.setItem("shippingOption", JSON.stringify(selectedShippingOption));
    }
  }, [selectedShippingOption]);
  
  // Calculate total number of items in cart
  const itemCount = items.reduce((total, item) => total + item.quantity, 0);
  
  // Add an item to cart
  const addItem = (item: CartItem) => {
    setItems(prev => {
      // Check if item already exists in cart
      const existingItemIndex = prev.findIndex(i => i.id === item.id);
      
      if (existingItemIndex >= 0) {
        // Update quantity if item exists
        const newItems = [...prev];
        newItems[existingItemIndex].quantity += item.quantity;
        return newItems;
      } else {
        // Add new item if it doesn't exist
        return [...prev, item];
      }
    });
  };
  
  // Update an item's quantity
  const updateItemQuantity = (id: string, quantity: number) => {
    if (quantity <= 0) {
      removeItem(id);
      return;
    }
    
    setItems(prev => 
      prev.map(item => 
        item.id === id ? { ...item, quantity } : item
      )
    );
  };
  
  // Remove an item from cart
  const removeItem = (id: string) => {
    setItems(prev => prev.filter(item => item.id !== id));
  };
  
  // Clear the entire cart
  const clearCart = () => {
    setItems([]);
    localStorage.removeItem("cart");
    localStorage.removeItem("shippingAddress");
    localStorage.removeItem("shippingOption");
    setShippingAddress(null);
    setSelectedShippingOption(null);
  };
    // Calculate cart summary (subtotal, tax, shipping, total)
  const calculateSummary = (): CartSummary => {
    const subtotal = items.reduce((total, item) => total + (item.price * item.quantity), 0);
    
    // Calculate product discount total (from original price vs. sale price)
    const discount = items.reduce((total, item) => {
      if (item.originalPrice && item.price < item.originalPrice) {
        return total + ((item.originalPrice - item.price) * item.quantity);
      }
      return total;
    }, 0);
    
    // Calculate promotions discount
    const promotionsDiscount = calculateTotalDiscount(items, appliedPromotions);
    
    // Check for free shipping promotion
    let shippingDiscount = 0;
    const hasFreeShipping = appliedPromotions.some(promo => promo.type === 'free_shipping');
    
    // Calculate tax (e.g., 8.25%) - Apply after promotions discount
    const taxRate = 0.0825;
    const taxableAmount = subtotal - promotionsDiscount;
    const tax = taxableAmount > 0 ? taxableAmount * taxRate : 0;
    
    // Get shipping cost from selected option, or default to 0
    let shipping = selectedShippingOption ? selectedShippingOption.price : 0;
    if (hasFreeShipping) {
      shippingDiscount = shipping;
      shipping = 0;
    }
      // Calculate total (with all discounts applied)
    // First add shipping discount to promotionsDiscount
    const totalPromotionsDiscount = promotionsDiscount + shippingDiscount;
    
    // Then calculate total with all discounts properly applied
    const total = subtotal - totalPromotionsDiscount + tax + shipping;
    
    return {
      subtotal,
      tax,
      shipping,
      discount,
      promotionsDiscount: totalPromotionsDiscount,
      total
    };
  };
  
  const updateSummary = (newShipping?: number) => {
    const updatedSummary = calculateSummary();
    if (newShipping !== undefined) {
      updatedSummary.shipping = newShipping;
      updatedSummary.total = updatedSummary.subtotal + updatedSummary.tax + updatedSummary.shipping;
    }
    return updatedSummary;
  };

  const summary = calculateSummary();
    const value = {
    items,
    addItem,
    updateItemQuantity,
    removeItem,
    clearCart,
    itemCount,
    summary,
    shippingAddress,
    setShippingAddress,
    shippingOptions,
    setShippingOptions,
    selectedShippingOption,
    setSelectedShippingOption,
    updateSummary,
    applyPromoCode,
    removePromotion,
    appliedPromotions
  };
  
  return <CartContext.Provider value={value}>{children}</CartContext.Provider>;
}

// Custom hook to use the cart context
export const useCart = () => useContext(CartContext);