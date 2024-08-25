// app.js
import { renderHome } from "./home.js";
import { renderLogin } from "./login.js";
import { renderProfile, getUsername } from "./profile.js";
import { chatSocket, removeChatUI } from "./chat.js";
import { renderRegister } from "./register.js";
import { initializeChat } from "./chat.js";
import { renderGame } from "./3d.js";

export const authState = {
  isLoggedIn: false,
};

const routes = {
  "/login": renderLogin,
  "/": renderHome,
  "/profile": renderProfile,
  "/register": renderRegister,
  "/game": renderGame,
};

const app = document.getElementById("app");
const nav = document.getElementById("main-nav");

export function navigate(path) {
  history.pushState(null, "", path);
  updateContent();
}

async function updateContent() {
  const path = window.location.pathname;
  const renderFunction = routes[path] || routes["/"];
  app.innerHTML = "";
  if (path === "/game") {
    // removeGame();
  }
  await renderFunction(app);
  updateNav();
}

function updateNav() {
  const isLoggedIn = !!localStorage.getItem("accessToken");
  nav.style.display = isLoggedIn ? "block" : "none";
}

async function handleOAuthCallback() {
  const urlParams = new URLSearchParams(window.location.search);
  const accessToken = urlParams.get("access_token");
  const refreshToken = urlParams.get("refresh_token");

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
    navigate("/login");
  }
}

// 로그인 상태를 확인하는 함수
function checkAuthState() {
  const accessToken = localStorage.getItem("accessToken");
  authState.isLoggedIn = accessToken;
  if (!accessToken) {
    navigate("/login");
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
}
async function init() {
  handleOAuthCallback();
  checkAuthState();
  await updateContent();
  initEventListeners();
  // initializeChat();
}

document.addEventListener("DOMContentLoaded", init);

export async function handleLogout() {
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

    // 로컬 스토리지에서 토큰 제거
    localStorage.removeItem("accessToken");
    localStorage.removeItem("refreshToken");
    removeChatUI();
    console.log("User logged out successfully");
    authState.isLoggedIn = false;
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
