document.addEventListener("DOMContentLoaded", function () {
  const content = document.getElementById("content");

  function loadPage(page) {
    switch (page) {
      case "home":
        loadHome();
        break;
      case "chat":
        loadChat();
        break;
      case "profile":
        loadProfile();
        break;
      case "friend":
        loadFriend();
        break;
      default:
        content.innerHTML = "<h2>Page not found</h2>";
    }
  }

  function navigateTo(page) {
    loadPage(page);
    history.pushState({ page: page }, "", `#${page}`);
  }

  // 탭을 클릭할 때 페이지 로드 및 히스토리 업데이트
  document.getElementById("home-tab").addEventListener("click", function () {
    navigateTo("home");
  });

  document.getElementById("chat-tab").addEventListener("click", function () {
    navigateTo("chat");
  });

  document.getElementById("profile-tab").addEventListener("click", function () {
    navigateTo("profile");
  });

  document.getElementById("friend-tab").addEventListener("click", function () {
    navigateTo("friend");
  });

  // popstate 이벤트 처리 (뒤로 가기, 앞으로 가기)
  window.addEventListener("popstate", function (event) {
    const page = event.state ? event.state.page : null;
    if (page) {
      loadPage(page);
    } else {
      const fallbackPage = window.location.hash.replace("#", "") || "home";
      loadPage(fallbackPage);
    }
  });

  // 초기 페이지 로드
  const initialPage = window.location.hash.replace("#", "") || "home";
  loadPage(initialPage);
  history.replaceState({ page: initialPage }, "", `#${initialPage}`);
});
