import { GoogleGenAI, Type, createPartFromFunctionResponse, type Tool, type Schema, type Part } from "@google/genai";
import mongoose from "mongoose";
import { InvoiceModel } from "../../../models/invoice.model";
import { OrderModel } from "../../../models/order.model";
import { DespatchModel } from "../../../models/despatch.model";
import {
    type NavSuggestion,
    finalizeNavigationSuggestions,
    resolveNavKeys,
} from "./chatNavigation";

const MODEL = "gemini-2.5-flash";

function getClient() {
    return new GoogleGenAI({ apiKey: process.env.GEMINI_API_KEY ?? "" });
}

async function withRetry<T>(fn: () => Promise<T>, maxAttempts = 3): Promise<T> {
    for (let attempt = 1; attempt <= maxAttempts; attempt++) {
        try {
            return await fn();
        } catch (err) {
            const msg = err instanceof Error ? err.message : String(err);
            const is429 = msg.includes("429") || msg.toLowerCase().includes("quota") || msg.toLowerCase().includes("too many requests");
            if (is429 && attempt < maxAttempts) {
                const delayMs = attempt * 20000;
                console.warn(`[ai] Rate limited (429), retrying in ${delayMs / 1000}s (attempt ${attempt}/${maxAttempts})`);
                await new Promise((res) => setTimeout(res, delayMs));
                continue;
            }
            console.error(`[ai] Gemini call failed (attempt ${attempt}):`, msg);
            throw err;
        }
    }
    throw new Error("Max retry attempts reached");
}

// ---------- Document Extraction ----------

export interface ExtractedDocumentFields {
    buyer?: {
        name?: string;
        address?: { street?: string; city?: string; postalCode?: string; country?: string };
    };
    seller?: {
        name?: string;
        address?: { street?: string; city?: string; postalCode?: string; country?: string };
    };
    lines?: Array<{
        description?: string;
        quantity?: number;
        unitPrice?: number;
        taxRate?: number;
    }>;
    currency?: string;
    issueDate?: string;
    orderReference?: string;
}

const EXTRACTION_RESPONSE_SCHEMA = {
    type: Type.OBJECT,
    properties: {
        buyer: {
            type: Type.OBJECT,
            properties: {
                name: { type: Type.STRING },
                address: {
                    type: Type.OBJECT,
                    properties: {
                        street: { type: Type.STRING },
                        city: { type: Type.STRING },
                        postalCode: { type: Type.STRING },
                        country: { type: Type.STRING },
                    },
                    required: ["street", "city", "postalCode", "country"],
                },
            },
            required: ["name", "address"],
        },
        seller: {
            type: Type.OBJECT,
            properties: {
                name: { type: Type.STRING },
                address: {
                    type: Type.OBJECT,
                    properties: {
                        street: { type: Type.STRING },
                        city: { type: Type.STRING },
                        postalCode: { type: Type.STRING },
                        country: { type: Type.STRING },
                    },
                    required: ["street", "city", "postalCode", "country"],
                },
            },
            required: ["name", "address"],
        },
        lines: {
            type: Type.ARRAY,
            items: {
                type: Type.OBJECT,
                properties: {
                    description: { type: Type.STRING },
                    quantity: { type: Type.NUMBER },
                    unitPrice: { type: Type.NUMBER },
                    taxRate: { type: Type.NUMBER },
                },
                required: ["description", "quantity", "unitPrice", "taxRate"],
            },
        },
        currency: { type: Type.STRING },
        issueDate: { type: Type.STRING },
        orderReference: { type: Type.STRING },
    },
    required: ["buyer", "seller", "lines", "currency", "issueDate", "orderReference"],
};

const EXTRACTION_SYSTEM = `You are a document data extraction assistant. Extract structured invoice or order fields from the provided document.
The document may be a PDF (including scanned/image-based PDFs), an image of an invoice or receipt, or an XML file.
Use OCR and vision capabilities as needed to read all text in the document.
Rules:
- Use empty strings for text fields you cannot find.
- Use 0 for numeric fields you cannot find.
- For issueDate, use YYYY-MM-DD format.
- For currency, use ISO 4217 codes (e.g. AUD, USD, EUR, GBP).
- Extract ALL line items you find, each with description, quantity, unitPrice, and taxRate (as decimal, e.g. 0.1 for 10%).
- If a field is ambiguous, make your best guess based on context.`;

export async function extractDocumentFields(
    fileBuffer: Buffer,
    mimeType: string
): Promise<ExtractedDocumentFields> {
    const ai = getClient();

    type ContentPart =
        | { text: string }
        | { inlineData: { mimeType: string; data: string } };

    let parts: ContentPart[];
    const base64 = fileBuffer.toString("base64");

    if (mimeType === "application/pdf" || mimeType.startsWith("image/")) {
        // Send PDFs and images directly to Gemini — it handles both text PDFs
        // and scanned/image-based PDFs natively via vision + built-in OCR.
        parts = [
            { text: "Extract all invoice/order fields from this document:" },
            { inlineData: { mimeType, data: base64 } },
        ];
    } else {
        // XML and other text-based formats
        const text = fileBuffer.toString("utf8").slice(0, 15000);
        parts = [{ text: `Extract invoice/order fields from this document:\n\n${text}` }];
    }

    const response = await withRetry(() =>
        ai.models.generateContent({
            model: MODEL,
            contents: [{ role: "user", parts }],
            config: {
                systemInstruction: EXTRACTION_SYSTEM,
                responseMimeType: "application/json",
                responseSchema: EXTRACTION_RESPONSE_SCHEMA,
            },
        })
    );

    const raw = response.text ?? "{}";
    return JSON.parse(raw) as ExtractedDocumentFields;
}

// ---------- Chatbot ----------

type ChatMessage = { role: "user" | "assistant"; content: string };

function userOid(userId: string) {
    if (!mongoose.Types.ObjectId.isValid(userId)) return null;
    return new mongoose.Types.ObjectId(userId);
}

async function getInvoiceSummary(userId: string) {
    const uid = userOid(userId);
    if (!uid) return { error: "Invalid user" };
    const results = await InvoiceModel.aggregate([
        { $match: { createdBy: uid } },
        {
            $group: {
                _id: "$lifecycleStatus",
                count: { $sum: 1 },
                totalAmount: { $sum: "$totals.payableAmount" },
            },
        },
    ]).exec();
    return results.map((r) => ({ status: r._id, count: r.count, totalAmount: r.totalAmount }));
}

async function searchInvoices(
    userId: string,
    params: { buyerName?: string; status?: string; fromDate?: string; toDate?: string }
) {
    const uid = userOid(userId);
    if (!uid) return { error: "Invalid user" };

    const filter: Record<string, unknown> = { createdBy: uid };
    if (params.status) filter.lifecycleStatus = params.status;
    if (params.buyerName) filter["buyer.name"] = { $regex: params.buyerName, $options: "i" };
    if (params.fromDate || params.toDate) {
        filter.issueDate = {};
        if (params.fromDate) (filter.issueDate as Record<string, string>).$gte = params.fromDate;
        if (params.toDate) (filter.issueDate as Record<string, string>).$lte = params.toDate;
    }

    const docs = await InvoiceModel.find(filter)
        .sort({ createdAt: -1 })
        .limit(10)
        .select("invoiceId issueDate buyer seller totals lifecycleStatus currency")
        .lean()
        .exec();

    return docs.map((d) => ({
        invoiceId: d.invoiceId,
        issueDate: d.issueDate,
        buyer: d.buyer?.name,
        seller: d.seller?.name,
        amount: d.totals?.payableAmount,
        currency: d.currency,
        status: d.lifecycleStatus,
    }));
}

async function getOrderSummary(userId: string) {
    const uid = userOid(userId);
    if (!uid) return { error: "Invalid user" };
    const results = await OrderModel.aggregate([
        { $match: { createdBy: uid } },
        { $group: { _id: "$orderStatus", count: { $sum: 1 } } },
    ]).exec();
    return results.map((r) => ({ status: r._id, count: r.count }));
}

async function searchOrders(
    userId: string,
    params: { buyerName?: string; sellerName?: string; status?: string }
) {
    const uid = userOid(userId);
    if (!uid) return { error: "Invalid user" };

    const filter: Record<string, unknown> = { createdBy: uid };
    if (params.status) filter.orderStatus = params.status;
    if (params.buyerName) filter["buyer.name"] = { $regex: params.buyerName, $options: "i" };
    if (params.sellerName) filter["seller.name"] = { $regex: params.sellerName, $options: "i" };

    const docs = await OrderModel.find(filter)
        .sort({ updatedAt: -1 })
        .limit(10)
        .select("orderId issueDate buyer seller totals orderStatus currency")
        .lean()
        .exec();

    return docs.map((d) => ({
        orderId: d.orderId,
        issueDate: d.issueDate,
        buyer: d.buyer?.name,
        seller: d.seller?.name,
        amount: d.totals?.payableAmount,
        currency: d.currency,
        status: d.orderStatus,
    }));
}

async function getDespatchSummary(userId: string) {
    const uid = userOid(userId);
    if (!uid) return { error: "Invalid user" };
    const results = await DespatchModel.aggregate([
        { $match: { createdBy: uid } },
        { $group: { _id: "$despatchStatus", count: { $sum: 1 } } },
    ]).exec();
    return results.map((r) => ({ status: r._id, count: r.count }));
}

const CHAT_TOOLS: Tool[] = [
    {
        functionDeclarations: [
            {
                name: "get_invoice_summary",
                description: "Get a count of the user's invoices grouped by lifecycle status with total amounts. Use for questions about outstanding, paid, sent invoices etc.",
                parameters: { type: Type.OBJECT, properties: {} as Record<string, Schema> },
            },
            {
                name: "search_invoices",
                description: "Search the user's invoices by buyer name, lifecycle status, or date range. Returns up to 10 results.",
                parameters: {
                    type: Type.OBJECT,
                    properties: {
                        buyerName: { type: Type.STRING, description: "Partial buyer name to search for" } as Schema,
                        status: { type: Type.STRING, description: "Invoice lifecycle status: DRAFT, SAVED, VALIDATED, SENT, SEND_FAILED, PAID, or OVERDUE" } as Schema,
                        fromDate: { type: Type.STRING, description: "Start date YYYY-MM-DD" } as Schema,
                        toDate: { type: Type.STRING, description: "End date YYYY-MM-DD" } as Schema,
                    } as Record<string, Schema>,
                },
            },
            {
                name: "get_order_summary",
                description: "Get a count of the user's orders grouped by status. Use for questions about open, cancelled, fulfilled orders.",
                parameters: { type: Type.OBJECT, properties: {} as Record<string, Schema> },
            },
            {
                name: "search_orders",
                description: "Search the user's orders by buyer name, seller name, or status. Returns up to 10 results.",
                parameters: {
                    type: Type.OBJECT,
                    properties: {
                        buyerName: { type: Type.STRING, description: "Partial buyer name" } as Schema,
                        sellerName: { type: Type.STRING, description: "Partial seller name" } as Schema,
                        status: { type: Type.STRING, description: "Order status: draft, created, cancelled, fulfilled, or partially_fulfilled" } as Schema,
                    } as Record<string, Schema>,
                },
            },
            {
                name: "get_despatch_summary",
                description: "Get a count of the user's despatch notices grouped by status.",
                parameters: { type: Type.OBJECT, properties: {} as Record<string, Schema> },
            },
            {
                name: "suggest_navigation",
                description:
                    "Call when the user's question clearly relates to a specific area of the Teapots app so they can open the right page. Use 1–3 route keys from the allowed list. Do not invent URLs.",
                parameters: {
                    type: Type.OBJECT,
                    properties: {
                        routes: {
                            type: Type.ARRAY,
                            items: { type: Type.STRING },
                            description:
                                "Most relevant first. Allowed keys: dashboard, invoice_studio, orders, orders_create, despatch, invoices, generate, validate, account, settings, support, privacy, terms.",
                        } as Schema,
                    } as Record<string, Schema>,
                    required: ["routes"],
                },
            },
        ],
    },
];

async function executeToolCall(
    toolName: string,
    args: Record<string, unknown>,
    userId: string,
    navAcc: { items: NavSuggestion[] }
): Promise<string> {
    let result: unknown;
    switch (toolName) {
        case "get_invoice_summary": result = await getInvoiceSummary(userId); break;
        case "search_invoices": result = await searchInvoices(userId, args as Parameters<typeof searchInvoices>[1]); break;
        case "get_order_summary": result = await getOrderSummary(userId); break;
        case "search_orders": result = await searchOrders(userId, args as Parameters<typeof searchOrders>[1]); break;
        case "get_despatch_summary": result = await getDespatchSummary(userId); break;
        case "suggest_navigation": {
            const raw = args.routes;
            const resolved = resolveNavKeys(Array.isArray(raw) ? raw : []);
            for (const n of resolved) {
                if (!navAcc.items.some((x) => x.to === n.to)) navAcc.items.push(n);
            }
            result = { ok: true, acceptedRoutes: resolved.length };
            break;
        }
        default: result = { error: "Unknown tool" };
    }
    return JSON.stringify(result);
}

function buildSystemInstruction(userName: string, userCompany: string): string {
    const today = new Date().toISOString().slice(0, 10);
    return `You are a helpful assistant for the Teapots UBL Invoicing Platform.
The logged-in user is ${userName}${userCompany ? ` from ${userCompany}` : ""}. Today is ${today}.
You help users understand their invoices, orders, and despatch notices.
You can look up their data using the provided tools.
When the user's question clearly relates to a specific app area (e.g. viewing invoices, creating orders, despatch, validation, settings), call suggest_navigation with 1–3 relevant route keys from the tool description so they can open the right page. You may combine suggest_navigation with other tools in the same turn when appropriate.
When answering about amounts, always include the currency if available.
For PEPPOL/UBL questions, explain concepts clearly in plain language.
Keep responses concise and actionable.`;
}

export async function streamChatCompletion(
    userId: string,
    userName: string,
    userCompany: string,
    messages: ChatMessage[],
    onChunk: (text: string) => void,
    onNavigation: (items: NavSuggestion[]) => void,
    onDone: () => void
): Promise<void> {
    const ai = getClient();
    const systemInstruction = buildSystemInstruction(userName, userCompany);

    // Convert history (all except last message) to Gemini format
    const history = messages.slice(0, -1).map((m) => ({
        role: m.role === "assistant" ? "model" : "user",
        parts: [{ text: m.content }],
    }));

    const lastMsg = messages[messages.length - 1];
    const lastText = lastMsg?.content ?? "";

    const navAcc: { items: NavSuggestion[] } = { items: [] };

    const chat = ai.chats.create({
        model: MODEL,
        config: { systemInstruction, tools: CHAT_TOOLS },
        history,
    });

    // Tool-call loop (up to 3 rounds)
    let nextMessage: Part[] | string = lastText;

    const finish = () => {
        const nav = finalizeNavigationSuggestions(navAcc.items, lastText);
        onNavigation(nav);
        onDone();
    };

    for (let round = 0; round < 3; round++) {
        const response = await withRetry(() => chat.sendMessage({ message: nextMessage }));

        const functionCalls = response.functionCalls ?? [];
        if (functionCalls.length === 0) {
            const text = response.text ?? "";
            if (text) onChunk(text);
            finish();
            return;
        }

        // Execute all tool calls and build properly-typed Part[]
        const toolParts: Part[] = [];
        for (const fc of functionCalls) {
            const toolResult = await executeToolCall(
                fc.name ?? "",
                (fc.args ?? {}) as Record<string, unknown>,
                userId,
                navAcc
            );
            toolParts.push(
                createPartFromFunctionResponse(
                    fc.id ?? fc.name ?? "",
                    fc.name ?? "",
                    { result: toolResult }
                )
            );
        }

        nextMessage = toolParts;
    }

    // Final answer after max tool rounds
    const finalResponse = await withRetry(() => chat.sendMessage({ message: nextMessage }));
    const finalText = finalResponse.text ?? "";
    if (finalText) onChunk(finalText);
    finish();
}
