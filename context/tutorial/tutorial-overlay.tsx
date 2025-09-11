'use client';

import { useTutorial } from '@/context/tutorial-context';
import { TutorialMessageBox } from './tutorial-message-box';

// Define your tutorial steps here
// You can expand this with more properties, like `highlightElement` to point to specific UI parts.
const tutorialSteps = [
    {
        character: { name: 'Lyri', avatarUrl: '/avatars/lyri.png' }, // Placeholder avatar
        message: (
            <p>
                Hey there! Welcome to the TFO Creature Tracker. I'm Lyri, and
                I'll show you around. Ready to get started?
            </p>
        ),
    },
    {
        character: { name: 'Lyri', avatarUrl: '/avatars/lyri.png' },
        message: (
            <p>
                First, let's get your creatures from TFO. Head over to your{' '}
                <strong>Collection</strong> page and click the{' '}
                <strong>+ Add Creatures</strong> button.
            </p>
        ),
        taskStep: 1, // This step requires an action to complete
    },
    {
        character: { name: 'Lyri', avatarUrl: '/avatars/lyri.png' },
        message: (
            <p>
                Great! Now that you have some creatures, let's create a{' '}
                <strong>Breeding Pair</strong>. You can do this from the{' '}
                <strong>Breeding Pairs</strong> page or directly from a
                creature's card in your collection.
            </p>
        ),
        taskStep: 2,
    },
    // ... more steps
];

export function TutorialOverlay() {
    const { isTutorialActive, currentStep, skipTutorial, goToStep } =
        useTutorial();

    if (!isTutorialActive) {
        return null;
    }

    const stepConfig = tutorialSteps[currentStep];

    if (!stepConfig) {
        // Tutorial is over, or invalid step.
        // We can automatically call skipTutorial to mark it as complete.
        skipTutorial();
        return null;
    }

    const handleNext = () => {
        // This is for simple "next" clicks on messages that don't have a task
        goToStep(currentStep + 1);
    };

    return (
        <TutorialMessageBox
            character={stepConfig.character}
            message={stepConfig.message}
            onNext={handleNext}
            onSkip={skipTutorial}
            isLastStep={currentStep === tutorialSteps.length - 1}
            hasNextAction={!stepConfig.taskStep} // Hide "Next" button if a task is required
        />
    );
}
