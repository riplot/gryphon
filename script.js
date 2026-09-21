/* =========================================================
   SUPABASE
   ========================================================= */

const SUPABASE_URL = "https://jxlhsjikurhlqdqufvtg.supabase.co";
const SUPABASE_KEY = "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6Imp4bGhzamlrdXJobHFkcXVmdnRnIiwicm9sZSI6ImFub24iLCJpYXQiOjE3ODk2NDg3MTIsImV4cCI6MjEwNTIyNDcxMn0.1vgRpmh33I3Ke_CxN-RwyhTRh-s8VRrrjora0ifhWW4";




const supabaseClient =
  window.supabase.createClient(
    SUPABASE_URL,
    SUPABASE_KEY
  );


/* =========================================================
   AUTH
   ========================================================= */

let currentUser = null;

let authMode = "signin";


function getRedirectUrl() {

  return (
    window.location.origin +
    window.location.pathname
  );

}


/* =========================================================
   PROFILE
   ========================================================= */

let creatorName =
  localStorage.getItem(
    "gryphontube_creator_name"
  ) || "You";


let creatorBio =
  localStorage.getItem(
    "gryphontube_creator_bio"
  ) ||
  "Welcome to my GryphonTube channel!";


let creatorColor =
  localStorage.getItem(
    "gryphontube_creator_color"
  ) ||
  "#673ab7";


/* =========================================================
   USER ID
   ========================================================= */

let visitorId =
  localStorage.getItem(
    "gryphontube_visitor_id"
  );


if (!visitorId) {

  visitorId =
    crypto.randomUUID();

  localStorage.setItem(
    "gryphontube_visitor_id",
    visitorId
  );

}


/* =========================================================
   DATA
   ========================================================= */

let videos = [];

let currentVideo = null;

let currentVideoLiked = false;

let currentLikeCount = 0;

let currentComments = [];

let currentFilter = "All";


/* =========================================================
   START
   ========================================================= */

document.addEventListener(
  "DOMContentLoaded",
  initializeApp
);


async function initializeApp() {

  const {
    data: {
      session
    }
  } =
    await supabaseClient.auth.getSession();


  applyAuthSession(
    session
  );


  await loadVideos();


  supabaseClient.auth.onAuthStateChange(
    function (
      event,
      session
    ) {

      setTimeout(
        async function () {

          applyAuthSession(
            session
          );

          await loadVideos();


          if (
            event ===
            "SIGNED_IN"
          ) {

            closeAccount();

          }

        },
        0
      );

    }
  );

}


/* =========================================================
   AUTH SESSION
   ========================================================= */

function applyAuthSession(
  session
) {

  currentUser =
    session?.user ||
    null;


  if (currentUser) {

    visitorId =
      currentUser.id;


    const metadata =
      currentUser.user_metadata ||
      {};


    creatorName =
      metadata.creator_name ||
      creatorName ||
      "You";


    creatorBio =
      metadata.bio ||
      creatorBio ||
      "Welcome to my GryphonTube channel!";


    creatorColor =
      metadata.color ||
      creatorColor ||
      "#673ab7";


    localStorage.setItem(
      "gryphontube_creator_name",
      creatorName
    );


    localStorage.setItem(
      "gryphontube_creator_bio",
      creatorBio
    );


    localStorage.setItem(
      "gryphontube_creator_color",
      creatorColor
    );

  }


  updateProfileButton();

}


/* =========================================================
   ACCOUNT
   ========================================================= */

function openAccount() {

  if (currentUser) {

    showLoggedInAccount();

  } else {

    showLoggedOutAccount();

  }


  document.getElementById(
    "accountModal"
  ).classList.remove(
    "hidden"
  );

}


function closeAccount() {

  document.getElementById(
    "accountModal"
  ).classList.add(
    "hidden"
  );

}


function showLoggedOutAccount() {

  document.getElementById(
    "loggedOutAccount"
  ).classList.remove(
    "hidden"
  );


  document.getElementById(
    "loggedInAccount"
  ).classList.add(
    "hidden"
  );


  setAuthMode(
    authMode
  );

}


function showLoggedInAccount() {

  document.getElementById(
    "loggedOutAccount"
  ).classList.add(
    "hidden"
  );


  document.getElementById(
    "loggedInAccount"
  ).classList.remove(
    "hidden"
  );


  document.getElementById(
    "accountEmail"
  ).textContent =
    currentUser.email;


  document.getElementById(
    "accountChannelName"
  ).value =
    creatorName;


  document.getElementById(
    "accountBio"
  ).value =
    creatorBio;


  updateAccountIcon();

}


/* =========================================================
   AUTH MODE
   ========================================================= */

function switchAuthMode() {

  authMode =
    authMode === "signin"
      ? "signup"
      : "signin";


  setAuthMode(
    authMode
  );

}


function setAuthMode(
  mode
) {

  authMode =
    mode;


  const title =
    document.getElementById(
      "authTitle"
    );


  const submit =
    document.getElementById(
      "authSubmitButton"
    );


  const switchButton =
    document.getElementById(
      "authSwitchButton"
    );


  const signupFields =
    document.getElementById(
      "signupFields"
    );


  const status =
    document.getElementById(
      "authStatus"
    );


  status.textContent =
    "";


  if (
    mode ===
    "signup"
  ) {

    title.textContent =
      "Create your GryphonTube account";


    submit.textContent =
      "Create Account";


    switchButton.textContent =
      "Already have an account? Sign In";


    signupFields.classList.remove(
      "hidden"
    );

  } else {

    title.textContent =
      "Sign in to GryphonTube";


    submit.textContent =
      "Sign In";


    switchButton.textContent =
      "Create an account";


    signupFields.classList.add(
      "hidden"
    );

  }

}


/* =========================================================
   SIGN UP / SIGN IN
   ========================================================= */

async function submitAuth() {

  const email =
    document.getElementById(
      "authEmail"
    ).value.trim();


  const password =
    document.getElementById(
      "authPassword"
    ).value;


  const status =
    document.getElementById(
      "authStatus"
    );


  if (!email) {

    status.textContent =
      "Enter your email.";

    return;

  }


  if (
    password.length < 6
  ) {

    status.textContent =
      "Password must be at least 6 characters.";

    return;

  }


  status.textContent =
    "Working...";


  if (
    authMode ===
    "signup"
  ) {

    const channelName =
      document.getElementById(
        "authChannelName"
      ).value.trim();


    const bio =
      document.getElementById(
        "authBio"
      ).value.trim();


    if (!channelName) {

      status.textContent =
        "Enter a channel name.";

      return;

    }


    const {
      data,
      error
    } =
      await supabaseClient.auth.signUp({

        email:
          email,

        password:
          password,

        options: {

          emailRedirectTo:
            getRedirectUrl(),

          data: {

            creator_name:
              channelName,

            bio:
              bio ||
              "Welcome to my GryphonTube channel!",

            color:
              creatorColor

          }

        }

      });


    if (error) {

      status.textContent =
        error.message;

      return;

    }


    if (
      data.session
    ) {

      status.textContent =
        "Account created!";

    } else {

      status.textContent =
        "Account created. Check your email, then sign in.";

    }


  } else {

    const {
      data,
      error
    } =
      await supabaseClient.auth.signInWithPassword({

        email:
          email,

        password:
          password

      });


    if (error) {

      status.textContent =
        error.message;

      return;

    }


    if (
      data.user
    ) {

      status.textContent =
        "Signed in!";

    }

  }

}


/* =========================================================
   SIGN OUT
   ========================================================= */

async function signOut() {

  const {
    error
  } =
    await supabaseClient.auth.signOut();


  if (error) {

    alert(
      "Sign out failed: " +
      error.message
    );

    return;

  }


  currentUser =
    null;


  visitorId =
    crypto.randomUUID();


  updateProfileButton();

  closeAccount();

}


/* =========================================================
   PROFILE
   ========================================================= */

async function saveAccountProfile() {

  if (!currentUser) {
    return;
  }


  const name =
    document.getElementById(
      "accountChannelName"
    ).value.trim();


  const bio =
    document.getElementById(
      "accountBio"
    ).value.trim();


  if (!name) {

    alert(
      "Enter a channel name."
    );

    return;

  }


  const {
    data,
    error
  } =
    await supabaseClient.auth.updateUser({

      data: {

        creator_name:
          name,

        bio:
          bio ||
          "Welcome to my GryphonTube channel!",

        color:
          creatorColor

      }

    });


  if (error) {

    alert(
      "Profile update failed: " +
      error.message
    );

    return;

  }


  creatorName =
    data.user.user_metadata.creator_name;


  creatorBio =
    data.user.user_metadata.bio;


  creatorColor =
    data.user.user_metadata.color;


  localStorage.setItem(
    "gryphontube_creator_name",
    creatorName
  );


  localStorage.setItem(
    "gryphontube_creator_bio",
    creatorBio
  );


  localStorage.setItem(
    "gryphontube_creator_color",
    creatorColor
  );


  updateProfileButton();

  updateAccountIcon();


  alert(
    "Profile saved!"
  );

}


function chooseProfileColor(
  color
) {

  creatorColor =
    color;


  localStorage.setItem(
    "gryphontube_creator_color",
    creatorColor
  );


  updateProfileButton();

  updateAccountIcon();

}


function updateAccountIcon() {

  const icon =
    document.getElementById(
      "accountIcon"
    );


  if (!icon) {
    return;
  }


  icon.textContent =
    getInitial(
      creatorName
    );


  icon.style.background =
    creatorColor;

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


  button.style.background =
    currentUser
      ? creatorColor
      : "#673ab7";

}


/* =========================================================
   LOAD VIDEOS
   ========================================================= */

async function loadVideos() {

  let storageVideos = [];

  let dbVideos = [];


  try {

    const {
      data,
      error
    } =
      await supabaseClient.storage
        .from("videos")
        .list();


    if (error) {

      console.error(
        "STORAGE LOAD ERROR:",
        error
      );

    } else {

      storageVideos =
        (data || [])
          .filter(
            file => {

              const name =
                file.name.toLowerCase();


              return (
                name.endsWith(".mp4") ||
                name.endsWith(".webm") ||
                name.endsWith(".ogg")
              );

            }
          )
          .map(
            file => {

              const {
                data: urlData
              } =
                supabaseClient.storage
                  .from("videos")
                  .getPublicUrl(
                    file.name
                  );


              return {

                id:
                  null,

                storage_path:
                  file.name,

                title:
                  file.name.replace(
                    /\.[^/.]+$/,
                    ""
                  ),

                creator_name:
                  "You",

                video:
                  urlData.publicUrl,

                thumbnail:
                  "gusty.jpeg",

                views:
                  0,

                category:
                  "Funny",

                created_at:
                  file.created_at ||
                  file.updated_at ||
                  new Date().toISOString()

              };

            }
          );

    }

  } catch (error) {

    console.error(
      "STORAGE ERROR:",
      error
    );

  }


  try {

    const {
      data,
      error
    } =
      await supabaseClient
        .from("videos")
        .select("*")
        .order(
          "created_at",
          {
            ascending: false
          }
        );


    if (!error) {

      dbVideos =
        data || [];

    } else {

      console.warn(
        "DATABASE VIDEOS:",
        error.message
      );

    }

  } catch (error) {

    console.warn(
      "DATABASE ERROR:",
      error
    );

  }


  const merged = [];

  const usedPaths =
    new Set();


  for (
    const storageVideo
    of storageVideos
  ) {

    const metadata =
      dbVideos.find(
        row =>
          row.storage_path ===
          storageVideo.storage_path
      );


    if (metadata) {

      merged.push({

        ...storageVideo,

        id:
          metadata.id,

        title:
          metadata.title ||
          storageVideo.title,

        creator_name:
          metadata.creator_name ||
          "You",

        category:
          metadata.category ||
          "Funny",

        views:
          Number(
            metadata.views
          ) || 0,

        created_at:
          metadata.created_at ||
          storageVideo.created_at

      });

    } else {

      merged.push(
        storageVideo
      );

    }


    usedPaths.add(
      storageVideo.storage_path
    );

  }


  videos =
    merged.sort(
      (a, b) =>
        new Date(
          b.created_at
        ) -
        new Date(
          a.created_at
        )
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


function displayFeatured() {

  const container =
    document.getElementById(
      "featuredVideo"
    );


  if (!videos.length) {

    container.innerHTML =
      `
        <div class="empty-state">

          <h2>
            No videos yet
          </h2>

          <p>
            Sign in and upload your first video!
          </p>

        </div>
      `;

    return;

  }


  const video =
    videos[0];


  container.innerHTML =
    `
      <article
        class="featured-card"
        onclick="openVideoByPath('${escapeAttribute(video.storage_path)}')"
      >

        <video
          class="featured-video"
          src="${escapeAttribute(video.video)}"
          poster="${escapeAttribute(video.thumbnail)}"
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

        </div>

      </article>
    `;

}


function displayRecent() {

  renderVideoGrid(
    videos.slice(
      0,
      6
    ),

    document.getElementById(
      "recentGrid"
    )
  );

}


function applyCurrentFilter() {

  let results =
    videos;


  if (
    currentFilter !==
    "All"
  ) {

    results =
      videos.filter(
        video =>
          video.category ===
          currentFilter
      );

  }


  document.getElementById(
    "videoSectionTitle"
  ).textContent =
    currentFilter ===
    "All"
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
   VIDEO CARDS
   ========================================================= */

function renderVideoGrid(
  list,
  grid
) {

  grid.innerHTML =
    "";


  if (!list.length) {

    grid.innerHTML =
      `
        <div class="empty-state">

          <h2>
            No videos found
          </h2>

          <p>
            Upload a video or try another category.
          </p>

        </div>
      `;

    return;

  }


  list.forEach(
    video => {

      const card =
        document.createElement(
          "article"
        );


      card.className =
        "video-card";


      card.innerHTML =
        `
          <div class="thumbnail">

            <video
              class="video-preview"
              src="${escapeAttribute(video.video)}"
              poster="${escapeAttribute(video.thumbnail)}"
              muted
              preload="metadata"
              playsinline
            ></video>


            <span class="preview-play">
              ▶
            </span>


            <span class="duration">
              --
            </span>


            <span class="category-badge">
              ${escapeHtml(
                video.category ||
                "Funny"
              )}
            </span>

          </div>


          <div class="video-info">

            <div
              class="channel-icon"
              style="background:${getCreatorColor(video.creator_name)}"
            >
              ${escapeHtml(
                getInitial(
                  video.creator_name
                )
              )}
            </div>


            <div class="video-text">

              <h2>
                ${escapeHtml(
                  video.title
                )}
              </h2>


              <p class="creator-name">
                ${escapeHtml(
                  video.creator_name
                )}
              </p>


              <p>
                ${formatViews(
                  video.views
                )}
                •
                ${formatDate(
                  video.created_at
                )}
              </p>

            </div>

          </div>
        `;


      const preview =
        card.querySelector(
          ".video-preview"
        );


      const duration =
        card.querySelector(
          ".duration"
        );


      preview.addEventListener(
        "loadedmetadata",
        function () {

          duration.textContent =
            formatDuration(
              preview.duration
            );

        }
      );


      card.addEventListener(
        "mouseenter",
        function () {

          preview.currentTime =
            0;

          preview.play()
            .catch(
              () => {}
            );

        }
      );


      card.addEventListener(
        "mouseleave",
        function () {

          preview.pause();

          preview.currentTime =
            0;

        }
      );


      card.addEventListener(
        "click",
        function () {

          openVideo(
            video
          );

        }
      );


      grid.appendChild(
        card
      );

    }
  );

}


/* =========================================================
   UPLOAD
   ========================================================= */

async function uploadVideo(
  event
) {

  if (!currentUser) {

    event.target.value =
      "";

    alert(
      "You need an account to upload a video."
    );

    openAccount();

    return;

  }


  const file =
    event.target.files[0];


  if (!file) {
    return;
  }


  if (
    !file.type.startsWith(
      "video/"
    )
  ) {

    alert(
      "Please select a video file."
    );

    event.target.value =
      "";

    return;

  }


  console.log(
    "Uploading:",
    file.name
  );


  const safeName =
    file.name.replace(
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

    const {
      error
    } =
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

      event.target.value =
        "";

      return;

    }


    console.log(
      "UPLOAD SUCCESS!"
    );


    const {
      data: urlData
    } =
      supabaseClient.storage
        .from("videos")
        .getPublicUrl(
          fileName
        );


    const {
      data,
      error: metadataError
    } =
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


    if (metadataError) {

      console.warn(
        "Metadata save warning:",
        metadataError.message
      );

    }


    const newVideo = {

      id:
        data?.id ||
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
        new Date().toISOString()

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


  event.target.value =
    "";

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


  creatorButton.style.color =
    getCreatorColor(
      video.creator_name
    );


  document.getElementById(
    "playerInfo"
  ).textContent =
    formatViews(
      video.views
    ) +
    " • " +
    formatDate(
      video.created_at
    );


  player.classList.remove(
    "hidden"
  );


  mainVideo.load();


  mainVideo.play()
    .catch(
      error =>
        console.warn(
          "Playback:",
          error
        )
    );


  incrementViews();

  updateLikeUI();

  loadComments();

}


/* =========================================================
   OPEN BY PATH
   ========================================================= */

function openVideoByPath(
  path
) {

  const video =
    videos.find(
      item =>
        item.storage_path ===
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

  if (
    !currentVideo ||
    !currentVideo.id
  ) {

    return;

  }


  currentVideo.views =
    Number(
      currentVideo.views ||
      0
    ) + 1;


  const {
    error
  } =
    await supabaseClient
      .rpc(
        "increment_video_views",
        {
          target_video_id:
            currentVideo.id
        }
      );


  if (error) {

    console.warn(
      "View update failed:",
      error.message
    );

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
   LIKES
   ========================================================= */

async function toggleLike() {

  if (!currentUser) {

    alert(
      "Sign in to like videos."
    );

    openAccount();

    return;

  }


  if (
    !currentVideo ||
    !currentVideo.id
  ) {

    return;

  }


  if (
    currentVideoLiked
  ) {

    const {
      error
    } =
      await supabaseClient
        .from("video_likes")
        .delete()
        .eq(
          "video_id",
          currentVideo.id
        )
        .eq(
          "visitor_id",
          currentUser.id
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


    currentLikeCount =
      Math.max(
        0,
        currentLikeCount - 1
      );


  } else {

    const {
      error
    } =
      await supabaseClient
        .from("video_likes")
        .insert({

          video_id:
            currentVideo.id,

          visitor_id:
            currentUser.id

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


    currentLikeCount +=
      1;

  }


  updateLikeButton();

}


/* =========================================================
   LIKE UI + COUNT
   ========================================================= */

async function updateLikeUI() {

  const button =
    document.getElementById(
      "likeButton"
    );


  if (!currentVideo) {
    return;
  }


  if (!currentUser) {

    currentVideoLiked =
      false;

    currentLikeCount =
      await getLikeCount(
        currentVideo.id
      );


    updateLikeButton();

    return;

  }


  if (!currentVideo.id) {

    currentVideoLiked =
      false;

    currentLikeCount =
      0;

    updateLikeButton();

    return;

  }


  const [
    likeStatus,
    likeCount
  ] =
    await Promise.all([

      supabaseClient
        .from("video_likes")
        .select(
          "visitor_id"
        )
        .eq(
          "video_id",
          currentVideo.id
        )
        .eq(
          "visitor_id",
          currentUser.id
        )
        .maybeSingle(),

      getLikeCount(
        currentVideo.id
      )

    ]);


  if (
    likeStatus.error
  ) {

    console.warn(
      "Like status error:",
      likeStatus.error.message
    );

  }


  currentVideoLiked =
    !!likeStatus.data;


  currentLikeCount =
    likeCount;


  updateLikeButton();

}


function updateLikeButton() {

  const button =
    document.getElementById(
      "likeButton"
    );


  if (!button) {
    return;
  }


  if (!currentUser) {

    button.textContent =
      `🔒 Sign in to Like (${currentLikeCount})`;

    button.classList.remove(
      "liked"
    );

    return;

  }


  button.textContent =
    currentVideoLiked
      ? `❤️ Liked (${currentLikeCount})`
      : `❤️ Like (${currentLikeCount})`;


  button.classList.toggle(
    "liked",
    currentVideoLiked
  );

}


async function getLikeCount(
  videoId
) {

  if (!videoId) {
    return 0;
  }


  const {
    count,
    error
  } =
    await supabaseClient
      .from("video_likes")
      .select(
        "*",
        {
          count:
            "exact",
          head:
            true
        }
      )
      .eq(
        "video_id",
        videoId
      );


  if (error) {

    console.warn(
      "Like count error:",
      error.message
    );

    return 0;

  }


  return count || 0;

}


/* =========================================================
   COMMENTS
   ========================================================= */

async function loadComments() {

  const list =
    document.getElementById(
      "commentList"
    );


  if (!currentVideo) {
    return;
  }


  if (
    !currentVideo.id
  ) {

    list.innerHTML =
      "<p>No comments yet.</p>";

    return;

  }


  list.innerHTML =
    "<p>Loading comments...</p>";


  const {
    data,
    error
  } =
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
          ascending:
            false
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


function renderComments() {

  const list =
    document.getElementById(
      "commentList"
    );


  list.innerHTML =
    "";


  if (
    !currentComments.length
  ) {

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


      div.innerHTML =
        `
          <div>

            <span class="comment-name">
              ${escapeHtml(
                comment.creator_name ||
                "User"
              )}
            </span>

            <span class="comment-date">
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


async function addComment() {

  if (!currentUser) {

    alert(
      "Sign in to comment."
    );

    openAccount();

    return;

  }


  if (
    !currentVideo ||
    !currentVideo.id
  ) {

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


  const {
    error
  } =
    await supabaseClient
      .from("video_comments")
      .insert({

        video_id:
          currentVideo.id,

        visitor_id:
          currentUser.id,

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


  input.value =
    "";


  await loadComments();

}


/* =========================================================
   CHANNELS
   ========================================================= */

function openOwnChannel() {

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


  const icon =
    document.getElementById(
      "channelIcon"
    );


  icon.textContent =
    getInitial(
      name
    );


  icon.style.background =
    getCreatorColor(
      name
    );


  document.getElementById(
    "channelStats"
  ).textContent =
    channelVideos.length +
    (
      channelVideos.length ===
      1
        ? " video"
        : " videos"
    );


  document.getElementById(
    "channelBio"
  ).textContent =
    getChannelBio(
      name
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


function getChannelBio(
  name
) {

  if (
    name ===
    creatorName
  ) {

    return creatorBio;

  }


  return "";

}


function getCreatorColor(
  name
) {

  if (
    name ===
    creatorName
  ) {

    return creatorColor;

  }


  return "#673ab7";

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

  document.getElementById(
    "videoSectionTitle"
  ).textContent =
    "Recently uploaded";


  renderVideoGrid(

    videos.slice(
      0,
      20
    ),

    document.getElementById(
      "videoGrid"
    )

  );

}


/* =========================================================
   LIKED VIDEOS
   ========================================================= */

async function showLiked() {

  if (!currentUser) {

    alert(
      "Sign in to see your liked videos."
    );

    openAccount();

    return;

  }


  const likedVideos =
    [];


  for (
    const video
    of videos
  ) {

    if (!video.id) {
      continue;
    }


    const {
      data
    } =
      await supabaseClient
        .from("video_likes")
        .select(
          "visitor_id"
        )
        .eq(
          "video_id",
          video.id
        )
        .eq(
          "visitor_id",
          currentUser.id
        )
        .maybeSingle();


    if (data) {

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
      button => {

        button.classList.remove(
          "active"
        );


        if (
          button.textContent
            .trim()
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

    top:
      0,

    behavior:
      "smooth"

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
  ) ===
  "1"
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
    function () {

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
    Number(
      number ||
      0
    );


  if (
    number >=
    1000000
  ) {

    return (
      (
        number /
        1000000
      )
        .toFixed(1)
        .replace(
          ".0",
          ""
        ) +
      "M views"
    );

  }


  if (
    number >=
    1000
  ) {

    return (
      (
        number /
        1000
      )
        .toFixed(1)
        .replace(
          ".0",
          ""
        ) +
      "K views"
    );

  }


  return (
    number +
    " views"
  );

}


function formatDate(
  value
) {

  if (!value) {
    return "Just now";
  }


  const date =
    new Date(
      value
    );


  const seconds =
    Math.floor(
      (
        Date.now() -
        date.getTime()
      ) /
      1000
    );


  if (
    seconds < 60
  ) {

    return "Just now";

  }


  const minutes =
    Math.floor(
      seconds /
      60
    );


  if (
    minutes < 60
  ) {

    return (
      minutes +
      (
        minutes ===
        1
          ? " minute ago"
          : " minutes ago"
      )
    );

  }


  const hours =
    Math.floor(
      minutes /
      60
    );


  if (
    hours < 24
  ) {

    return (
      hours +
      (
        hours ===
        1
          ? " hour ago"
          : " hours ago"
      )
    );

  }


  const days =
    Math.floor(
      hours /
      24
    );


  if (
    days < 30
  ) {

    return (
      days +
      (
        days ===
        1
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
    !Number.isFinite(
      seconds
    )
  ) {

    return "--";

  }


  seconds =
    Math.floor(
      seconds
    );


  const minutes =
    Math.floor(
      seconds /
      60
    );


  const secs =
    seconds %
    60;


  return (
    minutes +
    ":" +
    String(
      secs
    ).padStart(
      2,
      "0"
    )
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

  return String(
    text
  )
    .replaceAll(
      "&",
      "&amp;"
    )
    .replaceAll(
      "<",
      "&lt;"
    )
    .replaceAll(
      ">",
      "&gt;"
    )
    .replaceAll(
      '"',
      "&quot;"
    )
    .replaceAll(
      "'",
      "&#039;"
    );

}


function escapeAttribute(
  text
) {

  return String(
    text
  )
    .replaceAll(
      "&",
      "&amp;"
    )
    .replaceAll(
      '"',
      "&quot;"
    )
    .replaceAll(
      "<",
      "&lt;"
    )
    .replaceAll(
      ">",
      "&gt;"
    )
    .replaceAll(
      "'",
      "&#039;"
    );

}
