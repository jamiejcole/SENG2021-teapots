const parseXml = jest.fn()
const saxonTransform = jest.fn()
const puppeteerLaunch = jest.fn()

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
  default: { launch: puppeteerLaunch },
}))

describe('v1 invoices.validation extra coverage', () => {
  beforeEach(() => {
    jest.clearAllMocks()
    process.env.PUPPETEER_EXECUTABLE_PATH = '/bin/true'
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
      }
    })
    saxonTransform.mockReturnValue({ principalResult: '<html />' })
    puppeteerLaunch.mockResolvedValue({
      newPage: jest.fn().mockResolvedValue({
        setContent: jest.fn().mockResolvedValue(undefined),
        pdf: jest.fn().mockResolvedValue(Buffer.from('pdf-bytes')),
      }),
      close: jest.fn().mockResolvedValue(undefined),
    })
  })

  it('reports schema validation failures', async () => {
    const { validateUBL } = await import('../../../../src/api/v1/invoices/invoices.validation')

    parseXml.mockImplementationOnce(() => ({
      root: () => ({ name: () => 'Order' }),
      validate: jest.fn(() => false),
      validationErrors: [{ message: 'Bad {type} value' }],
    }))

    expect(() => validateUBL('<Order />', 'Order')).toThrow('UBL XSD Validation Failed')
  })

  it('generates pdf buffers', async () => {
    const { generateInvoicePdf } = await import('../../../../src/api/v1/invoices/invoices.validation')

    const buffer = await generateInvoicePdf('<Invoice />')

    expect(saxonTransform).toHaveBeenCalledWith(
      expect.objectContaining({ sourceText: '<Invoice />', destination: 'serialized' }),
      'sync',
    )
    expect(puppeteerLaunch).toHaveBeenCalledWith(expect.objectContaining({ headless: true }))
    expect(buffer.toString()).toBe('pdf-bytes')
  })
})
