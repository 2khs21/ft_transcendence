// home.js

import { getAllUsers, getConnectedUsers } from "./func.js";

export async function renderHome(container) {
  container.innerHTML = `
    <h2>Welcome to the Home Page</h2>
    <h3>All Users</h3>
    <ul id="allUsersList"></ul>
    <h3>Connected Users</h3>
    <ul id="connectedUsersList"></ul>
  `;

  try {
    console.log("Fetching user lists...");
    const allUsers = await getAllUsers();
    const connectedUsers = await getConnectedUsers();

    const allUsersList = document.getElementById("allUsersList");
    const connectedUsersList = document.getElementById("connectedUsersList");

    allUsers.forEach((user) => {
      const li = document.createElement("li");
      li.textContent = user.username;
      allUsersList.appendChild(li);
    });

    connectedUsers.forEach((username) => {
      const li = document.createElement("li");
      li.textContent = username;
      connectedUsersList.appendChild(li);
    });

    console.log("User lists rendered successfully");
  } catch (error) {
    console.error("Error rendering user lists:", error);
    container.innerHTML += `<p>Error loading user lists. Please try again later.</p>`;
  }
}
