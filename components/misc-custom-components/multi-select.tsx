'use client';

import * as React from 'react';
import { X } from 'lucide-react';

import { Badge } from '@/components/ui/badge';
import {
    Command,
    CommandEmpty,
    CommandGroup,
    CommandItem,
    CommandList,
} from '@/components/ui/command';
import { Command as CommandPrimitive } from 'cmdk';

type Option = Record<'value' | 'label', string>;

type MultiSelectProps = {
    options: Option[];
    selected: string[];
    onChange: (selected: string[]) => void;
    placeholder?: string;
    className?: string;
};

export function MultiSelect({
    options,
    selected,
    onChange,
    placeholder = 'Select options...',
    className,
}: MultiSelectProps) {
    const inputRef = React.useRef<HTMLInputElement>(null);
    const [open, setOpen] = React.useState(false);
    const [inputValue, setInputValue] = React.useState('');

    const handleUnselect = React.useCallback(
        (optionValue: string) => {
            onChange(selected.filter((s) => s !== optionValue));
        },
        [onChange, selected]
    );

    const handleKeyDown = React.useCallback(
        (e: React.KeyboardEvent<HTMLDivElement>) => {
            const input = inputRef.current;
            if (input) {
                if (e.key === 'Delete' || e.key === 'Backspace') {
                    if (input.value === '' && selected.length > 0) {
                        handleUnselect(selected[selected.length - 1]);
                    }
                }
                if (e.key === 'Escape') {
                    input.blur();
                }
            }
        },
        [handleUnselect, selected]
    );

    const selectables = options.filter((option) => !selected.includes(option.value));

    return (
        <Command
            onKeyDown={handleKeyDown}
            className={`overflow-visible bg-transparent ${className}`}
        >
            <div className="group rounded-md border border-input px-3 py-2 text-sm ring-offset-background focus-within:ring-2 focus-within:ring-ring focus-within:ring-offset-2">
                <div className="flex flex-wrap gap-1">
                    {selected.map((value) => {
                        const option = options.find((opt) => opt.value === value);
                        return (
                            <Badge key={value} variant="secondary">
                                {option?.label ?? value}
                                <button
                                    className="ml-1 rounded-full outline-none ring-offset-background focus:ring-2 focus:ring-ring focus:ring-offset-2"
                                    onKeyDown={(e) => {
                                        if (e.key === 'Enter') handleUnselect(value);
                                    }}
                                    onMouseDown={(e) => e.preventDefault()}
                                    onClick={() => handleUnselect(value)}
                                >
                                    <X className="h-3 w-3 text-muted-foreground hover:text-foreground" />
                                </button>
                            </Badge>
                        );
                    })}
                    <CommandPrimitive.Input
                        ref={inputRef}
                        value={inputValue}
                        onValueChange={setInputValue}
                        onBlur={() => setOpen(false)}
                        onFocus={() => setOpen(true)}
                        placeholder={placeholder}
                        className="ml-2 flex-1 bg-transparent outline-none placeholder:text-muted-foreground"
                    />
                </div>
            </div>
            <div className="relative mt-2">
                {open && selectables.length > 0 ? (
                    <div className="absolute top-0 z-10 w-full rounded-md border bg-popover text-popover-foreground shadow-md outline-none animate-in">
                        <CommandList>
                            <CommandEmpty>No results found.</CommandEmpty>
                            <CommandGroup>
                                {selectables.map((option) => (
                                    <CommandItem
                                        key={option.value}
                                        onMouseDown={(e) => e.preventDefault()}
                                        onSelect={() => {
                                            setInputValue('');
                                            onChange([...selected, option.value]);
                                        }}
                                    >
                                        {option.label}
                                    </CommandItem>
                                ))}
                            </CommandGroup>
                        </CommandList>
                    </div>
                ) : null}
            </div>
        </Command>
    );
}
