"use client"
import { useState } from "react"
import { Button } from "@/components/ui/button"
import { Card, CardContent } from "@/components/ui/card"
import { ScrollArea } from "@/components/ui/scroll-area"
import type { Creature } from "@/types/index"
import { AddBreedingPairDialog } from "@/components/add-pair-dialog"

interface CreatureCardProps {
  creature: Creature
  allCreaturesData: Creature[]
}

export function CreatureCard({ creature, allCreaturesData }: CreatureCardProps) {
  const [isDialogOpen, setIsDialogOpen] = useState(false);
  const [selectedCreature, setSelectedCreature] = useState(null);

  const handleOpenDialog = (creature) => {
    setSelectedCreature(creature);
    setIsDialogOpen(true);
  };

  const handleCloseDialog = () => {
    setIsDialogOpen(false);
    setSelectedCreature(null);
  };

  return (
    <Card className="bg-ebena-lavender text-pompaca-purple border-border overflow-hidden">
      <CardContent className="p-4">
        {/* Creature Image */}
        <div className="bg- rounded-lg p-4 mb-4 flex justify-center">
          <img src={creature.imageUrl || "/placeholder.png"} alt={creature.code + ", " + creature.species} className="w-32 h-32 object-contain" />
        </div>

        {/* Creature Details */}
        <ScrollArea className="h-32 mb-4">
          <div className="text-sm text-card-foreground space-y-1">
            <div>
              <strong>Name:</strong> {creature.creatureName}
            </div>
            <div>
              <strong>Code:</strong> {creature.code}
            </div>
            <div>
              <strong>Gender:</strong> {creature.gender}
            </div>
            <div>
              <strong>Genotype:</strong> {creature.genetics}
            </div>
          </div>
        </ScrollArea>

        {/* Add to Breeding Pair Button */}
        <Button onClick={() => handleOpenDialog(allCreaturesData[0])} className="w-full bg-emoji-eggplant hover:bg-dusk-purple text-barely-lilac">Add to Breeding Pair</Button>

        <AddBreedingPairDialog
          isOpen={isDialogOpen}
          onClose={handleCloseDialog}
          baseCreature={selectedCreature}
          allCreatures={allCreaturesData}
        />
      </CardContent>
    </Card>
  )
}
