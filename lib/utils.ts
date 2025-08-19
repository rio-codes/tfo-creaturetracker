import { clsx, type ClassValue } from "clsx"
import { twMerge } from "tailwind-merge"
import { speciesGenes } from "@/app/lib/creature_data";

export function cn(...inputs: ClassValue[]) {
  return twMerge(clsx(inputs))
}

export function fetchCreatures(username=string) {
  
}

