import * as fs from 'node:fs'
import * as path from 'node:path'

jest.setTimeout(120000)

const RUN_LIVE_TESTS = process.env.RUN_TEAPOT_INTERNAL === 'true'
const describeIfLive = RUN_LIVE_TESTS ? describe : describe.skip

const API_ORIGIN = (process.env.TEAPOT_API_ORIGIN ?? 'https://api.teapotinvoicing.app').replace(/\/$/, '')
const TEST_API_KEY = process.env.TEAPOT_API_KEY ?? '67amongus'
const TEST_LOGIN_EMAIL = process.env.TEAPOT_INTERNAL_TEST_EMAIL ?? 'jamie+test@jamiecole.dev'
const TEST_LOGIN_PASSWORD = process.env.TEAPOT_INTERNAL_TEST_PASSWORD ?? 'T)rVSqy;3NY:vq?'

const orderFixturePath = path.resolve(
  __dirname,
  '../../../dev/bruno/Invoice Generation/collections/Invoice Creation/Invoices/Create Invoice.bru',
)

const invoiceFixturePath = path.resolve(
  __dirname,
  '../../../src/schemas/ubl2.4/xslt/test-invoice.xml',
)

const orderFixture = fs.readFileSync(orderFixturePath, 'utf8')
const orderXmlMatch = orderFixture.match(/body:xml \{\n([\s\S]*?)\n\}\n\nvars:pre-request/)

if (!orderXmlMatch) {
  throw new Error('Unable to extract the sample order XML from the Bruno fixture')
}

const ORDER_XML = orderXmlMatch[1].replace(/^ {2}/gm, '').trim()
const SAMPLE_INVOICE_XML = fs.readFileSync(invoiceFixturePath, 'utf8').trim()

type ApiErrorResponse = {
  error: string
  message: string
}

type LoginResponse = {
  accessToken: string
  refreshToken: string
  message: string
}

type InvoiceSupplement = {
  invoiceNumber: string
  issueDate: string
  dueDate: string
  note: string
  currencyCode: string
  taxRate: number
  taxScheme: {
    id: string
    taxTypeCode: string
  }
  paymentMeans: {
    code: string
    payeeFinancialAccount: {
      id: string
      name: string
      branchId?: string
    }
  }
  paymentTerms: {
    note: string
  }
}

type CreateInvoiceRequest = {
  orderXml: string
  invoiceSupplement: InvoiceSupplement
}

type InvoiceRecord = {
  _id: string
  invoiceId: string
  status: string
  invoiceXml: string
  xmlSha256: string
  createdAt: string
  updatedAt: string
}

type InvoiceListResponse = InvoiceRecord[]

function uniqueSuffix() {
  return `${Date.now()}-${Math.random().toString(16).slice(2, 10)}`
}

function apiUrl(pathname: string) {
  return `${API_ORIGIN}${pathname}`
}

function apiKeyHeaders() {
  return {
    'x-api-key': TEST_API_KEY,
  }
}

function bearerHeaders(token: string) {
  return {
    authorization: `Bearer ${token}`,
  }
}

function jsonHeaders() {
  return {
    'content-type': 'application/json',
  }
}

function xmlHeaders() {
  return {
    'content-type': 'application/xml',
  }
}

function parseMaybeJson(text: string): unknown {
  try {
    return JSON.parse(text)
  } catch {
    return text
  }
}

async function request(pathname: string, init: RequestInit = {}) {
  return fetch(apiUrl(pathname), {
    ...init,
    headers: {
      ...(init.headers ?? {}),
    },
  })
}

async function requestJson(pathname: string, init: RequestInit = {}) {
  const response = await request(pathname, init)
  const text = await response.text()

  return {
    response,
    text,
    body: text ? parseMaybeJson(text) : null,
  }
}

async function requestText(pathname: string, init: RequestInit = {}) {
  const response = await request(pathname, init)
  const text = await response.text()

  return { response, text }
}

async function requestBuffer(pathname: string, init: RequestInit = {}) {
  const response = await request(pathname, init)
  const buffer = Buffer.from(await response.arrayBuffer())

  return { response, buffer }
}

function buildInvoiceSupplement(invoiceNumber: string): InvoiceSupplement {
  return {
    invoiceNumber,
    issueDate: new Date().toISOString().slice(0, 10),
    dueDate: new Date(Date.now() + 7 * 24 * 60 * 60 * 1000).toISOString().slice(0, 10),
    note: 'Internal deployed API test invoice',
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
      note: 'Deployed API smoke test',
    },
  }
}

function buildCreateInvoiceRequest(invoiceNumber: string): CreateInvoiceRequest {
  return {
    orderXml: ORDER_XML,
    invoiceSupplement: buildInvoiceSupplement(invoiceNumber),
  }
}

async function login() {
  const result = await requestJson('/api/v2/auth/login', {
    method: 'POST',
    headers: jsonHeaders(),
    body: JSON.stringify({
      email: TEST_LOGIN_EMAIL,
      password: TEST_LOGIN_PASSWORD,
    }),
  })

  expect(result.response.status).toBe(200)
  expect(result.body).toEqual(
    expect.objectContaining({
      accessToken: expect.any(String),
      refreshToken: expect.any(String),
      message: 'Login successful',
    }),
  )

  return result.body as LoginResponse
}

async function createV1Invoice(invoiceNumber: string) {
  const expectedInvoiceId = `INV-${invoiceNumber}`
  const response = await requestText('/api/v1/invoices', {
    method: 'POST',
    headers: {
      ...apiKeyHeaders(),
      ...jsonHeaders(),
    },
    body: JSON.stringify(buildCreateInvoiceRequest(invoiceNumber)),
  })

  expect(response.response.status).toBe(201)
  expect(response.response.headers.get('content-type') ?? '').toContain('xml')
  expect(response.text).toContain('<Invoice')
  expect(response.text).toContain(expectedInvoiceId)

  return {
    invoiceNumber,
    invoiceId: expectedInvoiceId,
    invoiceXml: response.text,
  }
}

async function listV1Invoices() {
  const response = await requestJson('/api/v1/invoices', {
    method: 'GET',
    headers: apiKeyHeaders(),
  })

  expect(response.response.status).toBe(200)
  expect(Array.isArray(response.body)).toBe(true)

  return response.body as InvoiceListResponse
}

async function getV1InvoiceRecord(invoiceId: string) {
  const invoices = await listV1Invoices()
  const record = invoices.find((entry) => entry.invoiceId === invoiceId)

  expect(record).toBeDefined()

  return record as InvoiceRecord
}

async function deleteV1Invoice(recordId: string) {
  const response = await request(`/api/v1/invoices/${recordId}`, {
    method: 'DELETE',
    headers: apiKeyHeaders(),
  })

  expect(response.status).toBe(204)
}

async function createV1Pdf(invoiceXml: string) {
  const response = await requestBuffer('/api/v1/invoices/pdf', {
    method: 'POST',
    headers: {
      ...apiKeyHeaders(),
      ...xmlHeaders(),
    },
    body: invoiceXml,
  })

  expect(response.response.status).toBe(201)
  expect(response.response.headers.get('content-type') ?? '').toContain('pdf')
  expect(response.buffer.byteLength).toBeGreaterThan(0)
}

async function createV2Invoice(token: string, invoiceNumber: string) {
  const expectedInvoiceId = `INV-${invoiceNumber}`
  const response = await requestText('/api/v2/invoices', {
    method: 'POST',
    headers: {
      ...bearerHeaders(token),
      ...jsonHeaders(),
    },
    body: JSON.stringify(buildCreateInvoiceRequest(invoiceNumber)),
  })

  expect(response.response.status).toBe(201)
  expect(response.response.headers.get('content-type') ?? '').toContain('xml')
  expect(response.text).toContain('<Invoice')
  expect(response.text).toContain(expectedInvoiceId)

  return response.text
}

async function createV2Pdf(token: string, invoiceXml: string) {
  const response = await requestBuffer('/api/v2/invoices/pdf', {
    method: 'POST',
    headers: {
      ...bearerHeaders(token),
      ...xmlHeaders(),
    },
    body: invoiceXml,
  })

  expect(response.response.status).toBe(201)
  expect(response.response.headers.get('content-type') ?? '').toContain('pdf')
  expect(response.response.headers.get('content-disposition') ?? '').toContain('.pdf')
  expect(response.response.headers.get('x-invoice-url')).toBeTruthy()
  expect(response.buffer.byteLength).toBeGreaterThan(0)
}

describeIfLive('deployed API HTTP coverage', () => {
  let authSession: LoginResponse

  beforeAll(async () => {
    expect(TEST_API_KEY).toBeTruthy()
    expect(TEST_LOGIN_EMAIL).toBeTruthy()
    expect(TEST_LOGIN_PASSWORD).toBeTruthy()

    authSession = await login()
  })

  it('returns the v1 health payload', async () => {
    const response = await requestJson('/api/v1/health')

    expect(response.response.status).toBe(200)
    expect(response.body).toEqual(
      expect.objectContaining({
        status: 'ok',
        service: 'ubl-invoice-generator',
        version: '1.0.0',
        uptimeSeconds: expect.any(Number),
      }),
    )
  })

  it('rejects v1 order validation without an API key', async () => {
    const response = await requestJson('/api/v1/orders/validate', {
      method: 'POST',
      headers: jsonHeaders(),
      body: JSON.stringify({ orderXml: ORDER_XML }),
    })

    expect(response.response.status).toBe(401)
    expect(response.body).toEqual(
      expect.objectContaining<ApiErrorResponse>({
        error: 'UNAUTHORIZED',
        message: 'Invalid or missing API key',
      }),
    )
  })

  it('accepts v1 order validation with an API key', async () => {
    const response = await requestJson('/api/v1/orders/validate', {
      method: 'POST',
      headers: {
        ...apiKeyHeaders(),
        ...jsonHeaders(),
      },
      body: JSON.stringify({ orderXml: ORDER_XML }),
    })

    expect(response.response.status).toBe(200)
    expect(response.body).toEqual({
      message: 'UBL Order is valid!',
    })
  })

  it('rejects v1 order validation for malformed XML', async () => {
    const response = await requestJson('/api/v1/orders/validate', {
      method: 'POST',
      headers: {
        ...apiKeyHeaders(),
        ...jsonHeaders(),
      },
      body: JSON.stringify({ orderXml: 'not xml' }),
    })

    expect(response.response.status).toBe(400)
  })

  it('rejects v1 invoice creation with a missing invoiceSupplement', async () => {
    const response = await requestJson('/api/v1/invoices', {
      method: 'POST',
      headers: {
        ...apiKeyHeaders(),
        ...jsonHeaders(),
      },
      body: JSON.stringify({ orderXml: ORDER_XML }),
    })

    expect(response.response.status).toBe(400)
  })

  it('rejects v1 invoice validation for malformed XML', async () => {
    const response = await requestJson('/api/v1/invoices/validate', {
      method: 'POST',
      headers: {
        ...apiKeyHeaders(),
        ...jsonHeaders(),
      },
      body: JSON.stringify({ invoiceXml: 'not xml' }),
    })

    expect(response.response.status).toBe(400)
  })

  it('rejects v1 PDF generation for malformed XML', async () => {
    const response = await requestJson('/api/v1/invoices/pdf', {
      method: 'POST',
      headers: {
        ...apiKeyHeaders(),
        ...xmlHeaders(),
      },
      body: 'not xml',
    })

    expect(response.response.status).toBe(500)
  })

  it('creates a v1 invoice XML document', async () => {
    const invoiceNumber = `V1-CREATE-${uniqueSuffix()}`
    await createV1Invoice(invoiceNumber)
  })

  it('lists v1 invoices and includes a newly created invoice', async () => {
    const invoiceNumber = `V1-LIST-${uniqueSuffix()}`
    const created = await createV1Invoice(invoiceNumber)

    const invoices = await listV1Invoices()
    expect(invoices.some((entry) => entry.invoiceId === created.invoiceId)).toBe(true)

    const record = await getV1InvoiceRecord(created.invoiceId)
    await deleteV1Invoice(record._id)
  }, 60000)

  it('fetches a v1 invoice by id', async () => {
    const invoiceNumber = `V1-GET-${uniqueSuffix()}`
    const created = await createV1Invoice(invoiceNumber)
    const record = await getV1InvoiceRecord(created.invoiceId)

    const response = await requestJson(`/api/v1/invoices/${record._id}`, {
      method: 'GET',
      headers: apiKeyHeaders(),
    })

    expect(response.response.status).toBe(200)
    expect(response.body).toEqual(
      expect.objectContaining({
        invoiceId: created.invoiceId,
      }),
    )

    await deleteV1Invoice(record._id)
  }, 60000)

  it('returns 404 for a deleted v1 invoice when fetched', async () => {
    const invoiceNumber = `V1-GET-404-${uniqueSuffix()}`
    const created = await createV1Invoice(invoiceNumber)
    const record = await getV1InvoiceRecord(created.invoiceId)

    await deleteV1Invoice(record._id)

    const response = await requestJson(`/api/v1/invoices/${record._id}`, {
      method: 'GET',
      headers: apiKeyHeaders(),
    })

    expect(response.response.status).toBe(404)
  })

  it('returns 404 for a deleted v1 invoice when updated', async () => {
    const invoiceNumber = `V1-PUT-404-${uniqueSuffix()}`
    const created = await createV1Invoice(invoiceNumber)
    const record = await getV1InvoiceRecord(created.invoiceId)

    await deleteV1Invoice(record._id)

    const response = await requestJson(`/api/v1/invoices/${record._id}`, {
      method: 'PUT',
      headers: {
        ...apiKeyHeaders(),
        ...jsonHeaders(),
      },
      body: JSON.stringify(buildCreateInvoiceRequest(`V1-PUT-404-${uniqueSuffix()}`)),
    })

    expect(response.response.status).toBe(404)
  })

  it('updates a v1 invoice by id', async () => {
    const invoiceNumber = `V1-UPDATE-${uniqueSuffix()}`
    const created = await createV1Invoice(invoiceNumber)
    const record = await getV1InvoiceRecord(created.invoiceId)
    const updatedInvoiceNumber = `V1-UPDATED-${uniqueSuffix()}`
    const updatedInvoiceId = `INV-${updatedInvoiceNumber}`

    const response = await requestText(`/api/v1/invoices/${record._id}`, {
      method: 'PUT',
      headers: {
        ...apiKeyHeaders(),
        ...jsonHeaders(),
      },
      body: JSON.stringify(buildCreateInvoiceRequest(updatedInvoiceNumber)),
    })

    expect(response.response.status).toBe(200)
    expect(response.response.headers.get('content-type') ?? '').toContain('xml')
    expect(response.text).toContain(updatedInvoiceId)

    await deleteV1Invoice(record._id)
  }, 60000)

  it('deletes a v1 invoice by id', async () => {
    const invoiceNumber = `V1-DELETE-${uniqueSuffix()}`
    const created = await createV1Invoice(invoiceNumber)
    const record = await getV1InvoiceRecord(created.invoiceId)

    const response = await request(`/api/v1/invoices/${record._id}`, {
      method: 'DELETE',
      headers: apiKeyHeaders(),
    })

    expect(response.status).toBe(204)
  }, 60000)

  it('creates a v1 invoice PDF', async () => {
    await createV1Pdf(SAMPLE_INVOICE_XML)
  })

  it('returns 404 for an invalid public invoice PDF hash', async () => {
    const response = await request('/invoices/does-not-exist.pdf', {
      method: 'GET',
    })

    expect(response.status).toBe(404)
  })

  it('logs in with the deployed v2 test account', async () => {
    expect(authSession.accessToken).toEqual(expect.any(String))
    expect(authSession.refreshToken).toEqual(expect.any(String))
  })

  it('rejects v2 auth user requests without bearer auth', async () => {
    const response = await requestJson('/api/v2/auth/user', {
      method: 'GET',
    })

    expect(response.response.status).toBe(401)
  })

  it('rejects v2 auth user requests with a malformed bearer token', async () => {
    const response = await requestJson('/api/v2/auth/user', {
      method: 'GET',
      headers: bearerHeaders('not-a-real-token'),
    })

    expect(response.response.status).toBe(401)
  })

  it('returns the current v2 user profile', async () => {
    const response = await requestJson('/api/v2/auth/user', {
      method: 'GET',
      headers: bearerHeaders(authSession.accessToken),
    })

    expect(response.response.status).toBe(200)
    expect(response.body).toEqual(
      expect.objectContaining({
        email: TEST_LOGIN_EMAIL,
        message: 'User profile retrieved successfully',
      }),
    )
  })

  it('refreshes the deployed v2 access token', async () => {
    const response = await requestJson('/api/v2/auth/refresh-token', {
      method: 'POST',
      headers: jsonHeaders(),
      body: JSON.stringify({ refreshToken: authSession.refreshToken }),
    })

    expect(response.response.status).toBe(200)
    expect(response.body).toEqual(
      expect.objectContaining({
        accessToken: expect.any(String),
        message: 'Access token refreshed',
      }),
    )
  })

  it('rejects v2 refresh-token with an invalid token', async () => {
    const response = await requestJson('/api/v2/auth/refresh-token', {
      method: 'POST',
      headers: jsonHeaders(),
      body: JSON.stringify({ refreshToken: 'invalid-refresh-token' }),
    })

    expect(response.response.status).toBe(401)
  })

  it('rejects v2 login with an invalid password', async () => {
    const response = await requestJson('/api/v2/auth/login', {
      method: 'POST',
      headers: jsonHeaders(),
      body: JSON.stringify({
        email: TEST_LOGIN_EMAIL,
        password: 'wrong-password',
      }),
    })

    expect(response.response.status).toBe(401)
  })

  it('rejects v2 password reset requests without an email', async () => {
    const response = await requestJson('/api/v2/auth/password-reset/request', {
      method: 'POST',
      headers: jsonHeaders(),
      body: JSON.stringify({}),
    })

    expect(response.response.status).toBe(400)
  })

  it('rejects v2 password reset confirm with an invalid token', async () => {
    const response = await requestJson('/api/v2/auth/password-reset/confirm', {
      method: 'POST',
      headers: jsonHeaders(),
      body: JSON.stringify({
        token: 'invalid-token',
        password: 'ValidPassword123!',
      }),
    })

    expect(response.response.status).toBe(400)
  })

  it('rejects v2 order validation without bearer auth', async () => {
    const response = await requestJson('/api/v2/orders/validate', {
      method: 'POST',
      headers: jsonHeaders(),
      body: JSON.stringify({ orderXml: ORDER_XML }),
    })

    expect(response.response.status).toBe(401)
  })

  it('accepts v2 order validation with bearer auth', async () => {
    const response = await requestJson('/api/v2/orders/validate', {
      method: 'POST',
      headers: {
        ...jsonHeaders(),
        ...bearerHeaders(authSession.accessToken),
      },
      body: JSON.stringify({ orderXml: ORDER_XML }),
    })

    expect(response.response.status).toBe(200)
    expect(response.body).toEqual({
      message: 'UBL Order is valid!',
    })
  })

  it('rejects v2 invoice creation without bearer auth', async () => {
    const response = await requestJson('/api/v2/invoices', {
      method: 'POST',
      headers: jsonHeaders(),
      body: JSON.stringify(buildCreateInvoiceRequest(`V2-NOAUTH-${uniqueSuffix()}`)),
    })

    expect(response.response.status).toBe(401)
  })

  it('rejects v2 invoice validation without bearer auth', async () => {
    const response = await requestJson('/api/v2/invoices/validate', {
      method: 'POST',
      headers: jsonHeaders(),
      body: JSON.stringify({ invoiceXml: SAMPLE_INVOICE_XML }),
    })

    expect(response.response.status).toBe(401)
  })

  it('rejects v2 invoice creation for malformed order XML', async () => {
    const response = await requestJson('/api/v2/invoices', {
      method: 'POST',
      headers: {
        ...bearerHeaders(authSession.accessToken),
        ...jsonHeaders(),
      },
      body: JSON.stringify({
        orderXml: 'not xml',
        invoiceSupplement: buildInvoiceSupplement(`V2-BAD-${uniqueSuffix()}`),
      }),
    })

    expect(response.response.status).toBe(400)
  })

  it('creates a v2 invoice XML document', async () => {
    const invoiceNumber = `V2-CREATE-${uniqueSuffix()}`
    await createV2Invoice(authSession.accessToken, invoiceNumber)
  })

  it('validates a v2 invoice XML document', async () => {
    const response = await requestJson('/api/v2/invoices/validate', {
      method: 'POST',
      headers: {
        ...jsonHeaders(),
        ...bearerHeaders(authSession.accessToken),
      },
      body: JSON.stringify({ invoiceXml: SAMPLE_INVOICE_XML }),
    })

    expect(response.response.status).toBe(200)
    expect(response.body).toEqual({
      message: 'UBL Invoice is valid!',
    })
  })

  it('creates a v2 invoice PDF', async () => {
    await createV2Pdf(authSession.accessToken, SAMPLE_INVOICE_XML)
  })

  it('rejects v2 invoice PDF generation without bearer auth', async () => {
    const response = await requestJson('/api/v2/invoices/pdf', {
      method: 'POST',
      headers: xmlHeaders(),
      body: SAMPLE_INVOICE_XML,
    })

    expect(response.response.status).toBe(401)
  })

  it('rejects a v2 invoice email request with an invalid recipient', async () => {
    const response = await requestJson('/api/v2/invoices/email', {
      method: 'POST',
      headers: {
        ...jsonHeaders(),
        ...bearerHeaders(authSession.accessToken),
      },
      body: JSON.stringify({
        invoiceXml: SAMPLE_INVOICE_XML,
        to: 'not-an-email',
      }),
    })

    expect(response.response.status).toBe(400)
    expect(response.body).toEqual(
      expect.objectContaining({
        message: 'Invalid recipient email address',
      }),
    )
  })
})
