import { Button } from "@/components/ui/button"
import { Card, CardContent } from "@/components/ui/card"

interface BreedingPair {
  id: number
  icon: string
  iconColor: string
  maleParent: string
  femaleParent: string
  timesBred: number
  directProgeny: number
  chanceOfGoal: string
  averageAccuracy: string
  totalProgeny: number
  maleImage: string
  femaleImage: string
}

interface BreedingPairCardProps {
  pair: BreedingPair
}

export function BreedingPairCard({ pair }: BreedingPairCardProps) {
  return (
    <Card className="bg-card border-border">
      <CardContent className="p-6">
        <div className="flex items-center gap-6">
          {/* Icon */}
          <div
            className={`${pair.iconColor} text-white rounded-full w-12 h-12 flex items-center justify-center font-bold text-xl`}
          >
            {pair.icon}
          </div>

          {/* Breeding Information */}
          <div className="flex-1 space-y-2">
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4 text-sm text-card-foreground">
              <div>
                <strong>Male Parent:</strong> {pair.maleParent}
              </div>
              <div>
                <strong>Chance of meeting goal in 1 gen:</strong> {pair.chanceOfGoal}
              </div>
              <div>
                <strong>Female Parent:</strong> {pair.femaleParent}
              </div>
              <div>
                <strong>Average hybrid accuracy:</strong> {pair.averageAccuracy}
              </div>
              <div>
                <strong>Number of times Bred:</strong> {pair.timesBred}
              </div>
              <div>
                <strong>Total Number of Progeny:</strong> {pair.totalProgeny}
              </div>
              <div>
                <strong>Number of Direct Progeny:</strong> {pair.directProgeny}
              </div>
            </div>
          </div>

          {/* Creature Images */}
          <div className="flex gap-2">
            <img src={pair.maleImage || "/placeholder.svg"} alt="Male parent" className="w-16 h-16 object-contain" />
            <img
              src={pair.femaleImage || "/placeholder.svg"}
              alt="Female parent"
              className="w-16 h-16 object-contain"
            />
          </div>

          {/* Log Breeding Button */}
          <Button className="bg-purple-700 hover:bg-purple-800 text-white">Log Breeding</Button>
        </div>
      </CardContent>
    </Card>
  )
}
