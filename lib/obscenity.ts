import {
    RegExpMatcher,
    englishRecommendedTransformers,
    DataSet,
    englishDataset,
    pattern,
    resolveConfusablesTransformer,
    resolveLeetSpeakTransformer,
    toAsciiLowerCaseTransformer,
    collapseDuplicatesTransformer,
} from 'obscenity';
import { OBSCENITY_BLACKLIST } from '@/constants/obscenity-blacklist';

// These are the default transformers, but we're recreating them to add a custom rule.
const customBlacklistTransformers = [
    resolveConfusablesTransformer(),
    resolveLeetSpeakTransformer(),
    toAsciiLowerCaseTransformer(),
    collapseDuplicatesTransformer({
        defaultThreshold: 1,
        // The default list, with 'n' added to allow for 'nn'.
        customThresholds: new Map([
            ['b', 2],
            ['e', 2],
            ['o', 2],
            ['l', 2],
            ['s', 2],
            ['g', 2],
            ['n', 2], // Allow 'nn'
        ]),
    }),
];

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
    blacklistMatcherTransformers: customBlacklistTransformers,
    whitelistMatcherTransformers:
        englishRecommendedTransformers.whitelistMatcherTransformers,
});

export function hasObscenity(text: string | null | undefined): boolean {
    if (!text) return false;
    return obscenityMatcher.hasMatch(text);
}
