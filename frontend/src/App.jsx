
import { useEffect, useState } from "react";
import axios from "axios";
import "./App.css";
import CustomerAuth from "./CustomerAuth";
import CustomerPortal from "./CustomerPortal";
import SupplierManagement from "./SupplierManagement";
import InventoryManagement from "./InventoryManagement";

const API = "http://localhost:8080/api";
axios.defaults.withCredentials = true;

function App() {
  const [activePage, setActivePage] = useState("Dashboard");
  const [products, setProducts] = useState([]);
  const [orders, setOrders] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");

  const [isLoggedIn, setIsLoggedIn] = useState(false);
  const [loginMessage, setLoginMessage] = useState("");
  const [loginLoading, setLoginLoading] = useState(false);

  const [showProductForm, setShowProductForm] = useState(false);
  const [productMessage, setProductMessage] = useState("");
  const [savingProduct, setSavingProduct] = useState(false);
  const [editingProductId, setEditingProductId] = useState(null);
  const [deletingProductId, setDeletingProductId] = useState(null);

  const [searchTerm, setSearchTerm] = useState("");
  const [selectedCategory, setSelectedCategory] = useState("All");

  const [showOrderForm, setShowOrderForm] = useState(false);
  const [orderMessage, setOrderMessage] = useState("");
  const [savingOrder, setSavingOrder] = useState(false);
  const [deletingOrderId, setDeletingOrderId] = useState(null);
  const [showPassword, setShowPassword] = useState(false);
  

  const [customer, setCustomer] = useState(null);
  const [showCustomerLogin, setShowCustomerLogin] = useState(false);

  const editingProduct = products.find(
    (product) => product.id === editingProductId
  );

  const categories = [
    ...new Set(
      products.map((product) => product.category).filter(Boolean)
    ),
  ].sort();

  const filteredProducts = products.filter((product) => {
    const search = searchTerm.toLowerCase().trim();

    const matchesSearch =
      `${product.name || ""} ${product.category || ""}`
        .toLowerCase()
        .includes(search);

    const matchesCategory =
      selectedCategory === "All" ||
      product.category === selectedCategory;

    return matchesSearch && matchesCategory;
  });

  const loadData = async () => {
    setLoading(true);
    setError("");

    try {
      const [productResponse, orderResponse] = await Promise.all([
        axios.get(`${API}/products`),
        axios.get(`${API}/orders`),
      ]);

      setProducts(
        Array.isArray(productResponse.data)
          ? productResponse.data
          : []
      );

      setOrders(
        Array.isArray(orderResponse.data)
          ? orderResponse.data
          : []
      );
    } catch (err) {
      setError(
        "Unable to load data. Make sure your Spring Boot backend is running on port 8080."
      );
    } finally {
      setLoading(false);
    }
  };

  // Admin Login
  const handleLogin = async (event) => {
    event.preventDefault();
    setLoginMessage("");
    setLoginLoading(true);

    const formData = new FormData(event.currentTarget);

    try {
      await axios.post(
        `${API}/auth/login`,
        {
          username: formData.get("username"),
          password: formData.get("password"),
        },
        { withCredentials: true }
      );

      setIsLoggedIn(true);
      
    } catch (err) {
      setLoginMessage(
        err.response?.status === 401 ||
          err.response?.status === 403
          ? "Invalid username or password."
          : "Login failed. Check that your backend is running."
      );
    } finally {
      setLoginLoading(false);
    }
  };

  // Admin Logout
  const handleLogout = async () => {
    try {
      await axios.post(
        `${API}/auth/logout`,
        {},
        { withCredentials: true }
      );
    } catch (err) {
      console.error("Logout request failed:", err);
    } finally {
      
      setIsLoggedIn(false);
      setLoading(true);
      setProducts([]);
      setOrders([]);
      setActivePage("Dashboard");
      setError("");
      setProductMessage("");
      setOrderMessage("");
      setShowProductForm(false);
      setShowOrderForm(false);
      setEditingProductId(null);
      setShowPassword(false);
    }
  };

 useEffect(() => {
  if (isLoggedIn) {
    loadData();
  }
}, [isLoggedIn]);

  // Add Product
  const addProduct = async (event) => {
    event.preventDefault();
    setProductMessage("");
    setSavingProduct(true);

    const formData = new FormData(event.currentTarget);

    const newProduct = {
      name: formData.get("name").trim(),
      category: formData.get("category").trim(),
      quantity: Number(formData.get("quantity")),
      price: Number(formData.get("price")),
    };

    try {
      await axios.post(`${API}/products`, newProduct);
      setProductMessage("Product added successfully!");
      setShowProductForm(false);
      setEditingProductId(null);
      await loadData();
    } catch (err) {
      setProductMessage(
        err.response?.data?.message ||
          "Unable to add product. Please check the product details."
      );
    } finally {
      setSavingProduct(false);
    }
  };

  // Update Product
  const updateProduct = async (event) => {
    event.preventDefault();
    setProductMessage("");
    setSavingProduct(true);

    const formData = new FormData(event.currentTarget);

    const updatedProduct = {
      name: formData.get("name").trim(),
      category: formData.get("category").trim(),
      quantity: Number(formData.get("quantity")),
      price: Number(formData.get("price")),
    };

    try {
      await axios.put(
        `${API}/products/${editingProductId}`,
        updatedProduct
      );

      setProductMessage("Product updated successfully!");
      setEditingProductId(null);
      setShowProductForm(false);
      await loadData();
    } catch (err) {
      setProductMessage(
        err.response?.data?.message ||
          "Unable to update product. Check your backend PUT endpoint."
      );
    } finally {
      setSavingProduct(false);
    }
  };

  const startEditingProduct = (product) => {
    setProductMessage("");
    setEditingProductId(product.id);
    setShowProductForm(true);
  };

  const cancelProductForm = () => {
    setShowProductForm(false);
    setEditingProductId(null);
    setProductMessage("");
  };

  // Delete Product
  const deleteProduct = async (product) => {
    const confirmed = window.confirm(
      `Are you sure you want to delete "${product.name}"?`
    );

    if (!confirmed) return;

    setDeletingProductId(product.id);
    setProductMessage("");

    try {
      await axios.delete(`${API}/products/${product.id}`);
      setProductMessage("Product deleted successfully!");

      if (editingProductId === product.id) {
        setEditingProductId(null);
        setShowProductForm(false);
      }

      await loadData();
    } catch (err) {
      setProductMessage(
        err.response?.data?.message ||
          "Unable to delete product. Check your backend DELETE endpoint."
      );
    } finally {
      setDeletingProductId(null);
    }
  };

  // Create Admin Order
  const createOrder = async (event) => {
    event.preventDefault();
    setOrderMessage("");
    setSavingOrder(true);

    const formData = new FormData(event.currentTarget);
    const productId = Number(formData.get("productId"));
    const quantity = Number(formData.get("quantity"));

    const selectedProduct = products.find(
      (product) => Number(product.id) === productId
    );

    if (!selectedProduct) {
      setOrderMessage("Please select a valid product.");
      setSavingOrder(false);
      return;
    }

    if (quantity <= 0 || !Number.isInteger(quantity)) {
      setOrderMessage("Quantity must be a positive whole number.");
      setSavingOrder(false);
      return;
    }

    if (quantity > Number(selectedProduct.quantity)) {
      setOrderMessage(
        `Only ${selectedProduct.quantity} units of ${selectedProduct.name} are available.`
      );
      setSavingOrder(false);
      return;
    }

    const newOrder = {
      productId,
      quantity,
      status: "PENDING",
      orderDate: new Date().toISOString().slice(0, 10),
    };

    try {
      await axios.post(`${API}/orders`, newOrder);
      setOrderMessage("Customer order created successfully!");
      setShowOrderForm(false);
      await loadData();
    } catch (err) {
      setOrderMessage(
        err.response?.data?.message ||
          "Unable to create order. Check whether your backend supports POST /api/orders."
      );
    } finally {
      setSavingOrder(false);
    }
  };

  // Update Order Status
  const updateOrderStatus = async (orderId, status) => {
    setOrderMessage(`Updating order #${orderId}...`);

    try {
      const response = await axios.patch(
        `${API}/orders/${orderId}/status`,
        { status }
      );

      console.log("Status update successful:", response.data);

      setOrderMessage(
        `Order #${orderId} status updated to ${status}.`
      );

      const orderResponse = await axios.get(`${API}/orders`);
      setOrders(
        Array.isArray(orderResponse.data) ? orderResponse.data : []
      );
    } catch (err) {
      console.error("Status update failed:", err);

      setOrderMessage(
        `Update failed: ${
          err.response
            ? `HTTP ${err.response.status} - ${JSON.stringify(err.response.data)}`
            : err.message
        }`
      );
    }
  };

  // Delete Order
  const deleteOrder = async (order) => {
    const product = products.find(
      (item) => Number(item.id) === Number(order.productId)
    );

    const confirmed = window.confirm(
      `Delete order #${order.id} for ${
        product?.name || `Product ID ${order.productId}`
      } (${order.quantity} units)? The backend should restore the stock when deleting the order.`
    );

    if (!confirmed) return;

    setDeletingOrderId(order.id);
    setOrderMessage("");

    try {
      await axios.delete(`${API}/orders/${order.id}`);

      setOrderMessage(
        `Order #${order.id} deleted successfully.`
      );

      await loadData();
    } catch (err) {
      console.error("Order deletion failed:", err);

      setOrderMessage(
        err.response?.data?.message ||
          `Unable to delete order #${order.id}. Please check the backend DELETE endpoint.`
      );
    } finally {
      setDeletingOrderId(null);
    }
  };

  // Dashboard calculations
  const totalStock = products.reduce(
    (total, product) => total + Number(product.quantity || 0),
    0
  );

  const lowStockProducts = products.filter(
    (product) => Number(product.quantity) <= 10
  );

  const pendingOrders = orders.filter(
    (order) => order.status?.toUpperCase() === "PENDING"
  ).length;

  const shippedOrders = orders.filter(
    (order) => order.status?.toUpperCase() === "SHIPPED"
  ).length;

  const menuItems = [
    "Dashboard",
    "Products",
    "Customer Orders",
    "Suppliers",
    "Inventory Management",
  ];

  const getProductName = (order) => {
    const productId = order.productId ?? order.product?.id;

    return (
      order.productName ||
      order.product?.name ||
      products.find(
        (product) => Number(product.id) === Number(productId)
      )?.name ||
      "N/A"
    );
  };

  const showCards = (items) => (
    <section className="stats">
      {items.map((item) => (
        <div className="stat-card" key={item.label}>
          <p>{item.label}</p>
          <h2>{item.value}</h2>
        </div>
      ))}
    </section>
  );

  const formatDate = (date) => {
    if (!date) return "-";

    const parsedDate = new Date(`${date}T00:00:00`);

    return Number.isNaN(parsedDate.getTime())
      ? date
      : parsedDate.toLocaleDateString();
  };

  // Customer Portal
  if (customer) {
    return (
      <CustomerPortal
        customer={customer}
        onLogout={() => {
  setCustomer(null);
  setShowCustomerLogin(true);
  setIsLoggedIn(false);
  setLoading(true);
  setProducts([]);
  setOrders([]);
  setError("");
  setProductMessage("");
  setOrderMessage("");
  setShowProductForm(false);
  setShowOrderForm(false);
  setEditingProductId(null);
  setShowPassword(false);
}}
      />
    );
  }

  // Customer Login / Registration
  if (showCustomerLogin) {
    return (
      <CustomerAuth
        onLoginSuccess={(customerData) => {
          setCustomer(customerData);
          setShowCustomerLogin(false);
        }}
        onBack={() => setShowCustomerLogin(false)}
      />
    );
  }

  // Admin Login
  if (!isLoggedIn) {
    return (
      <div className="login-page">
        <section className="login-card">
          <h1>SupplyChain</h1>
          <h2>Admin Login</h2>

          <p style={{ textAlign: "center" }}>
            Sign in to manage your supply chain operations.
          </p>

          <form className="product-form" onSubmit={handleLogin}>
            <label>
              Username
              <input
                name="username"
                type="text"
                placeholder="Enter username"
                autoComplete="username"
                required
              />
            </label>

            <label>
              Password
              <div className="password-input-wrapper">
                <input
                  name="password"
                  type={showPassword ? "text" : "password"}
                  placeholder="Enter password"
                  autoComplete="current-password"
                  required
                />

                <button
                  type="button"
                  className="password-toggle"
                  onClick={() => setShowPassword(!showPassword)}
                  aria-label={
                    showPassword ? "Hide password" : "Show password"
                  }
                  title={showPassword ? "Hide password" : "Show password"}
                >
                  {showPassword ? "🙈" : "👁️"}
                </button>
              </div>
            </label>

            {loginMessage && (
              <p role="alert">{loginMessage}</p>
            )}

            <button
              type="submit"
              className="refresh-button"
              disabled={loginLoading}
            >
              {loginLoading ? "Logging in..." : "Login"}
            </button>
          </form>

          <button
            type="button"
            onClick={() => setShowCustomerLogin(true)}
          >
            Customer Login / Register
          </button>
        </section>
      </div>
    );
  }

  // Admin Application
  return (
    <div className="app">
      <aside className="sidebar">
        <h2>SupplyChain</h2>
        <p className="sidebar-subtitle">Management System</p>

        <nav>
          {menuItems.map((item) => (
            <button
              key={item}
              className={`menu-item ${
                activePage === item ? "active" : ""
              }`}
              onClick={() => setActivePage(item)}
            >
              {item}
            </button>
          ))}
        </nav>
      </aside>

      <main className="main-content">
        <header className="topbar">
          <div>
            <h1>{activePage}</h1>
            <p>Manage your supply chain operations</p>
          </div>

          <div
            style={{
              display: "flex",
              gap: "10px",
              flexWrap: "wrap",
            }}
          >
            <button
              className="refresh-button"
              onClick={loadData}
            >
              Refresh Data
            </button>

            <button
              className="delete-button"
              onClick={handleLogout}
            >
              Logout
            </button>
          </div>
        </header>

        {error && (
          <section className="content-card">
            <h2>Connection Error</h2>
            <p>{error}</p>
          </section>
        )}

        {loading ? (
          <section className="content-card">
            <p>Loading products and orders...</p>
          </section>
        ) : (
          <>
            {/* Dashboard */}
            {activePage === "Dashboard" && (
              <>
                {showCards([
                  {
                    label: "Total Products",
                    value: products.length,
                  },
                  {
                    label: "Total Orders",
                    value: orders.length,
                  },
                  {
                    label: "Inventory Status",
                    value:
                      products.length > 0
                        ? "Available"
                        : "No Products",
                  },
                ])}

                <section className="welcome">
                  <h2>Welcome to Supply Chain Management</h2>
                  <p>
                    Monitor your inventory and customer orders in one place.
                  </p>
                </section>

                <section className="content-card">
                  <h2>Inventory Overview</h2>
                  <p>Total units in stock: {totalStock}</p>
                  <p>Pending orders: {pendingOrders}</p>
                  <p>Shipped orders: {shippedOrders}</p>
                  <p>Low-stock products: {lowStockProducts.length}</p>

                  {lowStockProducts.length > 0 && (
                    <div>
                      <h3>Low Stock Alerts</h3>
                      <ul>
                        {lowStockProducts.map((product) => (
                          <li key={product.id}>
                            {product.name} — Only {product.quantity} units remaining
                          </li>
                        ))}
                      </ul>
                    </div>
                  )}
                </section>
              </>
            )}

            {/* Products */}
            {activePage === "Products" && (
              <>
                {showCards([
                  {
                    label: "Total Products",
                    value: products.length,
                  },
                  {
                    label: "Total Stock",
                    value: totalStock,
                  },
                  {
                    label: "Inventory Status",
                    value:
                      products.length > 0
                        ? "Available"
                        : "No Products",
                  },
                ])}

                <section className="content-card">
                  <div className="section-heading">
                    <h2>Product Inventory</h2>

                    <button
                      type="button"
                      className="refresh-button"
                      onClick={() => {
                        if (showProductForm) {
                          cancelProductForm();
                        } else {
                          setProductMessage("");
                          setEditingProductId(null);
                          setShowProductForm(true);
                        }
                      }}
                    >
                      {showProductForm ? "Cancel" : "+ Add Product"}
                    </button>
                  </div>

                  {productMessage && <p>{productMessage}</p>}

                  <div className="product-filters">
                    <input
                      type="text"
                      placeholder="Search by product name or category..."
                      value={searchTerm}
                      onChange={(event) => setSearchTerm(event.target.value)}
                      className="product-search"
                    />

                    <select
                      value={selectedCategory}
                      onChange={(event) =>
                        setSelectedCategory(event.target.value)
                      }
                      className="category-filter"
                    >
                      <option value="All">All Categories</option>
                      {categories.map((category) => (
                        <option key={category} value={category}>
                          {category}
                        </option>
                      ))}
                    </select>
                  </div>

                  {showProductForm && (
                    <form
                      key={editingProductId ?? "new-product"}
                      className="product-form"
                      onSubmit={
                        editingProductId !== null
                          ? updateProduct
                          : addProduct
                      }
                    >
                      <label>
                        Product Name
                        <input
                          name="name"
                          type="text"
                          defaultValue={editingProduct?.name || ""}
                          required
                        />
                      </label>

                      <label>
                        Category
                        <input
                          name="category"
                          type="text"
                          defaultValue={editingProduct?.category || ""}
                          required
                        />
                      </label>

                      <label>
                        Quantity
                        <input
                          name="quantity"
                          type="number"
                          min="0"
                          defaultValue={editingProduct?.quantity ?? ""}
                          required
                        />
                      </label>

                      <label>
                        Price (₹)
                        <input
                          name="price"
                          type="number"
                          min="0"
                          step="0.01"
                          defaultValue={editingProduct?.price ?? ""}
                          required
                        />
                      </label>

                      <button
                        type="submit"
                        className="refresh-button"
                        disabled={savingProduct}
                      >
                        {savingProduct
                          ? "Saving..."
                          : editingProductId !== null
                            ? "Update Product"
                            : "Save Product"}
                      </button>
                    </form>
                  )}

                  {filteredProducts.length === 0 ? (
                    <p>
                      {products.length === 0
                        ? "No products found in the backend."
                        : "No matching products found."}
                    </p>
                  ) : (
                    <div className="table-wrapper">
                      <table>
                        <thead>
                          <tr>
                            <th>ID</th>
                            <th>Product Name</th>
                            <th>Category</th>
                            <th>Quantity</th>
                            <th>Price</th>
                            <th>Actions</th>
                          </tr>
                        </thead>

                        <tbody>
                         {[...filteredProducts]
  .sort((a, b) => a.name.localeCompare(b.name))
  .map((product) => (
                            <tr key={product.id}>
                              <td>{product.id}</td>
                              <td>{product.name}</td>
                              <td>{product.category}</td>
                              <td>{product.quantity}</td>
                              <td>
                                ₹
                                {Number(product.price || 0).toLocaleString("en-IN")}
                              </td>
                              <td>
                                <div className="product-actions">
                                  <button
                                    type="button"
                                    className="refresh-button"
                                    onClick={() => startEditingProduct(product)}
                                    disabled={deletingProductId !== null}
                                  >
                                    Edit
                                  </button>

                                  <button
                                    type="button"
                                    className="delete-button"
                                    onClick={() => deleteProduct(product)}
                                    disabled={deletingProductId !== null}
                                  >
                                    {deletingProductId === product.id
                                      ? "Deleting..."
                                      : "Delete"}
                                  </button>
                                </div>
                              </td>
                            </tr>
                          ))}
                        </tbody>
                      </table>
                    </div>
                  )}
                </section>
              </>
            )}

            {/* Supplier Management */}
            {activePage === "Suppliers" && (
              <SupplierManagement />
            )}

            {/* Inventory Management */}
            {activePage === "Inventory Management" && (
              <InventoryManagement products={products} onRefresh={loadData} />
            )}

            {/* Customer Orders */}
            {activePage === "Customer Orders" && (
              <>
                {showCards([
                  {
                    label: "Total Orders",
                    value: orders.length,
                  },
                  {
                    label: "Pending Orders",
                    value: pendingOrders,
                  },
                  {
                    label: "Shipped Orders",
                    value: shippedOrders,
                  },
                ])}

                
<section className="content-card">
  <div className="section-heading">
    <h2>Customer Orders</h2>
  </div>


                  {orderMessage && <p>{orderMessage}</p>}

                  

                  {orders.length === 0 ? (
                    <p>No customer orders found in the backend.</p>
                  ) : (
                    <div className="table-wrapper">
                      <table>
                        <thead>
                          <tr>
                            <th>Order ID</th>
<th>Customer Name</th>
<th>Product Name</th>
                            <th>Quantity</th>
                            <th>Status</th>
                            <th>Order Date</th>
                            <th>Actions</th>
                          </tr>
                        </thead>

                        

<tbody>
  {orders.map((order) => (
    <tr key={order.id}>
      <td>{order.id}</td>
      <td>{order.customerName || "Unknown"}</td>
      <td>{getProductName(order)}</td>
      <td>{order.quantity}</td>
      <td>
        <select
          className="status-select"
          value={order.status || "PENDING"}
          onChange={(event) =>
            updateOrderStatus(order.id, event.target.value)
          }
        >
          {[
            "PENDING",
            "PROCESSING",
            "SHIPPED",
            "DELIVERED",
          ].map((status) => (
            <option key={status} value={status}>
              {status}
            </option>
          ))}
        </select>
      </td>
      <td>{formatDate(order.orderDate)}</td>
      <td>
        <button
          type="button"
          className="delete-button"
          disabled={deletingOrderId !== null}
          onClick={() => deleteOrder(order)}
        >
          {deletingOrderId === order.id
            ? "Deleting..."
            : "Delete"}
        </button>
      </td>
    </tr>
  ))}
</tbody>


                      </table>
                    </div>
                  )}
                </section>
              </>
            )}
          </>
        )}
      </main>
    </div>
  );
}

export default App;
