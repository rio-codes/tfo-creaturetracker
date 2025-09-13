import RegistrationFlow from '@/components/custom-forms/registration-flow';

export default function RegisterPage() {
    return (
        <div className="bg-barely-lilac min-h-screen flex items-center justify-center px-4 py-8">
            <div className="w-full max-w-md">
                {/* Logo/Branding */}
                <div className="text-center mb-8">
                    <div className="flex items-center justify-center gap-2 mb-4">
                        <div className="text-3xl">🧬</div>
                        <h1 className="text-3xl font-bold text-pompaca-purple">
                            TFO.creaturetracker
                        </h1>
                    </div>
                    <p className="text-pompaca-purple">a breeding tracker for The Final Oupost</p>
                </div>
                <RegistrationFlow />
            </div>
        </div>
    );
}
