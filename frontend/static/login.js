// login.js
import { navigate } from "./app.js";
import { initializeChat } from "./chat.js";
// export let isLoggedIn = false;
import { authState } from "./app.js";

export function renderLogin(container) {
  container.innerHTML = `
        <h2>Login</h2>
        <form id="loginForm">
            <input type="text" id="loginUsername" placeholder="Username" required>
            <input type="password" id="loginPassword" placeholder="Password" required>
            <button type="submit">Login</button>
        </form>
        <p>Don't have an account? <a href="/register" id="register-link" data-link>Register</a></p>
    `;

  document.getElementById("loginForm").addEventListener("submit", async (e) => {
    e.preventDefault();
    const username = document.getElementById("loginUsername").value;
    const password = document.getElementById("loginPassword").value;
    document.getElementById("");
    try {
      const response = await fetch("/api/token/", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ username, password }),
      });

      if (!response.ok) {
        const errorData = await response.json();
        throw new Error(errorData.detail || "Login failed");
      }

      const data = await response.json();
      localStorage.setItem("accessToken", data.access);
      localStorage.setItem("refreshToken", data.refresh);
      localStorage.setItem("username", username);
      console.log("Login successful, initializing chat and navigating...");
      authState.isLoggedIn = true;
      // initializeChat();
      navigate("/", true, true);
    } catch (error) {
      console.error("Login error:", error.message);
      alert("Login failed: " + error.message);
    }
  });
  // Register link click handler to use SPA navigation
  document.getElementById("register-link").addEventListener("click", (e) => {
    e.preventDefault(); // Prevent default anchor behavior
    navigate("/register"); // Navigate to the register page
  });
}
