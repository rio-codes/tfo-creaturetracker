import 'server-only';
import { TFO_SPECIES_CODES } from '../constants/creature-data';

/**
 * Constructs a dynamic TFO image URL based on species and genes.
 * @param species The name of the species.
 * @param genes An object of selected genotypes, e.g., { Gender: 'female', Body: 'AABBcc' }
 * @returns The final, URL-encoded image URL as a string.
 */

export function constructTfoImageUrl(
    species: string,
    genes: { [key: string]: string }
): string {
    const speciesCode = TFO_SPECIES_CODES[species];
    if (!speciesCode) {
        throw new Error(`Invalid or missing species code for: ${species}`);
    }

    const genderGenotype = genes['Gender']?.toUpperCase();
    let gender = '';
    if (genderGenotype === 'F') {
        gender = 'female';
    } else if (genderGenotype === 'M') {
        gender = 'male';
    }

    const geneticsString = Object.entries(genes)
        .filter(([category]) => category !== 'Gender')
        .map(([category, genotype]) => `${category}:${genotype}`)
        .join(',');

    const baseUrl = 'https://finaloutpost.net/ln';
    const finalUrl = `${baseUrl}?s=${speciesCode}&c=${geneticsString}&g=${gender}`;

    console.log('Constructed TFO URL:', finalUrl);
    return finalUrl;
}
