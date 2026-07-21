'use client';

import React, { useState, useEffect } from 'react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Textarea } from '@/components/ui/textarea';
import { Label } from '@/components/ui/label';
import { toast } from 'sonner';

export const Editor = ({
    post,
    onSave,
}: {
    post: { title: string; content: string } | null;
    onSave: (title: string, content: string) => Promise<void>;
}) => {
    const [title, setTitle] = useState(post?.title || '');
    const [content, setContent] = useState(post?.content || '');
    const [isSaving, setIsSaving] = useState(false);

    useEffect(() => {
        setTitle(post?.title || '');
        setContent(post?.content || '');
    }, [post]);

    const handleSave = async () => {
        if (title.trim() && !isSaving) {
            setIsSaving(true);
            try {
                await onSave(title.trim(), content);
                toast.success('Blog post saved successfully!');
            } catch (error) {
                console.error('Failed to save blog post:', error);
                toast.error('Failed to save blog post.');
            } finally {
                setIsSaving(false);
            }
        }
    };

    return (
        <div className="space-y-4">
            <div className="space-y-2">
                <Label htmlFor="post-title" className="font-semibold">
                    Post Title
                </Label>
                <Input
                    id="post-title"
                    type="text"
                    placeholder="Enter post title..."
                    value={title}
                    onChange={(e: React.ChangeEvent<HTMLInputElement>) => setTitle(e.target.value)}
                />
            </div>
            <div className="space-y-2">
                <Label htmlFor="post-content" className="font-semibold flex justify-between items-center">
                    <span>HTML Content (Raw Code)</span>
                    <span className="text-xs text-muted-foreground font-mono">HTML tags intact</span>
                </Label>
                <Textarea
                    id="post-content"
                    placeholder="<p>Write raw HTML content here...</p>"
                    value={content}
                    onChange={(e: React.ChangeEvent<HTMLTextAreaElement>) => setContent(e.target.value)}
                    className="font-mono text-sm min-h-[400px] p-4 bg-slate-900 text-slate-100 dark:bg-slate-950 dark:text-slate-100 border-slate-700 resize-y"
                    rows={16}
                />
            </div>
            <Button onClick={handleSave} className="mt-4" disabled={isSaving || !title.trim()}>
                {isSaving ? 'Saving...' : 'Save Post'}
            </Button>
        </div>
    );
};
