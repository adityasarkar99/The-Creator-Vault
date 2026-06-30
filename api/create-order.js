export default async function handler(req, res) {
  if (req.method !== "POST") {
    return res.status(405).json({ error: "Method not allowed" });
  }

  try {
    const { uid, email, name, phone } = req.body || {};

    if (!uid || !email) {
      return res.status(400).json({ error: "Missing uid or email" });
    }

    const orderId = `TCV_${uid.slice(0, 8)}_${Date.now()}`;

    const payload = {
      order_id: orderId,
      order_amount: 1,
      order_currency: "INR",
      customer_details: {
        customer_id: uid,
        customer_email: email,
        customer_phone: phone || "9999999999",
        customer_name: name || "The Creators Vault User"
      },
      order_meta: {
        return_url: `https://thecreatorsvault.in/success.html?order_id=${orderId}`
      },
      order_note: "The Creators Vault Premium Test Payment"
    };

    const response = await fetch("https://sandbox.cashfree.com/pg/orders", {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        "x-client-id": process.env.CASHFREE_APP_ID,
        "x-client-secret": process.env.CASHFREE_SECRET_KEY,
        "x-api-version": "2023-08-01"
      },
      body: JSON.stringify(payload)
    });

    const data = await response.json();

    if (!response.ok) {
      return res.status(response.status).json(data);
    }

    return res.status(200).json({
      order_id: data.order_id,
      payment_session_id: data.payment_session_id
    });

  } catch (error) {
    return res.status(500).json({ error: error.message });
  }
}
