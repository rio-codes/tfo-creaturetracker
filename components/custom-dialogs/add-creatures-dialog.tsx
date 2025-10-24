'use client';

import React from 'react';
import { useState, useEffect } from 'react';
import { X, Loader2, PlusCircle, Trash2, GripVertical, Edit } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Checkbox } from '@/components/ui/checkbox';
import { ScrollArea } from '@/components/ui/scroll-area';
import { useRouter } from 'next/navigation';
import {
    AlertDialog,
    AlertDialogAction,
    AlertDialogCancel,
    AlertDialogContent,
    AlertDialogDescription,
    AlertDialogFooter,
    AlertDialogHeader,
    AlertDialogTitle,
} from '@/components/ui/alert-dialog';
import { alertService } from '@/services/alert.service';
import {
    DndContext,
    closestCenter,
    MouseSensor,
    TouchSensor,
    useSensor,
    useSensors,
} from '@dnd-kit/core';
import {
    arrayMove,
    SortableContext,
    useSortable,
    verticalListSortingStrategy,
} from '@dnd-kit/sortable';
import { CSS } from '@dnd-kit/utilities';
import { JSX } from 'react/jsx-runtime';

type DialogProps = {
    isOpen: boolean;
    onClose: () => void;
};

type SyncStatus = 'idle' | 'loading' | 'success' | 'error';

type MissingCreature = {
    id: string;
    code: string;
    creatureName: string | null;
};

type UserTab = {
    id: number;
    tabId: number;
    tabName: string | null;
    isSyncEnabled: boolean;
    displayOrder: number | null;
};

export function AddCreaturesDialog({ isOpen, onClose }: DialogProps) {
    const [newTabId, setNewTabId] = useState('');
    const [newTabName, setNewTabName] = useState('');
    const [status, setStatus] = useState<SyncStatus>('idle');
    const [message, setMessage] = useState('');
    const [userTabs, setUserTabs] = useState<UserTab[]>([]);
    const [isLoadingTabs, setIsLoadingTabs] = useState(true);
    const [showAddForm, setShowAddForm] = useState(false);
    const [missingCreatures, setMissingCreatures] = useState<MissingCreature[]>([]);
    const [showArchiveConfirm, setShowArchiveConfirm] = useState(false);

    const [editingTabId, setEditingTabId] = useState<number | null>(null);
    const [editingTabName, setEditingTabName] = useState('');

    const router = useRouter();

    const sensors = useSensors(
        useSensor(MouseSensor, {
            activationConstraint: { distance: 5 },
        }),
        useSensor(TouchSensor, {
            activationConstraint: { delay: 250, tolerance: 5 },
        })
    );

    const fetchUserTabs = async () => {
        setIsLoadingTabs(true);
        try {
            const response = await fetch('/api/users/tabs');
            if (response.ok) {
                const tabs = await response.json();
                setUserTabs(tabs);
            }
        } catch (error) {
            console.error('Failed to fetch user tabs', error);
        } finally {
            setIsLoadingTabs(false);
        }
    };

    useEffect(() => {
        if (isOpen) {
            fetchUserTabs();
        }
        setEditingTabId(null);
        setEditingTabName('');
    }, [isOpen]);

    if (!isOpen) {
        return null;
    }

    const handleSyncAll = async () => {
        setStatus('loading');
        setMessage('');
        const tabsToSync = userTabs.filter((tab) => tab.isSyncEnabled).map((tab) => tab.tabId);

        const isSyncingAllSavedTabs =
            userTabs.length > 0 && userTabs.every((tab) => tabsToSync.includes(tab.tabId));
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
                body: JSON.stringify({ tabIds: tabsToSync, fullSync: isSyncingAllSavedTabs }),
            });

            const data = await response.json();

            if (!response.ok) {
                throw new Error(data.error || 'Something went wrong during sync.');
            }

            if (data.missingCreatures && data.missingCreatures.length > 0) {
                setMissingCreatures(data.missingCreatures);
                setShowArchiveConfirm(true);
                alertService.success(data.message, { autoClose: true, keepAfterRouteChange: true });
                // Don't close the main dialog, let the archive confirmation handle it.
                setStatus('idle');
                router.refresh();
            } else {
                setStatus('success');
                setMessage(data.message);
                handleClose();
                alertService.success(data.message, {
                    autoClose: true,
                    keepAfterRouteChange: true,
                });
                router.refresh();
            }
        } catch (error: any) {
            console.error('Failed to sync creatures', error);
            setStatus('error');
            setMessage(error.message);
            alertService.error(error.message, {
                autoClose: true,
                keepAfterRouteChange: true,
            });
        }
    };

    const handleArchiveMissing = async () => {
        setStatus('loading');
        try {
            const creatureIds = missingCreatures.map((c) => c.id);
            const response = await fetch('/api/creatures/archive-many', {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({ creatureIds }),
            });
            const data = await response.json();
            if (!response.ok) throw new Error(data.error);

            alertService.success(`${creatureIds.length} creatures archived.`, {
                autoClose: true,
                keepAfterRouteChange: true,
            });
            setShowArchiveConfirm(false);
            setMissingCreatures([]);
            handleClose();
            router.refresh();
        } catch (error: any) {
            alertService.error(error.message, { autoClose: true, keepAfterRouteChange: true });
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
            if (!response.ok) throw new Error(data.error || 'Failed to add tab.');

            await fetchUserTabs(); // Refresh the list
            setShowAddForm(false);
            setNewTabId('');
            setNewTabName('');
            setStatus('idle');
        } catch (error: any) {
            console.error('Failed to add tab', error);
            setStatus('error');
            setMessage(error.message);
        }
    };

    const handleToggleAll = async () => {
        const isAllChecked = userTabs.length > 0 && userTabs.every((t) => t.isSyncEnabled);
        const newState = !isAllChecked;

        const originalTabs = userTabs;
        setUserTabs((prev) => prev.map((t) => ({ ...t, isSyncEnabled: newState })));

        try {
            await Promise.all(
                originalTabs.map((tab) => {
                    if (tab.isSyncEnabled !== newState) {
                        return fetch(`/api/users/tabs/${tab.id}`, {
                            method: 'PATCH',
                            headers: { 'Content-Type': 'application/json' },
                            body: JSON.stringify({ isSyncEnabled: newState }),
                        }).then((res) => {
                            if (!res.ok) {
                                throw new Error(`Failed to update tab ${tab.tabId}`);
                            }
                        });
                    }
                    return Promise.resolve();
                })
            );
        } catch (error) {
            console.error('Failed to update all tabs sync status', error);
            alertService.error('Failed to update all tabs.', {
                autoClose: true,
                keepAfterRouteChange: true,
            });
            setUserTabs(originalTabs); // Revert on error
        }
    };

    const handleToggleSync = async (tab: UserTab) => {
        // Optimistically update UI
        setUserTabs((prevTabs) =>
            prevTabs.map((t) => (t.id === tab.id ? { ...t, isSyncEnabled: !t.isSyncEnabled } : t))
        );

        try {
            await fetch(`/api/users/tabs/${tab.id}`, {
                method: 'PATCH',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({ isSyncEnabled: !tab.isSyncEnabled }),
            });
        } catch (error) {
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
        if (!window.confirm('Are you sure you want to remove this saved tab?')) return;
        setUserTabs((prev) => prev.filter((t) => t.id !== tabId));
        await fetch(`/api/users/tabs/${tabId}`, { method: 'DELETE' });
    };

    const handleDragEnd = async (event: any) => {
        const { active, over } = event;
        if (over && active.id !== over.id) {
            const oldIndex = userTabs.findIndex((t) => t.id === active.id);
            const newIndex = userTabs.findIndex((t) => t.id === over.id);
            const newOrder = arrayMove(userTabs, oldIndex, newIndex);
            setUserTabs(newOrder); // Optimistic update

            const orderedIds = newOrder.map((t) => t.id);
            try {
                await fetch('/api/users/tabs/reorder', {
                    method: 'POST',
                    headers: { 'Content-Type': 'application/json' },
                    body: JSON.stringify({ orderedIds }),
                });
            } catch (error) {
                console.error('Failed to save new order', error);
                fetchUserTabs();
                alertService.error('Failed to save tab order.');
            }
        }
    };

    const handleRename = async (tabId: number) => {
        if (!editingTabName.trim()) {
            setEditingTabId(null);
            return;
        }

        const originalTabs = [...userTabs];
        setUserTabs((prev) =>
            prev.map((t) => (t.id === tabId ? { ...t, tabName: editingTabName } : t))
        );
        setEditingTabId(null);

        try {
            const res = await fetch(`/api/users/tabs/${tabId}`, {
                method: 'PATCH',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({ tabName: editingTabName }),
            });
            if (!res.ok) throw new Error('Failed to rename tab.');
        } catch (error) {
            setUserTabs(originalTabs);
            alertService.error(error instanceof Error ? error.message : 'Failed to rename tab.');
        }
    };

    const handleClose = () => {
        onClose();
        setTimeout(() => {
            setNewTabId('');
            setNewTabName('');
            setStatus('idle');
            setMessage('');
            setShowAddForm(false);
            setEditingTabId(null);
        }, 300);
    };

    function SortableTabItem({ tab }: { tab: UserTab }): JSX.Element {
        const { attributes, listeners, setNodeRef, transform, transition, isDragging } =
            useSortable({ id: tab.id });

        const style: React.CSSProperties = {
            transform: CSS.Transform.toString(transform),
            transition,
            zIndex: isDragging ? 10 : undefined,
        };

        return (
            <div ref={setNodeRef} style={style} className="flex items-center justify-between p-1">
                <div className="flex items-center space-x-2 flex-grow">
                    <div {...attributes} {...listeners} className="cursor-grab touch-none p-1">
                        <GripVertical className="h-5 w-5 text-gray-400" />
                    </div>
                    <Checkbox
                        id={`tab-${tab.id}`}
                        checked={tab.isSyncEnabled}
                        onCheckedChange={() => handleToggleSync(tab)}
                    />
                    {editingTabId === tab.id ? (
                        <Input
                            value={editingTabName}
                            onChange={(e) => setEditingTabName(e.target.value)}
                            onBlur={() => handleRename(tab.id)}
                            onKeyDown={(e) => e.key === 'Enter' && handleRename(tab.id)}
                            autoFocus
                            className="h-8"
                        />
                    ) : (
                        <Label
                            htmlFor={`tab-${tab.id}`}
                            className="text-pompaca-purple dark:text-purple-300"
                        >
                            {tab.tabName || `Tab ${tab.tabId}`}
                        </Label>
                    )}
                </div>
                <div className="flex items-center">
                    <Button
                        variant="ghost"
                        size="icon"
                        onClick={() => {
                            setEditingTabId(tab.id);
                            setEditingTabName(tab.tabName || `Tab ${tab.tabId}`);
                        }}
                        className="h-6 w-6"
                    >
                        {' '}
                        <Edit className="h-4 w-4" />{' '}
                    </Button>
                    <Button
                        variant="ghost"
                        size="icon"
                        onClick={() => handleDeleteTab(tab.id)}
                        className="h-6 w-6 text-red-500 hover:bg-red-100 dark:hover:bg-red-900/50"
                    >
                        {' '}
                        <Trash2 className="h-4 w-4" />{' '}
                    </Button>
                </div>
            </div>
        );
    }

    return (
        <div className="fixed inset-0 bg-black/80 z-40 flex items-center justify-center">
            {/* Main Dialog */}
            <div
                className="bg-barely-lilac dark:bg-pompaca-purple hallowsnight:bg-ruzafolio-scarlet rounded-lg shadow-xl p-6 space-y-4 w-full max-w-md z-50"
                onClick={(e) => e.stopPropagation()}
            >
                <div className="flex justify-between items-center">
                    <h2 className="text-2xl font-bold text-pompaca-purple dark:text-purple-300 hallowsnight:text-cimo-crimson">
                        Add or Update Creatures
                    </h2>
                    <Button variant="ghost" size="icon" onClick={handleClose}>
                        <X className="h-4 w-4 text-dusk-purple dark:text-purple-400 hallowsnight:text-blood-bay-wine" />
                    </Button>
                </div>

                <div>
                    <p className="text-md justify-items-evenly text-dusk-purple dark:text-purple-400 hallowsnight:text-blood-bay-wine mb-4">
                        <span>
                            Enter the Tab ID from your TFO tab&#39;s URL. For example, if the URL is
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
                            NOTE: The tab must be set to &#34;Public&#34; in TFO to fetch your
                            creatures.
                        </span>
                    </p>
                </div>

                {/* Saved Tabs List */}
                <div className="space-y-2">
                    <Label className="text-pompaca-purple dark:text-purple-300 hallowsnight:text-cimo-crimson font-medium text-lg">
                        Saved Tabs
                    </Label>
                    <div className="flex items-center space-x-2 pl-1 pt-1">
                        <Checkbox
                            id="select-all-tabs"
                            checked={
                                userTabs.length > 0 && userTabs.every((t) => t.isSyncEnabled)
                                    ? true
                                    : userTabs.some((t) => t.isSyncEnabled)
                                      ? 'indeterminate'
                                      : false
                            }
                            onCheckedChange={handleToggleAll}
                            disabled={userTabs.length === 0}
                        />
                        <Label
                            htmlFor="select-all-tabs"
                            className="text-sm font-medium text-pompaca-purple dark:text-purple-300 hallowsnight:text-cimo-crimson"
                        >
                            Select/Deselect All
                        </Label>
                    </div>
                    <ScrollArea className="h-40 w-full rounded-md border bg-ebena-lavender/50 hallowsnight:bg-ruzafolio-scarlet dark:bg-midnight-purple p-2">
                        {isLoadingTabs ? (
                            <div className="flex justify-center items-center h-full">
                                <Loader2 className="animate-spin text-pompaca-purple dark:text-purple-300 hallowsnight:text-cimo-crimson" />
                            </div>
                        ) : userTabs.length > 0 ? (
                            <DndContext
                                sensors={sensors}
                                collisionDetection={closestCenter}
                                onDragEnd={handleDragEnd}
                            >
                                <SortableContext
                                    items={userTabs.map((t) => t.id)}
                                    strategy={verticalListSortingStrategy}
                                >
                                    {userTabs.map((tab) => (
                                        <SortableTabItem key={tab.id} tab={tab} />
                                    ))}
                                </SortableContext>
                            </DndContext>
                        ) : (
                            <p className="text-sm text-center text-dusk-purple dark:text-purple-400 hallowsnight:text-blood-bay-wine italic py-4">
                                No saved tabs yet.
                            </p>
                        )}
                    </ScrollArea>
                </div>

                {/* Add New Tab Form */}
                {showAddForm ? (
                    <form
                        onSubmit={handleAddTab}
                        className="space-y-2 p-2 border rounded-md bg-ebena-lavender/50 hallowsnight:bg-ruzafolio-scarlet dark:bg-midnight-purple hallowsnight:bg-abyss/50"
                    >
                        <Input
                            type="number"
                            placeholder="New Tab ID"
                            value={newTabId}
                            onChange={(e) => setNewTabId(e.target.value)}
                            className="bg-barely-lilac dark:bg-pompaca-purple hallowsnight:bg-ruzafolio-scarlet"
                            required
                        />
                        <Input
                            type="text"
                            placeholder="Tab Name (Optional)"
                            value={newTabName}
                            onChange={(e) => setNewTabName(e.target.value)}
                            className="bg-barely-lilac dark:bg-pompaca-purple hallowsnight:bg-ruzafolio-scarlet"
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
                    <p className="text-sm text-red-500 text-center">{message}</p>
                )}

                <div className="flex justify-end gap-4 pt-4">
                    <Button
                        variant="ghost"
                        onClick={handleClose}
                        className="text-dusk-purple dark:text-purple-400 hallowsnight:text-blood-bay-wine"
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

            {/* Archive Confirmation Dialog */}
            <AlertDialog open={showArchiveConfirm} onOpenChange={setShowArchiveConfirm}>
                <AlertDialogContent className="bg-barely-lilac dark:bg-pompaca-purple hallowsnight:bg-ruzafolio-scarlet">
                    <AlertDialogHeader>
                        <AlertDialogTitle>Archive Missing Creatures?</AlertDialogTitle>
                        <AlertDialogDescription>
                            The following {missingCreatures.length} creatures were not found in your
                            synced tabs. Would you like to archive them?
                            <ScrollArea className="h-32 mt-2 rounded-md border bg-ebena-lavender/50 hallowsnight:bg-ruzafolio-scarlet dark:bg-midnight-purple hallowsnight:bg-abyss/50 p-2">
                                <ul className="text-xs list-disc list-inside">
                                    {missingCreatures.map((c) => (
                                        <li key={c.id}>
                                            {c.creatureName || 'Unnamed'} ({c.code})
                                        </li>
                                    ))}
                                </ul>
                            </ScrollArea>
                        </AlertDialogDescription>
                    </AlertDialogHeader>
                    <AlertDialogFooter>
                        <AlertDialogCancel
                            onClick={() => {
                                setShowArchiveConfirm(false);
                                handleClose();
                            }}
                        >
                            No, Keep Them
                        </AlertDialogCancel>
                        <AlertDialogAction onClick={handleArchiveMissing}>
                            Yes, Archive Them
                        </AlertDialogAction>
                    </AlertDialogFooter>
                </AlertDialogContent>
            </AlertDialog>
        </div>
    );
}
