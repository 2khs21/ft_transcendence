// login.js
import { navigate } from "./app.js";

export function renderLogin(container) {
  container.innerHTML = `
			<h2>Login</h2>
			<form id="loginForm">
					<input type="text" id="loginUsername" placeholder="Username" required>
					<input type="password" id="loginPassword" placeholder="Password" required>
					<button type="submit">Login</button>
			</form>
			<p>Don't have an account? <a href="/register" data-link>Register</a></p>
	`;

  document.getElementById("loginForm").addEventListener("submit", async (e) => {
    e.preventDefault();
    const username = document.getElementById("loginUsername").value;
    const password = document.getElementById("loginPassword").value;

    try {
      const response = await fetch("/api/users/login/", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ username, password }),
      });

      if (!response.ok) throw new Error("Login failed");

      const data = await response.json();
      localStorage.setItem("token", data.token);
      navigate("/");
    } catch (error) {
      alert("Login failed: " + error.message);
    }
  });
}
