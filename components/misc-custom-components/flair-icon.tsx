import { Atom, Microscope, Fish, Squirrel, Bird } from 'lucide-react';

export function FlairIcon({
    tier,
}: {
    tier: 'admin' | 'beta_tester' | 'researcher' | 'postdoc' | 'assoc_prof' | 'tenured_prof';
}) {
    switch (tier) {
        case 'admin':
            return (
                <Atom className="inline-block ml-2 text-purple-600" aria-label="Admin">
                    <title>Admin</title>
                </Atom>
            );
        case 'beta_tester':
            return (
                <Microscope className="inline-block ml-2 text-cyan-500" aria-label="Beta Tester">
                    <title>Beta Tester</title>
                </Microscope>
            );
        case 'researcher':
            return null;
        case 'postdoc':
            return (
                <Fish className="inline-block ml-2 text-blue-500" aria-label="Postdoc (Patron)">
                    <title>Postdoc (Patron)</title>
                </Fish>
            );
        case 'assoc_prof':
            return (
                <Squirrel
                    className="inline-block ml-2 text-green-500"
                    aria-label="Associate Prof. (Patron)"
                >
                    <title>Associate Prof. (Patron)</title>
                </Squirrel>
            );
        case 'tenured_prof':
            return (
                <Bird
                    className="inline-block ml-2 text-pink-600"
                    aria-label="Tenured Prof. (Patron)"
                >
                    <title>Tenured Prof. (Patron)</title>
                </Bird>
            );
        default:
            return null;
    }
}
