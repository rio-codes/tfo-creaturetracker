'use client';

import { useTheme } from 'next-themes';
import { Toaster as Sonner, ToasterProps } from 'sonner';

const Toaster = ({ ...props }: ToasterProps) => {
    const { theme = 'system' } = useTheme();

    return (
        <Sonner
            theme={theme as ToasterProps['theme']}
            className="toaster group"
            toastOptions={{
                classNames: {
                    toast: 'bg-ebena-lavender dark:bg-pompaca-purple hallowsnight:bg-ruzafolio-scarlet border-pompaca-purple/50 text-pompaca-purple dark:text-barely-lilac hallowsnight:text-cimo-crimson',
                    title: 'text-pompaca-purple dark:text-barely-lilac hallowsnight:text-cimo-crimson font-semibold',
                    description:
                        'text-dusk-purple dark:text-purple-400 hallowsnight:text-blood-bay-wine',
                    actionButton:
                        'bg-pompaca-purple text-barely-lilac hover:bg-pompaca-purple/90 dark:bg-ebena-lavender dark:text-pompaca-purple dark:hover:bg-ebena-lavender/90',
                    cancelButton:
                        'bg-dusk-purple text-barely-lilac hover:bg-dusk-purple/90 dark:bg-pompaca-purple hallowsnight:bg-ruzafolio-scarlet/50 dark:text-barely-lilac hallowsnight:text-cimo-crimson dark:hover:bg-pompaca-purple/60',
                    success:
                        'bg-green-100 dark:bg-green-900/50 border-green-500/50 text-green-800 dark:text-green-300',
                    error: 'bg-red-100 dark:bg-red-900/50 border-red-500/50 text-red-800 dark:text-red-300',
                },
            }}
            {...props}
        />
    );
};

export { Toaster };
