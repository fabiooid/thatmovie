import {
  ALWAYS_CALLS_SEARCH_DATASET_DESCRIPTION,
  ALWAYS_CALLS_SEARCH_DATASET_NAME,
  alwaysCallsSearchCases,
} from '../src/mastra/evals/always-calls-search-cases.ts';
import { ALWAYS_CALLS_SEARCH_SCORER_ID } from '../src/mastra/scorers/always-calls-search.ts';

const STUDIO_API = process.env.MASTRA_STUDIO_URL ?? 'http://localhost:4112/api';
const shouldRun = process.argv.includes('--run');

type DatasetRecord = {
  id: string;
  name: string;
  scorerIds?: string[] | null;
  targetIds?: string[] | null;
};

const api = async (path: string, init?: RequestInit) => {
  const response = await fetch(`${STUDIO_API}${path}`, {
    ...init,
    headers: {
      'content-type': 'application/json',
      ...(init?.headers ?? {}),
    },
  });
  const text = await response.text();
  const body = text ? JSON.parse(text) : null;

  if (!response.ok) {
    throw new Error(
      `${init?.method ?? 'GET'} ${path} failed (${response.status}): ${text}`,
    );
  }

  return body;
};

const listDatasets = async () => {
  const payload = await api('/datasets?perPage=100');
  return (payload.datasets ?? payload.items ?? payload ?? []) as DatasetRecord[];
};

const main = async () => {
  const datasets = await listDatasets();
  let dataset = datasets.find(
    (item) => item.name === ALWAYS_CALLS_SEARCH_DATASET_NAME,
  );

  if (!dataset) {
    dataset = (await api('/datasets', {
      method: 'POST',
      body: JSON.stringify({
        name: ALWAYS_CALLS_SEARCH_DATASET_NAME,
        description: ALWAYS_CALLS_SEARCH_DATASET_DESCRIPTION,
        targetType: 'agent',
        targetIds: ['movie-agent'],
        scorerIds: [ALWAYS_CALLS_SEARCH_SCORER_ID],
      }),
    })) as DatasetRecord;
    console.log(`Created dataset ${dataset.id}`);
  } else {
    console.log(`Using existing dataset ${dataset.id}`);
  }

  const existingItems = await api(`/datasets/${dataset.id}/items?perPage=100`);
  const items = existingItems.items ?? existingItems ?? [];

  if (items.length === 0) {
    await api(`/datasets/${dataset.id}/items/batch`, {
      method: 'POST',
      body: JSON.stringify({
        items: alwaysCallsSearchCases.map((input) => ({
          input,
          groundTruth: {
            mustCallTool: 'search-movies',
          },
        })),
      }),
    });
    console.log(`Added ${alwaysCallsSearchCases.length} test questions`);
  } else {
    console.log(`Dataset already has ${items.length} questions`);
  }

  if (!shouldRun) {
    console.log(
      'Evaluation task is ready in Studio. Re-run with --run to score the movie agent.',
    );
    return;
  }

  const experiment = await api(`/datasets/${dataset.id}/experiments`, {
    method: 'POST',
    body: JSON.stringify({
      start: true,
      name: 'Always call search',
      targetType: 'agent',
      targetId: 'movie-agent',
      scorerIds: [ALWAYS_CALLS_SEARCH_SCORER_ID],
      maxConcurrency: 1,
    }),
  });

  console.log('Started experiment', experiment.id ?? experiment.experimentId ?? experiment);
};

try {
  await main();
} catch (error) {
  console.error(error instanceof Error ? error.message : error);
  process.exit(1);
}
