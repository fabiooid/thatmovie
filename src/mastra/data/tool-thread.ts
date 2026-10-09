import { MASTRA_THREAD_ID_KEY } from '@mastra/core/request-context';

type ToolContextLike = {
  requestContext?: {
    get?: (key: string) => unknown;
    getRaw?: (key: string) => unknown;
  };
};

export const getThreadIdFromToolContext = (
  context: ToolContextLike | undefined,
): string | null => {
  const requestContext = context?.requestContext;
  if (!requestContext) {
    return null;
  }

  const raw =
    requestContext.getRaw?.(MASTRA_THREAD_ID_KEY) ??
    requestContext.get?.(MASTRA_THREAD_ID_KEY) ??
    requestContext.getRaw?.('mastra__threadId') ??
    requestContext.get?.('mastra__threadId');

  return typeof raw === 'string' && raw.length > 0 ? raw : null;
};
