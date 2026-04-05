import { Router } from "express";
import * as controller from "./validateDoc.controller";
import { authMiddleware } from "../../../middleware/auth.middleware";

const router = Router();

router.use(authMiddleware);

router.post("/:document-type", controller.validateDocument);

export default router;
