"use client";
import Link from "next/link";
import { useState } from "react";
import { useSession, signIn, signOut } from "next-auth/react";
import { ChevronsDown, LogIn, LogOut, Loader2 } from "lucide-react";
import { Button } from "@/components/ui/button";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";

export default function Header() {
  const [isMenuOpen, setIsMenuOpen] = useState(false);
  const { data: session, status } = useSession();

  return (
    <header className="bg-pompaca-purple dark:bg-slate-900 text-barely-lilac px-2 py-2 max-h-28">
      <div className="flex items-center justify-between">
        {/* Left side - Menu and logo */}
        <div className="flex items-center gap-2">
          <DropdownMenu open={isMenuOpen} onOpenChange={setIsMenuOpen}>
            <DropdownMenuTrigger asChild>
              <Button
                size="lg"
                className="text-barely-lilac hover:bg-transparent focus-visible:ring-0"
              >
                <ChevronsDown className="size-10" />
              </Button>
            </DropdownMenuTrigger>
            <DropdownMenuContent align="start" className="w-50 bg-barely-lilac dark:bg-slate-900">
              <DropdownMenuItem className="bg-barely-lilac dark:bg-slate-900 hover:bg-dusk-purple dark:hover:bg-slate-800 h-10" asChild>
                <Link href="/collection" className="text-lg w-full h-full">
                  🦋 Collection
                </Link>
              </DropdownMenuItem>
              <DropdownMenuItem className="bg-barely-lilac dark:bg-slate-900 hover:bg-dusk-purple dark:hover:bg-slate-800 h-10" asChild>
                <Link href="/research-goals" className="text-lg w-full h-full">
                  🧪 Research Goals
                </Link>
              </DropdownMenuItem>
              <DropdownMenuItem className="bg-barely-lilac dark:bg-slate-900 hover:bg-dusk-purple dark:hover:bg-slate-800 h-10" asChild>
                <Link href="/breeding-pairs" className="text-lg w-full h-full">
                  💜 Breeding Pairs
                </Link>
              </DropdownMenuItem>
              <DropdownMenuItem className="bg-barely-lilac dark:bg-slate-900 hover:bg-dusk-purple dark:hover:bg-slate-800 h-10" asChild>
                <Link href="/settings" className="text-lg w-full h-full">
                  🔧 Settings
                </Link>
              </DropdownMenuItem>
              {session?.user?.role === "admin" && (
                <DropdownMenuItem
                  className="bg-barely-lilac dark:bg-slate-900 hover:bg-dusk-purple dark:hover:bg-slate-800 h-10"
                  asChild
                >
                  <Link href="/admin" className="text-lg w-full h-full">🧑🏾‍💻 Admin</Link>
                </DropdownMenuItem>
              )}
            </DropdownMenuContent>
          </DropdownMenu>

          <div className="flex items-center gap-2">
            <div className="text-yellow-300 text-2xl">
              <Link href="/">🧬</Link>
            </div>
            <div>
              <h1 className="text-xl font-bold">
                <Link href="/">TFO.creaturetracker</Link>
              </h1>
              <p className="text-sm text-purple-200">
                <Link href="/">a breeding tracker for The Final Outpost</Link>
              </p>
            </div>
          </div>
        </div>

        {/* Right side - User info and actions */}
        {status === "authenticated" && (
          <div className="flex flex-col items-end py-1">
            <div className="py-1 hidden md:block">Welcome back, {session.user.username}!</div>
            <div className="py-1">
              <Button
                onClick={() => signOut({ callbackUrl: "/" })}
                variant="ghost"
                size="sm"
                className="text-pompaca-purple bg-ebena-lavender hover:bg-dusk-purple dark:bg-slate-800 dark:text-purple-300 dark:hover:bg-slate-700 shadow-xl"
              >
                Log Out
                <LogOut className="h-4 w-4 mr-2" />
              </Button>
            </div>
          </div>
        )}
        {status === "loading" && (
          <div className="flex flex-col items-end py-1">
            <Button
              variant="ghost"
              size="sm"
              disabled
              className="text-barely-lilac"
            >
              <Loader2 className="h-4 w-4 animate-spin" />
            </Button>
          </div>
        )}
        {status != "authenticated" && status != "loading" && (
          <div className="flex flex-col items-end py-1">
            <Button
              onClick={() => signIn()}
              variant="ghost"
              size="sm"
              className="text-barely-lilac hover:bg-dusk-purple"
            >
              Log In
              <LogIn className="h-4 w-4 ml-2" />
            </Button>
          </div>
        )}
      </div>
    </header>
  );
}
