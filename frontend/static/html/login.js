// login.js
import { navigate, handleLogout } from "./app.js";
import { updateUserConnection } from "./func.js";
import { chatSocket, removeChatUI } from "./chat.js";
import { authState } from "./app.js";
import { initializeChat } from "./chat.js";
export function renderLogin(container) {
  // logout 처리
  localStorage.removeItem("accessToken");
  localStorage.removeItem("refreshToken");
  removeChatUI();
  console.log("User logged out successfully");
  authState.isLoggedIn = false;
  console.log("Logout, close chatSocket, remove chatui");
  if (chatSocket) {
    chatSocket.close();
  }

  const chatContainer = document.getElementById("chat-container");
  if (chatContainer) {
    chatContainer.remove(); // chat-container 요소를 DOM에서 제거
  }
  // 만약 chat-messages 요소도 별도로 삭제해야 한다면, 아래 코드 사용
  const chatBox = document.getElementById("chat-messages");
  if (chatBox) {
    chatBox.remove(); // chat-messages 요소를 DOM에서 제거
  }

  container.innerHTML = `
    <h1>42 OAuth</h1>
    <form id="loginForm">
      <input type="text" id="loginUsername" placeholder="Username" required>
      <input type="password" id="loginPassword" placeholder="Password" required>
      <button type="submit">Login</button>
    </form>
    <p>Click the button below to login with 42</p>
    <button id="login-btn">Login with 42</button>
    <p>Don't have an account? <a href="/register" id="register-link" data-link>Register</a></p>
  `;

  // 일반 로그인
  document.getElementById("loginForm").addEventListener("submit", async (e) => {
    e.preventDefault();
    const username = document.getElementById("loginUsername").value;
    const password = document.getElementById("loginPassword").value;
    console.log("username: " + username);
    console.log("Password: " + password);

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
      console.log("Login successful, updating connection status...");
      await updateUserConnection(username, true); // 접속 상태 업데이트
      authState.isLoggedIn = true;
      initializeChat();
      navigate("/", true, true);
    } catch (error) {
      console.error("Login error:", error.message);
      alert("Login failed: " + error.message);
    }
  });

  // 42 OAuth 로그인
  document.getElementById("login-btn").addEventListener("click", () => {
    window.location.href = "/api/users/oauth/login/";
  });
  document.getElementById("register-link").addEventListener("click", (e) => {
    e.preventDefault(); // Prevent default anchor behavior
    navigate("/register"); // Navigate to the register page
  });
}
