'use client';

import React, { forwardRef } from 'react';
import { TipTapEditor } from './tiptap-editor';
import '@/styles/tiptap-custom.css';

interface TipTapAdapterProps {
  value: string;
  onChange: (value: string) => void;
  placeholder?: string;
  className?: string;
}

export const TipTapAdapter = forwardRef<HTMLDivElement, TipTapAdapterProps>(
  function TipTapAdapter({ value, onChange, placeholder, className }, ref) {
    return (
      <TipTapEditor
        ref={ref}
        value={value}
        onChange={onChange}
        placeholder={placeholder}
        className={className}
      />
    );
  }
);
