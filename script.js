```javascript
const videos = [];


/* UPLOAD VIDEO */

function uploadVideo(event) {

  const file = event.target.files[0];

  if (!file) {
    return;
  }

  if (!file.type.startsWith("video/")) {

    alert("Please select a video file.");

    return;
  }


  /* Create temporary video URL */

  const videoURL = URL.createObjectURL(file);


  /* Create video information */

  const newVideo = {

    title: file.name.replace(/\.[^/.]+$/, ""),

    creator: "You",

    video: videoURL,

    thumbnail: "",

    views: "0 views",

    date: "Just now",

    category: "Funny"

  };


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
