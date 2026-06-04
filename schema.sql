CREATE TABLE IF NOT EXISTS transactions (
    id TEXT PRIMARY KEY,
    date DATE NOT NULL,
    merchant TEXT NOT NULL,
    normalized_merchant TEXT NOT NULL,
    category TEXT NOT NULL,
    amount NUMERIC NOT NULL,
    currency TEXT NOT NULL,
    memo TEXT
);

CREATE INDEX IF NOT EXISTS idx_transactions_date ON transactions(date);
CREATE INDEX IF NOT EXISTS idx_transactions_normalized_merchant ON transactions(normalized_merchant);
CREATE INDEX IF NOT EXISTS idx_transactions_category ON transactions(category);

CREATE TABLE IF NOT EXISTS funds (
    id TEXT PRIMARY KEY,
    name TEXT NOT NULL,
    category TEXT NOT NULL
);

CREATE TABLE IF NOT EXISTS fund_navs (
    fund_id TEXT NOT NULL REFERENCES funds(id),
    date DATE NOT NULL,
    nav NUMERIC NOT NULL,
    PRIMARY KEY (fund_id, date)
);

CREATE INDEX IF NOT EXISTS idx_fund_navs_date ON fund_navs(date);

CREATE TABLE IF NOT EXISTS holdings (
    id SERIAL PRIMARY KEY,
    fund_id TEXT NOT NULL REFERENCES funds(id),
    fund_name TEXT NOT NULL,
    units NUMERIC NOT NULL,
    purchase_date DATE NOT NULL,
    purchase_nav NUMERIC NOT NULL
);
