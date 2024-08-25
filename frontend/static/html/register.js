// register.js

export function renderRegister(container) {
  container.innerHTML = `
    <h2>Register</h2>
    <div id="emailVerificationSection">
      <form id="emailVerificationForm">
        <input type="email" id="email" placeholder="Email" required>
        <button type="submit">Send Verification Code</button>
      </form>
      <form id="verificationCodeForm" style="display:none;">
        <input type="text" id="verificationCode" placeholder="Verification Code" required>
        <button type="submit">Verify Code</button>
      </form>
    </div>
    <form id="registerForm" style="display:none;">
      <input type="text" id="username" placeholder="Username" required>
      <input type="password" id="password" placeholder="Password" required>
      <input type="password" id="password2" placeholder="Confirm Password" required>
      <button type="submit">Register</button>
    </form>
  `;

  // 이메일 인증 코드 전송
  document
    .getElementById("emailVerificationForm")
    .addEventListener("submit", async (e) => {
      e.preventDefault();
      const email = document.getElementById("email").value;
      try {
        const response = await fetch("/api/users/send-verification/", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({ email }),
        });
        if (response.ok) {
          alert("Verification code sent. Please check your email.");
          document.getElementById("verificationCodeForm").style.display =
            "block";
        } else {
          const data = await response.json();
          alert(data.detail || "Failed to send verification code");
        }
      } catch (error) {
        console.error("Error:", error);
        alert("An error occurred. Please try again.");
      }
    });

  // 이메일 인증 코드 확인
  document
    .getElementById("verificationCodeForm")
    .addEventListener("submit", async (e) => {
      e.preventDefault();
      const email = document.getElementById("email").value;
      const code = document.getElementById("verificationCode").value;
      try {
        const response = await fetch("/api/users/verify-email/", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({ email, code }),
        });
        if (response.ok) {
          alert(
            "Email verified successfully. You can now complete your registration."
          );
          document.getElementById("emailVerificationSection").style.display =
            "none";
          document.getElementById("registerForm").style.display = "block";
        } else {
          const data = await response.json();
          alert(data.detail || "Failed to verify email");
        }
      } catch (error) {
        console.error("Error:", error);
        alert("An error occurred. Please try again.");
      }
    });

  // 사용자 등록
  document
    .getElementById("registerForm")
    .addEventListener("submit", async (e) => {
      e.preventDefault();
      const email = document.getElementById("email").value;
      const username = document.getElementById("username").value;
      const password = document.getElementById("password").value;
      const password2 = document.getElementById("password2").value;
      console.log(email, username, password, password2);
      try {
        const response = await fetch("/api/users/register/", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({ username, email, password, password2 }),
        });
        if (response.ok) {
          alert(
            "Registration successful! You will be redirected to the login page."
          );
          window.location.href = "/login"; // 로그인 페이지로 리다이렉트
        } else {
          const data = await response.json();
          alert(data.detail || "Registration failed");
        }
      } catch (error) {
        console.error("Error:", error);
        alert("An error occurred. Please try again.");
      }
    });
}
