import DOMPurify from 'dompurify';
import { JSDOM } from 'jsdom';

// This file is only ever imported on the server.
// We create a JSDOM window and initialize DOMPurify with it.
const window = new JSDOM('').window;
const purify = DOMPurify(window as any);

export default purify;
