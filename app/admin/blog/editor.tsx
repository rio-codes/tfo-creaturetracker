'use client';

import { useEditor, EditorContent } from '@tiptap/react';
import StarterKit from '@tiptap/starter-kit';
import Link from '@tiptap/extension-link';
import Placeholder from '@tiptap/extension-placeholder';
import { UserMention } from './user-mention';
import React, { useState, useEffect } from 'react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Toolbar } from './toolbar';
import './editor.css';
import { FlairIcon } from '@/components/misc-custom-components/flair-icon';
import ReactDOMServer from 'react-dom/server';

export const Editor = ({
    post,
    onSave,
}: {
    post: { title: string; content: string } | null;
    onSave: (title: string, content: string) => Promise<void>;
}) => {
    const [title, setTitle] = useState(post?.title || '');

    useEffect(() => {
        setTitle(post?.title || '');
    }, [post]);

    const editor = useEditor({
        immediatelyRender: false,
        extensions: [
            StarterKit,
            Link.configure({
                openOnClick: false,
            }),
            Placeholder.configure({
                placeholder: 'Write something amazing...',
            }),
            UserMention.configure({
                suggestion: {
                    items: async (query: string) => {
                        const response = await fetch(`/api/admin/users?query=${query}`);
                        const { users: userList } = await response.json();
                        return userList.map(
                            (user: {
                                username: string;
                                id: string;
                                supporterTier: string | null;
                            }) => ({
                                id: user.id,
                                label: user.username,
                                flair: user.supporterTier,
                            })
                        );
                    },
                    render: () => {
                        let component: any;
                        let popup: any;

                        return {
                            onStart: (_props: any) => {
                                component = document.createElement('div');
                                component.className = 'suggestion-list';
                                popup = document.createElement('div');
                                popup.className = 'suggestion-popup';
                                popup.appendChild(component);
                                document.body.appendChild(popup);
                            },

                            onUpdate(props: any) {
                                const rect = props.clientRect ? props.clientRect() : null;
                                if (!rect) {
                                    return;
                                }
                                popup.style.top = `${rect.top + rect.height}px`;
                                popup.style.left = `${rect.left}px`;

                                component.innerHTML = '';
                                props.items.forEach((item: any) => {
                                    const button = document.createElement('button');
                                    const flair = item.flair
                                        ? ReactDOMServer.renderToStaticMarkup(
                                              <FlairIcon tier={item.flair} />
                                          )
                                        : '';
                                    button.innerHTML = `${flair} ${item.label}`;
                                    button.onclick = () =>
                                        props.command({ id: item.id, label: item.label });
                                    component.appendChild(button);
                                });
                            },

                            onKeyDown(props: any) {
                                if (props.event.key === 'Escape') {
                                    popup.remove();
                                    return true;
                                }
                                return false;
                            },

                            onExit() {
                                popup.remove();
                            },
                        };
                    },
                },
            }),
        ],
        content: post?.content,
    });

    const handleSave = async () => {
        if (editor) {
            const content = editor.getHTML();
            if (title) {
                await onSave(title, content);
            }
        }
    };

    return (
        <div className="space-y-4">
            <Input
                type="text"
                placeholder="Post Title"
                value={title}
                onChange={(e: React.ChangeEvent<HTMLInputElement>) => setTitle(e.target.value)}
            />
            <Toolbar editor={editor} />
            <EditorContent editor={editor} />
            <Button onClick={handleSave} className="mt-4">
                Save Post
            </Button>
        </div>
    );
};
