import { Router } from "express";
import { authMiddleware } from "../../../middleware/auth.middleware";
import * as controller from "./despatch.controller";

const router = Router();
router.use(authMiddleware);

router.post("/create", controller.createDespatch);
router.get("/list", controller.listDespatch);
router.get("/retrieve/:despatchId", controller.retrieveDespatch);
router.post("/email", controller.emailDespatch);
router.post("/cancel/order", controller.cancelOrderPost);

router.get("/cancel/order", controller.cancelOrderList);
router.post("/cancel/fulfilment", controller.cancelFulfilmentPost);
router.get("/cancel/fulfilment", controller.cancelFulfilmentList);

export default router;
