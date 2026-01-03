-- Add location fields to reviews table
ALTER TABLE reviews ADD COLUMN street_address TEXT;
ALTER TABLE reviews ADD COLUMN location_name TEXT;
