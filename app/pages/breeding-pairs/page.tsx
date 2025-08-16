import { Search, Plus } from "lucide-react"
import { Input } from "@/components/ui/input"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
import { Button } from "@/components/ui/button"
import { BreedingPairCard } from "@/components/breeding-pair-card"

// Mock data for breeding pairs
const breedingPairs = [
  {
    id: 1,
    icon: "V",
    iconColor: "bg-blue-500",
    maleParent: "V5HyD (Zebra Crossing Ahead)",
    femaleParent: "KjB5A (Fiona Apple)",
    timesBred: 1,
    directProgeny: 2,
    chanceOfGoal: "False",
    averageAccuracy: "36.81%",
    totalProgeny: 2,
    maleImage: "/zebra-creature.png",
    femaleImage: "/apple-creature.png",
  },
  {
    id: 2,
    icon: "I",
    iconColor: "bg-yellow-500",
    maleParent: "V5HyD (Zebra Crossing Ahead)",
    femaleParent: "lQZ7Q (Refusing Domestication)",
    timesBred: 0,
    directProgeny: 0,
    chanceOfGoal: "False",
    averageAccuracy: "37.5%",
    totalProgeny: 0,
    maleImage: "/zebra-creature.png",
    femaleImage: "/wild-creature.png",
  },
  {
    id: 3,
    icon: "J",
    iconColor: "bg-green-500",
    maleParent: "sb39n (Irrepressible Equestrian Joy)",
    femaleParent: "OCivt (Nutmeg and Cinnamon)",
    timesBred: 0,
    directProgeny: 0,
    chanceOfGoal: "False",
    averageAccuracy: "37.5%",
    totalProgeny: 0,
    maleImage: "/joy-creature.png",
    femaleImage: "/spice-creature.png",
  },
  {
    id: 4,
    icon: "K",
    iconColor: "bg-red-500",
    maleParent: "KaThi (Hoofbeats Resonating From AFar)",
    femaleParent: "OCivt (Nutmeg and Cinnamon)",
    timesBred: 0,
    directProgeny: 0,
    chanceOfGoal: "False",
    averageAccuracy: "40.28%",
    totalProgeny: 0,
    maleImage: "/hoofbeat-creature.png",
    femaleImage: "/spice-creature.png",
  },
]

export default function BreedingPairsPage() {
  return (
    <div className="bg-purple-light min-h-screen">
      <div className="container mx-auto px-4 py-8">
        <div className="flex flex-col lg:flex-row lg:items-center lg:justify-between mb-8">
          <h1 className="text-4xl font-bold text-purple-900 mb-4 lg:mb-0">Breeding Pairs</h1>

          {/* Species Filter */}
          <div className="flex items-center gap-2">
            <span className="text-purple-900 font-medium">Species</span>
            <Select defaultValue="ebena-kuranto">
              <SelectTrigger className="w-48 bg-purple-600 text-white border-purple-600">
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="ebena-kuranto">Ebena Kuranto</SelectItem>
                <SelectItem value="sencesa">Sencesa</SelectItem>
                <SelectItem value="dompaca-flora">Dompaca Flora</SelectItem>
                <SelectItem value="all">All Species</SelectItem>
              </SelectContent>
            </Select>
          </div>
        </div>

        {/* Search Bar */}
        <div className="relative mb-8">
          <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-purple-600 h-4 w-4" />
          <Input
            placeholder="search for a creature..."
            className="pl-10 bg-purple-200 border-purple-300 text-purple-900 placeholder:text-purple-600"
          />
        </div>

        {/* Breeding Pairs List */}
        <div className="space-y-4 mb-8">
          {breedingPairs.map((pair) => (
            <BreedingPairCard key={pair.id} pair={pair} />
          ))}
        </div>

        {/* Add Breeding Pair Button */}
        <div className="flex justify-center">
          <Button className="bg-purple-700 hover:bg-purple-800 text-white text-lg px-8 py-3">
            <Plus className="h-5 w-5 mr-2" />
            Add Breeding Pair
          </Button>
        </div>
      </div>
    </div>
  )
}
