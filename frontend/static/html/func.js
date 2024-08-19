// func.js

// 모든 사용자 목록을 가져오는 함수
export async function getAllUsers() {
  try {
    console.log("Fetching all users..."); // 작업 시작 로그
    const token = localStorage.getItem("accessToken");
    console.log("Access token:", token); // 토큰 로깅
    if (!token) {
      throw new Error("No access token found");
    }
    const response = await fetch("/api/users/", {
      headers: {
        Authorization: `Bearer ${token}`,
      },
    });
    if (!response.ok) {
      throw new Error(`HTTP error! status: ${response.status}`);
    }
    const data = await response.json();
    console.log("All users:", data); // 전체 유저 목록 출력
    return data;
  } catch (error) {
    console.error("Error fetching all users:", error);
    return null;
  }
}
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

// 사용자 이름이 존재하는지 확인하는 함수
export async function checkUsernameExists(username) {
  if (username === localStorage.getItem("username")) {
    return true;
  }
  try {
    const users = await getAllUsers();
    if (!users || !Array.isArray(users)) {
      throw new Error("Invalid user data received");
    }
    return users.some((user) => user.username === username);
  } catch (error) {
    console.error("Error checking username existence:", error);
    return false;
  }
}

// 뮤트된 사용자 목록을 가져오는 함수
export async function fetchMutedList() {
  try {
    const response = await fetch("/api/users/mute/", {
      method: "GET",
      headers: {
        Authorization: `Bearer ${localStorage.getItem("accessToken")}`,
      },
    });
    if (!response.ok) {
      throw new Error(`Failed to fetch muted list. Status: ${response.status}`);
    }
    return await response.json();
  } catch (error) {
    console.error("Error fetching muted list:", error);
    return null;
  }
}

// 특정 사용자가 뮤트되었는지 확인하는 함수
export async function checkIfUserIsMuted(username) {
  try {
    const mutedList = await fetchMutedList();
    return (
      mutedList &&
      mutedList.muted_users &&
      mutedList.muted_users.includes(username)
    );
  } catch (error) {
    console.error("Error checking muted users:", error);
    return false;
  }
}

// 접속 중인 유저 목록 가져오기
export async function getConnectedUsers() {
  try {
    console.log("Fetching connected users..."); // 작업 시작 로그
    const response = await fetch("/api/users/connected/");
    if (!response.ok) {
      throw new Error(`HTTP error! status: ${response.status}`);
    }
    const data = await response.json();
    console.log("Connected users:", data); // 접속 중인 유저 목록 출력
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
