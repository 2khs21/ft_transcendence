// chat.js

// 필요한 함수들을 import합니다.
import { authState } from "./app.js";
import {
  manageFriend,
  manageMute,
  getOtherUserProfile,
  updateUserConnection,
} from "./func.js";
import { getUsername } from "./profile.js";
// WebSocket 객체를 전역 변수로 선언합니다.
export let chatSocket = null;

/**
 * 채팅 기능을 초기화하는 함수입니다.
 * 이 함수는 app.js의 init 함수에서 호출됩니다.
 */
export function initializeChat() {
  // 채팅 UI를 생성합니다.
  createChatUI();

  // WebSocket 연결을 설정합니다.
  setupWebSocket();

  // 이벤트 리스너를 설정합니다.
  setupEventListeners();
}

/**
 * 채팅 UI를 생성하는 함수입니다.
 */
function createChatUI() {
  if (!document.getElementById("chat-container")) {
    const chatContainer = document.createElement("div");
    chatContainer.id = "chat-container";
    chatContainer.innerHTML = `
      <div id="chat-messages" style="overflow-y: scroll; height: 100px; border: 1px solid #ccc; padding: 10px; margin-bottom: 10px;">
        <div id="chat-box"></div>
      </div>
      <input type="text" id="chat-input" placeholder="Type a message..." style="width: 80%; padding: 5px;">
      <button id="chat-send" style="width: 18%; padding: 5px;">Send</button>
    `;
    document.body.appendChild(chatContainer);
  }
}
/**
 * 채팅 UI를 제거하는 함수입니다.
 */
export function removeChatUI() {
  const chatContainer = document.getElementById("chat-container");
  if (chatContainer) {
    chatContainer.remove();
  }
}

/**
 * WebSocket 연결을 설정하는 함수입니다.
 */

function setupWebSocket() {
  const protocol = window.location.protocol === "https:" ? "wss://" : "ws://";
  chatSocket = new WebSocket(`${protocol}${window.location.hostname}/ws/chat/`);

  chatSocket.onopen = async function (e) {
    console.log("WebSocket connection established");
    const username = localStorage.getItem("username");
    if (username) {
      try {
        await updateUserConnection(username, true); // 연결 상태를 true로 업데이트
        console.log(`User ${username} connected`);
      } catch (error) {
        console.error("Error updating user connection status:", error);
      }
    }
  };

  chatSocket.onmessage = function (e) {
    const data = JSON.parse(e.data);
    displayMessage(data);
  };

  chatSocket.onclose = async function (e) {
    const username = localStorage.getItem("username");
    console.log(username + "is close?,why username exist error");
    if (localStorage.getItem("accessToken")) {
      try {
        await updateUserConnection(username, false); // 연결 상태를 false로 업데이트
        console.log(`User ${username} disconnected`);
      } catch (error) {
        console.error("Error updating user disconnection status:", error);
      }
    }

    if (authState.isLoggedIn) {
      console.error("Chat socket closed unexpectedly");
      setTimeout(() => setupWebSocket(), 5000); // 5초 후 재연결 시도
    } else {
      console.log("WebSocket connection closed during logout.");
    }
  };
}
/**
 * 이벤트 리스너를 설정하는 함수입니다.
 */
function setupEventListeners() {
  const chatInput = document.querySelector("#chat-input");
  const chatSend = document.querySelector("#chat-send");

  chatInput.addEventListener("keyup", function (e) {
    if (e.key === "Enter") {
      chatSend.click();
    }
  });

  chatSend.addEventListener("click", sendMessage);
}

/**
 * 메시지를 전송하는 함수입니다.
 */
async function sendMessage() {
  const messageInputDom = document.querySelector("#chat-input");
  let message = messageInputDom.value;
  const username = await getUsername();

  // 특수 명령어 처리
  if (await handleSpecialCommands(message, username)) {
    messageInputDom.value = "";
    return;
  }

  // 일반 메시지 전송
  let to_username = "everyone";
  let whisper = false;

  // 귓속말 처리
  if (message.startsWith("/w ")) {
    const parts = message.split(" ");
    if (parts.length >= 3) {
      to_username = parts[1];
      message = parts.slice(2).join(" ");
      whisper = true;
    }
  }

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
}

/**
 * 특수 명령어를 처리하는 함수입니다.
 * @param {string} message - 입력된 메시지
 * @param {string} username - 현재 사용자 이름
 * @returns {boolean} - 특수 명령어가 처리되었는지 여부
 */
async function handleSpecialCommands(message, username) {
  const commands = {
    "/befriend": { action: "add", func: manageFriend },
    "/unfriend": { action: "remove", func: manageFriend },
    "/mute": { action: "mute", func: manageMute },
    "/unmute": { action: "unmute", func: manageMute },
    "/profile": { action: "view", func: getOtherUserProfile },
  };

  for (const [command, { action, func }] of Object.entries(commands)) {
    if (message.startsWith(command + " ")) {
      const targetUser = message.split(" ")[1];
      const result = await func(targetUser, action);
      if (command === "/profile") {
        result
          ? displayUserProfile(result)
          : displayMessage({
              message: `Failed to fetch profile for user ${targetUser}`,
              username: "System",
            });
      } else {
        displayMessage({
          message: result.detail,
          username: "System",
        });
      }
      return true;
    }
  }

  if (message.startsWith("/") && !message.startsWith("/w")) {
    displayMessage({
      message: `/w, /befriend, /unfriend, /mute, /unmute, /profile 명령어를 사용할 수 있습니다.`,
      username: "System",
    });
    return true;
  }

  return false;
}

/**
 * 메시지를 화면에 표시하는 함수입니다.
 * @param {Object} data - 표시할 메시지 데이터
 */
async function displayMessage(data) {
  const chatBox = document.querySelector("#chat-box");
  const chatMessages = document.querySelector("#chat-messages");
  const username = await getUsername();
  if (data.whisper) {
    if (data.to_username === username || data.username === username) {
      chatBox.innerHTML += `<div class="text-white">(Whisper) ${data.username} to ${data.to_username}: ${data.message}</div>`;
    }
  } else {
    chatBox.innerHTML += `<div class="text-white">${data.username}: ${data.message}</div>`;
  }

  // 스크롤 처리
  chatMessages.scrollTop = chatMessages.scrollHeight;

  // 채팅 활동 이벤트 발생
  document.dispatchEvent(new Event("chatActionPerformed"));
}

/**
 * 사용자 프로필을 화면에 표시하는 함수입니다.
 * @param {Object} profile - 표시할 사용자 프로필 데이터
 */
function displayUserProfile(profile) {
  const profileContainer = document.createElement("div");
  profileContainer.id = "user-profile-container";
  profileContainer.innerHTML = `
    <img src="${
      profile.profile_image_url
    }" alt="Profile Image" style="width: 100px; height: 100px;">
    <p class="text-white">Username: ${profile.username}</p>
    <p class="text-white">Email: ${profile.email}</p>
    <p class="text-white">Status: ${profile.status_message || "No status message"}</p>
    <button id="close-profile" class="text-white">X</button>
  `;
  document.body.appendChild(profileContainer);

  document.getElementById("close-profile").addEventListener("click", () => {
    document.body.removeChild(profileContainer);
  });
}
