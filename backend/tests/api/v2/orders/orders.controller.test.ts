import * as ordersController from '../../../../src/api/v2/orders/orders.controller'
import * as invoicesValidation from '../../../../src/api/v2/invoices/invoices.validation'

jest.mock('../../../../src/api/v2/invoices/invoices.validation', () => ({
  validateUBL: jest.fn(),
}))

describe('orders.controller', () => {
  const mockedInvoicesValidation = invoicesValidation as jest.Mocked<typeof invoicesValidation>

  function createResponse() {
    const response: any = {}
    response.status = jest.fn().mockReturnValue(response)
    response.json = jest.fn().mockReturnValue(response)
    response.contentType = jest.fn().mockReturnValue(response)
    return response
  }

  beforeEach(() => {
    jest.clearAllMocks()
  })

  it('validates order XML', async () => {
    const response = createResponse()

    await ordersController.validateOrder({ body: { orderXml: '<Order />' } } as any, response)

    expect(mockedInvoicesValidation.validateUBL).toHaveBeenCalledWith('<Order />', 'Order')
    expect(response.status).toHaveBeenCalledWith(200)
    expect(response.json).toHaveBeenCalledWith({ message: 'UBL Order is valid!' })
  })

  it('rejects missing order XML', async () => {
    await expect(ordersController.validateOrder({ body: {} } as any, createResponse())).rejects.toMatchObject({
      statusCode: 400,
      message: "Request body must include 'orderXml' as a non-empty string",
    })
  })
})
