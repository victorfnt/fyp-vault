// ==========================================
// 1. CONFIGURATION
// ==========================================
const CLOUDINARY_CLOUD_NAME = "dyegq6xw";
const CLOUDINARY_UPLOAD_PRESET = "fyp_vault";

const firebaseConfig = {
  apiKey: "AIzaSyBHljbY33GxGFDzi505gllarcEz6_BGfrc",
  authDomain: "fyp-memories-2026.firebaseapp.com",
  projectId: "fyp-memories-2026",
  storageBucket: "fyp-memories-2026.firebasestorage.app",
  messagingSenderId: "458813745302",
  appId: "1:458813745302:web:489338ad9d662750a37ab7"
};

// ==========================================
// 2. INITIALIZE FIREBASE
// ==========================================
firebase.initializeApp(firebaseConfig);
const db = firebase.firestore();

// ==========================================
// 3. UI ELEMENTS
// ==========================================
const memoryForm = document.getElementById("memoryForm");
const submitBtn = document.getElementById("submitBtn");
const statusMessage = document.getElementById("statusMessage");
const galleryGrid = document.getElementById("galleryGrid");
const photoCount = document.getElementById("photoCount");

const lightboxModal = document.getElementById("lightboxModal");
const lightboxImg = document.getElementById("lightboxImg");
const lightboxCaption = document.getElementById("lightboxCaption");
const closeLightbox = document.getElementById("closeLightbox");
const downloadBtn = document.getElementById("downloadBtn");

// Lightbox dismiss helper (restores page scrolling)
const closeGalleryLightbox = () => {
  lightboxModal.classList.remove("active");
  document.body.style.overflow = "auto";
};

closeLightbox.addEventListener("click", closeGalleryLightbox);
lightboxModal.addEventListener("click", (e) => {
  if (e.target === lightboxModal) {
    closeGalleryLightbox();
  }
});
document.addEventListener("keydown", (e) => {
  if (e.key === "Escape") {
    closeGalleryLightbox();
  }
});

// ==========================================
// 4. HANDLE UPLOADS
// ==========================================
memoryForm.addEventListener("submit", async (e) => {
  e.preventDefault();

  const name = document.getElementById("uploaderName").value.trim();
  const eventTag = document.getElementById("eventTag").value;
  const caption = document.getElementById("caption").value.trim();
  const fileInput = document.getElementById("imageInput");
  const file = fileInput.files[0];

  if (!file) {
    statusMessage.innerText = "Please select an image.";
    return;
  }

  submitBtn.disabled = true;
  statusMessage.innerText = "Uploading photo to the cloud...";
  statusMessage.style.color = "#0284c7";

  try {
    const formData = new FormData();
    formData.append("file", file);
    formData.append("upload_preset", CLOUDINARY_UPLOAD_PRESET);

    const uploadUrl = `https://api.cloudinary.com/v1_1/${CLOUDINARY_CLOUD_NAME}/image/upload`;
    const response = await fetch(uploadUrl, {
      method: "POST",
      body: formData
    });

    if (!response.ok) {
      throw new Error("Cloudinary upload failed. Check Cloud Name & Preset.");
    }

    const cloudData = await response.json();
    const photoUrl = cloudData.secure_url;

    statusMessage.innerText = "Saving memory...";

    await db.collection("memories").add({
      uploader: name,
      event: eventTag,
      caption: caption || "Captured moment 📸",
      imageUrl: photoUrl,
      createdAt: firebase.firestore.FieldValue.serverTimestamp()
    });

    statusMessage.innerText = "Uploaded successfully! 🎉";
    statusMessage.style.color = "#059669";
    memoryForm.reset();
  } catch (error) {
    console.error("Error:", error);
    statusMessage.innerText = "Upload failed. Check console (F12) for details.";
    statusMessage.style.color = "#dc2626";
  } finally {
    submitBtn.disabled = false;
  }
});

// ==========================================
// 5. SYNC GALLERY & LIGHTBOX CLICK
// ==========================================
db.collection("memories").onSnapshot((snapshot) => {
  galleryGrid.innerHTML = "";
  photoCount.innerText = `${snapshot.size} photos`;

  if (snapshot.empty) {
    galleryGrid.innerHTML = "<p style='color:#64748b; grid-column: 1/-1; text-align:center;'>No memories shared yet. Be the first!</p>";
    return;
  }

  snapshot.forEach((doc) => {
    const data = doc.data();
    const card = document.createElement("div");
    card.className = "card";
    card.innerHTML = `
      <img src="${data.imageUrl}" alt="Memory by ${data.uploader}" loading="lazy">
      <div class="card-body">
        <span class="card-tag">${data.event}</span>
        <p class="card-caption">${data.caption}</p>
        <span class="card-author">Uploaded by <strong>${data.uploader}</strong></span>
      </div>
    `;

    const imgElement = card.querySelector("img");
    imgElement.addEventListener("click", () => {
      lightboxImg.src = data.imageUrl;
      lightboxCaption.innerHTML = `<strong>${data.uploader}</strong>: ${data.caption || "Captured moment"}`;
      downloadBtn.href = data.imageUrl;
      lightboxModal.classList.add("active");
      document.body.style.overflow = "hidden"; // Locks screen to prevent page shifting
    });

    galleryGrid.appendChild(card);
  });
}, (err) => {
  console.error("Firestore listener error:", err);
});