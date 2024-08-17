// register.js
import { navigate } from "./app.js";

export function renderRegister(container) {
  container.innerHTML = `
			<h2>Register</h2>
			<form id="registerForm">
					<input type="text" id="registerUsername" placeholder="Username" required>
					<input type="email" id="registerEmail" placeholder="Email" required>
					<input type="password" id="registerPassword" placeholder="Password" required>
					<input type="password" id="registerPassword2" placeholder="Confirm Password" required>
					<button type="submit">Register</button>
			</form>
			<p>Already have an account? <a href="/login" id="login-link" data-link>Login</a></p>
	`;

  document
    .getElementById("registerForm")
    .addEventListener("submit", async (e) => {
      e.preventDefault();
      const username = document.getElementById("registerUsername").value;
      const email = document.getElementById("registerEmail").value;
      const password = document.getElementById("registerPassword").value;
      const password2 = document.getElementById("registerPassword2").value;

      try {
        const response = await fetch("/api/users/register/", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({ username, email, password, password2 }),
        });

        if (!response.ok) throw new Error("Registration failed");

        alert("Registration successful! Please log in.");
        navigate("/login");
      } catch (error) {
        alert("Registration failed: " + error.message);
      }
    });
  document.getElementById("login-link").addEventListener("click", (e) => {
    e.preventDefault(); // Prevent default anchor behavior
    navigate("/login");
  });
}
