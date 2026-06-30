export default async function handler(req, res) {
  res.setHeader("Access-Control-Allow-Origin", "https://thecreatorsvault.in");
  res.setHeader("Access-Control-Allow-Methods", "POST, OPTIONS");
  res.setHeader("Access-Control-Allow-Headers", "Content-Type");

  if (req.method === "OPTIONS") {
    return res.status(200).end();
  }

  if (req.method !== "POST") {
    return res.status(405).json({ success: false, error: "Method not allowed" });
  }

  try {
    const { uid, email, name, phone } = req.body || {};

    if (!uid || !email) {
      return res.status(400).json({
        success: false,
        error: "Missing uid or email"
      });
    }

    if (!process.env.CASHFREE_APP_ID || !process.env.CASHFREE_SECRET_KEY) {
      return res.status(500).json({
        success: false,
        error: "Cashfree environment variables missing"
      });
    }

    const orderId = `TCV_${Date.now()}_${Math.floor(Math.random() * 100000)}`;

    const payload = {
      order_id: orderId,
      order_amount: 1.00,
      order_currency: "INR",
      customer_details: {
        customer_id: String(uid),
        customer_email: String(email),
        customer_phone: String(phone || "9999999999").replace(/\D/g, "").slice(-10),
        customer_name: String(name || "The Creators Vault User").slice(0, 50)
      },
      order_meta: {
        return_url: `https://thecreatorsvault.in/success.html?order_id=${orderId}`
      },
      order_note: "The Creators Vault Lifetime Premium Access"
    };

    const response = await fetch("https://api.cashfree.com/pg/orders", {
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

    if (!response.ok || !data.payment_session_id) {
      console.error("Cashfree Create Order Failed:", data);
      return res.status(response.status || 500).json({
        success: false,
        error: data.message || data.error_description || "Cashfree order creation failed",
        cashfree: data
      });
    }

    return res.status(200).json({
      success: true,
      order_id: data.order_id,
      payment_session_id: data.payment_session_id
    });

  } catch (error) {
    console.error("Create Order Server Error:", error);
    return res.status(500).json({
      success: false,
      error: error.message || "Server error"
    });
  }
}
