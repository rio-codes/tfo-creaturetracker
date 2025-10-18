'use client';

import React from 'react';
import { Tooltip, TooltipContent, TooltipProvider, TooltipTrigger } from '@/components/ui/tooltip';
import { Dialog, DialogContent, DialogTrigger } from '@/components/ui/dialog';

type InfoDisplayProps = {
    trigger: React.ReactNode;
    content: React.ReactNode;
    tooltipClassName?: string;
    dialogClassName?: string;
};

type PointerDownOutsideEvent = CustomEvent<{ originalEvent: PointerEvent }>;

export function InfoDisplay({
    trigger,
    content,
    tooltipClassName,
    dialogClassName,
}: InfoDisplayProps) {
    return (
        <>
            {/* Desktop Tooltip: Shows on hover */}
            <div className="hidden md:inline-flex">
                <TooltipProvider>
                    <Tooltip delayDuration={100}>
                        <TooltipTrigger asChild>{trigger}</TooltipTrigger>
                        <TooltipContent
                            className={`bg-pompaca-purple dark:bg-purple-400 text-barely-lilac dark:text-slate-950 border-dusk-purple max-w-xs ${tooltipClassName}`}
                        >
                            {content}
                        </TooltipContent>
                    </Tooltip>
                </TooltipProvider>
            </div>

            {/* Mobile Dialog: Shows on tap */}
            <div className="md:hidden inline-flex">
                <Dialog>
                    <DialogTrigger asChild>{trigger}</DialogTrigger>
                    <DialogContent
                        onPointerDownOutside={(e: PointerDownOutsideEvent) => e.preventDefault()}
                        className={`bg-barely-lilac dark:bg-pompaca-purple hallowsnight:bg-ruzafolio-scarlet ${dialogClassName}`}
                    >
                        <div className="p-4 text-pompaca-purple">{content}</div>
                    </DialogContent>
                </Dialog>
            </div>
        </>
    );
}
