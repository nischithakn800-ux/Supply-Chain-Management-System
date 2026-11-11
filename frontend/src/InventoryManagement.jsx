import { useEffect, useState } from "react";
import axios from "axios";

const API = "http://localhost:8080/api";

export default function InventoryManagement({ products, onRefresh }) {
  const [records, setRecords] = useState([]);
  const [reorderLevels, setReorderLevels] = useState({});
  const [message, setMessage] = useState("");
  const [busyProductId, setBusyProductId] = useState(null);
  const [stockEdits, setStockEdits] = useState({});

  async function loadInventory() {
    try {
      const response = await axios.get(`${API}/inventory`);
      const list = Array.isArray(response.data) ? response.data : [];
      setRecords(list);
      setReorderLevels(Object.fromEntries(list.map((item) => [item.productId, item.reorderLevel])));
    } catch (error) {
      setMessage(error.response?.data?.message || "Could not load inventory. Check admin login and backend.");
    }
  }

  useEffect(() => { loadInventory(); }, []);

  async function saveInventory(product) {
    const reorderLevel = Number(reorderLevels[product.id] ?? 10);
    const stockQuantity = Number(stockEdits[product.id] ?? product.quantity);
    if (!Number.isInteger(reorderLevel) || reorderLevel < 0) {
      setMessage("Reorder level must be a whole number greater than or equal to zero.");
      return;
    }
    if (!Number.isInteger(stockQuantity) || stockQuantity < 0) {
      setMessage("Stock quantity must be a whole number greater than or equal to zero.");
      return;
    }

    setBusyProductId(product.id);
    setMessage("");
    const existing = records.find((item) => Number(item.productId) === Number(product.id));
    const payload = { productId: product.id, stockQuantity, reorderLevel };
    try {
      if (existing) {
        await axios.put(`${API}/inventory/${existing.id}`, payload);
        setMessage(`Inventory updated for ${product.name}.`);
      } else {
        await axios.post(`${API}/inventory`, payload);
        setMessage(`Inventory record created for ${product.name}.`);
      }
      await Promise.all([loadInventory(), onRefresh()]);
    } catch (error) {
      setMessage(error.response?.data?.message || error.response?.data?.error || `Unable to update inventory for ${product.name}.`);
    } finally {
      setBusyProductId(null);
    }
  }

  const rows = products.map((product) => {
    const record = records.find((item) => Number(item.productId) === Number(product.id));
    return { ...product, record, reorderLevel: reorderLevels[product.id] ?? record?.reorderLevel ?? 10 };
  });
  const lowStock = rows.filter((product) => Number(product.quantity) <= Number(product.reorderLevel));

  return (
    <section className="content-card">
      <div className="section-heading">
        <h2>Inventory Management</h2>
        <button className="refresh-button" onClick={() => { loadInventory(); onRefresh(); }}>Refresh Inventory</button>
      </div>
      <p>Product quantity is the live stock value used by customer orders. Set a reorder level for each product and adjust stock here.</p>
      {message && <p role="status" className="module-message">{message}</p>}
      <div className="stats">
        <div className="stat-card"><p>Products Tracked</p><h2>{rows.length}</h2></div>
        <div className="stat-card"><p>Total Units</p><h2>{rows.reduce((sum, product) => sum + Number(product.quantity || 0), 0)}</h2></div>
        <div className="stat-card"><p>Low Stock Items</p><h2>{lowStock.length}</h2></div>
      </div>
      {lowStock.length > 0 && <div className="module-alert"><strong>Reorder alert:</strong> {lowStock.map((product) => `${product.name} (${product.quantity} left)`).join(", ")}</div>}
      {rows.length === 0 ? <p>Add products first to manage inventory.</p> : (
        <div className="table-wrapper"><table><thead><tr><th>Product</th><th>Category</th><th>Current Stock</th><th>Adjust Stock</th><th>Reorder Level</th><th>Status</th><th>Action</th></tr></thead>
          <tbody>{rows.map((product) => <tr key={product.id}>
            <td>{product.name}</td><td>{product.category}</td><td>{product.quantity}</td>
            <td><input aria-label={`Stock quantity for ${product.name}`} className="inventory-number" type="number" min="0" step="1" value={stockEdits[product.id] ?? product.quantity} onChange={(event) => setStockEdits({ ...stockEdits, [product.id]: event.target.value })} /></td>
            <td><input aria-label={`Reorder level for ${product.name}`} className="inventory-number" type="number" min="0" step="1" value={reorderLevels[product.id] ?? 10} onChange={(event) => setReorderLevels({ ...reorderLevels, [product.id]: event.target.value })} /></td>
            <td><span className={Number(product.quantity) <= Number(product.reorderLevel) ? "inventory-low" : "inventory-ok"}>{Number(product.quantity) <= Number(product.reorderLevel) ? "Low stock" : "In stock"}</span></td>
            <td><button className="refresh-button" disabled={busyProductId === product.id} onClick={() => saveInventory(product)}>{busyProductId === product.id ? "Saving..." : "Save"}</button></td>
          </tr>)}</tbody></table></div>
      )}
    </section>
  );
}
