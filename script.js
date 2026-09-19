/* =========================================================
   GRYPHONTUBE
   ========================================================= */

const SUPABASE_URL = "https://jxlhsjikurhlqdqufvtg.supabase.co"; 
const SUPABASE_KEY = "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6Imp4bGhzamlrdXJobHFkcXVmdnRnIiwicm9sZSI6ImFub24iLCJpYXQiOjE3ODk2NDg3MTIsImV4cCI6MjEwNTIyNDcxMn0.1vgRpmh33I3Ke_CxN-RwyhTRh-s8VRrrjora0ifhWW4";

const supabaseClient = window.supabase.createClient(
  SUPABASE_URL,
  SUPABASE_KEY
);


/* =========================================================
   LOCAL USER
   ========================================================= */

let visitorId =
  localStorage.getItem("gryphontube_visitor_id");

if (!visitorId) {
  visitorId = crypto.randomUUID();

  localStorage.setItem(
    "gryphontube_visitor_id",
    visitorId
  );
}


let creatorName =
  localStorage.getItem("gryphontube_creator_name") ||
  "You";


/* =========================================================
   DATA
   ========================================================= */

let videos = [];

let currentVideo = null;

let currentVideoLiked = false;

let currentComments = [];

let currentFilter = "All";


/* =========================================================
   STARTER VIDEO
   ========================================================= */

const starterVideos = [
  {
    id: null,
    storage_path: "video1.mp4",
    title: "Welcome to GryphonTube!",
    creator_name: "GryphonTube",
    video: "video1.mp4",
    thumbnail: "gusty.jpeg",
    views: 0,
    category: "Funny",
    created_at: "2026-01-01T00:00:00Z",
    local: true
  }
];


/* =========================================================
   START
   ========================================================= */

document.addEventListener(
  "DOMContentLoaded",
  function () {

    updateProfileButton();

    loadVideos();

  }
);


/* =========================================================
   LOAD VIDEOS
   ========================================================= */

async function loadVideos() {

  let storageVideos = [];

  try {

    const { data, error } =
      await supabaseClient.storage
        .from("videos")
        .list();

    if (error) {
      console.error("STORAGE LOAD ERROR:", error);
    } else {

      storageVideos = (data || [])
        .filter(file => {
          const name = file.name.toLowerCase();

          return (
            name.endsWith(".mp4") ||
            name.endsWith(".webm") ||
            name.endsWith(".ogg")
          );
        })
        .map(file => {

          const { data: urlData } =
            supabaseClient.storage
              .from("videos")
              .getPublicUrl(file.name);

          return {
            id: null,
            storage_path: file.name,
            title: file.name.replace(/\.[^/.]+$/, ""),
            creator_name: "You",
            video: urlData.publicUrl,
            thumbnail: "gusty.jpeg",
            views: 0,
            category: "Funny",
            created_at:
              file.created_at ||
              file.updated_at ||
              new Date().toISOString(),
            local: false
          };

        });

    }

  } catch (error) {

    console.error("STORAGE ERROR:", error);

  }


  /* ---------------------------------------------
     LOAD DATABASE METADATA
     --------------------------------------------- */

  let dbVideos = [];

  try {

    const { data, error } =
      await supabaseClient
        .from("videos")
        .select("*")
        .order("created_at", {
          ascending: false
        });

    if (error) {

      console.warn(
        "DATABASE VIDEOS NOT AVAILABLE:",
        error.message
      );

    } else {

      dbVideos = data || [];

    }

  } catch (error) {

    console.warn(
      "DATABASE ERROR:",
      error
    );

  }


  /* ---------------------------------------------
     MERGE STORAGE + DATABASE
     --------------------------------------------- */

  const merged = [];

  const usedPaths = new Set();


  for (const storageVideo of storageVideos) {

    const metadata =
      dbVideos.find(
        row =>
          row.storage_path ===
          storageVideo.storage_path
      );


    if (metadata) {

      merged.push({
        ...storageVideo,

        id: metadata.id,

        title: metadata.title ||
          storageVideo.title,

        creator_name:
          metadata.creator_name ||
          "You",

        category:
          metadata.category ||
          "Funny",

        views:
          Number(metadata.views) || 0,

        created_at:
          metadata.created_at ||
          storageVideo.created_at

      });

    } else {

      merged.push(storageVideo);

    }


    usedPaths.add(
      storageVideo.storage_path
    );

  }


  /* ---------------------------------------------
     DATABASE ITEMS THAT ARE STILL THERE
     --------------------------------------------- */

  for (const dbVideo of dbVideos) {

    if (
      usedPaths.has(
        dbVideo.storage_path
      )
    ) {
      continue;
    }


    const { data: urlData } =
      supabaseClient.storage
        .from("videos")
        .getPublicUrl(
          dbVideo.storage_path
        );


    merged.push({

      id: dbVideo.id,

      storage_path:
        dbVideo.storage_path,

      title:
        dbVideo.title,

      creator_name:
        dbVideo.creator_name,

      video:
        urlData.publicUrl,

      thumbnail:
        "gusty.jpeg",

      views:
        Number(dbVideo.views) || 0,

      category:
        dbVideo.category || "Funny",

      created_at:
        dbVideo.created_at,

      local: false

    });

  }


/* ADD STARTER VIDEO ONLY IF IT REALLY EXISTS */

const hasStarter =
  merged.some(
    video =>
      video.storage_path === "video1.mp4"
  );

if (!hasStarter) {
  merged.push(starterVideos[0]);
}


  /* ---------------------------------------------
     SAVE
     --------------------------------------------- */

  videos = merged.sort(
    (a, b) =>
      new Date(b.created_at) -
      new Date(a.created_at)
  );


  displayHomepage();

}


/* =========================================================
   HOMEPAGE
   ========================================================= */

function displayHomepage() {

  displayFeatured();

  displayRecent();

  applyCurrentFilter();

}


/* =========================================================
   FEATURED
   ========================================================= */

function displayFeatured() {

  const container =
    document.getElementById(
      "featuredVideo"
    );

  if (!videos.length) {

    container.innerHTML =
      `<div class="empty-state">
        No videos yet.
      </div>`;

    return;

  }


  const video = videos[0];


  container.innerHTML = `

    <article
      class="featured-card"
      onclick="openVideoByPath('${escapeAttribute(video.storage_path)}')"
    >

      <video
        class="featured-video"
        src="${escapeAttribute(video.video)}"
        muted
        preload="metadata"
      ></video>

      <div class="featured-info">

        <h2>
          ${escapeHtml(video.title)}
        </h2>

        <p>
          ${escapeHtml(video.creator_name)}
        </p>

        <p>
          ${formatViews(video.views)}
          •
          ${formatDate(video.created_at)}
        </p>

        <p>
          Welcome to GryphonTube!
          Watch videos, upload your own,
          and build your channel.
        </p>

      </div>

    </article>

  `;

}


/* =========================================================
   RECENT
   ========================================================= */

function displayRecent() {

  const grid =
    document.getElementById(
      "recentGrid"
    );


  const recent =
    videos.slice(0, 6);


  renderVideoGrid(
    recent,
    grid
  );

}


/* =========================================================
   APPLY FILTER
   ========================================================= */

function applyCurrentFilter() {

  let results = videos;


  if (currentFilter !== "All") {

    results =
      videos.filter(
        video =>
          video.category ===
          currentFilter
      );

  }


  const title =
    document.getElementById(
      "videoSectionTitle"
    );


  title.textContent =
    currentFilter === "All"
      ? "All videos"
      : currentFilter;


  renderVideoGrid(
    results,
    document.getElementById(
      "videoGrid"
    )
  );

}


/* =========================================================
   RENDER GRID
   ========================================================= */

function renderVideoGrid(
  list,
  grid
) {

  grid.innerHTML = "";


  if (!list.length) {

    grid.innerHTML =
      `<div class="empty-state">
        <h2>No videos found</h2>
        <p>Try another category or upload a video.</p>
      </div>`;

    return;

  }


  list.forEach(video => {

    const card =
      document.createElement(
        "article"
      );

    card.className =
      "video-card";


    card.innerHTML = `

      <div class="thumbnail">

        <video
          src="${escapeAttribute(video.video)}"
          muted
          preload="metadata"
        ></video>

        <span
          class="duration"
        >
          --
        </span>

      </div>


      <div class="video-info">

        <div class="channel-icon">
          ${escapeHtml(
            getInitial(video.creator_name)
          )}
        </div>

        <div class="video-text">

          <h2>
            ${escapeHtml(video.title)}
          </h2>

          <p>
            ${escapeHtml(video.creator_name)}
          </p>

          <p>
            ${formatViews(video.views)}
            •
            ${formatDate(video.created_at)}
          </p>

        </div>

      </div>

    `;


    const videoElement =
      card.querySelector(
        ".thumbnail video"
      );


    const durationElement =
      card.querySelector(
        ".duration"
      );


    videoElement.addEventListener(
      "loadedmetadata",
      function () {

        durationElement.textContent =
          formatDuration(
            videoElement.duration
          );

      }
    );


    card.addEventListener(
      "click",
      function () {

        openVideo(video);

      }
    );


    grid.appendChild(card);

  });

}


/* =========================================================
   UPLOAD
   ========================================================= */

async function uploadVideo(event) {

  const file =
    event.target.files[0];


  if (!file) {
    return;
  }


  if (!file.type.startsWith("video/")) {

    alert(
      "Please select a video file."
    );

    event.target.value = "";

    return;

  }


  console.log(
    "Uploading:",
    file.name
  );


  const extension =
    file.name.split(".").pop();


  const safeName =
    file.name
      .replace(
        /[^a-zA-Z0-9._-]/g,
        "_"
      );


  const fileName =
    Date.now() +
    "-" +
    Math.random()
      .toString(36)
      .slice(2, 8) +
    "-" +
    safeName;


  try {

    const { error } =
      await supabaseClient.storage
        .from("videos")
        .upload(
          fileName,
          file
        );


    if (error) {

      console.error(
        "UPLOAD ERROR:",
        error
      );

      alert(
        "Upload failed: " +
        error.message
      );

      event.target.value = "";

      return;

    }


    console.log(
      "UPLOAD SUCCESS!"
    );


    const { data: urlData } =
      supabaseClient.storage
        .from("videos")
        .getPublicUrl(
          fileName
        );


    /* ---------------------------------------------
       DATABASE METADATA
       --------------------------------------------- */

    let databaseVideo = null;


    try {

      const { data, error } =
        await supabaseClient
          .from("videos")
          .insert({

            storage_path:
              fileName,

            title:
              file.name.replace(
                /\.[^/.]+$/,
                ""
              ),

            creator_name:
              creatorName,

            category:
              "Funny",

            views:
              0

          })
          .select()
          .single();


      if (error) {

        console.warn(
          "Metadata save warning:",
          error.message
        );

      } else {

        databaseVideo = data;

      }

    } catch (error) {

      console.warn(
        "Metadata save error:",
        error
      );

    }


    const newVideo = {

      id:
        databaseVideo?.id ||
        null,

      storage_path:
        fileName,

      title:
        file.name.replace(
          /\.[^/.]+$/,
          ""
        ),

      creator_name:
        creatorName,

      video:
        urlData.publicUrl,

      thumbnail:
        "gusty.jpeg",

      views:
        0,

      category:
        "Funny",

      created_at:
        new Date().toISOString(),

      local:
        false

    };


    videos.unshift(
      newVideo
    );


    displayHomepage();

    alert(
      "Video uploaded!"
    );


    openVideo(
      newVideo
    );


  } catch (error) {

    console.error(
      "UPLOAD ERROR:",
      error
    );

    alert(
      "Upload failed: " +
      error.message
    );

  }


  event.target.value = "";

}


/* =========================================================
   OPEN VIDEO
   ========================================================= */

async function openVideo(
  video
) {

  currentVideo =
    video;


  const player =
    document.getElementById(
      "player"
    );


  const mainVideo =
    document.getElementById(
      "mainVideo"
    );


  mainVideo.src =
    video.video;


  document.getElementById(
    "playerTitle"
  ).textContent =
    video.title;


  const creatorButton =
    document.getElementById(
      "playerCreator"
    );


  creatorButton.textContent =
    video.creator_name;


  document.getElementById(
    "playerInfo"
  ).textContent =
    formatViews(video.views) +
    " • " +
    formatDate(video.created_at);


  player.classList.remove(
    "hidden"
  );


  await incrementViews();


  await updateLikeUI();


  await loadComments();


  mainVideo.play()
    .catch(() => {});

}


/* =========================================================
   OPEN BY PATH
   ========================================================= */

function openVideoByPath(
  path
) {

  const video =
    videos.find(
      v =>
        v.storage_path ===
        path
    );


  if (video) {

    openVideo(
      video
    );

  }

}


/* =========================================================
   CLOSE PLAYER
   ========================================================= */

function closePlayer() {

  const mainVideo =
    document.getElementById(
      "mainVideo"
    );


  mainVideo.pause();

  mainVideo.removeAttribute(
    "src"
  );

  mainVideo.load();


  document.getElementById(
    "player"
  ).classList.add(
    "hidden"
  );


  currentVideo =
    null;

}


/* =========================================================
   VIEWS
   ========================================================= */

async function incrementViews() {

  if (!currentVideo) {
    return;
  }


  currentVideo.views =
    Number(currentVideo.views || 0) +
    1;


  if (
    currentVideo.id
  ) {

    const { error } =
      await supabaseClient
        .from("videos")
        .update({
          views:
            currentVideo.views
        })
        .eq(
          "id",
          currentVideo.id
        );


    if (error) {

      console.warn(
        "View update failed:",
        error.message
      );

    }

  }


  document.getElementById(
    "playerInfo"
  ).textContent =
    formatViews(
      currentVideo.views
    ) +
    " • " +
    formatDate(
      currentVideo.created_at
    );

}


/* =========================================================
   LIKE
   ========================================================= */

async function toggleLike() {

  if (!currentVideo) {
    return;
  }


  const button =
    document.getElementById(
      "likeButton"
    );


  if (!currentVideo.id) {

    toggleLocalLike();

    return;

  }


  if (currentVideoLiked) {

    const { error } =
      await supabaseClient
        .from("video_likes")
        .delete()
        .eq(
          "video_id",
          currentVideo.id
        )
        .eq(
          "visitor_id",
          visitorId
        );


    if (error) {

      console.error(
        "Unlike error:",
        error
      );

      return;

    }


    currentVideoLiked =
      false;

  } else {

    const { error } =
      await supabaseClient
        .from("video_likes")
        .insert({

          video_id:
            currentVideo.id,

          visitor_id:
            visitorId

        });


    if (error) {

      console.error(
        "Like error:",
        error
      );

      return;

    }


    currentVideoLiked =
      true;

  }


  await updateLikeUI();

}


/* =========================================================
   LIKE UI
   ========================================================= */

async function updateLikeUI() {

  const button =
    document.getElementById(
      "likeButton"
    );


  if (!currentVideo) {
    return;
  }


  if (!currentVideo.id) {

    const key =
      getLocalLikeKey(
        currentVideo
      );


    const liked =
      localStorage.getItem(
        key
      ) === "1";


    currentVideoLiked =
      liked;


    button.classList.toggle(
      "liked",
      liked
    );


    button.textContent =
      liked
        ? "❤️ Liked"
        : "❤️ Like";

    return;

  }


  const { data, error } =
    await supabaseClient
      .from("video_likes")
      .select(
        "visitor_id"
      )
      .eq(
        "video_id",
        currentVideo.id
      );


  if (error) {

    console.warn(
      "Like load error:",
      error.message
    );

    return;

  }


  const liked =
    (data || []).some(
      row =>
        row.visitor_id ===
        visitorId
    );


  currentVideoLiked =
    liked;


  button.classList.toggle(
    "liked",
    liked
  );


  button.textContent =
    liked
      ? "❤️ Liked"
      : "❤️ Like";

}


/* =========================================================
   LOCAL LIKE
   ========================================================= */

function toggleLocalLike() {

  const key =
    getLocalLikeKey(
      currentVideo
    );


  const liked =
    localStorage.getItem(
      key
    ) === "1";


  if (liked) {

    localStorage.removeItem(
      key
    );

  } else {

    localStorage.setItem(
      key,
      "1"
    );

  }


  updateLikeUI();

}


function getLocalLikeKey(
  video
) {

  return (
    "gryphontube_like_" +
    video.storage_path
  );

}


/* =========================================================
   COMMENTS
   ========================================================= */

async function loadComments() {

  const list =
    document.getElementById(
      "commentList"
    );


  list.innerHTML =
    "<p>Loading comments...</p>";


  if (
    !currentVideo ||
    !currentVideo.id
  ) {

    const key =
      getLocalCommentKey(
        currentVideo
      );


    const stored =
      localStorage.getItem(
        key
      );


    currentComments =
      stored
        ? JSON.parse(stored)
        : [];


    renderComments();

    return;

  }


  const { data, error } =
    await supabaseClient
      .from("video_comments")
      .select("*")
      .eq(
        "video_id",
        currentVideo.id
      )
      .order(
        "created_at",
        {
          ascending: false
        }
      );


  if (error) {

    console.warn(
      "Comments load error:",
      error.message
    );


    currentComments =
      [];


    renderComments();

    return;

  }


  currentComments =
    data || [];


  renderComments();

}


/* =========================================================
   RENDER COMMENTS
   ========================================================= */

function renderComments() {

  const list =
    document.getElementById(
      "commentList"
    );


  list.innerHTML = "";


  if (!currentComments.length) {

    list.innerHTML =
      "<p>No comments yet. Be the first!</p>";

    return;

  }


  currentComments.forEach(
    comment => {

      const div =
        document.createElement(
          "div"
        );


      div.className =
        "comment";


      div.innerHTML = `

        <div>

          <span
            class="comment-name"
          >
            ${escapeHtml(
              comment.creator_name ||
              "User"
            )}
          </span>

          <span
            class="comment-date"
          >
            ${formatDate(
              comment.created_at
            )}
          </span>

        </div>

        <p>
          ${escapeHtml(
            comment.body
          )}
        </p>

      `;


      list.appendChild(
        div
      );

    }
  );

}


/* =========================================================
   ADD COMMENT
   ========================================================= */

async function addComment() {

  if (!currentVideo) {
    return;
  }


  const input =
    document.getElementById(
      "commentInput"
    );


  const text =
    input.value.trim();


  if (!text) {
    return;
  }


  if (!currentVideo.id) {

    const key =
      getLocalCommentKey(
        currentVideo
      );


    const comments =
      JSON.parse(
        localStorage.getItem(
          key
        ) || "[]"
      );


    comments.unshift({

      creator_name:
        creatorName,

      body:
        text,

      created_at:
        new Date().toISOString()

    });


    localStorage.setItem(
      key,
      JSON.stringify(
        comments
      )
    );


    input.value = "";

    await loadComments();

    return;

  }


  const { error } =
    await supabaseClient
      .from("video_comments")
      .insert({

        video_id:
          currentVideo.id,

        visitor_id:
          visitorId,

        creator_name:
          creatorName,

        body:
          text

      });


  if (error) {

    console.error(
      "Comment error:",
      error
    );

    alert(
      "Comment failed: " +
      error.message
    );

    return;

  }


  input.value = "";


  await loadComments();

}


/* =========================================================
   LOCAL COMMENTS
   ========================================================= */

function getLocalCommentKey(
  video
) {

  return (
    "gryphontube_comments_" +
    video.storage_path
  );

}


/* =========================================================
   CHANNEL / PROFILE
   ========================================================= */

function openProfile() {

  document.getElementById(
    "profileNameInput"
  ).value =
    creatorName;


  document.getElementById(
    "profileModal"
  ).classList.remove(
    "hidden"
  );

}


function closeProfile() {

  document.getElementById(
    "profileModal"
  ).classList.add(
    "hidden"
  );

}


function saveProfile() {

  const input =
    document.getElementById(
      "profileNameInput"
    );


  const newName =
    input.value.trim();


  if (!newName) {

    alert(
      "Enter a channel name."
    );

    return;

  }


  creatorName =
    newName;


  localStorage.setItem(
    "gryphontube_creator_name",
    creatorName
  );


  updateProfileButton();

  closeProfile();


  alert(
    "Channel saved!"
  );

}


function updateProfileButton() {

  const button =
    document.getElementById(
      "profileButton"
    );


  if (!button) {
    return;
  }


  button.textContent =
    getInitial(
      creatorName
    );

}


function openOwnChannel() {

  closeProfile();

  openChannel(
    creatorName
  );

}


function openSelectedCreatorChannel() {

  if (!currentVideo) {
    return;
  }


  openChannel(
    currentVideo.creator_name
  );

}


function openChannel(
  name
) {

  const channelVideos =
    videos.filter(
      video =>
        video.creator_name ===
        name
    );


  document.getElementById(
    "channelName"
  ).textContent =
    name;


  document.getElementById(
    "channelIcon"
  ).textContent =
    getInitial(name);


  document.getElementById(
    "channelStats"
  ).textContent =
    channelVideos.length +
    (
      channelVideos.length === 1
        ? " video"
        : " videos"
    );


  renderVideoGrid(
    channelVideos,
    document.getElementById(
      "channelGrid"
    )
  );


  document.getElementById(
    "channelModal"
  ).classList.remove(
    "hidden"
  );

}


function closeChannel() {

  document.getElementById(
    "channelModal"
  ).classList.add(
    "hidden"
  );

}


/* =========================================================
   HOME
   ========================================================= */

function showAll() {

  currentFilter =
    "All";


  document
    .querySelectorAll(
      ".category-bar button"
    )
    .forEach(
      button =>
        button.classList.remove(
          "active"
        )
    );


  const allButton =
    document.querySelector(
      ".category-bar button"
    );


  if (allButton) {
    allButton.classList.add(
      "active"
    );
  }


  displayHomepage();

}


function showRecent() {

  currentFilter =
    "All";


  document.getElementById(
    "videoSectionTitle"
  ).textContent =
    "Recently uploaded";


  renderVideoGrid(
    videos.slice(0, 20),
    document.getElementById(
      "videoGrid"
    )
  );


  window.scrollTo({
    top: 0,
    behavior: "smooth"
  });

}


/* =========================================================
   LIKED
   ========================================================= */

async function showLiked() {

  const likedVideos = [];


  for (
    const video of videos
  ) {

    let liked = false;


    if (video.id) {

      try {

        const { data } =
          await supabaseClient
            .from("video_likes")
            .select("visitor_id")
            .eq(
              "video_id",
              video.id
            )
            .eq(
              "visitor_id",
              visitorId
            )
            .maybeSingle();


        liked =
          !!data;

      } catch (error) {

        liked = false;

      }

    } else {

      liked =
        localStorage.getItem(
          getLocalLikeKey(video)
        ) === "1";

    }


    if (liked) {

      likedVideos.push(
        video
      );

    }

  }


  document.getElementById(
    "videoSectionTitle"
  ).textContent =
    "Liked videos";


  renderVideoGrid(
    likedVideos,
    document.getElementById(
      "videoGrid"
    )
  );

}


/* =========================================================
   CATEGORY
   ========================================================= */

function filterCategory(
  category
) {

  currentFilter =
    category;


  document
    .querySelectorAll(
      ".category-bar button"
    )
    .forEach(
      button =>
        button.classList.remove(
          "active"
        )
    );


  document
    .querySelectorAll(
      ".category-bar button"
    )
    .forEach(
      button => {

        if (
          button.textContent.trim()
            .toLowerCase() ===
          category.toLowerCase()
        ) {

          button.classList.add(
            "active"
          );

        }

      }
    );


  applyCurrentFilter();

}


/* =========================================================
   SEARCH
   ========================================================= */

function searchVideos() {

  const search =
    document.getElementById(
      "searchInput"
    ).value
      .trim()
      .toLowerCase();


  if (!search) {

    showAll();

    return;

  }


  const results =
    videos.filter(
      video =>
        video.title
          .toLowerCase()
          .includes(search) ||

        video.creator_name
          .toLowerCase()
          .includes(search)
    );


  document.getElementById(
    "videoSectionTitle"
  ).textContent =
    "Search results";


  renderVideoGrid(
    results,
    document.getElementById(
      "videoGrid"
    )
  );


  window.scrollTo({
    top: 0,
    behavior: "smooth"
  });

}


/* =========================================================
   DARK MODE
   ========================================================= */

function omega() {

  document.body.classList.toggle(
    "dark-mode"
  );


  localStorage.setItem(
    "gryphontube_dark_mode",
    document.body.classList.contains(
      "dark-mode"
    )
      ? "1"
      : "0"
  );

}


if (
  localStorage.getItem(
    "gryphontube_dark_mode"
  ) === "1"
) {

  document.body.classList.add(
    "dark-mode"
  );

}


/* =========================================================
   MOBILE SIDEBAR
   ========================================================= */

function toggleSidebar() {

  document.getElementById(
    "sidebar"
  ).classList.toggle(
    "open"
  );

}


/* =========================================================
   NOTIFICATIONS
   ========================================================= */

function showNotifications() {

  const box =
    document.getElementById(
      "notificationBox"
    );


  box.classList.remove(
    "hidden"
  );


  setTimeout(
    () => {

      box.classList.add(
        "hidden"
      );

    },
    2500
  );

}


/* =========================================================
   SHARE
   ========================================================= */

async function copyVideoLink() {

  if (!currentVideo) {
    return;
  }


  try {

    await navigator.clipboard.writeText(
      currentVideo.video
    );


    alert(
      "Video link copied!"
    );

  } catch (error) {

    alert(
      "Couldn't copy the link."
    );

  }

}


/* =========================================================
   HELPERS
   ========================================================= */

function formatViews(
  number
) {

  number =
    Number(number || 0);


  if (number >= 1000000) {

    return (
      (number / 1000000)
        .toFixed(1)
        .replace(".0", "") +
      "M views"
    );

  }


  if (number >= 1000) {

    return (
      (number / 1000)
        .toFixed(1)
        .replace(".0", "") +
      "K views"
    );

  }


  return number + " views";

}


function formatDate(
  value
) {

  if (!value) {
    return "Just now";
  }


  const date =
    new Date(value);


  const seconds =
    Math.floor(
      (
        Date.now() -
        date.getTime()
      ) / 1000
    );


  if (seconds < 60) {
    return "Just now";
  }


  const minutes =
    Math.floor(
      seconds / 60
    );


  if (minutes < 60) {

    return (
      minutes +
      (
        minutes === 1
          ? " minute ago"
          : " minutes ago"
      )
    );

  }


  const hours =
    Math.floor(
      minutes / 60
    );


  if (hours < 24) {

    return (
      hours +
      (
        hours === 1
          ? " hour ago"
          : " hours ago"
      )
    );

  }


  const days =
    Math.floor(
      hours / 24
    );


  if (days < 30) {

    return (
      days +
      (
        days === 1
          ? " day ago"
          : " days ago"
      )
    );

  }


  return date.toLocaleDateString();

}


function formatDuration(
  seconds
) {

  if (
    !Number.isFinite(seconds)
  ) {

    return "--";

  }


  seconds =
    Math.floor(seconds);


  const minutes =
    Math.floor(
      seconds / 60
    );


  const secs =
    seconds % 60;


  return (
    minutes +
    ":" +
    String(secs)
      .padStart(2, "0")
  );

}


function getInitial(
  name
) {

  if (!name) {
    return "G";
  }


  return name
    .charAt(0)
    .toUpperCase();

}


function escapeHtml(
  text
) {

  return String(text)
    .replaceAll("&", "&amp;")
    .replaceAll("<", "&lt;")
    .replaceAll(">", "&gt;")
    .replaceAll('"', "&quot;")
    .replaceAll("'", "&#039;");

}


function escapeAttribute(
  text
) {

  return String(text)
    .replaceAll("&", "&amp;")
    .replaceAll('"', "&quot;")
    .replaceAll("<", "&lt;")
    .replaceAll(">", "&gt;")
    .replaceAll("'", "&#039;");

}
