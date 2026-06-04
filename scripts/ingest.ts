import fs from 'fs';
import path from 'path';
import { pool, query } from '../src/db';

const DATA_DIR = process.env.DATA_DIR || './data/sample_a';

function normalizeMerchant(raw: string): string {
    let m = raw.toUpperCase().trim();
    // Remove common noisy suffixes
    m = m.replace(/\*ORDER.*$/, '');
    m = m.replace(/ (MUMBAI|BANGALORE|DELHI|CHENNAI|PUNE|HYDERABAD)$/, '');
    
    // Hardcoded normalizations as an example of programmatic inference
    if (m.includes('SWIGGY') || m.includes('INSTAMART')) return 'SWIGGY';
    if (m.includes('ZOMATO')) return 'ZOMATO';
    if (m.includes('ZEPTO')) return 'ZEPTO';
    if (m.includes('BIGBASKET') || m.includes('BBDAILY')) return 'BIGBASKET';
    if (m.includes('UBER')) return 'UBER';
    if (m.includes('OLA')) return 'OLA';
    if (m.includes('AMAZON')) return 'AMAZON';
    if (m.includes('FLIPKART')) return 'FLIPKART';
    if (m.includes('APOLLO')) return 'APOLLO PHARMACY';

    return m;
}

async function ingest() {
    console.log(`Starting ingestion from ${DATA_DIR}...`);

    try {
        await query('BEGIN');
        
        // Clean existing data for idempotency
        await query('DELETE FROM holdings');
        await query('DELETE FROM fund_navs');
        await query('DELETE FROM funds');
        await query('DELETE FROM transactions');

        // Ingest Transactions
        const txPath = path.join(DATA_DIR, 'transactions.json');
        if (fs.existsSync(txPath)) {
            const txs = JSON.parse(fs.readFileSync(txPath, 'utf8'));
            console.log(`Ingesting ${txs.length} transactions...`);
            for (const t of txs) {
                const norm = normalizeMerchant(t.merchant);
                await query(
                    `INSERT INTO transactions (id, date, merchant, normalized_merchant, category, amount, currency, memo)
                     VALUES ($1, $2, $3, $4, $5, $6, $7, $8)`,
                    [t.id, t.date, t.merchant, norm, t.category, t.amount, t.currency, t.memo]
                );
            }
        }

        // Ingest Funds and NAVs
        const fundsPath = path.join(DATA_DIR, 'funds.json');
        if (fs.existsSync(fundsPath)) {
            const funds = JSON.parse(fs.readFileSync(fundsPath, 'utf8'));
            console.log(`Ingesting ${funds.length} funds...`);
            for (const f of funds) {
                await query(
                    `INSERT INTO funds (id, name, category) VALUES ($1, $2, $3)`,
                    [f.id, f.name, f.category]
                );
                
                if (f.nav && Array.isArray(f.nav)) {
                    for (const point of f.nav) {
                        await query(
                            `INSERT INTO fund_navs (fund_id, date, nav) VALUES ($1, $2, $3)
                             ON CONFLICT (fund_id, date) DO NOTHING`,
                            [f.id, point.date, point.value]
                        );
                    }
                }
            }
        }

        // Ingest Holdings
        const holdingsPath = path.join(DATA_DIR, 'holdings.json');
        if (fs.existsSync(holdingsPath)) {
            const holdings = JSON.parse(fs.readFileSync(holdingsPath, 'utf8'));
            console.log(`Ingesting ${holdings.length} holdings...`);
            for (const h of holdings) {
                await query(
                    `INSERT INTO holdings (fund_id, fund_name, units, purchase_date, purchase_nav)
                     VALUES ($1, $2, $3, $4, $5)`,
                    [h.fund_id, h.fund_name, h.units, h.purchase_date, h.purchase_nav]
                );
            }
        }

        await query('COMMIT');
        console.log('Ingestion completed successfully.');
    } catch (e) {
        await query('ROLLBACK');
        console.error('Ingestion failed:', e);
        process.exit(1);
    } finally {
        await pool.end();
    }
}

ingest();
