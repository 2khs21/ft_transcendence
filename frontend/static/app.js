// app.js

// 페이지 렌더링 함수들을 가져옵니다.
import { renderLogin } from "./login.js";
import { renderRegister } from "./register.js";
import { renderHome } from "./home.js";
import { renderGame } from "./game.js";
import { renderProfile } from "./profile.js";
import { initializeChat, chatSocket } from "./chat.js";

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

function checkAuthAndRedirect() {
  authState.isLoggedIn = !!localStorage.getItem("accessToken"); // 'token' 대신 'accessToken' 사용
  const currentPath = window.location.pathname;

  if (
    !authState.isLoggedIn &&
    currentPath !== "/login" &&
    currentPath !== "/register"
  ) {
    console.log("No login");
    navigate("/login", false); // 로그인 상태가 아닌 경우 로그인 페이지로 리다이렉트
    return;
  }

  if (
    authState.isLoggedIn &&
    (currentPath === "/login" || currentPath === "/register")
  ) {
    console.log("Yes login");
    navigate("/", false); // 로그인 상태에서 로그인 페이지 또는 회원가입 페이지로 이동 시 홈으로 리다이렉트
    return;
  }

  updateContent(currentPath);
}

function logout() {
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

  navigate("/login"); // 로그아웃 후 로그인 페이지로 이동
}
document.getElementById("logout-btn").addEventListener("click", logout);

function init() {
  checkAuthAndRedirect();
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
});
