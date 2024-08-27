// auth.js

async function isTokenValid() {
  const token = localStorage.getItem("accessToken");
  if (!token) return false;

  const payload = await JSON.parse(atob(token.split(".")[1]));
  if (payload.exp) {
    return payload.exp * 1000 > Date.now();
  }

  return true; // 만료 시간이 없으면 유효하다고 가정
}

// 토큰 갱신 함수
async function refreshToken() {
  console.log("refreshToken!!");
  try {
    const refreshToken = localStorage.getItem("refreshToken");
    console.log("refreshToken : ", refreshToken);
    if (!refreshToken) {
      throw new Error("No refresh token available");
    }

    const response = await fetch("/api/token/refresh/", {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
      },
      body: JSON.stringify({ refresh: refreshToken }),
    });

    if (!response.ok) {
      throw new Error("Failed to refresh token");
    }

    const data = await response.json();
    localStorage.setItem("accessToken", data.access);
    // 필요하다면 refresh 토큰도 갱신할 수 있습니다.
    // localStorage.setItem("refreshToken", data.refresh);

    return true;
  } catch (error) {
    console.error("Error refreshing token:", error);
    // 토큰 갱신에 실패했을 때 사용자를 로그아웃 시키거나 다른 처리를 할 수 있습니다.
    logout();
    return false;
  }
}

// 로그아웃 함수
function logout() {
  console.log("logout!!");
  localStorage.removeItem("accessToken");
  localStorage.removeItem("refreshToken");
  localStorage.removeItem("username");
  // 로그아웃 후 로그인 페이지로 리다이렉트 또는 다른 필요한 처리
  window.location.href = "/login";
}

// 인증된 API 요청을 보내는 함수
// export async function authenticatedFetch(url, options = {}) {
//   if (!isTokenValid()) {
//     const refreshed = await refreshToken();
//     if (!refreshed) {
//       throw new Error("Authentication failed");
//     }
//   }

//   const token = localStorage.getItem("accessToken");
//   const headers = {
//     ...options.headers,
//     Authorization: `Bearer ${token}`,
//   };

//   return await fetch(url, { ...options, headers });
// }

/// 새로고침 수정!
export async function authenticatedFetch(url, options = {}) {
  let retries = 3;
  while (retries > 0) {
    if (!(await isTokenValid())) {
      const refreshed = await refreshToken();
      if (!refreshed) {
        retries--;
        if (retries === 0) {
          logout();
          throw new Error("Authentication failed");
        }
        await new Promise((resolve) => setTimeout(resolve, 1000)); // 1초 대기
        continue;
      }
    }
    const token = localStorage.getItem("accessToken");
    const headers = {
      ...options.headers,
      Authorization: `Bearer ${token}`,
    };

    try {
      return await fetch(url, { ...options, headers });
    } catch (error) {
      retries--;
      if (retries === 0) throw error;
      await new Promise((resolve) => setTimeout(resolve, 1000)); // 1초 대기
    }
  }
}
