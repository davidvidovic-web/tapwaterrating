-- Add password and role columns to users table
ALTER TABLE users ADD COLUMN password TEXT;
ALTER TABLE users ADD COLUMN role TEXT DEFAULT 'user';