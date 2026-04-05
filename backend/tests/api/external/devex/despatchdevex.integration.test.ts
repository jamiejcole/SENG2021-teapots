export {}
import '../../../../src/loadEnv';
import * as fs from 'node:fs';
import * as path from 'node:path';

/**
 * Test Suite for DevEx Despatch Advice API
 * OpenAPI URL: see backend/tests/api/external/despatchdevex.swagger.json
 * API Base:    https://devex.cloud.tcore.network/api/v1/
 *
 * To run this test, use the following:
 * `RUN_DEVEX_DESPATCH_INTEGRATION=true npm test -- --runTestsByPath tests/api/external/despatchdevex.integration.test.ts`
 */

type HealthResponse = {
	status: string;
	uptime: number;
	version: string;
	'executed-at': number;
};

type ErrorResponse = {
	errors: string[];
	'executed-at'?: number;
};

type CreateApiKeyResponse = {
	message: string;
	'executed-at': number;
};

type CreateDespatchAdviceResponse = {
	success: boolean;
	adviceIds: string[];
	'executed-at': number;
};

type DespatchRetrievalResponse = {
	'despatch-advice': string;
	'advice-id': string;
	'executed-at': number;
};

type ListDespatchAdvicesResponse = {
	results: Array<{
		'advice-id': string;
		'executed-at': number;
		'despatch-advice'?: string;
	}>;
	'executed-at': number;
};

type CancelOrderResponse = {
	'order-cancellation': string;
	'order-cancellation-reason': string;
	'order-cancellation-id': string;
	'advice-id': string;
	'executed-at': string;
};

type FulfilmentCancellationResponse = {
	'fulfilment-cancellation': string;
	'fulfilment-cancellation-reason': string;
	'fulfilment-cancellation-id': string;
	'advice-id': string;
	'executed-at': string;
};

type ValidateDocumentResponse = {
	valid: boolean;
	errors: string[];
	'executed-at': number;
};

type DespatchApiResponse =
	| HealthResponse
	| ErrorResponse
	| CreateApiKeyResponse
	| CreateDespatchAdviceResponse
	| DespatchRetrievalResponse
	| ListDespatchAdvicesResponse
	| CancelOrderResponse
	| FulfilmentCancellationResponse
	| ValidateDocumentResponse;

const runLiveTests = process.env.RUN_DEVEX_DESPATCH_INTEGRATION === 'true';
const describeIfLive = runLiveTests ? describe : describe.skip;
const baseUrl = (process.env.DEVEX_DESPATCH_API_BASE_URL ?? 'https://devex.cloud.tcore.network/api/v1').replace(/\/$/, '');
const apiKey = process.env.DEVEX_DESPATCH_API_KEY;
const sampleOrderXmlPath = path.resolve(__dirname, '../../../../src/models/sample.xml');
const orderXml = fs.readFileSync(sampleOrderXmlPath, 'utf8').trim();

function apiKeyHeaders() {
	return {
		'Api-Key': apiKey ?? '',
	};
}

function jsonHeaders() {
	return {
		...apiKeyHeaders(),
		'content-type': 'application/json',
	};
}

function xmlHeaders() {
	return {
		...apiKeyHeaders(),
		'content-type': 'application/xml',
	};
}

function cancellationPayload(adviceId: string) {
	return {
		'advice-id': adviceId,
		'order-cancellation-document': `<OrderCancellation><AdviceID>${adviceId}</AdviceID><Reason>Test cancellation</Reason></OrderCancellation>`,
	};
}

function fulfilmentCancellationPayload(adviceId: string) {
	return {
		'advice-id': adviceId,
		'fulfilment-cancellation-reason': 'Test fulfilment cancellation',
	};
}

function createApiKeyPayload() {
	const seed = `${Date.now()}-${Math.random().toString(16).slice(2)}`;

	return {
		teamName: `Teapot Test ${seed}`,
		contactEmail: `teapot-${seed}@student.unsw.edu.au`,
		contactName: 'Teapot Test Runner',
	};
}

function expectHealthResponse(body: HealthResponse) {
	expect(body).toEqual(
		expect.objectContaining({
			status: expect.any(String),
			uptime: expect.any(Number),
			version: expect.any(String),
			'executed-at': expect.any(Number),
		}),
	);
}

function expectCreateApiKeyResponse(body: CreateApiKeyResponse) {
	expect(body).toEqual(
		expect.objectContaining({
			message: expect.any(String),
			'executed-at': expect.any(Number),
		}),
	);
}

function expectCreateDespatchAdviceResponse(body: CreateDespatchAdviceResponse) {
	expect(body).toEqual(
		expect.objectContaining({
			success: true,
			adviceIds: expect.arrayContaining([expect.any(String)]),
			'executed-at': expect.any(Number),
		}),
	);
}

function expectDespatchRetrievalResponse(body: DespatchRetrievalResponse) {
	expect(body).toEqual(
		expect.objectContaining({
			'despatch-advice': expect.any(String),
			'advice-id': expect.any(String),
			'executed-at': expect.any(Number),
		}),
	);
	expect(body['despatch-advice']).toContain('<DespatchAdvice');
}

function expectListDespatchAdvicesResponse(body: ListDespatchAdvicesResponse) {
	expect(body).toEqual(
		expect.objectContaining({
			results: expect.any(Array),
			'executed-at': expect.any(Number),
		}),
	);
	expect(body.results.length).toBeGreaterThanOrEqual(1);
}

function expectCancelOrderResponse(body: CancelOrderResponse) {
	expect(body).toEqual(
		expect.objectContaining({
			'order-cancellation': expect.any(String),
			'order-cancellation-reason': expect.any(String),
			'order-cancellation-id': expect.any(String),
			'advice-id': expect.any(String),
			'executed-at': expect.any(String),
		}),
	);
}

function expectFulfilmentCancellationResponse(body: FulfilmentCancellationResponse) {
	expect(body).toEqual(
		expect.objectContaining({
			'fulfilment-cancellation': expect.any(String),
			'fulfilment-cancellation-reason': expect.any(String),
			'fulfilment-cancellation-id': expect.any(String),
			'advice-id': expect.any(String),
			'executed-at': expect.any(String),
		}),
	);
}

async function request(pathname: string, init: RequestInit = {}) {
	return fetch(`${baseUrl}${pathname}`, {
		...init,
		headers: {
			...(init.headers ?? {}),
		},
	});
}

async function requestJson<T extends DespatchApiResponse>(pathname: string, init: RequestInit = {}) {
	const response = await request(pathname, init);
	const body = await response.json();
	return { response, body: body as T };
}

async function createDespatchAdvice() {
	const response = await requestJson<CreateDespatchAdviceResponse>('/despatch/create', {
		method: 'POST',
		headers: xmlHeaders(),
		body: orderXml,
	});

	expect(response.response.status).toBe(200);
	expectCreateDespatchAdviceResponse(response.body);

	const adviceId = response.body.adviceIds[0];
	expect(adviceId).toEqual(expect.any(String));

	return {
		adviceId,
		response: response.body,
	};
}

describeIfLive('DevEx despatch advice external API smoke tests', () => {
	beforeAll(() => {
		if (!apiKey) {
			throw new Error('DEVEX_DESPATCH_API_KEY is required to run these live tests');
		}
	});

	it('returns a healthy status payload', async () => {
		const { response, body } = await requestJson<HealthResponse>('/health');

		expect(response.status).toBe(200);
		expectHealthResponse(body);
	});

	it('rejects protected routes without an API key', async () => {
		const response = await request('/despatch/list');

		expect(response.status).toBe(401);
		const body = (await response.json()) as ErrorResponse;
		expect(body).toEqual(
			expect.objectContaining({
				errors: expect.arrayContaining([expect.any(String)]),
			}),
		);
	});

	it('creates a despatch advice record from order XML', async () => {
		const response = await createDespatchAdvice();
		expect(response.adviceId).toEqual(expect.any(String));
	}, 30000);

	it('retrieves a stored despatch advice by advice id', async () => {
		const created = await createDespatchAdvice();

		const retrieval = await requestJson<DespatchRetrievalResponse>(
			`/despatch/retrieve?search-type=advice-id&query=${encodeURIComponent(created.adviceId)}`,
			{
				headers: apiKeyHeaders(),
			},
		);

		expect(retrieval.response.status).toBe(200);
		expectDespatchRetrievalResponse(retrieval.body);
		expect(retrieval.body['advice-id']).toBe(created.adviceId);
	}, 30000);

	it('lists despatch advice records for the current API key', async () => {
		await createDespatchAdvice();

		const response = await requestJson<ListDespatchAdvicesResponse>('/despatch/list', {
			headers: apiKeyHeaders(),
		});

		expect(response.response.status).toBe(200);
		expectListDespatchAdvicesResponse(response.body);
	}, 30000);

	it('creates and retrieves an order cancellation for a despatch advice', async () => {
		const created = await createDespatchAdvice();

		const cancellationResponse = await requestJson<CancelOrderResponse>('/despatch/cancel/order', {
			method: 'POST',
			headers: jsonHeaders(),
			body: JSON.stringify(cancellationPayload(created.adviceId)),
		});

		expect(cancellationResponse.response.status).toBe(200);
		expectCancelOrderResponse(cancellationResponse.body);

		const retrievalResponse = await requestJson<CancelOrderResponse>(
			`/despatch/cancel/order?advice-id=${encodeURIComponent(created.adviceId)}`,
			{
				headers: apiKeyHeaders(),
			},
		);

		expect(retrievalResponse.response.status).toBe(200);
		expectCancelOrderResponse(retrievalResponse.body);
		expect(retrievalResponse.body['advice-id']).toBe(created.adviceId);
	}, 30000);

	it('creates and retrieves a fulfilment cancellation for a despatch advice', async () => {
		const created = await createDespatchAdvice();

		const cancellationResponse = await requestJson<FulfilmentCancellationResponse>('/despatch/cancel/fulfilment', {
			method: 'POST',
			headers: jsonHeaders(),
			body: JSON.stringify(fulfilmentCancellationPayload(created.adviceId)),
		});

		expect(cancellationResponse.response.status).toBe(200);
		expectFulfilmentCancellationResponse(cancellationResponse.body);

		const retrievalResponse = await requestJson<FulfilmentCancellationResponse>(
			`/despatch/cancel/fulfilment?advice-id=${encodeURIComponent(created.adviceId)}`,
			{
				headers: apiKeyHeaders(),
			},
		);

		expect(retrievalResponse.response.status).toBe(200);
		expectFulfilmentCancellationResponse(retrievalResponse.body);
		expect(retrievalResponse.body['advice-id']).toBe(created.adviceId);
	}, 30000);

	it('can request a fresh API key for onboarding flow', async () => {
		const response = await requestJson<CreateApiKeyResponse>('/api-key/create', {
			method: 'POST',
			headers: {
				'content-type': 'application/json',
			},
			body: JSON.stringify(createApiKeyPayload()),
		});

		expect(response.response.status).toBe(200);
		expectCreateApiKeyResponse(response.body);
	}, 30000);
});

	export {};
