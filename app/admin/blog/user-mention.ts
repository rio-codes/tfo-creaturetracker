import { Node, mergeAttributes } from '@tiptap/core';

export const UserMention = Node.create({
    name: 'userMention',

    group: 'inline',

    inline: true,

    selectable: false,

    atom: true,

    addAttributes() {
        return {
            id: {
                default: null,
                parseHTML: (element: HTMLElement) => element.getAttribute('data-id'),
                renderHTML: (attributes: Record<string, any>) => {
                    if (!attributes.id) {
                        return {};
                    }
                    return {
                        'data-id': attributes.id,
                    };
                },
            },

            label: {
                default: null,
                parseHTML: (element: HTMLElement) => element.getAttribute('data-label'),
                renderHTML: (attributes: Record<string, any>) => {
                    if (!attributes.label) {
                        return {};
                    }
                    return {
                        'data-label': attributes.label,
                    };
                },
            },
        };
    },

    parseHTML() {
        return [
            {
                tag: 'span[data-type="user-mention"]',
            },
        ];
    },

    renderHTML({ HTMLAttributes }: { HTMLAttributes: Record<string, any> }) {
        return ['span', mergeAttributes({ 'data-type': 'user-mention' }, HTMLAttributes), 0];
    },

    renderText({ node }: { node: any }) {
        return `@${node.attrs.label}`;
    },
});
