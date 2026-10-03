# thatmovie

Describe a film you half remember and an agent finds it.

You type something like "the one where a man keeps reliving the same day in a small town" and the agent searches a library of plot summaries, then answers only with films it actually found. If it is not sure, it shows the three best matches and says why.

> **Screenshot placeholder.** A captured chat screenshot is not in this repo yet. Add one at `docs/screenshot.png` when you have a local run to photograph, then replace this note with `![thatmovie chat](docs/screenshot.png)`.

## Why I built it

I wanted a small, honest test of grounding: can an agent be made to search first and never answer from memory? It is the same problem as any business agent that must answer from company data and not make things up.

## How it works

1. **Data.** `npm run build:movies` turns the plot summary dataset (`movie.metadata.tsv`, `plot_summaries.txt`) into `data/movies.jsonl`. Set `MOVIE_SUMMARIES_DIR` to the folder that holds those two files. The script exits with an error if the variable is missing.
2. **Embeddings.** `npm run embed:movies` chunks the summaries and embeds them with `openai/text-embedding-3-small` into a local LibSQL vector store (`data/movies-vector.db`).
3. **Agent.** A Mastra agent named That Movie, using DeepSeek Flash (`deepseek/deepseek-flash`) at temperature 0.2, with one tool: `search-movies`. Its instructions: always search first, only name films that appear in the results, show the best three when unsure, never invent a title.
4. **Eval.** A scorer named `always-calls-search` runs on every agent response and passes only if `search-movies` was called. `npm run eval:search` loads a fixed set of well-known film prompts into Mastra Studio (Studio must already be running, default API `http://localhost:4112`). It does not score the agent unless you pass `--run`.
5. **UI.** A Next.js chat page with short-term memory (last 10 messages).

## Stack

Next.js 16, React, TypeScript, shadcn/ui, Mastra (agent, memory, RAG, scorers), LibSQL vector store, OpenAI embeddings (`text-embedding-3-small`), DeepSeek Flash for chat.

## Run it locally

Requires Node.js 22.13 or later.

```bash
npm install
cp .env.example .env        # add OPENAI_API_KEY (embeddings) and DEEPSEEK_API_KEY (chat)
# download the CMU Movie Summary Corpus (not included in this repo)
MOVIE_SUMMARIES_DIR=/path/to/MovieSummaries npm run build:movies
npm run embed:movies
npm run dev                 # http://localhost:3000
npm run dev:studio          # Mastra Studio, needed before the eval
npm run eval:search         # load the search cases into Studio
npm run eval:search -- --run
```

`OPENAI_API_KEY` and `DEEPSEEK_API_KEY` belong in `.env`. `MOVIE_SUMMARIES_DIR` is read from the environment when you run `build:movies` (the build script does not load `.env`). You can override the Studio API with `MASTRA_STUDIO_URL` if it is not at `http://localhost:4112/api`.

## Data

Plot summaries and metadata come from the [CMU Movie Summary Corpus](https://www.cs.cmu.edu/~ark/personas/) (Bamman, O'Connor and Smith, ACL 2013). The authors release that data under a Creative Commons Attribution-ShareAlike licence. They do not name a CC version on the corpus page or in the dataset README.

This repo does not include the dataset. Download it from the corpus page, unpack it, and point `MOVIE_SUMMARIES_DIR` at the folder that contains `movie.metadata.tsv` and `plot_summaries.txt`. Built files (`data/movies.jsonl` and the local databases) stay on your machine and are gitignored.

## How this was built

I designed the agent behaviour, the grounding rules and the eval, and built it with Cursor's coding agent. I reviewed the code and own the decisions.

## Licence

MIT. See `LICENSE`. That covers this project's code only. The movie summaries stay under the corpus terms above.
