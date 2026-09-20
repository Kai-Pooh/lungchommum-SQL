"use client";

import { useEffect, useState } from "react";
import { supabase } from "../lib/supabaseClient";

// ตั้งเกณฑ์แจ้งเตือนสต๊อกใกล้หมด
const LOW_STOCK_THRESHOLD = 5;

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

  // ---------------------------------------------------------
  // 🔔 ส่งแจ้งเตือนเข้า Telegram ผ่าน API Route ของเราเอง
  // ทำงานแบบ async/try-catch แยกออกมา เพื่อไม่ให้ error ตรงนี้
  // ไปกระทบกับ flow การขายที่ทำสำเร็จไปแล้ว
  // ---------------------------------------------------------
  async function sendTelegramMessage(text) {
    try {
      const res = await fetch("/api/notify", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ text }),
      });
      const data = await res.json();
      if (!data.ok) {
        console.error("ส่งแจ้งเตือน Telegram ไม่สำเร็จ:", data.error);
      }
    } catch (err) {
      // ไม่ throw ต่อ เพราะไม่ต้องการให้กระทบระบบขาย
      console.error("เรียก /api/notify ไม่สำเร็จ:", err);
    }
  }

  function buildOrderAlertMessage(product, qty, totalPrice, newStock) {
    const timeStr = new Date().toLocaleString("th-TH", {
      dateStyle: "medium",
      timeStyle: "short",
    });

    return (
      `🛍️ <b>มีรายการขายใหม่!</b>\n` +
      `สินค้า: ${product.name}\n` +
      `จำนวน: ${qty} ${product.unit}\n` +
      `ราคารวม: ${totalPrice.toLocaleString("th-TH")} บาท\n` +
      `สต๊อกคงเหลือปัจจุบัน: ${newStock} ${product.unit}\n` +
      `เวลา: ${timeStr}`
    );
  }

  function buildLowStockAlertMessage(product, newStock) {
    return (
      `🚨 <b>[เตือนภัย] สต๊อกสินค้าใกล้หมด!</b>\n` +
      `สินค้า: ${product.name}\n` +
      `คงเหลือเพียง: ${newStock} ${product.unit}\n` +
      `⚠️ กรุณาเติมสต๊อกสินค้าด่วน!`
    );
  }

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
    const newStock = selectedProduct.stock - qty;
    const { error: stockError } = await supabase
      .from("products")
      .update({ stock: newStock })
      .eq("id", selectedProduct.id);

    if (stockError) {
      setMessage({ type: "error", text: "ขายสำเร็จ แต่ตัดสต๊อกไม่สำเร็จ: " + stockError.message });
      setSubmitting(false);
      return;
    }

    // 3) แจ้งเตือนขายสำเร็จให้ผู้ใช้เห็นในเว็บทันที (ไม่รอ Telegram)
    setMessage({ type: "success", text: `ขาย ${selectedProduct.name} x${qty} สำเร็จ 🎉` });
    setQuantity(1);
    setSubmitting(false);
    fetchProducts();

    // 4) 🔔 งานที่ 1: แจ้งเตือน Order เข้าไป Telegram (ไม่ await แบบบล็อก UI)
    sendTelegramMessage(buildOrderAlertMessage(selectedProduct, qty, total, newStock));

    // 5) 🔔 งานที่ 2: ถ้าสต๊อกเหลือน้อยกว่าหรือเท่ากับเกณฑ์ ยิงแจ้งเตือนเพิ่มอีก 1 ข้อความ
    if (newStock <= LOW_STOCK_THRESHOLD) {
      sendTelegramMessage(buildLowStockAlertMessage(selectedProduct, newStock));
    }
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
