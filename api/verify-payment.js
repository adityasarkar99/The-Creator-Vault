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
    const { order_id } = req.body || {};

    if (!order_id) {
      return res.status(400).json({ success: false, error: "Missing order_id" });
    }

    const appId = process.env.CASHFREE_APP_ID;
    const secretKey = process.env.CASHFREE_SECRET_KEY;

    if (!appId || !secretKey) {
      return res.status(500).json({ success: false, error: "Cashfree keys missing in Vercel" });
    }

    const cfResponse = await fetch(
      `https://api.cashfree.com/pg/orders/${encodeURIComponent(order_id)}`,
      {
        method: "GET",
        headers: {
          "Content-Type": "application/json",
          "x-api-version": "2023-08-01",
          "x-client-id": appId.trim(),
          "x-client-secret": secretKey.trim()
        }
      }
    );

    const cfData = await cfResponse.json();

    if (!cfResponse.ok) {
      console.error("Cashfree verify error:", cfData);
      return res.status(cfResponse.status).json({
        success: false,
        error: cfData.message || cfData.error_description || "Cashfree verification failed",
        cashfree: cfData
      });
    }

    return res.status(200).json({
      success: true,
      order_id: cfData.order_id,
      order_status: cfData.order_status,
      paid: cfData.order_status === "PAID",
      cashfree: cfData
    });

  } catch (error) {
    console.error("Verify payment server error:", error);
    return res.status(500).json({
      success: false,
      error: error.message || "Server error"
    });
  }
}
