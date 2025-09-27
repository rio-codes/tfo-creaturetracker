'use client';

import DOMPurify from 'dompurify';

// This file is only ever imported on the client.
// It uses the browser's native window object.
const purify = DOMPurify(window as any);

export default purify;
