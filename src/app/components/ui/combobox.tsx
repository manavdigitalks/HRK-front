"use client"

import * as React from "react"
import { Check, ChevronsUpDown, Plus } from "lucide-react"

import { cn } from "./utils"
import { Button } from "./button"
import {
  Command,
  CommandEmpty,
  CommandGroup,
  CommandInput,
  CommandItem,
  CommandList,
} from "./command"
import {
  Popover,
  PopoverContent,
  PopoverTrigger,
} from "./popover"

interface ComboboxProps {
  options: { label: string; value: string }[]
  value?: string
  onChange: (value: string) => void
  placeholder?: string
  emptyMessage?: string
  disabled?: boolean
  className?: string
  allowCustomValue?: boolean
  onSearchChange?: (value: string) => void
}

export function Combobox({
  options,
  value,
  onChange,
  placeholder = "Select option...",
  emptyMessage = "No option found.",
  disabled = false,
  className,
  allowCustomValue = false,
  onSearchChange,
}: ComboboxProps) {
  const [open, setOpen] = React.useState(false)
  const [searchValue, setSearchValue] = React.useState("")
  const onSearchChangeRef = React.useRef(onSearchChange);

  React.useEffect(() => {
    onSearchChangeRef.current = onSearchChange;
  }, [onSearchChange]);

  React.useEffect(() => {
    if (!onSearchChangeRef.current) return;
    
    const handler = setTimeout(() => {
      onSearchChangeRef.current?.(searchValue);
    }, 300);

    return () => clearTimeout(handler);
  }, [searchValue]);

  const findLabel = (val: string) => {
    return options.find((option) => option.value.toLowerCase() === val.toLowerCase())?.label || val;
  }

  return (
    <Popover open={open} onOpenChange={setOpen}>
      <PopoverTrigger asChild>
        <Button
          variant="outline"
          role="combobox"
          aria-expanded={open}
          className={cn("w-full justify-between font-normal h-10 border-gray-200 bg-white hover:bg-gray-50", className)}
          disabled={disabled}
        >
          <span className="truncate">
            {value ? findLabel(value) : placeholder}
          </span>
          <ChevronsUpDown className="ml-2 h-4 w-4 shrink-0 opacity-50" />
        </Button>
      </PopoverTrigger>
      <PopoverContent align="start" className="w-[var(--radix-popover-trigger-width)] p-0 z-[100]">
        <Command shouldFilter={false}>
          <CommandInput 
            placeholder={`Search ${placeholder.toLowerCase()}...`} 
            value={searchValue}
            onValueChange={setSearchValue}
          />
          <CommandList className="max-h-[300px]">
            {/* If no exact match and searchValue is not empty, show "Add new" option if allowed */}
            {allowCustomValue && searchValue && !options.some(o => o.label.toLowerCase() === searchValue.toLowerCase()) && (
              <CommandGroup>
                <CommandItem
                  value={searchValue}
                  onSelect={() => {
                    onChange(searchValue)
                    setSearchValue("")
                    setOpen(false)
                  }}
                  className="text-indigo-600 font-medium italic"
                >
                  <Plus className="mr-2 h-4 w-4" />
                  Add "{searchValue}"
                </CommandItem>
              </CommandGroup>
            )}
            {options.filter(o => o.label.toLowerCase().includes(searchValue.toLowerCase())).length === 0 && (!allowCustomValue || !searchValue) && (
                <CommandEmpty>{emptyMessage}</CommandEmpty>
            )}
            <CommandGroup>
              {options
                .filter(o => o.label.toLowerCase().includes(searchValue.toLowerCase()))
                .map((option) => (
                <CommandItem
                  key={option.value}
                  value={option.value}
                  onSelect={(currentValue) => {
                    const val = options.find(o => o.value.toLowerCase() === currentValue.toLowerCase())?.value || currentValue;
                    onChange(val)
                    setSearchValue("")
                    setOpen(false)
                  }}
                >
                  <Check
                    className={cn(
                      "mr-2 h-4 w-4",
                      value?.toLowerCase() === option.value.toLowerCase() ? "opacity-100" : "opacity-0"
                    )}
                  />
                  {option.label}
                </CommandItem>
              ))}
            </CommandGroup>
          </CommandList>
        </Command>
      </PopoverContent>
    </Popover>
  )
}
