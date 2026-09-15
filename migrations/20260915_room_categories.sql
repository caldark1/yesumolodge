BEGIN;

CREATE TABLE IF NOT EXISTS room_categories (
  id SERIAL PRIMARY KEY,
  category room_category NOT NULL UNIQUE,
  name TEXT NOT NULL,
  price INTEGER NOT NULL,
  description TEXT NOT NULL,
  policy TEXT NOT NULL,
  amenities TEXT[] NOT NULL DEFAULT ARRAY[]::TEXT[],
  images TEXT[] NOT NULL DEFAULT ARRAY[]::TEXT[],
  badge TEXT NOT NULL,
  accent TEXT NOT NULL,
  created_at TIMESTAMP NOT NULL DEFAULT NOW(),
  updated_at TIMESTAMP NOT NULL DEFAULT NOW()
);

INSERT INTO room_categories (category, name, price, description, policy, amenities, images, badge, accent)
VALUES
  (
    'queen',
    'Queen Suite',
    450,
    'A refined premium suite with a spacious queen-size bed, elevated finishes, and a calming luxury feel for longer stays.',
    'Check-in from 2:00 PM. Check-out by 12:00 PM. Complimentary breakfast can be added on request. Cancellation within 48 hours is subject to a one-night fee.',
    ARRAY['Queen Bed','Air Conditioning','TV','Fridge','Free WiFi','Hot Water','Workspace'],
    ARRAY[
      'https://images.unsplash.com/photo-1505693416388-ac5ce068fe85?auto=format&fit=crop&w=1200&q=80',
      'https://images.unsplash.com/photo-1524758631624-e2822e304c36?auto=format&fit=crop&w=1200&q=80',
      'https://images.unsplash.com/photo-1566665797739-1674de7a421a?auto=format&fit=crop&w=1200&q=80'
    ],
    'Luxury stay',
    'from-primary-dark via-primary to-charcoal'
  ),
  (
    'deluxe',
    'Deluxe Room',
    350,
    'Our signature deluxe room pairs generous space with a warm, modern aesthetic designed for rest, work, and easy comfort.',
    'Flexible check-in from 2:00 PM. Late check-out is subject to availability. Children under 12 stay free when sharing a bed with parents.',
    ARRAY['Double Bed','Air Conditioning','TV','Fridge','Free WiFi','Hot Water','Room Service'],
    ARRAY[
      'https://images.unsplash.com/photo-1566665797739-1674de7a421a?auto=format&fit=crop&w=1200&q=80',
      'https://images.unsplash.com/photo-1551882547-ff40c63fe5fa?auto=format&fit=crop&w=1200&q=80',
      'https://images.unsplash.com/photo-1494526585095-c41746248156?auto=format&fit=crop&w=1200&q=80'
    ],
    'Most booked',
    'from-primary via-primary-light to-primary-dark'
  ),
  (
    'standard',
    'Standard Room',
    300,
    'A welcoming and practical option with all the essentials for a comfortable and restful stay at a great value.',
    'Standard check-in from 2:00 PM and check-out by 12:00 PM. Valid ID is required at arrival. Early check-in is subject to room availability.',
    ARRAY['Single Bed','Air Conditioning','TV','Fridge','Free WiFi','Hot Water'],
    ARRAY[
      'https://images.unsplash.com/photo-1522708323590-d24dbb6b0267?auto=format&fit=crop&w=1200&q=80',
      'https://images.unsplash.com/photo-1445019980597-93fa8acb246c?auto=format&fit=crop&w=1200&q=80',
      'https://images.unsplash.com/photo-1505693416388-ac5ce068fe85?auto=format&fit=crop&w=1200&q=80'
    ],
    'Great value',
    'from-primary-light via-amber-200 to-primary'
  )
ON CONFLICT (category) DO UPDATE SET
  name = EXCLUDED.name,
  price = EXCLUDED.price,
  description = EXCLUDED.description,
  policy = EXCLUDED.policy,
  amenities = EXCLUDED.amenities,
  images = EXCLUDED.images,
  badge = EXCLUDED.badge,
  accent = EXCLUDED.accent,
  updated_at = NOW();

COMMIT;
