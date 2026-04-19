import { Router, Request, Response, NextFunction } from "express";
import { authMiddleware } from "../../../middleware/auth.middleware";
import { uploadMiddleware, extractDocument, chat } from "./ai.controller";

const router = Router();

router.use(authMiddleware);

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

router.post("/chat", chat);

export default router;
