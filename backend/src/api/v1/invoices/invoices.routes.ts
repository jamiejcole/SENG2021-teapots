import { Router } from "express";
import * as controller from "./invoices.controller";
const router = Router();

router.post("/", controller.createInvoice);
router.post("/validate", controller.validateInvoice);

export default router;