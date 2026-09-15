import { handleChatStream } from '@mastra/ai-sdk';
import { toAISdkMessages } from '@mastra/ai-sdk/ui';
import { createUIMessageStreamResponse } from 'ai';
import { NextResponse } from 'next/server';
import { CHAT_RESOURCE_ID, isGuestId } from '@/lib/guest';
import { mastra } from '@/mastra';

export const runtime = 'nodejs';
export const dynamic = 'force-dynamic';
export const maxDuration = 60;

const AGENT_ID = 'movie-agent';

export async function POST(req: Request) {
  const params = await req.json();
  const thread = isGuestId(params?.memory?.thread)
    ? params.memory.thread
    : null;

  if (!thread) {
    return NextResponse.json({ error: 'Missing chat id.' }, { status: 400 });
  }

  const stream = await handleChatStream({
    mastra,
    agentId: AGENT_ID,
    version: 'v7',
    params: {
      ...params,
      abortSignal: req.signal,
      memory: {
        thread,
        resource: CHAT_RESOURCE_ID,
      },
    },
  });

  return createUIMessageStreamResponse({ stream });
}

export async function GET(req: Request) {
  const thread = new URL(req.url).searchParams.get('thread');

  if (!isGuestId(thread)) {
    return NextResponse.json([]);
  }

  try {
    const memory = await mastra.getAgentById(AGENT_ID).getMemory();
    const recalled = await memory?.recall({
      threadId: thread,
      resourceId: CHAT_RESOURCE_ID,
    });

    return NextResponse.json(
      toAISdkMessages(recalled?.messages ?? [], { version: 'v7' }),
    );
  } catch {
    return NextResponse.json([]);
  }
}
