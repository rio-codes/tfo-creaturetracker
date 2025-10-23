import { Loader2 } from 'lucide-react';

export default function Loading() {
    return (
        <div className="flex justify-center items-center min-h-screen bg-barely-lilac dark:bg-deep-purple hallowsnight:bg-abyss">
            <div className="flex flex-col items-center gap-4 text-pompaca-purple dark:text-purple-300 hallowsnight:text-cimo-crimson">
                <Loader2 className="h-12 w-12 animate-spin" />
                <p className="text-lg font-semibold">Loading Community Wishlist...</p>
            </div>
        </div>
    );
}
