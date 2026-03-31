import path from "node:path";
import swaggerJSDoc from "swagger-jsdoc";
import { generateInvoiceSupplementSchemas } from "./swagger.utils";

const invoiceSupplementSchemas = generateInvoiceSupplementSchemas();

const swaggerDefinition = {
  openapi: "3.0.0",
  info: {
    title: "UBL Invoice Generator API",
    version: "1.0.0",
    description: "API for Invoice Generation and UBL validation.",
  },
  servers: [
    {
      url: "https://seng2021.jamiecole.dev",
      description: "Production",
    },
    {
      url: "http://localhost:3000",
      description: "localhost",
    },
  ],
  tags: [
    { name: "Health", description: "Service health checks" },
    { name: "Invoices", description: "Invoice generation and validation" },
    { name: "Orders", description: "Order creation integration" },
  ],
  components: {
    schemas: {
      CreateInvoiceRequest: {
        type: "object",
        required: ["orderXml"],
        properties: {
          orderXml: {
            type: "string",
            description: "UBL Order XML string",
          },
          invoiceSupplement: {
            $ref: "#/components/schemas/InvoiceSupplement",
            nullable: true,
            description: "Optional supplemental fields used during invoice generation",
          },
        },
      },
      ...invoiceSupplementSchemas,
      ValidateInvoiceRequest: {
        type: "object",
        required: ["orderXml"],
        properties: {
          orderXml: {
            type: "string",
            description: "UBL Order XML string",
          },
        },
      },
      SuccessMessageResponse: {
        type: "object",
        properties: {
          message: {
            type: "string",
          },
        },
        required: ["message"],
      },
      ErrorResponse: {
        type: "object",
        properties: {
          error: {
            type: "string",
          },
          message: {
            type: "string",
          },
        },
        required: ["error", "message"],
      },
      HealthResponse: {
        type: "object",
        properties: {
          status: {
            type: "string",
            example: "ok",
          },
          service: {
            type: "string",
          },
          version: {
            type: "string",
          },
          uptimeSeconds: {
            type: "number",
          },
        },
        required: ["status", "service", "version", "uptimeSeconds"],
      },
    },
  },
};

export const swaggerSpec = swaggerJSDoc({
  definition: swaggerDefinition,
  apis: [
    path.join(process.cwd(), "src/api/**/*.routes.ts"),
    path.join(process.cwd(), "dist/api/**/*.routes.js"),
  ],
});