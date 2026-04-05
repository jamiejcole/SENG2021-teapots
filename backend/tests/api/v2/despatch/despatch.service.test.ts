import * as despatchService from '../../../../src/api/v2/despatch/despatch.service'
import { DespatchAdviceModel } from '../../../../src/models/despatchAdvice.model'
import { OrderCancellationModel } from '../../../../src/models/orderCancellation.model'
import { FulfilmentCancellationModel } from '../../../../src/models/fulfilmentCancellation.model'

jest.mock('../../../../src/models/despatchAdvice.model', () => ({
    DespatchAdviceModel: {
        create: jest.fn(),
        findOne: jest.fn(),
        find: jest.fn(),
    },
}))

jest.mock('../../../../src/models/orderCancellation.model', () => ({
    OrderCancellationModel: {
        create: jest.fn(),
        findOne: jest.fn(),
    },
}))

jest.mock('../../../../src/models/fulfilmentCancellation.model', () => ({
    FulfilmentCancellationModel: {
        create: jest.fn(),
        findOne: jest.fn(),
    },
}))

const sampleOrderXml = `<?xml version="1.0" encoding="UTF-8"?>
<Order xmlns="urn:oasis:names:specification:ubl:schema:xsd:Order-2"
       xmlns:cbc="urn:oasis:names:specification:ubl:schema:xsd:CommonBasicComponents-2"
       xmlns:cac="urn:oasis:names:specification:ubl:schema:xsd:CommonAggregateComponents-2">
  <cbc:ID>ORD-TEST-001</cbc:ID>
  <cbc:IssueDate>2026-01-01</cbc:IssueDate>
  <cac:BuyerCustomerParty>
    <cac:Party>
      <cac:PartyName><cbc:Name>Test Buyer</cbc:Name></cac:PartyName>
    </cac:Party>
  </cac:BuyerCustomerParty>
  <cac:SellerSupplierParty>
    <cac:Party>
      <cac:PartyName><cbc:Name>Test Seller</cbc:Name></cac:PartyName>
    </cac:Party>
  </cac:SellerSupplierParty>
</Order>`

describe('despatch.service', () => {
    const mockedDespatch = DespatchAdviceModel as jest.Mocked<typeof DespatchAdviceModel>
    const mockedCancellation = OrderCancellationModel as jest.Mocked<typeof OrderCancellationModel>
    const mockedFulfilment = FulfilmentCancellationModel as jest.Mocked<typeof FulfilmentCancellationModel>

    beforeEach(() => {
        jest.clearAllMocks()
    })

    // --- generateDespatchAdviceXml ---
    describe('generateDespatchAdviceXml', () => {
        it('generates XML containing DespatchAdvice and advice ID', () => {
            const xml = despatchService.generateDespatchAdviceXml(sampleOrderXml, 'test-advice-id')
            expect(xml).toContain('<DespatchAdvice')
            expect(xml).toContain('test-advice-id')
            expect(xml).toContain('ORD-TEST-001')
            expect(xml).toContain('Test Buyer')
            expect(xml).toContain('Test Seller')
        })

        it('handles XML with no matching namespaces gracefully', () => {
            const simpleXml = '<Order><ID>ORD-001</ID></Order>'
            const xml = despatchService.generateDespatchAdviceXml(simpleXml, 'advice-id-1')
            expect(xml).toContain('<DespatchAdvice')
            expect(xml).toContain('UNKNOWN')
        })
    })

    // --- createDespatchAdvice ---
    describe('createDespatchAdvice', () => {
        it('creates a DespatchAdvice record', async () => {
            ;(mockedDespatch.create as jest.Mock).mockResolvedValue({
                adviceId: 'uuid-1',
                executedAt: 1000000,
            })

            const result = await despatchService.createDespatchAdvice(sampleOrderXml, 'user-1')
            expect(mockedDespatch.create).toHaveBeenCalledWith(
                expect.objectContaining({ userId: 'user-1' })
            )
            expect(result.adviceId).toBe('uuid-1')
            expect(result.executedAt).toBe(1000000)
        })
    })

    // --- getDespatchAdviceByAdviceId ---
    describe('getDespatchAdviceByAdviceId', () => {
        it('returns advice when found', async () => {
            const mockExec = jest.fn().mockResolvedValue({ adviceId: 'uuid-1' })
            ;(mockedDespatch.findOne as jest.Mock).mockReturnValue({ lean: () => ({ exec: mockExec }) })

            const result = await despatchService.getDespatchAdviceByAdviceId('uuid-1', 'user-1')
            expect(mockedDespatch.findOne).toHaveBeenCalledWith({ adviceId: 'uuid-1', userId: 'user-1' })
            expect(result).toEqual({ adviceId: 'uuid-1' })
        })

        it('returns null when not found', async () => {
            const mockExec = jest.fn().mockResolvedValue(null)
            ;(mockedDespatch.findOne as jest.Mock).mockReturnValue({ lean: () => ({ exec: mockExec }) })

            const result = await despatchService.getDespatchAdviceByAdviceId('not-found', 'user-1')
            expect(result).toBeNull()
        })
    })

    // --- getDespatchAdviceByOrderXml ---
    describe('getDespatchAdviceByOrderXml', () => {
        it('returns advice when found by orderXml', async () => {
            const mockExec = jest.fn().mockResolvedValue({ adviceId: 'uuid-2' })
            ;(mockedDespatch.findOne as jest.Mock).mockReturnValue({ lean: () => ({ exec: mockExec }) })

            const result = await despatchService.getDespatchAdviceByOrderXml(sampleOrderXml, 'user-1')
            expect(mockedDespatch.findOne).toHaveBeenCalledWith({ orderXml: sampleOrderXml.trim(), userId: 'user-1' })
            expect(result).toEqual({ adviceId: 'uuid-2' })
        })
    })

    // --- listDespatchAdvices ---
    describe('listDespatchAdvices', () => {
        it('returns all advices for user', async () => {
            const mockSort = { lean: () => ({ exec: jest.fn().mockResolvedValue([{ adviceId: 'uuid-1' }]) }) }
            ;(mockedDespatch.find as jest.Mock).mockReturnValue({ sort: () => mockSort })

            const result = await despatchService.listDespatchAdvices('user-1')
            expect(mockedDespatch.find).toHaveBeenCalledWith({ userId: 'user-1' })
            expect(result).toEqual([{ adviceId: 'uuid-1' }])
        })
    })

    // --- createOrderCancellation ---
    describe('createOrderCancellation', () => {
        it('returns null if despatch advice not found', async () => {
            const mockExec = jest.fn().mockResolvedValue(null)
            ;(mockedDespatch.findOne as jest.Mock).mockReturnValue({ lean: () => ({ exec: mockExec }) })

            const result = await despatchService.createOrderCancellation('unknown', 'user-1', '<X/>')
            expect(result).toBeNull()
        })

        it('creates cancellation when advice exists', async () => {
            const mockExec = jest.fn().mockResolvedValue({ adviceId: 'uuid-1' })
            ;(mockedDespatch.findOne as jest.Mock).mockReturnValue({ lean: () => ({ exec: mockExec }) })
            ;(mockedCancellation.create as jest.Mock).mockResolvedValue({
                cancellationId: 'cancel-1',
                adviceId: 'uuid-1',
                cancellationDocument: '<X/>',
                cancellationReason: 'Cancellation requested',
                executedAt: '2026-01-01T00:00:00.000Z',
            })

            const result = await despatchService.createOrderCancellation('uuid-1', 'user-1', '<X/>')
            expect(mockedCancellation.create).toHaveBeenCalled()
            expect(result).not.toBeNull()
        })

        it('extracts reason from cancellation document if available', async () => {
            const mockExec = jest.fn().mockResolvedValue({ adviceId: 'uuid-1' })
            ;(mockedDespatch.findOne as jest.Mock).mockReturnValue({ lean: () => ({ exec: mockExec }) })
            ;(mockedCancellation.create as jest.Mock).mockResolvedValue({ cancellationId: 'c-1', adviceId: 'uuid-1' })

            const xmlWithReason = '<OrderCancellation><Reason>Custom reason</Reason></OrderCancellation>'
            await despatchService.createOrderCancellation('uuid-1', 'user-1', xmlWithReason)
            const createArg = (mockedCancellation.create as jest.Mock).mock.calls[0][0]
            expect(createArg.cancellationReason).toBe('Custom reason')
        })

        it('uses default reason if cancellation document is invalid XML', async () => {
            const mockExec = jest.fn().mockResolvedValue({ adviceId: 'uuid-1' })
            ;(mockedDespatch.findOne as jest.Mock).mockReturnValue({ lean: () => ({ exec: mockExec }) })
            ;(mockedCancellation.create as jest.Mock).mockResolvedValue({ cancellationId: 'c-1', adviceId: 'uuid-1' })

            await despatchService.createOrderCancellation('uuid-1', 'user-1', 'not-xml')
            const createArg = (mockedCancellation.create as jest.Mock).mock.calls[0][0]
            expect(createArg.cancellationReason).toBe('Cancellation requested')
        })
    })

    // --- getOrderCancellation ---
    describe('getOrderCancellation', () => {
        it('returns null if no params', async () => {
            const result = await despatchService.getOrderCancellation('user-1')
            expect(result).toBeNull()
        })

        it('searches by adviceId if provided', async () => {
            const mockExec = jest.fn().mockResolvedValue({ cancellationId: 'c-1' })
            ;(mockedCancellation.findOne as jest.Mock).mockReturnValue({ lean: () => ({ exec: mockExec }) })

            const result = await despatchService.getOrderCancellation('user-1', 'uuid-1')
            expect(mockedCancellation.findOne).toHaveBeenCalledWith({ adviceId: 'uuid-1', userId: 'user-1' })
            expect(result).toEqual({ cancellationId: 'c-1' })
        })

        it('searches by cancellationId if adviceId not provided', async () => {
            const mockExec = jest.fn().mockResolvedValue({ cancellationId: 'c-1' })
            ;(mockedCancellation.findOne as jest.Mock).mockReturnValue({ lean: () => ({ exec: mockExec }) })

            await despatchService.getOrderCancellation('user-1', undefined, 'c-1')
            expect(mockedCancellation.findOne).toHaveBeenCalledWith({ cancellationId: 'c-1', userId: 'user-1' })
        })
    })

    // --- createFulfilmentCancellation ---
    describe('createFulfilmentCancellation', () => {
        it('returns null if despatch advice not found', async () => {
            const mockExec = jest.fn().mockResolvedValue(null)
            ;(mockedDespatch.findOne as jest.Mock).mockReturnValue({ lean: () => ({ exec: mockExec }) })

            const result = await despatchService.createFulfilmentCancellation('unknown', 'user-1', 'reason')
            expect(result).toBeNull()
        })

        it('creates fulfilment cancellation when advice exists', async () => {
            const mockExec = jest.fn().mockResolvedValue({ adviceId: 'uuid-1' })
            ;(mockedDespatch.findOne as jest.Mock).mockReturnValue({ lean: () => ({ exec: mockExec }) })
            ;(mockedFulfilment.create as jest.Mock).mockResolvedValue({
                fulfilmentCancellationId: 'fc-1',
                adviceId: 'uuid-1',
                cancellationReason: 'Unable to deliver',
                fulfilmentCancellationXml: '<FulfilmentCancellation/>',
                executedAt: '2026-01-01T00:00:00.000Z',
            })

            const result = await despatchService.createFulfilmentCancellation('uuid-1', 'user-1', 'Unable to deliver')
            expect(mockedFulfilment.create).toHaveBeenCalled()
            const createArg = (mockedFulfilment.create as jest.Mock).mock.calls[0][0]
            expect(createArg.cancellationReason).toBe('Unable to deliver')
            expect(createArg.fulfilmentCancellationXml).toContain('<FulfilmentCancellation')
            expect(result).not.toBeNull()
        })

        it('escapes XML special chars in reason', async () => {
            const mockExec = jest.fn().mockResolvedValue({ adviceId: 'uuid-1' })
            ;(mockedDespatch.findOne as jest.Mock).mockReturnValue({ lean: () => ({ exec: mockExec }) })
            ;(mockedFulfilment.create as jest.Mock).mockResolvedValue({ fulfilmentCancellationId: 'fc-1' })

            await despatchService.createFulfilmentCancellation('uuid-1', 'user-1', '<reason> & "test"')
            const createArg = (mockedFulfilment.create as jest.Mock).mock.calls[0][0]
            expect(createArg.fulfilmentCancellationXml).toContain('&lt;reason&gt; &amp; &quot;test&quot;')
        })
    })

    // --- getFulfilmentCancellation ---
    describe('getFulfilmentCancellation', () => {
        it('returns null if no params', async () => {
            const result = await despatchService.getFulfilmentCancellation('user-1')
            expect(result).toBeNull()
        })

        it('searches by adviceId if provided', async () => {
            const mockExec = jest.fn().mockResolvedValue({ fulfilmentCancellationId: 'fc-1' })
            ;(mockedFulfilment.findOne as jest.Mock).mockReturnValue({ lean: () => ({ exec: mockExec }) })

            const result = await despatchService.getFulfilmentCancellation('user-1', 'uuid-1')
            expect(mockedFulfilment.findOne).toHaveBeenCalledWith({ adviceId: 'uuid-1', userId: 'user-1' })
            expect(result).toEqual({ fulfilmentCancellationId: 'fc-1' })
        })

        it('searches by fulfilmentCancellationId if adviceId not provided', async () => {
            const mockExec = jest.fn().mockResolvedValue({ fulfilmentCancellationId: 'fc-1' })
            ;(mockedFulfilment.findOne as jest.Mock).mockReturnValue({ lean: () => ({ exec: mockExec }) })

            await despatchService.getFulfilmentCancellation('user-1', undefined, 'fc-1')
            expect(mockedFulfilment.findOne).toHaveBeenCalledWith({ fulfilmentCancellationId: 'fc-1', userId: 'user-1' })
        })
    })
})
