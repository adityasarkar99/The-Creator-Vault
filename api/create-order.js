const allowedOrigins = [
  "https://thecreatorsvault.in",
  "https://www.thecreatorsvault.in"
];

export default async function handler(req, res) {
  const origin = req.headers.origin;

  if (allowedOrigins.includes(origin)) {
    res.setHeader("Access-Control-Allow-Origin", origin);
  }

  res.setHeader("Access-Control-Allow-Methods", "POST, OPTIONS");
  res.setHeader("Access-Control-Allow-Headers", "Content-Type");

  if (req.method === "OPTIONS") return res.status(200).end();

  if (req.method !== "POST") {
    return res.status(405).json({ success: false, error: "Method not allowed" });
  }

  try {
    const { uid, email, name, phone } = req.body || {};

    if (!uid || !email) {
      return res.status(400).json({ success: false, error: "Missing uid or email" });
    }

    const appId = process.env.CASHFREE_APP_ID;
    const secretKey = process.env.CASHFREE_SECRET_KEY;

    if (!appId || !secretKey) {
      return res.status(500).json({ success: false, error: "Cashfree keys missing in Vercel" });
    }

    const orderId = `TCV_${Date.now()}_${Math.floor(Math.random() * 100000)}`;
    const cleanPhone = String(phone || "9999999999").replace(/\D/g, "").slice(-10);

    const payload = {
      order_id: orderId,
      order_amount: 1,
      order_currency: "INR",
      customer_details: {
        customer_id: String(uid),
        customer_email: String(email),
        customer_phone: cleanPhone || "9999999999",
        customer_name: String(name || "The Creators Vault User").slice(0, 50)
      },
      order_meta: {
        return_url: `https://thecreatorsvault.in/success.html?order_id=${orderId}`
      },
      order_note: "The Creators Vault Lifetime Premium Access"
    };

    const cfResponse = await fetch("https://api.cashfree.com/pg/orders", {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        "x-api-version": "2023-08-01",
        "x-client-id": appId.trim(),
        "x-client-secret": secretKey.trim()
      },
      body: JSON.stringify(payload)
    });

    const cfData = await cfResponse.json();

    if (!cfResponse.ok || !cfData.payment_session_id) {
      console.error("Cashfree order error:", cfData);
      return res.status(cfResponse.status || 500).json({
        success: false,
        error: cfData.message || cfData.error_description || "Cashfree order creation failed",
        cashfree: cfData
      });
    }

    return res.status(200).json({
      success: true,
      order_id: cfData.order_id,
      payment_session_id: cfData.payment_session_id
    });

  } catch (error) {
    console.error("Create order server error:", error);
    return res.status(500).json({
      success: false,
      error: error.message || "Server error"
    });
  }
}
