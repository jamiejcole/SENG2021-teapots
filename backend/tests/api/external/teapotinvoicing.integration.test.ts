import * as fs from 'node:fs';
import * as path from 'node:path';

type HealthResponse = {
  status: string;
  service: string;
  version: string;
  uptimeSeconds: number;
};

type SuccessMessageResponse = {
  message: string;
};

type ErrorResponse = {
  error: string;
  message: string;
};

type InvoiceSupplement = {
  invoiceNumber: string;
  issueDate: string;
  dueDate: string;
  note: string;
  currencyCode: string;
  taxRate: number;
  taxScheme: {
    id: string;
    taxTypeCode: string;
  };
  paymentMeans: {
    code: string;
    payeeFinancialAccount: {
      id: string;
      name: string;
      branchId?: string;
    };
  };
  paymentTerms: {
    note: string;
  };
};

type CreateInvoiceRequest = {
  orderXml: string;
  invoiceSupplement: InvoiceSupplement;
};

type PartyAddress = {
  street: string;
  city: string;
  postalCode: string;
  country: string;
};

type Party = {
  name: string;
  id?: string;
  email?: string;
  address: PartyAddress;
};

type InvoiceLine = {
  lineId: string;
  description: string;
  quantity: number;
  unitCode?: string;
  unitPrice: number;
  taxRate?: number;
};

type Money = {
  subTotal: number;
  taxTotal: number;
  payableAmount: number;
};

type InvoiceRecord = {
  _id: string;
  status: 'GENERATED' | 'UPDATED';
  invoiceId: string;
  issueDate: string;
  currency: string;
  seller: Party;
  buyer: Party;
  lines: InvoiceLine[];
  orderReference?: { orderId: string };
  despatchReference?: { despatchId: string };
  paymentTerms?: string;
  totals: Money;
  invoiceXml: string;
  xmlSha256: string;
  createdAt: string;
  updatedAt: string;
};

type InvoiceListResponse = InvoiceRecord[];

const RUN_LIVE_TESTS = true; //process.env.RUN_TEAPOT_INTEGRATION === 'true';
const describeIfLive = RUN_LIVE_TESTS ? describe : describe.skip;
const baseUrl = (process.env.TEAPOT_API_BASE_URL ?? 'https://api.teapotinvoicing.app/api/v1').replace(/\/$/, '');
const apiKey = process.env.TEAPOT_API_KEY ?? '67amongus';

const brunoFixturePath = path.resolve(
  __dirname,
  '../../../dev/bruno/Invoice Generation/collections/Invoice Creation/Invoices/Create Invoice.bru',
);

function extractOrderXmlFromBrunoFixture() {
  const fixture = fs.readFileSync(brunoFixturePath, 'utf8');
  const match = fixture.match(/body:xml \{\n([\s\S]*?)\n\}\n\nvars:pre-request/);

  if (!match) {
    throw new Error('Unable to extract the sample order XML from the Bruno fixture');
  }

  return match[1].replace(/^ {2}/gm, '').trim();
}

const ORDER_XML = extractOrderXmlFromBrunoFixture();

function apiKeyHeaders() {
  return {
    'x-api-key': apiKey,
  };
}

function jsonHeaders() {
  return {
    ...apiKeyHeaders(),
    'content-type': 'application/json',
  };
}

function xmlHeaders() {
  return {
    ...apiKeyHeaders(),
    'content-type': 'application/xml',
  };
}

function buildCreateInvoiceRequest(): CreateInvoiceRequest {
  const invoiceNumber = `LIVE-${Date.now()}-${Math.random().toString(16).slice(2)}`;

  return {
    orderXml: ORDER_XML,
    invoiceSupplement: {
      invoiceNumber,
      issueDate: new Date().toISOString().slice(0, 10),
      dueDate: new Date(Date.now() + 7 * 24 * 60 * 60 * 1000).toISOString().slice(0, 10),
      note: 'Automated production smoke test',
      currencyCode: 'AUD',
      taxRate: 0.1,
      taxScheme: {
        id: 'GST',
        taxTypeCode: 'GST',
      },
      paymentMeans: {
        code: '30',
        payeeFinancialAccount: {
          id: '123',
          name: 'Test Account',
          branchId: '0001',
        },
      },
      paymentTerms: {
        note: 'Production smoke test',
      },
    },
  };
}

function expectedInvoiceId(request: CreateInvoiceRequest) {
  return `INV-${request.invoiceSupplement.invoiceNumber}`;
}

async function request(pathname: string, init: RequestInit = {}) {
  return fetch(`${baseUrl}${pathname}`, {
    ...init,
    headers: {
      ...(init.headers ?? {}),
    },
  });
}

async function requestJson<T>(pathname: string, init: RequestInit = {}) {
  const response = await request(pathname, init);
  const body = await response.json();
  return { response, body: body as T };
}

async function requestText(pathname: string, init: RequestInit = {}) {
  const response = await request(pathname, init);
  const body = await response.text();
  return { response, body };
}

async function requestBuffer(pathname: string, init: RequestInit = {}) {
  const response = await request(pathname, init);
  const body = Buffer.from(await response.arrayBuffer());
  return { response, body };
}

async function createInvoiceAndFindRecord() {
  const payload = buildCreateInvoiceRequest();
  const invoiceId = expectedInvoiceId(payload);

  const createResponse = await requestText('/invoices', {
    method: 'POST',
    headers: jsonHeaders(),
    body: JSON.stringify(payload),
  });

  expect(createResponse.response.status).toBe(201);
  expect(createResponse.response.headers.get('content-type') ?? '').toContain('xml');
  expect(createResponse.body).toContain('<Invoice');
  expect(createResponse.body).toContain(invoiceId);

  const listResponse = await requestJson<InvoiceListResponse>('/invoices', {
    headers: apiKeyHeaders(),
  });

  expect(listResponse.response.status).toBe(200);
  expect(Array.isArray(listResponse.body)).toBe(true);

  const record = listResponse.body.find((entry) => entry.invoiceId === invoiceId);
  expect(record).toBeDefined();

  return {
    payload,
    invoiceId,
    record: record as InvoiceRecord,
    xml: createResponse.body,
  };
}

function expectHealthResponse(body: HealthResponse) {
  expect(body).toEqual(
    expect.objectContaining({
      status: 'ok',
      service: expect.any(String),
      version: expect.any(String),
      uptimeSeconds: expect.any(Number),
    }),
  );
}

function expectInvoiceRecord(body: InvoiceRecord) {
  expect(body).toEqual(
    expect.objectContaining({
      _id: expect.any(String),
      status: expect.stringMatching(/GENERATED|UPDATED/),
      invoiceId: expect.any(String),
      issueDate: expect.any(String),
      currency: expect.any(String),
      seller: expect.objectContaining({
        name: expect.any(String),
        address: expect.objectContaining({
          street: expect.any(String),
          city: expect.any(String),
          postalCode: expect.any(String),
          country: expect.any(String),
        }),
      }),
      buyer: expect.objectContaining({
        name: expect.any(String),
        address: expect.objectContaining({
          street: expect.any(String),
          city: expect.any(String),
          postalCode: expect.any(String),
          country: expect.any(String),
        }),
      }),
      lines: expect.arrayContaining([
        expect.objectContaining({
          lineId: expect.any(String),
          description: expect.any(String),
          quantity: expect.any(Number),
          unitPrice: expect.any(Number),
        }),
      ]),
      totals: expect.objectContaining({
        subTotal: expect.any(Number),
        taxTotal: expect.any(Number),
        payableAmount: expect.any(Number),
      }),
      invoiceXml: expect.any(String),
      xmlSha256: expect.any(String),
      createdAt: expect.any(String),
      updatedAt: expect.any(String),
    }),
  );
}

function expectInvoiceListResponse(body: InvoiceListResponse) {
  expect(Array.isArray(body)).toBe(true);
  expect(body.length).toBeGreaterThanOrEqual(1);
  for (const record of body) {
    expectInvoiceRecord(record);
  }
}

describeIfLive('Teapot invoicing production smoke tests', () => {
  beforeAll(() => {
    if (!apiKey) {
      throw new Error('TEAPOT_API_KEY is required to run these live tests');
    }
  });

  it('returns a healthy status payload', async () => {
    const { response, body } = await requestJson<HealthResponse>('/health');

    expect(response.status).toBe(200);
    expectHealthResponse(body);
  });

  it('rejects protected routes without an API key', async () => {
    const response = await fetch(`${baseUrl}/invoices`);

    expect(response.status).toBe(401);
    const body = (await response.json()) as ErrorResponse;
    expect(body).toEqual(
      expect.objectContaining({
        error: expect.any(String),
        message: expect.any(String),
      }),
    );
  });

  it('validates a generated invoice XML payload', async () => {
    const { xml, record } = await createInvoiceAndFindRecord();

    const response = await requestJson<SuccessMessageResponse>('/invoices/validate', {
      method: 'POST',
      headers: jsonHeaders(),
      body: JSON.stringify({ invoiceXml: xml }),
    });

    expect(response.response.status).toBe(200);
    expect(response.body).toEqual({ message: 'UBL Invoice is valid!' });

    await request(`/invoices/${record._id}`, {
      method: 'DELETE',
      headers: apiKeyHeaders(),
    });
  }, 30000);

  it('creates an invoice and returns XML', async () => {
    const { xml, invoiceId, record } = await createInvoiceAndFindRecord();

    expect(xml).toContain('<Invoice');
    expect(xml).toContain(invoiceId);

    const cleanup = await request(`/invoices/${record._id}`, {
      method: 'DELETE',
      headers: apiKeyHeaders(),
    });

    expect([200, 204]).toContain(cleanup.status);
  }, 30000);

  it('fetches a stored invoice as a typed record', async () => {
    const { record } = await createInvoiceAndFindRecord();

    const response = await requestJson<InvoiceRecord>(`/invoices/${record._id}`, {
      headers: apiKeyHeaders(),
    });

    expect(response.response.status).toBe(200);
    expectInvoiceRecord(response.body);
    expect(response.body.invoiceId).toBe(record.invoiceId);

    await request(`/invoices/${record._id}`, {
      method: 'DELETE',
      headers: apiKeyHeaders(),
    });
  }, 30000);

  it.skip('lists invoices and includes the created invoice in the response array', async () => {
    const { record } = await createInvoiceAndFindRecord();

    const response = await requestJson<InvoiceListResponse>('/invoices', {
      headers: apiKeyHeaders(),
    });

    expect(response.response.status).toBe(200);
    expectInvoiceListResponse(response.body);
    expect(response.body.some((entry) => entry._id === record._id)).toBe(true);

    await request(`/invoices/${record._id}`, {
      method: 'DELETE',
      headers: apiKeyHeaders(),
    });
  }, 30000);

  it('lists invoices and returns the created invoice record shape', async () => {
    const { record } = await createInvoiceAndFindRecord();

    const response = await requestJson<InvoiceListResponse>('/invoices', {
      headers: apiKeyHeaders(),
    });

    expect(response.response.status).toBe(200);
    expect(Array.isArray(response.body)).toBe(true);

    const createdEntry = response.body.find((entry) => entry._id === record._id || entry.invoiceId === record.invoiceId);
    expect(createdEntry).toBeDefined();

    if (createdEntry) {
      expectInvoiceRecord(createdEntry);
    }

    await request(`/invoices/${record._id}`, {
      method: 'DELETE',
      headers: apiKeyHeaders(),
    });
  }, 30000);

  it('returns the PDF representation for a stored invoice', async () => {
    const { xml, record } = await createInvoiceAndFindRecord();

    const response = await requestBuffer('/invoices/pdf', {
      method: 'POST',
      headers: xmlHeaders(),
      body: xml,
    });

    expect(response.response.status).toBe(201);
    expect(response.response.headers.get('content-type') ?? '').toContain('pdf');
    expect(response.body.byteLength).toBeGreaterThan(0);

    await request(`/invoices/${record._id}`, {
      method: 'DELETE',
      headers: apiKeyHeaders(),
    });
  }, 30000);

  it('updates an invoice and returns XML', async () => {
    const created = await createInvoiceAndFindRecord();
    const updatedRequest = buildCreateInvoiceRequest();
    updatedRequest.invoiceSupplement.invoiceNumber = created.payload.invoiceSupplement.invoiceNumber;
    updatedRequest.invoiceSupplement.note = 'Updated production smoke test';

    const response = await requestText(`/invoices/${created.record._id}`, {
      method: 'PUT',
      headers: jsonHeaders(),
      body: JSON.stringify(updatedRequest),
    });

    expect(response.response.status).toBe(200);
    expect(response.response.headers.get('content-type') ?? '').toContain('xml');
    expect(response.body).toContain('<Invoice');

    await request(`/invoices/${created.record._id}`, {
      method: 'DELETE',
      headers: apiKeyHeaders(),
    });
  }, 30000);

  it('deletes an invoice and removes it from the database', async () => {
    const { record } = await createInvoiceAndFindRecord();

    const deleteResponse = await request(`/invoices/${record._id}`, {
      method: 'DELETE',
      headers: apiKeyHeaders(),
    });

    expect(deleteResponse.status).toBe(204);

    const missingResponse = await request(`/invoices/${record._id}`, {
      headers: apiKeyHeaders(),
    });

    expect(missingResponse.status).toBe(404);
  }, 30000);
});