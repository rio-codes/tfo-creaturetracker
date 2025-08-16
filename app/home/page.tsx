import { Search } from "lucide-react"
import { Input } from "@/components/ui/input"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
import { Checkbox } from "@/components/ui/checkbox"
import { CreatureCard } from "@/components/creature-card"
import { Pagination } from "@/components/pagination"

// Mock data for creatures
const creatures = [
  {
    id: 1,
    name: "Let Us Prey",
    code: "PlvZF",
    gender: "Male",
    origin: "Genome Splicer",
    genotype: "Body:AaBb, Belly:aaBb, Stripes:Aa, Iridescence:AaBb, Spots:AaBb, Eyes:aa",
    image: "/purple-green-creature.png",
  },
  {
    id: 2,
    name: "One Small Step for a Mantis",
    code: "vWZQq",
    gender: "Female",
    origin: "G2 (view pedigree)",
    genotype: "Body:AaBb, Belly:aaBb, Stripes:aa, Iridescence:Aabb, Spots:AaBb, Eyes:Aa",
    image: "/yellow-purple-mantis.png",
  },
  {
    id: 3,
    name: "Ziggy Stardust",
    code: "7TGGV",
    gender: "Female",
    origin: "Cupboard",
    genotype: "Body:Aabb, Belly:aaBb, Stripes:Aa, Iridescence:Aabb, Spots:Aabb, Eyes:AA",
    image: "/pink-purple-creature.png",
  },
  {
    id: 4,
    name: "The Mayfly's Demise",
    code: "BwLa",
    gender: "Female",
    origin: "G3 (view pedigree)",
    genotype: "Body:aabb, Belly:aaBb, Stripes:aa, Iridescence:aabb, Spots:AaBb, Eyes:AA",
    image: "/dark-purple-creature.png",
  },
  {
    id: 5,
    name: "Simulation Swarm",
    code: "2uA3D",
    gender: "Female",
    origin: "G3 (view pedigree)",
    genotype: "Body:aabb, Belly:aaBb, Stripes:aa, Iridescence:aabb, Spots:AaBb, Eyes:AA",
    image: "/green-yellow-creature.png",
  },
  {
    id: 6,
    name: "Unnamed",
    code: "hvyM5",
    gender: "Male",
    origin: "Genome Splicer",
    genotype: "Body:AaBb, Belly:AaBb, Stripes:AA, Iridescence:aabb, Spots:Aabb, Eyes:Aa",
    image: "/brown-creature.png",
  },
]

export default function HomePage() {
  return (
    <div className="bg-purple-light min-h-screen">
      <div className="container mx-auto px-4 py-8">
        <h1 className="text-4xl font-bold text-purple-900 mb-8">Collection</h1>

        {/* Search and Filters */}
        <div className="flex flex-col lg:flex-row gap-4 mb-8">
          {/* Search Bar */}
          <div className="relative flex-1">
            <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-purple-600 h-4 w-4" />
            <Input
              placeholder="search for a creature..."
              className="pl-10 bg-purple-200 border-purple-300 text-purple-900 placeholder:text-purple-600"
            />
          </div>

          {/* Gender Filters */}
          <div className="flex items-center gap-4">
            <div className="flex items-center space-x-2">
              <Checkbox id="female" defaultChecked className="border-purple-600" />
              <label htmlFor="female" className="text-purple-900 font-medium">
                Female
              </label>
            </div>
            <div className="flex items-center space-x-2">
              <Checkbox id="male" defaultChecked className="border-purple-600" />
              <label htmlFor="male" className="text-purple-900 font-medium">
                Male
              </label>
            </div>
          </div>

          {/* Stage Filter */}
          <Select defaultValue="adult">
            <SelectTrigger className="w-32 bg-purple-600 text-white border-purple-600">
              <SelectValue />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="adult">Adult</SelectItem>
              <SelectItem value="juvenile">Juvenile</SelectItem>
              <SelectItem value="baby">Baby</SelectItem>
            </SelectContent>
          </Select>

          {/* Species Filter */}
          <Select defaultValue="dompaca-flora">
            <SelectTrigger className="w-48 bg-purple-600 text-white border-purple-600">
              <SelectValue />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="dompaca-flora">Dompaca Flora</SelectItem>
              <SelectItem value="sencesa">Sencesa</SelectItem>
              <SelectItem value="ebena-kuranto">Ebena Kuranto</SelectItem>
            </SelectContent>
          </Select>
        </div>

        {/* Creature Grid */}
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6 mb-8">
          {creatures.map((creature) => (
            <CreatureCard key={creature.id} creature={creature} />
          ))}
        </div>

        {/* Pagination */}
        <Pagination currentPage={1} totalPages={68} />
      </div>
    </div>
  )
}
