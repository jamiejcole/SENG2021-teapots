import * as ordersService from '../../../../src/api/v2/orders/orders.service'
import { OrderModel } from '../../../../src/models/order.model'

jest.mock('../../../../src/models/order.model', () => {
    const mockModel = {
        create: jest.fn(),
        find: jest.fn(),
        findOne: jest.fn(),
        findOneAndUpdate: jest.fn(),
        findOneAndDelete: jest.fn(),
    }
    return { OrderModel: mockModel }
})

jest.mock('../../../../src/models/hash', () => ({
    sha256: jest.fn().mockReturnValue('hashvalue'),
}))

describe('orders.service', () => {
    const mockedModel = OrderModel as jest.Mocked<typeof OrderModel>

    beforeEach(() => {
        jest.clearAllMocks()
    })

    describe('jsonToOrderXml', () => {
        it('generates valid XML from JSON data', () => {
            const xml = ordersService.jsonToOrderXml({
                ID: 'ORD-001',
                IssueDate: '2026-01-01',
            })
            expect(xml).toContain('<Order')
            expect(xml).toContain('ORD-001')
        })

        it('handles nested objects and arrays', () => {
            const xml = ordersService.jsonToOrderXml({
                ID: 'ORD-002',
                OrderLine: [
                    { LineItem: { ID: '1', Item: { Name: 'Item A' } } },
                    { LineItem: { ID: '2', Item: { Name: 'Item B' } } },
                ],
            })
            expect(xml).toContain('ORD-002')
        })

        it('handles null/undefined values gracefully', () => {
            const xml = ordersService.jsonToOrderXml({
                ID: null as any,
                IssueDate: undefined as any,
            })
            expect(xml).toContain('<Order')
        })
    })

    describe('createOrder', () => {
        it('creates an order document', async () => {
            const mockDoc = { _id: 'mongo-id-1', orderId: 'ORD-001' }
            ;(mockedModel.create as jest.Mock).mockResolvedValue(mockDoc)

            const result = await ordersService.createOrder(
                { ID: 'ORD-001', IssueDate: '2026-01-01' },
                'user-1'
            )
            expect(mockedModel.create).toHaveBeenCalled()
            expect(result).toEqual(mockDoc)
        })

        it('handles order with buyer and seller name', async () => {
            const mockDoc = { _id: 'mongo-id-2' }
            ;(mockedModel.create as jest.Mock).mockResolvedValue(mockDoc)

            await ordersService.createOrder(
                {
                    ID: 'ORD-002',
                    BuyerCustomerParty: { Party: { PartyName: [{ Name: 'Test Buyer' }] } },
                    SellerSupplierParty: { Party: { PartyName: [{ Name: 'Test Seller' }] } },
                    OrderLine: [{ LineItem: { ID: '1', Item: { Name: 'Widget' }, Quantity: { value: '5', '@unitCode': 'EA' }, Price: { PriceAmount: { value: '10.00' } } } }],
                    DocumentCurrencyCode: 'USD',
                },
                'user-2'
            )
            expect(mockedModel.create).toHaveBeenCalled()
            const callArg = (mockedModel.create as jest.Mock).mock.calls[0][0]
            expect(callArg.buyer.name).toBe('Test Buyer')
            expect(callArg.seller.name).toBe('Test Seller')
            expect(callArg.currency).toBe('USD')
        })

        it('handles buyer/seller name as value object', async () => {
            ;(mockedModel.create as jest.Mock).mockResolvedValue({ _id: 'x' })
            await ordersService.createOrder(
                {
                    ID: { value: 'ORD-003' },
                    BuyerCustomerParty: { Party: { PartyName: { Name: { value: 'Buyer Corp' } } } },
                    SellerSupplierParty: { Party: { PartyName: { Name: { value: 'Seller Corp' } } } },
                    IssueDate: { value: '2026-01-01' },
                    DocumentCurrencyCode: { value: 'EUR' },
                },
                'user-3'
            )
            const callArg = (mockedModel.create as jest.Mock).mock.calls[0][0]
            expect(callArg.buyer.name).toBe('Buyer Corp')
            expect(callArg.seller.name).toBe('Seller Corp')
        })

        it('handles missing ID gracefully', async () => {
            ;(mockedModel.create as jest.Mock).mockResolvedValue({ _id: 'x' })
            await ordersService.createOrder({}, 'user-1')
            const callArg = (mockedModel.create as jest.Mock).mock.calls[0][0]
            expect(callArg.orderId).toMatch(/^ORD-/)
        })
    })

    describe('listOrdersForUser', () => {
        it('calls find with userId filter', async () => {
            const mockSort = { lean: () => ({ exec: jest.fn().mockResolvedValue([]) }) }
            ;(mockedModel.find as jest.Mock).mockReturnValue({ sort: () => mockSort })
            const result = await ordersService.listOrdersForUser('user-1')
            expect(mockedModel.find).toHaveBeenCalledWith({ userId: 'user-1' })
            expect(result).toEqual([])
        })
    })

    describe('getOrderById', () => {
        it('returns null for invalid ObjectId', async () => {
            const result = await ordersService.getOrderById('not-an-id', 'user-1')
            expect(result).toBeNull()
        })

        it('calls findOne with valid ObjectId', async () => {
            const mockLean = { exec: jest.fn().mockResolvedValue({ _id: '507f1f77bcf86cd799439011' }) }
            ;(mockedModel.findOne as jest.Mock).mockReturnValue({ lean: () => mockLean })

            const result = await ordersService.getOrderById('507f1f77bcf86cd799439011', 'user-1')
            expect(mockedModel.findOne).toHaveBeenCalledWith({ _id: '507f1f77bcf86cd799439011', userId: 'user-1' })
            expect(result).toEqual({ _id: '507f1f77bcf86cd799439011' })
        })
    })

    describe('updateOrder', () => {
        it('returns null for invalid ObjectId', async () => {
            const result = await ordersService.updateOrder('not-an-id', 'user-1', {})
            expect(result).toBeNull()
        })

        it('calls findOneAndUpdate for valid ObjectId', async () => {
            const mockLean = { exec: jest.fn().mockResolvedValue({ _id: '507f1f77bcf86cd799439011' }) }
            ;(mockedModel.findOneAndUpdate as jest.Mock).mockReturnValue({ lean: () => mockLean })

            await ordersService.updateOrder('507f1f77bcf86cd799439011', 'user-1', { ID: 'ORD-NEW' })
            expect(mockedModel.findOneAndUpdate).toHaveBeenCalledWith(
                { _id: '507f1f77bcf86cd799439011', userId: 'user-1' },
                expect.objectContaining({ $set: expect.any(Object) }),
                { new: true }
            )
        })
    })

    describe('deleteOrder', () => {
        it('returns null for invalid ObjectId', async () => {
            const result = await ordersService.deleteOrder('not-an-id', 'user-1')
            expect(result).toBeNull()
        })

        it('calls findOneAndDelete for valid ObjectId', async () => {
            const mockLean = { exec: jest.fn().mockResolvedValue({ _id: '507f1f77bcf86cd799439011' }) }
            ;(mockedModel.findOneAndDelete as jest.Mock).mockReturnValue({ lean: () => mockLean })

            await ordersService.deleteOrder('507f1f77bcf86cd799439011', 'user-1')
            expect(mockedModel.findOneAndDelete).toHaveBeenCalledWith({ _id: '507f1f77bcf86cd799439011', userId: 'user-1' })
        })
    })
})
