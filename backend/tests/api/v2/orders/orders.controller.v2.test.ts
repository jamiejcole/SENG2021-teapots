import * as ordersController from '../../../../src/api/v2/orders/orders.controller'
import * as ordersService from '../../../../src/api/v2/orders/orders.service'
import * as invoicesValidation from '../../../../src/api/v2/invoices/invoices.validation'

jest.mock('../../../../src/api/v2/orders/orders.service', () => ({
    createOrder: jest.fn(),
    listOrdersForUser: jest.fn(),
    getOrderById: jest.fn(),
    updateOrder: jest.fn(),
    deleteOrder: jest.fn(),
}))

jest.mock('../../../../src/api/v2/invoices/invoices.validation', () => ({
    validateUBL: jest.fn(),
}))

describe('orders.controller v2', () => {
    const mockedService = ordersService as jest.Mocked<typeof ordersService>
    const mockedValidation = invoicesValidation as jest.Mocked<typeof invoicesValidation>

    function createResponse() {
        const response: any = {}
        response.status = jest.fn().mockReturnValue(response)
        response.json = jest.fn().mockReturnValue(response)
        response.send = jest.fn().mockReturnValue(response)
        response.set = jest.fn().mockReturnValue(response)
        response.contentType = jest.fn().mockReturnValue(response)
        return response
    }

    function authedReq(overrides: any = {}) {
        return { user: { userId: 'user-1' }, body: {}, params: {}, query: {}, ...overrides }
    }

    beforeEach(() => {
        jest.clearAllMocks()
    })

    // --- validateOrder ---
    it('validates order XML', async () => {
        const response = createResponse()
        await ordersController.validateOrder(authedReq({ body: { orderXml: '<Order />' } }) as any, response)
        expect(mockedValidation.validateUBL).toHaveBeenCalledWith('<Order />', 'Order')
        expect(response.status).toHaveBeenCalledWith(200)
        expect(response.json).toHaveBeenCalledWith({ message: 'UBL Order is valid!' })
    })

    it('rejects missing orderXml', async () => {
        await expect(
            ordersController.validateOrder(authedReq({ body: {} }) as any, createResponse())
        ).rejects.toMatchObject({ statusCode: 400 })
    })

    // --- createOrder ---
    it('creates an order and returns 201', async () => {
        mockedService.createOrder.mockResolvedValue({ _id: 'mongo-id-1' } as any)
        const response = createResponse()
        await ordersController.createOrder(
            authedReq({ body: { data: { ID: 'ORD-001' } } }) as any,
            response
        )
        expect(mockedService.createOrder).toHaveBeenCalledWith({ ID: 'ORD-001' }, 'user-1')
        expect(response.status).toHaveBeenCalledWith(201)
        expect(response.json).toHaveBeenCalledWith(
            expect.objectContaining({ orderId: 'mongo-id-1', status: 'success' })
        )
    })

    it('rejects createOrder with missing data', async () => {
        await expect(
            ordersController.createOrder(authedReq({ body: {} }) as any, createResponse())
        ).rejects.toMatchObject({ statusCode: 400 })

        await expect(
            ordersController.createOrder(authedReq({ body: { data: 'not-an-object' } }) as any, createResponse())
        ).rejects.toMatchObject({ statusCode: 400 })

        await expect(
            ordersController.createOrder(authedReq({ body: { data: [] } }) as any, createResponse())
        ).rejects.toMatchObject({ statusCode: 400 })
    })

    it('rejects createOrder when unauthenticated', async () => {
        await expect(
            ordersController.createOrder({ body: { data: {} }, user: undefined } as any, createResponse())
        ).rejects.toMatchObject({ statusCode: 401 })
    })

    // --- listOrders ---
    it('lists orders for the current user', async () => {
        mockedService.listOrdersForUser.mockResolvedValue([{ _id: 'a' }, { _id: 'b' }] as any)
        const response = createResponse()
        await ordersController.listOrders(authedReq() as any, response)
        expect(mockedService.listOrdersForUser).toHaveBeenCalledWith('user-1')
        expect(response.status).toHaveBeenCalledWith(200)
        expect(response.json).toHaveBeenCalledWith([{ _id: 'a' }, { _id: 'b' }])
    })

    // --- getOrder ---
    it('gets an order by ID', async () => {
        mockedService.getOrderById.mockResolvedValue({ _id: 'mongo-id-1', orderId: 'ORD-001' } as any)
        const response = createResponse()
        await ordersController.getOrder(authedReq({ params: { orderId: 'mongo-id-1' } }) as any, response)
        expect(mockedService.getOrderById).toHaveBeenCalledWith('mongo-id-1', 'user-1')
        expect(response.status).toHaveBeenCalledWith(200)
    })

    it('returns 404 if order not found', async () => {
        mockedService.getOrderById.mockResolvedValue(null)
        await expect(
            ordersController.getOrder(authedReq({ params: { orderId: 'not-found' } }) as any, createResponse())
        ).rejects.toMatchObject({ statusCode: 404 })
    })

    it('returns 400 if orderId is missing for getOrder', async () => {
        await expect(
            ordersController.getOrder(authedReq({ params: {} }) as any, createResponse())
        ).rejects.toMatchObject({ statusCode: 400 })
    })

    // --- updateOrder ---
    it('updates an order and returns 200', async () => {
        mockedService.updateOrder.mockResolvedValue({ _id: 'mongo-id-1' } as any)
        const response = createResponse()
        await ordersController.updateOrder(
            authedReq({ params: { orderId: 'mongo-id-1' }, body: { data: { ID: 'ORD-002' } } }) as any,
            response
        )
        expect(mockedService.updateOrder).toHaveBeenCalledWith('mongo-id-1', 'user-1', { ID: 'ORD-002' })
        expect(response.status).toHaveBeenCalledWith(200)
        expect(response.json).toHaveBeenCalledWith(
            expect.objectContaining({ orderId: 'mongo-id-1', status: 'success' })
        )
    })

    it('returns 404 if order not found for update', async () => {
        mockedService.updateOrder.mockResolvedValue(null)
        await expect(
            ordersController.updateOrder(
                authedReq({ params: { orderId: 'not-found' }, body: { data: { ID: 'X' } } }) as any,
                createResponse()
            )
        ).rejects.toMatchObject({ statusCode: 404 })
    })

    it('returns 400 if data is invalid for updateOrder', async () => {
        await expect(
            ordersController.updateOrder(authedReq({ params: { orderId: 'x' }, body: {} }) as any, createResponse())
        ).rejects.toMatchObject({ statusCode: 400 })

        await expect(
            ordersController.updateOrder(authedReq({ params: {} }) as any, createResponse())
        ).rejects.toMatchObject({ statusCode: 400 })
    })

    // --- deleteOrder ---
    it('deletes an order and returns 200', async () => {
        mockedService.deleteOrder.mockResolvedValue({ _id: 'mongo-id-1' } as any)
        const response = createResponse()
        await ordersController.deleteOrder(authedReq({ params: { orderId: 'mongo-id-1' } }) as any, response)
        expect(mockedService.deleteOrder).toHaveBeenCalledWith('mongo-id-1', 'user-1')
        expect(response.status).toHaveBeenCalledWith(200)
        expect(response.json).toHaveBeenCalledWith({ status: 'deleted', message: 'Order deleted successfully.' })
    })

    it('returns 404 if order not found for delete', async () => {
        mockedService.deleteOrder.mockResolvedValue(null)
        await expect(
            ordersController.deleteOrder(authedReq({ params: { orderId: 'not-found' } }) as any, createResponse())
        ).rejects.toMatchObject({ statusCode: 404 })
    })

    it('returns 400 if orderId is missing for deleteOrder', async () => {
        await expect(
            ordersController.deleteOrder(authedReq({ params: {} }) as any, createResponse())
        ).rejects.toMatchObject({ statusCode: 400 })
    })

    // --- getOrderXml ---
    it('returns order XML', async () => {
        mockedService.getOrderById.mockResolvedValue({ orderXml: '<Order/>' } as any)
        const response = createResponse()
        await ordersController.getOrderXml(authedReq({ params: { orderId: 'mongo-id-1' } }) as any, response)
        expect(response.set).toHaveBeenCalledWith('Content-Type', 'application/xml')
        expect(response.status).toHaveBeenCalledWith(200)
        expect(response.send).toHaveBeenCalledWith('<Order/>')
    })

    it('returns 404 if order not found for getOrderXml', async () => {
        mockedService.getOrderById.mockResolvedValue(null)
        await expect(
            ordersController.getOrderXml(authedReq({ params: { orderId: 'not-found' } }) as any, createResponse())
        ).rejects.toMatchObject({ statusCode: 404 })
    })

    it('returns 400 if orderId is missing for getOrderXml', async () => {
        await expect(
            ordersController.getOrderXml(authedReq({ params: {} }) as any, createResponse())
        ).rejects.toMatchObject({ statusCode: 400 })
    })
})
