-- PlanEase Database Views
-- Drop and recreate views safely to ensure idempotent execution

DROP VIEW IF EXISTS overdue_items;
CREATE VIEW overdue_items AS
SELECT
    id,
    title,
    type,
    deadline,
    status,
    created_at
FROM item
WHERE status = 'pending'
  AND deadline IS NOT NULL
  AND date(deadline) < date('now');

DROP VIEW IF EXISTS upcoming_items;
CREATE VIEW upcoming_items AS
SELECT
    id,
    title,
    type,
    deadline,
    status,
    created_at
FROM item
WHERE status = 'pending'
  AND deadline IS NOT NULL
  AND date(deadline) >= date('now');
