import type { EnrichedResearchGoal, Prediction } from "@/types";

type GoalPredictionSummaryProps = {
    goal: EnrichedResearchGoal;
    prediction: Prediction;
};

export const GoalPredictionSummary = ({ goal, prediction }: GoalPredictionSummaryProps) => {
    if (!goal?.genes || !prediction?.chancesByCategory) {
        return null;
    }

    const summary = Object.entries(goal.genes)
        .filter(([category, gene]) => !gene.isOptional && category !== "Gender")
        .map(([category, gene]) => {
            const chance = prediction.chancesByCategory?.[category] ?? 0;
            return `<strong>${category}:</strong> ${gene.phenotype} - ${Math.round(chance * 100)}%`;
        })
        .join(", ");

    return (
        <div
            className="text-xs text-dusk-purple/80 leading-tight"
            dangerouslySetInnerHTML={{ __html: summary }}
            title={summary.replace(/<strong>/g, "").replace(/<\/strong>/g, "")}
        />
    );
};
