import Link from 'next/link';

export function Footer() {
    const year = new Date().getFullYear();
    return (
        <footer className="items-center h-30 w-full bg-midnight-purple dark:bg-ebena-lavender text-barely-lilac dark:text-pompaca-purple px-4 py-4 mt-auto inset-shadow-sm inset-shadow-gray-500">
            <div className="flex flex-wrap justify-between text-sm max-w-full">
                <div className="mb-4 md:mb-0">
                    <span>
                        ©{year} Rio S., licensed under{' '}
                        <a
                            href="https://www.gnu.org/licenses/agpl-3.0.en.html"
                            className="underline hover:no-underline"
                        >
                            AGPL-3.0
                        </a>
                        .
                    </span>
                    <br></br>
                    <span>
                        All art is the copyright of respective artists on{' '}
                        <a
                            href="https://finaloutpost.net/"
                            className="underline"
                        >
                            The Final Outpost
                        </a>
                    </span>
                </div>
                <div className="flex items-center gap-4">
                    <Link href="/terms" className="hover:underline">
                        Terms of Service
                    </Link>
                    <span>|</span>
                    <Link href="/privacy" className="hover:underline">
                        Privacy Policy
                    </Link>
                    <span>|</span>
                    <a
                        href="https://github.com/rio-codes/tfo-creaturetracker"
                        className="hover:underline"
                    >
                        Github
                    </a>
                    <span>|</span>
                    <a
                        href="https://www.patreon.com/cw/tfoct"
                        className="hover:underline"
                    >
                        Patreon
                    </a>
                    <span>|</span>
                    <a
                        href="https://discord.gg/PMtE3jrXYR"
                        className="hover:underline"
                    >
                        Discord
                    </a>
                    <span>|</span>
                    <a
                        href="https://finaloutpost.net/lab/lyricism"
                        className="hover:underline"
                    >
                        My Lab
                    </a>
                </div>
            </div>
        </footer>
    );
}
