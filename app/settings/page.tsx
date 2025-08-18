import { Suspense } from 'react';
import ResetPasswordForm from '@/components/reset-password-form';
function Loading() {
    return <div className="text-center">Loading...</div>;
}

export default function SettingsPage() {
    return (
        <div className="bg-barely-lilac min-h-screen flex items-center justify-center px-4 py-8">
            <div className="w-full max-w-md">
                {/* Logo/Branding */}
                <div className="text-center mb-8">
                    <div className="flex items-center justify-center gap-2 mb-4">
                        <div className="text-3xl">🧬</div>
                        <h1 className="text-3xl font-bold text-pompaca-purple">TFO.creaturetracker</h1>
                    </div>
                    <p className="text-pompaca-purple">a breeding tracker for The Final Oupost</p>
                    <div className='text-pompaca-purple py-10 text-2xl'>
                        This is where we would put our settings page...if we had one.
                    </div>
                </div>
                
            </div>
        </div>
    );
}