'use client';

import { useState } from 'react';
import { X, Loader2 } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { useRouter } from 'next/navigation';

type DialogProps = {
    isOpen: boolean;
    onClose: () => void;
};

type SyncStatus = 'idle' | 'loading' | 'success' | 'error';

export function AddCreaturesDialog({ isOpen, onClose }: DialogProps) {
    const [tabId, setTabId] = useState('');
    const [status, setStatus] = useState<SyncStatus>('idle');
    const [message, setMessage] = useState('');
    const router = useRouter();

    if (!isOpen) {
        return null;
    }

    const handleSync = async () => {
        setStatus('loading');
        setMessage('');

        try {
            const response = await fetch('/api/creatures/sync', {
                method: 'POST',
                headers: {
                'Content-Type': 'application/json',
                },
                body: JSON.stringify({ tabId: Number(tabId) }),
            });

            const data = await response.json();

            if (!response.ok) {
                throw new Error(data.error || 'Something went wrong');
            }

            setStatus('success');
            setMessage(data.message);
            router.refresh()
        } catch (error: any) {
            setStatus('error');
            setMessage(error.message);
        }
    };

    const handleClose = () => {
        onClose();
        // Reset state after a short delay to allow for closing animation
        setTimeout(() => {
            setTabId('');
            setStatus('idle');
            setMessage('');
        }, 300);
    }

    return (
        <div className="fixed inset-0 bg-black bg-opacity-50 z-40 flex items-center justify-center" onClick={handleClose}>
            <div
                className="bg-barely-lilac rounded-lg shadow-xl p-6 space-y-4 w-full max-w-md z-50"
                onClick={(e) => e.stopPropagation()}
            >
                <div className="flex justify-between items-center">
                <h2 className="text-2xl font-bold text-pompaca-purple">Add or Update Creatures</h2>
                <Button variant="ghost" size="icon" onClick={handleClose}>
                    <X className="h-4 w-4 text-dusk-purple" />
                </Button>
                </div>

                <div>
                    <p className="text-sm text-dusk-purple mb-4">
                        Enter the Tab ID from your TFO tab's URL. For example, if the URL is 
                        <code className="bg-ebena-lavender p-1 rounded mx-1">.../tab/username/tab_name/12345/1/...</code>, your Tab ID is 12345. For the default tab, use 0.
                    </p>
                    <Label htmlFor="tab-id" className="text-pompaca-purple font-medium">
                        TFO Tab ID
                    </Label>
                    <Input
                        id="tab-id"
                        type="number"
                        value={tabId}
                        onChange={(e) => setTabId(e.target.value)}
                        placeholder="e.g., 12345"
                        className="mt-2 bg-ebena-lavender border-pompaca-purple text-pompaca-purple placeholder:text-dusk-purple"
                    />
                </div>

                {/* Status Messages */}
                {message && (
                <div className={`p-3 rounded-md text-sm ${
                    status === 'success' ? 'bg-green-100 text-green-800' : ''
                } ${
                    status === 'error' ? 'bg-red-100 text-red-800' : ''
                }`}>
                    {message}
                </div>
                )}
                
                <div className="flex justify-end gap-4 pt-4">
                    <Button variant="ghost" onClick={handleClose} className="text-dusk-purple">
                        Close
                    </Button>
                    <Button
                    onClick={handleSync}
                    className="w-32 bg-emoji-eggplant text-barely-lilac"
                    disabled={status === 'loading' || !tabId}
                    >
                    {status === 'loading' ? (
                        <Loader2 className="animate-spin" />
                    ) : (
                        'Sync Creatures'
                    )}
                    </Button>
                </div>
            </div>
        </div>
    );
}