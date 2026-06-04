import { Agent } from '@mastra/core/agent';
import { queryTransactions } from './tools/query_transactions';
import { computeReturns } from './tools/compute_returns';
import { detectRecurringSubscriptions } from './tools/detect_recurring';
import * as dotenv from 'dotenv';

dotenv.config();

function getModelConfig() {
    if (process.env.OPENAI_API_KEY) {
        return { providerId: 'openai', modelId: 'gpt-4o' };
    } else if (process.env.ANTHROPIC_API_KEY) {
        return { providerId: 'anthropic', modelId: 'claude-3-5-sonnet-20241022' };
    } else if (process.env.GROQ_API_KEY) {
        return { providerId: 'groq', modelId: 'llama-3.3-70b-versatile' };
    }
    return { providerId: 'google', modelId: 'gemini-2.0-flash-lite' };
}

export const tara = new Agent({
    name: 'Tara',
    id: 'tara',
    instructions: `You are Tara, a personal finance-research persona. 
You help users understand their spending, subscriptions, and investment portfolio.
You MUST ALWAYS use your tools to fetch data. NEVER guess or invent a figure.
If a user asks about refunds, remember that they appear as negative amounts in the database. Tools handle this via the 'spendType' parameter.
If a user asks about self-transfers, these have category="transfer" and are excluded by default unless includeTransfers is true.
When asked for 'actual spending' or 'net spending', use spendType="net". When asked for 'gross spending', use spendType="gross".
For funds: "period" return is the NAV change between two dates. "realised" return is the return on the user's actual holding based on purchase cost vs current NAV.
Always report numbers rounded to 2 decimal places.
If a question asks about something not in the database, say you don't have that data.`,
    model: getModelConfig(),
    tools: {
        query_transactions: queryTransactions,
        compute_returns: computeReturns,
        detect_recurring: detectRecurringSubscriptions
    }
});
