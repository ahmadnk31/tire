'use client'
import { useState } from "react";

interface DataTableSkeletonProps {
  columnCount?: number;
  rowCount?: number;
}

export function DataTableSkeleton({
  columnCount = 5,
  rowCount = 10,
}: DataTableSkeletonProps) {
  return (
    <div className="w-full">
      <div className="flex items-center py-4 gap-2">
        <div className="h-9 w-64 bg-gray-200 animate-pulse rounded"></div>
        <div className="ml-auto h-9 w-20 bg-gray-200 animate-pulse rounded"></div>
      </div>
      <div className="rounded-md border">
        <div className="min-w-full divide-y divide-gray-200">
          <div className="bg-gray-50">
            <div className="flex">
              {Array(columnCount)
                .fill(null)
                .map((_, index) => (
                  <div key={index} className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                    <div className="h-6 w-full max-w-[120px] bg-gray-200 animate-pulse rounded"></div>
                  </div>
                ))}
            </div>
          </div>
          <div className="bg-white divide-y divide-gray-200">
            {Array(rowCount)
              .fill(null)
              .map((_, rowIndex) => (
                <div key={rowIndex} className="flex">
                  {Array(columnCount)
                    .fill(null)
                    .map((_, cellIndex) => (
                      <div key={cellIndex} className="px-6 py-4 whitespace-nowrap">
                        <div className="h-6 w-full bg-gray-200 animate-pulse rounded"></div>
                      </div>
                    ))}
                </div>
              ))}
          </div>
        </div>
      </div>
      <div className="flex items-center justify-end space-x-2 py-4">
        <div className="h-8 w-24 bg-gray-200 animate-pulse rounded"></div>
        <div className="h-8 w-16 bg-gray-200 animate-pulse rounded"></div>
      </div>
    </div>
  );
}