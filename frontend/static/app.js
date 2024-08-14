// app.js

// 페이지 렌더링 함수들을 가져옵니다.
import { renderLogin } from "./login.js";
import { renderRegister } from "./register.js";
import { renderHome } from "./home.js";
import { renderGame } from "./game.js";
import { renderProfile } from "./profile.js";

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
  const isLoggedIn = !!localStorage.getItem("token");
  nav.style.display = isLoggedIn ? "block" : "none";
}

function checkAuthAndRedirect() {
  const isLoggedIn = !!localStorage.getItem("token");
  const currentPath = window.location.pathname;

  if (!isLoggedIn && currentPath !== "/login" && currentPath !== "/register") {
    console.log("No login");
    navigate("/login", false);
    return;
  }

  if (isLoggedIn && (currentPath === "/login" || currentPath === "/register")) {
    console.log("Yes login");
    navigate("/", false);
    return;
  }

  updateContent(currentPath);
}

window.addEventListener("popstate", (event) => {
  const path = event.state?.path || window.location.pathname;
  checkAuthAndRedirect();
});

document.body.addEventListener("click", (e) => {
  if (e.target.matches("[data-link]")) {
    e.preventDefault();
    navigate(e.target.getAttribute("href"));
  }
});

function logout() {
  localStorage.removeItem("token");
  navigate("/login");
}

document.getElementById("logout-btn").addEventListener("click", logout);

function init() {
  checkAuthAndRedirect();

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

// DOMContentLoaded 이벤트를 사용하여 초기화
document.addEventListener("DOMContentLoaded", init);
