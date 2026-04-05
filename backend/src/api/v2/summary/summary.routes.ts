import { Router } from "express";
import * as controller from "./summary.controller";
import { authMiddleware } from "../../../middleware/auth.middleware";

const router = Router();

router.use(authMiddleware);

router.post("/", controller.generateSummary);

export default router;
