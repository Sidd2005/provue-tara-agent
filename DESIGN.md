# Design Document - Tara Finance Agent

## Schema Design
The schema uses a normalized relational model in PostgreSQL:
1. `transactions`: Stores all user spending. Columns include `id`, `date`, `merchant`, `normalized_merchant`, `category`, `amount`, `currency`, `memo`.
   - `normalized_merchant` is a cleaned version of the merchant string (removing suffixes like `*ORDER` or `MUMBAI`) to easily group aliases.
   - Indexes on `date`, `normalized_merchant`, and `category` optimize the most common filtering operations.
2. `funds`: Stores fund metadata (`id`, `name`, `category`).
3. `fund_navs`: Stores historical NAVs. Uses a composite primary key on `(fund_id, date)`. An index on `date` helps with quick range lookups.
4. `holdings`: Stores the user's actual portfolio (`id`, `fund_id`, `fund_name`, `units`, `purchase_date`, `purchase_nav`).

## Tool Design
I opted for three highly expressive tools rather than many narrow ones:
1. `query_transactions`: Handles all spending queries. It accepts optional filters (`dateRange`, `merchant`, `category`) and an `aggregateBy` parameter. It also natively handles "net" vs "gross" vs "refunds_only" via the `spendType` parameter. It explicitly filters out self-transfers (unless requested).
2. `compute_returns`: A single tool to compute both a fund's "period return" (NAV change between two dates) and the user's "realised return" on a holding. It uses raw SQL CTEs to find the closest available NAV dates and calculate the exact percentage.
3. `detect_recurring`: A heuristic-based tool that finds merchants with multiple transactions, active across multiple months, with very low standard deviation in amounts.

## Grounding Guarantee
The agent (`Tara`) is explicitly instructed in its system prompt to NEVER invent numbers. All calculations (sums, averages, percentage returns) are pushed down to the SQL layer (inside the tools). The LLM is only responsible for parsing the user's intent into tool arguments and formatting the SQL result into natural language.

## Formulas
- **Net Spend**: `SUM(amount)` where `amount` includes both positive spending and negative refunds.
- **Gross Spend**: `SUM(amount)` where `amount > 0`.
- **Merchant Matching**: Normalizes by upper-casing, stripping `*ORDER` and city suffixes, and checking against known aliases in the ingest script.
- **Recurring Detection**: Merchants with `COUNT(*) >= 2`, `COUNT(DISTINCT month) >= 2`, and `STDDEV(amount) < 0.1 * AVG(amount)`.
- **Fund Period Return**: `((end_nav - start_nav) / start_nav) * 100` between the closest dates available in `fund_navs` for the specified range.
- **Holding Realised Return**: `((current_nav - purchase_nav) / purchase_nav) * 100` using the latest available NAV for the holding's fund.

## Async Milestone Decision
I explicitly decided **not** to implement the async background worker milestone. The primary reason is the strict grading contract: the automated test harness expects a single `POST /ask` request to return the final `{ "answer": "..." }`. Implementing the async pattern where the API immediately returns "working on it" would break a synchronous test harness unless the harness explicitly knows to poll or wait. Given the 8-10 hour scope and the risk of breaking the core evaluation, I chose a synchronous, highly-optimized SQL approach to ensure correctness and reliability.

## Observability
A lightweight structured logging approach is added to `POST /ask`. It logs the request latency, the exact question, and any errors. More detailed tool call logging is handled natively by the Mastra engine.

## Future Improvements
With more time, I would:
1. Implement the async worker queue with WebSockets or Polling for the client UI.
2. Add a pgvector extension to do semantic matching on merchant memos.
3. Add a more robust date-parsing layer for relative dates ("last month", "Q1 2024") before hitting the SQL layer.
