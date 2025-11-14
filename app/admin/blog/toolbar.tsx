'use client';

import { type Editor } from '@tiptap/react';
import { Bold, Italic, Strikethrough, Link } from 'lucide-react';
import { Button } from '@/components/ui/button';

type Props = {
    editor: Editor | null;
};

export function Toolbar({ editor }: Props) {
    if (!editor) {
        return null;
    }

    const setLink = () => {
        const previousUrl = editor.getAttributes('link').href;
        const url = window.prompt('URL', previousUrl);

        if (url === null) {
            return;
        }

        if (url === '') {
            editor.chain().focus().extendMarkRange('link').unsetLink().run();
            return;
        }

        editor.chain().focus().extendMarkRange('link').setLink({ href: url }).run();
    };

    return (
        <div className="border border-gray-200 rounded-t-lg p-2 flex items-center space-x-2">
            <Button
                variant={editor.isActive('bold') ? 'secondary' : 'ghost'}
                onClick={() => editor.chain().focus().toggleBold().run()}
            >
                <Bold className="h-4 w-4" />
            </Button>
            <Button
                variant={editor.isActive('italic') ? 'secondary' : 'ghost'}
                onClick={() => editor.chain().focus().toggleItalic().run()}
            >
                <Italic className="h-4 w-4" />
            </Button>
            <Button
                variant={editor.isActive('strike') ? 'secondary' : 'ghost'}
                onClick={() => editor.chain().focus().toggleStrike().run()}
            >
                <Strikethrough className="h-4 w-4" />
            </Button>
            <Button variant={editor.isActive('link') ? 'secondary' : 'ghost'} onClick={setLink}>
                <Link className="h-4 w-4" />
            </Button>
        </div>
    );
}
