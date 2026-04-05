import axios from "axios";
import { Request, Response, NextFunction } from "express";
import { HttpError } from "../../../errors/HttpError";
import { validateUBL } from "../invoices/invoices.validation";

export async function createOrder(req: Request, res: Response, next: NextFunction) {
  try {
    const token = process.env.MICROSLOP_TOKEN;

    if (!token) {
      return res.status(500).json({
        error: "CONFIG_ERROR",
        message: "MICROSLOP_TOKEN is missing",
      });
    }

    const createResponse = await axios.post(
      "https://api.orderms.tech/v1/orders",
      req.body,
      {
        headers: {
          token,
        },
      }
    );

    const { orderId, status, ublXmlUrl } = createResponse.data.result;

    const xmlResponse = await axios.get(ublXmlUrl, {
      headers: {
        token,
      },
    });

    const orderXml = xmlResponse.data;

    return res.status(201).json({
      message: "Order created successfully",
      orderId,
      status,
      ublXmlUrl,
      orderXml,
    });
  } catch (err) {
    next(err);
  }
}

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