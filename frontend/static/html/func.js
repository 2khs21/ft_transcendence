// func.js
import { authenticatedFetch } from "./auth.js";

// 특정 사용자의 상세 정보를 가져오는 함수
export async function getUserDetails(username) {
  try {
    const response = await fetch(`/api/users/${username}/`);
    if (!response.ok) {
      throw new Error(`HTTP error! status: ${response.status}`);
    }
    const data = await response.json();
    console.log("User details:", data);
    return data;
  } catch (error) {
    console.error(`Error fetching details for user ${username}:`, error);
    return null;
  }
}

// 접속 중인 유저 목록 가져오기
// 접속 중인 유저 목록 가져오기
export async function getConnectedUsers() {
  try {
    console.log("Fetching connected users...");
    const response = await authenticatedFetch("/api/users/connected/");
    const data = await response.json();
    console.log("Connected users:", data);
    return data;
  } catch (error) {
    console.error("Error fetching connected users:", error);
    return null;
  }
}

// 유저 접속 상태 업데이트
export async function updateUserConnection(username, isConnected) {
  try {
    const url = isConnected ? "/api/users/connect/" : "/api/users/disconnect/";
    const response = await fetch(url, {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
      },
      body: JSON.stringify({ username }),
    });
    if (!response.ok) {
      throw new Error(`HTTP error! status: ${response.status}`);
    }
    console.log(
      `User ${username} ${isConnected ? "connected" : "disconnected"}`
    );
  } catch (error) {
    console.error("Error updating user connection:", error);
  }
}

//// nuew

// 모든 사용자 목록을 가져오는 함수
export async function getAllUsers() {
  try {
    console.log("Fetching all users...");
    const response = await authenticatedFetch("/api/users/");
    const data = await response.json();
    console.log("All users:", data);
    return data;
  } catch (error) {
    console.error("Error fetching all users:", error);
    return null;
  }
}

// 친구 목록 가져오기
export async function getFriendsList() {
  try {
    const response = await authenticatedFetch("/api/users/friend/");
    const data = await response.json();
    console.log("Friends list:", data);
    return data;
  } catch (error) {
    console.error("Error fetching friends list:", error);
    return null;
  }
}

// 차단 목록 가져오기
export async function getMutedList() {
  try {
    const response = await authenticatedFetch("/api/users/mute/");
    const data = await response.json();
    console.log("Muted users list:", data);
    return data;
  } catch (error) {
    console.error("Error fetching muted users list:", error);
    return null;
  }
}

// 친구 추가/삭제 함수
export async function manageFriend(username, action) {
  try {
    const response = await authenticatedFetch("/api/users/friend/", {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
      },
      body: JSON.stringify({ username, action }),
    });
    const data = await response.json();
    console.log("Friend action result:", data);
    return data;
  } catch (error) {
    console.error("Error in friend action:", error);
    return null;
  }
}

// 사용자 차단/차단해제 함수
export async function manageMute(username, action) {
  try {
    const response = await authenticatedFetch("/api/users/mute/", {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
      },
      body: JSON.stringify({ username, action }),
    });
    const data = await response.json();
    console.log("Mute action result:", data);
    return data;
  } catch (error) {
    console.error("Error in mute action:", error);
    return null;
  }
}

// 다른 유저의 프로필 정보 가져오기
export async function getOtherUserProfile(username) {
  try {
    console.log(`Fetching profile for user ${username}...`);
    const response = await authenticatedFetch(
      `/api/users/profile/${username}/`
    );
    const data = await response.json();
    console.log("User profile:", data);
    return data;
  } catch (error) {
    console.error(`Error fetching profile for user ${username}:`, error);
    return null;
  }
}
