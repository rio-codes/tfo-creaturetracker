'use client';

import { useState } from 'react';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from '@/components/ui/dialog';
import { LogBreedingForm } from '@/components/log-breeding-form';
import type { SerializedCreature } from '@/types';

type BreedingPair = {
    id: string;
    species: string;
};

type LogBreedingDialogProps = {
  pair: BreedingPair;
  allCreatures: SerializedCreature[];
  children: React.ReactNode; // The trigger button
};

export function LogBreedingDialog({ pair, allCreatures, children }: LogBreedingDialogProps) {
  const [isOpen, setIsOpen] = useState(false);

  return (
    <Dialog open={isOpen} onOpenChange={setIsOpen}>
      <DialogTrigger asChild>{children}</DialogTrigger>
      <DialogContent className="bg-barely-lilac">
        <DialogHeader>
          <DialogTitle className="text-pompaca-purple">Log New Breeding Event</DialogTitle>
        </DialogHeader>
        <LogBreedingForm
          pair={pair}
          allCreatures={allCreatures}
          onSuccess={() => setIsOpen(false)}
        />
      </DialogContent>
    </Dialog>
  );
}