"use client";

import {
    Table,
    TableBody,
    TableCell,
    TableHead,
    TableHeader,
    TableRow,
} from "@/components/ui/table";
import type { Creature } from "@/types";

// Define the shape of the prediction data
type Prediction = {
    pairId: string;
    pairName: string;
    maleParent: Creature;
    femaleParent: Creature;
    chancesByCategory: { [key: string]: number };
    averageChance: number;
    isPossible: boolean;
};

type PredictionsTableProps = {
    predictions: Prediction[];
    goalGenes: [string, any][]; // Used for table headers
};

export function PredictionsTable({
    predictions,
    goalGenes,
}: PredictionsTableProps) {
    const geneCategories = goalGenes.map(([category]) => category);

    return (
        <div className="rounded-lg border border-pompaca-purple/50 overflow-hidden">
            <Table className="bg-ebena-lavender">
                <TableHeader>
                    <TableRow className="hover:bg-pompaca-purple/20 border-pompaca-purple/50">
                        <TableHead className="text-pompaca-purple font-bold">
                            Male Parent
                        </TableHead>
                        <TableHead className="text-pompaca-purple font-bold">
                            Female Parent
                        </TableHead>
                        {geneCategories.map((category) => (
                            <TableHead
                                key={category}
                                className="text-pompaca-purple font-bold text-center"
                            >
                                Chance of {category}
                            </TableHead>
                        ))}
                        <TableHead className="text-pompaca-purple font-bold text-center">
                            Average Chance
                        </TableHead>
                        <TableHead className="text-pompaca-purple font-bold text-center">
                            Goal Possible?
                        </TableHead>
                        <TableHead className="text-pompaca-purple font-bold text-center">
                            Bred?
                        </TableHead>
                    </TableRow>
                </TableHeader>
                <TableBody>
                    {predictions.map((p) => (
                        <TableRow
                            key={p.pairId}
                            className="border-pompaca-purple/30"
                        >
                            <TableCell>
                                {p.maleParent.creatureName || p.maleParent.code}
                            </TableCell>
                            <TableCell>
                                {p.femaleParent.creatureName ||
                                    p.femaleParent.code}
                            </TableCell>
                            {geneCategories.map((category) => (
                                <TableCell
                                    key={category}
                                    className="text-center font-mono"
                                >
                                    {(
                                        p.chancesByCategory[category] * 100
                                    ).toFixed(2)}
                                    %
                                </TableCell>
                            ))}
                            <TableCell className="text-center font-mono font-bold">
                                {(p.averageChance * 100).toFixed(2)}%
                            </TableCell>
                            <TableCell
                                className={`text-center font-bold ${
                                    p.isPossible
                                        ? "text-green-600"
                                        : "text-red-500"
                                }`}
                            >
                                {p.isPossible ? "YES" : "NO"}
                            </TableCell>
                            <TableCell className="text-center">
                                NO {/* Placeholder */}
                            </TableCell>
                        </TableRow>
                    ))}
                </TableBody>
            </Table>
        </div>
    );
}
