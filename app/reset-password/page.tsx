import { Suspense } from 'react';
import ResetPasswordForm from '@/components/custom-forms/reset-password-form';
function Loading() {
    return <div className="text-center">Loading...</div>;
}

export default function ResetPasswordPage() {
    return (
        <div className="flex min-h-screen items-center justify-center bg-barely-lilac">
            {/* The Suspense boundary is required for components that use useSearchParams() */}
            <Suspense fallback={<Loading />}>
                <ResetPasswordForm />
            </Suspense>
        </div>
    );
}