# Provue Tara Finance Agent

Tara is an AI persona built with the Mastra SDK and Express to act as a personal finance-research assistant. It fetches data from a PostgreSQL database using specialized tools.

## Setup Instructions

1. **Install Dependencies:**
   ```bash
   npm install
   ```

2. **Configure Environment:**
   Create a `.env` file in the root directory and add your API key and database URL.
   ```env
   DATABASE_URL=postgres://localhost:5432/provue_tara
   GOOGLE_API_KEY=your_gemini_api_key
   ```
   **✨ DYNAMIC PROVIDER SUPPORT:**
   The Mastra Agent is configured to dynamically switch providers based on the API key you provide. If the supplied Google key runs out of quota, you can simply swap it out! It fully supports:
   - `OPENAI_API_KEY` (uses `gpt-4o`)
   - `ANTHROPIC_API_KEY` (uses `claude-3-5-sonnet-20241022`)
   - `GROQ_API_KEY` (uses `llama-3.3-70b-versatile`)
   - `GOOGLE_API_KEY` or `GEMINI_API_KEY` (uses `gemini-2.0-flash-lite`)

3. **Set Up Database:**
   Ensure PostgreSQL is running locally.
   ```bash
   createdb provue_tara
   psql -d provue_tara -f schema.sql
   \`\`\`

4. **Ingest Data:**
   Run the ingest script against a sample snapshot.
   \`\`\`bash
   DATA_DIR=./data/sample_a npx tsx scripts/ingest.ts
   \`\`\`

5. **Run the Server:**
   Start the Express API server.
   \`\`\`bash
   npx tsx src/server.ts
   \`\`\`
   The server will run on \`http://localhost:3000\`.

## API Usage

Send a POST request to \`/ask\` with a JSON payload:
\`\`\`bash
curl -X POST http://localhost:3000/ask \
     -H "Content-Type: application/json" \
     -d '{"question": "How much did I spend on food last month?"}'
\`\`\`

## Evaluation
Run the automated test harness:
```bash
npx tsx eval.ts
```

## Deployment (Vercel)
This project is configured out of the box for deployment to Vercel as Serverless Functions.
1. Provision a managed Postgres database (e.g., Neon, Supabase) and add the connection string to your Vercel project's `DATABASE_URL` environment variable.
2. Add your valid `GOOGLE_API_KEY` to Vercel environment variables.
3. Deploy directly using the Vercel CLI (`npx vercel`) or by connecting your GitHub repository. Vercel will automatically detect `vercel.json` and serve the API on `/ask` and `/` routing to `api/index.ts`.

## Deployment
This project is designed to be easily deployed to platforms like Render or Railway. 
1. Provision a managed Postgres database and add the `DATABASE_URL` to your host's environment variables.
2. Add your `GOOGLE_API_KEY`.
3. The build command is `npm install && npx tsc`.
4. The start command is `node dist/server.js` (after compiling, or use `npx tsx src/server.ts` in development).
