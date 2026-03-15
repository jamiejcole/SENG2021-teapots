import { Request, Response } from "express";
import { HttpError } from "../../../errors/HttpError";
import { validateUBL } from "../invoices/invoices.validation";

export async function validateOrder(req: Request, res: Response) {
  const { orderXml } = req.body;

  if (!orderXml || typeof orderXml !== "string" || !orderXml.trim()) {
    throw new HttpError(400, "Request body must include 'orderXml' as a non-empty string");
  }

  res.contentType("application/json");

  validateUBL(orderXml, "Order");

  res.status(200).json({
    message: "UBL Order is valid!",
  });
}