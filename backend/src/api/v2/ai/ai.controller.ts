import { Request, Response } from "express";
import multer from "multer";
import { asyncHandler } from "../../../utils/asyncHandler";
import { HttpError } from "../../../errors/HttpError";
import { extractDocumentFields, streamChatCompletion } from "./ai.service";

const upload = multer({
    storage: multer.memoryStorage(),
    limits: { fileSize: 10 * 1024 * 1024 },
    fileFilter(_req, file, cb) {
        const allowed = [
            "application/pdf",
            "image/png",
            "image/jpeg",
            "image/webp",
            "image/gif",
            "text/xml",
            "application/xml",
        ];
        if (allowed.includes(file.mimetype)) {
            cb(null, true);
        } else {
            cb(new Error("Unsupported file type. Upload a PDF, image, or XML file."));
        }
    },
});

export const uploadMiddleware = upload.single("file");

export const extractDocument = asyncHandler(async (req: Request, res: Response) => {
    if (!req.file) {
        throw new HttpError(400, "No file uploaded. Include a 'file' field in your multipart request.");
    }

    if (!process.env.GEMINI_API_KEY) {
        throw new HttpError(503, "AI service is not configured.");
    }

    const fields = await extractDocumentFields(req.file.buffer, req.file.mimetype);
    res.status(200).json({ fields });
});

export const chat = asyncHandler(async (req: Request, res: Response) => {
    if (!process.env.GEMINI_API_KEY) {
        throw new HttpError(503, "AI service is not configured.");
    }

    const userId = req.user?.userId;
    if (!userId) throw new HttpError(401, "Authentication required");

    const { messages } = req.body as {
        messages?: Array<{ role: string; content: string }>;
    };

    if (!Array.isArray(messages) || messages.length === 0) {
        throw new HttpError(400, "Request body must include a non-empty 'messages' array.");
    }

    const validRoles = new Set(["user", "assistant"]);
    const cleaned = messages
        .filter((m) => validRoles.has(m.role) && typeof m.content === "string")
        .slice(-20) as Array<{ role: "user" | "assistant"; content: string }>;

    if (cleaned.length === 0) {
        throw new HttpError(400, "No valid messages found.");
    }

    const userName = req.user?.email ?? "User";
    const userCompany = "";

    res.setHeader("Content-Type", "text/event-stream");
    res.setHeader("Cache-Control", "no-cache");
    res.setHeader("X-Accel-Buffering", "no");
    res.flushHeaders();

    try {
        await streamChatCompletion(
            userId,
            userName,
            userCompany,
            cleaned,
            (text) => {
                if (!res.writableEnded) res.write(`data: ${JSON.stringify({ text })}\n\n`);
            },
            () => {
                if (!res.writableEnded) {
                    res.write(`data: ${JSON.stringify({ done: true })}\n\n`);
                    res.end();
                }
            }
        );
    } catch (err) {
        const msg = err instanceof Error ? err.message : "AI service error";
        console.error("[ai/chat] Gemini error:", err);
        if (!res.writableEnded) {
            res.write(`data: ${JSON.stringify({ error: msg })}\n\n`);
            res.end();
        }
    }
});
