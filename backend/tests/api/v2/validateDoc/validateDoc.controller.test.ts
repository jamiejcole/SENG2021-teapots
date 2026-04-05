import * as validateDocController from '../../../../src/api/v2/validateDoc/validateDoc.controller'

// Mock libxmljs2 to avoid file system dependency on schemas
jest.mock('libxmljs2', () => {
    const mockDoc = {
        validate: jest.fn().mockReturnValue(true),
        validationErrors: [],
    }
    return {
        default: {
            parseXml: jest.fn().mockReturnValue(mockDoc),
        },
        parseXml: jest.fn().mockReturnValue(mockDoc),
    }
})

jest.mock('fs', () => ({
    existsSync: jest.fn().mockReturnValue(true),
    readFileSync: jest.fn().mockReturnValue('<xsd/>'),
}))

describe('validateDoc.controller', () => {
    function createResponse() {
        const response: any = {}
        response.status = jest.fn().mockReturnValue(response)
        response.json = jest.fn().mockReturnValue(response)
        return response
    }

    function authedReq(overrides: any = {}) {
        return { user: { userId: 'user-1' }, body: '<Order/>', params: {}, query: {}, ...overrides }
    }

    beforeEach(() => {
        jest.clearAllMocks()
        const libxml = require('libxmljs2')
        const mockDoc = {
            validate: jest.fn().mockReturnValue(true),
            validationErrors: [],
        }
        libxml.parseXml.mockReturnValue(mockDoc)
        libxml.default = { parseXml: libxml.parseXml }
    })

    it('validates an order document successfully', async () => {
        const response = createResponse()
        await validateDocController.validateDocument(
            authedReq({ params: { 'document-type': 'order' }, body: '<Order/>' }) as any,
            response
        )
        expect(response.status).toHaveBeenCalledWith(200)
        const body = response.json.mock.calls[0][0]
        expect(body.valid).toBe(true)
        expect(body.errors).toEqual([])
    })

    it('validates a despatch document type', async () => {
        const response = createResponse()
        await validateDocController.validateDocument(
            authedReq({ params: { 'document-type': 'despatch' }, body: '<DespatchAdvice/>' }) as any,
            response
        )
        expect(response.status).toHaveBeenCalledWith(200)
        expect(response.json.mock.calls[0][0].valid).toBe(true)
    })

    it('validates receipt, order-cancel, order-change, fulfilment-cancel document types', async () => {
        for (const docType of ['receipt', 'order-cancel', 'order-change', 'fulfilment-cancel']) {
            const response = createResponse()
            await validateDocController.validateDocument(
                authedReq({ params: { 'document-type': docType }, body: '<Doc/>' }) as any,
                response
            )
            expect(response.status).toHaveBeenCalledWith(200)
        }
    })

    it('returns 400 for invalid document type', async () => {
        await expect(
            validateDocController.validateDocument(
                authedReq({ params: { 'document-type': 'invalid-type' } }) as any,
                createResponse()
            )
        ).rejects.toMatchObject({ statusCode: 400 })
    })

    it('returns 400 for empty body', async () => {
        await expect(
            validateDocController.validateDocument(
                authedReq({ params: { 'document-type': 'order' }, body: '' }) as any,
                createResponse()
            )
        ).rejects.toMatchObject({ statusCode: 400 })

        await expect(
            validateDocController.validateDocument(
                authedReq({ params: { 'document-type': 'order' }, body: null }) as any,
                createResponse()
            )
        ).rejects.toMatchObject({ statusCode: 400 })
    })

    it('returns valid=false with errors when validation fails', async () => {
        const libxml = require('libxmljs2')
        const mockDoc = {
            validate: jest.fn().mockReturnValue(false),
            validationErrors: [{ message: 'Element {ns}Invalid not found' }],
        }
        libxml.parseXml.mockReturnValue(mockDoc)

        const response = createResponse()
        await validateDocController.validateDocument(
            authedReq({ params: { 'document-type': 'order' }, body: '<Invalid/>' }) as any,
            response
        )
        const body = response.json.mock.calls[0][0]
        expect(body.valid).toBe(false)
        expect(body.errors).toHaveLength(1)
        expect(body.errors[0]).toContain('Invalid not found')
    })

    it('returns valid=false when XML parsing fails', async () => {
        const libxml = require('libxmljs2')
        libxml.parseXml.mockImplementation(() => { throw new Error('XML Syntax Error') })

        const response = createResponse()
        await validateDocController.validateDocument(
            authedReq({ params: { 'document-type': 'order' }, body: 'not-xml' }) as any,
            response
        )
        const body = response.json.mock.calls[0][0]
        expect(body.valid).toBe(false)
        expect(body.errors[0]).toContain('XML Syntax Error')
    })

    it('throws 500 if schema file not found', async () => {
        const fs = require('fs')
        const libxml = require('libxmljs2')
        const mockDoc = {
            validate: jest.fn().mockReturnValue(true),
            validationErrors: [],
        }
        libxml.parseXml.mockReturnValue(mockDoc)
        fs.existsSync.mockReturnValue(false)

        await expect(
            validateDocController.validateDocument(
                authedReq({ params: { 'document-type': 'order' }, body: '<Order/>' }) as any,
                createResponse()
            )
        ).rejects.toThrow('Internal Server Error')
    })
})
