# That Movie

Chat app that helps you find a movie from a fuzzy plot description — and shows where you can watch it (via TMDB / JustWatch).

## API keys

Where-to-watch needs **`TMDB_API_KEY`**. Chat/search also need `DEEPSEEK_API_KEY` and `OPENAI_API_KEY`.

The app reads these from **`process.env`** (not only from a file). So:

- **Cursor Cloud Agents** → set secrets in the Cursor dashboard (recommended; no `.env` on the cloud machine)
- **Local laptop** → copy `.env.example` → `.env`

Get a free TMDB key: [themoviedb.org/settings/api](https://www.themoviedb.org/settings/api) → **API Key (v3 auth)**.

### Cursor Cloud Agent / hosted environment

Cloud VMs do **not** ship with a `.env` file. That is normal.

1. Open the [Cloud Agents dashboard](https://cursor.com/dashboard/cloud-agents).
2. Add a secret named exactly **`TMDB_API_KEY`** with your TMDB v3 API key.
   - Prefer **Secrets** for your user/team, or secrets on the **environment** used by this repo (ThatMovie).
   - Also add `DEEPSEEK_API_KEY` and `OPENAI_API_KEY` if they aren’t already set.
3. **Start a new Cloud Agent** after saving secrets. Secrets are injected when an agent **starts**; an already-running agent won’t see new ones.
4. No need to create `.env` on the cloud machine.

Cursor injects secrets as environment variables. This app uses `process.env.TMDB_API_KEY` for TMDB calls.

### Local development

1. In the project root:

   ```bash
   cp .env.example .env
   ```

   The template is **`.env.example`** (leading dot). Show hidden files if needed, or run `ls -la`.

2. Edit `.env` and fill in the keys. Never commit `.env`.

3. Run:

   ```bash
   npm install
   npm run dev
   ```

   Open [http://localhost:3000](http://localhost:3000).

If both a cloud/dashboard secret and a local `.env` value exist, the **already-set environment variable wins** (file does not overwrite it).

## Where to watch

- Markets: Italy (`IT`), United States (`US`), Hong Kong (`HK`), Australia (`AU`)
- Default country is US; change it in chat (e.g. “I’m in Italy”)
- Quick API check (with `TMDB_API_KEY` set):

  ```bash
  curl 'http://localhost:3000/api/watch-providers?title=Inception&year=2010&country=US'
  ```
