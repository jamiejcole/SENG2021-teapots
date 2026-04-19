import type { Response } from "express";
import { HttpError } from "../../../../src/errors/HttpError";
import * as aiService from "../../../../src/api/v2/ai/ai.service";
import { extractDocument, chat } from "../../../../src/api/v2/ai/ai.controller";

jest.mock("../../../../src/api/v2/ai/ai.service", () => ({
    extractDocumentFields: jest.fn(),
    streamChatCompletion: jest.fn(),
}));

const mockedService = aiService as jest.Mocked<typeof aiService>;

describe("ai.controller", () => {
    const originalGemini = process.env.GEMINI_API_KEY;

    beforeAll(() => {
        process.env.GEMINI_API_KEY = "test-key";
    });

    afterAll(() => {
        process.env.GEMINI_API_KEY = originalGemini;
    });

    beforeEach(() => {
        jest.clearAllMocks();
    });

    function createRes() {
        const res: Record<string, unknown> = {};
        res.status = jest.fn().mockReturnValue(res);
        res.json = jest.fn().mockReturnValue(res);
        res.setHeader = jest.fn().mockReturnValue(res);
        res.write = jest.fn().mockReturnValue(true);
        res.end = jest.fn();
        res.flushHeaders = jest.fn();
        res.writableEnded = false;
        return res as unknown as Response;
    }

    describe("extractDocument", () => {
        it("requires a file", async () => {
            const next = jest.fn();
            await extractDocument({} as Parameters<typeof extractDocument>[0], createRes(), next);
            expect(next).toHaveBeenCalledWith(expect.any(HttpError));
            expect((next.mock.calls[0][0] as HttpError).statusCode).toBe(400);
        });

        it("requires GEMINI_API_KEY", async () => {
            process.env.GEMINI_API_KEY = "";
            const next = jest.fn();
            await extractDocument(
                { file: { buffer: Buffer.from("x"), mimetype: "application/pdf" } } as Parameters<
                    typeof extractDocument
                >[0],
                createRes(),
                next
            );
            expect(next).toHaveBeenCalledWith(expect.any(HttpError));
            expect((next.mock.calls[0][0] as HttpError).statusCode).toBe(503);
            process.env.GEMINI_API_KEY = "test-key";
        });

        it("returns extracted fields on success", async () => {
            mockedService.extractDocumentFields.mockResolvedValue({
                currency: "AUD",
            } as Awaited<ReturnType<typeof aiService.extractDocumentFields>>);

            const res = createRes();
            const next = jest.fn();

            await extractDocument(
                { file: { buffer: Buffer.from("x"), mimetype: "application/pdf" } } as Parameters<
                    typeof extractDocument
                >[0],
                res,
                next
            );

            expect(mockedService.extractDocumentFields).toHaveBeenCalled();
            expect(res.status).toHaveBeenCalledWith(200);
            expect(res.json).toHaveBeenCalledWith({ fields: { currency: "AUD" } });
            expect(next).not.toHaveBeenCalled();
        });
    });

    describe("chat", () => {
        it("requires GEMINI_API_KEY", async () => {
            process.env.GEMINI_API_KEY = "";
            const next = jest.fn();
            await chat(
                { body: { messages: [{ role: "user", content: "hi" }] }, user: { userId: "u1" } } as Parameters<
                    typeof chat
                >[0],
                createRes(),
                next
            );
            expect((next.mock.calls[0][0] as HttpError).statusCode).toBe(503);
            process.env.GEMINI_API_KEY = "test-key";
        });

        it("requires authentication", async () => {
            const next = jest.fn();
            await chat({ body: { messages: [{ role: "user", content: "hi" }] } } as Parameters<typeof chat>[0], createRes(), next);
            expect((next.mock.calls[0][0] as HttpError).statusCode).toBe(401);
        });

        it("validates messages array", async () => {
            const next = jest.fn();
            await chat(
                { body: {}, user: { userId: "u1", email: "a@b.com" } } as Parameters<typeof chat>[0],
                createRes(),
                next
            );
            expect((next.mock.calls[0][0] as HttpError).statusCode).toBe(400);
        });

        it("rejects when no valid messages remain after filtering", async () => {
            const next = jest.fn();
            await chat(
                {
                    body: { messages: [{ role: "system", content: "x" }] },
                    user: { userId: "u1", email: "a@b.com" },
                } as Parameters<typeof chat>[0],
                createRes(),
                next
            );
            expect((next.mock.calls[0][0] as HttpError).statusCode).toBe(400);
        });

        it("streams SSE chunks and done", async () => {
            mockedService.streamChatCompletion.mockImplementation(
                async (_uid, _name, _company, _msgs, onChunk, onNavigation, onDone) => {
                    onChunk("Hello");
                    onNavigation([{ to: "/invoices", label: "Invoices" }]);
                    onDone();
                }
            );

            const res = createRes();
            const next = jest.fn();

            await chat(
                {
                    body: { messages: [{ role: "user", content: "show invoices" }] },
                    user: { userId: "507f1f77bcf86cd799439011", email: "a@b.com" },
                } as Parameters<typeof chat>[0],
                res,
                next
            );

            expect(mockedService.streamChatCompletion).toHaveBeenCalled();
            expect(res.setHeader).toHaveBeenCalledWith("Content-Type", "text/event-stream");
            expect(res.write).toHaveBeenCalledWith(expect.stringContaining("Hello"));
            expect(res.write).toHaveBeenCalledWith(expect.stringContaining("navigation"));
            expect(res.write).toHaveBeenCalledWith(expect.stringContaining('"done":true'));
            expect(res.end).toHaveBeenCalled();
            expect(next).not.toHaveBeenCalled();
        });

        it("writes SSE error when streamChatCompletion throws", async () => {
            const errLog = jest.spyOn(console, "error").mockImplementation(() => undefined);
            mockedService.streamChatCompletion.mockRejectedValue(new Error("Gemini down"));
            const res = createRes();
            const next = jest.fn();

            await chat(
                {
                    body: { messages: [{ role: "user", content: "hi" }] },
                    user: { userId: "u1", email: "a@b.com" },
                } as Parameters<typeof chat>[0],
                res,
                next
            );

            expect(res.write).toHaveBeenCalledWith(expect.stringContaining("Gemini down"));
            expect(res.end).toHaveBeenCalled();
            expect(next).not.toHaveBeenCalled();
            errLog.mockRestore();
        });

        it("skips navigation SSE when list is empty", async () => {
            mockedService.streamChatCompletion.mockImplementation(
                async (_uid, _name, _company, _msgs, onChunk, onNavigation, onDone) => {
                    onChunk("x");
                    onNavigation([]);
                    onDone();
                }
            );

            const res = createRes();
            await chat(
                {
                    body: { messages: [{ role: "user", content: "hi" }] },
                    user: { userId: "u1", email: "a@b.com" },
                } as Parameters<typeof chat>[0],
                res,
                jest.fn()
            );

            const writes = (res.write as jest.Mock).mock.calls.map((c) => c[0] as string);
            expect(writes.some((w) => w.includes("navigation"))).toBe(false);
        });
    });
});
