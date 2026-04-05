import * as despatchController from '../../../../src/api/v2/despatch/despatch.controller'
import * as despatchService from '../../../../src/api/v2/despatch/despatch.service'

jest.mock('../../../../src/api/v2/despatch/despatch.service', () => ({
    createDespatchAdvice: jest.fn(),
    getDespatchAdviceByAdviceId: jest.fn(),
    getDespatchAdviceByOrderXml: jest.fn(),
    listDespatchAdvices: jest.fn(),
    createOrderCancellation: jest.fn(),
    getOrderCancellation: jest.fn(),
    createFulfilmentCancellation: jest.fn(),
    getFulfilmentCancellation: jest.fn(),
}))

describe('despatch.controller', () => {
    const mockedService = despatchService as jest.Mocked<typeof despatchService>

    function createResponse() {
        const response: any = {}
        response.status = jest.fn().mockReturnValue(response)
        response.json = jest.fn().mockReturnValue(response)
        return response
    }

    function authedReq(overrides: any = {}) {
        return { user: { userId: 'user-1' }, body: '', params: {}, query: {}, ...overrides }
    }

    beforeEach(() => {
        jest.clearAllMocks()
    })

    // --- createDespatch ---
    it('creates despatch advice from order XML', async () => {
        mockedService.createDespatchAdvice.mockResolvedValue({ adviceId: 'uuid-1', executedAt: 1234567890 })
        const response = createResponse()

        await despatchController.createDespatch(
            authedReq({ body: '<Order/>' }) as any,
            response
        )

        expect(mockedService.createDespatchAdvice).toHaveBeenCalledWith('<Order/>', 'user-1')
        expect(response.status).toHaveBeenCalledWith(200)
        expect(response.json).toHaveBeenCalledWith({
            success: true,
            adviceIds: ['uuid-1'],
            'executed-at': 1234567890,
        })
    })

    it('rejects createDespatch with empty body', async () => {
        await expect(
            despatchController.createDespatch(authedReq({ body: '' }) as any, createResponse())
        ).rejects.toMatchObject({ statusCode: 400 })

        await expect(
            despatchController.createDespatch(authedReq({ body: null }) as any, createResponse())
        ).rejects.toMatchObject({ statusCode: 400 })
    })

    it('rejects createDespatch when unauthenticated', async () => {
        await expect(
            despatchController.createDespatch({ body: '<Order/>', user: undefined } as any, createResponse())
        ).rejects.toMatchObject({ statusCode: 401 })
    })

    // --- retrieveDespatch ---
    it('retrieves despatch by advice-id', async () => {
        mockedService.getDespatchAdviceByAdviceId.mockResolvedValue({
            despatchAdviceXml: '<DespatchAdvice/>',
            adviceId: 'uuid-1',
            executedAt: 1234567890,
        } as any)

        const response = createResponse()
        await despatchController.retrieveDespatch(
            authedReq({ query: { 'search-type': 'advice-id', query: 'uuid-1' } }) as any,
            response
        )
        expect(mockedService.getDespatchAdviceByAdviceId).toHaveBeenCalledWith('uuid-1', 'user-1')
        expect(response.status).toHaveBeenCalledWith(200)
        expect(response.json).toHaveBeenCalledWith(
            expect.objectContaining({ 'advice-id': 'uuid-1' })
        )
    })

    it('retrieves despatch by order XML', async () => {
        mockedService.getDespatchAdviceByOrderXml.mockResolvedValue({
            despatchAdviceXml: '<DespatchAdvice/>',
            adviceId: 'uuid-2',
            executedAt: 123,
        } as any)

        const response = createResponse()
        await despatchController.retrieveDespatch(
            authedReq({ query: { 'search-type': 'order', query: '<Order/>' } }) as any,
            response
        )
        expect(mockedService.getDespatchAdviceByOrderXml).toHaveBeenCalledWith('<Order/>', 'user-1')
        expect(response.status).toHaveBeenCalledWith(200)
    })

    it('returns 404 if despatch advice not found', async () => {
        mockedService.getDespatchAdviceByAdviceId.mockResolvedValue(null)
        await expect(
            despatchController.retrieveDespatch(
                authedReq({ query: { 'search-type': 'advice-id', query: 'unknown' } }) as any,
                createResponse()
            )
        ).rejects.toMatchObject({ statusCode: 404 })
    })

    it('returns 400 for missing retrieve query params', async () => {
        await expect(
            despatchController.retrieveDespatch(authedReq({ query: {} }) as any, createResponse())
        ).rejects.toMatchObject({ statusCode: 400 })
    })

    it('returns 400 for invalid search-type', async () => {
        await expect(
            despatchController.retrieveDespatch(
                authedReq({ query: { 'search-type': 'invalid', query: 'x' } }) as any,
                createResponse()
            )
        ).rejects.toMatchObject({ statusCode: 400 })
    })

    // --- listDespatch ---
    it('lists despatch advice records', async () => {
        mockedService.listDespatchAdvices.mockResolvedValue([
            { adviceId: 'uuid-1', executedAt: 1234, despatchAdviceXml: '<DespatchAdvice/>' } as any,
        ])
        const response = createResponse()
        await despatchController.listDespatch(authedReq() as any, response)
        expect(response.status).toHaveBeenCalledWith(200)
        const body = response.json.mock.calls[0][0]
        expect(body.results).toHaveLength(1)
        expect(body.results[0]['advice-id']).toBe('uuid-1')
    })

    // --- cancelOrder ---
    it('creates an order cancellation', async () => {
        mockedService.createOrderCancellation.mockResolvedValue({
            cancellationDocument: '<OrderCancellation/>',
            cancellationReason: 'Test',
            cancellationId: 'cancel-1',
            adviceId: 'uuid-1',
            executedAt: '2026-01-01T00:00:00.000Z',
        } as any)
        const response = createResponse()
        await despatchController.cancelOrder(
            authedReq({
                body: {
                    'advice-id': 'uuid-1',
                    'order-cancellation-document': '<OrderCancellation/>',
                },
            }) as any,
            response
        )
        expect(mockedService.createOrderCancellation).toHaveBeenCalledWith('uuid-1', 'user-1', '<OrderCancellation/>')
        expect(response.status).toHaveBeenCalledWith(200)
        expect(response.json).toHaveBeenCalledWith(
            expect.objectContaining({ 'advice-id': 'uuid-1' })
        )
    })

    it('returns 404 if despatch advice not found for cancellation', async () => {
        mockedService.createOrderCancellation.mockResolvedValue(null)
        await expect(
            despatchController.cancelOrder(
                authedReq({
                    body: { 'advice-id': 'unknown', 'order-cancellation-document': '<X/>' },
                }) as any,
                createResponse()
            )
        ).rejects.toMatchObject({ statusCode: 404 })
    })

    it('rejects cancelOrder with missing fields', async () => {
        await expect(
            despatchController.cancelOrder(authedReq({ body: {} }) as any, createResponse())
        ).rejects.toMatchObject({ statusCode: 400 })

        await expect(
            despatchController.cancelOrder(
                authedReq({ body: { 'advice-id': 'x' } }) as any,
                createResponse()
            )
        ).rejects.toMatchObject({ statusCode: 400 })
    })

    // --- getOrderCancellation ---
    it('retrieves an order cancellation by advice-id', async () => {
        mockedService.getOrderCancellation.mockResolvedValue({
            cancellationDocument: '<OrderCancellation/>',
            cancellationReason: 'Test',
            cancellationId: 'cancel-1',
            adviceId: 'uuid-1',
            executedAt: '2026-01-01T00:00:00.000Z',
        } as any)
        const response = createResponse()
        await despatchController.getOrderCancellation(
            authedReq({ query: { 'advice-id': 'uuid-1' } }) as any,
            response
        )
        expect(response.status).toHaveBeenCalledWith(200)
        expect(response.json).toHaveBeenCalledWith(
            expect.objectContaining({ 'order-cancellation-id': 'cancel-1' })
        )
    })

    it('returns 404 if order cancellation not found', async () => {
        mockedService.getOrderCancellation.mockResolvedValue(null)
        await expect(
            despatchController.getOrderCancellation(
                authedReq({ query: { 'advice-id': 'unknown' } }) as any,
                createResponse()
            )
        ).rejects.toMatchObject({ statusCode: 404 })
    })

    it('returns 400 if no query param provided for getOrderCancellation', async () => {
        await expect(
            despatchController.getOrderCancellation(authedReq({ query: {} }) as any, createResponse())
        ).rejects.toMatchObject({ statusCode: 400 })
    })

    // --- cancelFulfilment ---
    it('creates a fulfilment cancellation', async () => {
        mockedService.createFulfilmentCancellation.mockResolvedValue({
            fulfilmentCancellationXml: '<FulfilmentCancellation/>',
            cancellationReason: 'Unable to deliver',
            fulfilmentCancellationId: 'fc-1',
            adviceId: 'uuid-1',
            executedAt: '2026-01-01T00:00:00.000Z',
        } as any)
        const response = createResponse()
        await despatchController.cancelFulfilment(
            authedReq({
                body: { 'advice-id': 'uuid-1', 'fulfilment-cancellation-reason': 'Unable to deliver' },
            }) as any,
            response
        )
        expect(mockedService.createFulfilmentCancellation).toHaveBeenCalledWith('uuid-1', 'user-1', 'Unable to deliver')
        expect(response.status).toHaveBeenCalledWith(200)
        expect(response.json).toHaveBeenCalledWith(
            expect.objectContaining({ 'fulfilment-cancellation-id': 'fc-1' })
        )
    })

    it('returns 404 if despatch advice not found for fulfilment cancellation', async () => {
        mockedService.createFulfilmentCancellation.mockResolvedValue(null)
        await expect(
            despatchController.cancelFulfilment(
                authedReq({
                    body: { 'advice-id': 'unknown', 'fulfilment-cancellation-reason': 'reason' },
                }) as any,
                createResponse()
            )
        ).rejects.toMatchObject({ statusCode: 404 })
    })

    it('rejects cancelFulfilment with missing fields', async () => {
        await expect(
            despatchController.cancelFulfilment(authedReq({ body: {} }) as any, createResponse())
        ).rejects.toMatchObject({ statusCode: 400 })

        await expect(
            despatchController.cancelFulfilment(
                authedReq({ body: { 'advice-id': 'x' } }) as any,
                createResponse()
            )
        ).rejects.toMatchObject({ statusCode: 400 })
    })

    // --- getFulfilmentCancellation ---
    it('retrieves a fulfilment cancellation', async () => {
        mockedService.getFulfilmentCancellation.mockResolvedValue({
            fulfilmentCancellationXml: '<FulfilmentCancellation/>',
            cancellationReason: 'reason',
            fulfilmentCancellationId: 'fc-1',
            adviceId: 'uuid-1',
            executedAt: '2026-01-01T00:00:00.000Z',
        } as any)
        const response = createResponse()
        await despatchController.getFulfilmentCancellation(
            authedReq({ query: { 'advice-id': 'uuid-1' } }) as any,
            response
        )
        expect(response.status).toHaveBeenCalledWith(200)
        expect(response.json).toHaveBeenCalledWith(
            expect.objectContaining({ 'fulfilment-cancellation-id': 'fc-1' })
        )
    })

    it('returns 404 if fulfilment cancellation not found', async () => {
        mockedService.getFulfilmentCancellation.mockResolvedValue(null)
        await expect(
            despatchController.getFulfilmentCancellation(
                authedReq({ query: { 'advice-id': 'unknown' } }) as any,
                createResponse()
            )
        ).rejects.toMatchObject({ statusCode: 404 })
    })

    it('returns 400 if no query param provided for getFulfilmentCancellation', async () => {
        await expect(
            despatchController.getFulfilmentCancellation(authedReq({ query: {} }) as any, createResponse())
        ).rejects.toMatchObject({ statusCode: 400 })
    })
})
