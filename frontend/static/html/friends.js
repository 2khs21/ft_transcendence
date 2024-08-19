// friends.js
import { authenticatedFetch } from "./auth.js";

export async function renderFriends(container) {
  container.innerHTML = '<h1>Friends</h1><div id="friends-list"></div>';
  const friendsList = document.getElementById("friends-list");

  try {
    const response = await authenticatedFetch("/api/users/following/");
    const friends = await response.json();

    friends.forEach((friend) => {
      const friendElement = document.createElement("div");
      friendElement.className = "friend-item";
      friendElement.innerHTML = `
                <img src="${
                  friend.profile_image || "/default-profile.png"
                }" alt="${friend.username}">
                <span>${friend.username}</span>
                <span class="status-indicator ${
                  friend.online ? "online" : "offline"
                }"></span>
            `;
      friendsList.appendChild(friendElement);
    });
  } catch (error) {
    console.error("Error fetching friends:", error);
    friendsList.innerHTML = "Error loading friends list.";
  }
}

export function updateFriendStatus(username, status) {
  const friendElement = document.querySelector(
    `.friend-item span:contains('${username}')`
  );
  if (friendElement) {
    const statusIndicator = friendElement.nextElementSibling;
    statusIndicator.className = `status-indicator ${
      status ? "online" : "offline"
    }`;
  }
}
