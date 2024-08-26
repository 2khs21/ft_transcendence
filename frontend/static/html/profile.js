//profile.js

import { authenticatedFetch } from "./auth.js";

async function fetchUsername() {
  try {
    const profileData = await fetchProfileData();
    if (profileData && profileData.username) {
      return profileData.username;
    } else {
      throw new Error("Username not found in the profile data");
    }
  } catch (error) {
    console.error("Error:", error);
    return null;
  }
}
export async function getUsername() {
  let username = await fetchUsername();
  return username;
  // console.log("Username:", username);
  // 여기서 username을 사용할 수 있습니다.
}

async function fetchProfileData() {
  try {
    const response = await authenticatedFetch(`/api/users/profile/`);
    console.log("auth fetch test");
    if (!response.ok) {
      throw new Error("Failed to fetch profile data");
    }
    return await response.json();
  } catch (error) {
    console.error("Error:", error);
    return null;
  }
}
async function updateProfile(formData) {
  try {
    const response = await authenticatedFetch(`/api/users/profile/`, {
      method: "PUT",
      body: formData,
    });
    if (!response.ok) {
      const errorData = await response.json();
      throw new Error(errorData.detail || "Failed to update profile");
    }
    return await response.json();
  } catch (error) {
    console.error("Error:", error);
    throw error;
  }
}

export async function renderProfile(container) {
  const profile = await fetchProfileData();
  if (!profile) {
    container.innerHTML =
      "<p>Failed to load profile. Please try again later.</p>";
    return;
  }

  container.innerHTML = `
			<h2>Profile Page</h2>
			<div id="profile-info">
					<img id="profile-image" src="${
            profile.profile_image_url
          }" alt="Profile Image" style="width: 200px; height: 200px;">
					<p>Username: ${profile.username}</p>
					<p id="status-message">Status: ${
            profile.status_message || "No status message"
          }</p>
			</div>
			<form id="profile-form">
					<input type="file" id="image-upload" accept="image/*">
					<input type="text" id="status-input" placeholder="Update status message" value="${
            profile.status_message || ""
          }">
					<button type="submit">Update Profile</button>
			</form>
	`;

  const form = container.querySelector("#profile-form");
  form.addEventListener("submit", async (e) => {
    e.preventDefault();
    const formData = new FormData();
    const imageFile = document.getElementById("image-upload").files[0];
    const statusMessage = document.getElementById("status-input").value;

    if (imageFile) {
      formData.append("profile_image", imageFile);
    }
    formData.append("status_message", statusMessage);

    try {
      const updatedProfile = await updateProfile(formData);
      document.getElementById("profile-image").src =
        updatedProfile.profile_image_url;
      document.getElementById("status-message").textContent = `Status: ${
        updatedProfile.status_message || "No status message"
      }`;
      alert("Profile updated successfully!");
    } catch (error) {
      alert(`Failed to update profile: ${error.message}`);
    }
  });
}
