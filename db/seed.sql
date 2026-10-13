-- PlanEase Seed Data
-- Designed for students with realistic academic deadlines

INSERT INTO item (title, type, deadline, status, created_at) VALUES
('Database Systems Midterm Exam', 'exam', date('now', '+3 days'), 'pending', datetime('now', '-5 days')),
('Operating Systems Project Phase 1', 'assignment', date('now', '+5 days'), 'pending', datetime('now', '-4 days')),
('Review Relational Algebra and SQL queries', 'task', date('now', '+1 day'), 'pending', datetime('now', '-2 days')),
('Submit Linear Algebra Problem Set 3', 'assignment', date('now', '-2 days'), 'pending', datetime('now', '-7 days')),
('Install SQLite and set up development environment', 'task', date('now', '-1 day'), 'completed', datetime('now', '-3 days')),
('Distributed Systems Final Exam', 'exam', date('now', '+14 days'), 'pending', datetime('now', '-1 day')),
('Read Database System Concepts: Chapter 4 Normalization', 'task', NULL, 'pending', datetime('now', '-1 day')),
('Algorithms Problem Set 2 Submission', 'assignment', date('now', '-3 days'), 'completed', datetime('now', '-8 days'));
