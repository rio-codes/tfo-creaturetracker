import { Button } from "@/components/ui/button"
import { Card, CardContent } from "@/components/ui/card"
import { ScrollArea } from "@/components/ui/scroll-area"

interface Creature {
  id: number
  name: string
  code: string
  gender: string
  origin: string
  genotype: string
  image: string
}

interface CreatureCardProps {
  creature: Creature
}

export function CreatureCard({ creature }: CreatureCardProps) {
  return (
    <Card className="bg-card border-border overflow-hidden">
      <CardContent className="p-4">
        {/* Creature Image */}
        <div className="bg-purple-200 rounded-lg p-4 mb-4 flex justify-center">
          <img src={creature.image || "/placeholder.svg"} alt={creature.name} className="w-32 h-32 object-contain" />
        </div>

        {/* Creature Details */}
        <ScrollArea className="h-32 mb-4">
          <div className="text-sm text-card-foreground space-y-1">
            <div>
              <strong>Name:</strong> {creature.name}
            </div>
            <div>
              <strong>Code:</strong> {creature.code}
            </div>
            <div>
              <strong>Gender:</strong> {creature.gender}
            </div>
            <div>
              <strong>Origin:</strong> {creature.origin}
            </div>
            <div>
              <strong>Genotype:</strong> {creature.genotype}
            </div>
          </div>
        </ScrollArea>

        {/* Add to Breeding Pair Button */}
        <Button className="w-full bg-purple-700 hover:bg-purple-800 text-white">Add to Breeding Pair</Button>
      </CardContent>
    </Card>
  )
}
