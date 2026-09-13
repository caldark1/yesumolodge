const fetch = globalThis.fetch;

async function run() {
  try {
    console.log('Creating booking...');
    const bookingRes = await fetch('http://localhost:3000/api/bookings', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        category: 'standard',
        guestName: 'Test User',
        guestEmail: 'test@example.com',
        guestPhone: '+1234567890',
        checkIn: '2026-10-01',
        checkOut: '2026-10-02',
        userId: null,
        isGuest: true,
        source: 'test',
        quantity: 2
      }),
    });
    const bookingData = await bookingRes.json();
    console.log('Bookings create response:', JSON.stringify(bookingData, null, 2));

    let bookingCode = null;
    if (Array.isArray(bookingData.bookings) && bookingData.bookings.length > 0) {
      bookingCode = bookingData.bookings[0].booking.groupBookingId || bookingData.bookings[0].booking.bookingId;
    } else if (bookingData.booking) {
      bookingCode = bookingData.booking.groupBookingId || bookingData.booking.bookingId;
    }

    if (!bookingCode) {
      console.error('Could not determine booking code from response');
      process.exit(2);
    }

    console.log('Booking code:', bookingCode);

    console.log('Initializing payment...');
    const initRes = await fetch('http://localhost:3000/api/payments/initialize', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ bookingCode }),
    });
    const initData = await initRes.json();
    console.log('Initialize response:', JSON.stringify(initData, null, 2));

    const reference = initData.reference || initData.data?.reference;
    if (!reference) {
      console.error('No reference returned from initialize');
      process.exit(3);
    }
    console.log('Reference:', reference);

    console.log('Simulating Paystack webhook (charge.success)...');
    const webhookRes = await fetch('http://localhost:3000/api/payments/verify', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ event: 'charge.success', data: { status: 'success', reference } }),
    });
    const webhookData = await webhookRes.text();
    console.log('Webhook response:', webhookData);

    console.log('Calling GET verify to confirm status...');
    const verifyRes = await fetch(`http://localhost:3000/api/payments/verify?reference=${encodeURIComponent(bookingCode)}`);
    const verifyData = await verifyRes.json();
    console.log('Verify GET response:', JSON.stringify(verifyData, null, 2));

    console.log('Smoke test completed.');
  } catch (err) {
    console.error('Smoke test error:', err);
    process.exit(1);
  }
}

run();
