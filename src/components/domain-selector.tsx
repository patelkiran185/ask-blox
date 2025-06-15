import { DOMAINS } from '@/lib/domains';
import { Check, ChevronsUpDown } from "lucide-react";
import * as React from "react";
import { cn } from "@/lib/utils";
import { Button } from "@/components/ui/button";
import {
  Command,
  CommandEmpty,
  CommandGroup,
  CommandInput,
  CommandItem,
} from "@/components/ui/command";
import {
  Popover,
  PopoverContent,
  PopoverTrigger,
} from "@/components/ui/popover";

interface DomainSelectorProps {
  value: string;
  onValueChange: (value: string) => void;
  placeholder?: string;
}

export function DomainSelector({
  value,
  onValueChange,
  placeholder = "Select domain..."
}: DomainSelectorProps) {
  const [open, setOpen] = React.useState(false);
  const domains = Object.entries(DOMAINS).map(([key, value]) => ({
    value: key,
    label: value.name
  }));

  return (
    <Popover open={open} onOpenChange={setOpen}>
      <PopoverTrigger asChild>
        <Button
          variant="outline"
          role="combobox"
          aria-expanded={open}
          className="w-full justify-between"
        >
          {value
            ? domains.find((domain) => domain.value === value)?.label
            : placeholder}
          <ChevronsUpDown className="ml-2 h-4 w-4 shrink-0 opacity-50" />
        </Button>
      </PopoverTrigger>
      <PopoverContent className="w-full p-0">
        <Command>
          <CommandInput placeholder="Search domain..." />
          <CommandEmpty>No domain found.</CommandEmpty>
          <CommandGroup>
            {domains.map((domain) => (
              <CommandItem
                key={domain.value}
                value={domain.value}
                onSelect={(currentValue) => {
                  onValueChange(currentValue);
                  setOpen(false);
                }}
              >
                <Check
                  className={cn(
                    "mr-2 h-4 w-4",
                    value === domain.value ? "opacity-100" : "opacity-0"
                  )}
                />
                {domain.label}
              </CommandItem>
            ))}
          </CommandGroup>
        </Command>
      </PopoverContent>
    </Popover>
  );
} 