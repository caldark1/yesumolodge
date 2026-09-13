BEGIN;

-- Create extensions table to track stay extensions
CREATE TABLE IF NOT EXISTS extensions (
  id SERIAL PRIMARY KEY,
  booking_id INTEGER NOT NULL REFERENCES bookings(id) ON DELETE CASCADE,
  group_booking_id TEXT,
  old_check_out DATE NOT NULL,
  new_check_out DATE NOT NULL,
  extra_nights INTEGER NOT NULL,
  amount INTEGER NOT NULL,
  payment_status TEXT NOT NULL DEFAULT 'unpaid',
  note TEXT,
  created_by INTEGER REFERENCES users(id) ON DELETE SET NULL,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT now() NOT NULL,
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT now() NOT NULL
);

-- Add extension_id to payments, if not present
ALTER TABLE payments ADD COLUMN IF NOT EXISTS extension_id INTEGER REFERENCES extensions(id) ON DELETE SET NULL;

COMMIT;
