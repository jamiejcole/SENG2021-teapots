import { GoogleGenAI } from "@google/genai";
import { streamChatCompletion } from "../../../../src/api/v2/ai/ai.service";

jest.mock("@google/genai", () => {
    const actual = jest.requireActual<typeof import("@google/genai")>("@google/genai");
    return {
        ...actual,
        GoogleGenAI: jest.fn(),
    };
});

const MockedGoogleGenAI = GoogleGenAI as jest.MockedClass<typeof GoogleGenAI>;

describe("streamChatCompletion", () => {
    const originalKey = process.env.GEMINI_API_KEY;
    let sendMessage: jest.Mock;

    beforeAll(() => {
        process.env.GEMINI_API_KEY = "test-key";
    });

    afterAll(() => {
        process.env.GEMINI_API_KEY = originalKey;
    });

    beforeEach(() => {
        sendMessage = jest.fn();
        MockedGoogleGenAI.mockImplementation(
            () =>
                ({
                    chats: {
                        create: jest.fn(() => ({
                            sendMessage,
                        })),
                    },
                }) as unknown as GoogleGenAI
        );
    });

    it("streams model text when there are no tool calls", async () => {
        sendMessage.mockResolvedValueOnce({
            functionCalls: [],
            text: "Hello from the model.",
        });

        const chunks: string[] = [];
        const navs: { to: string; label: string }[][] = [];
        await streamChatCompletion(
            "507f1f77bcf86cd799439011",
            "user@example.com",
            "",
            [{ role: "user", content: "hi" }],
            (t) => chunks.push(t),
            (n) => navs.push(n),
            () => undefined
        );

        expect(chunks).toEqual(["Hello from the model."]);
        expect(sendMessage).toHaveBeenCalledTimes(1);
        expect(navs[navs.length - 1]?.length).toBeGreaterThanOrEqual(0);
    });

    it("runs suggest_navigation then streams the follow-up answer", async () => {
        sendMessage
            .mockResolvedValueOnce({
                functionCalls: [
                    {
                        name: "suggest_navigation",
                        args: { routes: ["invoices"] },
                        id: "c1",
                    },
                ],
                text: "",
            })
            .mockResolvedValueOnce({
                functionCalls: [],
                text: "Check the Invoices page.",
            });

        const chunks: string[] = [];
        const lastNav: { to: string; label: string }[] = [];
        await streamChatCompletion(
            "507f1f77bcf86cd799439011",
            "user@example.com",
            "",
            [{ role: "user", content: "where are my invoices" }],
            (t) => chunks.push(t),
            (n) => {
                lastNav.length = 0;
                lastNav.push(...n);
            },
            () => undefined
        );

        expect(chunks).toEqual(["Check the Invoices page."]);
        expect(lastNav).toContainEqual({ to: "/invoices", label: "Invoices" });
        expect(sendMessage).toHaveBeenCalledTimes(2);
    });

    it("handles unknown tool names and still completes", async () => {
        sendMessage
            .mockResolvedValueOnce({
                functionCalls: [{ name: "unknown_tool", args: {}, id: "bad" }],
                text: "",
            })
            .mockResolvedValueOnce({
                functionCalls: [],
                text: "Recovered.",
            });

        const chunks: string[] = [];
        await streamChatCompletion(
            "507f1f77bcf86cd799439011",
            "u",
            "",
            [{ role: "user", content: "test" }],
            (t) => chunks.push(t),
            () => undefined,
            () => undefined
        );

        expect(chunks).toEqual(["Recovered."]);
    });

    it("uses max tool rounds then sends a final answer", async () => {
        sendMessage
            .mockResolvedValueOnce({
                functionCalls: [{ name: "suggest_navigation", args: { routes: ["invoices"] }, id: "a" }],
                text: "",
            })
            .mockResolvedValueOnce({
                functionCalls: [{ name: "suggest_navigation", args: { routes: ["orders"] }, id: "b" }],
                text: "",
            })
            .mockResolvedValueOnce({
                functionCalls: [{ name: "suggest_navigation", args: { routes: ["dashboard"] }, id: "c" }],
                text: "",
            })
            .mockResolvedValueOnce({
                functionCalls: [],
                text: "Final summary.",
            });

        const chunks: string[] = [];
        await streamChatCompletion(
            "507f1f77bcf86cd799439011",
            "u",
            "",
            [{ role: "user", content: "nav" }],
            (t) => chunks.push(t),
            () => undefined,
            () => undefined
        );

        expect(chunks).toEqual(["Final summary."]);
        expect(sendMessage).toHaveBeenCalledTimes(4);
    });

    it("passes assistant history into the chat session", async () => {
        sendMessage.mockResolvedValueOnce({ functionCalls: [], text: "ok" });

        await streamChatCompletion(
            "507f1f77bcf86cd799439011",
            "u",
            "",
            [
                { role: "user", content: "first" },
                { role: "assistant", content: "reply" },
                { role: "user", content: "second" },
            ],
            () => undefined,
            () => undefined,
            () => undefined
        );

        expect(MockedGoogleGenAI.mock.results[0]?.value.chats.create).toHaveBeenCalledWith(
            expect.objectContaining({
                history: [
                    { role: "user", parts: [{ text: "first" }] },
                    { role: "model", parts: [{ text: "reply" }] },
                ],
            })
        );
    });
});
