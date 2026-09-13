"use client";

import { useEffect, useState } from "react";
import { supabase } from "../../lib/supabaseClient";

export default function HistoryPage() {
  const [sales, setSales] = useState([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    fetchSales();
  }, []);

  async function fetchSales() {
    setLoading(true);
    const { data, error } = await supabase
      .from("sales")
      .select("*")
      .order("sold_at", { ascending: false });

    if (!error) setSales(data);
    setLoading(false);
  }

  const totalRevenue = sales.reduce((sum, s) => sum + Number(s.total_price), 0);

  return (
    <div>
      <h1>ประวัติการขาย</h1>

      <div className="card">
        <p>ยอดขายรวมทั้งหมด</p>
        <p className="total-display">฿{totalRevenue.toLocaleString("th-TH")}</p>
      </div>

      <div className="card">
        {loading ? (
          <p>กำลังโหลด...</p>
        ) : sales.length === 0 ? (
          <p>ยังไม่มีประวัติการขาย</p>
        ) : (
          <table>
            <thead>
              <tr>
                <th>วันเวลา</th>
                <th>สินค้า</th>
                <th>จำนวน</th>
                <th>ยอดรวม</th>
              </tr>
            </thead>
            <tbody>
              {sales.map((s) => (
                <tr key={s.id}>
                  <td>{new Date(s.sold_at).toLocaleString("th-TH")}</td>
                  <td>{s.product_name}</td>
                  <td>{s.quantity}</td>
                  <td>฿{Number(s.total_price).toLocaleString("th-TH")}</td>
                </tr>
              ))}
            </tbody>
          </table>
        )}
      </div>
    </div>
  );
}
