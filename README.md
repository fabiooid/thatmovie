# That Movie

Chat app that helps you find a movie from a fuzzy plot description — and shows where you can watch it (via TMDB / JustWatch).

## Setup (API keys)

There is **no** `.env` file in the repo on purpose (secrets stay on your machine). Use the template instead:

1. In the project root, copy the example file:

   ```bash
   cp .env.example .env
   ```

   The template file is named **`.env.example`** (starts with a dot). If you don’t see it in Finder/Explorer, turn on “show hidden files”, or list it in the terminal with `ls -la`.

2. Open `.env` and fill in your keys:

   ```bash
   DEEPSEEK_API_KEY=...   # chat agent
   OPENAI_API_KEY=...     # movie search embeddings
   TMDB_API_KEY=...       # where-to-watch (TMDB v3 API key)
   ```

3. Get a free TMDB key: [themoviedb.org/settings/api](https://www.themoviedb.org/settings/api) → use the **API Key (v3 auth)**.

4. Never commit `.env`. Only `.env.example` is tracked in git.

The app loads `.env` from the **project root** when you run the server (`npm run dev` / `npm start`).

## Run

```bash
npm install
npm run dev
```

Open [http://localhost:3000](http://localhost:3000).

## Where to watch

- Markets: Italy (`IT`), United States (`US`), Hong Kong (`HK`), Australia (`AU`)
- Default country is US; change it in chat (e.g. “I’m in Italy”)
- Quick API check (with `TMDB_API_KEY` set):

  ```bash
  curl 'http://localhost:3000/api/watch-providers?title=Inception&year=2010&country=US'
  ```
