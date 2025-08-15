import { Button } from "@/components/ui/button"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table"
import { ScrollArea } from "@/components/ui/scroll-area"
import { Plus } from "lucide-react"

// Mock data for a specific research goal
const researchGoalData = {
  id: "001",
  title: "Goal: Sencesa Simfonia - 001",
  genotype: {
    gender: "Male",
    body: "AaBb - Light",
    overlay: "multiple - None",
    pattern: "AaBb - Mask",
    legs: "AaBb - Dark and Gold",
    wings: "multiple - Gold",
    shield: "aabb - Gold",
    eyes: "multiple - Dark",
    horn: "AaBb - Clef",
  },
  image: "/sencesa-detail-creature.png",
  breedingPairs: [
    {
      id: 1,
      male: "WcxHt (The Music of the Spheres)",
      female: "mGKez (The Orchestra Tunes Their Instruments)",
      chanceOfGoal: "yes",
      timesBred: 2,
      offspringProduced: 4,
    },
    {
      id: 2,
      male: "XtpXn (Where Did the Conductor Go?)",
      female: "MWsn (An Embarrassment of Riches)",
    },
    {
      id: 3,
      male: "XtpXn (Where Did the Conductor Go?)",
      female: "KSjGU (BUGLV)",
    },
  ],
  breedingStats: [
    {
      maleParent: "DvMl",
      femaleParent: "mGKez",
      chanceCorrectBody: "0%",
      chanceCorrectOverlay: "100%",
      chanceCorrectPattern: "50%",
      chanceCorrectLegs: "25%",
      chanceCorrectWings: "25%",
      chanceCorrectShield: "12.5%",
      chanceCorrectEyes: "25%",
      chanceCorrectHorn: "25%",
      averageHybridAccuracy: "32.81%",
      anyChanceOfGoal: "NO",
      bred: "NO",
    },
    {
      maleParent: "WcxHt",
      femaleParent: "mGKez",
      chanceCorrectBody: "25%",
      chanceCorrectOverlay: "100%",
      chanceCorrectPattern: "25%",
      chanceCorrectLegs: "50%",
      chanceCorrectWings: "18.75%",
      chanceCorrectShield: "0%",
      chanceCorrectEyes: "25%",
      chanceCorrectHorn: "25%",
      averageHybridAccuracy: "37.5%",
      anyChanceOfGoal: "YES",
      bred: "YES",
    },
    {
      maleParent: "DvMl",
      femaleParent: "MWsn",
      chanceCorrectBody: "0%",
      chanceCorrectOverlay: "100%",
      chanceCorrectPattern: "50%",
      chanceCorrectLegs: "0%",
      chanceCorrectWings: "25%",
      chanceCorrectShield: "12.5%",
      chanceCorrectEyes: "0%",
      chanceCorrectHorn: "25%",
      averageHybridAccuracy: "26.56%",
      anyChanceOfGoal: "NO",
      bred: "NO",
    },
    {
      maleParent: "WcxHt",
      femaleParent: "MWsn",
      chanceCorrectBody: "0%",
      chanceCorrectOverlay: "100%",
      chanceCorrectPattern: "25%",
      chanceCorrectLegs: "25%",
      chanceCorrectWings: "25%",
      chanceCorrectShield: "0%",
      chanceCorrectEyes: "50%",
      chanceCorrectHorn: "25%",
      averageHybridAccuracy: "31.25%",
      anyChanceOfGoal: "NO",
      bred: "NO",
    },
    {
      maleParent: "vslsT",
      femaleParent: "mGKez",
      chanceCorrectBody: "0%",
      chanceCorrectOverlay: "100%",
      chanceCorrectPattern: "50%",
      chanceCorrectLegs: "50%",
      chanceCorrectWings: "18.75%",
      chanceCorrectShield: "6.25%",
      chanceCorrectEyes: "37.5%",
      chanceCorrectHorn: "25%",
      averageHybridAccuracy: "35.94%",
      anyChanceOfGoal: "NO",
      bred: "NO",
    },
    {
      maleParent: "vslsT",
      femaleParent: "MWsn",
      chanceCorrectBody: "0%",
      chanceCorrectOverlay: "87.5%",
      chanceCorrectPattern: "50%",
      chanceCorrectLegs: "50%",
      chanceCorrectWings: "9.38%",
      chanceCorrectShield: "6.25%",
      chanceCorrectEyes: "50%",
      chanceCorrectHorn: "0%",
      averageHybridAccuracy: "28.52%",
      anyChanceOfGoal: "NO",
      bred: "NO",
    },
    {
      maleParent: "XtpXn",
      femaleParent: "mGKez",
      chanceCorrectBody: "0%",
      chanceCorrectOverlay: "100%",
      chanceCorrectPattern: "0%",
      chanceCorrectLegs: "0%",
      chanceCorrectWings: "25%",
      chanceCorrectShield: "6.25%",
      chanceCorrectEyes: "50%",
      chanceCorrectHorn: "25%",
      averageHybridAccuracy: "25.78%",
      anyChanceOfGoal: "NO",
      bred: "NO",
    },
    {
      maleParent: "XtpXn",
      femaleParent: "MWsn",
      chanceCorrectBody: "0%",
      chanceCorrectOverlay: "100%",
      chanceCorrectPattern: "50%",
      chanceCorrectLegs: "50%",
      chanceCorrectWings: "25%",
      chanceCorrectShield: "6.25%",
      chanceCorrectEyes: "100%",
      chanceCorrectHorn: "50%",
      averageHybridAccuracy: "47.66%",
      anyChanceOfGoal: "NO",
      bred: "QUEUED",
    },
    {
      maleParent: "WcxHt",
      femaleParent: "BnLlV",
      chanceCorrectBody: "25%",
      chanceCorrectOverlay: "100%",
      chanceCorrectPattern: "25%",
      chanceCorrectLegs: "25%",
      chanceCorrectWings: "25%",
      chanceCorrectShield: "0%",
      chanceCorrectEyes: "75%",
      chanceCorrectHorn: "25%",
      averageHybridAccuracy: "37.5%",
      anyChanceOfGoal: "NO",
      bred: "NO",
    },
  ],
}

interface PageProps {
  params: Promise<{ id: string }>
}

export default async function ResearchGoalDetailPage({ params }: PageProps) {
  const { id } = await params

  return (
    <div className="bg-purple-light min-h-screen">
      <div className="container mx-auto px-4 py-8">
        <h1 className="text-4xl font-bold text-purple-900 mb-8">{researchGoalData.title}</h1>

        {/* Top Section - Genotype/Phenotype and Breeding Pairs */}
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-6 mb-8">
          {/* Genotype and Phenotype */}
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            {/* Genotype */}
            <Card className="bg-purple-card border-purple-400">
              <CardHeader>
                <CardTitle className="text-purple-900">Genotype</CardTitle>
              </CardHeader>
              <CardContent className="space-y-2 text-sm">
                {Object.entries(researchGoalData.genotype).map(([key, value]) => (
                  <div key={key} className="text-purple-900">
                    <strong>{key.charAt(0).toUpperCase() + key.slice(1)}:</strong> {value}
                  </div>
                ))}
              </CardContent>
            </Card>

            {/* Phenotype */}
            <Card className="bg-purple-card border-purple-400">
              <CardHeader>
                <CardTitle className="text-purple-900">Phenotype</CardTitle>
              </CardHeader>
              <CardContent className="flex justify-center">
                <img
                  src={researchGoalData.image || "/placeholder.svg"}
                  alt="Research Goal Creature"
                  className="w-32 h-32 object-contain"
                />
              </CardContent>
            </Card>
          </div>

          {/* Breeding Pairs */}
          <Card className="bg-purple-card border-purple-400">
            <CardHeader className="flex flex-row items-center justify-between">
              <CardTitle className="text-purple-900">Breeding Pairs</CardTitle>
              <Button size="sm" className="bg-purple-700 hover:bg-purple-800 text-white">
                <Plus className="h-4 w-4 mr-1" />
                Add Breeding Pair
              </Button>
            </CardHeader>
            <CardContent className="space-y-4">
              {researchGoalData.breedingPairs.map((pair) => (
                <div key={pair.id} className="space-y-2">
                  <div className="text-sm text-purple-900">
                    <div>
                      <strong>WcxHt (The Music of the Spheres)</strong> x{" "}
                      <strong>mGKez (The Orchestra Tunes Their Instruments)</strong>
                    </div>
                    <div className="text-xs mt-1">
                      {pair.chanceOfGoal && <span>Chance of Goal? {pair.chanceOfGoal}</span>}
                      {pair.timesBred && <span className="ml-4">Number of Times Bred? {pair.timesBred}</span>}
                      {pair.offspringProduced && (
                        <span className="ml-4">Offspring Produced? {pair.offspringProduced}</span>
                      )}
                    </div>
                  </div>
                  <Button size="sm" className="bg-purple-700 hover:bg-purple-800 text-white">
                    Log Breeding
                  </Button>
                </div>
              ))}

              <div className="space-y-2">
                <div className="text-sm text-purple-900">
                  <strong>XtpXn (Where Did the Conductor Go?)</strong> x{" "}
                  <strong>MWsn (An Embarrassment of Riches)</strong>
                </div>
              </div>

              <div className="space-y-2">
                <div className="text-sm text-purple-900">
                  <strong>XtpXn (Where Did the Conductor Go?)</strong> x <strong>KSjGU (BUGLV)</strong>
                </div>
              </div>
            </CardContent>
          </Card>
        </div>

        {/* Breeding Statistics Table */}
        <Card className="bg-purple-card border-purple-400">
          <CardHeader>
            <CardTitle className="text-purple-900">Breeding Statistics</CardTitle>
          </CardHeader>
          <CardContent>
            <ScrollArea className="w-full">
              <Table>
                <TableHeader>
                  <TableRow className="bg-purple-600 hover:bg-purple-600">
                    <TableHead className="text-white font-bold">Male Parent</TableHead>
                    <TableHead className="text-white font-bold">Female Parent</TableHead>
                    <TableHead className="text-white font-bold text-center">Chance of Correct Body</TableHead>
                    <TableHead className="text-white font-bold text-center">Chance of Correct Overlay</TableHead>
                    <TableHead className="text-white font-bold text-center">Chance of Correct Pattern</TableHead>
                    <TableHead className="text-white font-bold text-center">Chance of Correct Legs</TableHead>
                    <TableHead className="text-white font-bold text-center">Chance of Correct Wings</TableHead>
                    <TableHead className="text-white font-bold text-center">Chance of Correct Shield</TableHead>
                    <TableHead className="text-white font-bold text-center">Chance of Correct Eyes</TableHead>
                    <TableHead className="text-white font-bold text-center">Chance of Correct Horn</TableHead>
                    <TableHead className="text-white font-bold text-center">Average Hybrid Accuracy</TableHead>
                    <TableHead className="text-white font-bold text-center">Any Chance of Goal?</TableHead>
                    <TableHead className="text-white font-bold text-center">Bred?</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {researchGoalData.breedingStats.map((stat, index) => (
                    <TableRow key={index} className="hover:bg-purple-300">
                      <TableCell className="font-medium text-purple-900">{stat.maleParent}</TableCell>
                      <TableCell className="font-medium text-purple-900">{stat.femaleParent}</TableCell>
                      <TableCell className="text-center text-purple-900">{stat.chanceCorrectBody}</TableCell>
                      <TableCell className="text-center text-purple-900">{stat.chanceCorrectOverlay}</TableCell>
                      <TableCell className="text-center text-purple-900">{stat.chanceCorrectPattern}</TableCell>
                      <TableCell className="text-center text-purple-900">{stat.chanceCorrectLegs}</TableCell>
                      <TableCell className="text-center text-purple-900">{stat.chanceCorrectWings}</TableCell>
                      <TableCell className="text-center text-purple-900">{stat.chanceCorrectShield}</TableCell>
                      <TableCell className="text-center text-purple-900">{stat.chanceCorrectEyes}</TableCell>
                      <TableCell className="text-center text-purple-900">{stat.chanceCorrectHorn}</TableCell>
                      <TableCell className="text-center text-purple-900">{stat.averageHybridAccuracy}</TableCell>
                      <TableCell className="text-center font-bold text-purple-900">{stat.anyChanceOfGoal}</TableCell>
                      <TableCell className="text-center font-bold text-purple-900">{stat.bred}</TableCell>
                    </TableRow>
                  ))}
                </TableBody>
              </Table>
            </ScrollArea>
          </CardContent>
        </Card>
      </div>
    </div>
  )
}
