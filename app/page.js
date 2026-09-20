"use client";

import { useEffect, useState } from "react";
import { supabase } from "../lib/supabaseClient";

export default function ProductsPage() {
  const [products, setProducts] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");

  // ฟอร์มเพิ่มสินค้าใหม่
  const [newProduct, setNewProduct] = useState({
    sku: "", name: "", price: "", stock: "", unit: "ตัว",
  });

  // แถวที่กำลังแก้ไข (inline edit)
  const [editingId, setEditingId] = useState(null);
  const [editRow, setEditRow] = useState({});

  useEffect(() => {
    fetchProducts();
  }, []);

  async function fetchProducts() {
    setLoading(true);
    const { data, error } = await supabase
      .from("products")
      .select("*")
      .order("created_at", { ascending: true });

    if (error) setError(error.message);
    else setProducts(data);
    setLoading(false);
  }

  async function handleAddProduct(e) {
    e.preventDefault();
    setError("");

    const { sku, name, price, stock, unit } = newProduct;
    if (!sku || !name || !price || stock === "") {
      setError("กรอกข้อมูลสินค้าให้ครบก่อนนะครับ");
      return;
    }

    const { error } = await supabase.from("products").insert([
      { sku, name, price: Number(price), stock: Number(stock), unit },
    ]);

    if (error) {
      setError("เพิ่มสินค้าไม่สำเร็จ: " + error.message);
      return;
    }

    setNewProduct({ sku: "", name: "", price: "", stock: "", unit: "ตัว" });
    fetchProducts();
  }

  function startEdit(product) {
    setEditingId(product.id);
    setEditRow({ ...product });
  }

  function cancelEdit() {
    setEditingId(null);
    setEditRow({});
  }

  async function saveEdit() {
    const { id, sku, name, price, stock, unit } = editRow;
    const { error } = await supabase
      .from("products")
      .update({ sku, name, price: Number(price), stock: Number(stock), unit })
      .eq("id", id);

    if (error) {
      setError("แก้ไขไม่สำเร็จ: " + error.message);
      return;
    }

    cancelEdit();
    fetchProducts();
  }

  async function handleDelete(id) {
    if (!confirm("ลบสินค้านี้ใช่ไหม?")) return;

    const { error } = await supabase.from("products").delete().eq("id", id);
    if (error) {
      setError("ลบไม่สำเร็จ: " + error.message);
      return;
    }
    fetchProducts();
  }

  return (
    <div>
      <h1>รายการสินค้า</h1>

      {error && <div className="msg-error">{error}</div>}

      {/* ฟอร์มเพิ่มสินค้าใหม่ */}
      <div className="card">
        <form onSubmit={handleAddProduct}>
          <div className="form-row">
            <input
              placeholder="SKU"
              value={newProduct.sku}
              onChange={(e) => setNewProduct({ ...newProduct, sku: e.target.value })}
            />
            <input
              placeholder="ชื่อสินค้า"
              value={newProduct.name}
              onChange={(e) => setNewProduct({ ...newProduct, name: e.target.value })}
            />
            <input
              placeholder="ราคา"
              type="number"
              value={newProduct.price}
              onChange={(e) => setNewProduct({ ...newProduct, price: e.target.value })}
            />
            <input
              placeholder="คงเหลือ"
              type="number"
              value={newProduct.stock}
              onChange={(e) => setNewProduct({ ...newProduct, stock: e.target.value })}
            />
            <input
              placeholder="หน่วย"
              value={newProduct.unit}
              onChange={(e) => setNewProduct({ ...newProduct, unit: e.target.value })}
            />
          </div>
          <button type="submit" className="btn-primary">+ เพิ่มสินค้า</button>
        </form>
      </div>

      {/* ตารางสินค้า */}
      <div className="card">
        {loading ? (
          <p>กำลังโหลด...</p>
        ) : (
          <table>
            <thead>
              <tr>
                <th>SKU</th>
                <th>ชื่อสินค้า</th>
                <th>ราคา</th>
                <th>คงเหลือ</th>
                <th>หน่วย</th>
                <th></th>
              </tr>
            </thead>
            <tbody>
              {products.map((p) =>
                editingId === p.id ? (
                  <tr key={p.id}>
                    <td><input value={editRow.sku} onChange={(e) => setEditRow({ ...editRow, sku: e.target.value })} /></td>
                    <td><input value={editRow.name} onChange={(e) => setEditRow({ ...editRow, name: e.target.value })} /></td>
                    <td><input type="number" value={editRow.price} onChange={(e) => setEditRow({ ...editRow, price: e.target.value })} /></td>
                    <td><input type="number" value={editRow.stock} onChange={(e) => setEditRow({ ...editRow, stock: e.target.value })} /></td>
                    <td><input value={editRow.unit} onChange={(e) => setEditRow({ ...editRow, unit: e.target.value })} /></td>
                    <td style={{ display: "flex", gap: 6 }}>
                      <button className="btn-primary" onClick={saveEdit}>บันทึก</button>
                      <button className="btn-secondary" onClick={cancelEdit}>ยกเลิก</button>
                    </td>
                  </tr>
                ) : (
                  <tr key={p.id}>
                    <td>{p.sku}</td>
                    <td>{p.name}</td>
                    <td>฿{Number(p.price).toLocaleString("th-TH")}</td>
                    <td>{p.stock}</td>
                    <td>{p.unit}</td>
                    <td style={{ display: "flex", gap: 6 }}>
                      <button className="btn-secondary" onClick={() => startEdit(p)}>แก้ไข</button>
                      <button className="btn-danger" onClick={() => handleDelete(p.id)}>ลบ</button>
                    </td>
                  </tr>
                )
