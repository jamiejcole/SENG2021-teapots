import { Router } from "express";
const { Invoice } = require("ubl-builder");
import * as controller from "./invoices.controller";
const router = Router();

router.get("/", controller.createInvoice);


export default router;