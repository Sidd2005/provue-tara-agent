import { createTool } from '@mastra/core/tools';
import { z } from 'zod';
import { query } from '../db';

export const queryTransactions = createTool({
    id: 'query_transactions',
    description: 'Query user transactions to get total spend, average, or lists. Automatically excludes transfers (category="transfer") unless includeTransfers is true. Automatically calculates net spend (including refunds) unless spendType is specified.',
    inputSchema: z.object({
        dateRange: z.object({
            start: z.string().describe('Start date in YYYY-MM-DD format'),
            end: z.string().describe('End date in YYYY-MM-DD format')
        }).optional(),
        merchant: z.string().optional().describe('Merchant name (e.g. Swiggy) to filter by. Supports partial matches.'),
        category: z.string().optional().describe('Category (e.g. food, travel) to filter by.'),
        aggregateBy: z.enum(['month', 'category', 'merchant', 'none']).default('none').describe('How to group the results. Use "none" for overall totals.'),
        spendType: z.enum(['net', 'gross', 'refunds_only']).default('net').describe('net: includes refunds (negative amounts), gross: only positive spending, refunds_only: only negative amounts.'),
        includeTransfers: z.boolean().default(false).describe('If true, includes self-transfers (category="transfer").')
    }),
    execute: async ({ data }) => {
        const { dateRange, merchant, category, aggregateBy, spendType, includeTransfers } = data;
        
        let sql = `SELECT `;
        const params: any[] = [];
        let paramIdx = 1;
        
        const conditions: string[] = [];
        
        if (aggregateBy === 'month') {
            sql += `TO_CHAR(date, 'YYYY-MM') as month, `;
        } else if (aggregateBy === 'category') {
            sql += `category, `;
        } else if (aggregateBy === 'merchant') {
            sql += `normalized_merchant as merchant, `;
        }
        
        sql += `SUM(amount) as total_spend, AVG(amount) as avg_spend, COUNT(*) as txn_count FROM transactions WHERE 1=1 `;
        
        if (dateRange) {
            conditions.push(`date >= $${paramIdx++}`);
            params.push(dateRange.start);
            conditions.push(`date <= $${paramIdx++}`);
            params.push(dateRange.end);
        }
        
        if (merchant) {
            conditions.push(`normalized_merchant ILIKE $${paramIdx++}`);
            params.push(`%${merchant}%`);
        }
        
        if (category) {
            conditions.push(`category ILIKE $${paramIdx++}`);
            params.push(`%${category}%`);
        }
        
        if (!includeTransfers) {
            conditions.push(`category != 'transfer'`);
        }
        
        if (spendType === 'gross') {
            conditions.push(`amount > 0`);
        } else if (spendType === 'refunds_only') {
            conditions.push(`amount < 0`);
        }
        
        if (conditions.length > 0) {
            sql += ` AND ` + conditions.join(' AND ');
        }
        
        if (aggregateBy === 'month') {
            sql += ` GROUP BY TO_CHAR(date, 'YYYY-MM') ORDER BY month`;
        } else if (aggregateBy === 'category') {
            sql += ` GROUP BY category ORDER BY total_spend DESC`;
        } else if (aggregateBy === 'merchant') {
            sql += ` GROUP BY normalized_merchant ORDER BY total_spend DESC`;
        }
        
        const res = await query(sql, params);
        
        return res.rows;
    }
});
