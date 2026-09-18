import {
  computeBackoffMs,
  createHttpClient,
  DEFAULT_RETRY_POLICY,
  HttpError,
  isRetryableStatus,
  NetworkError,
} from '@/data/api/httpClient';

/** Test doubles only care about (url) -> Response; widen to fetch's signature. */
const asFetch = (fn: jest.Mock): typeof fetch => fn as unknown as typeof fetch;

function response(status: number, body: unknown = {}): Response {
  return {
    ok: status >= 200 && status < 300,
    status,
    json: () => Promise.resolve(body),
  } as unknown as Response;
}

describe('computeBackoffMs', () => {
  it('grows exponentially, is capped, and adds bounded jitter', () => {
    const policy = { ...DEFAULT_RETRY_POLICY, baseDelayMs: 100, maxDelayMs: 1000, jitterRatio: 0.5 };
    expect(computeBackoffMs(0, policy, () => 0)).toBe(100);
    expect(computeBackoffMs(1, policy, () => 0)).toBe(200);
    expect(computeBackoffMs(2, policy, () => 0)).toBe(400);
    expect(computeBackoffMs(5, policy, () => 0)).toBe(1000); // capped
    expect(computeBackoffMs(0, policy, () => 1)).toBe(150); // + 50% jitter
  });
  it('classifies retryable statuses', () => {
    expect(isRetryableStatus(500)).toBe(true);
    expect(isRetryableStatus(503)).toBe(true);
    expect(isRetryableStatus(429)).toBe(true);
    expect(isRetryableStatus(404)).toBe(false);
    expect(isRetryableStatus(400)).toBe(false);
  });
});

describe('createHttpClient', () => {
  const sleeps: number[] = [];
  const sleepFn = (ms: number) => {
    sleeps.push(ms);
    return Promise.resolve();
  };
  beforeEach(() => sleeps.splice(0));

  it('builds the URL from baseUrl and returns parsed JSON', async () => {
    const fetchFn = jest.fn(() => Promise.resolve(response(200, { data: [] })));
    const client = createHttpClient({ baseUrl: 'https://api.test/v2/', fetchFn: asFetch(fetchFn), sleepFn });
    await expect(client.getJson('/breeds?page[number]=1')).resolves.toEqual({ data: [] });
    expect((fetchFn.mock.calls as unknown as [string][])[0]?.[0]).toBe('https://api.test/v2/breeds?page[number]=1');
  });

  it('retries 5xx with exponential backoff then succeeds', async () => {
    const fetchFn = jest
      .fn<Promise<Response>, []>()
      .mockResolvedValueOnce(response(503))
      .mockResolvedValueOnce(response(500))
      .mockResolvedValueOnce(response(200, { ok: true }));
    const client = createHttpClient({
      baseUrl: 'https://api.test',
      fetchFn: asFetch(fetchFn),
      sleepFn,
      random: () => 0,
      retry: { baseDelayMs: 100, jitterRatio: 0 },
    });
    await expect(client.getJson('groups')).resolves.toEqual({ ok: true });
    expect(fetchFn).toHaveBeenCalledTimes(3);
    expect(sleeps).toEqual([100, 200]);
  });

  it('retries network failures and gives up after maxAttempts', async () => {
    const fetchFn = jest.fn(() => Promise.reject(new TypeError('Network request failed')));
    const client = createHttpClient({
      baseUrl: 'https://api.test',
      fetchFn: asFetch(fetchFn),
      sleepFn,
      retry: { maxAttempts: 3, baseDelayMs: 10, jitterRatio: 0 },
    });
    await expect(client.getJson('breeds')).rejects.toBeInstanceOf(NetworkError);
    expect(fetchFn).toHaveBeenCalledTimes(3);
    expect(sleeps).toHaveLength(2);
  });

  it('does not retry 4xx client errors', async () => {
    const fetchFn = jest.fn(() => Promise.resolve(response(404)));
    const client = createHttpClient({ baseUrl: 'https://api.test', fetchFn: asFetch(fetchFn), sleepFn });
    await expect(client.getJson('breeds/nope')).rejects.toBeInstanceOf(HttpError);
    expect(fetchFn).toHaveBeenCalledTimes(1);
    expect(sleeps).toHaveLength(0);
  });
});
