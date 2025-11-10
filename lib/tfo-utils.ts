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
    genes: { [key: string]: string },
    genderInput: 'male' | 'female' | 'F' | 'M' | 'unknown'
): string {
    const speciesCode = TFO_SPECIES_CODES[species];
    if (!speciesCode) {
        throw new Error(`Invalid or missing species code for: ${species}`);
    }

    const genderGenotype = genderInput?.toUpperCase();
    let gender = '';
    if (genderGenotype === 'F' || genderGenotype === 'FEMALE') {
        gender = 'female';
    } else if (genderGenotype === 'M' || genderGenotype === 'MALE') {
        gender = 'male';
    } else {
        gender = 'female';
    }

    const geneticsString = Object.entries(genes)
        .map(([category, genotype]) => `${category}:${genotype}`)
        .join(',');

    const baseUrl = 'https://finaloutpost.net/ln';
    const finalUrl = `${baseUrl}?s=${speciesCode}&c=${geneticsString}&g=${gender}`;

    console.log('Constructed TFO URL:', finalUrl);
    return finalUrl;
}
