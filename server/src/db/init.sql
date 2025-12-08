-- Beers table
CREATE TABLE IF NOT EXISTS beers (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    name TEXT NOT NULL UNIQUE,
    base_price REAL NOT NULL,
    current_price REAL NOT NULL,
    category TEXT NOT NULL,
    volatility REAL NOT NULL
);

-- Transactions table
CREATE TABLE IF NOT EXISTS transactions (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    beer_id INTEGER NOT NULL,
    quantity INTEGER NOT NULL,
    unit_price REAL NOT NULL,
    total_price REAL NOT NULL,
    timestamp TEXT NOT NULL DEFAULT (datetime('now')),
    FOREIGN KEY (beer_id) REFERENCES beers(id)
);

-- Price history table
CREATE TABLE IF NOT EXISTS price_history (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    batch_id INTEGER NOT NULL,
    beer_id INTEGER NOT NULL,
    price REAL NOT NULL,
    timestamp TEXT NOT NULL DEFAULT (datetime('now')),
    FOREIGN KEY (beer_id) REFERENCES beers(id)
);

-- Batch counter table
CREATE TABLE IF NOT EXISTS batch_counter (
    id INTEGER PRIMARY KEY CHECK (id = 1),
    current_batch INTEGER NOT NULL DEFAULT 0
);

-- Initialize batch counter
INSERT OR IGNORE INTO batch_counter (id, current_batch) VALUES (1, 0);

-- Settings table
CREATE TABLE IF NOT EXISTS settings (
    key TEXT PRIMARY KEY,
    value REAL NOT NULL
);

-- Insert default settings
INSERT OR IGNORE INTO settings (key, value) VALUES
    ('base_move', 0.45),
    ('sector_correlation', 0.45),
    ('min_price', 0.50),
    ('max_price', 25.00);

-- Admins table (superadmin defined in env, admins stored here)
CREATE TABLE IF NOT EXISTS admins (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    email TEXT NOT NULL UNIQUE,
    name TEXT NOT NULL,
    added_at TEXT NOT NULL DEFAULT (datetime('now')),
    added_by TEXT NOT NULL
);

-- Insert default beers (prices in 0.25€ increments)
INSERT OR IGNORE INTO beers (name, base_price, current_price, category, volatility) VALUES
    -- Pils (low volatility)
    ('Jupiler', 2.50, 2.50, 'pils', 0.22),
    ('Stella Artois', 2.75, 2.75, 'pils', 0.23),
    ('Maes', 2.25, 2.25, 'pils', 0.25),
    -- Abbey (medium volatility)
    ('Leffe Blonde', 4.00, 4.00, 'abbey', 0.32),
    ('Grimbergen', 4.25, 4.25, 'abbey', 0.35),
    ('Affligem', 4.50, 4.50, 'abbey', 0.38),
    -- Trappist (high volatility)
    ('Chimay Rouge', 5.50, 5.50, 'trappist', 0.45),
    ('Orval', 6.00, 6.00, 'trappist', 0.50),
    ('Westmalle Tripel', 5.75, 5.75, 'trappist', 0.48),
    ('Rochefort 10', 7.00, 7.00, 'trappist', 0.55),
    -- Specialty (medium-high volatility)
    ('Duvel', 5.00, 5.00, 'specialty', 0.40),
    ('Delirium Tremens', 5.50, 5.50, 'specialty', 0.45),
    ('Kwak', 4.75, 4.75, 'specialty', 0.42),
    ('La Chouffe', 5.25, 5.25, 'specialty', 0.50);
