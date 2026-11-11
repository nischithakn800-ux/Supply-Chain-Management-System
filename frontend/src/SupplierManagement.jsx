import { useEffect, useState } from "react";
import axios from "axios";

const API = "http://localhost:8080/api";

const emptyForm = { name: "", email: "", phone: "", address: "" };

export default function SupplierManagement() {
  const [suppliers, setSuppliers] = useState([]);
  const [form, setForm] = useState(emptyForm);
  const [editingId, setEditingId] = useState(null);
  const [message, setMessage] = useState("");
  const [busy, setBusy] = useState(false);

  async function loadSuppliers() {
    try {
      const response = await axios.get(`${API}/suppliers`);
      setSuppliers(Array.isArray(response.data) ? response.data : []);
    } catch (error) {
      setMessage(error.response?.data?.message || "Could not load suppliers. Check admin login and backend.");
    }
  }

  useEffect(() => { loadSuppliers(); }, []);

  function changeField(event) {
    setForm({ ...form, [event.target.name]: event.target.value });
  }

  function resetForm() {
    setForm(emptyForm);
    setEditingId(null);
  }

  function editSupplier(supplier) {
    setEditingId(supplier.id);
    setForm({
      name: supplier.name || "",
      email: supplier.email || "",
      phone: supplier.phone || "",
      address: supplier.address || "",
    });
    setMessage("");
  }

  async function submitForm(event) {
    event.preventDefault();
    setBusy(true);
    setMessage("");
    const payload = {
      name: form.name.trim(),
      email: form.email.trim(),
      phone: form.phone.trim(),
      address: form.address.trim(),
    };
    try {
      if (editingId !== null) {
        await axios.put(`${API}/suppliers/${editingId}`, payload);
        setMessage("Supplier updated successfully.");
      } else {
        await axios.post(`${API}/suppliers`, payload);
        setMessage("Supplier added successfully.");
      }
      resetForm();
      await loadSuppliers();
    } catch (error) {
      setMessage(error.response?.data?.message || error.response?.data?.error || "Unable to save supplier. Check the entered details.");
    } finally {
      setBusy(false);
    }
  }

  async function deleteSupplier(supplier) {
    if (!window.confirm(`Delete supplier "${supplier.name}"?`)) return;
    try {
      await axios.delete(`${API}/suppliers/${supplier.id}`);
      setMessage("Supplier deleted successfully.");
      await loadSuppliers();
      if (editingId === supplier.id) resetForm();
    } catch (error) {
      setMessage(error.response?.data?.message || "Unable to delete supplier.");
    }
  }

  return (
    <section className="content-card">
      <div className="section-heading">
        <h2>Supplier Management</h2>
        <button className="refresh-button" onClick={loadSuppliers}>Refresh Suppliers</button>
      </div>
      {message && <p role="status" className="module-message">{message}</p>}
      <form className="product-form" onSubmit={submitForm}>
        <label>Supplier Name<input name="name" value={form.name} onChange={changeField} required maxLength="120" /></label>
        <label>Email<input name="email" type="email" value={form.email} onChange={changeField} required maxLength="150" /></label>
        <label>Phone<input name="phone" type="tel" value={form.phone} onChange={changeField} maxLength="30" /></label>
        <label>Address<input name="address" value={form.address} onChange={changeField} maxLength="500" /></label>
        <div className="product-actions">
          <button className="refresh-button" type="submit" disabled={busy}>{busy ? "Saving..." : editingId !== null ? "Update Supplier" : "Add Supplier"}</button>
          {editingId !== null && <button className="delete-button" type="button" onClick={resetForm}>Cancel Edit</button>}
        </div>
      </form>
      {suppliers.length === 0 ? <p>No suppliers added yet.</p> : (
        <div className="table-wrapper"><table><thead><tr><th>ID</th><th>Name</th><th>Email</th><th>Phone</th><th>Address</th><th>Actions</th></tr></thead>
          <tbody>{suppliers.map((supplier) => <tr key={supplier.id}>
            <td>{supplier.id}</td><td>{supplier.name}</td><td>{supplier.email}</td><td>{supplier.phone || "-"}</td><td>{supplier.address || "-"}</td>
            <td><div className="product-actions"><button className="refresh-button" type="button" onClick={() => editSupplier(supplier)}>Edit</button><button className="delete-button" type="button" onClick={() => deleteSupplier(supplier)}>Delete</button></div></td>
          </tr>)}</tbody></table></div>
      )}
    </section>
  );
}
