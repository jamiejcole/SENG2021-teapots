import * as summaryController from '../../../../src/api/v2/summary/summary.controller'
import { OrderModel } from '../../../../src/models/order.model'

jest.mock('../../../../src/models/order.model', () => ({
    OrderModel: {
        find: jest.fn(),
    },
}))

describe('summary.controller', () => {
    const mockedModel = OrderModel as jest.Mocked<typeof OrderModel>

    function createResponse() {
        const response: any = {}
        response.status = jest.fn().mockReturnValue(response)
        response.json = jest.fn().mockReturnValue(response)
        return response
    }

    function authedReq(overrides: any = {}) {
        return { user: { userId: `user-${Date.now()}-${Math.random()}` }, body: {}, ...overrides }
    }

    beforeEach(() => {
        jest.clearAllMocks()
    })

    const makeMockFind = (results: any[]) => ({
        sort: () => ({ lean: () => ({ exec: jest.fn().mockResolvedValue(results) }) }),
        lean: () => ({ exec: jest.fn().mockResolvedValue(results) }),
    })

    it('returns a summary of orders for the user', async () => {
        const orders = [
            {
                orderId: 'ORD-001',
                buyer: { name: 'Buyer Corp' },
                seller: { name: 'Seller Corp' },
                currency: 'AUD',
                totals: { payableAmount: 100 },
                lines: [{ lineId: '1' }],
            },
        ]
        ;(mockedModel.find as jest.Mock).mockReturnValue(makeMockFind(orders))

        const response = createResponse()
        await summaryController.generateSummary(authedReq() as any, response)

        expect(response.status).toHaveBeenCalledWith(200)
        const body = response.json.mock.calls[0][0]
        expect(body.summary).toContain('ORD-001')
        expect(body.summary).toContain('Buyer Corp')
        expect(body.summary).toContain('Seller Corp')
        expect(typeof body.remainingDailyRequests).toBe('number')
    })

    it('returns no orders message when no orders found', async () => {
        ;(mockedModel.find as jest.Mock).mockReturnValue(makeMockFind([]))

        const response = createResponse()
        await summaryController.generateSummary(authedReq() as any, response)

        const body = response.json.mock.calls[0][0]
        expect(body.summary).toBe('No orders found.')
    })

    it('filters by orderIds when provided', async () => {
        const orders = [
            {
                orderId: 'ORD-002',
                buyer: { name: 'Buyer A' },
                seller: { name: 'Seller A' },
                currency: 'USD',
                totals: { payableAmount: 200 },
                lines: [],
            },
        ]
        ;(mockedModel.find as jest.Mock).mockReturnValue(makeMockFind(orders))

        const response = createResponse()
        await summaryController.generateSummary(
            authedReq({ body: { orderIds: ['ORD-002'] } }) as any,
            response
        )

        expect(mockedModel.find).toHaveBeenCalledWith(
            expect.objectContaining({ orderId: { $in: ['ORD-002'] } })
        )
        const body = response.json.mock.calls[0][0]
        expect(body.summary).toContain('ORD-002')
    })

    it('respects lineLength parameter', async () => {
        const orders = Array.from({ length: 5 }, (_, i) => ({
            orderId: `ORD-00${i + 1}`,
            buyer: { name: 'Buyer' },
            seller: { name: 'Seller' },
            currency: 'AUD',
            totals: { payableAmount: 100 },
            lines: [],
        }))
        ;(mockedModel.find as jest.Mock).mockReturnValue(makeMockFind(orders))

        const response = createResponse()
        await summaryController.generateSummary(
            authedReq({ body: { lineLength: 2 } }) as any,
            response
        )

        const body = response.json.mock.calls[0][0]
        // Should only contain 2 orders in summary
        const orderMatches = (body.summary.match(/ORD-/g) || []).length
        expect(orderMatches).toBe(2)
    })

    it('returns 429 when rate limit is exhausted', async () => {
        // Use a fresh unique userId to avoid cross-test pollution
        const userId = `rate-limit-user-${Date.now()}`

        // Exhaust the daily limit (10 requests)
        ;(mockedModel.find as jest.Mock).mockReturnValue(makeMockFind([]))

        for (let i = 0; i < 10; i++) {
            const response = createResponse()
            await summaryController.generateSummary(
                { user: { userId }, body: {} } as any,
                response
            )
        }

        await expect(
            summaryController.generateSummary({ user: { userId }, body: {} } as any, createResponse())
        ).rejects.toMatchObject({ statusCode: 429 })
    })

    it('returns 401 when unauthenticated', async () => {
        await expect(
            summaryController.generateSummary({ user: undefined, body: {} } as any, createResponse())
        ).rejects.toMatchObject({ statusCode: 401 })
    })

    it('handles orders without optional fields gracefully', async () => {
        const orders = [{ _id: 'mongo-id', orderId: null, buyer: null, seller: null, currency: null, totals: null, lines: null }]
        ;(mockedModel.find as jest.Mock).mockReturnValue(makeMockFind(orders))

        const response = createResponse()
        await summaryController.generateSummary(authedReq() as any, response)

        const body = response.json.mock.calls[0][0]
        expect(typeof body.summary).toBe('string')
    })
})
