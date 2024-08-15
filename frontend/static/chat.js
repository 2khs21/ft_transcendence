import { authState } from "./app.js";

export let chatSocket = null; // WebSocket 객체를 전역 변수로 선언

export function initializeChat() {
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

  const protocol = window.location.protocol === "https:" ? "wss://" : "ws://";
  chatSocket = new WebSocket(
    `${protocol}${window.location.hostname}:8000/ws/chat/`
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
    const message = messageInputDom.value;
    const username = localStorage.getItem("username"); // 사용자 이름 가져오기

    // 메시지와 사용자 이름을 콘솔에 로그로 출력
    console.log("Sending message:", message);
    console.log("From user:", username);

    // WebSocket 서버로 메시지 전송
    chatSocket.send(
      JSON.stringify({
        message: message,
        username: username,
      })
    );

    // 메시지 전송 후 입력 필드를 비움
    messageInputDom.value = "";

    // 전송 완료 로그
    console.log("Message sent successfully.");
  };

  function displayMessage(data) {
    const chatBox = document.querySelector("#chat-box");
    console.log("displayMessage");
    if (data.whisper) {
      // 귓속말 처리
      if (
        data.to_username === localStorage.getItem("username") ||
        data.from_username === localStorage.getItem("username")
      ) {
        chatBox.innerHTML += `<div>(Whisper) ${data.from_username}: ${data.message}</div>`;
      }
    } else {
      chatBox.innerHTML += `<div>${data.username}: ${data.message}</div>`;
    }
    console.log(data);
    // 스크롤을 항상 아래로 유지
    chatBox.scrollTop = chatBox.scrollHeight;
  }
}
