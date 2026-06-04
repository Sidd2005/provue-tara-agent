import { createTool } from '@mastra/core/tools';
import { z } from 'zod';
import { query } from '../db';

export const computeReturns = createTool({
    id: 'compute_returns',
    description: "Compute returns for funds or user holdings. 'period' return measures a fund's NAV change between two dates (requires dateRange). 'realised' return measures the user's actual return on a holding based on purchase cost vs current NAV (requires no date range, computes up to the latest NAV available).",
    inputSchema: z.object({
        returnType: z.enum(['period', 'realised']).describe('Type of return to compute.'),
        target: z.enum(['fund', 'holding', 'portfolio']).describe('Whether to compute for a specific fund, specific holding, or entire portfolio.'),
        fundId: z.string().optional().describe('Fund ID, required if target is fund or holding and you want a specific one.'),
        dateRange: z.object({
            start: z.string(),
            end: z.string()
        }).optional().describe('Required if returnType is "period".')
    }),
    execute: async ({ data }) => {
        const { returnType, target, fundId, dateRange } = data;

        if (returnType === 'period') {
            if (!dateRange) {
                return { error: 'dateRange is required for period return.' };
            }

            let sql = `
                WITH start_nav AS (
                    SELECT fund_id, nav FROM fund_navs WHERE date >= $1 ORDER BY date ASC LIMIT 1
                ),
                end_nav AS (
                    SELECT fund_id, nav FROM fund_navs WHERE date <= $2 ORDER BY date DESC LIMIT 1
                )
                SELECT f.id, f.name, sn.nav as start_nav, en.nav as end_nav, 
                       ((en.nav - sn.nav) / sn.nav) * 100 as period_return_pct
                FROM funds f
                JOIN start_nav sn ON f.id = sn.fund_id
                JOIN end_nav en ON f.id = en.fund_id
            `;
            const params: any[] = [dateRange.start, dateRange.end];
            
            if (fundId) {
                // To filter properly inside the CTEs we would need a different approach or just filter the final result
                sql = `
                    WITH start_nav AS (
                        SELECT fund_id, nav FROM fund_navs WHERE date >= $1 AND fund_id = $3 ORDER BY date ASC LIMIT 1
                    ),
                    end_nav AS (
                        SELECT fund_id, nav FROM fund_navs WHERE date <= $2 AND fund_id = $3 ORDER BY date DESC LIMIT 1
                    )
                    SELECT f.id, f.name, sn.nav as start_nav, en.nav as end_nav, 
                           ((en.nav - sn.nav) / sn.nav) * 100 as period_return_pct
                    FROM funds f
                    JOIN start_nav sn ON f.id = sn.fund_id
                    JOIN end_nav en ON f.id = en.fund_id
                    WHERE f.id = $3
                `;
                params.push(fundId);
            } else {
                 sql = `
                    WITH start_nav AS (
                        SELECT fund_id, nav,
                               ROW_NUMBER() OVER(PARTITION BY fund_id ORDER BY date ASC) as rn
                        FROM fund_navs WHERE date >= $1
                    ),
                    end_nav AS (
                        SELECT fund_id, nav,
                               ROW_NUMBER() OVER(PARTITION BY fund_id ORDER BY date DESC) as rn
                        FROM fund_navs WHERE date <= $2
                    )
                    SELECT f.id, f.name, sn.nav as start_nav, en.nav as end_nav, 
                           ((en.nav - sn.nav) / sn.nav) * 100 as period_return_pct
                    FROM funds f
                    JOIN start_nav sn ON f.id = sn.fund_id AND sn.rn = 1
                    JOIN end_nav en ON f.id = en.fund_id AND en.rn = 1
                `;
            }

            const res = await query(sql, params);
            return res.rows;
        }

        if (returnType === 'realised') {
            let sql = `
                WITH latest_nav AS (
                    SELECT fund_id, nav as current_nav,
                           ROW_NUMBER() OVER(PARTITION BY fund_id ORDER BY date DESC) as rn
                    FROM fund_navs
                )
                SELECT h.fund_id, h.fund_name, h.units, h.purchase_date, h.purchase_nav,
                       ln.current_nav,
                       (h.units * h.purchase_nav) as invested_value,
                       (h.units * ln.current_nav) as current_value,
                       (h.units * ln.current_nav) - (h.units * h.purchase_nav) as absolute_return,
                       ((ln.current_nav - h.purchase_nav) / h.purchase_nav) * 100 as realised_return_pct
                FROM holdings h
                JOIN latest_nav ln ON h.fund_id = ln.fund_id AND ln.rn = 1
            `;
            const params: any[] = [];

            if (fundId) {
                sql += ` WHERE h.fund_id = $1`;
                params.push(fundId);
            }

            const res = await query(sql, params);

            if (target === 'portfolio') {
                let total_invested = 0;
                let total_current = 0;
                for (const row of res.rows) {
                    total_invested += Number(row.invested_value);
                    total_current += Number(row.current_value);
                }
                return {
                    portfolio_invested_value: total_invested,
                    portfolio_current_value: total_current,
                    portfolio_absolute_return: total_current - total_invested,
                    portfolio_return_pct: ((total_current - total_invested) / total_invested) * 100,
                    holdings: res.rows
                };
            }

            return res.rows;
        }

        return { error: 'Invalid parameters.' };
    }
});
