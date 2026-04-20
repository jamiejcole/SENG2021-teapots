import { GoogleGenAI } from "@google/genai";
import { extractDocumentFields } from "../../../../src/api/v2/ai/ai.service";

const extractionJson = JSON.stringify({
    buyer: {
        name: "Buyer Co",
        address: { street: "1 St", city: "Sydney", postalCode: "2000", country: "AU" },
    },
    seller: {
        name: "Seller Co",
        address: { street: "2 Rd", city: "Melbourne", postalCode: "3000", country: "AU" },
    },
    lines: [{ description: "Item", quantity: 1, unitPrice: 10, taxRate: 0.1 }],
    currency: "AUD",
    issueDate: "2026-01-15",
    orderReference: "ORD-1",
});

jest.mock("@google/genai", () => {
    const actual = jest.requireActual<typeof import("@google/genai")>("@google/genai");
    return {
        ...actual,
        GoogleGenAI: jest.fn(),
    };
});

const MockedGoogleGenAI = GoogleGenAI as jest.MockedClass<typeof GoogleGenAI>;

describe("extractDocumentFields", () => {
    const originalKey = process.env.GEMINI_API_KEY;
    let generateContent: jest.Mock;

    beforeAll(() => {
        process.env.GEMINI_API_KEY = "test-key";
    });

    afterAll(() => {
        process.env.GEMINI_API_KEY = originalKey;
    });

    beforeEach(() => {
        generateContent = jest.fn().mockResolvedValue({ text: extractionJson });
        MockedGoogleGenAI.mockImplementation(
            () =>
                ({
                    models: {
                        generateContent,
                    },
                }) as unknown as GoogleGenAI
        );
    });

    it("uses inline vision parts for PDF mime type", async () => {
        const buf = Buffer.from("fake-pdf");
        const result = await extractDocumentFields(buf, "application/pdf");

        expect(generateContent).toHaveBeenCalledWith(
            expect.objectContaining({
                contents: [
                    {
                        role: "user",
                        parts: [
                            { text: "Extract all invoice/order fields from this document:" },
                            { inlineData: { mimeType: "application/pdf", data: buf.toString("base64") } },
                        ],
                    },
                ],
            })
        );
        expect(result.buyer?.name).toBe("Buyer Co");
    });

    it("uses text-only parts for XML mime type", async () => {
        const xml = '<?xml version="1.0"?><root><x>1</x></root>';
        const buf = Buffer.from(xml, "utf8");
        const result = await extractDocumentFields(buf, "application/xml");

        expect(generateContent).toHaveBeenCalledWith(
            expect.objectContaining({
                contents: [
                    {
                        role: "user",
                        parts: [{ text: expect.stringContaining("Extract invoice/order fields") }],
                    },
                ],
            })
        );
        expect(result.currency).toBe("AUD");
    });

    it("treats PNG as image and uses inline data", async () => {
        const buf = Buffer.from([0x89, 0x50]);
        await extractDocumentFields(buf, "image/png");

        expect(generateContent.mock.calls[0][0].contents[0].parts[1]).toEqual({
            inlineData: { mimeType: "image/png", data: buf.toString("base64") },
        });
    });
});
