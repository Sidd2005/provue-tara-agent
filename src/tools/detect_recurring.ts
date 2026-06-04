import { createTool } from '@mastra/core/tools';
import { query } from '../db';

export const detectRecurringSubscriptions = createTool({
    id: 'detect_recurring',
    description: 'Finds merchants that are likely recurring subscriptions. It looks for merchants with multiple transactions of similar amounts spaced roughly a month apart.',
    inputSchema: undefined,
    execute: async ({ data }) => {
        // A simple heuristic: find merchants with >= 2 transactions, where the standard deviation of amount is very low, and they occur in different months.
        const sql = `
            WITH merchant_stats AS (
                SELECT normalized_merchant, 
                       COUNT(*) as tx_count, 
                       COUNT(DISTINCT TO_CHAR(date, 'YYYY-MM')) as months_active,
                       AVG(amount) as avg_amount,
                       STDDEV(amount) as stddev_amount
                FROM transactions
                WHERE amount > 0 AND category != 'transfer'
                GROUP BY normalized_merchant
            )
            SELECT normalized_merchant, tx_count, months_active, avg_amount
            FROM merchant_stats
            WHERE tx_count >= 2 
              AND months_active >= 2
              AND (stddev_amount IS NULL OR stddev_amount < (avg_amount * 0.1))
            ORDER BY tx_count DESC
            LIMIT 20
        `;
        const res = await query(sql);
        return res.rows;
    }
});
