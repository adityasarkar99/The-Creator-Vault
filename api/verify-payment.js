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
    const { order_id } = req.body || {};

    if (!order_id) {
      return res.status(400).json({
        success: false,
        error: "Missing order_id"
      });
    }

    if (!process.env.CASHFREE_APP_ID || !process.env.CASHFREE_SECRET_KEY) {
      return res.status(500).json({
        success: false,
        error: "Cashfree environment variables missing"
      });
    }

    const response = await fetch(
      `https://api.cashfree.com/pg/orders/${encodeURIComponent(order_id)}`,
      {
        method: "GET",
        headers: {
          "Content-Type": "application/json",
          "x-client-id": process.env.CASHFREE_APP_ID,
          "x-client-secret": process.env.CASHFREE_SECRET_KEY,
          "x-api-version": "2023-08-01"
        }
      }
    );

    const data = await response.json();

    if (!response.ok) {
      console.error("Cashfree Verify Failed:", data);
      return res.status(response.status).json({
        success: false,
        error: data.message || data.error_description || "Cashfree verification failed",
        cashfree: data
      });
    }

    const isPaid = data.order_status === "PAID";

    return res.status(200).json({
      success: true,
      order_id: data.order_id,
      order_status: data.order_status,
      paid: isPaid,
      cashfree: data
    });

  } catch (error) {
    console.error("Verify Payment Server Error:", error);
    return res.status(500).json({
      success: false,
      error: error.message || "Server error"
    });
  }
}
