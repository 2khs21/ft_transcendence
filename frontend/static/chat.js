// chat.js
import { authState } from "./app.js";

export let chatSocket = null; // WebSocket 객체를 전역 변수로 선언

export function initializeChat() {
  if (!document.getElementById("chat-container")) {
    const chatContainer = document.createElement("div");
    chatContainer.id = "chat-container";
    chatContainer.innerHTML = `
    <div id="chat-messages" style="overflow-y: scroll; height: 100px; border: 1px solid #ccc; padding: 10px; margin-bottom: 10px;">
    <div id="chat-box"></div> <!-- chat-box 요소 추가 -->
    </div>
    <input type="text" id="chat-input" placeholder="Type a message..." style="width: 80%; padding: 5px;">
    <button id="chat-send" style="width: 18%; padding: 5px;">Send</button>
    `;
    document.body.appendChild(chatContainer);
  }
  const protocol = window.location.protocol === "https:" ? "wss://" : "ws://";
  chatSocket = new WebSocket(
    `${protocol}${window.location.hostname}:8080/ws/chat/`
  );

  chatSocket.onopen = function (e) {
    console.log("WebSocket connection established");
  };

  chatSocket.onmessage = function (e) {
    const data = JSON.parse(e.data);
    displayMessage(data);
    console.log("onmessage");
  };

  chatSocket.onclose = function (e) {
    if (authState.isLoggedIn == true) {
      console.error("Chat socket closed unexpectedly");
      setTimeout(() => initializeChat(), 5000); // 5초 후 재연결 시도
    } else {
      console.log("WebSocket connection closed during logout.");
    }
  };

  document.querySelector("#chat-input").focus();
  document.querySelector("#chat-input").onkeyup = function (e) {
    if (e.keyCode === 13) {
      // enter, return
      document.querySelector("#chat-send").click();
    }
  };
  document.querySelector("#chat-send").onclick = function (e) {
    const messageInputDom = document.querySelector("#chat-input");
    let message = messageInputDom.value; // const를 let으로 변경
    const username = localStorage.getItem("username");

    // /befriend 명령어 처리
    if (message.startsWith("/befriend ")) {
      const userToFollow = message.split(" ")[1];
      befriendUser(userToFollow);
      messageInputDom.value = "";
      return;
    }

    let to_username = "everyone";
    let whisper = false;
    // 귓속말 처리
    if (message.startsWith("/w ")) {
      const parts = message.split(" ");
      if (parts.length >= 3) {
        to_username = parts[1];
        message = parts.slice(2).join(" "); // 여기서 message를 재할당
        whisper = true;
      }
    }

    console.log("Sending message:", message);
    console.log("From user:", username);
    console.log("To user:", to_username);

    chatSocket.send(
      JSON.stringify({
        message: message,
        username: username,
        to_username: to_username,
        whisper: whisper,
      })
    );

    messageInputDom.value = "";
    console.log("Message sent successfully.");
  };
}
function displayMessage(data) {
  const chatBox = document.querySelector("#chat-box");
  console.log("displayMessage", data);

  if (data.whisper == true) {
    // 'yes'로 비교
    console.log("Display whisper msg");
    if (
      data.to_username === localStorage.getItem("username") ||
      data.username === localStorage.getItem("username")
    ) {
      chatBox.innerHTML += `<div>(Whisper) ${data.username} to ${data.to_username}: ${data.message}</div>`;
    }
  } else {
    chatBox.innerHTML += `<div>${data.username}: ${data.message}</div>`;
  }

  chatBox.scrollTop = chatBox.scrollHeight;
}

// 친구 추가(팔로우) 함수
async function befriendUser(userToFollow) {
  console.log("befriendUser");
  console.log(getCookie("csrftoken"));
  console.log(`${localStorage.getItem("accessToken")}`);

  try {
    const response = await fetch("/api/users/follow/", {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        "X-CSRFToken": getCookie("csrftoken"),
        Authorization: `Bearer ${localStorage.getItem("accessToken")}`, // JWT 사용 시
      },
      body: JSON.stringify({ username: userToFollow }),
    });

    const data = await response.json();
    // 시스템 메시지로 결과 표시
    displayMessage({
      message: data.detail,
      username: "System",
    });
  } catch (error) {
    console.error("Error:", error);
    displayMessage({
      message: `An error occurred while trying to follow ${userToFollow}`,
      username: "System",
    });
  }
}

// CSRF 토큰을 쿠키에서 가져오는 함수
function getCookie(name) {
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
