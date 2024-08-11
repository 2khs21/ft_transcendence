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

  // 탭을 클릭할 때 페이지 로드
  document.getElementById("home-tab").addEventListener("click", function () {
    loadPage("home");
  });

  document.getElementById("chat-tab").addEventListener("click", function () {
    loadPage("chat");
  });

  document.getElementById("profile-tab").addEventListener("click", function () {
    loadPage("profile");
  });

  document.getElementById("friend-tab").addEventListener("click", function () {
    loadPage("friend");
  });

  // 초기 페이지 로드 (Home)
  loadPage("home");
});
