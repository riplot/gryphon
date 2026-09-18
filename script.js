```javascript
const SUPABASE_URL = "https://jxlhsjikurhlqdqufvtg.supabase.co";
const SUPABASE_KEY = "sb_publishable_HNTCe0KVE4Pemi9Z7DKAFw_NKgAS-Gp";

const supabaseClient = supabase.createClient(
  SUPABASE_URL,
  SUPABASE_KEY
);

const videos = [];

/* UPLOAD VIDEO */
async function uploadVideo(event) {
alert("UPLOAD FUNCTION STARTED");

  const file = event.target.files[0];

  if (!file) return;

  if (!file.type.startsWith("video/")) {
    alert("Please select a video file.");
    return;
  }

  // Give the video a unique filename
  const fileName = Date.now() + "-" + file.name;

  // Upload the video to Supabase
  const { data, error } = await supabaseClient.storage
    .from("videos")
    .upload(fileName, file);
    console.log("UPLOAD RESULT:", data, error);


  // Get the public video URL
  const { data: publicURL } = supabaseClient.storage
    .from("videos")
    .getPublicUrl(fileName);

  const newVideo = {
    title: file.name.replace(/\.[^/.]+$/, ""),
    creator: "You",
    video: publicURL.publicUrl,
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


  /* Add video */

  videos.unshift(newVideo);


  /* Update homepage */

  displayVideos(videos);


  /* Open video */

  openVideo(newVideo);


  /* Allow another upload */

  event.target.value = "";

}


/* DISPLAY VIDEOS */

function displayVideos(list) {

  const grid = document.getElementById("videoGrid");

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

        <video src="${video.video}"></video>

      </div>

      <div class="video-info">

        <div class="channel-icon">
          Y
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


  mainVideo.play();

}


/* CLOSE VIDEO */

function closePlayer() {

  const mainVideo =
    document.getElementById("mainVideo");

  mainVideo.pause();

  mainVideo.src = "";

  document.getElementById("player")
    .classList.add("hidden");

}


/* SEARCH */

function searchVideos() {

  const search =
    document.getElementById("searchInput")
      .value
      .toLowerCase();


  const results =
    videos.filter(video =>

      video.title
        .toLowerCase()
        .includes(search)

      ||

      video.creator
        .toLowerCase()
        .includes(search)

    );


  displayVideos(results);

}


/* CATEGORY */

function filterCategory(category) {

  const results =
    videos.filter(video =>
      video.category === category
    );


  displayVideos(results);

}


/* HOME */

function showAll() {

  displayVideos(videos);

}


/* DARK MODE */

function omega() {

  document.body
    .classList
    .toggle("dark-mode");

}


/* START */

displayVideos(videos);
```
