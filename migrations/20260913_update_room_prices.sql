-- Migration: Update room prices for future bookings
-- Deluxe -> 350, Standard -> 300

BEGIN;

UPDATE rooms SET price = 350 WHERE category = 'deluxe';
UPDATE rooms SET price = 300 WHERE category = 'standard';

COMMIT;

-- Note: This updates the `rooms.price` used when creating new bookings.
-- Existing rows in the `bookings` table are not modified.
