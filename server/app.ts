import { handleChatStream } from '@mastra/ai-sdk';
import { toAISdkMessages } from '@mastra/ai-sdk/ui';
import { createUIMessageStreamResponse } from 'ai';
import { Hono } from 'hono';
import { CHAT_RESOURCE_ID, isGuestId } from '../src/lib/guest.ts';
import { mastra } from '../src/mastra/index.ts';

const AGENT_ID = 'movie-agent';

export const app = new Hono();

app.post('/api/chat', async (c) => {
  const params = await c.req.json();
  const thread = isGuestId(params?.memory?.thread)
    ? params.memory.thread
    : null;

  if (!thread) {
    return c.json({ error: 'Missing chat id.' }, 400);
  }

  const stream = await handleChatStream({
    mastra,
    agentId: AGENT_ID,
    version: 'v7',
    params: {
      ...params,
      abortSignal: c.req.raw.signal,
      memory: {
        thread,
        resource: CHAT_RESOURCE_ID,
      },
    },
  });

  return createUIMessageStreamResponse({ stream });
});

app.get('/api/chat', async (c) => {
  const thread = c.req.query('thread');

  if (!isGuestId(thread)) {
    return c.json([]);
  }

  try {
    const memory = await mastra.getAgentById(AGENT_ID).getMemory();
    const recalled = await memory?.recall({
      threadId: thread,
      resourceId: CHAT_RESOURCE_ID,
    });

    return c.json(
      toAISdkMessages(recalled?.messages ?? [], { version: 'v7' }),
    );
  } catch {
    return c.json([]);
  }
});
