import { useState } from "react";
import { Star } from "lucide-react";
import { cn } from "@/lib/utils";

interface RatingProps {
  value: number;
  onChange: (value: number) => void;
  max?: number;
  size?: "sm" | "md" | "lg";
  readOnly?: boolean;
  disabled?: boolean;
}

export function Rating({
  value,
  onChange,
  max = 5,
  size = "md",
  readOnly = false,
  disabled = false,
}: RatingProps) {
  const [hoverValue, setHoverValue] = useState<number | null>(null);

  const sizeClasses = {
    sm: "w-4 h-4",
    md: "w-6 h-6",
    lg: "w-8 h-8",
  };

  const handleClick = (newValue: number) => {
    if (readOnly || disabled) return;
    onChange(newValue);
  };

  const handleMouseEnter = (newValue: number) => {
    if (readOnly || disabled) return;
    setHoverValue(newValue);
  };

  const handleMouseLeave = () => {
    if (readOnly || disabled) return;
    setHoverValue(null);
  };

  return (
    <div 
      className={cn(
        "flex items-center space-x-1",
        disabled && "opacity-50 cursor-not-allowed"
      )}
    >
      {Array.from({ length: max }).map((_, i) => {
        const starValue = i + 1;
        const isFilled = hoverValue !== null 
          ? starValue <= hoverValue 
          : starValue <= value;

        return (
          <Star
            key={i}
            className={cn(
              sizeClasses[size],
              "cursor-pointer transition-colors",
              isFilled ? "text-yellow-400 fill-yellow-400" : "text-gray-300",
              !readOnly && !disabled && "hover:text-yellow-500",
              readOnly && "cursor-default"
            )}
            onClick={() => handleClick(starValue)}
            onMouseEnter={() => handleMouseEnter(starValue)}
            onMouseLeave={handleMouseLeave}
          />
        );
      })}
    </div>
  );
}

interface ReadOnlyRatingProps {
  value: number;
  max?: number;
  size?: "sm" | "md" | "lg";
}

export function ReadOnlyRating({ value, max = 5, size = "sm" }: ReadOnlyRatingProps) {
  const sizeClasses = {
    sm: "w-4 h-4",
    md: "w-6 h-6",
    lg: "w-8 h-8",
  };

  return (
    <div className="flex items-center space-x-0.5">
      {Array.from({ length: max }).map((_, i) => {
        const starValue = i + 1;
        const isFilled = starValue <= value;

        return (
          <Star
            key={i}
            className={cn(
              sizeClasses[size],
              isFilled ? "text-yellow-400 fill-yellow-400" : "text-gray-300"
            )}
          />
        );
      })}
    </div>
  );
}