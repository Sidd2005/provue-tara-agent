const fs = require('fs');
const path = require('path');

const sampleDir = path.join(__dirname, '../data/sample_a');
fs.mkdirSync(sampleDir, { recursive: true });

const transactions = [
    { id: "t1", date: "2024-01-15", merchant: "Swiggy", category: "food", amount: 450, currency: "INR", memo: "UPI/571548185986/SWIGGY/swiggy@ybl" },
    { id: "t2", date: "2024-01-18", merchant: "Zepto", category: "groceries", amount: 800, currency: "INR", memo: "Zepto groceries" },
    { id: "t3", date: "2024-02-10", merchant: "SWIGGY*ORDER", category: "food", amount: 600, currency: "INR", memo: "Food delivery" },
    { id: "t4", date: "2024-02-12", merchant: "Self Transfer", category: "transfer", amount: 10000, currency: "INR", memo: "NEFT to self" },
    { id: "t5", date: "2024-03-05", merchant: "Apollo Pharmacy", category: "health", amount: 1200, currency: "INR", memo: "Meds" },
    { id: "t6", date: "2024-03-08", merchant: "Swiggy Instamart", category: "groceries", amount: 500, currency: "INR", memo: "Instamart" },
    { id: "t7", date: "2024-03-15", merchant: "Zepto", category: "groceries", amount: -800, currency: "INR", memo: "Refund Zepto" },
    { id: "t8", date: "2025-03-01", merchant: "Netflix", category: "entertainment", amount: 649, currency: "INR", memo: "Subscription" },
    { id: "t9", date: "2025-03-02", merchant: "Rent", category: "housing", amount: 25000, currency: "INR", memo: "March Rent" },
    { id: "t10", date: "2025-03-10", merchant: "Unknown Cafe", category: "uncategorized", amount: 350, currency: "INR", memo: "Cafe POS" }
];

fs.writeFileSync(path.join(sampleDir, 'transactions.json'), JSON.stringify(transactions, null, 2));

const funds = [
    {
        id: "f1",
        name: "Saffron Bluechip Equity Fund",
        category: "Equity",
        nav_points: Array.from({ length: 24 }).map((_, i) => {
            const year = 2023 + Math.floor((i + 3) / 12);
            const month = ((i + 3) % 12) + 1;
            return { date: `${year}-${month.toString().padStart(2, '0')}-01`, nav: 100 + i * 2 };
        })
    },
    {
        id: "f2",
        name: "Sentinel Nifty Index Fund",
        category: "Index",
        nav_points: Array.from({ length: 24 }).map((_, i) => {
            const year = 2023 + Math.floor((i + 3) / 12);
            const month = ((i + 3) % 12) + 1;
            return { date: `${year}-${month.toString().padStart(2, '0')}-01`, nav: 50 + i * 1.5 };
        })
    }
];

fs.writeFileSync(path.join(sampleDir, 'funds.json'), JSON.stringify(funds, null, 2));

const holdings = [
    { fund_id: "f1", fund_name: "Saffron Bluechip Equity Fund", units: 150, purchase_date: "2024-01-01", purchase_nav: 118 },
    { fund_id: "f2", fund_name: "Sentinel Nifty Index Fund", units: 500, purchase_date: "2024-06-01", purchase_nav: 71 }
];

fs.writeFileSync(path.join(sampleDir, 'holdings.json'), JSON.stringify(holdings, null, 2));

console.log("Mock data generated.");
