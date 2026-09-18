const SUPABASE_URL = "https://jxlhsjikurhlqdqufvtg.supabase.co"; 
const SUPABASE_KEY = "sb_publishable_HNTCe0KVE4Pemi9Z7DKAFw_NKgAS-Gp";

const supabaseClient = supabase.createClient(
  SUPABASE_URL,
  SUPABASE_KEY
);

const videos = [];

/* ==========================================
   LOAD SAVED VIDEOS FROM SUPABASE
   ========================================== */

async function loadVideos() {
  const { data, error } = await supabaseClient.storage
    .from("videos")
    .list("", {
      limit: 100,
      sortBy: {
        column: "created_at",
        order: "desc"
      }
    });

  if (error) {
    console.error("LOAD ERROR:", error);
    return;
  }

  videos.length = 0;

  data.forEach(file => {
    if (!file.name) return;

    const { data: publicData } =
      supabaseClient.storage
        .from("videos")
        .getPublicUrl(file.name);

    videos.push({
      title: file.name
        .replace(/^\d+-/, "")
        .replace(/\.[^/.]+$/, ""),
      creator: "You",
      video: publicData.publicUrl,
      thumbnail: "",
      views: "0 views",
      date: "Uploaded",
      category: "Funny"
    });
  });

  displayVideos(videos);
}


/* ==========================================
   UPLOAD VIDEO
   ========================================== */

async function uploadVideo(event) {

  const file = event.target.files[0];

  if (!file) return;

  if (!file.type.startsWith("video/")) {
    alert("Please select a video file.");
    return;
  }

  const fileName =
    Date.now() + "-" + file.name;

  console.log("Uploading:", fileName);

  const { data, error } =
    await supabaseClient.storage
      .from("videos")
      .upload(fileName, file);

  console.log("UPLOAD RESULT:", data, error);

  if (error) {
    console.error("UPLOAD ERROR:", error);
    alert("Upload failed: " + error.message);
    return;
  }

  const { data: publicData } =
    supabaseClient.storage
      .from("videos")
      .getPublicUrl(fileName);

  const newVideo = {
    title: file.name
      .replace(/\.[^/.]+$/, ""),
    creator: "You",
    video: publicData.publicUrl,
    thumbnail: "",
    views: "0 views",
    date: "Just now",
    category: "Funny"
  };

  videos.unshift(newVideo);

  displayVideos(videos);

  openVideo(newVideo);

  event.target.value = "";

  alert("🎉 Video uploaded to GryphonTube!");
}


/* ==========================================
   DISPLAY VIDEOS
   ========================================== */

function displayVideos(list) {

  const grid =
    document.getElementById("videoGrid");

  grid.innerHTML = "";

  if (list.length === 0) {
    grid.innerHTML =
      "<h2>Upload a video to get started! ⬆️</h2>";
    return;
  }

  list.forEach(video => {

    const card =
      document.createElement("article");

    card.className = "video-card";

    card.innerHTML = `
      <div class="thumbnail">
        <video src="${video.video}" preload="metadata"></video>
      </div>

      <div class="video-info">

        <div class="channel-icon">
          ${video.creator.charAt(0).toUpperCase()}
        </div>

        <div>
          <h2>${video.title}</h2>
          <p>${video.creator}</p>
          <p>${video.views} • ${video.date}</p>
        </div>

      </div>
    `;

    card.onclick = function() {
      openVideo(video);
    };

    grid.appendChild(card);
  });
}


/* ==========================================
   OPEN VIDEO
   ========================================== */

function openVideo(video) {

  const player =
    document.getElementById("player");

  const mainVideo =
    document.getElementById("mainVideo");

  mainVideo.src = video.video;

  document.getElementById("playerTitle")
    .textContent = video.title;

  document.getElementById("playerCreator")
    .textContent = video.creator;

  document.getElementById("playerInfo")
    .textContent =
      video.views + " • " + video.date;

  player.classList.remove("hidden");

  mainVideo.play().catch(() => {});
}


/* ==========================================
   CLOSE VIDEO
   ========================================== */

function closePlayer() {

  const mainVideo =
    document.getElementById("mainVideo");

  mainVideo.pause();
  mainVideo.removeAttribute("src");
  mainVideo.load();

  document.getElementById("player")
    .classList.add("hidden");
}


/* ==========================================
   SEARCH
   ========================================== */

function searchVideos() {

  const search =
    document.getElementById("searchInput")
      .value
      .toLowerCase();

  const results =
    videos.filter(video =>
      video.title.toLowerCase().includes(search) ||
      video.creator.toLowerCase().includes(search)
    );

  displayVideos(results);
}


/* ==========================================
   CATEGORY
   ========================================== */

function filterCategory(category) {

  const results =
    videos.filter(video =>
      video.category === category
    );

  displayVideos(results);
}


/* ==========================================
   HOME
   ========================================== */

function showAll() {
  displayVideos(videos);
}


/* ==========================================
   DARK MODE
   ========================================== */

function omega() {
  document.body.classList.toggle("dark-mode");
}


/* ==========================================
   START
   ========================================== */

loadVideos();
