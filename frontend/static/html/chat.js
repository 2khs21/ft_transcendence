// chat.js
import { authState, getCookie } from "./app.js";
import { manageFriend, manageMute } from "./func.js";
import { getOtherUserProfile } from "./func.js";

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
    // TODO : ws to wss
    `${protocol}${window.location.hostname}/ws/chat/`
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

    document.querySelector("#chat-send").onclick = async function (e) {
      const messageInputDom = document.querySelector("#chat-input");
      let message = messageInputDom.value;
      const username = localStorage.getItem("username");

      // 친구 추가 명령어 처리
      if (message.startsWith("/befriend ")) {
        const userToAdd = message.split(" ")[1];
        manageFriend(userToAdd, "add").then((result) => {
          displayMessage({
            message: result.detail,
            username: "System",
          });
        });
        messageInputDom.value = "";
        return;
      }

      // 친구 삭제 명령어 처리
      if (message.startsWith("/unfriend ")) {
        const userToRemove = message.split(" ")[1];
        manageFriend(userToRemove, "remove").then((result) => {
          displayMessage({
            message: result.detail,
            username: "System",
          });
        });
        messageInputDom.value = "";
        return;
      }

      // 차단 명령어 처리
      if (message.startsWith("/mute ")) {
        const userToMute = message.split(" ")[1];
        manageMute(userToMute, "mute").then((result) => {
          displayMessage({
            message: result.detail,
            username: "System",
          });
        });
        messageInputDom.value = "";
        return;
      }

      // 차단 해제 명령어 처리
      if (message.startsWith("/unmute ")) {
        const userToUnmute = message.split(" ")[1];
        manageMute(userToUnmute, "unmute").then((result) => {
          displayMessage({
            message: result.detail,
            username: "System",
          });
        });
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
      // profile 명령어 처리
      if (message.startsWith("/profile ")) {
        const userToView = message.split(" ")[1];
        const profile = await getOtherUserProfile(userToView);
        if (profile) {
          displayUserProfile(profile);
        } else {
          displayMessage({
            message: `Failed to fetch profile for user ${userToView}`,
            username: "System",
          });
        }
        messageInputDom.value = "";
        return;
      }
      if (message.startsWith("/")) {
        displayMessage({
          message: `/w, /befriend, /unfriend, /mute, /unmute, /profile 명령어를 사용할 수 있습니다.`,
          username: "System",
        });
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
      // // 모든 채팅 활동 후 이벤트 발생 home.js에서 이벤트를 수신하여 사용자 목록을 업데이트합니다.
      // document.dispatchEvent(new Event("chatActionPerformed"));
    };
  };
}
function displayMessage(data) {
  const chatBox = document.querySelector("#chat-box");
  const chatMessages = document.querySelector("#chat-messages");
  console.log("displayMessage", data);

  if (data.whisper == true) {
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

  // 새 메시지가 추가된 후 스크롤을 가장 아래로 이동
  chatMessages.scrollTop = chatMessages.scrollHeight;

  // 스크롤이 맨 아래에 있는지 확인
  const isScrolledToBottom =
    chatMessages.scrollHeight - chatMessages.clientHeight <=
    chatMessages.scrollTop + 1;

  // 새 메시지가 추가되면 자동으로 스크롤
  if (isScrolledToBottom) {
    chatMessages.scrollTop =
      chatMessages.scrollHeight - chatMessages.clientHeight;
  }

  // 모든 채팅 활동 후 이벤트 발생 home.js에서 이벤트를 수신하여 사용자 목록을 업데이트합니다.
  document.dispatchEvent(new Event("chatActionPerformed"));
}

// view other profile
function displayUserProfile(profile) {
  const profileContainer = document.createElement("div");
  profileContainer.id = "user-profile-container";
  profileContainer.innerHTML = `
    <img src="${
      profile.profile_image_url
    }" alt="Profile Image" style="width: 100px; height: 100px;">
    <p>Username: ${profile.username}</p>
    <p>Email: ${profile.email}</p>
    <p>Status: ${profile.status_message || "No status message"}</p>
    <button id="close-profile">X</button>
  `;
  document.body.appendChild(profileContainer);

  document.getElementById("close-profile").addEventListener("click", () => {
    document.body.removeChild(profileContainer);
  });
}
