import { createScorer } from '@mastra/core/evals';

export const SEARCH_TOOL_ID = 'search-movies';
export const ALWAYS_CALLS_SEARCH_SCORER_ID = 'always-calls-search-movies';

const SEARCH_TOOL_NAMES = new Set([SEARCH_TOOL_ID, 'searchMoviesTool']);

const addToolName = (names: Set<string>, value: unknown) => {
  if (typeof value === 'string' && value.length > 0) {
    names.add(value);
  }
};

export const collectToolNames = (output: unknown) => {
  const names = new Set<string>();

  const visit = (value: unknown, depth = 0) => {
    if (!value || depth > 8) {
      return;
    }

    if (Array.isArray(value)) {
      for (const item of value) {
        visit(item, depth + 1);
      }
      return;
    }

    if (typeof value !== 'object') {
      return;
    }

    const record = value as Record<string, unknown>;
    addToolName(names, record.toolName);

    if (
      record.toolCallId ||
      record.type === 'tool-call' ||
      record.type === 'tool-invocation'
    ) {
      addToolName(names, record.name);
    }

    if (record.toolInvocation && typeof record.toolInvocation === 'object') {
      addToolName(
        names,
        (record.toolInvocation as Record<string, unknown>).toolName,
      );
    }

    visit(record.parts, depth + 1);
    visit(record.content, depth + 1);
    visit(record.toolInvocations, depth + 1);
    visit(record.messages, depth + 1);
  };

  visit(output);
  return [...names];
};

export const alwaysCallsSearchScorer = createScorer({
  id: ALWAYS_CALLS_SEARCH_SCORER_ID,
  name: 'Always calls search',
  description:
    'Pass only if the agent called the search-movies tool before answering.',
  type: 'agent',
})
  .preprocess(({ run }) => {
    const tools = collectToolNames(run.output);
    return {
      tools,
      called: tools.some((name) => SEARCH_TOOL_NAMES.has(name)),
    };
  })
  .generateScore(({ results }) => (results.preprocessStepResult?.called ? 1 : 0))
  .generateReason(({ results, score }) => {
    if (score === 1) {
      return 'The agent called the search-movies tool.';
    }

    const tools = results.preprocessStepResult?.tools ?? [];
    if (tools.length === 0) {
      return 'The agent answered without calling any tool. It must call search-movies first.';
    }

    return `The agent did not call search-movies. Tools used: ${tools.join(', ')}.`;
  });
