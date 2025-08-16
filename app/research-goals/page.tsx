import { Search, Plus } from "lucide-react"
import { Input } from "@/components/ui/input"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
import { Button } from "@/components/ui/button"
import { ResearchGoalCard } from "@/components/research-goal-card"
import { Pagination } from "@/components/pagination"

// Mock data for research goals
const researchGoals = [
  {
    id: 1,
    title: "Sencesa Simfonia Goal 001",
    species: "Sencesa Simfonia",
    gender: "Male",
    body: "Aabb - Light",
    overlay: "multiple - None",
    pattern: "AaBb - Mask",
    legs: "AaBb - Dark and Gold",
    wings: "multiple - Gold",
    shield: "aabb - Gold",
    eyes: "multiple - Dark",
    image: "/sencesa-creature.png",
  },
  {
    id: 2,
    title: "Ebena Kuranto Goal 001",
    species: "Ebena Kuranto",
    gender: "Female",
    body: "AABbCc - Purple",
    marking: "multiple - None",
    feet: "aabbCc - Four Stockings",
    pinto: "aaBbCc - Tobiano",
    leopard: "AABbCc - Varnish Roan",
    face: "multiple - None",
    mane: "AABbCc - Long White",
    horn: "multiple - None",
    image: "/ebena-creature.png",
  },
  {
    id: 3,
    title: "Dompaca Flora Goal 001",
    species: "Dompaca Flora",
    gender: "Male",
    body: "Aabb - Light",
    overlay: "multiple - None",
    pattern: "AaBb - Mask",
    legs: "AaBb - Dark and Gold",
    wings: "multiple - Gold",
    shield: "aabb - Gold",
    eyes: "multiple - Dark",
    image: "/dompaca-creature.png",
  },
  {
    id: 4,
    title: "Cielarka Cimo Goal 001",
    species: "Cielarka Cimo",
    gender: "Male",
    carapace: "AaBb - White",
    belly: "aaBb - Iridescent Blue",
    marking: "aaBb - Purple",
    wings: "aaBbCc - Procilla Beauty (purple)",
    image: "/cielarka-creature.png",
  },
  {
    id: 5,
    title: "Nokta Volko Goal 001",
    species: "Nokta Volko",
    gender: "Male",
    wings: "AaBb - Lavender Tips",
    tail: "AaBbCc - Nightfall Gladiolus",
    marking: "AaBb - Crescent Moon",
    plumage: "aaBb - Lavender Lurl",
    image: "/nokta-creature.png",
  },
  {
    id: 6,
    title: "Avka Felo Goal 001",
    species: "Avka Felo",
    gender: "Female",
    body: "AaBb - Gray",
    eyeVariationA: "AaBb - Green",
    finVariationB: "AaBb - Black",
    markingA: "Aa - Small Stripes",
    markingB: "Aa - Tuxedo",
    markingC: "AA - None",
    whisker: "AA - Long",
    image: "/avka-creature.png",
  },
]

export default function ResearchGoalsPage() {
  return (
    <div className="bg-purple-light min-h-screen">
      <div className="container mx-auto px-4 py-8">
        <div className="flex flex-col lg:flex-row lg:items-center lg:justify-between mb-8">
          <h1 className="text-4xl font-bold text-purple-900 mb-4 lg:mb-0">Research Goals</h1>

          <div className="flex flex-col sm:flex-row gap-4 lg:items-center">
            {/* Add New Goal Button */}
            <Button className="bg-purple-700 hover:bg-purple-800 text-white">
              <Plus className="h-4 w-4 mr-2" />
              Add New Goal
            </Button>

            {/* Species Filter */}
            <div className="flex items-center gap-2">
              <span className="text-purple-900 font-medium">Species</span>
              <Select defaultValue="all">
                <SelectTrigger className="w-32 bg-purple-600 text-white border-purple-600">
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="all">All</SelectItem>
                  <SelectItem value="sencesa">Sencesa</SelectItem>
                  <SelectItem value="ebena-kuranto">Ebena Kuranto</SelectItem>
                  <SelectItem value="dompaca-flora">Dompaca Flora</SelectItem>
                  <SelectItem value="cielarka-cimo">Cielarka Cimo</SelectItem>
                  <SelectItem value="nokta-volko">Nokta Volko</SelectItem>
                  <SelectItem value="avka-felo">Avka Felo</SelectItem>
                </SelectContent>
              </Select>
            </div>
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

        {/* Research Goals Grid */}
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6 mb-8">
          {researchGoals.map((goal) => (
            <ResearchGoalCard key={goal.id} goal={goal} />
          ))}
        </div>

        {/* Pagination */}
        <Pagination currentPage={1} totalPages={68} />
      </div>
    </div>
  )
}
