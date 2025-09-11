'use client';

import { useState, useEffect } from 'react';
import { X, Loader2, PlusCircle, Trash2 } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Checkbox } from '@/components/ui/checkbox';
import { ScrollArea } from '@/components/ui/scroll-area';
import { useRouter } from 'next/navigation';
import { alertService } from '@/services/alert.service';
import * as Sentry from '@sentry/nextjs';

type DialogProps = {
    isOpen: boolean;
    onClose: () => void;
};

type SyncStatus = 'idle' | 'loading' | 'success' | 'error';

type UserTab = {
    id: number;
    tabId: number;
    tabName: string | null;
    isSyncEnabled: boolean;
};

export function AddCreaturesDialog({ isOpen, onClose }: DialogProps) {
    const [newTabId, setNewTabId] = useState('');
    const [newTabName, setNewTabName] = useState('');
    const [status, setStatus] = useState<SyncStatus>('idle');
    const [message, setMessage] = useState('');
    const [userTabs, setUserTabs] = useState<UserTab[]>([]);
    const [isLoadingTabs, setIsLoadingTabs] = useState(true);
    const [showAddForm, setShowAddForm] = useState(false);

    const router = useRouter();

    const fetchUserTabs = async () => {
        setIsLoadingTabs(true);
        try {
            const response = await fetch('/api/users/tabs');
            if (response.ok) {
                const tabs = await response.json();
                setUserTabs(tabs);
            }
        } catch (error) {
            Sentry.captureException(error);
            console.error('Failed to fetch user tabs', error);
        } finally {
            setIsLoadingTabs(false);
        }
    };

    useEffect(() => {
        if (isOpen) {
            fetchUserTabs();
        }
    }, [isOpen]);

    if (!isOpen) {
        return null;
    }

    const handleSyncAll = async () => {
        setStatus('loading');
        setMessage('');
        const tabsToSync = userTabs
            .filter((tab) => tab.isSyncEnabled)
            .map((tab) => tab.tabId);

        if (tabsToSync.length === 0) {
            setStatus('idle');
            alertService.warn('No tabs selected for syncing.', {
                autoClose: true,
                keepAfterRouteChange: true,
            });
            return;
        }

        try {
            const response = await fetch('/api/creatures/sync-all', {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({ tabIds: tabsToSync }),
            });

            const data = await response.json();

            if (!response.ok) {
                throw new Error(
                    data.error || 'Something went wrong during sync.'
                );
            }

            setStatus('success');
            setMessage(data.message);
            handleClose();
            alertService.success(data.message, {
                autoClose: true,
                keepAfterRouteChange: true,
            });
            router.refresh();
        } catch (error: any) {
            Sentry.captureException(error);
            console.error('Failed to sync creatures', error);
            setStatus('error');
            setMessage(error.message);
            alertService.error(error.message, {
                autoClose: true,
                keepAfterRouteChange: true,
            });
        }
    };

    const handleAddTab = async (e: React.FormEvent) => {
        e.preventDefault();
        setMessage('');
        setStatus('loading');
        try {
            const response = await fetch('/api/users/tabs', {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({
                    tabId: Number(newTabId),
                    tabName: newTabName || null,
                }),
            });
            const data = await response.json();
            if (!response.ok)
                throw new Error(data.error || 'Failed to add tab.');

            await fetchUserTabs(); // Refresh the list
            setShowAddForm(false);
            setNewTabId('');
            setNewTabName('');
            setStatus('idle');
        } catch (error: any) {
            Sentry.captureException(error);
            console.error('Failed to add tab', error);
            setStatus('error');
            setMessage(error.message);
        }
    };

    const handleToggleSync = async (tab: UserTab) => {
        // Optimistically update UI
        setUserTabs((prevTabs) =>
            prevTabs.map((t) =>
                t.id === tab.id ? { ...t, isSyncEnabled: !t.isSyncEnabled } : t
            )
        );

        try {
            await fetch(`/api/users/tabs/${tab.id}`, {
                method: 'PATCH',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({ isSyncEnabled: !tab.isSyncEnabled }),
            });
        } catch (error) {
            Sentry.captureException(error);
            console.error('Failed to update sync status', error);
            // Rollback optimistic update
            alertService.error('Failed to update sync status.', {
                autoClose: true,
                keepAfterRouteChange: true,
            });
            fetchUserTabs(); // Revert on error
        }
    };

    const handleDeleteTab = async (tabId: number) => {
        if (!window.confirm('Are you sure you want to remove this saved tab?'))
            return;
        setUserTabs((prev) => prev.filter((t) => t.id !== tabId));
        await fetch(`/api/users/tabs/${tabId}`, { method: 'DELETE' });
    };

    const handleClose = () => {
        onClose();
        setTimeout(() => {
            setNewTabId('');
            setNewTabName('');
            setStatus('idle');
            setMessage('');
            setShowAddForm(false);
        }, 300);
    };

    return (
        <div className="fixed inset-0 bg-black/80 z-40 flex items-center justify-center">
            <div
                className="bg-barely-lilac dark:bg-pompaca-purple rounded-lg shadow-xl p-6 space-y-4 w-full max-w-md z-50"
                onClick={(e) => e.stopPropagation()}
            >
                <div className="flex justify-between items-center">
                    <h2 className="text-2xl font-bold text-pompaca-purple dark:text-purple-300">
                        Add or Update Creatures
                    </h2>
                    <Button variant="ghost" size="icon" onClick={handleClose}>
                        <X className="h-4 w-4 text-dusk-purple dark:text-purple-400" />
                    </Button>
                </div>

                <div>
                    <p className="text-md justify-items-evenly text-dusk-purple dark:text-purple-400 mb-4">
                        <span>
                            Enter the Tab ID from your TFO tab's URL. For
                            example, if the URL is
                            <code className="bg-ebena-lavender text-pompaca-purple p-1 rounded mx-1">
                                .../tab/username/tab_name/12345/1/...
                            </code>
                            , your Tab ID is{' '}
                            <code className="bg-ebena-lavender text-pompaca-purple p-1 rounded mx-1">
                                12345
                            </code>
                            . For the default tab, use{' '}
                            <code className="bg-ebena-lavender text-pompaca-purple p-1 rounded mx-1">
                                0
                            </code>
                            .
                        </span>
                        <br></br>
                        <span className="font-semibold text-sm py-1 mt-1">
                            NOTE: The tab must be set to "Public" in TFO to
                            fetch your creatures.
                        </span>
                    </p>
                </div>

                {/* Saved Tabs List */}
                <div className="space-y-2">
                    <Label className="text-pompaca-purple dark:text-purple-300 font-medium text-lg">
                        Saved Tabs
                    </Label>
                    <ScrollArea className="h-40 w-full rounded-md border bg-ebena-lavender/50 dark:bg-midnight-purple/50 p-2">
                        {isLoadingTabs ? (
                            <div className="flex justify-center items-center h-full">
                                <Loader2 className="animate-spin text-pompaca-purple dark:text-purple-300" />
                            </div>
                        ) : userTabs.length > 0 ? (
                            userTabs.map((tab) => (
                                <div
                                    key={tab.id}
                                    className="flex items-center justify-between p-1"
                                >
                                    <div className="flex items-center space-x-2">
                                        <Checkbox
                                            id={`tab-${tab.id}`}
                                            checked={tab.isSyncEnabled}
                                            onCheckedChange={() =>
                                                handleToggleSync(tab)
                                            }
                                        />
                                        <Label
                                            htmlFor={`tab-${tab.id}`}
                                            className="text-pompaca-purple dark:text-purple-300"
                                        >
                                            {tab.tabName || `Tab ${tab.tabId}`}
                                        </Label>
                                    </div>
                                    <Button
                                        variant="ghost"
                                        size="icon"
                                        onClick={() => handleDeleteTab(tab.id)}
                                        className="h-6 w-6 text-red-500 hover:bg-red-100 dark:hover:bg-red-900/50"
                                    >
                                        <Trash2 className="h-4 w-4" />
                                    </Button>
                                </div>
                            ))
                        ) : (
                            <p className="text-sm text-center text-dusk-purple dark:text-purple-400 italic py-4">
                                No saved tabs yet.
                            </p>
                        )}
                    </ScrollArea>
                </div>

                {/* Add New Tab Form */}
                {showAddForm ? (
                    <form
                        onSubmit={handleAddTab}
                        className="space-y-2 p-2 border rounded-md bg-ebena-lavender/50 dark:bg-midnight-purple/50"
                    >
                        <Input
                            type="number"
                            placeholder="New Tab ID"
                            value={newTabId}
                            onChange={(e) => setNewTabId(e.target.value)}
                            className="bg-barely-lilac dark:bg-pompaca-purple"
                            required
                        />
                        <Input
                            type="text"
                            placeholder="Tab Name (Optional)"
                            value={newTabName}
                            onChange={(e) => setNewTabName(e.target.value)}
                            className="bg-barely-lilac dark:bg-pompaca-purple"
                        />
                        <div className="flex justify-end gap-2">
                            <Button
                                type="button"
                                variant="ghost"
                                size="sm"
                                onClick={() => setShowAddForm(false)}
                            >
                                Cancel
                            </Button>
                            <Button
                                type="submit"
                                size="sm"
                                className="bg-pompaca-purple text-barely-lilac"
                                disabled={status === 'loading'}
                            >
                                {status === 'loading' ? (
                                    <Loader2 className="animate-spin h-4 w-4" />
                                ) : (
                                    'Save Tab'
                                )}
                            </Button>
                        </div>
                    </form>
                ) : (
                    <Button
                        variant="outline"
                        className="w-full"
                        onClick={() => setShowAddForm(true)}
                    >
                        <PlusCircle className="mr-2 h-4 w-4" /> Add New Tab
                    </Button>
                )}

                {/* Error Display */}
                {status === 'error' && message && (
                    <p className="text-sm text-red-500 text-center">
                        {message}
                    </p>
                )}

                <div className="flex justify-end gap-4 pt-4">
                    <Button
                        variant="ghost"
                        onClick={handleClose}
                        className="text-dusk-purple dark:text-purple-400"
                    >
                        Close
                    </Button>
                    <Button
                        onClick={handleSyncAll}
                        className="w-32 bg-pompaca-purple text-barely-lilac dark:bg-purple-400 dark:text-slate-950"
                        disabled={status === 'loading'}
                    >
                        {status === 'loading' ? (
                            <Loader2 className="animate-spin" />
                        ) : (
                            'Sync All Checked'
                        )}
                    </Button>
                </div>
            </div>
        </div>
    );
}
