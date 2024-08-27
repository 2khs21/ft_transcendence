// app.js
import { renderHome } from "./home.js";
import { renderLogin } from "./login.js";
import { renderProfile, getUsername } from "./profile.js";
import { chatSocket, removeChatUI } from "./chat.js";
import { renderRegister } from "./register.js";
import { initializeChat } from "./chat.js";
import { renderRecord } from "./record.js";
import { renderGame } from "./3d.js";

export const authState = {
  isLoggedIn: false,
};

const routes = {
  "/login": renderLogin,
  "/": renderHome,
  "/profile": renderProfile,
  "/register": renderRegister,
  "/record": renderRecord,
  "/game": renderGame,
};

const app = document.getElementById("app");
const nav = document.getElementById("main-nav");

export function navigate(path) {
  history.pushState(null, "", path);
  updateContent();
}

let isUpdating = false;

async function updateContent() {
  if (isUpdating) return;
  isUpdating = true;

  try {
    const path = window.location.pathname;
    console.log("updateContent start: ", path);
    const renderFunction = routes[path] || routes["/"];
    app.innerHTML = "";
    await checkAuthState();
    if (authState.isLoggedIn || path === "/login" || path === "/register") {
      console.log("updateContent : ", path);
      await renderFunction(app);
    } else {
      console.log("updateContent : login page...");
      navigate("/login");
    }
    updateNav();
  } finally {
    isUpdating = false;
  }
}
function updateNav() {
  const isLoggedIn = !!localStorage.getItem("accessToken");
  nav.style.display = isLoggedIn ? "block" : "none";
}

async function handleOAuthCallback() {
  let accessToken;
  let refreshToken;
  if (
    localStorage.getItem("accessToken") &&
    localStorage.getItem("refreshToken")
  ) {
    accessToken = localStorage.getItem("accessToken");
    refreshToken = localStorage.getItem("refreshToken");
  } else {
    console.log("handleOauthCallback path : ", window.location.pathname);
    const urlParams = new URLSearchParams(window.location.search);
    accessToken = urlParams.get("access_token");
    refreshToken = urlParams.get("refresh_token");
    console.log("urlParams : ", urlParams);
    console.log("accessToken : ", accessToken);
    console.log("refreshToken : ", refreshToken);
    console.log("handle OAuth callback");
  }
  if (accessToken && refreshToken) {
    localStorage.setItem("accessToken", accessToken);
    localStorage.setItem("refreshToken", refreshToken);
    console.log("OAuth login successful.");
    console.log("Access Token:", accessToken);
    console.log("Refresh Token:", refreshToken);
    let username = await getUsername();
    localStorage.setItem("username", username);
    console.log(username + " now login.");
    // Remove the tokens from the URL
    window.history.replaceState({}, document.title, "/");
    initializeChat();
    // Navigate to home page
    navigate("/");
  } else {
    // 토큰이 없는 경우 로그인 페이지로 리다이렉트
    console.log("No tokens found in URL. Redirecting to login page...");
    navigate("/login");
  }
}

// 로그인 상태를 확인하는 함수
async function checkAuthState() {
  console.log("checkAuthState start");
  const accessToken = localStorage.getItem("accessToken");
  console.log("accessToken : ", accessToken);
  if (accessToken) {
    try {
      console.log("Fetch /api/users/verify-token/");
      const response = await fetch("/api/users/verify-token/", {
        headers: {
          Authorization: `Bearer ${accessToken}`,
        },
      });
      if (response.ok) {
        console.log("Token is valid");
        authState.isLoggedIn = true;
      } else {
        console.log("Token verification failed");
        throw new Error("Invalid token");
      }
    } catch (error) {
      console.log("Token verification failed:", error);
      console.error("Token verification failed:", error);
      await handleLogout();
    }
  } else {
    authState.isLoggedIn = false;
  }
}

function initEventListeners() {
  window.addEventListener("popstate", updateContent);
  document.getElementById("logout-btn").addEventListener("click", async () => {
    await handleLogout();
    chatSocket.close();
    localStorage.removeItem("accessToken");
    localStorage.removeItem("refreshToken");
    console.log(getUsername + " now logout.");
    authState.isLoggedIn = false;
    // 화면에서 채팅 기록을 담고 있는 chat-container 요소를 삭제
    const chatContainer = document.getElementById("chat-container");
    if (chatContainer) {
      chatContainer.remove(); // chat-container 요소를 DOM에서 제거
    }

    // 만약 chat-messages 요소도 별도로 삭제해야 한다면, 아래 코드 사용
    const chatBox = document.getElementById("chat-messages");
    if (chatBox) {
      chatBox.remove(); // chat-messages 요소를 DOM에서 제거
    }
    console.log("initEventListeners : login page...");
    navigate("/login");
  });
  document
    .getElementById("home-tab")
    .addEventListener("click", () => navigate("/"));
  document
    .getElementById("game-tab")
    .addEventListener("click", () => navigate("/game"));
  document
    .getElementById("profile-tab")
    .addEventListener("click", () => navigate("/profile"));
  document
    .getElementById("record-tab")
    .addEventListener("click", () => navigate("/record"));
}
async function init() {
  handleOAuthCallback();
  console.log("handleOAuthCallback end");
  await checkAuthState();
  console.log("checkAuthState end");
  await updateContent();
  console.log("updateContent end");
  initEventListeners();
  // initializeChat();
}

document.addEventListener("DOMContentLoaded", init);

export async function handleLogout() {
  console.log("handleLogout start");
  try {
    const response = await fetch("/api/users/logout/", {
      method: "POST",
      headers: {
        Authorization: `Bearer ${localStorage.getItem("accessToken")}`,
      },
    });

    if (!response.ok) {
      throw new Error("Failed to logout");
    }
    authState.isLoggedIn = false;
    // 로컬 스토리지에서 토큰 제거
    localStorage.removeItem("accessToken");
    localStorage.removeItem("refreshToken");
    removeChatUI();
    console.log("removeChatUI");
    console.log("User logged out successfully");
    console.log("Logout, close chatSocket, remove chatui");
    chatSocket.close();
    const chatContainer = document.getElementById("chat-container");
    if (chatContainer) {
      chatContainer.remove(); // chat-container 요소를 DOM에서 제거
    }
    // 만약 chat-messages 요소도 별도로 삭제해야 한다면, 아래 코드 사용
    const chatBox = document.getElementById("chat-messages");
    if (chatBox) {
      chatBox.remove(); // chat-messages 요소를 DOM에서 제거
    }
    // 로그아웃 후 로그인 페이지로 리다이렉트 또는 다른 처리
  } catch (error) {
    console.error("Logout error:", error);
  }
}
