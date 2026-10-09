import { handleChatStream } from '@mastra/ai-sdk';
import { toAISdkMessages } from '@mastra/ai-sdk/ui';
import { createUIMessageStreamResponse } from 'ai';
import { Hono } from 'hono';
import {
  DEFAULT_WATCH_COUNTRY,
  isWatchCountryCode,
  type WatchCountryCode,
} from '../src/lib/countries.ts';
import { CHAT_RESOURCE_ID, isGuestId } from '../src/lib/guest.ts';
import { getWatchAvailability } from '../src/mastra/data/tmdb-watch-providers.ts';
import { mastra } from '../src/mastra/index.ts';

const AGENT_ID = 'movie-agent';

const parseCountry = (value: unknown): WatchCountryCode =>
  isWatchCountryCode(value) ? value : DEFAULT_WATCH_COUNTRY;

const parseOptionalYear = (value: unknown): number | null => {
  if (value == null || value === '') {
    return null;
  }
  const year = Number(value);
  return Number.isInteger(year) && year > 1800 && year < 2100 ? year : null;
};

export const app = new Hono();

app.get('/api/watch-providers', async (c) => {
  const title = c.req.query('title')?.trim();
  const country = parseCountry(c.req.query('country'));
  const year = parseOptionalYear(c.req.query('year'));

  if (!title) {
    return c.json({ error: 'Missing title query parameter.' }, 400);
  }

  const availability = await getWatchAvailability({ title, year, country });
  return c.json(availability);
});

app.post('/api/chat', async (c) => {
  const params = await c.req.json();
  const { country: rawCountry, ...chatParams } = params ?? {};
  const thread = isGuestId(chatParams?.memory?.thread)
    ? chatParams.memory.thread
    : null;

  if (!thread) {
    return c.json({ error: 'Missing chat id.' }, 400);
  }

  const country = parseCountry(rawCountry);

  const stream = await handleChatStream({
    mastra,
    agentId: AGENT_ID,
    version: 'v7',
    params: {
      ...chatParams,
      abortSignal: c.req.raw.signal,
      memory: {
        thread,
        resource: CHAT_RESOURCE_ID,
      },
      instructions: `
You help people find a movie from a fuzzy description.
If you know the movie name from your training data ignore it and do not mention it. Do not show it in your reasoning.
Always use the search-movies tool first.
Only name movies that appear in the search results. If the right movie is unclear, show the best 3 matches and say why. Do not invent a title.
The user's streaming country is ${country}. When you call get-watch-providers, always pass country "${country}".
After you settle on one best match (or when the user asks where to watch), call get-watch-providers with that title and year when known.
Briefly mention stream / rent / buy services when the tool returns them. If there is no match or no availability, say so simply. Do not invent services.
Availability can change; do not promise a title is still on a service.
`,
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
