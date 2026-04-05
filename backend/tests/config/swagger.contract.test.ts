import { swaggerSpec } from "../../src/config/swagger";

const swaggerDoc = swaggerSpec as {
  tags?: Array<{ name: string }>;
  paths?: Record<string, unknown>;
  components?: {
    schemas?: Record<string, unknown>;
  };
};

describe("swagger contract", () => {
  it("exposes the new order and despatch proxy surface", () => {
    expect(swaggerDoc.tags).toEqual(
      expect.arrayContaining([
        expect.objectContaining({ name: "V2 Orders" }),
        expect.objectContaining({ name: "V2 Summary" }),
        expect.objectContaining({ name: "V2 Despatch" }),
      ])
    );

    expect(swaggerDoc.paths).toEqual(
      expect.objectContaining({
        "/api/v2/summary": expect.any(Object),
        "/api/v2/orders": expect.any(Object),
        "/api/v2/orders/{orderId}": expect.any(Object),
        "/api/v2/orders/{orderId}/xml": expect.any(Object),
        "/api/v2/despatch/create": expect.any(Object),
        "/api/v2/despatch/retrieve": expect.any(Object),
        "/api/v2/despatch/list": expect.any(Object),
        "/api/v2/despatch/cancel/order": expect.any(Object),
        "/api/v2/despatch/cancel/fulfilment": expect.any(Object),
        "/api/v2/validate-doc/{document-type}": expect.any(Object),
      })
    );

    expect(swaggerDoc.components?.schemas).toEqual(
      expect.objectContaining({
        SummaryRequest: expect.objectContaining({
          type: "object",
          properties: expect.objectContaining({
            orderIds: expect.any(Object),
            lineLength: expect.any(Object),
          }),
        }),
        SummaryResponse: expect.objectContaining({
          type: "object",
          properties: expect.objectContaining({
            summary: expect.any(Object),
            remainingDailyRequests: expect.any(Object),
          }),
        }),
        OrderCreateRequest: expect.objectContaining({
          type: "object",
          properties: expect.objectContaining({
            data: expect.any(Object),
            sellerPartyId: expect.any(Object),
          }),
        }),
        OrderCreateResponse: expect.objectContaining({
          type: "object",
          properties: expect.objectContaining({
            orderId: expect.any(Object),
            status: expect.any(Object),
            ublXmlUrl: expect.any(Object),
          }),
        }),
        OrderRecord: expect.objectContaining({
          type: "object",
          properties: expect.objectContaining({
            data: expect.any(Object),
            orderId: expect.any(Object),
            createdAt: expect.any(Object),
            modifiedAt: expect.any(Object),
          }),
        }),
        ListDespatchAdvicesResponse: expect.objectContaining({
          type: "object",
          properties: expect.objectContaining({
            results: expect.any(Object),
            "executed-at": expect.any(Object),
          }),
        }),
        ValidateDocumentResponse: expect.objectContaining({
          type: "object",
          properties: expect.objectContaining({
            valid: expect.any(Object),
            errors: expect.any(Object),
            "executed-at": expect.any(Object),
          }),
        }),
      })
    );
  });
});