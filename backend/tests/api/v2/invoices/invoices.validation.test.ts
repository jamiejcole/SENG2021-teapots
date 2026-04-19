export {}

const parseXml = jest.fn()
const saxonTransform = jest.fn()
const puppeteerLaunch = jest.fn()
let setContentMock: jest.Mock

jest.mock('node:fs', () => {
  const actualFs = jest.requireActual('node:fs') as typeof import('node:fs')

  return {
    __esModule: true,
    ...actualFs,
    existsSync: jest.fn((filePath: string) => {
      if (filePath === '/bin/true') {
        return true
      }

      return actualFs.existsSync(filePath)
    }),
  }
})

jest.mock('libxmljs2', () => ({
  __esModule: true,
  default: { parseXml },
}))

jest.mock('saxon-js', () => ({
  __esModule: true,
  default: { transform: saxonTransform },
}))

jest.mock('puppeteer', () => ({
  __esModule: true,
  default: { launch: puppeteerLaunch, executablePath: jest.fn(() => '/browser') },
}))

describe('v2 invoices.validation', () => {
  beforeEach(() => {
    jest.clearAllMocks()
    process.env.PUPPETEER_EXECUTABLE_PATH = '/bin/true'
    setContentMock = jest.fn().mockResolvedValue(undefined)
    parseXml.mockImplementation((xml: string) => {
      if (xml.includes('broken')) {
        throw new Error('invalid xml')
      }

      return {
        root: () => ({
          name: () => 'Order',
        }),
        validate: jest.fn(() => true),
        validationErrors: [],
        get: jest.fn(),
      }
    })
    saxonTransform.mockReturnValue({
      principalResult: '<html><head><link href="https://cdn.jsdelivr.net/npm/tailwindcss@latest/dist/tailwind.min.css" rel="stylesheet"/></head><body /></html>',
    })
    puppeteerLaunch.mockResolvedValue({
      newPage: jest.fn().mockResolvedValue({
        setContent: setContentMock,
        pdf: jest.fn().mockResolvedValue(Buffer.from('pdf-bytes')),
      }),
      close: jest.fn().mockResolvedValue(undefined),
    })
  })

  it('validates invoice creation requests', async () => {
    const { validateCreateInvoiceRequest } = await import('../../../../src/api/v2/invoices/invoices.validation')

    expect(() => validateCreateInvoiceRequest(null)).toThrow('Request body must be a JSON object')
    expect(() => validateCreateInvoiceRequest({})).toThrow("Request body is missing required field 'orderXml'")
    expect(() => validateCreateInvoiceRequest({ orderXml: 123 })).toThrow("'orderXml' must be a string")
    expect(() => validateCreateInvoiceRequest({ orderXml: '   ' })).toThrow("'orderXml' cannot be empty")
    expect(() => validateCreateInvoiceRequest({ orderXml: '<Order />' })).toThrow("Request body is missing required field 'invoiceSupplement'")
    expect(() => validateCreateInvoiceRequest({ orderXml: '<Order />', invoiceSupplement: null })).toThrow("'invoiceSupplement' must be an object")

    expect(() => validateCreateInvoiceRequest({
      orderXml: '<Order />',
      invoiceSupplement: {
        currencyCode: 'AUD',
        taxRate: 10,
        taxScheme: { id: 'GST', taxTypeCode: 'VAT' },
        paymentMeans: { code: '30', payeeFinancialAccount: { id: '1', name: 'Test', branchId: 'BR-1' } },
        customizationId: 'urn:test:customization',
        profileId: 'urn:test:profile',
        supplierPartyTaxScheme: { taxSchemeId: 'GST', companyId: '123' },
        customerPartyTaxScheme: { taxSchemeId: 'GST', companyId: '456' },
      },
    })).not.toThrow()

    expect(() => validateCreateInvoiceRequest({
      orderXml: '<Order />',
      invoiceSupplement: {
        currencyCode: 'AUD',
        taxRate: 10,
        taxScheme: { id: 'GST', taxTypeCode: 'VAT' },
        paymentMeans: { code: '30', payeeFinancialAccount: { id: '1', name: 'Test' } },
      },
    })).not.toThrow()
  })

  it('validates UBL xml and reports syntax and schema failures', async () => {
    const { validateUBL } = await import('../../../../src/api/v2/invoices/invoices.validation')

    expect(() => validateUBL('not xml', 'Order')).toThrow('Malformed request, body must be a valid XML string.')

    parseXml.mockImplementationOnce(() => {
      throw new Error('bad xml')
    })
    expect(() => validateUBL('<broken />', 'Order')).toThrow('XML Syntax Error: bad xml')

    parseXml.mockImplementationOnce(() => ({ root: () => ({ name: () => 'Order' }), validate: jest.fn(() => false), validationErrors: [{ message: 'Bad {type} value' }], get: jest.fn() }))
    parseXml.mockImplementationOnce(() => ({
      root: () => ({ name: () => 'Order' }),
      validate: jest.fn(() => false),
      validationErrors: [{ message: 'Bad {type} value' }],
      get: jest.fn(),
    }))
    expect(() => validateUBL('<Order />', 'Order')).toThrow('UBL XSD Validation Failed')
  })

  it('generates invoice pdfs through saxon and puppeteer', async () => {
    const { generateInvoicePdf } = await import('../../../../src/api/v2/invoices/invoices.validation')

    const buffer = await generateInvoicePdf('<Invoice />')

    expect(saxonTransform).toHaveBeenCalledWith(
      expect.objectContaining({
        sourceText: '<Invoice />',
        destination: 'serialized',
      }),
      'sync',
    )
    expect(puppeteerLaunch).toHaveBeenCalledWith(
      expect.objectContaining({
        headless: true,
        executablePath: '/bin/true',
      }),
    )
    expect(setContentMock).toHaveBeenCalledWith(
      expect.stringContaining('<style>'),
      { waitUntil: 'domcontentloaded' },
    )
    expect(setContentMock.mock.calls[0][0]).not.toContain('cdn.jsdelivr.net/npm/tailwindcss@latest/dist/tailwind.min.css')
    expect(Buffer.isBuffer(buffer)).toBe(true)
    expect(buffer.toString()).toBe('pdf-bytes')
  })
})
