import { Atom, Microscope, Fish, Squirrel, Bird } from 'lucide-react';

export function FlairIcon({
    tier,
}: {
    tier: 'admin' | 'beta_tester' | 'researcher' | 'postdoc' | 'assoc_prof' | 'tenured_prof';
}) {
    switch (tier) {
        case 'admin':
            return <Atom className="inline-block ml-2 text-purple-600" />;
        case 'beta_tester':
            return <Microscope className="inline-block ml-2 text-cyan-500" />;
        case 'researcher':
            return null;
        case 'postdoc':
            return <Fish className="inline-block ml-2 text-blue-500" />;
        case 'assoc_prof':
            return <Squirrel className="inline-block ml-2 text-green-500" />;
        case 'tenured_prof':
            return <Bird className="inline-block ml-2 text-pink-600" />;
        default:
            return null;
    }
}
