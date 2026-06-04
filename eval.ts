import { tara } from './src/agent';

const tests = [
    { name: "Single lookup", q: "How much did I spend on food last month?" },
    { name: "Date filtering", q: "What was my total spending in Q1 2024?" },
    { name: "Refunds", q: "How much did I spend on Zepto in March 2024? Did any get refunded?" },
    { name: "Merchant aliases", q: "How much did I spend on Swiggy, including Swiggy Instamart and SWIGGY orders?" },
    { name: "Transfers", q: "Ignore transfers. What was my total actual spending in Q1 2024?" },
    { name: "Category comparison", q: "Compare my food and travel spending month by month. Which grew faster?" },
    { name: "Recurring subscriptions", q: "Which transactions look like recurring subscriptions?" },
    { name: "No-data case", q: "Do I have any data for rent in April 2025?" },
    { name: "Fund period return", q: "What was Saffron Bluechip Equity Fund's return from 2024-01-01 to 2025-01-01?" },
    { name: "Realised return", q: "What is my realised return on my Sentinel Nifty Index Fund holding, given when I bought it?" },
    { name: "Portfolio aggregate", q: "What is my portfolio worth today, and how much have I made on it in absolute INR?" },
    { name: "Mixed fund/holding", q: "Of the funds I own, which gave me the best realised return, and how does it compare to the same fund's period return over the same window?" }
];

async function runEvals() {
    let passed = 0;
    let failed = 0;
    
    console.log("Starting evaluations...\n");
    
    for (const test of tests) {
        console.log(`[TEST] ${test.name}`);
        console.log(`Q: ${test.q}`);
        try {
            const start = Date.now();
            const res = await tara.generate(test.q);
            const latency = Date.now() - start;
            console.log(`A: ${res.text}\n[Latency: ${latency}ms]`);
            passed++;
        } catch (e: any) {
            console.error(`[FAIL] ${e.message}`);
            failed++;
        }
        console.log("--------------------------------------------------\n");
    }
    
    console.log(`EVALUATION COMPLETE: ${passed} Passed, ${failed} Failed.`);
    process.exit(passed === tests.length ? 0 : 1);
}

runEvals();
