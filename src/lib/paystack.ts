const PAYSTACK_SECRET_KEY = process.env.PAYSTACK_SECRET_KEY;
const PAYSTACK_BASE_URL = "https://api.paystack.co";

export interface PaystackInitializeResponse {
  status: boolean;
  message: string;
  data: {
    authorization_url: string;
    access_code: string;
    reference: string;
  };
}

export interface PaystackVerifyResponse {
  status: boolean;
  message: string;
  data: {
    status: string;
    reference: string;
    amount: number;
    currency: string;
    metadata?: Record<string, unknown>;
    customer: {
      email: string;
      first_name?: string;
      last_name?: string;
    };
  };
}

/**
 * Initialize a Paystack transaction from the backend
 */
export async function initializeTransaction(
  email: string,
  amountInCedis: number,
  reference: string,
  metadata?: Record<string, unknown>
): Promise<PaystackInitializeResponse> {
  // Paystack expects amount in kobo (lowest denomination) for GHS it's pesewas (100 pesewas = 1 GHS)
  const amountInPesewas = amountInCedis * 100;

  const response = await fetch(`${PAYSTACK_BASE_URL}/transaction/initialize`, {
    method: "POST",
    headers: {
      Authorization: `Bearer ${PAYSTACK_SECRET_KEY}`,
      "Content-Type": "application/json",
    },
    body: JSON.stringify({
      email,
      amount: amountInPesewas,
      reference,
      currency: "GHS",
      metadata: metadata || {},
      // Include the reference in the callback URL so Paystack redirects back
      // with the canonical transaction reference and the app can verify it automatically.
      callback_url: `${process.env.NEXT_APP_URL}/booking/confirmation?reference=${encodeURIComponent(reference)}`,
    }),
  });

  if (!response.ok) {
    const error = await response.json();
    throw new Error(error.message || "Failed to initialize transaction");
  }

  return response.json();
}

/**
 * Verify a Paystack transaction
 */
export async function verifyTransaction(
  reference: string
): Promise<PaystackVerifyResponse> {
  const response = await fetch(
    `${PAYSTACK_BASE_URL}/transaction/verify/${encodeURIComponent(reference)}`,
    {
      method: "GET",
      headers: {
        Authorization: `Bearer ${PAYSTACK_SECRET_KEY}`,
        "Content-Type": "application/json",
      },
    }
  );

  if (!response.ok) {
    const error = await response.json();
    throw new Error(error.message || "Failed to verify transaction");
  }

  return response.json();
}
