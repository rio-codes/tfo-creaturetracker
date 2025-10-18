'use client';

import * as React from 'react';
import { Check, ChevronsUpDown } from 'lucide-react';

import { cn } from '@/lib/utils';
import { Button } from '@/components/ui/button';
import {
    Command,
    CommandEmpty,
    CommandGroup,
    CommandInput,
    CommandItem,
    CommandList,
} from '@/components/ui/command';
import { Popover, PopoverContent, PopoverTrigger } from '@/components/ui/popover';
import type { EnrichedCreature } from '@/types';

interface CreatureComboboxProps {
    creatures: EnrichedCreature[];
    selectedCreatureId: string | undefined;
    onSelectCreature: (creatureId: string | undefined) => void;
    placeholder: string;
    disabled?: boolean;
}

export function CreatureCombobox({
    creatures,
    selectedCreatureId,
    onSelectCreature,
    placeholder,
    disabled = false,
}: CreatureComboboxProps) {
    const [open, setOpen] = React.useState(false);

    const selectedCreature = creatures.find((c) => c?.id === selectedCreatureId);

    return (
        <Popover open={open} onOpenChange={setOpen}>
            <PopoverTrigger asChild>
                <Button
                    variant="outline"
                    role="combobox"
                    aria-expanded={open}
                    className="w-full justify-between bg-ebena-lavender dark:bg-midnight-purple hallowsnight:bg-abyss text-xs text-pompaca-purple dark:text-barely-lilac hallowsnight:text-cimo-crimson"
                    disabled={disabled}
                >
                    <span className="truncate">
                        {selectedCreature
                            ? `${selectedCreature.creatureName || 'Unnamed'} (${selectedCreature.code}) (G${selectedCreature.generation})`
                            : placeholder}
                    </span>
                    <ChevronsUpDown className="ml-2 h-4 w-4 shrink-0 opacity-50" />
                </Button>
            </PopoverTrigger>
            <PopoverContent className="w-[var(--radix-popover-trigger-width)] p-0 bg-ebena-lavender dark:bg-midnight-purple hallowsnight:bg-abyss text-xs text-pompaca-purple dark:text-barely-lilac hallowsnight:text-cimo-crimson">
                <Command>
                    <CommandInput
                        className="mb-2 bg-ebena-lavender dark:bg-midnight-purple hallowsnight:bg-abyss text-xs text-pompaca-purple dark:text-barely-lilac hallowsnight:text-cimo-crimson overflow-y-clip min-h-0"
                        placeholder="Search by name or code..."
                    />
                    <CommandList className="border-2 bg-ebena-lavender dark:bg-midnight-purple hallowsnight:bg-abyss text-xs text-pompaca-purple dark:text-barely-lilac hallowsnight:text-cimo-crimson">
                        <CommandEmpty>No creature found.</CommandEmpty>
                        <CommandGroup>
                            {creatures.map((creature) => (
                                <CommandItem
                                    className="bg-ebena-lavender dark:bg-midnight-purple hallowsnight:bg-abyss text-xs text-pompaca-purple dark:text-barely-lilac hallowsnight:text-cimo-crimson"
                                    key={creature?.id}
                                    value={`${creature!.creatureName || 'Unnamed'} ${creature!.code}`}
                                    onSelect={() => {
                                        onSelectCreature(
                                            creature?.id === selectedCreatureId
                                                ? undefined
                                                : creature?.id
                                        );
                                        setOpen(false);
                                    }}
                                >
                                    <Check
                                        className={cn(
                                            'mr-2 h-4 w-4',
                                            selectedCreatureId === creature?.id
                                                ? 'opacity-100'
                                                : 'opacity-0'
                                        )}
                                    />
                                    <span className="truncate">
                                        {creature?.creatureName || 'Unnamed'} ({creature?.code}) (G
                                        {creature?.generation})
                                    </span>
                                </CommandItem>
                            ))}
                        </CommandGroup>
                    </CommandList>
                </Command>
            </PopoverContent>
        </Popover>
    );
}
