export default async function handler(req, res) {
  if (req.method !== "POST") {
    return res.status(405).json({ error: "Method not allowed" });
  }

  try {
    const { order_id } = req.body || {};

    if (!order_id) {
      return res.status(400).json({ error: "Missing order_id" });
    }

    const response = await fetch(`https://sandbox.cashfree.com/pg/orders/${order_id}`, {
      method: "GET",
      headers: {
        "Content-Type": "application/json",
        "x-client-id": process.env.CASHFREE_APP_ID,
        "x-client-secret": process.env.CASHFREE_SECRET_KEY,
        "x-api-version": "2023-08-01"
      }
    });

    const data = await response.json();

    if (!response.ok) {
      return res.status(response.status).json(data);
    }

    return res.status(200).json({
      order_id: data.order_id,
      order_status: data.order_status,
      paid: data.order_status === "PAID"
    });

  } catch (error) {
    return res.status(500).json({ error: error.message });
  }
}
