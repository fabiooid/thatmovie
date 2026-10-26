# ThatMovie

**Describe a film you half remember and an agent finds it.** ThatMovie searches a local library of plot summaries and answers only with films it actually found. It is built with [Mastra](https://mastra.ai), Vite, React and Hono.

[![License: MIT](https://img.shields.io/badge/license-MIT-blue.svg)](LICENSE)
![Node.js >= 22.13](https://img.shields.io/badge/node-%3E%3D22.13-339933)
![TypeScript](https://img.shields.io/badge/TypeScript-strict-3178C6)
![Status: local prototype](https://img.shields.io/badge/status-local%20prototype-orange)

> [!IMPORTANT]
> ThatMovie is a **local prototype**. The CMU Movie Summary Corpus is not in this repository. You must download it yourself before `npm run build:movies` will run. Read [Data](#data) and [Project status](#project-status).

> **Screenshot placeholder.** A captured chat screenshot is not in this repo yet. Add one at `docs/screenshot.png` when you have a local run to photograph, then replace this note with `![ThatMovie chat](docs/screenshot.png)`.

---

## Contents

- [What it does](#what-it-does)
- [Why I built it](#why-i-built-it)
- [Design principles](#design-principles)
- [Quick start](#quick-start)
- [Configuration](#configuration)
- [How it works](#how-it-works)
- [Data](#data)
- [Project status](#project-status)
- [Contributing](#contributing)
- [Security](#security)
- [License](#license)

## What it does

You type something like "the one where a man keeps reliving the same day in a small town". ThatMovie then:

1. **Searches** a local library of plot summaries with the `search-movies` tool.
2. **Answers only with films it found.** It does not name a title from model memory.
3. **Shows the best three matches** and says why, when it is not sure.

The chat UI is a Vite and React page served by a small Hono server, with short-term memory (last 10 messages).

## Why I built it

I wanted a small, honest test of grounding: can an agent be made to search first and never answer from memory? It is the same problem as any business agent that must answer from company data and not make things up.

## Design principles

- **Search first.** The agent must call `search-movies` before it names a film.
- **No invented titles.** Only films that appear in the search results may be named.
- **Say when it is unsure.** If the match is unclear, show the best three and say why.
- **Local prototype first.** The app runs on your machine. It is not a hosted movie-search product.

## Quick start

**Requirements:** Node.js ≥ 22.13 and npm.

```bash
git clone https://github.com/fabiooid/thatmovie.git
cd thatmovie
npm install
cp .env.example .env        # add OPENAI_API_KEY (embeddings) and DEEPSEEK_API_KEY (chat)
```

Download the [CMU Movie Summary Corpus](https://www.cs.cmu.edu/~ark/personas/) (not included in this repo), unpack it, then:

```bash
MOVIE_SUMMARIES_DIR=/path/to/MovieSummaries npm run build:movies
npm run embed:movies
npm run dev                 # http://localhost:3000 (or PORT)
```

`OPENAI_API_KEY` and `DEEPSEEK_API_KEY` belong in `.env`. The Hono server loads `.env` if that file exists. `MOVIE_SUMMARIES_DIR` is read from the environment when you run `build:movies` (the build script does not load `.env`).

For a production-style run: `npm run build` then `npm run start`.

### Eval in Mastra Studio

The eval needs Studio running first:

```bash
npm run dev:studio          # Mastra Studio, needed before the eval
npm run eval:search         # load the search cases into Studio
npm run eval:search -- --run
```

`npm run eval:search` loads a fixed set of well-known film prompts into Studio (Studio must already be running, default API `http://localhost:4112`). It does not score the agent unless you pass `--run`. You can override the Studio API with `MASTRA_STUDIO_URL` if it is not at `http://localhost:4112/api`.

Model calls may incur provider charges.

## Configuration

Settings come from `.env` (see [`.env.example`](.env.example)):

| Variable | Purpose |
| --- | --- |
| `OPENAI_API_KEY` | Embeddings (`openai/text-embedding-3-small`) |
| `DEEPSEEK_API_KEY` | Chat model (`deepseek/deepseek-flash`) |

Other environment variables used at runtime, not listed in `.env.example`:

- `MOVIE_SUMMARIES_DIR` is required for `npm run build:movies`. Point it at the folder that contains `movie.metadata.tsv` and `plot_summaries.txt`.
- `PORT` is the chat app port (default `3000`).
- `MASTRA_STUDIO_URL` is the Studio API used by `npm run eval:search` (default `http://localhost:4112/api`).

`.env`, generated movie files and local databases stay out of git. Keep them that way.

## How it works

1. **Data.** `npm run build:movies` turns the plot summary dataset (`movie.metadata.tsv`, `plot_summaries.txt`) into `data/movies.jsonl`. Set `MOVIE_SUMMARIES_DIR` to the folder that holds those two files. The script exits with an error if the variable is missing.
2. **Embeddings.** `npm run embed:movies` chunks the summaries and embeds them with `openai/text-embedding-3-small` into a local LibSQL vector store (`data/movies-vector.db`).
3. **Agent.** A Mastra agent named That Movie, using DeepSeek Flash (`deepseek/deepseek-flash`) at temperature 0.2, with one tool: `search-movies`. Its instructions: always search first, only name films that appear in the results, show the best three when unsure, never invent a title.
4. **Eval.** A scorer named Always calls search (`always-calls-search-movies`) runs on every agent response and passes only if `search-movies` was called. `npm run eval:search` loads a fixed set of well-known film prompts into Mastra Studio. It does not score the agent unless you pass `--run`.
5. **UI.** A Vite and React chat page, with shadcn/ui, served by a small Hono server, with short-term memory (last 10 messages).

## Data

Plot summaries and metadata come from the [CMU Movie Summary Corpus](https://www.cs.cmu.edu/~ark/personas/) (Bamman, O'Connor and Smith, ACL 2013). The authors release that data under a Creative Commons Attribution-ShareAlike license. They do not name a CC version on the corpus page or in the dataset README.

This repo does not include the dataset. Download it from the corpus page, unpack it, and point `MOVIE_SUMMARIES_DIR` at the folder that contains `movie.metadata.tsv` and `plot_summaries.txt`. Built files (`data/movies.jsonl` and the local databases) stay on your machine and are gitignored.

## Project status

ThatMovie is a **local prototype**.

**Working**

- [x] Search-first movie agent with one tool (`search-movies`)
- [x] Local Vite/React chat served by Hono
- [x] Build and embed pipeline for the CMU Movie Summary Corpus
- [x] Eval that fails unless `search-movies` was called

**Not yet**

- [ ] Screenshot in the repository
- [ ] Scoring whether the right film was named (the eval only checks that search ran)
- [ ] Hosting or authentication

There is no automated test suite. The eval needs a live Studio session and model keys.

## Contributing

I designed the agent behaviour, the grounding rules and the eval, and built it with Cursor's coding agent. I reviewed the code and own the decisions.

Contributions are welcome. Please read **[CONTRIBUTING.md](CONTRIBUTING.md)** first. Never commit credentials, the movie corpus, generated embeddings, traces or databases. Keep pull requests small and focused.

## Security

Please **do not open public issues for security problems.** Report them privately through GitHub's [private vulnerability reporting](https://docs.github.com/en/code-security/security-advisories/guidance-on-reporting-and-writing-information-about-vulnerabilities/privately-reporting-a-security-vulnerability) on this repository.

Never paste tokens into issues or pull requests.

## License

[MIT](LICENSE) © 2026 Fabio Vella. Third-party dependencies keep their own licenses.

*The CMU Movie Summary Corpus belongs to its authors. It is used here only as a local source of plot summaries and is not included in this repository.*
