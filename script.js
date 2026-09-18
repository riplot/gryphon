const SUPABASE_URL = "https://jxlhsjikurhlqdqufvtg.supabase.co";
const SUPABASE_KEY = "sb_publishable_HNTCe0KVE4Pemi9Z7DKAFw_NKgAS-Gp";

const supabaseClient = window.supabase.createClient(
  SUPABASE_URL,
  SUPABASE_KEY
);

let videos = [];


/* LOAD SAVED VIDEOS */
async function loadVideos() {
  const { data, error } = await supabaseClient.storage
    .from("videos")
    .list();

  if (error) {
    console.error("LOAD ERROR:", error);
    return;
  }

  videos = data.map(file => {
    const { data: urlData } = supabaseClient.storage
      .from("videos")
      .getPublicUrl(file.name);

    return {
      title: file.name.replace(/\.[^/.]+$/, ""),
      creator: "You",
      video: urlData.publicUrl,
      thumbnail: "gusty.jpeg",
      views: "0 views",
      date: "Uploaded",
      category: "Funny"
    };
  });

  displayVideos(videos);
}


/* UPLOAD VIDEO */
async function uploadVideo(event) {
  const file = event.target.files[0];

  if (!file) return;

  if (!file.type.startsWith("video/")) {
    alert("Please select a video file.");
    return;
  }

  console.log("Uploading:", file.name);

  const fileName =
    Date.now() + "-" + file.name.replace(/[^a-zA-Z0-9._-]/g, "_");

  const { error } = await supabaseClient.storage
    .from("videos")
    .upload(fileName, file);

  if (error) {
    console.error("UPLOAD ERROR:", error);
    alert("Upload failed: " + error.message);
    event.target.value = "";
    return;
  }

  console.log("UPLOAD SUCCESS!");

  alert("Video uploaded!");

  await loadVideos();

  const uploadedVideo = videos.find(v =>
    v.video.includes(fileName)
  );

  if (uploadedVideo) {
    openVideo(uploadedVideo);
  }

  event.target.value = "";
}


/* DISPLAY VIDEOS */
function displayVideos(list) {
  const grid = document.getElementById("videoGrid");

  grid.innerHTML = "";

  if (list.length === 0) {
    grid.innerHTML = "<h2>No videos yet.</h2>";
    return;
  }

  list.forEach(video => {
    const card = document.createElement("article");

    card.className = "video-card";

    card.innerHTML = `
      <div class="thumbnail">
        <video src="${video.video}" muted preload="metadata"></video>
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


/* OPEN VIDEO */
function openVideo(video) {
  const player = document.getElementById("player");
  const mainVideo = document.getElementById("mainVideo");

  mainVideo.src = video.video;

  document.getElementById("playerTitle").textContent = video.title;
  document.getElementById("playerCreator").textContent = video.creator;
  document.getElementById("playerInfo").textContent =
    video.views + " • " + video.date;

  player.classList.remove("hidden");

  mainVideo.play().catch(() => {});
}


/* CLOSE VIDEO */
function closePlayer() {
  const mainVideo = document.getElementById("mainVideo");

  mainVideo.pause();
  mainVideo.removeAttribute("src");
  mainVideo.load();

  document.getElementById("player").classList.add("hidden");
}


/* SEARCH */
function searchVideos() {
  const search =
    document.getElementById("searchInput").value.toLowerCase();

  const results = videos.filter(video =>
    video.title.toLowerCase().includes(search) ||
    video.creator.toLowerCase().includes(search)
  );

  displayVideos(results);
}


/* CATEGORY */
function filterCategory(category) {
  const results = videos.filter(
    video => video.category === category
  );

  displayVideos(results);
}


/* HOME */
function showAll() {
  displayVideos(videos);
}


/* DARK MODE */
function omega() {
  document.body.classList.toggle("dark-mode");
}


/* START */
loadVideos();
