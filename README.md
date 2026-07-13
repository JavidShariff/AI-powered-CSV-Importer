# GrowEasy — AI CSV Importer

An intelligent, AI-powered system that drastically simplifies onboarding messy CSV data. GrowEasy takes poorly formatted, inconsistent CSV files from any CRM, ad platform, or spreadsheet, and uses Google's Gemini LLM to map them into a strictly typed canonical schema.

## Features
- **AI-Powered Semantic Mapping**: Doesn't rely on strict header string-matches. The AI understands the context (e.g. mapping "Client" -> "Name" and "Lost" -> "BAD_LEAD").
- **Robust Phone and Email Normalization**: Automatically extracts international country codes and structures messy mixed cell data.
- **Visual Data Preview**: Step-by-step confirmation GUI before processing.
- **Adaptive Chunking & Batching**: Backend automatically selects chunk and batch sizes based on CSV row count and prompt character limits.
- **Production-Grade Quota Handling**: Daily quota stops processing immediately and returns partial results. Minute quota respects Retry-After before retrying.
- **Partial Success**: Completed records are always preserved. Import never crashes — it always returns what was processed.

---

## Architecture Overview

```text
  [ Frontend: Next.js App Router ]
         |
    Upload CSV -> Parse -> Preview -> Confirm
         |
         v
  [ Backend: Express Server ]
         |
    Batch Rows (e.g. 10 rows/batch)
         |
         v
  [ AI Engine: Google Gemini API ]
         |
    Semantic extraction & normalisation
         |
    Typed JSON mapping
         |
         v
  [ Download Processed CSV / JSON ]
```

### Tech Stack
**Frontend:**
- Next.js (App Router)
- React 19
- Tailwind CSS v4 & shadcn/ui
- Zustand state machine orchestration

**Backend:**
- Express JS
- Google @google/generative-ai SDK 
- Zod (Strict schema validation)

---

## Folder Structure

\`\`\`
/src
  /components      # Shared UI primitives (shadcn)
  /features        # Feature-based architecture
    /csv-import    # Core domain for importing, previewing, and validation
      /api         # Frontend-to-backend API wrappers
      /components  # Step components (UploadStep, ResultsStep, etc.)
      /store       # Zustand state machine for import process
  /hooks           # Shared React hooks
  /lib             # Generic utilities (formatting, classes)
/backend
  /src
    /config        # Env parsing and setup
    /constants     # Schema definitions
    /prompts       # Engineered prompts for Gemini extraction
    /services      # Core logic (AI batches, LLM integration)
    /utils         # Helpers (JSON extract, chunking, retries)
\`\`\`

---

## Installation & Setup

### 1. Backend Setup
Navigate into the backend directory and run the Express api:
\`\`\`bash
cd backend
npm install
npm run dev
\`\`\`
*The server will start on port 8787.*

### 2. Frontend Setup
In the main directory, run the Next.js development server:
\`\`\`bash
npm install
npm run dev
\`\`\`
*The Next application will be available at http://localhost:3000.*

---

## Environment Variables

### Backend (\`backend/.env\`)
- **\`GEMINI_API_KEY\`**: Your API key from Google AI Studio. Required.
- **\`GEMINI_MODEL\`**: Target LLM model (default: \`gemini-2.0-flash\`).
- **\`DEFAULT_BATCH_SIZE\`**: Configurable rows sent per request (default: \`10\` for Free Tier stability).
- **\`RETRY_BASE_MS\`**: Number of ms for exponential backoff retry logic.

### Frontend (\`.env\`)
- **\`NEXT_PUBLIC_API_BASE_URL\`**: The backend url (default: \`http://localhost:8787\`).

---

## Complete Import Workflow

1. **Upload**: Drag and drop a messy CSV file. 
2. **Preview**: Instantly preview the raw data parsed to ensure visual sanity.
3. **Confirm**: Confirm total rows.
4. **AI Processing**: The Next.js frontend calls the backend. The backend breaks the rows into batches and iteratively passes them to Gemini for semantic parsing.
5. **Results**: A full statistical breakdown of Imported Rows, Skipped Rows, Failed Batches, Processing Time, and Success Rate is displayed. Results can be downloaded as cleaned \`.json\` or \`.csv\`.

---

## AI Processing Pipeline

1. **Chunking**: The backend receives N rows and divides them into batches size M based on \`DEFAULT_BATCH_SIZE\`.
2. **Prompting**: A deterministic prompt explicitly enforcing strict JSON is paired with the rows.
3. **Extraction**: The LLM responds. \`jsonExtract.ts\` robustly scrapes out the raw JSON logic while discarding any injected markdown fences or text prose from standard AI behaviours.
4. **Validation**: The JSON is piped through Zod to ensure canonical correctness. 

---

## APIs
- \`POST /api/import\`: Submits \`{ filename, rows, batchSize }\` and processes it via Gemini. Returns the processed canonical items, skipped items, and full statistics payload.
- \`GET /api/health\`: Simple boolean response indicating backend uptime.

---

## Test Data Generator

Need messy data to test the LLM mapping? Run the test data generator script from the backend:
\`\`\`bash
cd backend
npm run generate:test-data
\`\`\`
This script generates several files in the \`/test-data\` output folder simulating real world CRM exports (Facebook Leads, Real Estate Systems).

## Available Scripts
- \`npm run dev\` (Frontend/Backend): Starts the respective component.
- \`npm run build\` (Frontend): Prepares for production static execution.
- \`npm run lint\` (Frontend): Runs the Next.js standard linter.
- \`npm run generate:test-data\` (Backend): Creates messy mock test files for verifying standard logic.

---

## Gemini Free Tier Behavior

GrowEasy is designed to work reliably within Google Gemini Free Tier limits. This section explains how large CSV imports are handled, what happens when quotas are reached, and what the user can expect.

### Automatic Chunking

When a CSV is uploaded, the backend automatically divides it into processing chunks based on total row count:

| Dataset Size | Chunk Size |
|---|---|
| ≤ 100 rows | 50 rows / chunk |
| ≤ 1,000 rows | 100 rows / chunk |
| > 1,000 rows | 250 rows / chunk |

Each chunk is then further divided into adaptive Gemini batches (5, 8, or 10 rows), with prompt character length enforcement ensuring no single request exceeds 25,000 characters.

### Quota Detection

The backend includes a dedicated `quotaDetect.ts` utility that classifies Gemini errors into:

| Quota Type | Detection Method | Action |
|---|---|---|
| **Daily quota** | `GenerateRequestsPerDay`, `quotaValue:"20"` | Stop immediately, return partial result |
| **Minute quota** | `GenerateRequestsPerMinute`, `RPM`, HTTP 429 | Parse `Retry-After`, wait, retry once, continue |

**Daily quota** cannot be resolved by waiting minutes — the importer stops immediately and returns all completed work.

**Minute quota** respects the `Retry-After` delay returned by Gemini before retrying exactly once, then continues processing.

### Partial Success

The importer **never discards completed work**. If processing stops due to quota exhaustion:

- All successfully imported records are preserved
- The response includes `completed: false` and `stopReason: "quota"`
- The frontend shows a yellow warning banner with exact counts
- The CSV download is still available for all processed records

Example partial result:

```
Processed: 2,300 / 5,000 rows (46%)
Imported:  2,155 leads
Remaining: 2,700 rows
Reason:    Gemini Free Tier daily quota reached
```

### Retry Strategy

| Error Type | Behaviour |
|---|---|
| Daily quota | No retry — stop immediately |
| Minute quota | Wait `Retry-After` + 0-500ms jitter, retry once |
| JSON parse error | Retry batch exactly once inline |
| Network error | Mark batch failed, continue with next batch |

### Frontend Stop Reason Banners

The UI clearly communicates the outcome without exposing any raw error messages:

- ✅ `completed` — All rows processed successfully
- 🟡 `quota` — Partial import with row counts and resume instructions
- 🤖 `json` — AI returned malformed data for some batches
- 📡 `network` — Network interruption with retry prompt

### For Production / Paid API Key

To remove Free Tier limits, set a paid Gemini API key and increase `MAX_BATCH_SIZE` in `backend/.env`. No other code changes are required.
