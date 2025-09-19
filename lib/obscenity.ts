import {
    RegExpMatcher,
    englishRecommendedTransformers,
    DataSet,
    englishDataset,
    pattern,
} from 'obscenity';
import { OBSCENITY_BLACKLIST } from '@/constants/obscenity-blacklist';

const customDataSet = new DataSet<{
    originalWord: string;
}>().addAll(englishDataset);

OBSCENITY_BLACKLIST.forEach((word) =>
    customDataSet.addPhrase((phrase) =>
        phrase.setMetadata({ originalWord: word }).addPattern(pattern`${word}`)
    )
);

const obscenityMatcher = new RegExpMatcher({
    ...customDataSet.build(),
    ...englishRecommendedTransformers,
});

export function hasObscenity(text: string | null | undefined): boolean {
    if (!text) return false;

    if (obscenityMatcher.hasMatch(text)) {
        return true;
    }

    const cleanedText = text
        .split(/\s+/)
        .map((word) => word.replace(/[^a-zA-Z0-9]/g, ''))
        .join(' ');

    if (text === cleanedText) return false;

    return obscenityMatcher.hasMatch(cleanedText);
}
