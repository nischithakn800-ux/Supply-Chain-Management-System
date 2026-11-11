
import { useEffect, useState } from "react";
import axios from "axios";

const API = "http://localhost:8080/api";
axios.defaults.withCredentials = true;

export default function CustomerPortal({ customer, onLogout }) {
  const [products, setProducts] = useState([]);
  const [orders, setOrders] = useState([]);
  const [quantities, setQuantities] = useState({});
  const [message, setMessage] = useState("");
  const [loading, setLoading] = useState(true);
  const [activeTab, setActiveTab] = useState("products");
  const [placingProductId, setPlacingProductId] = useState(null);
  const [cancellingOrderId, setCancellingOrderId] = useState(null);

  async function loadData() {
    try {
      const [productResponse, orderResponse] = await Promise.all([
        axios.get(`${API}/products`),
        axios.get(`${API}/customers/orders`),
      ]);

      setProducts(productResponse.data);
      setOrders(orderResponse.data);
    } catch (error) {
      setMessage(
        typeof error.response?.data === "string"
          ? error.response.data
          : error.response?.data?.message ||
              "Unable to load products and orders. Please try again."
      );
    } finally {
      setLoading(false);
    }
  }

  useEffect(() => {
    loadData();
  }, []);

  async function placeOrder(product) {
    const quantity = Number(quantities[product.id] || 1);

    if (!Number.isInteger(quantity) || quantity < 1) {
      setMessage("Enter a valid quantity.");
      return;
    }

    if (quantity > product.quantity) {
      setMessage("Requested quantity exceeds available stock.");
      return;
    }

    setPlacingProductId(product.id);
    setMessage("");

    try {
      await axios.post(`${API}/customers/orders`, {
        productId: product.id,
        quantity,
        status: "PENDING",
        orderDate: new Date().toISOString().slice(0, 10),
      });

      setMessage(`Order placed successfully for ${product.name}.`);
      await loadData();
      setActiveTab("orders");
    } catch (error) {
      setMessage(
        typeof error.response?.data === "string"
          ? error.response.data
          : error.response?.data?.message ||
              "Unable to place order. Please try again."
      );
    } finally {
      setPlacingProductId(null);
    }
  }

  async function cancelOrder(order) {
    const confirmed = window.confirm(
      `Are you sure you want to cancel order #${order.id}?`
    );

    if (!confirmed) return;

    setCancellingOrderId(order.id);
    setMessage("");

    try {
      await axios.delete(`${API}/customers/orders/${order.id}`);
      setMessage(`Order #${order.id} cancelled successfully.`);
      await loadData();
    } catch (error) {
      setMessage(
        typeof error.response?.data === "string"
          ? error.response.data
          : error.response?.data?.message ||
              "Unable to cancel order. Please try again."
      );
    } finally {
      setCancellingOrderId(null);
    }
  }

  async function logout() {
    try {
      await axios.post(`${API}/auth/logout`);
    } catch (error) {
      console.error("Logout request failed:", error);
    } finally {
      onLogout();
    }
  }

  return (
    <div className="customer-portal">
      <header className="customer-header">
        <div>
          <h1>Supply Chain Store</h1>
          <p>Welcome, {customer.name}!</p>
        </div>
        <button onClick={logout}>Logout</button>
      </header>

      <nav className="customer-nav">
        <button
          className={activeTab === "products" ? "active" : ""}
          onClick={() => setActiveTab("products")}
        >
          Browse Products
        </button>

        <button
          className={activeTab === "orders" ? "active" : ""}
          onClick={() => setActiveTab("orders")}
        >
          My Orders
        </button>
      </nav>

      {message && <p role="status">{message}</p>}

      {loading ? (
        <p>Loading...</p>
      ) : activeTab === "products" ? (
        <section className="customer-products">
          <h2>Available Products</h2>

          {products.length === 0 ? (
            <p>No products available.</p>
          ) : (
            <div className="customer-product-grid">
              {products.map((product) => (
                <article
                  className="customer-product-card"
                  key={product.id}
                >
                  <h3>{product.name}</h3>
                  <p>Category: {product.category}</p>
                  <p>Price: ₹{product.price}</p>
                  <p>Available stock: {product.quantity}</p>

                  {product.quantity > 0 ? (
                    <>
                      <label>
                        Quantity
                        <input
                          type="number"
                          min="1"
                          max={product.quantity}
                          value={quantities[product.id] || 1}
                          onChange={(event) =>
                            setQuantities({
                              ...quantities,
                              [product.id]: event.target.value,
                            })
                          }
                        />
                      </label>

                      <button
                        disabled={placingProductId === product.id}
                        onClick={() => placeOrder(product)}
                      >
                        {placingProductId === product.id
                          ? "Placing Order..."
                          : "Place Order"}
                      </button>
                    </>
                  ) : (
                    <p>Out of stock</p>
                  )}
                </article>
              ))}
            </div>
          )}
        </section>
      ) : (
        <section className="customer-orders">
          <h2>My Orders</h2>

          {orders.length === 0 ? (
            <p>You have not placed any orders yet.</p>
          ) : (
            <div className="table-wrapper">
              <table>
                <thead>
                  <tr>
                    <th>Order ID</th>
                    <th>Product</th>
                    <th>Quantity</th>
                    <th>Order Date</th>
                    <th>Status</th>
                    <th>Action</th>
                  </tr>
                </thead>

                <tbody>
                  {orders.map((order) => {
                    const product = products.find(
                      (item) => item.id === order.productId
                    );

                    return (
                      <tr key={order.id}>
                        <td>{order.id}</td>
                        <td>
                          {product?.name ||
                            `Product #${order.productId}`}
                        </td>
                        <td>{order.quantity}</td>
                        <td>{order.orderDate}</td>
                        <td>{order.status}</td>
                        <td>
                          {order.status?.toUpperCase() === "PENDING" ? (
                            <button
                              disabled={
                                cancellingOrderId === order.id
                              }
                              onClick={() => cancelOrder(order)}
                            >
                              {cancellingOrderId === order.id
                                ? "Cancelling..."
                                : "Cancel Order"}
                            </button>
                          ) : (
                            <span>Not cancellable</span>
                          )}
                        </td>
                      </tr>
                    );
                  })}
                </tbody>
              </table>
            </div>
          )}
        </section>
      )}
    </div>
  );
}
