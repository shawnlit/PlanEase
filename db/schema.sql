-- PlanEase Database Schema
-- Table: item

CREATE TABLE IF NOT EXISTS item (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    title TEXT NOT NULL CHECK (length(trim(title)) > 0),
    type TEXT NOT NULL CHECK (type IN ('exam', 'assignment', 'task')),
    deadline TEXT, -- ISO format string (YYYY-MM-DD or YYYY-MM-DDTHH:MM:SS)
    status TEXT NOT NULL DEFAULT 'pending' CHECK (status IN ('pending', 'completed')),
    created_at TEXT NOT NULL DEFAULT (datetime('now'))
);

-- Index on deadline for efficient sorting and calendar/view queries
CREATE INDEX IF NOT EXISTS idx_item_deadline ON item(deadline);

-- Index on status for filtering
CREATE INDEX IF NOT EXISTS idx_item_status ON item(status);

-- Table: llm_log (Audit log for transmitted AI requests)
CREATE TABLE IF NOT EXISTS llm_log (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    user_text TEXT NOT NULL,
    reference_date TEXT NOT NULL,
    provider TEXT NOT NULL DEFAULT 'groq',
    model TEXT NOT NULL,
    status TEXT NOT NULL CHECK (status IN ('success', 'error')),
    tokens_used INTEGER,
    error_message TEXT,
    created_at TEXT NOT NULL DEFAULT (datetime('now'))
);

CREATE INDEX IF NOT EXISTS idx_llm_log_created ON llm_log(created_at);

-- Table: ai_usage (Persistent usage tracking for hard limits)
CREATE TABLE IF NOT EXISTS ai_usage (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    request_date TEXT NOT NULL, -- YYYY-MM-DD in Asia/Kolkata
    minute_timestamp INTEGER NOT NULL, -- Unix timestamp in minutes
    created_at TEXT NOT NULL DEFAULT (datetime('now'))
);

CREATE INDEX IF NOT EXISTS idx_ai_usage_date ON ai_usage(request_date);
CREATE INDEX IF NOT EXISTS idx_ai_usage_minute ON ai_usage(minute_timestamp);
