import * as path from 'node:path';
import { readFileSync } from 'node:fs';

const TAILWIND_STYLESHEET_LINK = /<link\s+[^>]*href=(?:"https:\/\/cdn\.jsdelivr\.net\/npm\/tailwindcss@latest\/dist\/tailwind\.min\.css"|'https:\/\/cdn\.jsdelivr\.net\/npm\/tailwindcss@latest\/dist\/tailwind\.min\.css'|"tailwind\.min\.css"|'tailwind\.min\.css')[^>]*rel=(?:"stylesheet"|'stylesheet')[^>]*\/?>(?:<\/link>)?/i;
const TAILWIND_STYLESHEET_PATH = path.join(__dirname, '../schemas/ubl2.4/xslt/html/tailwind.min.css');

let cachedTailwindStylesheet: string | null = null;

function getTailwindStylesheet() {
    if (cachedTailwindStylesheet === null) {
        cachedTailwindStylesheet = readFileSync(TAILWIND_STYLESHEET_PATH, 'utf8');
    }

    return cachedTailwindStylesheet;
}

export function inlineTailwindStylesheet(html: string): string {
    const tailwindStylesheet = getTailwindStylesheet().replace(/<\/style/gi, '<\\/style');

    return html.replace(TAILWIND_STYLESHEET_LINK, `<style>${tailwindStylesheet}</style>`);
}