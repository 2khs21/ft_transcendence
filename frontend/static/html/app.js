// app.js

// 페이지 렌더링 함수들을 가져옵니다.
import { renderLogin } from "./login.js";
import { renderRegister } from "./register.js";
import { renderHome, cleanupHome } from "./home.js";
import { renderProfile } from "./profile.js";
import { initializeChat, chatSocket } from "./chat.js";
import { updateUserConnection } from "./func.js"; // 새로 추가

import { renderGame, removeGame } from "./3d.js";

export const authState = {
  isLoggedIn: false,
};
// 라우트 정의
const routes = {
  "/": renderHome,
  "/login": renderLogin,
  "/register": renderRegister,
  "/game": renderGame,
  "/profile": renderProfile,
};

const app = document.getElementById("app");
const nav = document.getElementById("main-nav");

export function navigate(path, pushState = true) {
  if (pushState) {
    history.pushState({ path }, "", path);
  }

  updateContent(path);
}

function updateContent(path) {
  if (path !== "/") {
    cleanupHome(); // Clean up home page when navigating away
    if (path !== "/game") {
      removeGame(); // Clean up game page when navigating away
    }
  }

  const renderFunction = routes[path] || routes["/"];
  app.innerHTML = "";
  renderFunction(app);
  updateNav();
}

function updateNav() {
  authState.isLoggedIn = !!localStorage.getItem("accessToken");
  nav.style.display = authState.isLoggedIn ? "block" : "none";
  if (authState.isLoggedIn && !document.getElementById("chat-container")) {
    initializeChat();
  }
}

function checkAuthAndRedirect(path = window.location.pathname) {
  authState.isLoggedIn = !!localStorage.getItem("accessToken"); // 'token' 대신 'accessToken' 사용
  const currentPath = window.location.pathname;

  if (
    !authState.isLoggedIn &&
    currentPath !== "/login" &&
    currentPath !== "/register"
  ) {
    console.log("No login -> Login page");
    navigate("/login", false); // 로그인 상태가 아닌 경우 로그인 페이지로 리다이렉트
    return;
  }

  if (
    authState.isLoggedIn &&
    (currentPath === "/login" || currentPath === "/register")
  ) {
    console.log("alreay loginned -> Home page");
    navigate("/", false); // 로그인 상태에서 로그인 페이지 또는 회원가입 페이지로 이동 시 홈으로 리다이렉트
    return;
  }

  updateContent(currentPath);
}

async function old_logout() {
  // WebSocket 연결 종료
  authState.isLoggedIn = false;
  if (chatSocket !== null) {
    chatSocket.close();
  }

  localStorage.removeItem("accessToken"); // 'accessToken' 제거
  localStorage.removeItem("refreshToken"); // 'refreshToken' 제거

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

  // 확인: 요소가 제거되었는지 조건문으로 확인
  if (
    !document.getElementById("chat-container") &&
    !document.getElementById("chat-messages")
  ) {
    console.log(
      "Chat container and chat messages have been successfully removed."
    );
  } else {
    console.error("Failed to remove chat container or chat messages.");
  }

  console.log("Logging out, updating connection status...");
  await updateUserConnection(username, false); // 접속 상태 업데이트

  navigate("/login"); // 로그아웃 후 로그인 페이지로 이동
}

async function logout() {
  console.log("Logging out, updating connection status...");

  const username = localStorage.getItem("username");
  if (username) {
    try {
      await updateUserConnection(username, false); // 접속 상태 업데이트
    } catch (error) {
      console.error("Error updating user connection:", error);
    }
  }

  // WebSocket 연결 종료
  authState.isLoggedIn = false;
  if (chatSocket !== null) {
    chatSocket.close();
  }

  localStorage.removeItem("accessToken");
  localStorage.removeItem("refreshToken");
  localStorage.removeItem("username");

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

  // 확인: 요소가 제거되었는지 조건문으로 확인
  if (
    !document.getElementById("chat-container") &&
    !document.getElementById("chat-messages")
  ) {
    console.log(
      "Chat container and chat messages have been successfully removed."
    );
  } else {
    console.error("Failed to remove chat container or chat messages.");
  }

  navigate("/login"); // 로그아웃 후 로그인 페이지로 이동
}

document.getElementById("logout-btn").addEventListener("click", logout);

function init() {
  window.addEventListener("popstate", checkAuthAndRedirect);

  const path = window.location.pathname;
  checkAuthAndRedirect(path);
  // checkAuthAndRedirect();
  // 로컬스토리지에서 username 가져오기
  const username = localStorage.getItem("username");
  console.log("username");
  console.log("username : " + username);
  console.log(username);
  document
    .getElementById("home-tab")
    .addEventListener("click", () => navigate("/"));
  document
    .getElementById("game-tab")
    .addEventListener("click", () => navigate("/game"));
  document
    .getElementById("profile-tab")
    .addEventListener("click", () => navigate("/profile"));

  // 토큰 확인 후 chat-container가 없을 때만 initializeChat 호출
  const accessToken = localStorage.getItem("accessToken");
  console.log("Access token at init:", accessToken);
  if (accessToken && !document.getElementById("chat-container")) {
    console.log("Access token found, initializing chat");
    initializeChat();
  } else {
    console.log("No access token found or chat already initialized");
  }

  // localStorage의 모든 키 출력
  console.log("All localStorage keys:", Object.keys(localStorage));
}

// DOMContentLoaded 이벤트 리스너에 로그 추가
document.addEventListener("DOMContentLoaded", () => {
  console.log("DOMContentLoaded event fired");

  init();
  initializeCSRF();
});

async function initializeCSRF() {
  await fetch("/api/core/set-csrf-token/", {
    method: "GET",
    credentials: "include",
  })
    .then((response) => {
      if (response.ok) {
        console.log("CSRF token set successfully");
      } else {
        console.error("Failed to set CSRF token");
      }
    })
    .catch((error) => {
      console.error("Error setting CSRF token:", error);
    });
}
// CSRF 토큰을 쿠키에서 가져오는 함수
export function getCookie(name) {
  let cookieValue = null;
  if (document.cookie && document.cookie !== "") {
    console.log("All cookies:", document.cookie); // 모든 쿠키 출력
    const cookies = document.cookie.split(";");
    for (let i = 0; i < cookies.length; i++) {
      const cookie = cookies[i].trim();
      console.log("Checking cookie:", cookie); // 각 쿠키 출력
      if (cookie.substring(0, name.length + 1) === name + "=") {
        cookieValue = decodeURIComponent(cookie.substring(name.length + 1));
        break;
      }
    }
  } else {
    console.log("No cookies found"); // 쿠키가 없는 경우
  }
  console.log(`Cookie '${name}' value:`, cookieValue); // 찾은 쿠키 값 출력
  return cookieValue;
}
