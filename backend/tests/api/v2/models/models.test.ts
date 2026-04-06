import UserModel from '../../../../src/models/user.model'
import { InvoiceModel } from '../../../../src/models/invoice.model'
import { OrderModel } from '../../../../src/models/order.model'

describe('models', () => {
  it('loads the user model schema', () => {
    expect(UserModel.modelName).toBe('User')
    expect(UserModel.schema.path('email')).toBeDefined()
    expect(UserModel.schema.path('twoFactor')).toBeDefined()
  })

  it('loads the invoice model schema', () => {
    expect(InvoiceModel.modelName).toBe('Invoice')
    expect(InvoiceModel.schema.path('invoiceXml')).toBeDefined()
  })

  it('loads the order model schema', () => {
    expect(OrderModel.modelName).toBe('Order')
    expect(OrderModel.schema.path('orderXml')).toBeDefined()
  })
})
