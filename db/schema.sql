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
