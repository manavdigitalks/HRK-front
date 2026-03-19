"use client";

import * as React from "react";
import { Input } from "./input";
import { cn } from "./utils";

interface PhoneInputProps extends React.ComponentProps<"input"> {
  value: string;
  onPhoneChange: (val: string) => void;
}

export function PhoneInput({ value, onPhoneChange, className, disabled, ...props }: PhoneInputProps) {
  const handleChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    // Keep only digits
    const val = e.target.value.replace(/\D/g, "");
    // Limit to 10 digits
    if (val.length <= 10) {
      onPhoneChange(val);
    }
  };

  return (
    <div className="relative flex items-center group">
      <div className={cn(
        "absolute left-[1px] top-[1px] bottom-[1px] flex items-center justify-center px-2.5 bg-gray-50 border-r border-gray-200 rounded-l-md text-sm font-bold text-indigo-600 select-none z-10 transition-colors",
        disabled && "bg-gray-100 text-gray-400"
      )}>
        +91
      </div>
      <Input
        {...props}
        type="text"
        value={value}
        onChange={handleChange}
        disabled={disabled}
        className={cn(
          "pl-14 font-mono tracking-wider h-10", 
          className
        )}
      />
      {/* Visual indicator for 10 digits */}
      <div className="absolute right-3 text-[10px] font-bold text-gray-300 pointer-events-none group-focus-within:text-indigo-400">
        {value.length}/10
      </div>
    </div>
  );
}
