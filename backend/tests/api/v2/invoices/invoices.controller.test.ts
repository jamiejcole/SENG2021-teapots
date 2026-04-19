import * as invoicesController from '../../../../src/api/v2/invoices/invoices.controller'
import * as invoicesService from '../../../../src/api/v2/invoices/invoices.service'
import * as invoicesValidation from '../../../../src/api/v2/invoices/invoices.validation'
import * as persistInvoiceRequestModule from '../../../../src/db/persistInvoiceRequest'
import * as mailgun from '../../../../src/utils/mailgun.service'

jest.mock('../../../../src/api/v2/invoices/invoices.service', () => ({
  createFullUblObject: jest.fn(),
  convertJsonToUblInvoice: jest.fn(),
  buildInvoiceXmlFromOrderXml: jest.fn(),
  storeInvoicePdf: jest.fn(),
  findInvoicePdfByHash: jest.fn(),
  deleteInvoiceById: jest.fn(),
  deleteInvoiceByIdForUser: jest.fn(),
}))

jest.mock('../../../../src/api/v2/invoices/invoices.validation', () => ({
  validateUBL: jest.fn(),
  validateCreateInvoiceRequest: jest.fn(),
  generateInvoicePdf: jest.fn(),
}))

jest.mock('../../../../src/db/persistInvoiceRequest', () => ({
  persistInvoiceRequest: jest.fn(),
}))

jest.mock('../../../../src/utils/mailgun.service', () => ({
  sendInvoiceReadyEmail: jest.fn(),
}))

describe('invoices.controller', () => {
  const mockedInvoicesService = invoicesService as jest.Mocked<typeof invoicesService>
  const mockedInvoicesValidation = invoicesValidation as jest.Mocked<typeof invoicesValidation>
  const mockedPersistInvoiceRequest = persistInvoiceRequestModule as jest.Mocked<typeof persistInvoiceRequestModule>
  const mockedMailgun = mailgun as jest.Mocked<typeof mailgun>

  const invoiceXml = `<?xml version="1.0" encoding="UTF-8"?>
  <Invoice xmlns="urn:oasis:names:specification:ubl:schema:xsd:Invoice-2"
           xmlns:cbc="urn:oasis:names:specification:ubl:schema:xsd:CommonBasicComponents-2"
           xmlns:cac="urn:oasis:names:specification:ubl:schema:xsd:CommonAggregateComponents-2">
    <cbc:ID>INV-123</cbc:ID>
    <cbc:DueDate>2026-01-01</cbc:DueDate>
    <cbc:DocumentCurrencyCode>AUD</cbc:DocumentCurrencyCode>
    <cac:LegalMonetaryTotal>
      <cbc:PayableAmount>236.50</cbc:PayableAmount>
    </cac:LegalMonetaryTotal>
  </Invoice>`

  function createResponse() {
    const response: any = {}
    response.status = jest.fn().mockReturnValue(response)
    response.json = jest.fn().mockReturnValue(response)
    response.send = jest.fn().mockReturnValue(response)
    response.set = jest.fn().mockReturnValue(response)
    response.contentType = jest.fn().mockReturnValue(response)
    return response
  }

  beforeEach(() => {
    jest.clearAllMocks()
    process.env.PUBLIC_APP_URL = 'https://example.com/'
  })

  it('creates invoices after validation and persistence', async () => {
    mockedInvoicesService.buildInvoiceXmlFromOrderXml.mockResolvedValue({ orderObj: { order: true }, invoiceXml: '<Invoice />' } as any)
    const response = createResponse()
    const next = jest.fn()

    invoicesController.createInvoice(
      {
        body: {
          orderXml: '<Order />',
          invoiceSupplement: { invoiceNumber: 'INV-1' },
        },
      } as any,
      response,
      next,
    )
    await new Promise(process.nextTick)

    expect(mockedInvoicesValidation.validateCreateInvoiceRequest).toHaveBeenCalled()
    expect(mockedInvoicesService.buildInvoiceXmlFromOrderXml).toHaveBeenCalledWith('<Order />', {
      invoiceNumber: 'INV-1',
    })
    expect(mockedPersistInvoiceRequest.persistInvoiceRequest).toHaveBeenCalledWith(
      expect.objectContaining({
        orderXml: '<Order />',
        invoiceXml: '<Invoice />',
      }),
    )
    expect(response.status).toHaveBeenCalledWith(201)
    expect(response.send).toHaveBeenCalledWith('<Invoice />')
  })

  it('builds preview invoices without persistence', async () => {
    mockedInvoicesService.buildInvoiceXmlFromOrderXml.mockResolvedValue({ orderObj: { order: true }, invoiceXml: '<Invoice />' } as any)
    const response = createResponse()
    const next = jest.fn()

    await invoicesController.previewInvoice(
      {
        body: {
          orderXml: '<Order />',
          invoiceSupplement: {
            currencyCode: 'AUD',
            taxRate: 0.1,
            taxScheme: { id: 'GST', taxTypeCode: 'GST' },
            paymentMeans: { code: '30', payeeFinancialAccount: { id: '1', name: 'Main' } },
          },
        },
      } as any,
      response,
      next,
    )

    expect(mockedInvoicesService.buildInvoiceXmlFromOrderXml).toHaveBeenCalledWith(
      '<Order />',
      expect.objectContaining({ currencyCode: 'AUD' }),
    )
    expect(response.status).toHaveBeenCalledWith(200)
    expect(response.json).toHaveBeenCalledWith({ invoiceXml: '<Invoice />', previewOnly: true })
    expect(mockedPersistInvoiceRequest.persistInvoiceRequest).not.toHaveBeenCalled()
  })

  it('validates invoices', async () => {
    const response = createResponse()

    await invoicesController.validateInvoice({ body: { invoiceXml } } as any, response)

    expect(mockedInvoicesValidation.validateUBL).toHaveBeenCalledWith(invoiceXml, 'Invoice')
    expect(response.status).toHaveBeenCalledWith(200)
    expect(response.json).toHaveBeenCalledWith({ message: 'UBL Invoice is valid!' })
  })

  it('rejects invalid invoice validation payloads', async () => {
    await expect(invoicesController.validateInvoice({ body: {} } as any, createResponse())).rejects.toMatchObject({
      statusCode: 400,
      message: "Request body must include 'invoiceXml' as a non-empty string",
    })
  })

  it('creates pdf responses and public urls', async () => {
    mockedInvoicesValidation.generateInvoicePdf.mockResolvedValue(Buffer.from('pdf'))
    mockedInvoicesService.storeInvoicePdf.mockResolvedValue('a'.repeat(64))
    const response = createResponse()

    await invoicesController.createPdf({ body: invoiceXml, protocol: 'https', get: jest.fn().mockReturnValue('example.com') } as any, response)

    expect(mockedInvoicesValidation.validateUBL).toHaveBeenCalledWith(invoiceXml, 'Invoice')
    expect(mockedInvoicesValidation.generateInvoicePdf).toHaveBeenCalledWith(invoiceXml)
    expect(response.set).toHaveBeenCalledWith('X-Invoice-Url', 'https://example.com/invoices/' + 'a'.repeat(64) + '.pdf')
    expect(response.status).toHaveBeenCalledWith(201)
    expect(response.send).toHaveBeenCalledWith(Buffer.from('pdf'))
  })

  it('returns public invoice pdfs when found', async () => {
    mockedInvoicesService.findInvoicePdfByHash.mockResolvedValue({
      invoiceHash: 'a'.repeat(64),
      contentType: 'application/pdf',
      pdfData: Buffer.from('pdf'),
    } as any)
    const response = createResponse()
    const next = jest.fn()

    invoicesController.getPublicInvoicePdf({ params: { invoiceHash: 'A'.repeat(64) } } as any, response, next)
    await new Promise(process.nextTick)

    expect(response.set).toHaveBeenCalledWith('Cache-Control', 'public, max-age=86400')
    expect(response.status).toHaveBeenCalledWith(200)
    expect(response.send).toHaveBeenCalledWith(Buffer.from('pdf'))
  })

  it('rejects missing public invoice pdfs', async () => {
    mockedInvoicesService.findInvoicePdfByHash.mockResolvedValue(null)
    const next = jest.fn()

    invoicesController.getPublicInvoicePdf({ params: { invoiceHash: 'b'.repeat(64) } } as any, createResponse(), next)
    await new Promise(process.nextTick)

    expect(next).toHaveBeenCalledWith(
      expect.objectContaining({
        statusCode: 404,
        message: 'Invoice PDF not found',
      }),
    )
  })

  it('emails invoices with attachments', async () => {
    mockedInvoicesValidation.validateUBL.mockReturnValue(true)
    mockedInvoicesValidation.generateInvoicePdf.mockResolvedValue(Buffer.from('pdf'))
    mockedMailgun.sendInvoiceReadyEmail.mockResolvedValue(undefined)
    const response = createResponse()
    const next = jest.fn()

    invoicesController.emailInvoice({ body: { invoiceXml, to: 'customer@example.com' } } as any, response, next)
    await new Promise(process.nextTick)

    expect(mockedMailgun.sendInvoiceReadyEmail).toHaveBeenCalledWith(
      'customer@example.com',
      {
        amount: 'AUD $236.50',
        dueDate: '2026-01-01',
        invoiceNumber: 'INV-123',
      },
      expect.arrayContaining([
        expect.objectContaining({ filename: 'INV-123.pdf', contentType: 'application/pdf' }),
        expect.objectContaining({ filename: 'INV-123.xml', contentType: 'application/xml' }),
      ]),
    )
    expect(response.status).toHaveBeenCalledWith(200)
    expect(response.json).toHaveBeenCalledWith({ message: 'Invoice email sent', to: 'customer@example.com' })
  })

  it('rejects invalid email recipients', async () => {
    const next = jest.fn()

    invoicesController.emailInvoice({ body: { invoiceXml, to: 'not-an-email' } } as any, createResponse(), next)
    await new Promise(process.nextTick)

    expect(next).toHaveBeenCalledWith(
      expect.objectContaining({
        statusCode: 400,
        message: 'Invalid recipient email address',
      }),
    )
  })

  it('deletes invoices and returns 204', async () => {
    mockedInvoicesService.deleteInvoiceByIdForUser.mockResolvedValue({ _id: 'invoice-1' } as any)
    const response = createResponse()

    await invoicesController.deleteInvoice(
      {
        params: { invoiceId: '507f1f77bcf86cd799439011' },
        user: { userId: 'user-1' },
      } as any,
      response,
    )

    expect(response.status).toHaveBeenCalledWith(204)
    expect(response.send).toHaveBeenCalled()
  })

  it('rejects missing invoice ids and missing invoices', async () => {
    await expect(
      invoicesController.deleteInvoice({ params: {}, user: { userId: 'user-1' } } as any, createResponse()),
    ).rejects.toMatchObject({
      statusCode: 400,
      message: 'Invoice ID is required as a non-empty string',
    })

    mockedInvoicesService.deleteInvoiceByIdForUser.mockResolvedValue(null)
    await expect(
      invoicesController.deleteInvoice(
        { params: { invoiceId: '507f1f77bcf86cd799439011' }, user: { userId: 'user-1' } } as any,
        createResponse(),
      ),
    ).rejects.toMatchObject({
      statusCode: 404,
      message: 'Invoice not found',
    })
  })
})
