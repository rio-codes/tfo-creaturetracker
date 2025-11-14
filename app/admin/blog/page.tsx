'use client';

import React, { useEffect, useState } from 'react';
import dynamic from 'next/dynamic';
import {
    Select,
    SelectContent,
    SelectItem,
    SelectTrigger,
    SelectValue,
} from '@/components/ui/select';

const Editor = dynamic(() => import('@/app/admin/blog/editor').then((mod) => mod.Editor), {
    ssr: false,
    loading: () => <p>Loading editor...</p>,
});

export default function BlogAdminPage() {
    const [posts, setPosts] = useState<any[]>([]);
    const [selectedPost, setSelectedPost] = useState<any | null>(null);

    useEffect(() => {
        const fetchPosts = async () => {
            const response = await fetch('/api/blog');
            const data = await response.json();
            setPosts(data);
        };
        fetchPosts();
    }, []);

    const handleSelectPost = (postId: string) => {
        const post = posts.find((p) => p.id === postId);
        setSelectedPost(post);
    };

    const handleSave = async (title: string, content: string) => {
        const method = selectedPost ? 'PATCH' : 'POST';
        const body = selectedPost
            ? JSON.stringify({ id: selectedPost.id, title, content })
            : JSON.stringify({ title, content });

        await fetch('/api/admin/blog', {
            method,
            headers: {
                'Content-Type': 'application/json',
            },
            body,
        });
    };

    return (
        <div className="container mx-auto p-4">
            <h1 className="text-2xl font-bold mb-4">Blog Post Editor</h1>
            <Select onValueChange={handleSelectPost}>
                <SelectTrigger className="w-full md:w-auto">
                    <SelectValue placeholder="Select a post to edit" />
                </SelectTrigger>
                <SelectContent>
                    {posts.map((post) => (
                        <SelectItem key={post.id} value={post.id}>
                            {post.title}
                        </SelectItem>
                    ))}
                </SelectContent>
            </Select>
            <Editor post={selectedPost} onSave={handleSave} />
        </div>
    );
}
