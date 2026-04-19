import express, { type NextFunction, type Request } from "express";
import request from "supertest";
import aiRoutes from "../../../../src/api/v2/ai/ai.routes";

jest.mock("../../../../src/middleware/auth.middleware", () => ({
    authMiddleware: (req: Request, _res: unknown, next: NextFunction) => {
        (req as Request & { user?: { userId: string; email: string; twoFactorVerified: boolean } }).user = {
            userId: "507f1f77bcf86cd799439011",
            email: "a@b.com",
            twoFactorVerified: true,
        };
        next();
    },
}));

jest.mock("../../../../src/api/v2/ai/ai.service", () => ({
    extractDocumentFields: jest.fn().mockResolvedValue({ currency: "AUD" }),
    streamChatCompletion: jest.fn().mockImplementation(
        async (_a: unknown, _b: unknown, _c: unknown, _d: unknown, onChunk: (t: string) => void, _n: unknown, onDone: () => void) => {
            onChunk("ok");
            onDone();
        }
    ),
}));

describe("ai.routes", () => {
    const originalGemini = process.env.GEMINI_API_KEY;
    const app = express();
    app.use(express.json());
    app.use("/ai", aiRoutes);

    beforeAll(() => {
        process.env.GEMINI_API_KEY = "k";
    });

    afterAll(() => {
        process.env.GEMINI_API_KEY = originalGemini;
    });

    it("returns 400 when extract upload has unsupported mime type", async () => {
        const res = await request(app)
            .post("/ai/extract")
            .attach("file", Buffer.from("x"), { filename: "bad.exe", contentType: "application/octet-stream" });

        expect(res.status).toBe(400);
        expect(res.body.message).toMatch(/Unsupported file type/i);
    });

    it("POST /ai/chat returns SSE when configured", async () => {
        const res = await request(app)
            .post("/ai/chat")
            .set("Content-Type", "application/json")
            .send({ messages: [{ role: "user", content: "hi" }] });

        expect(res.status).toBe(200);
        expect(res.headers["content-type"]).toMatch(/text\/event-stream/);
        expect(res.text).toContain("ok");
    });
});
