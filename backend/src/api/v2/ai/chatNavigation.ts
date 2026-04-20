/**
 * Whitelisted in-app routes for chat "Go to …" suggestions.
 * Only these paths may be sent to the client.
 */

export type NavSuggestion = { to: string; label: string };

/** Keys match the `suggest_navigation` Gemini tool enum. */
export const NAV_ROUTE_KEYS = [
    "dashboard",
    "invoice_studio",
    "orders",
    "orders_create",
    "despatch",
    "invoices",
    "generate",
    "validate",
    "account",
    "settings",
    "support",
    "privacy",
    "terms",
] as const;

export type NavRouteKey = (typeof NAV_ROUTE_KEYS)[number];

const KEY_TO_NAV: Record<NavRouteKey, NavSuggestion> = {
    dashboard: { to: "/dashboard", label: "Overview" },
    invoice_studio: { to: "/invoice-studio", label: "Invoice Studio" },
    orders: { to: "/orders", label: "Orders" },
    orders_create: { to: "/orders/create", label: "Create order" },
    despatch: { to: "/despatch", label: "Despatches" },
    invoices: { to: "/invoices", label: "Invoices" },
    generate: { to: "/generate", label: "Generate invoice" },
    validate: { to: "/validate", label: "Validate order" },
    account: { to: "/account", label: "Account" },
    settings: { to: "/settings", label: "Settings" },
    support: { to: "/support", label: "Support" },
    privacy: { to: "/privacy", label: "Privacy policy" },
    terms: { to: "/terms", label: "Terms" },
};

const VALID_KEYS = new Set<string>(NAV_ROUTE_KEYS);

export function resolveNavKeys(keys: unknown[]): NavSuggestion[] {
    if (!Array.isArray(keys)) return [];
    const out: NavSuggestion[] = [];
    const seen = new Set<string>();
    for (const k of keys) {
        if (typeof k !== "string") continue;
        const normalized = k
            .trim()
            .toLowerCase()
            .replace(/^\/+/, "")
            .replace(/\//g, "_")
            .replace(/-/g, "_")
            .replace(/\s+/g, "_");
        if (!VALID_KEYS.has(normalized)) continue;
        const nav = KEY_TO_NAV[normalized as NavRouteKey];
        if (nav && !seen.has(nav.to)) {
            seen.add(nav.to);
            out.push({ ...nav });
        }
    }
    return out;
}

/** Keyword / phrase heuristics on the last user message (fallback when the model skips the tool). */
const KEYWORD_RULES: Array<{ nav: NavSuggestion; patterns: RegExp[] }> = [
    {
        nav: KEY_TO_NAV.invoice_studio,
        patterns: [/invoice studio/i, /\binvoice editor\b/i, /\bdesign invoice\b/i, /ubl template/i],
    },
    {
        nav: KEY_TO_NAV.generate,
        patterns: [/generate invoice/i, /new invoice/i, /create invoice/i, /make an invoice/i],
    },
    {
        nav: KEY_TO_NAV.invoices,
        patterns: [/invoice history/i, /my invoices/i, /past invoices/i, /list invoices/i, /sent invoices/i],
    },
    {
        nav: KEY_TO_NAV.orders_create,
        patterns: [/create order/i, /new order/i, /add order/i, /place order/i],
    },
    {
        nav: KEY_TO_NAV.orders,
        patterns: [/\borders\b/i, /my orders/i, /order list/i, /purchase order/i],
    },
    {
        nav: KEY_TO_NAV.despatch,
        patterns: [/despatch/i, /dispatch/i, /shipping notice/i, /shipment/i],
    },
    {
        nav: KEY_TO_NAV.validate,
        patterns: [/validate order/i, /validation/i, /xsd/i, /\bubl validation\b/i],
    },
    {
        nav: KEY_TO_NAV.dashboard,
        patterns: [/dashboard/i, /overview/i, /summary/i, /kpi/i, /statistics/i],
    },
    {
        nav: KEY_TO_NAV.account,
        patterns: [/my account/i, /profile/i, /password/i, /two[- ]factor/i, /\b2fa\b/i],
    },
    {
        nav: KEY_TO_NAV.settings,
        patterns: [/settings/i, /preferences/i, /configuration/i],
    },
    {
        nav: KEY_TO_NAV.support,
        patterns: [/support/i, /help/i, /contact/i],
    },
    {
        nav: KEY_TO_NAV.privacy,
        patterns: [/privacy/i],
    },
    {
        nav: KEY_TO_NAV.terms,
        patterns: [/terms of service/i, /\bterms\b/i],
    },
];

export function inferNavigationFromKeywords(userText: string, max = 3): NavSuggestion[] {
    const s = userText.trim();
    if (!s) return [];
    const out: NavSuggestion[] = [];
    const seen = new Set<string>();
    for (const { nav, patterns } of KEYWORD_RULES) {
        if (patterns.some((p) => p.test(s))) {
            if (!seen.has(nav.to)) {
                seen.add(nav.to);
                out.push({ ...nav });
                if (out.length >= max) break;
            }
        }
    }
    return out;
}

export function dedupeNav(items: NavSuggestion[]): NavSuggestion[] {
    const seen = new Set<string>();
    return items.filter((n) => {
        if (seen.has(n.to)) return false;
        seen.add(n.to);
        return true;
    });
}

export function finalizeNavigationSuggestions(
    fromTool: NavSuggestion[],
    lastUserMessage: string,
    max = 3
): NavSuggestion[] {
    let merged = dedupeNav(fromTool);
    if (merged.length === 0) {
        merged = inferNavigationFromKeywords(lastUserMessage, max);
    }
    return merged.slice(0, max);
}
