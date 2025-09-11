import Image from 'next/image';
import { Button } from '@/components/ui/button';

type TutorialMessageBoxProps = {
    character: {
        name: string;
        avatarUrl: string;
    };
    message: string | React.ReactNode;
    onNext: () => void;
    onSkip: () => void;
    isLastStep?: boolean;
    hasNextAction?: boolean;
};

export function TutorialMessageBox({
    character,
    message,
    onNext,
    onSkip,
    isLastStep = false,
    hasNextAction = true,
}: TutorialMessageBoxProps) {
    return (
        <div className="fixed bottom-8 right-8 max-w-sm w-full bg-ebena-lavender dark:bg-pompaca-purple text-pompaca-purple dark:text-purple-300 rounded-lg shadow-2xl border-2 border-pompaca-purple/50 z-50 animate-in fade-in slide-in-from-bottom-4 duration-500">
            {/* You can add a torn paper SVG here as a background or mask */}
            <div className="p-4">
                <div className="flex items-center gap-3 mb-3">
                    <Image
                        src={character.avatarUrl}
                        alt={character.name}
                        width={40}
                        height={40}
                        className="rounded-full bg-pompaca-purple/20 p-1"
                    />
                    <h3 className="font-bold text-lg">{character.name}</h3>
                </div>
                <div className="text-sm leading-relaxed prose dark:prose-invert">
                    {typeof message === 'string' ? <p>{message}</p> : message}
                </div>
            </div>
            <div className="flex justify-between items-center p-3 bg-pompaca-purple/10 dark:bg-midnight-purple/50 rounded-b-lg">
                <Button variant="ghost" size="sm" onClick={onSkip}>
                    Skip Tutorial
                </Button>
                {hasNextAction && (
                    <Button
                        onClick={onNext}
                        size="sm"
                        className="bg-pompaca-purple text-barely-lilac"
                    >
                        {isLastStep ? 'Finish' : 'Next'}
                    </Button>
                )}
            </div>
        </div>
    );
}
