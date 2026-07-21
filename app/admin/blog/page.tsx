'use client';

import React, { useEffect, useState } from 'react';
import { Editor } from '@/app/admin/blog/editor';
import {
    Select,
    SelectContent,
    SelectItem,
    SelectTrigger,
    SelectValue,
} from '@/components/ui/select';

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
        if (postId === 'new-post') {
            setSelectedPost(null);
        } else {
            const post = posts.find((p) => p.id === postId);
            setSelectedPost(post);
        }
    };

    const handleSave = async (title: string, content: string) => {
        const method = selectedPost ? 'PATCH' : 'POST';
        const body = selectedPost
            ? JSON.stringify({ id: selectedPost.id, title, content })
            : JSON.stringify({ title, content });

        const response = await fetch('/api/admin/blog', {
            method,
            headers: {
                'Content-Type': 'application/json',
            },
            body,
        });

        if (response.ok) {
            const fetchResponse = await fetch('/api/blog');
            const data = await fetchResponse.json();
            setPosts(data);
            setSelectedPost(null);
        }
    };

    return (
        <div className="container mx-auto p-4 max-w-5xl">
            <h1 className="text-2xl font-bold mb-4">Blog Post Editor (Raw HTML)</h1>
            <div className="mb-6">
                <Select value={selectedPost?.id || 'new-post'} onValueChange={handleSelectPost}>
                    <SelectTrigger className="w-full md:w-auto min-w-[280px]">
                        <SelectValue placeholder="Select a post to edit" />
                    </SelectTrigger>
                    <SelectContent>
                        <SelectItem value="new-post">-- Create New Post --</SelectItem>
                        {posts.map((post) => (
                            <SelectItem key={post.id} value={post.id}>
                                {post.title}
                            </SelectItem>
                        ))}
                    </SelectContent>
                </Select>
            </div>
            <Editor post={selectedPost} onSave={handleSave} />
        </div>
    );
}
