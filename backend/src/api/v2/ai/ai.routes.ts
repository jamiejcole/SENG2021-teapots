import { Router, Request, Response, NextFunction } from "express";
import { authMiddleware } from "../../../middleware/auth.middleware";
import { uploadMiddleware, extractDocument, chat } from "./ai.controller";

const router = Router();

router.use(authMiddleware);

/**
 * @openapi
 * /api/v2/ai/extract:
 *   post:
 *     summary: Extract invoice or order fields from an uploaded document
 *     tags: [AI]
 *     security:
 *       - BearerAuth: []
 *     requestBody:
 *       required: true
 *       content:
 *         multipart/form-data:
 *           schema:
 *             type: object
 *             required:
 *               - file
 *             properties:
 *               file:
 *                 type: string
 *                 format: binary
 *                 description: PDF, image, or XML document to analyse
 *     responses:
 *       200:
 *         description: Structured fields extracted successfully
 *         content:
 *           application/json:
 *             schema:
 *               $ref: '#/components/schemas/AIDocumentExtractionResponse'
 *       400:
 *         description: Invalid upload or unsupported file type
 *         content:
 *           application/json:
 *             schema:
 *               $ref: '#/components/schemas/ErrorResponse'
 *       401:
 *         description: Unauthorized - missing or invalid authentication
 *         content:
 *           application/json:
 *             schema:
 *               $ref: '#/components/schemas/ErrorResponse'
 *       503:
 *         description: AI service is not configured
 *         content:
 *           application/json:
 *             schema:
 *               $ref: '#/components/schemas/ErrorResponse'
 */
router.post(
    "/extract",
    (req: Request, res: Response, next: NextFunction) => {
        uploadMiddleware(req, res, (err) => {
            if (err) {
                res.status(400).json({ error: "BAD_REQUEST", message: (err as Error).message });
                return;
            }
            next();
        });
    },
    extractDocument
);

/**
 * @openapi
 * /api/v2/ai/chat:
 *   post:
 *     summary: Stream AI chat responses for the authenticated user
 *     tags: [AI]
 *     security:
 *       - BearerAuth: []
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             $ref: '#/components/schemas/AIChatRequest'
 *     responses:
 *       200:
 *         description: Server-sent events stream containing assistant text chunks, navigation hints, and completion events
 *         content:
 *           text/event-stream:
 *             schema:
 *               $ref: '#/components/schemas/AIChatStreamEvent'
 *       400:
 *         description: Invalid message payload
 *         content:
 *           application/json:
 *             schema:
 *               $ref: '#/components/schemas/ErrorResponse'
 *       401:
 *         description: Unauthorized - missing or invalid authentication
 *         content:
 *           application/json:
 *             schema:
 *               $ref: '#/components/schemas/ErrorResponse'
 *       503:
 *         description: AI service is not configured
 *         content:
 *           application/json:
 *             schema:
 *               $ref: '#/components/schemas/ErrorResponse'
 */
router.post("/chat", chat);

export default router;
