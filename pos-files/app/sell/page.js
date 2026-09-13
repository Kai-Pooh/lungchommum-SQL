"use client";

import { useEffect, useState } from "react";
import { supabase } from "../../lib/supabaseClient";

export default function SellPage() {
  const [products, setProducts] = useState([]);
  const [selectedId, setSelectedId] = useState("");
  const [quantity, setQuantity] = useState(1);
  const [message, setMessage] = useState(null); // { type: 'success' | 'error', text }
  const [submitting, setSubmitting] = useState(false);

  useEffect(() => {
    fetchProducts();
  }, []);

  async function fetchProducts() {
    const { data, error } = await supabase
      .from("products")
      .select("*")
      .order("name", { ascending: true });

    if (!error) {
      setProducts(data);
      if (data.length > 0) setSelectedId(data[0].id);
    }
  }

  const selectedProduct = products.find((p) => p.id === selectedId);
  const total = selectedProduct ? selectedProduct.price * Number(quantity || 0) : 0;

  async function handleSell() {
    setMessage(null);

    if (!selectedProduct) {
      setMessage({ type: "error", text: "กรุณาเลือกสินค้าก่อน" });
      return;
    }
    const qty = Number(quantity);
    if (!qty || qty <= 0) {
      setMessage({ type: "error", text: "กรุณากรอกจำนวนให้ถูกต้อง" });
      return;
    }
    if (qty > selectedProduct.stock) {
      setMessage({ type: "error", text: `สต๊อกไม่พอ (คงเหลือ ${selectedProduct.stock} ${selectedProduct.unit})` });
      return;
    }

    setSubmitting(true);

    // 1) บันทึกรายการขายลงตาราง sales
    const { error: saleError } = await supabase.from("sales").insert([
      {
        product_id: selectedProduct.id,
        product_name: selectedProduct.name,
        quantity: qty,
        total_price: total,
      },
    ]);

    if (saleError) {
      setMessage({ type: "error", text: "บันทึกการขายไม่สำเร็จ: " + saleError.message });
      setSubmitting(false);
      return;
    }

    // 2) อัปเดต stock ให้ลดลง
    const { error: stockError } = await supabase
      .from("products")
      .update({ stock: selectedProduct.stock - qty })
      .eq("id", selectedProduct.id);

    if (stockError) {
      setMessage({ type: "error", text: "ขายสำเร็จ แต่ตัดสต๊อกไม่สำเร็จ: " + stockError.message });
      setSubmitting(false);
      return;
    }

    setMessage({ type: "success", text: `ขาย ${selectedProduct.name} x${qty} สำเร็จ 🎉` });
    setQuantity(1);
    setSubmitting(false);
    fetchProducts();
  }

  return (
    <div>
      <h1>ขายสินค้า</h1>

      {message && (
        <div className={message.type === "success" ? "msg-success" : "msg-error"}>
          {message.text}
        </div>
      )}

      <div className="card">
        <div className="form-row">
          <select value={selectedId} onChange={(e) => setSelectedId(e.target.value)}>
            {products.map((p) => (
              <option key={p.id} value={p.id}>
                {p.name} — ฿{Number(p.price).toLocaleString("th-TH")} (คงเหลือ {p.stock})
              </option>
            ))}
          </select>
          <input
            type="number"
            min="1"
            value={quantity}
            onChange={(e) => setQuantity(e.target.value)}
            style={{ maxWidth: 100 }}
          />
        </div>

        <p>ยอดรวม</p>
        <p className="total-display">฿{total.toLocaleString("th-TH")}</p>

        <button className="btn-primary" onClick={handleSell} disabled={submitting}>
          {submitting ? "กำลังบันทึก..." : "ขาย"}
        </button>
      </div>
    </div>
  );
}
