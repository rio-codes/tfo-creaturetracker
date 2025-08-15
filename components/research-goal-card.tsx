import { Button } from "@/components/ui/button"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { ScrollArea } from "@/components/ui/scroll-area"

interface ResearchGoal {
  id: number
  title: string
  species: string
  gender: string
  image: string
  [key: string]: any // For dynamic genetic traits
}

interface ResearchGoalCardProps {
  goal: ResearchGoal
}

export function ResearchGoalCard({ goal }: ResearchGoalCardProps) {
  // Extract genetic traits (excluding id, title, species, gender, image)
  const geneticTraits = Object.entries(goal).filter(
    ([key]) => !["id", "title", "species", "gender", "image"].includes(key),
  )

  return (
    <Card className="bg-card border-border overflow-hidden">
      <CardHeader className="pb-2">
        <CardTitle className="text-lg font-bold text-card-foreground">{goal.title}</CardTitle>
      </CardHeader>
      <CardContent className="p-4 pt-0">
        {/* Creature Image */}
        <div className="bg-purple-200 rounded-lg p-4 mb-4 flex justify-center">
          <img src={goal.image || "/placeholder.svg"} alt={goal.title} className="w-32 h-32 object-contain" />
        </div>

        {/* Genetic Details */}
        <ScrollArea className="h-32 mb-4">
          <div className="text-sm text-card-foreground space-y-1">
            <div>
              <strong>Species:</strong> {goal.species}
            </div>
            <div>
              <strong>Gender:</strong> {goal.gender}
            </div>
            {geneticTraits.map(([key, value]) => (
              <div key={key}>
                <strong>{key.charAt(0).toUpperCase() + key.slice(1)}:</strong> {value}
              </div>
            ))}
          </div>
        </ScrollArea>

        {/* View Goal Stats Button */}
        <Button className="w-full bg-purple-700 hover:bg-purple-800 text-white">View Goal Stats</Button>
      </CardContent>
    </Card>
  )
}
