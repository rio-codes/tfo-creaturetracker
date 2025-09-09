import { Loader2 } from 'lucide-react';

export default function Loading() {
    return (
        <div className="flex justify-center items-center min-h-screen bg-barely-lilac dark:bg-deep-purple">
            <div className="flex flex-col items-center gap-4 text-pompaca-purple dark:text-purple-300">
                <Loader2 className="h-12 w-12 animate-spin" />
                <p className="text-lg font-semibold">Loading Goal Details...</p>
            </div>
        </div>
    );
}
