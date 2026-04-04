/**
 * Test Suite for 'Microslop' Order API
 * OpenAPI URL: https://docs.orderms.tech/
 * API Base:    https://api.orderms.tech/v1/
 */

// Types are taken directly from their OpenAPI spec
type SummaryResponse = {
  summary: string;
};

type HealthResponse = {
  status: string;
  service: string;
  message: string;
};

type MessageResponse = {
  status: string;
  message: string;
};

type AuthResponse = {
  userId: string;
  token: string;
};

type OrderMutationResponse = {
  result: {
    orderId: string;
    ublXmlUrl: string;
    status?: string;
  };
};

type UblPartyName = {
  Name: string;
};

type UblOrderRecord = {
  orderId: string;
  UBLVersionID: string;
  ID: string;
  IssueDate: string;
  BuyerCustomerParty: {
    Party: {
      PartyName: UblPartyName[];
    };
  };
  SellerSupplierParty: {
    Party: {
      PartyName: UblPartyName[];
    };
  };
  OrderLine: Array<{
    LineItem: {
      ID: string;
      Item: {
        Description: string[];
        Name: string;
      };
    };
  }>;
};

type OrderRecordResponse = UblOrderRecord;

type StoredOrderRecord = {
  _id: string;
  createdAt: string;
  data: UblOrderRecord;
  modifiedAt: string;
  orderId: string;
  url: string;
  userId: string;
};

type OrderListResponse = StoredOrderRecord[];

type OrderApiResponse =
  | HealthResponse
  | SummaryResponse
  | AuthResponse
  | MessageResponse
  | OrderMutationResponse
  | OrderRecordResponse
  | OrderListResponse;

const runLiveTests = true; //process.env.RUN_ORDERMS_INTEGRATION === 'true';
const describeIfLive = runLiveTests ? describe : describe.skip;
const baseUrl = (process.env.ORDERMS_API_BASE_URL ?? 'https://api.orderms.tech/v1').replace(/\/$/, '');

// Helpers for tests
function authHeaders(token: string) {
  return {
    token,
    Authorization: `Bearer ${token}`,
  };
}

function buildOrderPayload() {
  const orderSeed = `${Date.now()}-${Math.random().toString(16).slice(2)}`;

  return {
    ID: `ORD-${orderSeed}`,
    IssueDate: new Date().toISOString().slice(0, 10),
    BuyerCustomerParty: {
      Party: {
        PartyName: [{ Name: 'Test Buyer' }],
      },
    },
    SellerSupplierParty: {
      Party: {
        PartyName: [{ Name: 'Test Seller' }],
      },
    },
    OrderLine: [
      {
        LineItem: {
          ID: 'LINE-001',
          Item: {
            Description: ['Test Item'],
            Name: 'Test Product',
          },
        },
      },
    ],
  };
}

function expectHealthResponse(body: HealthResponse) {
  expect(body).toEqual(
    expect.objectContaining({
      status: expect.any(String),
      service: expect.any(String),
      message: expect.any(String),
    }),
  );
}

function expectSummaryResponse(body: SummaryResponse) {
  expect(body).toEqual(
    expect.objectContaining({
      summary: expect.any(String),
    }),
  );
  expect(body.summary.length).toBeGreaterThan(0);
}

function expectAuthResponse(body: AuthResponse) {
  expect(body).toEqual(
    expect.objectContaining({
      userId: expect.any(String),
      token: expect.any(String),
    }),
  );
}

function expectMessageResponse(body: MessageResponse) {
  expect(body).toEqual(
    expect.objectContaining({
      status: expect.any(String),
      message: expect.any(String),
    }),
  );
}

function expectOrderMutationResponse(body: OrderMutationResponse, options: { requireStatus: boolean }) {
  expect(body).toEqual(
    expect.objectContaining({
      result: expect.objectContaining({
        orderId: expect.any(String),
        ublXmlUrl: expect.any(String),
      }),
    }),
  );

  if (options.requireStatus) {
    expect(body.result.status).toBe('success');
  }
}

function expectOrderRecord(body: UblOrderRecord) {
  expect(body).toEqual(
    expect.objectContaining({
      orderId: expect.any(String),
      UBLVersionID: expect.any(String),
      ID: expect.any(String),
      IssueDate: expect.any(String),
      BuyerCustomerParty: expect.objectContaining({
        Party: expect.objectContaining({
          PartyName: expect.arrayContaining([
            expect.objectContaining({
              Name: expect.any(String),
            }),
          ]),
        }),
      }),
      SellerSupplierParty: expect.objectContaining({
        Party: expect.objectContaining({
          PartyName: expect.arrayContaining([
            expect.objectContaining({
              Name: expect.any(String),
            }),
          ]),
        }),
      }),
      OrderLine: expect.arrayContaining([
        expect.objectContaining({
          LineItem: expect.objectContaining({
            ID: expect.any(String),
            Item: expect.objectContaining({
              Description: expect.arrayContaining([expect.any(String)]),
              Name: expect.any(String),
            }),
          }),
        }),
      ]),
    }),
  );
}

function expectStoredOrderRecord(body: StoredOrderRecord) {
  expect(body).toEqual(
    expect.objectContaining({
      _id: expect.any(String),
      data: expect.objectContaining({
        UBLVersionID: expect.any(String),
        ID: expect.any(String),
        IssueDate: expect.any(String),
        BuyerCustomerParty: expect.objectContaining({
          Party: expect.objectContaining({
            PartyName: expect.arrayContaining([
              expect.objectContaining({
                Name: expect.any(String),
              }),
            ]),
          }),
        }),
        SellerSupplierParty: expect.objectContaining({
          Party: expect.objectContaining({
            PartyName: expect.arrayContaining([
              expect.objectContaining({
                Name: expect.any(String),
              }),
            ]),
          }),
        }),
        OrderLine: expect.arrayContaining([
          expect.objectContaining({
            LineItem: expect.objectContaining({
              ID: expect.any(String),
              Item: expect.objectContaining({
                Description: expect.arrayContaining([expect.any(String)]),
                Name: expect.any(String),
              }),
            }),
          }),
        ]),
      }),
      createdAt: expect.any(String),
      modifiedAt: expect.any(String),
      orderId: expect.any(String),
      url: expect.any(String),
      userId: expect.any(String),
    }),
  );
}

function expectOrderListResponse(body: OrderListResponse) {
  expect(Array.isArray(body)).toBe(true);
  expect(body.length).toBeGreaterThanOrEqual(1);
  for (const order of body) {
    expectStoredOrderRecord(order);
  }
}

async function request(path: string, init: RequestInit = {}) {
  return fetch(`${baseUrl}${path}`, {
    ...init,
    headers: {
      'content-type': 'application/json',
      ...(init.headers ?? {}),
    },
  });
}

async function requestJson(path: string, init: RequestInit = {}) {
  const response = await request(path, init);
  const contentType = response.headers.get('content-type') ?? '';
  const body = contentType.includes('application/json') ? await response.json() : await response.text();

  return { response, body };
}

async function requestTyped<T extends OrderApiResponse>(path: string, init: RequestInit = {}) {
  const { response, body } = await requestJson(path, init);
  return { response, body: body as T };
}

async function registerUser(email: string, password: string) {
  const response = await requestTyped<AuthResponse>('/auth/register', {
    method: 'POST',
    body: JSON.stringify({
      email,
      password,
      nameFirst: 'John',
      nameLast: 'Tester',
    }),
  });

  expect(response.response.status).toBe(201);
  expectAuthResponse(response.body);

  return response.body;
}

async function withCreatedOrder(token: string, callback: (orderId: string) => Promise<void>) {
  const createResponse = await requestTyped<OrderMutationResponse>('/orders', {
    method: 'POST',
    headers: authHeaders(token),
    body: JSON.stringify(buildOrderPayload()),
  });

  expect(createResponse.response.status).toBe(201);
  expectOrderMutationResponse(createResponse.body, { requireStatus: true });

  const orderId = createResponse.body.result.orderId;

  try {
    await callback(orderId);
  } finally {
    const cleanupResponse = await requestJson(`/orders/${orderId}`, {
      method: 'DELETE',
      headers: authHeaders(token),
    });

    expect([200, 400, 404]).toContain(cleanupResponse.response.status);
  }
}

describeIfLive('OrderMS external API integration smoke tests', () => {
  const password = 'StrongPassword123!';
  let email = '';
  let token = '';

  beforeAll(async () => {
    email = `jamal-${Date.now()}-${Math.random().toString(16).slice(2)}@example.com`;
    const auth = await registerUser(email, password);
    token = auth.token;
  });

  it.skip('returns a healthy status payload', async () => {
    const { response, body } = await requestTyped<HealthResponse>('/health');

    expect(response.status).toBe(200);
    expectHealthResponse(body);
  });

  it.skip('registers a new user with the documented response shape', async () => {
    const newUser = await registerUser(`reg-${Date.now()}-${Math.random().toString(16).slice(2)}@example.com`, password);
    expectAuthResponse(newUser);
  });

  it.skip('logs in with valid credentials and rejects an invalid password', async () => {
    const success = await requestTyped<AuthResponse>('/auth/login', {
      method: 'POST',
      body: JSON.stringify({
        email,
        password,
      }),
    });

    expect(success.response.status).toBe(200);
    expectAuthResponse(success.body);

    const failure = await requestJson('/auth/login', {
      method: 'POST',
      body: JSON.stringify({
        email,
        password: 'WrongPassword123!',
      }),
    });

    expect(failure.response.status).toBe(401);
  });

  it.skip('creates an order and returns the documented create response', async () => {
    const createResponse = await requestTyped<OrderMutationResponse>('/orders', {
      method: 'POST',
      headers: authHeaders(token),
      body: JSON.stringify(buildOrderPayload()),
    });

    expect(createResponse.response.status).toBe(201);
    expectOrderMutationResponse(createResponse.body, { requireStatus: true });

    const cleanupResponse = await requestJson(`/orders/${createResponse.body.result.orderId}`, {
      method: 'DELETE',
      headers: authHeaders(token),
    });

    expect(cleanupResponse.response.status).toBe(200);
  }, 10000);

  it.skip('fetches a stored order as a typed record', async () => {
    await withCreatedOrder(token, async (orderId) => {
      const response = await requestTyped<OrderRecordResponse>(`/orders/${orderId}`, {
        headers: authHeaders(token),
      });

      expect(response.response.status).toBe(200);
      expectOrderRecord(response.body);
      expect(response.body.orderId).toBe(orderId);
    });
  });

  it.skip('lists orders and includes the created order in the response array', async () => {
    await withCreatedOrder(token, async (orderId) => {
      const response = await requestTyped<OrderListResponse>('/orders', {
        headers: authHeaders(token),
      });

      expect(response.response.status).toBe(200);
      expectOrderListResponse(response.body);
      expect(response.body.some((order) => order.orderId === orderId)).toBe(true);
    });
  });

  it.skip('returns the XML representation for a stored order', async () => {
    await withCreatedOrder(token, async (orderId) => {
      const response = await request(`/orders/${orderId}/xml`, {
        headers: authHeaders(token),
      });

      expect(response.status).toBe(200);
      expect(response.headers.get('content-type') ?? '').toContain('xml');

      const xmlBody = await response.text();
      expect(xmlBody).toContain('<Order');
      expect(xmlBody).toContain('</Order>');
    });
  });

  it.skip('updates an order and returns the documented update response', async () => {
    await withCreatedOrder(token, async (orderId) => {
      const response = await requestTyped<OrderMutationResponse>(`/orders/${orderId}`, {
        method: 'PUT',
        headers: authHeaders(token),
        body: JSON.stringify({
          ...buildOrderPayload(),
          BuyerCustomerParty: {
            Party: {
              PartyName: [{ Name: 'Test Buyer Updated' }],
            },
          },
        }),
      });

      expect(response.response.status).toBe(200);
      expectOrderMutationResponse(response.body, { requireStatus: false });
      expect(response.body.result.orderId).toBe(orderId);
    });
  }, 10000);

  it.skip('deletes an order and returns a typed deletion message', async () => {
    const createResponse = await requestTyped<OrderMutationResponse>('/orders', {
      method: 'POST',
      headers: authHeaders(token),
      body: JSON.stringify(buildOrderPayload()),
    });

    expect(createResponse.response.status).toBe(201);
    expectOrderMutationResponse(createResponse.body, { requireStatus: true });

    const orderId = createResponse.body.result.orderId;

    const deleteResponse = await requestTyped<MessageResponse>(`/orders/${orderId}`, {
      method: 'DELETE',
      headers: authHeaders(token),
    });

    expect(deleteResponse.response.status).toBe(200);
    expectMessageResponse(deleteResponse.body);

    const missingResponse = await requestJson(`/orders/${orderId}`, {
      headers: authHeaders(token),
    });

    expect([400, 404]).toContain(missingResponse.response.status);
  });

  it('generates a summary for the current user', async () => {
    await withCreatedOrder(token, async () => {
      const response = await requestTyped<SummaryResponse>('/summary', {
        method: 'POST',
        headers: authHeaders(token),
        body: JSON.stringify({}),
      });

      expect(response.response.status).toBe(200);
      expectSummaryResponse(response.body);
    });
  }, 50000);

  it.skip('logs out the current user with the documented response shape', async () => {
    const response = await requestTyped<MessageResponse>('/auth/logout', {
      method: 'POST',
      headers: authHeaders(token),
    });

    expect(response.response.status).toBe(200);
    expectMessageResponse(response.body);
  });
});