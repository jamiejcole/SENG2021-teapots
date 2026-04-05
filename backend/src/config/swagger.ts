import path from "node:path";
import swaggerJSDoc from "swagger-jsdoc";
import { generateInvoiceSupplementSchemas } from "./swagger.utils";

const invoiceSupplementSchemas = generateInvoiceSupplementSchemas();

const swaggerDefinition = {
  openapi: "3.0.0",
  info: {
    title: "UBL Invoice Generator API",
    version: "2.0.0",
    description: "API for Invoice Generation and UBL validation. Made by the SENG2021 26T1 W11A Teapots Team.",
  },
  servers: [
    {
      url: "http://100.48.200.166:3000",
      description: "Production Server",
    },
    {
      url: "https://seng2021.jamiecole.dev",
      description: "Production Server (Backup)",
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
    { name: "V1 Health", description: "Service health checks (v1)" },
    { name: "V1 Invoices", description: "Invoice generation and validation (v1)" },
    { name: "V1 Orders", description: "Order validation (v1)" },
    { name: "V2 Auth", description: "Authentication and 2FA (v2)" },
    { name: "V2 Invoices", description: "Invoice generation and validation (v2)" },
    { name: "V2 Orders", description: "Order validation (v2)" },
  ],
  components: {
    securitySchemes: {
      ApiKeyAuth: {
        type: "apiKey",
        in: "header",
        name: "x-api-key",
      },
      BearerAuth: {
        type: "http",
        scheme: "bearer",
        bearerFormat: "JWT",
      },
    },
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
        required: ["invoiceXml"],
        properties: {
          invoiceXml: {
            type: "string",
            description: "UBL Invoice XML string",
          },
        },
      },
      ValidateOrderRequest: {
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
      InvoiceRecord: {
        type: "object",
        description: "Stored invoice record",
        properties: {
          _id: {
            type: "string",
          },
          status: {
            type: "string",
            enum: ["GENERATED", "UPDATED"],
          },
          invoiceId: {
            type: "string",
          },
          issueDate: {
            type: "string",
          },
          currency: {
            type: "string",
          },
          seller: {
            type: "object",
            additionalProperties: true,
          },
          buyer: {
            type: "object",
            additionalProperties: true,
          },
          lines: {
            type: "array",
            items: {
              type: "object",
              additionalProperties: true,
            },
          },
          orderReference: {
            type: "object",
            additionalProperties: true,
          },
          despatchReference: {
            type: "object",
            additionalProperties: true,
          },
          paymentTerms: {
            type: "string",
          },
          totals: {
            type: "object",
            additionalProperties: true,
          },
          invoiceXml: {
            type: "string",
          },
          xmlSha256: {
            type: "string",
          },
          createdAt: {
            type: "string",
            format: "date-time",
          },
          updatedAt: {
            type: "string",
            format: "date-time",
          },
        },
      },
      InvoiceListResponse: {
        type: "array",
        items: {
          $ref: "#/components/schemas/InvoiceRecord",
        },
      },
    },
  },
};

const rawSwaggerSpec = swaggerJSDoc({
  definition: swaggerDefinition,
  apis: [
    path.join(process.cwd(), "src/api/**/*.routes.ts"),
    path.join(process.cwd(), "dist/api/**/*.routes.js"),
  ],
}) as {
  paths?: Record<string, Record<string, unknown>>;
};

const versionedTagMap: Record<string, Record<string, string>> = {
  "/api/v1/": {
    Health: "V1 Health",
    Invoices: "V1 Invoices",
    Orders: "V1 Orders",
  },
  "/api/v2/": {
    Auth: "V2 Auth",
    Invoices: "V2 Invoices",
    Orders: "V2 Orders",
  },
};

const methods = ["get", "post", "put", "patch", "delete", "options", "head"] as const;

for (const [routePath, pathItem] of Object.entries(rawSwaggerSpec.paths ?? {})) {
  const prefix = routePath.startsWith("/api/v2/") ? "/api/v2/" : routePath.startsWith("/api/v1/") ? "/api/v1/" : null;
  if (!prefix) continue;

  for (const method of methods) {
    const op = (pathItem as Record<string, any>)[method];
    if (!op) continue;

    const currentTags = Array.isArray(op.tags) ? op.tags : [];
    op.tags = currentTags.map((tag: string) => versionedTagMap[prefix][tag] ?? tag);
  }
}

export const swaggerSpec = rawSwaggerSpec;