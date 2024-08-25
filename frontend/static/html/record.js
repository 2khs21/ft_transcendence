// 전체 리스트 목록 가져오기
async function getPongRecords() {
  try {
    const response = await fetch("/api/users/pong-record/", {
      method: "GET",
      headers: {
        Authorization: `Bearer ${localStorage.getItem("accessToken")}`,
        "Content-Type": "application/json",
      },
    });
    if (!response.ok) {
      throw new Error(`HTTP error! status: ${response.status}`);
    }
    const data = await response.json();
    console.log("Pong records:", data);
    return data;
  } catch (error) {
    console.error("Error fetching pong records:", error);
    throw error; // 에러를 상위로 전파
  }
}

// 새로운 레코드 만들어 저장하기
async function createPongRecord(winnerUsername, loserUsername) {
  try {
    const response = await fetch("/api/users/pong-record/", {
      method: "POST",
      headers: {
        Authorization: `Bearer ${localStorage.getItem("accessToken")}`,
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
    throw error; // 에러를 상위로 전파
  }
}

// 특정 사용자가 포함된 게임 기록만 필터링하는 함수
function filterUserGames(records, username) {
  return records.filter(
    (record) =>
      record.winner_username === username || record.loser_username === username
  );
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

// 사용 예시
async function displayUserStats(username) {
  try {
    const allRecords = await getPongRecords();
    const userGames = filterUserGames(allRecords, username);
    const winRate = calculateWinRate(allRecords, username);
    console.log(`${username}'s games:`, userGames);
    console.log(`${username}'s win rate: ${winRate}%`);
  } catch (error) {
    console.error("Error displaying user stats:", error);
  }
}

// 함수 호출 예시
// displayUserStats("player1");
