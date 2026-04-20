import path from "node:path";
import swaggerJSDoc from "swagger-jsdoc";
import { generateInvoiceSupplementSchemas } from "./swagger.utils";

const invoiceSupplementSchemas = generateInvoiceSupplementSchemas();

const swaggerDefinition = {
  openapi: "3.0.0",
  info: {
    title: "UBL Invoice Generator API",
    version: "2.0.1",
    description: "API for Invoice Generation and UBL validation. Made by the SENG2021 26T1 W11A Teapots Team.",
  },
  servers: [
    {
      url: "https://api.teapotinvoicing.app",
      description: "Production Server",
    },
    {
      url: "https://api2.teapotinvoicing.app",
      description: "Production Server (Backup)",
    },
    {
      url: "http://localhost:3000",
      description: "localhost",
    },
  ],
  tags: [
    { name: "V1 Health", description: "Service health checks (v1)" },
    { name: "V1 Invoices", description: "Invoice generation and validation (v1)" },
    { name: "V1 Orders", description: "Order validation (v1)" },
    { name: "V2 Auth", description: "Authentication and 2FA (v2)" },
    { name: "V2 AI", description: "AI-powered document extraction and chat assistance (v2)" },
    { name: "V2 Invoices", description: "Invoice generation and validation (v2)" },
    { name: "V2 Orders", description: "Order validation (v2)" },
    { name: "V2 Despatch", description: "Despatch generation, cancellation, and email flows (v2)" },
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
        required: ["orderXml", "invoiceSupplement"],
        properties: {
          orderXml: {
            type: "string",
            description: "UBL Order XML string",
          },
          invoiceSupplement: {
            $ref: "#/components/schemas/InvoiceSupplement",
            description: "Optional supplemental fields used during invoice generation",
          },
        },
      },
      PreviewInvoiceResponse: {
        type: "object",
        properties: {
          invoiceXml: {
            type: "string",
            description: "Generated invoice XML preview",
          },
          previewOnly: {
            type: "boolean",
            example: true,
          },
        },
        required: ["invoiceXml", "previewOnly"],
      },
      InvoiceStudioLineItem: {
        type: "object",
        properties: {
          id: {
            type: "string",
          },
          name: {
            type: "string",
          },
          details: {
            type: "string",
          },
          quantity: {
            type: "number",
          },
          rate: {
            type: "number",
          },
        },
        required: ["name", "quantity", "rate"],
      },
      InvoiceStudioPreviewDraft: {
        type: "object",
        properties: {
          businessName: {
            type: "string",
          },
          businessPhone: {
            type: "string",
          },
          businessEmail: {
            type: "string",
          },
          businessAddress: {
            type: "string",
          },
          customerName: {
            type: "string",
          },
          customerPhone: {
            type: "string",
          },
          customerEmail: {
            type: "string",
          },
          customerAddress: {
            type: "string",
          },
          invoiceNumber: {
            type: "string",
          },
          issueDate: {
            type: "string",
          },
          dueDate: {
            type: "string",
          },
          jobSummary: {
            type: "string",
          },
          notes: {
            type: "string",
          },
          paymentNotes: {
            type: "string",
          },
          extraNotes: {
            type: "string",
          },
          accountName: {
            type: "string",
          },
          accountNumber: {
            type: "string",
          },
          bsb: {
            type: "string",
          },
          taxRate: {
            type: "number",
          },
          theme: {
            type: "string",
            enum: ["light", "dark"],
          },
          lineItems: {
            type: "array",
            items: {
              $ref: "#/components/schemas/InvoiceStudioLineItem",
            },
          },
        },
        required: ["businessName", "customerName", "invoiceNumber", "lineItems"],
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
      AIDocumentExtractionResponse: {
        type: "object",
        properties: {
          fields: {
            type: "object",
            additionalProperties: true,
            description: "Structured invoice or order fields extracted from the uploaded document",
          },
        },
        required: ["fields"],
      },
      AIChatMessage: {
        type: "object",
        required: ["role", "content"],
        properties: {
          role: {
            type: "string",
            enum: ["user", "assistant"],
          },
          content: {
            type: "string",
          },
        },
      },
      AIChatRequest: {
        type: "object",
        required: ["messages"],
        properties: {
          messages: {
            type: "array",
            minItems: 1,
            items: {
              $ref: "#/components/schemas/AIChatMessage",
            },
          },
        },
      },
      AIChatStreamEvent: {
        type: "object",
        properties: {
          text: {
            type: "string",
            description: "Assistant text chunk streamed as server-sent events",
          },
          navigation: {
            type: "array",
            items: {
              type: "object",
              additionalProperties: true,
            },
            description: "Optional navigation suggestions emitted during the chat",
          },
          done: {
            type: "boolean",
          },
          error: {
            type: "string",
          },
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
    AI: "V2 AI",
    Invoices: "V2 Invoices",
    Orders: "V2 Orders",
    Despatch: "V2 Despatch",
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