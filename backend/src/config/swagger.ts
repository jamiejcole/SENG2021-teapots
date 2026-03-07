import { generateInvoiceSupplementSchemas } from "./swagger.utils";

const invoiceSupplementSchemas = generateInvoiceSupplementSchemas();

export const swaggerSpec = {
  openapi: "3.0.0",
  info: {
    title: "UBL Invoice Generator API",
    version: "1.0.0",
    description: "API for Invoice Generation and UBL validation."
  },
  servers: [
    {
      url: "http://localhost:3000",
      description: "localhost",
    },
  ],
  tags: [
    { name: "Health", description: "Service health checks" },
    { name: "Invoices", description: "Invoice generation and validation" },
  ],
  paths: {
    "/api/v1/health": {
      get: {
        summary: "Get Server Health Status",
        tags: ["Health"],
        responses: {
          "200": {
            description: "Service is healthy!",
            content: {
              "application/json": {
                schema: {
                  $ref: "#/components/schemas/HealthResponse",
                },
              },
            },
          },
        },
      },
    },
    "/api/v1/invoices": {
      post: {
        summary: "Create an invoice from a UBL Order XML and additional params",
        tags: ["Invoices"],
        requestBody: {
          required: true,
          content: {
            "application/json": {
              schema: {
                $ref: "#/components/schemas/CreateInvoiceRequest",
              },
            },
          },
        },
        responses: {
          "201": {
            description: "Invoice XML generated successfully",
            content: {
              "application/xml": {
                schema: {
                  type: "string",
                },
              },
            },
          },
          "400": {
            description: "Invalid request or invalid UBL payload",
            content: {
              "application/json": {
                schema: {
                  $ref: "#/components/schemas/ErrorResponse",
                },
              },
            },
          },
          "500": {
            description: "Internal server error",
            content: {
              "application/json": {
                schema: {
                  $ref: "#/components/schemas/ErrorResponse",
                },
              },
            },
          },
        },
      },
    },
    "/api/v1/invoices/validate": {
      post: {
        summary: "Validate a UBL XML Order payload",
        tags: ["Invoices"],
        requestBody: {
          required: true,
          content: {
            "application/json": {
              schema: {
                $ref: "#/components/schemas/ValidateInvoiceRequest",
              },
            },
          },
        },
        responses: {
          "200": {
            description: "UBL Order is valid",
            content: {
              "application/json": {
                schema: {
                  $ref: "#/components/schemas/SuccessMessageResponse",
                },
              },
            },
          },
          "400": {
            description: "Invalid request or invalid UBL payload",
            content: {
              "application/json": {
                schema: {
                  $ref: "#/components/schemas/ErrorResponse",
                },
              },
            },
          },
          "500": {
            description: "Internal server error",
            content: {
              "application/json": {
                schema: {
                  $ref: "#/components/schemas/ErrorResponse",
                },
              },
            },
          },
        },
      },
    },
  },
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