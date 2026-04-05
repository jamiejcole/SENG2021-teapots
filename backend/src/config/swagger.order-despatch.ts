export const orderAndDespatchProxyPaths = {
  "/api/v2/summary": {
    post: {
      summary: "Generate an order summary",
      tags: ["V2 Summary"],
      security: [{ BearerAuth: [] }],
      requestBody: {
        required: true,
        content: {
          "application/json": {
            schema: {
              $ref: "#/components/schemas/SummaryRequest",
            },
          },
        },
      },
      responses: {
        200: {
          description: "Summary generated successfully",
          content: {
            "application/json": {
              schema: {
                $ref: "#/components/schemas/SummaryResponse",
              },
              example: {
                summary:
                  "One order is for Red Paint with UNSW Engineering as both the buyer and the seller, settled in AUD. The other order is for Blue Paint, with Havard Engineering as the buyer and UNSW Engineering as the seller, settled in USD.",
                remainingDailyRequests: 7,
              },
            },
          },
        },
        401: {
          description: "Missing or invalid token",
        },
        429: {
          description: "Daily AI rate limit reached.",
        },
        500: {
          description: "Server, AI or database error",
        },
      },
    },
  },
  "/api/v2/orders": {
    post: {
      summary: "Create an order",
      tags: ["V2 Orders"],
      security: [{ BearerAuth: [] }],
      requestBody: {
        required: true,
        content: {
          "application/json": {
            schema: {
              $ref: "#/components/schemas/OrderCreateRequest",
            },
            example: {
              data: {
                ID: "ORD-001",
                IssueDate: "2026-03-16",
                BuyerCustomerParty: {
                  Party: {
                    PartyName: [{ Name: "Test Buyer" }],
                  },
                },
                SellerSupplierParty: {
                  Party: {
                    PartyName: [{ Name: "Test Seller" }],
                  },
                },
                OrderLine: [
                  {
                    LineItem: {
                      ID: "LINE-001",
                      Item: {
                        Description: ["Test Item"],
                        Name: "Test Product",
                      },
                    },
                  },
                ],
              },
            },
          },
        },
      },
      responses: {
        201: {
          description: "Order created successfully",
          content: {
            "application/json": {
              schema: {
                $ref: "#/components/schemas/OrderCreateResponse",
              },
              example: {
                orderId: "34",
                status: "success",
                ublXmlUrl: "/api/v2/orders/34/xml",
              },
            },
          },
        },
        400: {
          description: "Missing required fields / invalid items / invalid date format / missing data field",
        },
        401: {
          description: "Token missing or invalid",
        },
        404: {
          description: "Seller party not found",
        },
        500: {
          description: "XML generation failure",
        },
      },
    },
    get: {
      summary: "List orders",
      tags: ["V2 Orders"],
      security: [{ BearerAuth: [] }],
      responses: {
        200: {
          description: "List of orders",
          content: {
            "application/json": {
              schema: {
                $ref: "#/components/schemas/OrderListResponse",
              },
            },
          },
        },
        401: {
          description: "Unauthorized",
        },
      },
    },
  },
  "/api/v2/orders/{orderId}": {
    get: {
      summary: "Get order by ID",
      tags: ["V2 Orders"],
      security: [{ BearerAuth: [] }],
      parameters: [
        {
          name: "orderId",
          in: "path",
          required: true,
          schema: {
            type: "string",
          },
          description: "ID of the order",
        },
      ],
      responses: {
        200: {
          description: "Order found",
          content: {
            "application/json": {
              schema: {
                $ref: "#/components/schemas/OrderRecord",
              },
            },
          },
        },
        400: {
          description: "Malformed orderId",
        },
        401: {
          description: "Token invalid",
        },
        403: {
          description: "Not owner of the order",
        },
        404: {
          description: "Order does not exist",
        },
      },
    },
    put: {
      summary: "Update order",
      tags: ["V2 Orders"],
      security: [{ BearerAuth: [] }],
      parameters: [
        {
          name: "orderId",
          in: "path",
          required: true,
          schema: {
            type: "string",
          },
          description: "ID of the order to update",
        },
      ],
      requestBody: {
        description: "Updated order data",
        required: true,
        content: {
          "application/json": {
            schema: {
              $ref: "#/components/schemas/OrderCreateRequest",
            },
          },
        },
      },
      responses: {
        200: {
          description: "Order updated successfully",
          content: {
            "application/json": {
              schema: {
                $ref: "#/components/schemas/OrderCreateResponse",
              },
              example: {
                orderId: "34",
                status: "success",
                ublXmlUrl: "/api/v2/orders/34/xml",
              },
            },
          },
        },
        400: {
          description: "Invalid update payload",
        },
        401: {
          description: "Unauthorized",
        },
        403: {
          description: "Forbidden",
        },
        404: {
          description: "Not found",
        },
      },
    },
    delete: {
      summary: "Delete order",
      tags: ["V2 Orders"],
      security: [{ BearerAuth: [] }],
      parameters: [
        {
          name: "orderId",
          in: "path",
          required: true,
          schema: {
            type: "string",
          },
          description: "ID of the order to delete",
        },
      ],
      responses: {
        200: {
          description: "Order deleted successfully",
          content: {
            "application/json": {
              schema: {
                $ref: "#/components/schemas/MessageResponse",
              },
              example: {
                status: "deleted",
                message: "Order deleted successfully.",
              },
            },
          },
        },
        401: {
          description: "Unauthorized",
        },
        403: {
          description: "Forbidden",
        },
        404: {
          description: "Not found",
        },
      },
    },
  },
  "/api/v2/orders/{orderId}/xml": {
    get: {
      summary: "Get order as UBL XML",
      tags: ["V2 Orders"],
      security: [{ BearerAuth: [] }],
      parameters: [
        {
          name: "orderId",
          in: "path",
          required: true,
          schema: {
            type: "string",
          },
          description: "ID of the order",
        },
      ],
      responses: {
        200: {
          description: "UBL XML document",
          content: {
            "application/xml": {
              schema: {
                type: "string",
              },
              example: "<?xml version=\"1.0\" encoding=\"UTF-8\"?><Order xmlns=\"urn:oasis:names:specification:ubl:schema:xsd:Order-2\">...</Order>",
            },
          },
        },
        401: {
          description: "Invalid bearer token is provided",
        },
        403: {
          description: "Order does not belong to this user",
        },
        404: {
          description: "Order not found",
        },
      },
    },
  },
  "/api/v2/despatch/create": {
    post: {
      summary: "Create despatch advice records from order XML",
      tags: ["V2 Despatch"],
      security: [{ BearerAuth: [] }],
      requestBody: {
        required: true,
        content: {
          "application/xml": {
            schema: {
              type: "string",
              example: "<Order>...</Order>",
            },
          },
          "text/xml": {
            schema: {
              type: "string",
              example: "<Order>...</Order>",
            },
          },
        },
      },
      responses: {
        200: {
          description: "Despatch advice created",
          content: {
            "application/json": {
              schema: {
                $ref: "#/components/schemas/CreateDespatchAdviceResponse",
              },
            },
          },
        },
        400: {
          description: "Invalid request payload",
        },
        401: {
          description: "Missing or invalid issued API key",
        },
        500: {
          description: "Internal server error occured - try again later.",
        },
      },
    },
  },
  "/api/v2/despatch/retrieve": {
    get: {
      summary: "Retrieve a despatch advice",
      tags: ["V2 Despatch"],
      security: [{ BearerAuth: [] }],
      parameters: [
        {
          name: "search-type",
          in: "query",
          required: true,
          description: "Search mode: advice-id for UUID lookup, or order for order XML lookup.",
          schema: {
            type: "string",
            enum: ["order", "advice-id"],
          },
        },
        {
          name: "query",
          in: "query",
          required: true,
          description: "The value to search with. Provide a UUID when search-type=advice-id, or raw order XML when search-type=order.",
          schema: {
            type: "string",
          },
        },
      ],
      responses: {
        200: {
          description: "Despatch advice retrieved",
          content: {
            "application/json": {
              schema: {
                $ref: "#/components/schemas/DespatchRetrievalResponse",
              },
            },
          },
        },
        400: {
          description: "Missing or invalid search parameters",
        },
        401: {
          description: "Missing or invalid issued API key",
        },
        404: {
          description: "Despatch advice not found",
        },
        500: {
          description: "Internal server error occured - try again later.",
        },
      },
    },
  },
  "/api/v2/despatch/list": {
    get: {
      summary: "List despatch advice records for the current API key",
      tags: ["V2 Despatch"],
      security: [{ BearerAuth: [] }],
      responses: {
        200: {
          description: "List of despatch advice records",
          content: {
            "application/json": {
              schema: {
                $ref: "#/components/schemas/ListDespatchAdvicesResponse",
              },
            },
          },
        },
        401: {
          description: "Missing or invalid issued API key",
        },
        500: {
          description: "Internal server error occured - try again later.",
        },
      },
    },
  },
  "/api/v2/despatch/cancel/order": {
    post: {
      summary: "Cancel an existing despatch advice",
      tags: ["V2 Despatch"],
      security: [{ BearerAuth: [] }],
      requestBody: {
        required: true,
        content: {
          "application/json": {
            schema: {
              $ref: "#/components/schemas/CancelOrderRequest",
            },
          },
        },
      },
      responses: {
        200: {
          description: "Cancellation stored",
          content: {
            "application/json": {
              schema: {
                $ref: "#/components/schemas/CancelOrderResponse",
              },
            },
          },
        },
        400: {
          description: "Invalid request payload",
        },
        401: {
          description: "Missing or invalid issued API key",
        },
        403: {
          description: "API key does not own the despatch advice",
        },
        404: {
          description: "Despatch advice not found",
        },
        500: {
          description: "Internal server error occured - try again later.",
        },
      },
    },
    get: {
      summary: "Retrieve order cancellation",
      tags: ["V2 Despatch"],
      security: [{ BearerAuth: [] }],
      parameters: [
        {
          name: "advice-id",
          in: "query",
          required: false,
          schema: {
            type: "string",
            format: "uuid",
          },
          description: "Despatch advice id.",
        },
        {
          name: "cancellation-id",
          in: "query",
          required: false,
          schema: {
            type: "string",
            format: "uuid",
          },
          description: "Order cancellation id.",
        },
      ],
      responses: {
        200: {
          description: "Cancellation record",
          content: {
            "application/json": {
              schema: {
                $ref: "#/components/schemas/CancelOrderResponse",
              },
            },
          },
        },
        400: {
          description: "Missing or invalid query parameters",
        },
        401: {
          description: "Missing or invalid issued API key",
        },
        403: {
          description: "API key does not own the despatch advice",
        },
        404: {
          description: "Cancellation not found",
        },
        500: {
          description: "Internal server error occured - try again later.",
        },
      },
    },
  },
  "/api/v2/despatch/cancel/fulfilment": {
    post: {
      summary: "Create fulfilment cancellation",
      tags: ["V2 Despatch"],
      security: [{ BearerAuth: [] }],
      requestBody: {
        required: true,
        content: {
          "application/json": {
            schema: {
              $ref: "#/components/schemas/FulfilmentCancellationRequest",
            },
          },
        },
      },
      responses: {
        200: {
          description: "Fulfilment cancellation created",
          content: {
            "application/json": {
              schema: {
                $ref: "#/components/schemas/FulfilmentCancellationResponse",
              },
            },
          },
        },
        400: {
          description: "Invalid request payload",
        },
        401: {
          description: "Missing or invalid issued API key",
        },
        403: {
          description: "API key does not own the despatch advice",
        },
        404: {
          description: "Despatch advice not found",
        },
        500: {
          description: "Internal server error occured - try again later.",
        },
      },
    },
    get: {
      summary: "Retrieve fulfilment cancellation",
      tags: ["V2 Despatch"],
      security: [{ BearerAuth: [] }],
      parameters: [
        {
          name: "advice-id",
          in: "query",
          required: false,
          schema: {
            type: "string",
            format: "uuid",
          },
          description: "Despatch advice id.",
        },
        {
          name: "fulfilment-cancellation-id",
          in: "query",
          required: false,
          schema: {
            type: "string",
            format: "uuid",
          },
          description: "Fulfilment cancellation id.",
        },
      ],
      responses: {
        200: {
          description: "Fulfilment cancellation record",
          content: {
            "application/json": {
              schema: {
                $ref: "#/components/schemas/FulfilmentCancellationResponse",
              },
            },
          },
        },
        400: {
          description: "Missing or invalid query parameters",
        },
        401: {
          description: "Missing or invalid issued API key",
        },
        403: {
          description: "API key does not own the despatch advice",
        },
        404: {
          description: "Fulfilment cancellation not found",
        },
        500: {
          description: "Internal server error occured - try again later.",
        },
      },
    },
  },
  "/api/v2/validate-doc/{document-type}": {
    post: {
      summary: "Validate an XML document",
      tags: ["V2 Despatch"],
      security: [{ BearerAuth: [] }],
      parameters: [
        {
          name: "document-type",
          in: "path",
          required: true,
          description: "Document type to validate.",
          schema: {
            type: "string",
            enum: ["order", "receipt", "despatch", "order-cancel", "order-change", "fulfilment-cancel"],
          },
        },
      ],
      requestBody: {
        required: true,
        content: {
          "application/xml": {
            schema: {
              type: "string",
              example: "<Order>...</Order>",
            },
          },
          "text/xml": {
            schema: {
              type: "string",
              example: "<Order>...</Order>",
            },
          },
        },
      },
      responses: {
        200: {
          description: "Validation completed",
          content: {
            "application/json": {
              schema: {
                $ref: "#/components/schemas/ValidateDocumentResponse",
              },
            },
          },
        },
        400: {
          description: "Invalid request or unsupported document type",
        },
        401: {
          description: "Missing or invalid issued API key",
        },
        500: {
          description: "Internal server error occured - try again later.",
        },
      },
    },
  },
} as const;

export const orderAndDespatchProxySchemas = {
  SummaryRequest: {
    type: "object",
    description: "Summary request for a user's orders. Either omit the body or include a subset of order IDs and an optional line length.",
    properties: {
      orderIds: {
        type: "array",
        nullable: true,
        description: "Optional list of order IDs to summarise. If omitted, the backend summarises all orders for the user.",
        items: {
          type: "string",
        },
        example: ["df31bd828ae2f3f2a36dc0f4bb1d4027", "a1b2c3d4e5f6789012345678901234ab"],
      },
      lineLength: {
        type: "integer",
        nullable: true,
        description: "Number of summary lines requested. Defaults to 3 and is capped at 10.",
        example: 3,
      },
    },
  },
  SummaryResponse: {
    type: "object",
    properties: {
      summary: {
        type: "string",
        description: "AI-generated order summary.",
        example:
          "One order is for Red Paint with UNSW Engineering as both the buyer and the seller, settled in AUD. The other order is for Blue Paint, with Havard Engineering as the buyer and UNSW Engineering as the seller, settled in USD.",
      },
      remainingDailyRequests: {
        type: "integer",
        description: "Remaining number of summary requests available for the day.",
        example: 7,
      },
    },
  },
  OrderCreateRequest: {
    type: "object",
    description: "Order creation or update payload. The raw UBL order JSON is wrapped in a `data` field so the backend can proxy it to the upstream OrderMS service.",
    required: ["data"],
    properties: {
      data: {
        type: "object",
        description: "Raw UBL order JSON payload.",
        additionalProperties: true,
      },
      sellerPartyId: {
        type: "string",
        nullable: true,
        description: "Optional seller party link used by the upstream order service.",
        example: "fc1f9d3d0a4e3edb5a64ab33c12554f2",
      },
    },
  },
  OrderCreateResponse: {
    type: "object",
    properties: {
      orderId: {
        type: "string",
        description: "Unique identifier of the created or updated order.",
        example: "34",
      },
      status: {
        type: "string",
        example: "success",
      },
      ublXmlUrl: {
        type: "string",
        description: "URL to retrieve the generated UBL XML.",
        example: "/api/v2/orders/34/xml",
      },
    },
  },
  OrderRecord: {
    type: "object",
    description: "Full order record including metadata and raw UBL JSON.",
    properties: {
      _id: {
        type: "string",
        example: "69b77420ef44623e06626ba5",
      },
      data: {
        type: "object",
        description: "Raw UBL-style order payload.",
        additionalProperties: true,
      },
      orderId: {
        type: "string",
        example: "df31bd828ae2f3f2a36dc0f4bb1d4027",
      },
      createdAt: {
        type: "string",
        format: "date-time",
        example: "2026-03-16T03:08:16.211Z",
      },
      modifiedAt: {
        type: "string",
        format: "date-time",
        example: "2026-03-16T03:09:24.022Z",
      },
      url: {
        type: "string",
        example: "https://api.orderms.tech/v2/orders/df31bd828ae2f3f2a36dc0f4bb1d4027/xml",
      },
      userId: {
        type: "string",
        example: "53a85f8e38ee13317cfc0332328ceeb2",
      },
    },
  },
  OrderListResponse: {
    type: "array",
    items: {
      $ref: "#/components/schemas/OrderRecord",
    },
  },
  CreateDespatchAdviceResponse: {
    type: "object",
    properties: {
      success: {
        type: "boolean",
        example: true,
      },
      adviceIds: {
        type: "array",
        items: {
          type: "string",
          example: "e553cc8e-8b37-4a9b-a0cf-87c34ea70a35",
        },
      },
      "executed-at": {
        type: "integer",
        example: 1772246484,
      },
    },
    required: ["success", "adviceIds", "executed-at"],
  },
  DespatchRetrievalResponse: {
    type: "object",
    properties: {
      "despatch-advice": {
        type: "string",
        example: "<DespatchAdvice>...</DespatchAdvice>",
      },
      "advice-id": {
        type: "string",
        format: "uuid",
      },
      "executed-at": {
        type: "integer",
        example: 1772246484,
      },
    },
    required: ["despatch-advice", "advice-id", "executed-at"],
  },
  DespatchAdviceRecord: {
    type: "object",
    properties: {
      "advice-id": {
        type: "string",
        format: "uuid",
      },
      "executed-at": {
        type: "integer",
        example: 1772246484,
      },
      "despatch-advice": {
        type: "string",
        nullable: true,
        example: "<DespatchAdvice>...</DespatchAdvice>",
      },
    },
    required: ["advice-id", "executed-at"],
  },
  ListDespatchAdvicesResponse: {
    type: "object",
    properties: {
      results: {
        type: "array",
        items: {
          $ref: "#/components/schemas/DespatchAdviceRecord",
        },
      },
      "executed-at": {
        type: "integer",
        example: 1772246484,
      },
    },
    required: ["results", "executed-at"],
  },
  CancelOrderRequest: {
    type: "object",
    required: ["advice-id", "order-cancellation-document"],
    properties: {
      "advice-id": {
        type: "string",
        format: "uuid",
        example: "e553cc8e-8b37-4a9b-a0cf-87c34ea70a35",
      },
      "order-cancellation-document": {
        type: "string",
        example: "<OrderCancellation>...</OrderCancellation>",
      },
    },
  },
  CancelOrderResponse: {
    type: "object",
    properties: {
      "order-cancellation": {
        type: "string",
        example: "<OrderCancellation>...</OrderCancellation>",
      },
      "order-cancellation-reason": {
        type: "string",
        example: "Refund requested",
      },
      "order-cancellation-id": {
        type: "string",
        format: "uuid",
      },
      "advice-id": {
        type: "string",
        format: "uuid",
      },
      "executed-at": {
        type: "string",
        format: "date-time",
        example: "2026-03-15T09:00:00.000Z",
      },
    },
    required: ["order-cancellation", "order-cancellation-reason", "order-cancellation-id", "advice-id", "executed-at"],
  },
  FulfilmentCancellationRequest: {
    type: "object",
    required: ["advice-id", "fulfilment-cancellation-reason"],
    properties: {
      "advice-id": {
        type: "string",
        format: "uuid",
        example: "e553cc8e-8b37-4a9b-a0cf-87c34ea70a35",
      },
      "fulfilment-cancellation-reason": {
        type: "string",
        example: "Unable to fulfil delivery window",
      },
    },
  },
  FulfilmentCancellationResponse: {
    type: "object",
    properties: {
      "fulfilment-cancellation": {
        type: "string",
        example: "<FulfilmentCancellation>...</FulfilmentCancellation>",
      },
      "fulfilment-cancellation-reason": {
        type: "string",
      },
      "fulfilment-cancellation-id": {
        type: "string",
        format: "uuid",
      },
      "advice-id": {
        type: "string",
        format: "uuid",
      },
      "executed-at": {
        type: "string",
        format: "date-time",
        example: "2026-03-15T09:00:00.000Z",
      },
    },
    required: ["fulfilment-cancellation", "fulfilment-cancellation-reason", "fulfilment-cancellation-id", "advice-id", "executed-at"],
  },
  ValidateDocumentResponse: {
    type: "object",
    properties: {
      valid: {
        type: "boolean",
        example: true,
      },
      errors: {
        type: "array",
        items: {
          type: "string",
        },
        example: [],
      },
      "executed-at": {
        type: "integer",
        example: 1772246484,
      },
    },
    required: ["valid", "errors", "executed-at"],
  },
} as const;