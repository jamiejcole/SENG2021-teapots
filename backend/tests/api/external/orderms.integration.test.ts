/**
 * Test Suite for 'Microslop' Order API
 * Swagger URL: https://docs.orderms.tech/
 * API Base:    https://api.orderms.tech/v1/
 */

type JsonRecord = Record<string, unknown>;

type AuthResponse = {
  userId: string;
  token: string;
};

const runLiveTests = true; //process.env.RUN_ORDERMS_INTEGRATION === 'true';
const describeIfLive = runLiveTests ? describe : describe.skip;
const baseUrl = (process.env.ORDERMS_API_BASE_URL ?? 'https://api.orderms.tech/v1').replace(/\/$/, '');

function authHeaders(token: string) {
  return {
    token,
    Authorization: `Bearer ${token}`,
  };
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

describeIfLive('OrderMS external API integration smoke tests', () => {
  const password = 'StrongPassword123!';
  const orderId = `ORD-${Date.now()}`;
  const issueDate = new Date().toISOString().slice(0, 10);

  const orderPayload = {
    ID: orderId,
    IssueDate: issueDate,
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

  let token = '';
  let createdOrderId = '';
  let email = '';

  beforeAll(async () => {
    email = `copilot-${Date.now()}-${Math.random().toString(16).slice(2)}@example.com`;

    const { response, body } = await requestJson('/auth/register', {
      method: 'POST',
      body: JSON.stringify({
        email,
        password,
        nameFirst: 'Copilot',
        nameLast: 'Tester',
      }),
    });

    expect(response.status).toBe(201);
    expect(body).toEqual(expect.objectContaining({ token: expect.any(String), userId: expect.any(String) }));

    token = (body as AuthResponse).token;
  });

  afterAll(async () => {
    if (createdOrderId && token) {
      await request(`/orders/${createdOrderId}`, {
        method: 'DELETE',
        headers: authHeaders(token),
      });
    }
  });

  it('returns a healthy status payload', async () => {
    const { response, body } = await requestJson('/health');

    expect(response.status).toBe(200);
    expect(body).toEqual(
      expect.objectContaining({
        status: 'healthy',
        service: 'order',
      }),
    );
  });

  it('logs in with valid credentials and rejects an invalid password', async () => {
    const success = await requestJson('/auth/login', {
      method: 'POST',
      body: JSON.stringify({
        email,
        password,
      }),
    });

    expect(success.response.status).toBe(200);
    expect(success.body).toEqual(expect.objectContaining({ token: expect.any(String), userId: expect.any(String) }));

    const failure = await requestJson('/auth/login', {
      method: 'POST',
      body: JSON.stringify({
        email,
        password: 'WrongPassword123!',
      }),
    });

    expect(failure.response.status).toBe(401);
  });

  it('creates, fetches, lists, updates, and deletes an order', async () => {
    const create = await requestJson('/orders', {
      method: 'POST',
      headers: authHeaders(token),
      body: JSON.stringify(orderPayload),
    });

    expect(create.response.status).toBe(201);
    expect(create.body).toEqual(expect.objectContaining({ orderId: expect.anything() }));

    createdOrderId = String((create.body as JsonRecord).orderId ?? '');
    expect(createdOrderId).not.toHaveLength(0);

    const fetched = await requestJson(`/orders/${createdOrderId}`, {
      headers: authHeaders(token),
    });

    expect(fetched.response.status).toBe(200);
    expect(fetched.body).toEqual(expect.objectContaining({ orderId: createdOrderId }));

    const listed = await requestJson('/orders', {
      headers: authHeaders(token),
    });

    expect(listed.response.status).toBe(200);
    expect(Array.isArray(listed.body)).toBe(true);
    expect((listed.body as JsonRecord[]).some((order) => String(order.orderId) === createdOrderId)).toBe(true);

    const xmlResponse = await request(`/orders/${createdOrderId}/xml`, {
      headers: authHeaders(token),
    });

    expect(xmlResponse.status).toBe(200);
    expect(xmlResponse.headers.get('content-type') ?? '').toContain('xml');

    const xmlBody = await xmlResponse.text();
    expect(xmlBody).toContain('<Order');

    const update = await requestJson(`/orders/${createdOrderId}`, {
      method: 'PUT',
      headers: authHeaders(token),
      body: JSON.stringify({
        ...orderPayload,
        BuyerCustomerParty: {
          Party: {
            PartyName: [{ Name: 'Test Buyer Updated' }],
          },
        },
      }),
    });

    expect(update.response.status).toBe(200);

    const deleted = await requestJson(`/orders/${createdOrderId}`, {
      method: 'DELETE',
      headers: authHeaders(token),
    });

    expect(deleted.response.status).toBe(200);

    const missing = await requestJson(`/orders/${createdOrderId}`, {
      headers: authHeaders(token),
    });

    expect([400, 404]).toContain(missing.response.status);
  });
});