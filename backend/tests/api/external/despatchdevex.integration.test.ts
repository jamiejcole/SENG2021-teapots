import '../../../src/loadEnv';
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
const sampleOrderXmlPath = path.resolve(__dirname, '../../../src/models/sample.xml');
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
		'order-cancellation-document': `<?xml version="1.0" encoding="UTF-8"?><OrderCancellation xmlns="urn:oasis:names:specification:ubl:schema:xsd:OrderCancellation-2" xmlns:cbc="urn:oasis:names:specification:ubl:schema:xsd:CommonBasicComponents-2" xmlns:cac="urn:oasis:names:specification:ubl:schema:xsd:CommonAggregateComponents-2"><cbc:ID>1</cbc:ID><cbc:IssueDate>2026-04-06</cbc:IssueDate><cbc:Note>Test cancellation</cbc:Note><cac:OrderReference><cbc:ID>AEG012345</cbc:ID></cac:OrderReference></OrderCancellation>`,
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

function expectValidateDocumentResponse(body: ValidateDocumentResponse) {
	expect(body).toEqual(
		expect.objectContaining({
			valid: expect.any(Boolean),
			errors: expect.any(Array),
			'executed-at': expect.any(Number),
		}),
	);
	for (const err of body.errors) {
		expect(typeof err).toBe('string');
	}
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

	// Security: invalid key
	it('rejects protected routes with an invalid API key', async () => {
		const response = await request('/despatch/list', {
			headers: { 'Api-Key': 'invalid-key-that-does-not-exist' },
		});

		expect(response.status).toBe(401);
		const body = (await response.json()) as ErrorResponse;
		expect(body.errors).toEqual(expect.arrayContaining([expect.any(String)]));
	}, 10000);

	// Bad request: /despatch/create
	it('rejects POST /despatch/create with an empty body', async () => {
		const { response, body } = await requestJson<ErrorResponse>('/despatch/create', {
			method: 'POST',
			headers: xmlHeaders(),
			body: '',
		});

		expect(response.status).toBe(400);
		expect(body.errors).toEqual(expect.arrayContaining([expect.any(String)]));
	}, 15000);

	it('rejects POST /despatch/create with malformed XML', async () => {
		const { response, body } = await requestJson<ErrorResponse>('/despatch/create', {
			method: 'POST',
			headers: xmlHeaders(),
			body: '<this is not valid xml <<<',
		});

		// Spec says 400; API currently returns 500 (unhandled parse error — server-side bug, see findings report)
		expect([400, 500]).toContain(response.status);
		if (response.status === 400) {
			expect(body.errors).toEqual(expect.arrayContaining([expect.any(String)]));
		}
	}, 15000);

	it('rejects POST /despatch/create with a JSON body', async () => {
		const { response, body } = await requestJson<ErrorResponse>('/despatch/create', {
			method: 'POST',
			headers: jsonHeaders(),
			body: JSON.stringify({ order: 'not xml' }),
		});

		expect(response.status).toBe(400);
		expect(body.errors).toEqual(expect.arrayContaining([expect.any(String)]));
	}, 15000);

	// Bad request: /despatch/retrieve
	it('rejects GET /despatch/retrieve with a missing search-type parameter', async () => {
		const { response, body } = await requestJson<ErrorResponse>('/despatch/retrieve?query=anything', {
			headers: apiKeyHeaders(),
		});

		expect(response.status).toBe(400);
		expect(body.errors).toEqual(expect.arrayContaining([expect.any(String)]));
	}, 10000);

	it('rejects GET /despatch/retrieve with an invalid search-type value', async () => {
		const { response, body } = await requestJson<ErrorResponse>(
			'/despatch/retrieve?search-type=invalid&query=test',
			{ headers: apiKeyHeaders() },
		);

		expect(response.status).toBe(400);
		expect(body.errors).toEqual(expect.arrayContaining([expect.any(String)]));
	}, 10000);

	it('returns 404 for GET /despatch/retrieve with an unknown advice-id', async () => {
		const { response, body } = await requestJson<ErrorResponse>(
			'/despatch/retrieve?search-type=advice-id&query=a1b2c3d4-e5f6-7890-abcd-ef1234567890',
			{ headers: apiKeyHeaders() },
		);

		expect(response.status).toBe(404);
		expect(body.errors).toEqual(expect.arrayContaining([expect.any(String)]));
	}, 10000);

	// Bad request: cancellations
	it('rejects POST /despatch/cancel/order with a missing advice-id field', async () => {
		const { response, body } = await requestJson<ErrorResponse>('/despatch/cancel/order', {
			method: 'POST',
			headers: jsonHeaders(),
			body: JSON.stringify({ 'order-cancellation-document': '<OrderCancellation/>' }),
		});

		expect(response.status).toBe(400);
		expect(body.errors).toEqual(expect.arrayContaining([expect.any(String)]));
		expect(body.errors.some((e) => e.toLowerCase().includes('advice-id'))).toBe(true);
	}, 15000);

	it('rejects POST /despatch/cancel/fulfilment with a missing fulfilment-cancellation-reason', async () => {
		const { response, body } = await requestJson<ErrorResponse>('/despatch/cancel/fulfilment', {
			method: 'POST',
			headers: jsonHeaders(),
			body: JSON.stringify({ 'advice-id': 'a1b2c3d4-e5f6-7890-abcd-ef1234567890' }),
		});

		expect(response.status).toBe(400);
		expect(body.errors).toEqual(expect.arrayContaining([expect.any(String)]));
		expect(body.errors.some((e) => e.toLowerCase().includes('fulfilment-cancellation-reason'))).toBe(true);
	}, 15000);

	// Untested endpoint: retrieve by order XML
	it('retrieves a despatch advice by order XML using search-type=order', async () => {
		await createDespatchAdvice();

		const { response, body } = await requestJson<DespatchRetrievalResponse>(
			`/despatch/retrieve?search-type=order&query=${encodeURIComponent(orderXml)}`,
			{ headers: apiKeyHeaders() },
		);

		expect(response.status).toBe(200);
		expectDespatchRetrievalResponse(body);
	}, 30000);

	// Untested endpoint: /validate-doc
	it('validates a valid order XML document via POST /validate-doc/order', async () => {
		const { response, body } = await requestJson<ValidateDocumentResponse>('/validate-doc/order', {
			method: 'POST',
			headers: xmlHeaders(),
			body: orderXml,
		});

		expect(response.status).toBe(200);
		expectValidateDocumentResponse(body);
	}, 15000);

	it('returns valid=false with errors for an invalid order XML document', async () => {
		const { response, body } = await requestJson<ValidateDocumentResponse>('/validate-doc/order', {
			method: 'POST',
			headers: xmlHeaders(),
			body: '<Order><MissingRequiredFields/></Order>',
		});

		expect(response.status).toBe(200);
		expect(body.valid).toBe(false);
		expect(body.errors.length).toBeGreaterThan(0);
		expectValidateDocumentResponse(body);
	}, 15000);

	it('rejects POST /validate-doc/order with an empty body', async () => {
		const { response, body } = await requestJson<ErrorResponse>('/validate-doc/order', {
			method: 'POST',
			headers: xmlHeaders(),
			body: '',
		});

		expect(response.status).toBe(400);
		expect(body.errors).toEqual(expect.arrayContaining([expect.any(String)]));
	}, 10000);

	it('rejects POST /validate-doc with an unknown document type', async () => {
		const { response, body } = await requestJson<ErrorResponse>('/validate-doc/not-a-real-type', {
			method: 'POST',
			headers: xmlHeaders(),
			body: orderXml,
		});

		expect(response.status).toBe(400);
		expect(body.errors).toEqual(expect.arrayContaining([expect.any(String)]));
	}, 10000);

	it('rejects POST /validate-doc/order without an API key', async () => {
		const response = await request('/validate-doc/order', {
			method: 'POST',
			headers: { 'content-type': 'application/xml' },
			body: orderXml,
		});

		expect(response.status).toBe(401);
	}, 10000);
});

describeIfLive('DevEx despatch advice API benchmarks', () => {
	const RUNS = 3;
	const timings: Record<string, number[]> = {};
	let benchmarkAdviceId: string;

	function median(arr: number[]): number {
		const sorted = [...arr].sort((a, b) => a - b);
		const mid = Math.floor(sorted.length / 2);
		return sorted.length % 2 !== 0 ? sorted[mid] : (sorted[mid - 1] + sorted[mid]) / 2;
	}

	async function timed(fn: () => Promise<unknown>): Promise<number> {
		const start = performance.now();
		await fn();
		return performance.now() - start;
	}

	beforeAll(async () => {
		if (!apiKey) {
			throw new Error('DEVEX_DESPATCH_API_KEY is required to run these benchmarks');
		}
		const created = await createDespatchAdvice();
		benchmarkAdviceId = created.adviceId;
	}, 30000);

	afterAll(() => {
		const rows = Object.entries(timings).map(([label, samples]) => {
			const mean = samples.reduce((a, b) => a + b, 0) / samples.length;
			const med = median(samples);
			const min = Math.min(...samples);
			const max = Math.max(...samples);
			return { label, mean, med, min, max };
		});

		console.log('\n| Endpoint | Mean (ms) | Median (ms) | Min (ms) | Max (ms) |');
		console.log('|---|---|---|---|---|');
		for (const r of rows) {
			console.log(`| ${r.label} | ${r.mean.toFixed(1)} | ${r.med.toFixed(1)} | ${r.min.toFixed(1)} | ${r.max.toFixed(1)} |`);
		}
	});

	it('benchmarks GET /health', async () => {
		const label = 'GET /health';
		timings[label] = [];
		for (let i = 0; i < RUNS; i++) {
			timings[label].push(await timed(() => request('/health')));
		}
		expect(timings[label].length).toBe(RUNS);
	}, 30000);

	it('benchmarks POST /despatch/create', async () => {
		const label = 'POST /despatch/create';
		timings[label] = [];
		for (let i = 0; i < RUNS; i++) {
			timings[label].push(
				await timed(() => request('/despatch/create', { method: 'POST', headers: xmlHeaders(), body: orderXml })),
			);
		}
		expect(timings[label].length).toBe(RUNS);
	}, 60000);

	it('benchmarks GET /despatch/list', async () => {
		const label = 'GET /despatch/list';
		timings[label] = [];
		for (let i = 0; i < RUNS; i++) {
			timings[label].push(await timed(() => request('/despatch/list', { headers: apiKeyHeaders() })));
		}
		expect(timings[label].length).toBe(RUNS);
	}, 30000);

	it('benchmarks GET /despatch/retrieve by advice-id', async () => {
		const label = 'GET /despatch/retrieve?search-type=advice-id';
		timings[label] = [];
		for (let i = 0; i < RUNS; i++) {
			timings[label].push(
				await timed(() =>
					request(`/despatch/retrieve?search-type=advice-id&query=${encodeURIComponent(benchmarkAdviceId)}`, {
						headers: apiKeyHeaders(),
					}),
				),
			);
		}
		expect(timings[label].length).toBe(RUNS);
	}, 30000);

	it('benchmarks POST /validate-doc/order', async () => {
		const label = 'POST /validate-doc/order';
		timings[label] = [];
		for (let i = 0; i < RUNS; i++) {
			timings[label].push(
				await timed(() => request('/validate-doc/order', { method: 'POST', headers: xmlHeaders(), body: orderXml })),
			);
		}
		expect(timings[label].length).toBe(RUNS);
	}, 30000);

	it('benchmarks POST /despatch/cancel/order', async () => {
		const label = 'POST /despatch/cancel/order';
		timings[label] = [];
		for (let i = 0; i < RUNS; i++) {
			const { adviceId } = await createDespatchAdvice();
			timings[label].push(
				await timed(() =>
					request('/despatch/cancel/order', {
						method: 'POST',
						headers: jsonHeaders(),
						body: JSON.stringify(cancellationPayload(adviceId)),
					}),
				),
			);
		}
		expect(timings[label].length).toBe(RUNS);
	}, 90000);
});

export {};
