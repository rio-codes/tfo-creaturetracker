// /home/midbar/Projects/tfo-creaturetracker/lib/hybridization-rules.ts

export type OffspringOutcome = {
    species: string;
    probability: number;
};

export type HybridizationRule = {
    outcomes: OffspringOutcome[];
};

export const hybridizationRules: Record<string, Record<string, HybridizationRule>> = {
    'Tagluma Valso': {
        'Nokta Voko': { outcomes: [{ species: 'Koro Voko', probability: 1 }] },
        'Koro Voko': {
            outcomes: [
                { species: 'Tagluma Valso', probability: 0.5 },
                { species: 'Koro Voko', probability: 0.5 },
            ],
        },
    },
    'Nokta Voko': {
        'Tagluma Valso': { outcomes: [{ species: 'Koro Voko', probability: 1 }] },
        'Koro Voko': { outcomes: [{ species: 'Koro Voko', probability: 1 }] },
    },
    'Koro Voko': {
        'Tagluma Valso': {
            outcomes: [
                { species: 'Tagluma Valso', probability: 0.5 },
                { species: 'Koro Voko', probability: 0.5 },
            ],
        },
        'Nokta Voko': { outcomes: [{ species: 'Koro Voko', probability: 1 }] },
    },
    'Tera Girafo': {
        'Kosmira Girafo': {
            outcomes: [
                { species: 'Tera Girafo', probability: 0.5 },
                { species: 'Kosmira Girafo', probability: 0.5 },
            ],
        },
    },
    'Kosmira Girafo': {
        'Tera Girafo': {
            outcomes: [
                { species: 'Tera Girafo', probability: 0.5 },
                { species: 'Kosmira Girafo', probability: 0.5 },
            ],
        },
    },
    'Glacia Alsalto': {
        'Klara Alsalto': { outcomes: [{ species: 'Transira Alsalto', probability: 1 }] },
        'Silenta Spuristo': {
            outcomes: [
                { species: 'Glacia Alsalto', probability: 0.5 },
                { species: 'Silenta Spuristo', probability: 0.5 },
            ],
        },
        'Transira Alsalto': { outcomes: [{ species: 'Transira Alsalto', probability: 1 }] },
    },
    'Klara Alsalto': {
        'Glacia Alsalto': { outcomes: [{ species: 'Transira Alsalto', probability: 1 }] },
        'Silenta Spuristo': {
            outcomes: [
                { species: 'Klara Alsalto', probability: 0.5 },
                { species: 'Silenta Spuristo', probability: 0.5 },
            ],
        },
        'Transira Alsalto': { outcomes: [{ species: 'Transira Alsalto', probability: 1 }] },
    },
    'Silenta Spuristo': {
        'Klara Alsalto': {
            outcomes: [
                { species: 'Klara Alsalto', probability: 0.5 },
                { species: 'Silenta Spuristo', probability: 0.5 },
            ],
        },
        'Glacia Alsalto': {
            outcomes: [
                { species: 'Glacia Alsalto', probability: 0.5 },
                { species: 'Silenta Spuristo', probability: 0.5 },
            ],
        },
        'Transira Alsalto': {
            outcomes: [
                { species: 'Transira Alsalto', probability: 0.5 },
                { species: 'Silenta Spuristo', probability: 0.5 },
            ],
        },
    },
    'Transira Alsalto': {
        'Klara Alsalto': { outcomes: [{ species: 'Transira Alsalto', probability: 1 }] },
        'Glacia Alsalto': { outcomes: [{ species: 'Transira Alsalto', probability: 1 }] },
        'Silenta Spuristo': {
            outcomes: [
                { species: 'Transira Alsalto', probability: 0.5 },
                { species: 'Silenta Spuristo', probability: 0.5 },
            ],
        },
    },
    'Ranbleko': {
        Glubleko: {
            outcomes: [
                { species: 'Ranbleko', probability: 0.333 },
                { species: 'Glubleko', probability: 0.333 },
                { species: 'Tonbleko', probability: 0.334 },
            ],
        },
        Tonbleko: {
            outcomes: [
                { species: 'Ranbleko', probability: 0.5 },
                { species: 'Tonbleko', probability: 0.5 },
            ],
        },
    },
    'Glubleko': {
        Ranbleko: {
            outcomes: [
                { species: 'Ranbleko', probability: 0.333 },
                { species: 'Glubleko', probability: 0.333 },
                { species: 'Tonbleko', probability: 0.334 },
            ],
        },
        Tonbleko: {
            outcomes: [
                { species: 'Glubleko', probability: 0.5 },
                { species: 'Tonbleko', probability: 0.5 },
            ],
        },
    },
    'Tonbleko': {
        Ranbleko: {
            outcomes: [
                { species: 'Ranbleko', probability: 0.5 },
                { species: 'Tonbleko', probability: 0.5 },
            ],
        },
        Glubleko: {
            outcomes: [
                { species: 'Glubleko', probability: 0.5 },
                { species: 'Tonbleko', probability: 0.5 },
            ],
        },
    },
    'Osta Frakaso': {
        'Rida Frakaso': { outcomes: [{ species: 'Rida Frakaso', probability: 1 }] },
    },
    'Rida Frakaso': {
        'Osta Frakaso': { outcomes: [{ species: 'Rida Frakaso', probability: 1 }] },
    },
};
