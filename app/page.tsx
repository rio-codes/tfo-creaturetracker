export default function Page() {
    return (
        <div className="flex h-screen bg-slate-800">
            <div className="w-screen h-screen flex flex-col justify-center items-center">
                <div className="text-center max-w-screen-sm mb-10">
                    <h1 className="text-slate-300 font-bold text-2xl">
                        TFO.creaturetracker
                    </h1>
                    <h2 className="text-slate-300 font-bold text-l mt-5">
                        is a utility for the web game{' '}
                        <a href="https://finaloutpost.net/">
                            The Final Outpost
                        </a>{' '}
                        that will allow you to:
                    </h2>
                    <div className="text-slate-400 text-m mt-5">
                        <ul>
                            <li>🧪 Save research goals and breeding pairs</li>
                            <li>🧬 Create breeding predictions for any pair</li>
                            <li>
                                🔍 Browse and filter your collection at a glance
                            </li>
                        </ul>
                    </div>
                    <p className="text-slate-400 font-bold text-l mt-5">
                        Want a preview of the site before it launches? Become a
                        subscriber on our{' '}
                        <a
                            href="https://www.patreon.com/cw/tfoct"
                            className="text-dusk-purple"
                        >
                            Patreon
                        </a>
                        {'. '} Curious about the site? join our{' '}
                        <a
                            href="https://discord.gg/PMtE3jrXYR"
                            className="text-dusk-purple"
                        >
                            Discord
                        </a>{' '}
                        to talk to the team and chat about what will be
                        available.
                    </p>
                    <p className="text-slate-400 font-semibold text-md mt-5">
                        Current beta testers:{' '}
                        <a
                            className="text-dusk-purple"
                            href="https://finaloutpost.net/lab/DraconisVenenum"
                        >
                            Joltflare
                        </a>
                        ,{' '}
                        <a
                            className="text-dusk-purple"
                            href="https://finaloutpost.net/lab/koda_curvata"
                        >
                            Koda
                        </a>
                        , and{' '}
                        <a
                            className="text-dusk-purple"
                            href="https://finaloutpost.net/lab/Notherox"
                        >
                            Notherox
                        </a>
                        .
                    </p>
                </div>
            </div>
        </div>
    );
}
