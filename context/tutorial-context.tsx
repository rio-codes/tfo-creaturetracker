'use client';

import {
    createContext,
    useContext,
    useState,
    useEffect,
    useCallback,
} from 'react';
import { useSession } from 'next-auth/react';

// NOTE: You would need to implement this server action to persist the step in your database.
// import { updateUserTutorialStep } from '@/app/actions/user-actions';

type TutorialContextType = {
    isTutorialActive: boolean;
    currentStep: number;
    startTutorial: () => void;
    skipTutorial: () => Promise<void>;
    completeStep: (step: number) => Promise<void>;
    goToStep: (step: number) => void;
};

const TutorialContext = createContext<TutorialContextType | undefined>(
    undefined
);

export function TutorialProvider({ children }: { children: React.ReactNode }) {
    const { data: session, status, update } = useSession();
    const [isTutorialActive, setIsTutorialActive] = useState(false);
    const [currentStep, setCurrentStep] = useState(0);

    useEffect(() => {
        if (status === 'authenticated' && session?.user) {
            // Assuming you add `tutorialProgress` to your session user type
            const tutorialProgress =
                (session.user as any).tutorialProgress ?? 0;
            // -1 means skipped or completed
            if (tutorialProgress !== -1) {
                setIsTutorialActive(true);
                setCurrentStep(tutorialProgress);
            }
        }
    }, [session, status]);

    const startTutorial = useCallback(async () => {
        setIsTutorialActive(true);
        setCurrentStep(0);
        // await updateUserTutorialStep(0); // Update DB
        await update({ tutorialProgress: 0 }); // Update session
    }, [update]);

    const skipTutorial = useCallback(async () => {
        setIsTutorialActive(false);
        // await updateUserTutorialStep(-1); // Update DB
        await update({ tutorialProgress: -1 }); // Update session
    }, [update]);

    const completeStep = useCallback(
        async (step: number) => {
            if (isTutorialActive && step === currentStep) {
                const nextStep = step + 1;
                setCurrentStep(nextStep);
                // await updateUserTutorialStep(nextStep); // Update DB
                await update({ tutorialProgress: nextStep });
            }
        },
        [currentStep, update, isTutorialActive]
    );

    const goToStep = (step: number) => {
        if (isTutorialActive) {
            setCurrentStep(step);
        }
    };

    const value = {
        isTutorialActive,
        currentStep,
        startTutorial,
        skipTutorial,
        completeStep,
        goToStep,
    };

    return (
        <TutorialContext.Provider value={value}>
            {children}
        </TutorialContext.Provider>
    );
}

export function useTutorial() {
    const context = useContext(TutorialContext);
    if (context === undefined) {
        throw new Error('useTutorial must be used within a TutorialProvider');
    }
    return context;
}
