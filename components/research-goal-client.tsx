"use client"

import { useSearchParams, usePathname, useRouter } from 'next/navigation';
import type { Creature } from '@/types';

import { Search } from "lucide-react"
import { Input } from "@/components/ui/input"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
import { Pagination } from "@/components/pagination"
import { Button } from "@/components/ui/button"

type CollectionClientProps = {
    initialCreatures: Creature[];
    totalPages: number;
};

export function ResearchGoalClient({initialCreatures, totalPages}) {
    const searchParams = useSearchParams();
    const pathname = usePathname();
    const { replace } = useRouter();

    return (
        <div className="bg-barely-lilac min-h-screen">
            <div className="container mx-auto px-4 py-5">
                <h1 className="text-5xl font-bold text-pompaca-purple mb-8">Resarch Goals</h1>
                <Button onClick={handleOpenSyncDialog} className="text-xl mb-8 bg-emoji-eggplant text-barely-lilac drop-shadow-md drop-shadow-gray-500">
                    + Add New Research Goal
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
    
            // Search Bar
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