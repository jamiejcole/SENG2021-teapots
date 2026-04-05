import { Router } from "express";
import authRoutes from "./auth/auth.routes";
import invoiceRoutes from "./invoices/invoices.routes";
import orderRoutes from "./orders/orders.routes";

const router = Router();

router.use("/auth", authRoutes);
router.use("/invoices", invoiceRoutes);
router.use("/orders", orderRoutes);

export default router;
