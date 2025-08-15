"use client"

import { useState } from "react"
import { Menu, Settings, LogOut } from "lucide-react"
import { Button } from "@/components/ui/button"
import { DropdownMenu, DropdownMenuContent, DropdownMenuItem, DropdownMenuTrigger } from "@/components/ui/dropdown-menu"

export function Header() {
  const [isMenuOpen, setIsMenuOpen] = useState(false)

  return (
    <header className="bg-purple-800 text-white px-4 py-3">
      <div className="flex items-center justify-between">
        {/* Left side - Hamburger menu and logo */}
        <div className="flex items-center gap-4">
          <DropdownMenu open={isMenuOpen} onOpenChange={setIsMenuOpen}>
            <DropdownMenuTrigger asChild>
              <Button variant="ghost" size="sm" className="text-white hover:bg-purple-700">
                <Menu className="h-5 w-5" />
              </Button>
            </DropdownMenuTrigger>
            <DropdownMenuContent align="start" className="w-48">
              <DropdownMenuItem>
                <a href="/collection" className="w-full">
                  Collection
                </a>
              </DropdownMenuItem>
              <DropdownMenuItem>
                <a href="/research-goals" className="w-full">
                  Research Goals
                </a>
              </DropdownMenuItem>
              <DropdownMenuItem>
                <a href="/breeding-pairs" className="w-full">
                  Breeding Pairs
                </a>
              </DropdownMenuItem>
            </DropdownMenuContent>
          </DropdownMenu>

          <div className="flex items-center gap-2">
            <div className="text-yellow-300 text-xl">🧬</div>
            <div>
              <h1 className="text-xl font-bold">TFO.creaturetracker</h1>
              <p className="text-sm text-purple-200">a breeding tracker for The Final Oupost</p>
            </div>
          </div>
        </div>

        {/* Right side - User info and actions */}
        <div className="flex items-center gap-4">
          <Button variant="ghost" size="sm" className="text-white hover:bg-purple-700">
            <Settings className="h-4 w-4 mr-2" />
            Settings
          </Button>
          <Button variant="ghost" size="sm" className="text-white hover:bg-purple-700">
            <LogOut className="h-4 w-4 mr-2" />
            Log Out
          </Button>
          <span className="text-sm">Welcome, ttukcejtb!</span>
        </div>
      </div>
    </header>
  )
}
