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

let currentUser =
  null;

let authMode =
  "signin";


/* =========================================================
   PROFILE
   ========================================================= */

let creatorName =
  localStorage.getItem(
    "gryphontube_creator_name"
  ) ||
  "You";

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
   APP DATA
   ========================================================= */

let videos = [];

let currentVideo =
  null;

let currentVideoLiked =
  false;

let currentLikeCount =
  0;

let currentComments =
  [];

let currentFilter =
  "All";


/* =========================================================
   SUBSCRIPTIONS
   ========================================================= */

let currentChannelCreatorId =
  null;

let currentChannelCreatorName =
  null;


/* =========================================================
   LIVE
   ========================================================= */

let activeLiveSession =
  null;

let liveRole =
  null;

let liveChannel =
  null;

let localLiveStream =
  null;

let liveViewerIds =
  new Set();

let livePeerConnections =
  new Map();

let liveViewerPeer =
  null;

let liveBroadcasterId =
  null;

let liveParticipantId =
  null;


/* =========================================================
   START
   ========================================================= */

document.addEventListener(
  "DOMContentLoaded",
  initializeApp
);


async function initializeApp() {

  const search =
    document.getElementById(
      "searchInput"
    );

  if (search) {
    search.value = "";
  }


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

  await loadLiveSessions();


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

          await loadLiveSessions();


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
    authMode ===
    "signin"
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
    password.length <
    6
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

        email,

        password,

        options: {

          emailRedirectTo:
            window.location.origin +
            window.location.pathname,

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


    if (data.session) {

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

        email,

        password

      });


    if (error) {

      status.textContent =
        error.message;

      return;

    }


    if (data.user) {

      status.textContent =
        "Signed in!";

    }

  }

}


/* =========================================================
   SIGN OUT
   ========================================================= */

async function signOut() {

  await supabaseClient.auth.signOut();

  currentUser =
    null;

  updateProfileButton();

  closeAccount();

  displayHomepage();

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


  await supabaseClient
    .from("videos")
    .update({
      creator_name:
        creatorName
    })
    .eq(
      "creator_id",
      currentUser.id
    );


  updateProfileButton();

  updateAccountIcon();

  await loadVideos();

  closeAccount();


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

                creator_id:
                  null,

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
            ascending:
              false
          }
        );


    if (!error) {

      dbVideos =
        data || [];

    }

  } catch (error) {

    console.warn(
      "DATABASE ERROR:",
      error
    );

  }


  const merged = [];


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

        creator_id:
          metadata.creator_id ||
          null,

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
          ) ||
          0,

        created_at:
          metadata.created_at ||
          storageVideo.created_at

      });

    } else {

      merged.push(
        storageVideo
      );

    }

  }


  videos =
    merged.sort(
      (a,b) =>
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
          <h2>No videos yet</h2>
          <p>Upload your first video!</p>
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
          <h2>No videos found</h2>
          <p>Try another category.</p>
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
      "You need an account to upload."
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
      "Please select a video."
    );

    event.target.value =
      "";

    return;

  }


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
      .slice(2,8) +
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

      return;

    }


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

          creator_id:
            currentUser.id,

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
        "Metadata warning:",
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

      creator_id:
        currentUser.id,

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


  document.getElementById(
    "playerCreator"
  ).textContent =
    video.creator_name;


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
      () => {}
    );


  displayRelatedVideos();

  updateLikeUI();

  updateCurrentSubscribeUI();

  updateSaveButton();

  incrementViews();

  loadComments();

}


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
   RELATED / UP NEXT
   ========================================================= */

function displayRelatedVideos() {

  const grid =
    document.getElementById(
      "relatedGrid"
    );


  grid.innerHTML =
    "";


  if (!currentVideo) {
    return;
  }


  const related =
    videos
      .filter(
        video =>
          video.storage_path !==
          currentVideo.storage_path
      )
      .sort(
        (a,b) => {

          let aScore =
            0;

          let bScore =
            0;


          if (
            a.category ===
            currentVideo.category
          ) {
            aScore += 5;
          }


          if (
            b.category ===
            currentVideo.category
          ) {
            bScore += 5;
          }


          if (
            a.creator_id &&
            a.creator_id ===
            currentVideo.creator_id
          ) {
            aScore += 4;
          }


          if (
            b.creator_id &&
            b.creator_id ===
            currentVideo.creator_id
          ) {
            bScore += 4;
          }


          return bScore - aScore;

        }
      )
      .slice(
        0,
        10
      );


  related.forEach(
    video => {

      const item =
        document.createElement(
          "article"
        );


      item.className =
        "related-card";


      item.innerHTML =
        `
          <div class="related-thumb">

            <video
              src="${escapeAttribute(video.video)}"
              muted
              preload="metadata"
            ></video>

          </div>


          <div class="related-info">

            <h3>
              ${escapeHtml(
                video.title
              )}
            </h3>

            <p>
              ${escapeHtml(
                video.creator_name
              )}
            </p>

            <p>
              ${formatViews(
                video.views
              )}
            </p>

          </div>
        `;


      item.addEventListener(
        "click",
        function () {

          openVideo(
            video
          );

        }
      );


      grid.appendChild(
        item
      );

    }
  );

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
      "View update:",
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
        error
      );

      return;

    }


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
        error
      );

      return;

    }

  }


  await updateLikeUI();

}


async function updateLikeUI() {

  if (!currentVideo) {
    return;
  }


  const button =
    document.getElementById(
      "likeButton"
    );


  if (
    !currentUser ||
    !currentVideo.id
  ) {

    button.textContent =
      "🔒 Sign in to Like";

    return;

  }


  const [
    mine,
    count
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


  currentVideoLiked =
    !!mine.data;


  currentLikeCount =
    count;


  button.textContent =
    currentVideoLiked
      ? `❤️ Liked (${count})`
      : `❤️ Like (${count})`;


  button.classList.toggle(
    "liked",
    currentVideoLiked
  );

}


async function getLikeCount(
  videoId
) {

  const {
    count
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


  return count ||
    0;

}


/* =========================================================
   SUBSCRIPTIONS
   ========================================================= */

async function toggleCurrentSubscription() {

  if (!currentVideo) {
    return;
  }


  await toggleSubscription(
    currentVideo.creator_id,
    currentVideo.creator_name
  );

}


async function toggleSubscription(
  creatorId,
  creatorNameValue
) {

  if (!currentUser) {

    alert(
      "Sign in to subscribe."
    );

    openAccount();

    return;

  }


  if (!creatorId) {

    alert(
      "This channel was created before channel accounts were added."
    );

    return;

  }


  if (
    creatorId ===
    currentUser.id
  ) {

    return;

  }


  const {
    data: existing
  } =
    await supabaseClient
      .from(
        "channel_subscriptions"
      )
      .select(
        "creator_id"
      )
      .eq(
        "subscriber_id",
        currentUser.id
      )
      .eq(
        "creator_id",
        creatorId
      )
      .maybeSingle();


  if (existing) {

    await supabaseClient
      .from(
        "channel_subscriptions"
      )
      .delete()
      .eq(
        "subscriber_id",
        currentUser.id
      )
      .eq(
        "creator_id",
        creatorId
      );

  } else {

    await supabaseClient
      .from(
        "channel_subscriptions"
      )
      .insert({

        subscriber_id:
          currentUser.id,

        creator_id:
          creatorId,

        creator_name:
          creatorNameValue

      });

  }


  await updateCurrentSubscribeUI();

  await loadLiveSessions();

}


async function updateCurrentSubscribeUI() {

  if (!currentVideo) {
    return;
  }


  updateSubscribeUI(
    "subscribeButton",
    "playerSubscriberCount",
    currentVideo.creator_id,
    currentVideo.creator_name
  );

}


async function updateSubscribeUI(
  buttonId,
  countId,
  creatorId,
  creatorNameValue
) {

  const button =
    document.getElementById(
      buttonId
    );


  const countElement =
    document.getElementById(
      countId
    );


  if (!button) {
    return;
  }


  if (!creatorId) {

    button.textContent =
      "Subscribe unavailable";

    button.disabled =
      true;

    return;

  }


  if (
    currentUser &&
    creatorId ===
    currentUser.id
  ) {

    button.textContent =
      "Your Channel";

    button.disabled =
      true;

  } else if (!currentUser) {

    button.textContent =
      "🔒 Sign in to Subscribe";

    button.disabled =
      false;

  } else {

    const {
      data
    } =
      await supabaseClient
        .from(
          "channel_subscriptions"
        )
        .select(
          "creator_id"
        )
        .eq(
          "subscriber_id",
          currentUser.id
        )
        .eq(
          "creator_id",
          creatorId
        )
        .maybeSingle();


    const subscribed =
      !!data;


    button.textContent =
      subscribed
        ? "✓ Subscribed"
        : "Subscribe";


    button.classList.toggle(
      "subscribed",
      subscribed
    );


    button.disabled =
      false;

  }


  const count =
    await getSubscriberCount(
      creatorId
    );


  if (countElement) {

    countElement.textContent =
      count +
      (
        count === 1
          ? " subscriber"
          : " subscribers"
      );

  }

}


async function getSubscriberCount(
  creatorId
) {

  if (!creatorId) {
    return 0;
  }


  const {
    data,
    error
  } =
    await supabaseClient
      .rpc(
        "get_subscriber_count",
        {
          target_creator_id:
            creatorId
        }
      );


  if (error) {

    console.warn(
      "Subscriber count:",
      error.message
    );

    return 0;

  }


  return Number(
    data ||
    0
  );

}


/* =========================================================
   CHANNEL
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


async function openChannel(
  name
) {

  const channelVideos =
    videos.filter(
      video =>
        video.creator_name ===
        name
    );


  currentChannelCreatorId =
    channelVideos[0]?.creator_id ||
    (
      name ===
      creatorName &&
      currentUser
        ? currentUser.id
        : null
    );


  currentChannelCreatorName =
    name;


  document.getElementById(
    "channelName"
  ).textContent =
    name;


  document.getElementById(
    "channelIcon"
  ).textContent =
    getInitial(
      name
    );


  document.getElementById(
    "channelIcon"
  ).style.background =
    getCreatorColor(
      name
    );


  const subscriberCount =
    await getSubscriberCount(
      currentChannelCreatorId
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
    ) +
    " • " +
    subscriberCount +
    (
      subscriberCount ===
      1
        ? " subscriber"
        : " subscribers"
    );


  document.getElementById(
    "channelBio"
  ).textContent =
    getChannelBio(
      name
    );


  await updateSubscribeUI(
    "channelSubscribeButton",
    null,
    currentChannelCreatorId,
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


async function toggleChannelSubscription() {

  await toggleSubscription(
    currentChannelCreatorId,
    currentChannelCreatorName
  );


  await openChannel(
    currentChannelCreatorName
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


/* =========================================================
   SUBSCRIPTIONS PAGE
   ========================================================= */

async function showSubscriptions() {
  if (!currentUser) {
    alert("Sign in to see your subscriptions.");
    openAccount();
    return;
  }

  const { data, error } = await supabaseClient
    .from("channel_subscriptions")
    .select("creator_id")
    .eq("subscriber_id", currentUser.id);

  if (error) {
    console.error("Subscriptions error:", error);
    return;
  }

  const creatorIds = (data || []).map(
    row => row.creator_id
  );

  const subscribedVideos = videos.filter(
    video => creatorIds.includes(video.creator_id)
  );

  document.getElementById("videoSectionTitle").textContent =
    "Subscriptions";

  renderVideoGrid(
    subscribedVideos,
    document.getElementById("videoGrid")
  );

  window.scrollTo({
    top: 0,
    behavior: "smooth"
  });
}


/* =========================================================
   WATCH LATER
   ========================================================= */

function getWatchLaterKey() {

  return (
    "gryphontube_watch_later_" +
    (
      currentUser
        ? currentUser.id
        : "guest"
    )
  );

}


function getWatchLater() {

  try {

    return JSON.parse(
      localStorage.getItem(
        getWatchLaterKey()
      ) ||
      "[]"
    );

  } catch {

    return [];

  }

}


function isSavedForLater(
  path
) {

  return getWatchLater()
    .includes(
      path
    );

}


function toggleWatchLater() {

  if (!currentVideo) {
    return;
  }


  const saved =
    getWatchLater();


  if (
    saved.includes(
      currentVideo.storage_path
    )
  ) {

    const updated =
      saved.filter(
        path =>
          path !==
          currentVideo.storage_path
      );


    localStorage.setItem(
      getWatchLaterKey(),
      JSON.stringify(
        updated
      )
    );

  } else {

    saved.push(
      currentVideo.storage_path
    );


    localStorage.setItem(
      getWatchLaterKey(),
      JSON.stringify(
        saved
      )
    );

  }


  updateSaveButton();

}


function updateSaveButton() {

  const button =
    document.getElementById(
      "saveButton"
    );


  if (!button) {
    return;
  }


  if (
    currentVideo &&
    isSavedForLater(
      currentVideo.storage_path
    )
  ) {

    button.textContent =
      "✓ Saved";

  } else {

    button.textContent =
      "💾 Save";

  }

}
function showWatchLater() {
  const paths = getWatchLater();

  const savedVideos = videos.filter(
    video => paths.includes(video.storage_path)
  );

  document.getElementById("videoSectionTitle").textContent =
    "Watch later";

  renderVideoGrid(
    savedVideos,
    document.getElementById("videoGrid")
  );

  window.scrollTo({
    top: 0,
    behavior: "smooth"
  });
}




/* =========================================================
   CATEGORIES
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


  const first =
    document.querySelector(
      ".category-bar button"
    );


  if (first) {

    first.classList.add(
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
          .includes(
            search
          ) ||

        video.creator_name
          .toLowerCase()
          .includes(
            search
          )
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

}


/* =========================================================
   LIVE SESSIONS
   ========================================================= */

async function loadLiveSessions() {

  const section =
    document.getElementById(
      "liveSection"
    );


  const grid =
    document.getElementById(
      "liveGrid"
    );


  if (
    !currentUser
  ) {

    section.classList.add(
      "hidden"
    );

    return;

  }


  const {
    data,
    error
  } =
    await supabaseClient
      .from(
        "live_sessions"
      )
      .select("*")
      .eq(
        "status",
        "live"
      )
      .order(
        "started_at",
        {
          ascending:
            false
        }
      );


  if (error) {

    section.classList.add(
      "hidden"
    );

    return;

  }


  const sessions =
    data || [];


  if (!sessions.length) {

    section.classList.add(
      "hidden"
    );

    return;

  }


  section.classList.remove(
    "hidden"
  );


  grid.innerHTML =
    "";


  sessions.forEach(
    session => {

      const card =
        document.createElement(
          "article"
        );


      card.className =
        "live-card";


      card.innerHTML =
        `
          <div class="live-card-preview">
            🔴
          </div>

          <div class="live-card-info">

            <span class="live-pill">
              LIVE
            </span>

            <h2>
              ${escapeHtml(
                session.title
              )}
            </h2>

            <p>
              ${escapeHtml(
                session.streamer_name
              )}
            </p>

            <p>
              ${escapeHtml(
                session.category
              )}
            </p>

          </div>
        `;


      card.addEventListener(
        "click",
        function () {

          openLiveViewer(
            session
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
   LIVE SETUP
   ========================================================= */

function openLiveSetup() {

  if (!currentUser) {

    alert(
      "Sign in before going live."
    );

    openAccount();

    return;

  }


  document.getElementById(
    "liveSetupPanel"
  ).classList.remove(
    "hidden"
  );


  document.getElementById(
    "liveStudio"
  ).classList.add(
    "hidden"
  );


  document.getElementById(
    "liveViewer"
  ).classList.add(
    "hidden"
  );


  document.getElementById(
    "liveSetupStatus"
  ).textContent =
    "";


  document.getElementById(
    "liveModal"
  ).classList.remove(
    "hidden"
  );

}


async function startLive(
  mode
) {

  if (!currentUser) {
    return;
  }


  const title =
    document.getElementById(
      "liveTitleInput"
    ).value.trim();


  const category =
    document.getElementById(
      "liveCategoryInput"
    ).value;


  const status =
    document.getElementById(
      "liveSetupStatus"
    );


  if (!title) {

    status.textContent =
      "Enter a stream title.";

    return;

  }


  status.textContent =
    "Requesting camera/screen permission...";


  try {

    if (
      mode ===
      "camera"
    ) {

      localLiveStream =
        await navigator.mediaDevices.getUserMedia({

          video:
            true,

          audio:
            true

        });

    } else {

      localLiveStream =
        await navigator.mediaDevices.getDisplayMedia({

          video:
            true,

          audio:
            true

        });

    }


  } catch (error) {

    status.textContent =
      "Media permission failed: " +
      error.message;

    return;

  }


  const {
    data: session,
    error
  } =
    await supabaseClient
      .from(
        "live_sessions"
      )
      .insert({

        streamer_id:
          currentUser.id,

        streamer_name:
          creatorName,

        title,

        category,

        status:
          "live"

      })
      .select()
      .single();


  if (error) {

    localLiveStream
      .getTracks()
      .forEach(
        track =>
          track.stop()
      );


    localLiveStream =
      null;


    status.textContent =
      "Could not create live session: " +
      error.message;

    return;

  }


  activeLiveSession =
    session;


  liveRole =
    "broadcaster";


  liveParticipantId =
    crypto.randomUUID();


  liveViewerIds =
    new Set();


  livePeerConnections =
    new Map();


  document.getElementById(
    "liveSetupPanel"
  ).classList.add(
    "hidden"
  );


  document.getElementById(
    "liveStudio"
  ).classList.remove(
    "hidden"
  );


  document.getElementById(
    "liveStudioTitle"
  ).textContent =
    title;


  document.getElementById(
    "liveLocalVideo"
  ).srcObject =
    localLiveStream;


  updateLiveViewerCount();


  liveChannel =
    supabaseClient.channel(
      "live:" +
      session.id
    );


  setupBroadcasterChannel();


}


/* =========================================================
   BROADCASTER CHANNEL
   ========================================================= */

function setupBroadcasterChannel() {

  liveChannel
    .on(
      "broadcast",
      {
        event:
          "viewer-join"
      },
      async ({
        payload
      }) => {

        if (
          !payload ||
          !payload.viewerId
        ) {
          return;
        }


        liveViewerIds.add(
          payload.viewerId
        );


        updateLiveViewerCount();


        await sendViewerOffer(
          payload.viewerId
        );

      }
    )
    .on(
      "broadcast",
      {
        event:
          "viewer-leave"
      },
      ({
        payload
      }) => {

        if (
          !payload ||
          !payload.viewerId
        ) {
          return;
        }


        closeViewerConnection(
          payload.viewerId
        );


        liveViewerIds.delete(
          payload.viewerId
        );


        updateLiveViewerCount();

      }
    )
    .on(
      "broadcast",
      {
        event:
          "answer"
      },
      async ({
        payload
      }) => {

        if (
          payload?.to !==
          liveParticipantId
        ) {
          return;
        }


        const pc =
          livePeerConnections.get(
            payload.from
          );


        if (
          pc &&
          payload.answer
        ) {

          await pc.setRemoteDescription(
            payload.answer
          );

        }

      }
    )
    .on(
      "broadcast",
      {
        event:
          "ice"
      },
      async ({
        payload
      }) => {

        if (
          payload?.to !==
          liveParticipantId
        ) {
          return;
        }


        const pc =
          livePeerConnections.get(
            payload.from
          );


        if (
          pc &&
          payload.candidate
        ) {

          try {

            await pc.addIceCandidate(
              payload.candidate
            );

          } catch {}

        }

      }
    )
    .on(
      "broadcast",
      {
        event:
          "chat"
      },
      ({
        payload
      }) => {

        if (
          payload?.from ===
          liveParticipantId
        ) {
          return;
        }


        appendLiveChatMessage(
          payload
        );

      }
    )
    .subscribe(
      function (
        status
      ) {

        if (
          status ===
          "SUBSCRIBED"
        ) {

          appendLiveChatMessage({

            name:
              "GryphonTube",

            text:
              "Your stream is live!"

          });

        }

      }
    );

}


/* =========================================================
   CREATE VIEWER OFFER
   ========================================================= */

async function sendViewerOffer(
  viewerId
) {

  if (
    !localLiveStream ||
    !liveChannel
  ) {
    return;
  }


  const pc =
    new RTCPeerConnection({

      iceServers: [

        {
          urls:
            "stun:stun.l.google.com:19302"
        },

        {
          urls:
            "stun:stun1.l.google.com:19302"
        }

      ]

    });


  livePeerConnections.set(
    viewerId,
    pc
  );


  localLiveStream
    .getTracks()
    .forEach(
      track => {

        pc.addTrack(
          track,
          localLiveStream
        );

      }
    );


  pc.onicecandidate =
    function (
      event
    ) {

      if (
        event.candidate
      ) {

        liveChannel.send({

          type:
            "broadcast",

          event:
            "ice",

          payload: {

            from:
              liveParticipantId,

            to:
              viewerId,

            candidate:
              event.candidate

          }

        });

      }

    };


  const offer =
    await pc.createOffer();


  await pc.setLocalDescription(
    offer
  );


  await liveChannel.send({

    type:
      "broadcast",

    event:
      "offer",

    payload: {

      from:
        liveParticipantId,

      to:
        viewerId,

      offer:
        pc.localDescription

    }

  });

}


function closeViewerConnection(
  viewerId
) {

  const pc =
    livePeerConnections.get(
      viewerId
    );


  if (pc) {

    pc.close();

    livePeerConnections.delete(
      viewerId
    );

  }

}


/* =========================================================
   VIEWER
   ========================================================= */

function openLiveViewer(
  session
) {

  if (!currentUser) {

    alert(
      "Sign in to watch live streams."
    );

    openAccount();

    return;

  }


  activeLiveSession =
    session;


  liveRole =
    "viewer";


  liveParticipantId =
    crypto.randomUUID();


  liveBroadcasterId =
    session.streamer_id;


  document.getElementById(
    "liveSetupPanel"
  ).classList.add(
    "hidden"
  );


  document.getElementById(
    "liveStudio"
  ).classList.add(
    "hidden"
  );


  document.getElementById(
    "liveViewer"
  ).classList.remove(
    "hidden"
  );


  document.getElementById(
    "liveRoomTitle"
  ).textContent =
    session.title;


  document.getElementById(
    "liveStreamerName"
  ).textContent =
    session.streamer_name;


  document.getElementById(
    "liveViewerCountViewer"
  ).textContent =
    "Connecting...";


  document.getElementById(
    "liveModal"
  ).classList.remove(
    "hidden"
  );


  liveChannel =
    supabaseClient.channel(
      "live:" +
      session.id
    );


  setupViewerChannel();

}


function setupViewerChannel() {

  liveChannel
    .on(
      "broadcast",
      {
        event:
          "offer"
      },
      async ({
        payload
      }) => {

        if (
          payload?.to !==
          liveParticipantId
        ) {
          return;
        }


        liveBroadcasterId =
          payload.from;


        await handleViewerOffer(
          payload.offer
        );

      }
    )
    .on(
      "broadcast",
      {
        event:
          "ice"
      },
      async ({
        payload
      }) => {

        if (
          payload?.to !==
          liveParticipantId
        ) {
          return;
        }


        if (
          liveViewerPeer &&
          payload.candidate
        ) {

          try {

            await liveViewerPeer
              .addIceCandidate(
                payload.candidate
              );

          } catch {}

        }

      }
    )
    .on(
      "broadcast",
      {
        event:
          "viewer-count"
      },
      ({
        payload
      }) => {

        if (
          payload?.count !==
          undefined
        ) {

          document.getElementById(
            "liveViewerCountViewer"
          ).textContent =
            payload.count +
            (
              payload.count ===
              1
                ? " watching"
                : " watching"
            );

        }

      }
    )
    .on(
      "broadcast",
      {
        event:
          "stream-ended"
      },
      () => {

        alert(
          "The livestream has ended."
        );

        leaveLiveStream();

      }
    )
    .on(
      "broadcast",
      {
        event:
          "chat"
      },
      ({
        payload
      }) => {

        if (
          payload?.from ===
          liveParticipantId
        ) {
          return;
        }


        appendViewerChatMessage(
          payload
        );

      }
    )
    .subscribe(
      async function (
        status
      ) {

        if (
          status ===
          "SUBSCRIBED"
        ) {

          await liveChannel.send({

            type:
              "broadcast",

            event:
              "viewer-join",

            payload: {

              viewerId:
                liveParticipantId

            }

          });

        }

      }
    );

}


async function handleViewerOffer(
  offer
) {

  liveViewerPeer =
    new RTCPeerConnection({

      iceServers: [

        {
          urls:
            "stun:stun.l.google.com:19302"
        },

        {
          urls:
            "stun:stun1.l.google.com:19302"
        }

      ]

    });


  liveViewerPeer.ontrack =
    function (
      event
    ) {

      const video =
        document.getElementById(
          "liveRemoteVideo"
        );


      if (
        event.streams &&
        event.streams[0]
      ) {

        video.srcObject =
          event.streams[0];

      }

    };


  liveViewerPeer.onicecandidate =
    function (
      event
    ) {

      if (
        event.candidate
      ) {

        liveChannel.send({

          type:
            "broadcast",

          event:
            "ice",

          payload: {

            from:
              liveParticipantId,

            to:
              liveBroadcasterId,

            candidate:
              event.candidate

          }

        });

      }

    };


  await liveViewerPeer.setRemoteDescription(
    offer
  );


  const answer =
    await liveViewerPeer.createAnswer();


  await liveViewerPeer.setLocalDescription(
    answer
  );


  await liveChannel.send({

    type:
      "broadcast",

    event:
      "answer",

    payload: {

      from:
        liveParticipantId,

      to:
        liveBroadcasterId,

      answer:
        liveViewerPeer.localDescription

    }

  });


  document.getElementById(
    "liveViewerCountViewer"
  ).textContent =
    "Connected";

}


/* =========================================================
   LIVE CHAT
   ========================================================= */

function sendLiveChat() {

  const input =
    document.getElementById(
      "liveChatInput"
    );


  const text =
    input.value.trim();


  if (
    !text ||
    !liveChannel
  ) {
    return;
  }


  const payload = {

    from:
      liveParticipantId,

    name:
      creatorName,

    text

  };


  appendLiveChatMessage(
    payload
  );


  liveChannel.send({

    type:
      "broadcast",

    event:
      "chat",

    payload

  });


  input.value =
    "";

}


function sendViewerChat() {

  const input =
    document.getElementById(
      "liveViewerChatInput"
    );


  const text =
    input.value.trim();


  if (
    !text ||
    !liveChannel
  ) {
    return;
  }


  const payload = {

    from:
      liveParticipantId,

    name:
      creatorName,

    text

  };


  appendViewerChatMessage(
    payload
  );


  liveChannel.send({

    type:
      "broadcast",

    event:
      "chat",

    payload

  });


  input.value =
    "";

}


function appendLiveChatMessage(
  payload
) {

  const list =
    document.getElementById(
      "liveChatList"
    );


  const item =
    document.createElement(
      "div"
    );


  item.className =
    "live-chat-message";


  item.innerHTML =
    `
      <strong>
        ${escapeHtml(
          payload.name ||
          "User"
        )}
      </strong>

      ${escapeHtml(
        payload.text ||
        ""
      )}
    `;


  list.appendChild(
    item
  );


  list.scrollTop =
    list.scrollHeight;

}


function appendViewerChatMessage(
  payload
) {

  const list =
    document.getElementById(
      "liveViewerChatList"
    );


  const item =
    document.createElement(
      "div"
    );


  item.className =
    "live-chat-message";


  item.innerHTML =
    `
      <strong>
        ${escapeHtml(
          payload.name ||
          "User"
        )}
      </strong>

      ${escapeHtml(
        payload.text ||
        ""
      )}
    `;


  list.appendChild(
    item
  );


  list.scrollTop =
    list.scrollHeight;

}


/* =========================================================
   LIVE VIEWER COUNT
   ========================================================= */

function updateLiveViewerCount() {

  const count =
    liveViewerIds.size;


  const text =
    count +
    (
      count ===
      1
        ? " watching"
        : " watching"
    );


  document.getElementById(
    "liveViewerCount"
  ).textContent =
    text;


  if (
    liveChannel
  ) {

    liveChannel.send({

      type:
        "broadcast",

      event:
        "viewer-count",

      payload: {

        count

      }

    });

  }

}


/* =========================================================
   END LIVE
   ========================================================= */

async function endLiveStream() {

  if (
    liveRole !==
    "broadcaster"
  ) {

    return;

  }


  if (
    liveChannel
  ) {

    await liveChannel.send({

      type:
        "broadcast",

      event:
        "stream-ended",

      payload: {}

    });

  }


  if (
    activeLiveSession
  ) {

    await supabaseClient
      .from(
        "live_sessions"
      )
      .update({

        status:
          "ended",

        ended_at:
          new Date().toISOString()

      })
      .eq(
        "id",
        activeLiveSession.id
      );

  }


  livePeerConnections.forEach(
    pc =>
      pc.close()
  );


  livePeerConnections.clear();


  if (
    localLiveStream
  ) {

    localLiveStream
      .getTracks()
      .forEach(
        track =>
          track.stop()
      );

  }


  localLiveStream =
    null;


  if (
    liveChannel
  ) {

    await supabaseClient
      .removeChannel(
        liveChannel
      );

  }


  liveChannel =
    null;

  activeLiveSession =
    null;

  liveRole =
    null;


  document.getElementById(
    "liveModal"
  ).classList.add(
    "hidden"
  );


  await loadLiveSessions();

}


async function leaveLiveStream() {

  if (
    liveRole !==
    "viewer"
  ) {

    closeLiveWindow();

    return;

  }


  if (
    liveChannel
  ) {

    await liveChannel.send({

      type:
        "broadcast",

      event:
        "viewer-leave",

      payload: {

        viewerId:
          liveParticipantId

      }

    });


    await supabaseClient
      .removeChannel(
        liveChannel
      );

  }


  if (
    liveViewerPeer
  ) {

    liveViewerPeer.close();

  }


  liveViewerPeer =
    null;


  liveChannel =
    null;

  activeLiveSession =
    null;

  liveRole =
    null;


  document.getElementById(
    "liveRemoteVideo"
  ).srcObject =
    null;


  document.getElementById(
    "liveModal"
  ).classList.add(
    "hidden"
  );

}


function closeLiveWindow() {

  if (
    liveRole ===
    "broadcaster"
  ) {

    if (
      confirm(
        "End the livestream?"
      )
    ) {

      endLiveStream();

    }

    return;

  }


  if (
    liveRole ===
    "viewer"
  ) {

    leaveLiveStream();

    return;

  }


  document.getElementById(
    "liveModal"
  ).classList.add(
    "hidden"
  );

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
   SIDEBAR
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

  } catch {

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
    seconds <
    60
  ) {

    return "Just now";

  }


  const minutes =
    Math.floor(
      seconds /
      60
    );


  if (
    minutes <
    60
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
    hours <
    24
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
    days <
    30
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
