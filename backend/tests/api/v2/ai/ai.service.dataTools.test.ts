/**
 * Isolated module reloads so mongoose model mocks do not leak to other test files.
 */
describe("streamChatCompletion data tools (mocked DB)", () => {
    const validUserId = "507f1f77bcf86cd799439011";
    const originalKey = process.env.GEMINI_API_KEY;

    beforeAll(() => {
        process.env.GEMINI_API_KEY = "test-key";
    });

    afterAll(() => {
        process.env.GEMINI_API_KEY = originalKey;
    });

    const chain = {
        sort: jest.fn().mockReturnThis(),
        limit: jest.fn().mockReturnThis(),
        select: jest.fn().mockReturnThis(),
        lean: jest.fn().mockReturnThis(),
        exec: jest.fn().mockResolvedValue([]),
    };

    async function loadStreamWithMocks(toolName: string, toolArgs: Record<string, unknown>) {
        jest.resetModules();
        const sendMessage = jest.fn();

        jest.doMock("@google/genai", () => {
            const actual = jest.requireActual<typeof import("@google/genai")>("@google/genai");
            return {
                ...actual,
                GoogleGenAI: jest.fn().mockImplementation(
                    () =>
                        ({
                            chats: {
                                create: jest.fn(() => ({ sendMessage })),
                            },
                        }) as unknown as import("@google/genai").GoogleGenAI
                ),
            };
        });

        jest.doMock("../../../../src/models/invoice.model", () => ({
            InvoiceModel: {
                aggregate: jest.fn().mockReturnValue({
                    exec: jest.fn().mockResolvedValue([{ _id: "SENT", count: 1, totalAmount: 50 }]),
                }),
                find: jest.fn().mockReturnValue(chain),
            },
        }));

        jest.doMock("../../../../src/models/order.model", () => ({
            OrderModel: {
                aggregate: jest.fn().mockReturnValue({
                    exec: jest.fn().mockResolvedValue([{ _id: "created", count: 2 }]),
                }),
                find: jest.fn().mockReturnValue(chain),
            },
        }));

        jest.doMock("../../../../src/models/despatch.model", () => ({
            DespatchModel: {
                aggregate: jest.fn().mockReturnValue({
                    exec: jest.fn().mockResolvedValue([{ _id: "sent", count: 3 }]),
                }),
            },
        }));

        const { streamChatCompletion } = await import("../../../../src/api/v2/ai/ai.service");

        sendMessage
            .mockResolvedValueOnce({
                functionCalls: [
                    {
                        name: toolName,
                        args: toolArgs,
                        id: "tool-1",
                    },
                ],
                text: "",
            })
            .mockResolvedValueOnce({
                functionCalls: [],
                text: "Here is what I found.",
            });

        const chunks: string[] = [];
        await streamChatCompletion(
            validUserId,
            "u@example.com",
            "",
            [{ role: "user", content: "question" }],
            (t) => chunks.push(t),
            () => undefined,
            () => undefined
        );

        return { chunks };
    }

    it("executes get_invoice_summary", async () => {
        const { chunks } = await loadStreamWithMocks("get_invoice_summary", {});
        expect(chunks.join("")).toContain("Here is what I found");
    });

    it("executes search_invoices with filters", async () => {
        const { chunks } = await loadStreamWithMocks("search_invoices", {
            buyerName: "Acme",
            status: "SENT",
            fromDate: "2026-01-01",
            toDate: "2026-12-31",
        });
        expect(chunks.length).toBeGreaterThan(0);
    });

    it("executes get_order_summary", async () => {
        const { chunks } = await loadStreamWithMocks("get_order_summary", {});
        expect(chunks.join("")).toContain("Here is what I found");
    });

    it("executes search_orders", async () => {
        const { chunks } = await loadStreamWithMocks("search_orders", {
            buyerName: "Bob",
            sellerName: "Seller",
            status: "created",
        });
        expect(chunks.length).toBeGreaterThan(0);
    });

    it("executes get_despatch_summary", async () => {
        const { chunks } = await loadStreamWithMocks("get_despatch_summary", {});
        expect(chunks.join("")).toContain("Here is what I found");
    });

    it("returns invalid user for bad user id when tools run", async () => {
        jest.resetModules();
        const sendMessage = jest.fn();
        jest.doMock("@google/genai", () => {
            const actual = jest.requireActual<typeof import("@google/genai")>("@google/genai");
            return {
                ...actual,
                GoogleGenAI: jest.fn().mockImplementation(
                    () =>
                        ({
                            chats: {
                                create: jest.fn(() => ({ sendMessage })),
                            },
                        }) as unknown as import("@google/genai").GoogleGenAI
                ),
            };
        });
        jest.doMock("../../../../src/models/invoice.model", () => ({
            InvoiceModel: { aggregate: jest.fn(), find: jest.fn() },
        }));
        jest.doMock("../../../../src/models/order.model", () => ({
            OrderModel: { aggregate: jest.fn(), find: jest.fn() },
        }));
        jest.doMock("../../../../src/models/despatch.model", () => ({
            DespatchModel: { aggregate: jest.fn() },
        }));

        const { streamChatCompletion } = await import("../../../../src/api/v2/ai/ai.service");

        sendMessage
            .mockResolvedValueOnce({
                functionCalls: [{ name: "get_invoice_summary", args: {}, id: "t1" }],
                text: "",
            })
            .mockResolvedValueOnce({ functionCalls: [], text: "Done." });

        const chunks: string[] = [];
        await streamChatCompletion(
            "not-a-valid-objectid",
            "u",
            "",
            [{ role: "user", content: "x" }],
            (t) => chunks.push(t),
            () => undefined,
            () => undefined
        );

        expect(chunks.join("")).toContain("Done.");
    });
});
