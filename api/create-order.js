// api/create-order.js

export default async function handler(req, res) {
  const allowedOrigins = [
    "https://thecreatorsvault.in",
    "https://www.thecreatorsvault.in"
  ];

  const origin = req.headers.origin;
  if (allowedOrigins.includes(origin)) {
    res.setHeader("Access-Control-Allow-Origin", origin);
  }

  res.setHeader("Access-Control-Allow-Methods", "POST, OPTIONS");
  res.setHeader("Access-Control-Allow-Headers", "Content-Type");

  if (req.method === "OPTIONS") {
    return res.status(200).end();
  }

  if (req.method !== "POST") {
    return res.status(405).json({
      success: false,
      error: "Method not allowed"
    });
  }

  try {
    const { uid, email, name, phone } = req.body || {};

    if (!uid || !email) {
      return res.status(400).json({
        success: false,
        error: "Missing uid or email"
      });
    }

    const appId = (process.env.CASHFREE_APP_ID || "").trim();
    const secretKey = (process.env.CASHFREE_SECRET_KEY || "").trim();

    if (!appId || !secretKey) {
      return res.status(500).json({
        success: false,
        error: "Cashfree environment variables missing"
      });
    }

    const cleanPhone = String(phone || "9999999999")
      .replace(/\D/g, "")
      .slice(-10);

    const orderId = `TCV_${Date.now()}_${Math.floor(Math.random() * 100000)}`;

    const payload = {
      order_id: orderId,
      order_amount: 99,
      order_currency: "INR",
      customer_details: {
        customer_id: String(uid).slice(0, 50),
        customer_email: String(email),
        customer_phone: cleanPhone || "9999999999",
        customer_name: String(name || "The Creators Vault User").slice(0, 50)
      },
      order_meta: {
        return_url: `https://thecreatorsvault.in/success.html?order_id=${orderId}`
      },
      order_note: "The Creators Vault Lifetime Premium Access"
    };

    const cashfreeResponse = await fetch("https://api.cashfree.com/pg/orders", {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        "x-api-version": "2023-08-01",
        "x-client-id": appId,
        "x-client-secret": secretKey
      },
      body: JSON.stringify(payload)
    });

    const cashfreeData = await cashfreeResponse.json();

    if (!cashfreeResponse.ok) {
      console.error("Cashfree Create Order Failed:", cashfreeData);

      return res.status(cashfreeResponse.status).json({
        success: false,
        error:
          cashfreeData.message ||
          cashfreeData.error_description ||
          "Cashfree order creation failed",
        cashfree: cashfreeData
      });
    }

    if (!cashfreeData.payment_session_id) {
      return res.status(500).json({
        success: false,
        error: "Payment session ID missing from Cashfree response",
        cashfree: cashfreeData
      });
    }

    return res.status(200).json({
      success: true,
      order_id: cashfreeData.order_id,
      payment_session_id: cashfreeData.payment_session_id
    });
  } catch (error) {
    console.error("Create Order Server Error:", error);

    return res.status(500).json({
      success: false,
      error: error.message || "Server error"
    });
  }
}
