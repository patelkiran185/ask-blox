"use client"

import * as React from "react"
import { Check, ChevronsUpDown } from "lucide-react"

import { cn } from "@/lib/utils"
import { Button } from "@/components/ui/button"
import {
  Command,
  CommandEmpty,
  CommandGroup,
  CommandInput,
  CommandItem,
  CommandList,
} from "@/components/ui/command"
import {
  Popover,
  PopoverContent,
  PopoverTrigger,
} from "@/components/ui/popover"

const candidateLevels = [
  {
    value: "intern",
    label: "Intern",
    description: "Entry-level internship positions"
  },
  {
    value: "entry-level",
    label: "Entry Level",
    description: "0-2 years of experience"
  },
  {
    value: "mid-level",
    label: "Mid Level",
    description: "3-5 years of experience"
  },
  {
    value: "senior",
    label: "Senior",
    description: "5+ years of experience"
  },
]

interface CandidateLevelComboboxProps {
  value?: string
  onValueChange: (value: string) => void
  placeholder?: string
}

export function CandidateLevelCombobox({ 
  value, 
  onValueChange, 
  placeholder = "Select your level..." 
}: CandidateLevelComboboxProps) {
  const [open, setOpen] = React.useState(false)

  return (
    <Popover open={open} onOpenChange={setOpen}>
      <PopoverTrigger asChild>
        <Button
          variant="outline"
          role="combobox"
          aria-expanded={open}
          className="w-full justify-between bg-neutral-900/50 border-neutral-700 text-white hover:bg-neutral-800/50 hover:text-white"
        >
          {value
            ? candidateLevels.find((level) => level.value === value)?.label
            : placeholder}
          <ChevronsUpDown className="ml-2 h-4 w-4 shrink-0 opacity-50" />
        </Button>
      </PopoverTrigger>
      <PopoverContent className="w-full p-0 bg-neutral-900 border-neutral-700">
        <Command className="bg-neutral-900 text-white">
          <CommandInput 
            placeholder="Search level..." 
            className="bg-neutral-900 text-white placeholder:text-neutral-400"
          />
          <CommandList>
            <CommandEmpty className="text-neutral-400">No level found.</CommandEmpty>
            <CommandGroup>
              {candidateLevels.map((level) => (
                <CommandItem
                  key={level.value}
                  value={level.value}
                  onSelect={(currentValue) => {
                    onValueChange(currentValue === value ? "" : currentValue)
                    setOpen(false)
                  }}
                  className="hover:bg-neutral-800 text-white data-[selected]:bg-neutral-800"
                >
                  <Check
                    className={cn(
                      "mr-2 h-4 w-4",
                      value === level.value ? "opacity-100" : "opacity-0"
                    )}
                  />
                  <div className="flex flex-col">
                    <span>{level.label}</span>
                    <span className="text-xs text-neutral-400">{level.description}</span>
                  </div>
                </CommandItem>
              ))}
            </CommandGroup>
          </CommandList>
        </Command>
      </PopoverContent>
    </Popover>
  )
} 