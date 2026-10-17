import { expect, it, vi } from 'vitest';
vi.mock('@/lib/usageDb.js', () => ({ trackPendingRequest: vi.fn(), appendRequestLog: vi.fn(async () => {}), saveRequestDetail: vi.fn(async () => {}), saveRequestUsage: vi.fn(async () => {}) }));
const { handleNonStreamingResponse } = await import('../../open-sse/handlers/chatCore/nonStreamingHandler.js');
const { FORMATS } = await import('../../open-sse/translator/formats.js');
const { createSSEStream } = await import('../../open-sse/utils/stream.js');
it.each([FORMATS.OPENAI, FORMATS.CLAUDE, FORMATS.OPENAI_RESPONSES])('preserves provider errors for a streaming %s client', async sourceFormat => {
  const upstream = new Response('data: ' + JSON.stringify({ error: { message: 'ChatGPT account check; wait before retrying', status: 429 } }) + '\n\ndata: [DONE]\n\n');
  const text = await new Response(upstream.body.pipeThrough(createSSEStream({ sourceFormat, targetFormat: FORMATS.OPENAI }))).text();
  expect(text).toContain('ChatGPT account check');
  expect(text).not.toContain('"type":"response.completed"');
  if (sourceFormat === FORMATS.OPENAI_RESPONSES) expect(text).toContain('"type":"error"');
});
it.each([FORMATS.OPENAI, FORMATS.CLAUDE, FORMATS.OPENAI_RESPONSES])('surfaces a CoS SSE refusal as an error rather than an empty success for %s', async sourceFormat => {
  const retryAt = Date.now() + 60000;
  const onRequestSuccess = vi.fn();
  const result = await handleNonStreamingResponse({
    providerResponse: new Response('data: ' + JSON.stringify({ error: { message: 'ChatGPT account check; wait before retrying', status: 429, retry_at: retryAt } }) + '\n\ndata: [DONE]\n\n', { headers: { 'content-type': 'text/event-stream' } }),
    provider: 'openai-compatible-cos', model: 'gpt-6', sourceFormat, targetFormat: FORMATS.OPENAI,
    body: { stream: false }, stream: false, onRequestSuccess, trackDone: vi.fn(), appendLog: vi.fn(),
    reqLogger: { logProviderResponse: vi.fn(), logConvertedResponse: vi.fn() }, requestStartTime: Date.now(),
  });
  expect(result.success).toBe(false);
  expect(result.response.status).toBe(429);
  expect(result.resetsAtMs).toBe(retryAt);
  expect((await result.response.json()).error.message).toContain('account check');
  expect(onRequestSuccess).not.toHaveBeenCalled();
});
