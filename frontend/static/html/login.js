// login.js
import { navigate, handleLogout, authState } from "./app.js";
import { updateUserConnection } from "./func.js";
import { chatSocket, removeChatUI, initializeChat } from "./chat.js";
// import { resendVerification } from "./register.js";

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
    chatContainer.remove();
  }
  const chatBox = document.getElementById("chat-messages");
  if (chatBox) {
    chatBox.remove();
  }

  container.innerHTML = `
    <h1>Login</h1>
    <form id="loginForm">
      <input type="text" id="loginUsername" placeholder="Username" required>
      <input type="password" id="loginPassword" placeholder="Password" required>
      <button type="submit">Login</button>
    </form>
    <p>Don't have an account? <a href="/register" id="register-link" data-link>Register</a></p>
    <p>Click the button below to login with 42</p>
    <button id="login-btn">Login with 42</button>
  `;

  document.getElementById("loginForm").addEventListener("submit", async (e) => {
    e.preventDefault();
    await loginUser();
  });

  const verifyEmailBtn = document.getElementById("verifyEmailBtn");
  if (verifyEmailBtn) {
    verifyEmailBtn.addEventListener("click", async () => {
      await verifyLogin();
    });
  }

  const loginBtn = document.getElementById("login-btn");
  if (loginBtn) {
    loginBtn.addEventListener("click", () => {
      window.location.href = "/api/users/oauth/login/";
    });
  }

  const registerLink = document.getElementById("register-link");
  if (registerLink) {
    registerLink.addEventListener("click", (e) => {
      e.preventDefault();
      navigate("/register");
    });
  }
}

async function loginUser() {
  const username = document.getElementById("loginUsername").value;
  const password = document.getElementById("loginPassword").value;
  console.log("Logging in with username:", username, "and password:", password);
  try {
    const response = await fetch("/api/users/login/", {
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
    await updateUserConnection(username, true);
    authState.isLoggedIn = true;
    initializeChat();
    navigate("/", true, true);
  } catch (error) {
    console.error("Login error:", error.message);
    alert("Login failed: " + error.message);
  }
}

// async function verifyLogin() {
//   const username = document.getElementById("loginUsername").value;
//   const email = document.getElementById("verificationEmail").value;
//   const code = document.getElementById("verificationCode").value;

//   if (!username || !email || !code) {
//     alert("Please fill in all fields: username, email, and verification code.");
//     return;
//   }

//   console.log(
//     "Verifying login with:",
//     JSON.stringify({ username, email, code })
//   );

//   try {
//     const response = await fetch("/api/users/verify-login/", {
//       method: "POST",
//       headers: { "Content-Type": "application/json" },
//       body: JSON.stringify({ username, email, code }),
//     });

//     if (!response.ok) {
//       const errorData = await response.json();
//       throw new Error(errorData.detail || "Email verification failed");
//     }

//     const data = await response.json();
//     localStorage.setItem("accessToken", data.access);
//     localStorage.setItem("refreshToken", data.refresh);
//     localStorage.setItem("username", username);
//     console.log(
//       "Login successful after email verification, initializing chat and navigating..."
//     );
//     await updateUserConnection(username, true);
//     authState.isLoggedIn = true;
//     initializeChat();
//     navigate("/", true, true);
//   } catch (error) {
//     console.error("Verification error:", error.message);
//     alert("Email verification failed: " + error.message);
//   }
// }
