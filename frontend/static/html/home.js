// home.js
import { authState, navigate } from "./app.js";
import { getUsername } from "./profile.js";

import {
  getAllUsers,
  getFriendsList,
  getMutedList,
  getConnectedUsers,
} from "./func.js";

let updateInterval;
let updateListsFunction; // 함수 저장

export async function renderHome(container) {
  const accessToken = localStorage.getItem("accessToken");

  if (!accessToken) {
    console.log("No access token found. home-> login page...");
    navigate("/login");
    return;
  }

  try {
    const response = await fetch("/api/users/profile/", {
      headers: {
        Authorization: `Bearer ${accessToken}`,
      },
    });

    if (!response.ok) {
      throw new Error("Failed to fetch user data");
    }

    const userData = await response.json();
    console.log(userData);
    container.innerHTML = `
      <h1> ${userData.username}'s Hompage</h1>
      <h3>All Users</h3>
      <ul id="allUsersList"></ul>
      <h3>Connected Users</h3>
      <ul id="connectedUsersList"></ul>
      <h3>Friends</h3>
      <ul id="friendsList"></ul>
      <h3>Muted Users</h3>
      <ul id="mutedUsersList"></ul>
    `;
  } catch (error) {
    console.error("Error:", error);
    container.innerHTML =
      "<p>Failed to load user data. Please try logging in again.</p>";
    localStorage.removeItem("accessToken");
    localStorage.removeItem("refreshToken");
  }
  console.log("authstate.isLoggedIn : ", authState.isLoggedIn);
  if (authState.isLoggedIn) {
    await updateLists();
  }
  // Set up an interval to update the lists every 30 seconds
  updateInterval = setInterval(updateLists, 30000);

  // Set up event listener for chat actions
  document.addEventListener("chatActionPerformed", updateLists);
}

async function updateLists() {
  if (!authState.isLoggedIn) {
    return;
  }
  try {
    console.log("Updating user lists...");
    const allUsers = await getAllUsers();
    const connectedUsers = await getConnectedUsers();
    const friends = await getFriendsList();
    const mutedUsers = await getMutedList();

    updateList("allUsersList", allUsers, (user) => user.username);
    updateList("connectedUsersList", connectedUsers, (user) => user);
    updateList("friendsList", friends, (friend) => friend.username);
    updateList("mutedUsersList", mutedUsers, (mutedUser) => mutedUser.username);

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
