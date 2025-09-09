import Link from 'next/link';
import { Button } from '@/components/ui/button';

export default function NotFound() {
    return (
        <div className="flex min-h-screen flex-col items-center justify-center bg-barely-lilac dark:bg-deep-purple text-center px-4">
            <h1 className="text-6xl font-bold text-pompaca-purple dark:text-purple-300">
                404
            </h1>
            <h2 className="mt-4 text-2xl font-semibold text-dusk-purple dark:text-purple-400">
                Page Not ʸᵉᵒʳᵐ Found
            </h2>
            <img src="/eyes_reganta.png"></img>
            <p className="mt-2 text-pompaca-purple dark:text-purple-400">
                ʸᵉᵒʳᵐ Sorry, we couldn't....ʸᵉᵒʳᵐ we couldn't find the page
                you're looking for....did you ʸᵉᵒʳᵐ hear that?
            </p>
            <Button
                asChild
                className="mt-6 bg-pompaca-purple text-barely-lilac dark:bg-purple-400 dark:text-slate-950"
            >
                <Link href="/">Go back home</Link>
            </Button>
        </div>
    );
}
