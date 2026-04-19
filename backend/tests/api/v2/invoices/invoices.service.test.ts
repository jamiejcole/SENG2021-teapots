import { sha256 } from '../../../../src/models/hash'
import * as invoiceService from '../../../../src/api/v2/invoices/invoices.service'
import { InvoiceBuilder } from '../../../../src/domain/InvoiceBuilder'
import { InvoiceModel } from '../../../../src/models/invoice.model'
import { InvoicePdfModel } from '../../../../src/models/invoicePdf.model'

jest.mock('../../../../src/api/v2/invoices/invoices.validation', () => ({
  validateUBL: jest.fn(),
  generateInvoicePdf: jest.fn(),
}))

jest.mock('../../../../src/domain/InvoiceBuilder', () => ({
  InvoiceBuilder: jest.fn().mockImplementation(() => ({
    addHeader: jest.fn().mockReturnThis(),
    addOrderReference: jest.fn().mockReturnThis(),
    addParties: jest.fn().mockReturnThis(),
    addPaymentMeans: jest.fn().mockReturnThis(),
    addPaymentTerms: jest.fn().mockReturnThis(),
    addTaxTotal: jest.fn().mockReturnThis(),
    addLegalMonetaryTotal: jest.fn().mockReturnThis(),
    addInvoiceLines: jest.fn().mockReturnThis(),
    build: jest.fn(() => '<Invoice />'),
  })),
}))

jest.mock('../../../../src/models/invoice.model', () => ({
  InvoiceModel: {
    findByIdAndDelete: jest.fn(),
  },
}))

jest.mock('../../../../src/models/invoicePdf.model', () => ({
  InvoicePdfModel: {
    findOneAndUpdate: jest.fn(),
    findOne: jest.fn(),
  },
}))

describe('invoices.service', () => {
  const mockedInvoiceBuilder = InvoiceBuilder as jest.MockedFunction<any>
  const mockedInvoiceModel = InvoiceModel as unknown as { findByIdAndDelete: jest.Mock }
  const mockedInvoicePdfModel = InvoicePdfModel as unknown as { findOneAndUpdate: jest.Mock; findOne: jest.Mock }

  beforeEach(() => {
    jest.clearAllMocks()
  })

  it('creates a UBL object from XML', async () => {
    const result = await invoiceService.createFullUblObject(
      `<?xml version="1.0" encoding="UTF-8"?><Order xmlns="urn:oasis:names:specification:ubl:schema:xsd:Order-2"><cbc:ID xmlns:cbc="urn:oasis:names:specification:ubl:schema:xsd:CommonBasicComponents-2">ORD-1</cbc:ID></Order>`,
    )

    expect(result.rootName).toBe('Order')
    expect(result.data).toBeDefined()
  })

  it('converts json to a UBL invoice string', () => {
    const xml = invoiceService.convertJsonToUblInvoice({} as any, {} as any)

    expect(xml).toBe('<Invoice />')
    expect(mockedInvoiceBuilder).toHaveBeenCalled()
  })

  it('builds invoice xml from order xml', async () => {
    const mockedValidation = await import('../../../../src/api/v2/invoices/invoices.validation')
    const validateUBL = mockedValidation.validateUBL as jest.Mock
    validateUBL.mockReturnValue(true)

    const result = await invoiceService.buildInvoiceXmlFromOrderXml(
      `<?xml version="1.0" encoding="UTF-8"?><Order xmlns="urn:oasis:names:specification:ubl:schema:xsd:Order-2"><cbc:ID xmlns:cbc="urn:oasis:names:specification:ubl:schema:xsd:CommonBasicComponents-2">ORD-1</cbc:ID></Order>`,
      {
        currencyCode: 'AUD',
        taxRate: 0.1,
        taxScheme: { id: 'GST', taxTypeCode: 'GST' },
        paymentMeans: { code: '30', payeeFinancialAccount: { id: '1', name: 'Main' } },
      } as any,
    )

    expect(result.orderObj).toBeDefined()
    expect(result.invoiceXml).toBe('<Invoice />')
    expect(validateUBL).toHaveBeenCalledWith(expect.stringContaining('<Order'), 'Order')
    expect(validateUBL).toHaveBeenCalledWith('<Invoice />', 'Invoice')
  })

  it('rejects invalid invoice IDs when deleting', async () => {
    await expect(invoiceService.deleteInvoiceById('not-an-id')).resolves.toBeNull()
    expect(mockedInvoiceModel.findByIdAndDelete).not.toHaveBeenCalled()
  })

  it('deletes an invoice when the id is valid', async () => {
    mockedInvoiceModel.findByIdAndDelete.mockResolvedValue({ _id: 'invoice-1' })

    await expect(invoiceService.deleteInvoiceById('507f1f77bcf86cd799439011')).resolves.toEqual({ _id: 'invoice-1' })
    expect(mockedInvoiceModel.findByIdAndDelete).toHaveBeenCalledWith('507f1f77bcf86cd799439011')
  })

  it('stores invoice pdfs by normalized hash', async () => {
    mockedInvoicePdfModel.findOneAndUpdate.mockReturnValue({ exec: jest.fn().mockResolvedValue({}) })

    const result = await invoiceService.storeInvoicePdf('  <Invoice>\r\n</Invoice>  ', Buffer.from('pdf'))

    expect(result).toBe(sha256('<Invoice>\n</Invoice>'))
    expect(mockedInvoicePdfModel.findOneAndUpdate).toHaveBeenCalledWith(
      { invoiceHash: sha256('<Invoice>\n</Invoice>') },
      expect.objectContaining({
        $set: expect.objectContaining({
          contentType: 'application/pdf',
        }),
      }),
      expect.objectContaining({ upsert: true, new: true }),
    )
  })

  it('finds invoice pdfs only for valid hashes', async () => {
    await expect(invoiceService.findInvoicePdfByHash('bad')).resolves.toBeNull()

    mockedInvoicePdfModel.findOne.mockReturnValue({ exec: jest.fn().mockResolvedValue({ invoiceHash: 'a'.repeat(64) }) })
    await expect(invoiceService.findInvoicePdfByHash('A'.repeat(64))).resolves.toEqual({ invoiceHash: 'a'.repeat(64) })
    expect(mockedInvoicePdfModel.findOne).toHaveBeenCalledWith({ invoiceHash: 'a'.repeat(64) })
  })
})
