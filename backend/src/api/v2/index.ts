import { Router } from "express";
import authRoutes from "./auth/auth.routes";
import invoiceRoutes from "./invoices/invoices.routes";
import orderRoutes from "./orders/orders.routes";
import despatchRoutes from "./despatch/despatch.routes";
import validateDocRoutes from "./validateDoc/validateDoc.routes";
import summaryRoutes from "./summary/summary.routes";

const router = Router();

router.use("/auth", authRoutes);
router.use("/invoices", invoiceRoutes);
router.use("/orders", orderRoutes);
router.use("/despatch", despatchRoutes);
router.use("/validate-doc", validateDocRoutes);
router.use("/summary", summaryRoutes);

export default router;
