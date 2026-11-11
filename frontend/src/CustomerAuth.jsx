
import { useState } from "react";
import axios from "axios";

const API = "http://localhost:8080/api";
axios.defaults.withCredentials = true;

export default function CustomerAuth({ onLoginSuccess, onBack }) {
  const [isRegister, setIsRegister] = useState(false);
  const [message, setMessage] = useState("");
  const [loading, setLoading] = useState(false);
  const [showPassword, setShowPassword] = useState(false);

  const [form, setForm] = useState({
    name: "",
    email: "",
    password: "",
    phone: "",
    address: "",
  });

  function handleChange(event) {
    const { name, value } = event.target;

    setForm((previousForm) => ({
      ...previousForm,
      [name]: value,
    }));
  }

  function switchMode() {
    setIsRegister((previous) => !previous);
    setMessage("");
    setForm((previousForm) => ({
      ...previousForm,
      name: "",
      password: "",
      phone: "",
      address: "",
    }));
  }

  async function handleSubmit(event) {
    event.preventDefault();
    setMessage("");
    setLoading(true);

    try {
      if (isRegister) {
        await axios.post(`${API}/customers/register`, form);

        setMessage("Registration successful! Please log in.");
        setIsRegister(false);

        setForm((previousForm) => ({
          ...previousForm,
          name: "",
          password: "",
          phone: "",
          address: "",
        }));
      } else {
        const response = await axios.post(`${API}/customers/login`, {
          email: form.email.trim(),
          password: form.password,
        });

        onLoginSuccess(response.data);
      }
    } catch (error) {
      setMessage(
        typeof error.response?.data === "string"
          ? error.response.data
          : error.response?.data?.message ||
              "Something went wrong. Please try again."
      );
    } finally {
      setLoading(false);
    }
  }

  return (
    <div className="login-page">
      <div className="login-card">
        <h1>Supply Chain Management</h1>

        <h2>{isRegister ? "Customer Registration" : "Customer Login"}</h2>

        <form className="product-form" onSubmit={handleSubmit}>
          {isRegister && (
            <>
              <label>
                Full Name
                <input
                  type="text"
                  name="name"
                  value={form.name}
                  onChange={handleChange}
                  placeholder="Enter your full name"
                  required
                />
              </label>

              <label>
                Phone
                <input
  type="tel"
  name="phone"
  value={form.phone}
  onChange={handleChange}
  placeholder="Enter your phone number"
  required
/>
              </label>

              <label>
                Address
                <input
  type="text"
  name="address"
  value={form.address}
  onChange={handleChange}
  placeholder="Enter your address"
  required
/>
              </label>
            </>
          )}

          <label>
            Email
            <input
              type="email"
              name="email"
              value={form.email}
              onChange={handleChange}
              placeholder="Enter your email"
              autoComplete="email"
              required
            />
          </label>

          <label>
  Password
  
<div
  style={{
    display: "flex",
    alignItems: "center",
    border: "1px solid #d8d6e8",
    borderRadius: "8px",
    overflow: "hidden",
  }}
>
  <input
    type={showPassword ? "text" : "password"}
    name="password"
    value={form.password}
    onChange={handleChange}
    placeholder={
      isRegister ? "Create a password" : "Enter your password"
    }
    autoComplete={isRegister ? "new-password" : "current-password"}
    required
    style={{
      flex: 1,
      minWidth: 0,
      border: "none",
      outline: "none",
      borderRadius: 0,
    }}
  />

  <button
    type="button"
    onClick={() => setShowPassword((previous) => !previous)}
    aria-label={showPassword ? "Hide password" : "Show password"}
    style={{
      width: "44px",
      flexShrink: 0,
      padding: "12px 8px",
      border: "none",
      borderRadius: 0,
      background: "#f5f3ff",
      cursor: "pointer",
    }}
  >
    {showPassword ? "🙈" : "👁️"}
  </button>
</div>

</label>

          {message && <p role="status">{message}</p>}

          <button type="submit" disabled={loading}>
            {loading
              ? "Please wait..."
              : isRegister
              ? "Create Account"
              : "Login"}
          </button>
        </form>

        <p>
          {isRegister
            ? "Already have an account?"
            : "Don't have an account?"}{" "}
          <button
            type="button"
            disabled={loading}
            onClick={switchMode}
          >
            {isRegister ? "Login" : "Register"}
          </button>
        </p>

        {!isRegister && (
          <button
            type="button"
            disabled={loading}
            onClick={onBack}
          >
            Back to Admin Login
          </button>
        )}
      </div>
    </div>
  );
}
