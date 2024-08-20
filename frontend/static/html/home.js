// home.js

import {
  getAllUsers,
  getFriendsList,
  getMutedList,
  getConnectedUsers,
} from "./func.js";

let updateInterval;
let updateListsFunction; // 이 변수를 사용하여 updateLists 함수를 저장합니다.

export async function renderHome(container) {
  async function updateLists() {
    try {
      console.log("Updating user lists...");
      const allUsers = await getAllUsers();
      const connectedUsers = await getConnectedUsers();
      const friends = await getFriendsList();
      const mutedUsers = await getMutedList();

      updateList("allUsersList", allUsers, (user) => user.username);
      updateList("connectedUsersList", connectedUsers, (user) => user);
      updateList("friendsList", friends, (friend) => friend.username);
      updateList(
        "mutedUsersList",
        mutedUsers,
        (mutedUser) => mutedUser.username
      );

      console.log("User lists updated successfully");
    } catch (error) {
      console.error("Error updating user lists:", error);
    }
  }

  function updateList(listId, items, textExtractor) {
    const list = document.getElementById(listId);
    if (list) {
      list.innerHTML = ""; // Clear the list
      items.forEach((item) => {
        const li = document.createElement("li");
        li.textContent = textExtractor(item);
        list.appendChild(li);
      });
    }
  }

  container.innerHTML = `
    <h2>Welcome to the Home Page</h2>
    <h3>All Users</h3>
    <ul id="allUsersList"></ul>
    <h3>Connected Users</h3>
    <ul id="connectedUsersList"></ul>
    <h3>Friends</h3>
    <ul id="friendsList"></ul>
    <h3>Muted Users</h3>
    <ul id="mutedUsersList"></ul>
  `;

  await updateLists();

  // Set up an interval to update the lists every 30 seconds
  updateInterval = setInterval(updateLists, 30000);

  // Set up event listener for chat actions
  document.addEventListener("chatActionPerformed", updateLists);
}

export function cleanupHome() {
  // Clear the update interval when leaving the home page
  if (updateInterval) {
    clearInterval(updateInterval);
  }

  // Remove event listeners
  if (updateListsFunction) {
    document.removeEventListener("friendUpdated", updateListsFunction);
    document.removeEventListener("muteUpdated", updateListsFunction);
  }
}
