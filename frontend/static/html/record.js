import { authenticatedFetch } from "./auth.js";
import { getUsername } from "./profile.js";
// 전체 리스트 목록 가져오기
async function getPongRecords() {
  try {
    const response = await authenticatedFetch("/api/users/pong-record/");
    if (!response.ok) {
      throw new Error(`HTTP error! status: ${response.status}`);
    }
    const data = await response.json();
    console.log("Pong records:", data);
    return data;
  } catch (error) {
    console.error("Error fetching pong records:", error);
    throw error;
  }
}

// 새로운 레코드 만들어 저장하기
export async function createPongRecord(winnerUsername, loserUsername) {
  try {
    const response = await authenticatedFetch("/api/users/pong-record/", {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
      },
      body: JSON.stringify({
        winner: winnerUsername,
        loser: loserUsername,
      }),
    });
    if (!response.ok) {
      throw new Error(`HTTP error! status: ${response.status}`);
    }
    const data = await response.json();
    console.log("New pong record created:", data);
    return data;
  } catch (error) {
    console.error("Error creating pong record:", error);
    throw error;
  }
}

// 특정 사용자가 포함된 게임 기록만 필터링하는 함수
function filterUserGames(records, username) {
  console.log("fileter usergames " + username);

  console.log(
    records.filter(
      (record) =>
        record.winner_username === username ||
        record.loser_username === username
    )
  );
  return records.filter(
    (record) =>
      record.winner_username === username || record.loser_username === username
  );
}

export async function getWinRate(username) {
  try {
    const allRecords = await getPongRecords();
    return calculateWinRate(allRecords, username);
  } catch (error) {
    console.error("Error calculating win rate:", error);
    return null;
  }
}

// 특정 사용자의 승률을 계산하는 함수
function calculateWinRate(records, username) {
  const userGames = filterUserGames(records, username);
  const totalGames = userGames.length;
  const wins = userGames.filter(
    (record) => record.winner_username === username
  ).length;
  if (totalGames === 0) {
    return 0;
  }
  const winRate = (wins / totalGames) * 100;
  return winRate.toFixed(2); // 소수점 두 자리까지 반환
}

// Record 탭 렌더링 함수
export async function renderRecord(container) {
  try {
    const allRecords = await getPongRecords();
    // const currentUsername = localStorage.getItem("username"); // 현재 로그인한 사용자의 username을 가져옵니다.
    const currentUsername = await getUsername();
    const userGames = filterUserGames(allRecords, currentUsername);
    const winRate = calculateWinRate(allRecords, currentUsername);
    console.log("User games:", userGames);
    console.log("Win rate:", winRate);
    console.log("Current username:", currentUsername);
    console.log("All records:", allRecords);
    console.log("User games:", userGames);
    let html = `
      <h2>${currentUsername}'s Game Records</h2>
      <p>Win Rate: ${winRate}%</p>
      <table>
        <thead>
          <tr>
            <th>Winner</th>
            <th>Loser</th>
            <th>Date</th>
          </tr>
        </thead>
        <tbody>
    `;

    userGames.forEach((game) => {
      html += `
        <tr>
          <td>${game.winner_username}</td>
          <td>${game.loser_username}</td>
          <td>${new Date(game.end_time).toLocaleString()}</td>
        </tr>
      `;
    });

    html += `
        </tbody>
      </table>
    `;

    container.innerHTML = html;
  } catch (error) {
    console.error("Error rendering record tab:", error);
    container.innerHTML =
      "<p>Failed to load game records. Please try again later.</p>";
  }
}
