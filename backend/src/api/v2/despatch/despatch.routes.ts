import { Router } from "express";
import * as controller from "./despatch.controller";
import { authMiddleware } from "../../../middleware/auth.middleware";

const router = Router();

router.use(authMiddleware);

router.post("/create", controller.createDespatch);
router.get("/retrieve", controller.retrieveDespatch);
router.get("/list", controller.listDespatch);
router.post("/cancel/order", controller.cancelOrder);
router.get("/cancel/order", controller.getOrderCancellation);
router.post("/cancel/fulfilment", controller.cancelFulfilment);
router.get("/cancel/fulfilment", controller.getFulfilmentCancellation);

export default router;
