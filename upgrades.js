(() => {
  "use strict";
  if (window.__gryphonTubeUpgradePackLoaded) return;
  window.__gryphonTubeUpgradePackLoaded = true;
  const GT = {
    profileCache: new Map(),
    notificationTimer: null,
    syncTimer: null,
    syncing: false
  };
  function q(selector, root = document) {
    return root.querySelector(selector);
  }
  function qa(selector, root = document) {
    return Array.from(root.querySelectorAll(selector));
  }
  function esc(value) {
    return String(value ?? "")
      .replace(/&/g, "&amp;")
      .replace(/</g, "&lt;")
      .replace(/>/g, "&gt;")
      .replace(/"/g, "&quot;")
      .replace(/'/g, "&#39;");
  }
  function user() {
    return typeof currentUser !== "undefined" ? currentUser : null;
  }
  function client() {
    return typeof supabaseClient !== "undefined"
      ? supabaseClient
      : null;
  }
  function currentVideos() {
    return typeof videos !== "undefined" && Array.isArray(videos)
      ? videos
      : [];
  }
  function requireUser() {
    if (user()) return true;
    alert("Sign in to use this feature.");
    if (typeof openAccount === "function") openAccount();
    return false;
  }
  function showModal(id) {
    const el = document.getElementById(id);
    if (el) el.classList.remove("hidden");
  }
  function hideModal(id) {
    const el = document.getElementById(id);
    if (el) el.classList.add("hidden");
  }
  function setModal(id, html) {
    const el = document.getElementById(id);
    if (!el) return;
    el.innerHTML = `<div class="gt-modal">${html}</div>`;
  }
  function injectStyles() {
    if (document.getElementById("gt-upgrade-styles")) return;
    const style = document.createElement("style");
    style.id = "gt-upgrade-styles";
    style.textContent = `
      .gt-button {
        border: 0;
        border-radius: 999px;
        padding: 9px 14px;
        cursor: pointer;
        font: inherit;
      }
      .gt-primary {
        background: #673ab7;
        color: #fff;
      }
      .gt-secondary {
        background: rgba(127,127,127,.14);
        color: inherit;
      }
      .gt-danger {
        background: #d32f2f;
        color: #fff;
      }
      .gt-muted {
        opacity: .72;
      }
      .gt-overlay {
        position: fixed;
        inset: 0;
        z-index: 5000;
        background: rgba(0,0,0,.72);
        display: flex;
        align-items: center;
        justify-content: center;
        padding: 20px;
      }
      .gt-overlay.hidden {
        display: none !important;
      }
      .gt-modal {
        width: min(1050px, 96vw);
        max-height: 92vh;
        overflow: auto;
        background: var(--card-bg, #fff);
        color: inherit;
        border-radius: 18px;
        padding: 22px;
        box-shadow: 0 24px 80px rgba(0,0,0,.35);
        position: relative;
      }
      body.dark-mode .gt-modal {
        background: #181818;
      }
      .gt-close {
        position: absolute;
        right: 16px;
        top: 14px;
        border: 0;
        background: transparent;
        color: inherit;
        font-size: 22px;
        cursor: pointer;
      }
      .gt-modal h1,
      .gt-modal h2,
      .gt-modal h3 {
        margin-top: 0;
      }
      .gt-form {
        display: grid;
        gap: 10px;
      }
      .gt-form input,
      .gt-form textarea,
      .gt-form select {
        width: 100%;
        box-sizing: border-box;
        border: 1px solid rgba(127,127,127,.35);
        background: transparent;
        color: inherit;
        border-radius: 10px;
        padding: 11px 12px;
        font: inherit;
      }
      .gt-form textarea {
        min-height: 110px;
        resize: vertical;
      }
      .gt-actions,
      .gt-row,
      .gt-tabs {
        display: flex;
        gap: 8px;
        flex-wrap: wrap;
        align-items: center;
      }
      .gt-row {
        justify-content: space-between;
      }
      .gt-tabs {
        padding: 0 0 18px;
      }
      .gt-tab.active {
        background: #673ab7;
        color: white;
      }
      .gt-grid {
        display: grid;
        grid-template-columns: repeat(auto-fit, minmax(260px, 1fr));
        gap: 14px;
      }
      .gt-card {
        border: 1px solid rgba(127,127,127,.22);
        border-radius: 14px;
        padding: 14px;
        background: rgba(127,127,127,.05);
      }
      .gt-card img,
      .gt-card video {
        width: 100%;
        aspect-ratio: 16/9;
        object-fit: cover;
        border-radius: 10px;
        background: #111;
      }
      .gt-channel-hero {
        overflow: hidden;
        border-radius: 16px;
        margin-bottom: 18px;
        border: 1px solid rgba(127,127,127,.2);
      }
      .gt-channel-banner {
        height: 170px;
        background:
          radial-gradient(circle at 20% 20%, rgba(255,255,255,.24), transparent 35%),
          linear-gradient(120deg, #673ab7, #1976d2);
        background-size: cover;
        background-position: center;
      }
      .gt-channel-avatar {
        width: 92px;
        height: 92px;
        min-width: 92px;
        min-height: 92px;
        border-radius: 50%;
        display: flex;
        align-items: center;
        justify-content: center;
        color: #fff;
        font-size: 34px;
        font-weight: 800;
        border: 5px solid var(--card-bg, #fff);
      }
      body.dark-mode .gt-channel-avatar {
        border-color: #181818;
      }
      .gt-stat {
        display: inline-block;
        opacity: .8;
      }
      .gt-studio-item {
        display: grid;
        grid-template-columns: 190px 1fr;
        gap: 14px;
      }
      .gt-studio-item + .gt-studio-item {
        margin-top: 14px;
      }
      .gt-notification {
        padding: 12px;
        border-bottom: 1px solid rgba(127,127,127,.18);
      }
      .gt-notification.unread {
        background: rgba(103,58,183,.09);
      }
      .gt-badge {
        display: inline-flex;
        min-width: 20px;
        height: 20px;
        align-items: center;
        justify-content: center;
        border-radius: 999px;
        padding: 0 5px;
        background: #d32f2f;
        color: #fff;
        font-size: 11px;
        font-weight: 700;
        margin-left: 4px;
        vertical-align: top;
      }
      .gt-banner-editor {
        display: grid;
        gap: 10px;
        margin: 12px 0 16px;
        padding: 12px;
        border: 1px solid rgba(127,127,127,.22);
        border-radius: 14px;
        background: rgba(127,127,127,.05);
      }
      .gt-banner-preview {
        width: 100%;
        height: 120px;
        object-fit: cover;
        border-radius: 10px;
        background:
          linear-gradient(120deg, #673ab7, #1976d2);
      }
      @media (max-width: 700px) {
        .gt-studio-item {
          grid-template-columns: 1fr;
        }
        .gt-channel-main {
          grid-template-columns: 1fr !important;
          margin-top: -24px !important;
        }
      }
    `;
    document.head.appendChild(style);
  }
  function ensureModals() {
    const ids = [
      "gtUploadModal",
      "gtStudioModal",
      "gtPlaylistModal",
      "gtNotificationModal",
      "gtReportModal",
      "gtChannelModal"
    ];
    ids.forEach(id => {
      if (document.getElementById(id)) return;
      const div = document.createElement("div");
      div.id = id;
      div.className = "gt-overlay hidden";
      document.body.appendChild(div);
    });
  }
  async function getProfile(creatorId, fallbackName = "Creator") {
    if (!creatorId) {
      return {
        creator_id: null,
        channel_name: fallbackName,
        bio: "",
        color: "#673ab7",
        banner_url: null
      };
    }
    if (GT.profileCache.has(creatorId)) {
      return GT.profileCache.get(creatorId);
    }
    const db = client();
    if (!db) return null;
    const { data, error } = await db
      .from("creator_profiles")
      .select("*")
      .eq("creator_id", creatorId)
      .maybeSingle();
    if (error) {
      console.warn("Profile load:", error.message);
    }
    const profile = data || {
      creator_id: creatorId,
      channel_name: fallbackName,
      bio: "",
      color: "#673ab7",
      banner_url: null
    };
    GT.profileCache.set(creatorId, profile);
    return profile;
  }
  async function upsertOwnProfile() {
    const me = user();
    const db = client();
    if (!me || !db) return;
    const name =
      typeof creatorName !== "undefined"
        ? creatorName
        : (me.user_metadata?.creator_name || "You");
    const bio =
      typeof creatorBio !== "undefined"
        ? creatorBio
        : (me.user_metadata?.bio || "");
    const color =
      typeof creatorColor !== "undefined"
        ? creatorColor
        : (me.user_metadata?.color || "#673ab7");
    const { error } = await db
      .from("creator_profiles")
      .upsert({
        creator_id: me.id,
        channel_name: name,
        bio: bio || "Welcome to my GryphonTube channel!",
        color: color || "#673ab7",
        updated_at: new Date().toISOString()
      }, {
        onConflict: "creator_id"
      });
    if (error) {
      console.warn("Profile sync:", error.message);
    } else {
      GT.profileCache.delete(me.id);
    }
  }
  async function uploadBanner(file) {
    const me = user();
    const db = client();
    if (!me || !db || !file) return false;
    if (!file.type.startsWith("image/")) {
      alert("Banner must be an image file.");
      return false;
    }
    if (file.size > 5 * 1024 * 1024) {
      alert("Banner must be 5 MB or smaller.");
      return false;
    }
    const safe = file.name.replace(
      /[^a-zA-Z0-9._-]/g,
      "_"
    );
    const path =
      `banner__${me.id}__${Date.now()}__${Math.random()
        .toString(36)
        .slice(2, 8)}__${safe}`;
    const { error: uploadError } = await db.storage
      .from("videos")
      .upload(path, file);
    if (uploadError) {
      alert(`Banner upload failed: ${uploadError.message}`);
      return false;
    }
    const bannerUrl = db.storage
      .from("videos")
      .getPublicUrl(path)
      .data.publicUrl;
    const { error: profileError } = await db
      .from("creator_profiles")
      .update({
        banner_url: bannerUrl,
        updated_at: new Date().toISOString()
      })
      .eq("creator_id", me.id);
    if (profileError) {
      alert(`Banner save failed: ${profileError.message}`);
      return false;
           }
    GT.profileCache.delete(me.id);
    return true;
  }
  function injectBannerEditor() {
    const account = q("#loggedInAccount");
    if (!account) return;
    if (q("#gtBannerEditor", account)) return;
    const wrap = document.createElement("div");
    wrap.id = "gtBannerEditor";
    wrap.className = "gt-banner-editor";
    wrap.innerHTML = `
      <strong>Channel Banner</strong>
      <p class="gt-muted" style="margin:0">
        Upload an image for the top of your channel.
      </p>
      <img
        id="gtBannerPreview"
        class="gt-banner-preview"
        alt="Banner preview"
        hidden
      >
      <input
        id="gtBannerInput"
        type="file"
        accept="image/png,image/jpeg,image/webp"
      >
      <small class="gt-muted">
        PNG, JPG, or WebP. Max 5 MB.
      </small>
    `;
    account.insertBefore(wrap, account.firstChild);
    const input = q("#gtBannerInput", wrap);
    const preview = q("#gtBannerPreview", wrap);
    if (input && preview) {
      input.addEventListener("change", () => {
        const file = input.files?.[0];
        if (!file) return;
        preview.src = URL.createObjectURL(file);
        preview.hidden = false;
      });
    }
    const me = user();
    if (me) {
      const name =
        typeof creatorName !== "undefined" ? creatorName : "You";
      getProfile(me.id, name)
        .then(profile => {
          if (profile?.banner_url && preview) {
            preview.src = profile.banner_url;
            preview.hidden = false;
          }
        })
        .catch(() => {});
    }
  }
  function wrapProfileSave() {
    if (window.__gtProfileSaveWrapped) return;
    if (typeof window.saveAccountProfile !== "function") return;
    const original = window.saveAccountProfile;
    window.saveAccountProfile = async function (...args) {
      const result = await original.apply(this, args);
      await upsertOwnProfile();
      const input = q("#gtBannerInput");
      const file = input?.files?.[0];
      if (file) {
        const saved = await uploadBanner(file);
        if (saved && input) input.value = "";
      }
      return result;
    };
    window.__gtProfileSaveWrapped = true;
  }
  async function openChannelByName(name) {
    const cleanName = String(name || "").trim() || "Creator";
    const list = currentVideos().filter(
      video => video.creator_name === cleanName && !video.is_deleted
    );
    const creatorId =
      list.find(video => video.creator_id)?.creator_id ||
      (
        user() &&
        typeof creatorName !== "undefined" &&
        cleanName === creatorName
          ? user().id
          : null
      );
    const profile = await getProfile(creatorId, cleanName);
    const subscriberCount =
      typeof getSubscriberCount === "function" && creatorId
        ? await getSubscriberCount(creatorId)
        : 0;
    const own = !!user() && !!creatorId && creatorId === user().id;
    const bannerStyle = profile?.banner_url
      ? `background-image:url("${esc(profile.banner_url)}");`
      : `background:
          radial-gradient(circle at 20% 20%, rgba(255,255,255,.24), transparent 35%),
          linear-gradient(120deg, ${esc(profile?.color || "#673ab7")}, #1976d2);`;
    setModal("gtChannelModal", `
      <button class="gt-close" onclick="gtCloseChannel()">✕</button>
      <div class="gt-channel-hero">
        <div
          class="gt-channel-banner"
          style="${bannerStyle}"
        ></div>
        <div
          class="gt-channel-main"
          style="
            display:grid;
            grid-template-columns:92px minmax(0,1fr) auto;
            gap:18px;
            align-items:center;
            padding:22px;
            margin-top:-36px;
            min-width:0;
          "
        >
          <div
            class="gt-channel-avatar"
            style="background:${esc(profile?.color || "#673ab7")};"
          >
            ${esc((profile?.channel_name || cleanName).slice(0, 1).toUpperCase())}
          </div>
          <div style="min-width:0;width:100%;">
            <h1
              style="
                margin:0 0 10px;
                line-height:1.2;
                overflow-wrap:anywhere;
                word-break:break-word;
              "
            >
              ${esc(profile?.channel_name || cleanName)}
            </h1>
            <div style="display:flex;flex-wrap:wrap;gap:8px 14px;">
              <span class="gt-stat">
                ${list.length} video${list.length === 1 ? "" : "s"}
              </span>
              <span class="gt-stat">
                ${subscriberCount} subscriber${subscriberCount === 1 ? "" : "s"}
              </span>
            </div>
            <p
              class="gt-muted"
              style="margin:10px 0 0;line-height:1.5;overflow-wrap:anywhere;"
            >
              ${esc(profile?.bio || "")}
            </p>
          </div>
          <div class="gt-actions" style="justify-content:flex-end;">
            ${own
              ? `
                <button
                  class="gt-button gt-secondary"
                  onclick="gtOpenStudio()"
                >
                  Creator Studio
                </button>
              `
              : `
                <button
                  class="gt-button gt-primary"
                  id="gtChannelSubscribeButton"
                  ${creatorId ? "" : "disabled"}
                >
                  Subscribe
                </button>
              `}
          </div>
        </div>
        <div class="gt-tabs" style="padding:0 22px 18px;">
          <button
            class="gt-button gt-tab active"
            id="gtChannelVideosTab"
          >
            Videos
          </button>
          <button
            class="gt-button gt-tab"
            id="gtChannelAboutTab"
          >
            About
          </button>
        </div>
      </div>
      <div id="gtChannelBody"></div>
    `);
    const body = q("#gtChannelBody");
    function renderVideos() {
      if (!body) return;
      body.innerHTML = `
        <div
          class="gt-grid"
          style="
            grid-template-columns:repeat(auto-fill,minmax(230px,280px));
            justify-content:start;
            padding:0 22px 22px;
          "
        >
          ${list.length
            ? list.map(video => `
              <div class="gt-card">
                <img
                  src="${esc(video.thumbnail || "gusty.jpeg") }"
                  alt=""
                  onerror="this.src='gusty.jpeg'"
                >
                <h3
                  style="overflow-wrap:anywhere;word-break:break-word;"
                >
                  ${esc(video.title || "Untitled")}
                </h3>
                <p class="gt-muted">
                  ${typeof formatViews === "function"
                    ? esc(formatViews(video.views))
                    : `${video.views || 0} views`}
                </p>
                <button
                  class="gt-button gt-secondary"
                  data-gt-play="${esc(video.storage_path)}"
                >
                  Watch
                </button>
              </div>
            `).join("")
            : `
              <div class="gt-card">
                <h3>No videos yet</h3>
                <p>This channel hasn't uploaded anything.</p>
              </div>
            `}
        </div>
      `;
      qa("[data-gt-play]", body).forEach(button => {
        button.addEventListener("click", () => {
          const path = button.getAttribute("data-gt-play");
          const video = currentVideos().find(
            item => item.storage_path === path
          );
          if (video && typeof openVideo === "function") {
            closeChannel();
            openVideo(video);
          }
        });
      });
    }
    function renderAbout() {
      if (!body) return;
      body.innerHTML = `
        <div class="gt-card" style="margin:0 22px 22px;">
          <h2>About</h2>
          <p style="line-height:1.6;overflow-wrap:anywhere;">
            ${esc(profile?.bio || "No channel bio yet.")}
          </p>
          <p class="gt-muted">
            ${list.length} uploaded video${list.length === 1 ? "" : "s"}
            •
            ${subscriberCount} subscriber${subscriberCount === 1 ? "" : "s"}
          </p>
        </div>
      `;
    }
    renderVideos();
    const subscribeButton = q("#gtChannelSubscribeButton");
    if (
      subscribeButton &&
      creatorId &&
      typeof toggleSubscription === "function"
    ) {
      if (!user()) {
        subscribeButton.textContent = "🔒 Sign in to Subscribe";
      } else if (own) {
        subscribeButton.textContent = "Your Channel";
        subscribeButton.disabled = true;
      } else {
        const db = client();
        if (db) {
          const { data } = await db
            .from("channel_subscriptions")
            .select("creator_id")
            .eq("subscriber_id", user().id)
            .eq("creator_id", creatorId)
            .maybeSingle();
          const subscribed = !!data;
          subscribeButton.textContent = subscribed
            ? "✓ Subscribed"
            : "Subscribe";
          subscribeButton.classList.toggle(
            "subscribed",
            subscribed
          );
        }
        subscribeButton.onclick = async () => {
          await toggleSubscription(creatorId, cleanName);
          await openChannelByName(cleanName);
        };
      }
    }
    const videosTab = q("#gtChannelVideosTab");
    const aboutTab = q("#gtChannelAboutTab");
    if (videosTab && aboutTab) {
      videosTab.onclick = () => {
        videosTab.classList.add("active");
        aboutTab.classList.remove("active");
        renderVideos();
      };
      aboutTab.onclick = () => {
        aboutTab.classList.add("active");
        videosTab.classList.remove("active");
        renderAbout();
      };
    }
    showModal("gtChannelModal");
  }
  function closeChannel() {
    hideModal("gtChannelModal");
  }
  function openReport(videoId, title = "video") {
    if (!requireUser()) return;
    setModal("gtReportModal", `
      <button class="gt-close" onclick="gtCloseReport()">✕</button>
      <h1>Report ${esc(title)}</h1>
      <form id="gtReportForm" class="gt-form">
        <label>Reason</label>
        <select id="gtReportReason">
          <option>Spam</option>
          <option>Harassment or bullying</option>
          <option>Hateful or abusive content</option>
          <option>Copyright concern</option>
          <option>Sexual or inappropriate content</option>
          <option>Violence or dangerous content</option>
          <option>Other</option>
        </select>
        <label>Details</label>
        <textarea
          id="gtReportDetails"
          maxlength="1000"
          placeholder="Tell the creator/moderator what happened."
        ></textarea>
        <div class="gt-actions">
          <button class="gt-button gt-primary" type="submit">
            Submit report
          </button>
          <button
            class="gt-button gt-secondary"
            type="button"
            onclick="gtCloseReport()"
          >
            Cancel
          </button>
        </div>
        <p id="gtReportStatus" class="gt-muted"></p>
      </form>
    `);
    const form = q("#gtReportForm");
    if (form) {
      form.onsubmit = async event => {
        event.preventDefault();
        const db = client();
        const me = user();
        const status = q("#gtReportStatus");
        if (!db || !me || !status) return;
        status.textContent = "Submitting...";
        const { error } = await db
          .from("video_reports")
          .insert({
            video_id: videoId,
            reporter_id: me.id,
            reason: q("#gtReportReason").value,
            details: q("#gtReportDetails").value.trim() || null
          });
        if (error) {
          status.textContent = error.message;
          return;
        }
        status.textContent = "Report submitted.";
        setTimeout(closeReport, 700);
      };
    }
    showModal("gtReportModal");
  }
  function closeReport() {
    hideModal("gtReportModal");
  }
  function openUploader() {
    if (!requireUser()) return;
    setModal("gtUploadModal", `
      <button class="gt-close" onclick="gtCloseUpload()">✕</button>
      <h1>Upload to GryphonTube</h1>
      <form id="gtUploadForm" class="gt-form">
        <label>Video</label>
        <input
          id="gtUploadVideoFile"
          type="file"
          accept="video/mp4,video/webm,video/ogg"
          required
        >
        <label>Title</label>
        <input
          id="gtUploadTitle"          maxlength="120"
          placeholder="Give your video a title"
          required
        >
        <label>Category</label>
        <select id="gtUploadCategory">
          <option>Gaming</option>
          <option>Music</option>
          <option>Animation</option>
          <option selected>Funny</option>
        </select>
        <label>Description</label>
        <textarea
          id="gtUploadDescription"
          maxlength="2000"
          placeholder="Tell viewers about the video"
        ></textarea>
        <label>Custom thumbnail</label>
        <input
          id="gtUploadThumbnail"
          type="file"
          accept="image/png,image/jpeg,image/webp"
        >
        <p class="gt-muted">
          Optional. PNG/JPG/WebP. Max 5 MB.
        </p>
        <div class="gt-actions">
          <button class="gt-button gt-primary" type="submit">
            Upload video
          </button>
          <button
            class="gt-button gt-secondary"
            type="button"
            onclick="gtCloseUpload()"
          >
            Cancel
          </button>
        </div>
        <p id="gtUploadStatus" class="gt-muted"></p>
      </form>
    `);
    const form = q("#gtUploadForm");
    const videoInput = q("#gtUploadVideoFile");
    const titleInput = q("#gtUploadTitle");
    if (videoInput && titleInput) {
      videoInput.addEventListener("change", () => {
        const file = videoInput.files?.[0];
        if (file && !titleInput.value.trim()) {
          titleInput.value = file.name.replace(/\.[^/.]+$/, "");
        }
      });
    }
    if (form) form.onsubmit = handleUpload;
    showModal("gtUploadModal");
  }
  async function handleUpload(event) {
  event.preventDefault();

  const db = client();
  const me = user();
  const status = q("#gtUploadStatus");

  if (!db || !me || !status) return;

  const videoFile = q("#gtUploadVideoFile")?.files?.[0];
  const thumbFile = q("#gtUploadThumbnail")?.files?.[0];

  const title = q("#gtUploadTitle")?.value.trim();
  const category = q("#gtUploadCategory")?.value || "Funny";
  const description =
    q("#gtUploadDescription")?.value.trim() || null;

  if (!videoFile) {
    status.textContent = "Choose a video.";
    return;
  }

  if (!videoFile.type.startsWith("video/")) {
    status.textContent = "That isn't a video file.";
    return;
  }

  if (thumbFile) {
    if (!thumbFile.type.startsWith("image/")) {
      status.textContent = "The thumbnail must be an image.";
      return;
    }

    if (thumbFile.size > 5 * 1024 * 1024) {
      status.textContent = "Thumbnail must be 5 MB or smaller.";
      return;
    }
  }

  try {
    // =========================
    // UPLOAD VIDEO TO CLOUDINARY
    // =========================
    status.textContent = "Uploading video...";

    const cloudinaryForm = new FormData();
    cloudinaryForm.append("file", videoFile);
    cloudinaryForm.append("upload_preset", "gryphontube");

    const cloudinaryResponse = await fetch(
      "https://api.cloudinary.com/v1_1/hzzgy02q/video/upload",
      {
        method: "POST",
        body: cloudinaryForm
      }
    );

    const cloudinaryData = await cloudinaryResponse.json();

    console.log("Cloudinary response:", cloudinaryData);

    if (!cloudinaryResponse.ok || !cloudinaryData.secure_url) {
      console.error(
        "Cloudinary upload failed:",
        cloudinaryData
      );

      status.textContent =
        `Video upload failed: ${
          cloudinaryData.error?.message ||
          "Cloudinary error"
        }`;

      return;
    }

    const videoUrl = cloudinaryData.secure_url;

    console.log(
      "CLOUDINARY SUCCESS:",
      videoUrl
    );

    // =========================
    // UPLOAD THUMBNAIL
    // =========================
    let thumbnailUrl = "gusty.jpeg";
    let thumbnailPath = null;

    if (thumbFile) {
      status.textContent = "Uploading thumbnail...";

      const safeThumb = thumbFile.name.replace(
        /[^a-zA-Z0-9._-]/g,
        "_"
      );

      thumbnailPath =
        `thumb__${me.id}__${Date.now()}__${Math.random()
          .toString(36)
          .slice(2, 8)}__${safeThumb}`;

      const { error: thumbError } = await db.storage
        .from("videos")
        .upload(thumbnailPath, thumbFile);

      if (thumbError) {
        console.warn(
          "Thumbnail upload:",
          thumbError.message
        );
      } else {
        thumbnailUrl = db.storage
          .from("videos")
          .getPublicUrl(thumbnailPath)
          .data.publicUrl;
      }
    }

    // =========================
    // SAVE VIDEO INFO IN SUPABASE
    // =========================
    status.textContent =
      "Saving video information...";

    const { data, error } = await db
      .from("videos")
      .insert({
        // Cloudinary URL goes here now
        storage_path: videoUrl,

        title:
          title ||
          videoFile.name.replace(
            /\.[^/.]+$/,
            ""
          ),

        creator_id: me.id,

        creator_name:
          typeof creatorName !== "undefined"
            ? creatorName
            : (
                me.user_metadata?.creator_name ||
                "You"
              ),

        category,

        description,

        thumbnail: thumbnailUrl,

        thumbnail_path: thumbnailPath,

        views: 0,

        is_deleted: false
      })
      .select("*")
      .single();

    if (error) {
      console.error(
        "Database save failed:",
        error
      );

      status.textContent =
        `Database save failed: ${error.message}`;

      return;
    }

    // =========================
    // ADD TO LOCAL VIDEO LIST
    // =========================
    const newVideo = {
      ...data,

      // Cloudinary URL
      video: videoUrl,

      thumbnail: thumbnailUrl,

      storage_path: videoUrl,

      views: 0,

      created_at:
        data?.created_at ||
        new Date().toISOString()
    };

    if (Array.isArray(videos)) {
      videos = [
        newVideo,
        ...videos
      ];
    }

    if (
      typeof displayHomepage ===
      "function"
    ) {
      displayHomepage();
    }

    closeUpload();

    // Keep the existing behavior,
    // but don't let the known comments
    // bug break the upload.
    if (
      typeof openVideo ===
      "function"
    ) {
      try {
        await openVideo(newVideo);
      } catch (error) {
        console.warn(
          "Video opened, but openVideo reported an error:",
          error
        );
      }
    }

  } catch (error) {
    console.error(
      "Cloudinary upload error:",
      error
    );

    status.textContent =
      `Upload failed: ${error.message}`;
  }
}
  function closeUpload() {
    hideModal("gtUploadModal");
  }
  function ensureBellBadge() {
    const bell = document.querySelector(
      ".top-buttons button[title='Notifications']"
    );
    if (!bell) return null;
    let badge = bell.querySelector(".gt-badge");
    if (!badge) {
      badge = document.createElement("span");
      badge.className = "gt-badge";
      badge.style.display = "none";
      badge.textContent = "0";
      bell.appendChild(badge);
    }
    return badge;
  }
  async function refreshNotificationCount() {
    const badge = ensureBellBadge();
    const me = user();
    const db = client();
    if (!badge || !me || !db) {
      if (badge) badge.style.display = "none";
      return;
    }
    const { count, error } = await db
      .from("notifications")
      .select("id", { count: "exact", head: true })
      .eq("recipient_id", me.id)
      .is("read_at", null);
    if (error) {
      badge.style.display = "none";
      return;
    }
    if ((count || 0) > 0) {
      badge.textContent = count > 99 ? "99+" : String(count);
      badge.style.display = "inline-flex";
    } else {
      badge.style.display = "none";
    }
  }
  async function showNotifications() {
    if (!requireUser()) return;
    const me = user();
    const db = client();
    if (!me || !db) return;
    setModal("gtNotificationModal", `
      <button class="gt-close" onclick="gtCloseNotifications()">✕</button>
      <div class="gt-row">
        <div>
          <h1>Notifications</h1>
          <p class="gt-muted">
            Subscriptions, comments, likes, and live alerts.
          </p>
        </div>
        <button class="gt-button gt-secondary" id="gtMarkAllRead">
          Mark all read
        </button>
      </div>
      <div id="gtNotificationList">Loading...</div>
    `);
    const list = q("#gtNotificationList");
    const { data, error } = await db
      .from("notifications")
      .select("*")
      .eq("recipient_id", me.id)
      .order("created_at", { ascending: false })
      .limit(50);
    if (error) {
      list.textContent = error.message;
      showModal("gtNotificationModal");
      return;
    }
    list.innerHTML =
      (data || []).map(notification => `
        <div class="gt-notification ${notification.read_at ? "" : "unread"}">
          <strong>${esc(notification.title || "GryphonTube")}</strong>
          <div>${esc(notification.body || "")}</div>
          <small class="gt-muted">
            ${typeof formatDate === "function"
              ? esc(formatDate(notification.created_at))
              : new Date(notification.created_at).toLocaleString()}
          </small>
        </div>
      `).join("") || `
        <div class="gt-card">No notifications yet.</div>
      `;
    const markAll = q("#gtMarkAllRead");
    if (markAll) {
      markAll.onclick = async () => {
        await db
          .from("notifications")
          .update({ read_at: new Date().toISOString() })
          .eq("recipient_id", me.id)
          .is("read_at", null);
        await refreshNotificationCount();
        await showNotifications();
      };
    }
    showModal("gtNotificationModal");
    refreshNotificationCount();
  }
  function closeNotifications() {
    hideModal("gtNotificationModal");
  }
  async function loadPlaylists() {
    const me = user();
    const db = client();
    if (!me || !db) return [];
    const { data, error } = await db
      .from("playlists")
      .select("*")
      .eq("owner_id", me.id)
      .order("created_at", { ascending: false });
    if (error) {
      console.warn("Playlists:", error.message);
      return [];
    }
    return data || [];
  }
  async function openPlaylists() {
    if (!requireUser()) return;
    setModal("gtPlaylistModal", `
      <button class="gt-close" onclick="gtClosePlaylists()">✕</button>
      <h1>Your Playlists</h1>
      <p class="gt-muted">
        Save videos into your own collections.
      </p>
      <form id="gtPlaylistCreateForm" class="gt-form">
        <input
          id="gtPlaylistName"
          maxlength="80"
          placeholder="New playlist name"
          required
        >
        <textarea
          id="gtPlaylistDescription"
          maxlength="300"
          placeholder="Description (optional)"
        ></textarea>
        <button class="gt-button gt-primary" type="submit">
          Create playlist
        </button>
      </form>
      <hr style="margin:18px 0;opacity:.2">
      <div id="gtPlaylistList">Loading...</div>
    `);
    const list = q("#gtPlaylistList");
    async function render() {
      const playlists = await loadPlaylists();
      if (!playlists.length) {
        list.innerHTML = `
          <div class="gt-card">
            <h3>No playlists yet</h3>
            <p>Create your first one above.</p>
          </div>
        `;
        return;
      }
      const db = client();
      const cards = [];
      for (const playlist of playlists) {
        const { count } = await db
          .from("playlist_items")
          .select("playlist_id", { count: "exact", head: true })
          .eq("playlist_id", playlist.id);
        cards.push(`
          <div class="gt-card">
            <div class="gt-row">
              <div>
                <h3>${esc(playlist.name)}</h3>
                <p class="gt-muted">
                  ${esc(playlist.description || "")}
                </p>
                <span class="gt-stat">
                  ${count || 0} video${count === 1 ? "" : "s"}
                </span>
              </div>
              <div class="gt-actions">
                <button
                  class="gt-button gt-secondary"
                  data-gt-open-playlist="${esc(playlist.id)}"
                >
                  Open
                </button>
                <button
                  class="gt-button gt-danger"
                  data-gt-delete-playlist="${esc(playlist.id)}"
                >
                  Delete
                </button>
              </div>
            </div>
          </div>
        `);
      }
      list.innerHTML = cards.join("");
      qa("[data-gt-open-playlist]", list).forEach(button => {
        button.onclick = () =>
          openPlaylist(button.getAttribute("data-gt-open-playlist"));
      });
      qa("[data-gt-delete-playlist]", list).forEach(button => {
        button.onclick = async () => {
          const id = button.getAttribute("data-gt-delete-playlist");
          if (!confirm("Delete this playlist?")) return;
          await db
            .from("playlists")
            .delete()
            .eq("id", id)
            .eq("owner_id", user().id);
          render();
        };
      });
    }
    const form = q("#gtPlaylistCreateForm");
    if (form) {
      form.onsubmit = async event => {
        event.preventDefault();
        const { error } = await client()
          .from("playlists")
          .insert({
            owner_id: user().id,
            name: q("#gtPlaylistName").value.trim(),
            description: q("#gtPlaylistDescription").value.trim() || null
                       });
        if (error) {
          alert(error.message);
          return;
        }
        q("#gtPlaylistName").value = "";
        q("#gtPlaylistDescription").value = "";
        render();
      };
    }
    await render();
    showModal("gtPlaylistModal");
  }
  async function openPlaylist(id) {
    const me = user();
    const db = client();
    if (!me || !db) return;
    const { data: playlist, error: playlistError } = await db
      .from("playlists")
      .select("*")
      .eq("id", id)
      .eq("owner_id", me.id)
      .maybeSingle();
    if (playlistError || !playlist) {
      alert(playlistError?.message || "Playlist not found.");
      return;
    }
    const { data: items } = await db
      .from("playlist_items")
      .select("video_id, position")
      .eq("playlist_id", id)
      .order("position", { ascending: true });
    const byId = new Map(
      currentVideos().map(video => [video.id, video])
    );
    setModal("gtPlaylistModal", `
      <button class="gt-close" onclick="gtClosePlaylists()">✕</button>
      <div class="gt-row">
        <div>
          <h1>${esc(playlist.name)}</h1>
          <p class="gt-muted">
            ${esc(playlist.description || "")}
          </p>
        </div>
        <button
          class="gt-button gt-secondary"
          onclick="gtOpenPlaylists()"
        >
          ← All playlists
        </button>
      </div>
      <div id="gtPlaylistVideos" class="gt-grid"></div>
    `);
    const body = q("#gtPlaylistVideos");
    const existing = (items || [])
      .map(item => byId.get(item.video_id))
      .filter(Boolean);
    body.innerHTML = existing.map(video => `
      <div class="gt-card">
        <img
          src="${esc(video.thumbnail || "gusty.jpeg") }"
          onerror="this.src='gusty.jpeg'"
          alt=""
        >
        <h3>${esc(video.title || "Untitled")}</h3>
        <p class="gt-muted">
          ${esc(video.creator_name || "")}
        </p>
        <button
          class="gt-button gt-secondary"
          data-gt-play="${esc(video.storage_path)}"
        >
          Watch
        </button>
      </div>
    `).join("") || `
      <div class="gt-card">
        <h3>This playlist is empty.</h3>
      </div>
    `;
    qa("[data-gt-play]", body).forEach(button => {
      button.onclick = () => {
        const video = existing.find(
          item => item.storage_path === button.getAttribute("data-gt-play")
        );
        if (video && typeof openVideo === "function") {
          closePlaylists();
          openVideo(video);
        }
      };
    });
    showModal("gtPlaylistModal");
  }
  function closePlaylists() {
    hideModal("gtPlaylistModal");
  }
  async function addCurrentToPlaylist() {
    const video =
      typeof currentVideo !== "undefined" ? currentVideo : null;
    if (!requireUser() || !video?.id) {
      if (video && !video.id) {
        alert("This video doesn't have database metadata yet.");
      }
      return;
    }
    const playlists = await loadPlaylists();
    if (!playlists.length) {
      if (confirm("You don't have any playlists yet. Create one now?")) {
        openPlaylists();
      }
      return;
    }
    setModal("gtPlaylistModal", `
      <button class="gt-close" onclick="gtClosePlaylists()">✕</button>
      <h1>Add to playlist</h1>
      <div id="gtAddPlaylistList" class="gt-grid">
        ${playlists.map(p => `
          <button
            class="gt-card"
            data-gt-add-playlist="${esc(p.id)}"
            style="text-align:left;cursor:pointer"
          >
            <strong>${esc(p.name)}</strong>
            <span class="gt-muted">
              ${esc(p.description || "")}
            </span>
          </button>
        `).join("")}
      </div>
    `);
    const list = q("#gtAddPlaylistList");
    qa("[data-gt-add-playlist]", list).forEach(button => {
      button.onclick = async () => {
        const playlistId = button.getAttribute("data-gt-add-playlist");
        const { count } = await client()
          .from("playlist_items")
          .select("position", { count: "exact", head: true })
          .eq("playlist_id", playlistId);
        const { error } = await client()
          .from("playlist_items")
          .insert({
            playlist_id: playlistId,
            video_id: video.id,
            position: count || 0
          });
        if (error) {
          alert(
            error.code === "23505"
              ? "That video is already in this playlist."
              : error.message
          );
          return;
        }
        alert("Added to playlist!");
        closePlaylists();
      };
    });
    showModal("gtPlaylistModal");
  }
  async function openStudio() {
    if (!requireUser()) return;
    setModal("gtStudioModal", `
      <button class="gt-close" onclick="gtCloseStudio()">✕</button>
      <div class="gt-row">
        <div>
          <h1>Creator Studio</h1>
          <p class="gt-muted">
            Manage your videos and review reports.
          </p>
        </div>
        <button
          class="gt-button gt-primary"
          onclick="gtOpenUploader()"
        >
          ⬆️ Upload
        </button>
      </div>
      <div class="gt-tabs">
        <button
          class="gt-button gt-tab active"
          id="gtStudioVideosTab"
        >
          Videos
        </button>
        <button
          class="gt-button gt-tab"
          id="gtStudioReportsTab"
        >
          Reports
        </button>
        <button
          class="gt-button gt-tab"
          id="gtStudioPlaylistsTab"
        >
          Playlists
        </button>
      </div>
      <div id="gtStudioBody"></div>
    `);
    showModal("gtStudioModal");
    renderStudioVideos();
    q("#gtStudioVideosTab").onclick = () => {
      setActiveStudioTab("gtStudioVideosTab");
      renderStudioVideos();
    };
    q("#gtStudioReportsTab").onclick = () => {
      setActiveStudioTab("gtStudioReportsTab");
      renderStudioReports();
    };
    q("#gtStudioPlaylistsTab").onclick = () => {
      setActiveStudioTab("gtStudioPlaylistsTab");
      renderStudioPlaylists();
    };
  }
  function setActiveStudioTab(id) {
    qa(".gt-tab", q("#gtStudioModal")).forEach(tab => {
      tab.classList.remove("active");
    });
    const selected = q(`#${id}`);
    if (selected) selected.classList.add("active");
  }
  function closeStudio() {
    hideModal("gtStudioModal");
  }
  function isCloudinaryVideoUrl(url) {
  return (
    typeof url === "string" &&
    url.startsWith("https://res.cloudinary.com/")
  );
}

async function cloudinaryVideoExists(url) {
  if (!isCloudinaryVideoUrl(url)) return null;

  const controller = new AbortController();
  const timeout = setTimeout(() => controller.abort(), 7000);

  try {
    const response = await fetch(url, {
      method: "HEAD",
      cache: "no-store",
      signal: controller.signal
    });

    if (response.status === 200 || response.ok) {
      return true;
    }

    if (response.status === 404) {
      return false;
    }

    return null;
  } catch (error) {
    console.warn("Cloudinary existence check failed:", error);
    return null;
  } finally {
    clearTimeout(timeout);
  }
}

async function removeMissingCloudinaryVideos(db, dbVideos) {
  const cloudinaryVideos = dbVideos.filter(video =>
    video &&
    video.id &&
    isCloudinaryVideoUrl(video.storage_path) &&
    !video.is_deleted
  );

  if (!cloudinaryVideos.length) {
    return dbVideos;
  }

  const results = await Promise.all(
    cloudinaryVideos.map(async video => ({
      video,
      exists: await cloudinaryVideoExists(video.storage_path)
    }))
  );

  const missing = results.filter(result => result.exists === false);

  for (const result of missing) {
    const { video } = result;

    const { error } = await db
      .from("videos")
      .delete()
      .eq("id", video.id);

    if (error) {
      console.warn(
        "Could not remove missing Cloudinary video:",
        error.message
      );
    } else {
      console.log(
        "Removed missing Cloudinary video:",
        video.title,
        video.storage_path
      );
    }
  }

  const missingIds = new Set(
    missing.map(result => result.video.id)
  );

  return dbVideos.filter(video => !missingIds.has(video.id));
}
  async function renderStudioVideos() {
  const body = q("#gtStudioBody");
  const me = user();
  const db = client();

  if (!body || !me || !db) return;

  body.innerHTML = "Loading your videos...";

  const { data: remoteVideos, error } = await db
    .from("videos")
    .select("*")
    .eq("creator_id", me.id)
    .eq("is_deleted", false)
    .order("created_at", { ascending: false });

  if (error) {
    body.innerHTML = `
      <div class="gt-card">
        <h3>Could not load your videos</h3>
        <p>${esc(error.message)}</p>
      </div>
    `;
    return;
  }

  /*
   * Check Cloudinary videos.
   * 404 = file is gone, so remove the database record.
   * Other errors = keep the video.
   */
  const owned = [];

  for (const video of remoteVideos || []) {
    const url = video.storage_path;

    if (
      typeof url === "string" &&
      url.startsWith("https://res.cloudinary.com/")
    ) {
      try {
        const response = await fetch(url, {
          method: "HEAD",
          cache: "no-store"
        });

        if (response.status === 404) {
          const { error: deleteError } = await db
            .from("videos")
            .delete()
            .eq("id", video.id);

          if (deleteError) {
            console.warn(
              "Could not delete missing Cloudinary video:",
              deleteError.message
            );

            owned.push(video);
          } else {
            console.log(
              "Deleted missing Cloudinary video:",
              video.title
            );
          }

          continue;
        }
      } catch (checkError) {
        console.warn(
          "Cloudinary check failed:",
          checkError
        );
      }
    }

    owned.push(video);
  }

  if (Array.isArray(videos)) {
    const localByPath = new Map(
      videos.map(video => [video.storage_path, video])
    );

    videos = [
      ...owned.map(video => ({
        ...(localByPath.get(video.storage_path) || {}),
        ...video
      })),
      ...videos.filter(video =>
        !owned.some(
          item => item.storage_path === video.storage_path
        ) &&
        video.creator_id !== me.id
      )
    ];
  }

  if (!owned.length) {
    body.innerHTML = `
      <div class="gt-card">
        <h2>No managed videos yet</h2>
        <p>Upload a video from Creator Studio.</p>
      </div>
    `;
    return;
  }

  body.innerHTML = "";

  owned.forEach(video => {
    const item = document.createElement("div");

    item.className = "gt-card gt-studio-item";

    item.innerHTML = `
      <div>
        <img
          src="${esc(video.thumbnail || "gusty.jpeg")}"
          onerror="this.src='gusty.jpeg'"
          alt=""
        >
      </div>

      <div class="gt-form">
        <label>Title</label>

        <input
          data-gt-title
          maxlength="120"
          value="${esc(video.title || "")}"
        >

        <label>Category</label>

        <select data-gt-category>
          ${["Gaming", "Music", "Animation", "Funny"]
            .map(category => `
              <option value="${esc(category)}" ${
                video.category === category ? "selected" : ""
              }>
                ${esc(category)}
              </option>
            `)
            .join("")}
        </select>

        <label>Description</label>

        <textarea
          data-gt-description
          maxlength="2000"
        >${esc(video.description || "")}</textarea>

        <label>Replace thumbnail</label>

        <input
          data-gt-thumb
          type="file"
          accept="image/png,image/jpeg,image/webp"
        >

        <div class="gt-actions">
          <button
            class="gt-button gt-primary"
            data-gt-save
          >
            Save changes
          </button>

          <button
            class="gt-button gt-secondary"
            data-gt-watch
          >
            Watch
          </button>

          <button
            class="gt-button gt-danger"
            data-gt-delete
          >
            Delete
          </button>
        </div>

        <p class="gt-muted" data-gt-status></p>
      </div>
    `;

    const status = q("[data-gt-status]", item);

    q("[data-gt-watch]", item).onclick = () => {
      closeStudio();

      if (typeof openVideo === "function") {
        openVideo(video);
      }
    };

    q("[data-gt-save]", item).onclick = async () => {
      status.textContent = "Saving...";

      const title = q(
        "[data-gt-title]",
        item
      ).value.trim();

      const category = q(
        "[data-gt-category]",
        item
      ).value;

      const description =
        q(
          "[data-gt-description]",
          item
        ).value.trim() || null;

      const thumbFile =
        q(
          "[data-gt-thumb]",
          item
        ).files?.[0];

      if (!title) {
        status.textContent = "Title is required.";
        return;
      }

      const updates = {
        title,
        category,
        description,
        updated_at: new Date().toISOString()
      };

      if (thumbFile) {
        if (!thumbFile.type.startsWith("image/")) {
          status.textContent = "Thumbnail must be an image.";
          return;
        }

        if (thumbFile.size > 5 * 1024 * 1024) {
          status.textContent = "Thumbnail must be 5 MB or smaller.";
          return;
        }

        const safeThumb = thumbFile.name.replace(
          /[^a-zA-Z0-9._-]/g,
          "_"
        );

        const path =
          `thumb__${me.id}__${Date.now()}__${Math.random()
            .toString(36)
            .slice(2, 8)}__${safeThumb}`;

        const { error: uploadError } = await db.storage
          .from("videos")
          .upload(path, thumbFile);

        if (uploadError) {
          status.textContent = uploadError.message;
          return;
        }

        updates.thumbnail_path = path;

        updates.thumbnail = db.storage
          .from("videos")
          .getPublicUrl(path)
          .data.publicUrl;
      }

      const { data, error: updateError } = await db
        .from("videos")
        .update(updates)
        .eq("id", video.id)
        .eq("creator_id", me.id)
        .select("*")
        .single();

      if (updateError) {
        status.textContent = updateError.message;
        return;
      }

      if (
        thumbFile &&
        video.thumbnail_path &&
        video.thumbnail_path !== data.thumbnail_path
      ) {
        db.storage
          .from("videos")
          .remove([video.thumbnail_path])
          .catch(() => {});
      }

      Object.assign(video, data);

      status.textContent = "Saved.";

      if (typeof displayHomepage === "function") {
        displayHomepage();
      }

      await renderStudioVideos();
    };

    q("[data-gt-delete]", item).onclick = async () => {
      if (!confirm(`Delete "${video.title}"?`)) return;

      status.textContent = "Deleting...";

      const { error: deleteError } = await db
        .from("videos")
        .update({
          is_deleted: true,
          deleted_at: new Date().toISOString(),
          updated_at: new Date().toISOString()
        })
        .eq("id", video.id)
        .eq("creator_id", me.id);

      if (deleteError) {
        status.textContent = deleteError.message;
        return;
      }

      /*
       * Only remove the video file from Supabase Storage
       * when it is NOT a Cloudinary video.
       */
      const paths = [];

      if (
        video.storage_path &&
        !(
          typeof video.storage_path === "string" &&
          video.storage_path.startsWith(
            "https://res.cloudinary.com/"
          )
        )
      ) {
        paths.push(video.storage_path);
      }

      /*
       * Thumbnails are still stored in Supabase Storage.
       */
      if (video.thumbnail_path) {
        paths.push(video.thumbnail_path);
      }

      if (paths.length) {
        const { error: storageError } = await db.storage
          .from("videos")
          .remove(paths);

        if (storageError) {
          console.warn(
            "Storage delete:",
            storageError.message
          );
        }
      }

      if (Array.isArray(videos)) {
        videos = videos.filter(
          item => item.id !== video.id
        );
      }

      if (typeof displayHomepage === "function") {
        displayHomepage();
      }

      await renderStudioVideos();
    };

    body.appendChild(item);
  });
}
  async function renderStudioReports() {
  const body = q("#gtStudioBody");
  const me = user();
  const db = client();

  if (!body || !me || !db) return;

  body.innerHTML = "Loading reports...";

  const { data, error } = await db
    .from("video_reports")
    .select(`
      *,
      videos!inner(id, title, creator_id)
    `)
    .eq("videos.creator_id", me.id)
    .order("created_at", { ascending: false });

  if (error) {
    body.innerHTML = `
      <div class="gt-card">
        ${esc(error.message)}
      </div>
    `;
    return;
  }

  body.innerHTML = (data || []).map(report => `
    <div class="gt-card">
      <h3>${esc(report.videos?.title || "Video")}</h3>

      <p><strong>${esc(report.reason)}</strong></p>

      <p>${esc(report.details || "No additional details.")}</p>

      <small class="gt-muted">
        ${new Date(report.created_at).toLocaleString()}
      </small>

      <div class="gt-actions" style="margin-top:12px;">
        <button
          class="gt-button gt-primary"
          type="button"
          onclick="deleteReportedVideo('${report.videos?.id || report.video_id}')"
        >
          Delete Video
        </button>
      </div>
    </div>
  `).join("") || `
    <div class="gt-card">
      <h3>No reports.</h3>
      <p>Your videos don't have any reports right now.</p>
    </div>
  `;
}
 async function deleteReportedVideo(videoId) {
  if (!videoId) {
    alert("Could not find the video.");
    return;
  }

  if (!confirm("Delete this video?")) return;

  const db = client();
  const me = user();

  if (!db || !me) return;

  try {
    // Delete the video record from Supabase.
    // We do NOT try to delete the Cloudinary URL from Supabase Storage.
    const { error } = await db
      .from("videos")
      .delete()
      .eq("id", videoId)
      .eq("creator_id", me.id);

    if (error) throw error;

    alert("Video deleted.");

    // Refresh the reports list
    renderStudioReports();

  } catch (error) {
    console.error("Delete failed:", error);
    alert("Couldn't delete the video: " + error.message);
  }
}


  async function renderStudioPlaylists() {
    const body = q("#gtStudioBody");
    if (!body) return;
    const playlists = await loadPlaylists();
    body.innerHTML = playlists.map(playlist => `
      <div class="gt-card">
        <h3>${esc(playlist.name)}</h3>
        <p class="gt-muted">
          ${esc(playlist.description || "")}
        </p>
        <button
          class="gt-button gt-secondary"
          data-gt-open-playlist="${esc(playlist.id)}"
        >
          Open
        </button>
      </div>
    `).join("") || `
      <div class="gt-card">
        <h3>No playlists.</h3>
        <p>Create one from the Playlists button.</p>
      </div>
    `;
    qa("[data-gt-open-playlist]", body).forEach(button => {
      button.onclick = () =>
        openPlaylist(button.getAttribute("data-gt-open-playlist"));
    });
  }
  async function syncVideoMetadata() {
    if (GT.syncing) return;
    const db = client();
    const existing = currentVideos();
    if (!db || !existing.length) return;
    GT.syncing = true;
    try {
      const { data, error } = await db
        .from("videos")
        .select(`
          id,
          storage_path,
          creator_id,
          creator_name,
          title,
          category,
          description,
          thumbnail,
          thumbnail_path,
          views,
          created_at,
          is_deleted,
          deleted_at
        `);
      if (error) {
        console.warn("Video sync:", error.message);
        return;
      }
      const byPath = new Map(
        (data || []).map(row => [row.storage_path, row])
      );
      videos = existing
        .map(video => {
          const row = byPath.get(video.storage_path);
          return row ? { ...video, ...row } : video;
        })
        .filter(video => !video.is_deleted);
      if (typeof displayHomepage === "function") {
        displayHomepage();
      }
    } finally {
      GT.syncing = false;
    }
  }
  function installPlayerButtons() {
    const actionArea = q("#likeButton")?.parentElement;
    if (actionArea && !q("#gtPlaylistPlayerButton", actionArea)) {
      const button = document.createElement("button");
      button.id = "gtPlaylistPlayerButton";
      button.className = "gt-button gt-secondary";
      button.textContent = "➕ Playlist";
      button.onclick = addCurrentToPlaylist;
      actionArea.appendChild(button);
    }
    if (actionArea && !q("#gtReportPlayerButton", actionArea)) {
      const button = document.createElement("button");
      button.id = "gtReportPlayerButton";
      button.className = "gt-button gt-secondary";
      button.textContent = "🚩 Report";
      button.onclick = () => {
        const video =
          typeof currentVideo !== "undefined" ? currentVideo : null;
        if (video?.id) {
          openReport(video.id, video.title || "video");
        } else {
          alert(
            "This video cannot be reported yet because it has no database ID."
          );
        }
      };
      actionArea.appendChild(button);
    }
    const creatorButton = q("#playerCreator");
    if (creatorButton && !creatorButton.dataset.gtUpgraded) {
      creatorButton.dataset.gtUpgraded = "1";
      creatorButton.removeAttribute("onclick");
      creatorButton.addEventListener("click", () => {
        openChannelByName(creatorButton.textContent.trim());
      });
    }
    qa("button[onclick*='openOwnChannel']").forEach(button => {
      if (button.dataset.gtUpgraded) return;
      button.dataset.gtUpgraded = "1";
      button.removeAttribute("onclick");
      button.addEventListener("click", () => {
        const name =
          typeof creatorName !== "undefined" ? creatorName : "You";
        openChannelByName(name);
      });
    });
  }
  function injectNavigation() {
    const sidebar = q("#sidebar");
    if (sidebar) {
      if (!q("#gtPlaylistNav")) {
        const button = document.createElement("button");
        button.id = "gtPlaylistNav";
        button.className = "side-button";
        button.innerHTML = "📚 <span>Playlists</span>";
        button.onclick = openPlaylists;
        sidebar.appendChild(button);
      }
      if (!q("#gtStudioNav")) {
        const button = document.createElement("button");
        button.id = "gtStudioNav";
        button.className = "side-button";
        button.innerHTML = "🛠️ <span>Creator Studio</span>";
        button.onclick = openStudio;
        sidebar.appendChild(button);
      }
    }
    const uploadButton =
      q(".top-buttons button[title='Upload video']") ||
      q(".top-buttons button[title='Upload']");
    if (uploadButton && !uploadButton.dataset.gtUpgraded) {
      uploadButton.dataset.gtUpgraded = "1";
      uploadButton.removeAttribute("onclick");
      uploadButton.onclick = openUploader;
    }
    const notificationButton =
      q(".top-buttons button[title='Notifications']");
    if (notificationButton && !notificationButton.dataset.gtUpgraded) {
      notificationButton.dataset.gtUpgraded = "1";
      notificationButton.removeAttribute("onclick");
      notificationButton.onclick = showNotifications;
    }
    const account = q("#loggedInAccount");
    if (account && !q("#gtStudioAccountButton", account)) {
      const button = document.createElement("button");
      button.id = "gtStudioAccountButton";
      button.className = "primary-button";
      button.textContent = "🛠️ Creator Studio";
      button.onclick = openStudio;
      account.insertBefore(button, account.firstChild);
    }
  }
  async function startup() {
    injectStyles();
    ensureModals();
    injectNavigation();
    installPlayerButtons();
    injectBannerEditor();
    wrapProfileSave();
    if (user()) {
      await upsertOwnProfile().catch(() => {});
      await refreshNotificationCount();
    }
    await syncVideoMetadata();
    if (!GT.notificationTimer) {
      GT.notificationTimer = setInterval(() => {
        refreshNotificationCount();
      }, 15000);
    }
    if (!GT.syncTimer) {
      GT.syncTimer = setInterval(() => {
        injectNavigation();
        installPlayerButtons();
        injectBannerEditor();
        wrapProfileSave();
      }, 2500);
    }
  }
  document.addEventListener("DOMContentLoaded", () => {
    setTimeout(startup, 1200);
  });
  window.gtOpenChannelByName = openChannelByName;
  window.gtOpenOwnChannel = () => {
    const name =
      typeof creatorName !== "undefined" ? creatorName : "You";
    return openChannelByName(name);
  };
  window.gtCloseChannel = closeChannel;
  window.gtOpenReport = openReport;
  window.gtCloseReport = closeReport;
  window.gtOpenUploader = openUploader;
  window.gtCloseUpload = closeUpload;
  window.gtShowNotifications = showNotifications;
  window.gtCloseNotifications = closeNotifications;
  window.gtOpenPlaylists = openPlaylists;
  window.gtOpenPlaylist = openPlaylist;
  window.gtClosePlaylists = closePlaylists;
  window.gtOpenStudio = openStudio;
  window.gtCloseStudio = closeStudio;
  window.openVideoByPath = function (path) {
    const rawPath = String(path ?? "");
    let decodedPath = rawPath;
    try {
      decodedPath = decodeURIComponent(rawPath);
    } catch {
      // Keep raw path when it is not encoded.
    }
    const list = currentVideos();
    const video = list.find(item =>
      item.storage_path === rawPath ||
      item.storage_path === decodedPath ||
      item.id === rawPath ||
      item.video === rawPath ||
      item.url === rawPath
    );
    if (video && typeof openVideo === "function") {
      openVideo(video);
      return;
    }
    console.error("GryphonTube couldn't find video:", rawPath);
  };
})();
/* =========================================================
   GRYPHONTUBE CLOUDINARY STORAGE PATCH
   ========================================================= */

(() => {
  "use strict";

  const CLOUDINARY_CLOUD =
    "hzzgy02q";

  const CLOUDINARY_PRESET =
    "gryphontube";

  const CLOUDINARY_VIDEO_URL =
    `https://api.cloudinary.com/v1_1/${CLOUDINARY_CLOUD}/video/upload`;

  function getUser() {
    return typeof currentUser !== "undefined"
      ? currentUser
      : null;
  }

  function getClient() {
    return typeof supabaseClient !== "undefined"
      ? supabaseClient
      : null;
  }

  function getVideos() {
    return typeof videos !== "undefined" &&
      Array.isArray(videos)
      ? videos
      : [];
  }

  function setVideos(value) {
    if (typeof videos !== "undefined") {
      videos = value;
    }
  }

  /* =========================================================
     CLOUDINARY UPLOAD
     ========================================================= */

  async function cloudinaryUpload(file) {
    const formData = new FormData();

    formData.append(
      "file",
      file
    );

    formData.append(
      "upload_preset",
      CLOUDINARY_PRESET
    );

    const response =
      await fetch(
        CLOUDINARY_VIDEO_URL,
        {
          method: "POST",
          body: formData
        }
      );

    const data =
      await response.json();

    console.log(
      "Cloudinary response:",
      data
    );

    if (
      !response.ok ||
      !data.secure_url
    ) {
      throw new Error(
        data.error?.message ||
        "Cloudinary upload failed."
      );
    }

    console.log(
      "CLOUDINARY SUCCESS:",
      data.secure_url
    );

    return data;
  }

  /* =========================================================
     CREATOR STUDIO UPLOADER
     ========================================================= */

  async function cloudinaryHandleUpload(event) {
    event.preventDefault();

    const db =
      getClient();

    const me =
      getUser();

    const status =
      document.getElementById(
        "gtUploadStatus"
      );

    if (
      !db ||
      !me ||
      !status
    ) {
      return;
    }

    const videoFile =
      document.getElementById(
        "gtUploadVideoFile"
      )?.files?.[0];

    const thumbFile =
      document.getElementById(
        "gtUploadThumbnail"
      )?.files?.[0];

    const title =
      document.getElementById(
        "gtUploadTitle"
      )?.value.trim();

    const category =
      document.getElementById(
        "gtUploadCategory"
      )?.value ||
      "Funny";

    const description =
      document.getElementById(
        "gtUploadDescription"
      )?.value.trim() ||
      null;

    if (!videoFile) {
      status.textContent =
        "Choose a video.";
      return;
    }

    if (
      !videoFile.type.startsWith(
        "video/"
      )
    ) {
      status.textContent =
        "That isn't a video file.";
      return;
    }

    if (thumbFile) {
      if (
        !thumbFile.type.startsWith(
          "image/"
        )
      ) {
        status.textContent =
          "The thumbnail must be an image.";
        return;
      }

      if (
        thumbFile.size >
        5 * 1024 * 1024
      ) {
        status.textContent =
          "Thumbnail must be 5 MB or smaller.";
        return;
      }
    }

    try {
      /* VIDEO → CLOUDINARY */

      status.textContent =
        "Uploading video...";

      const cloudinaryData =
        await cloudinaryUpload(
          videoFile
        );

      const videoUrl =
        cloudinaryData.secure_url;

      /* THUMBNAIL → SUPABASE */

      let thumbnailUrl =
        "gusty.jpeg";

      let thumbnailPath =
        null;

      if (thumbFile) {
        status.textContent =
          "Uploading thumbnail...";

        const safeThumb =
          thumbFile.name.replace(
            /[^a-zA-Z0-9._-]/g,
            "_"
          );

        thumbnailPath =
          `thumb__${me.id}__${Date.now()}__${Math.random()
            .toString(36)
            .slice(2, 8)}__${safeThumb}`;

        const {
          error: thumbError
        } =
          await db.storage
            .from("videos")
            .upload(
              thumbnailPath,
              thumbFile
            );

        if (thumbError) {
          console.warn(
            "Thumbnail upload:",
            thumbError.message
          );
        } else {
          thumbnailUrl =
            db.storage
              .from("videos")
              .getPublicUrl(
                thumbnailPath
              )
              .data.publicUrl;
        }
      }

      /* DATABASE RECORD */

      status.textContent =
        "Saving video information...";

      const {
        data,
        error
      } =
        await db
          .from("videos")
          .insert({
            storage_path:
              videoUrl,

            title:
              title ||
              videoFile.name.replace(
                /\.[^/.]+$/,
                ""
              ),

            creator_id:
              me.id,

            creator_name:
              typeof creatorName !==
              "undefined"
                ? creatorName
                : (
                    me.user_metadata
                      ?.creator_name ||
                    "You"
                  ),

            category,

            description,

            thumbnail:
              thumbnailUrl,

            thumbnail_path:
              thumbnailPath,

            views:
              0,

            is_deleted:
              false
          })
          .select("*")
          .single();

      if (error) {
        status.textContent =
          `Database save failed: ${error.message}`;

        return;
      }

      /* LOCAL VIDEO */

      const newVideo = {
        ...data,

        video:
          videoUrl,

        storage_path:
          videoUrl,

        thumbnail:
          thumbnailUrl,

        views:
          0,

        created_at:
          data?.created_at ||
          new Date().toISOString()
      };

      const current =
        getVideos();

      setVideos([
        newVideo,
        ...current
      ]);

      if (
        typeof displayHomepage ===
        "function"
      ) {
        displayHomepage();
      }

      if (
        typeof gtCloseUpload ===
        "function"
      ) {
        gtCloseUpload();
      } else {
        document
          .getElementById(
            "gtUploadModal"
          )
          ?.classList.add(
            "hidden"
          );
      }

      if (
        typeof loadComments !==
        "function"
      ) {
        window.loadComments =
          async function () {
            const list =
              document.getElementById(
                "commentList"
              );

            if (list) {
              list.innerHTML =
                "";
            }
          };
      }

      if (
        typeof openVideo ===
        "function"
      ) {
        try {
          await openVideo(
            newVideo
          );
        } catch (error) {
          console.warn(
            "Video opened, but openVideo reported an error:",
            error
          );
        }
      }

    } catch (error) {
      console.error(
        "Cloudinary upload error:",
        error
      );

      status.textContent =
        `Upload failed: ${error.message}`;
    }
  }

  /* =========================================================
     TOP UPLOAD BUTTON
     ========================================================= */

  function installCreatorUploader() {
    const button =
      document.querySelector(
        ".top-buttons button[title='Upload video']"
      ) ||
      document.querySelector(
        ".top-buttons button[title='Upload']"
      );

    if (button) {
      button.onclick =
        openCloudinaryUploader;
    }
  }

  async function openCloudinaryUploader() {
    if (
      typeof gtOpenUploader ===
      "function"
    ) {
      gtOpenUploader();
    }

    setTimeout(
      () => {
        const form =
          document.getElementById(
            "gtUploadForm"
          );

        if (form) {
          form.onsubmit =
            cloudinaryHandleUpload;

          console.log(
            "GryphonTube uploader connected to Cloudinary."
          );
        }
      },
      0
    );
  }

  /* =========================================================
     OLD SIMPLE UPLOADER
     ========================================================= */

  window.uploadVideo =
    async function (event) {
      const user =
        getUser();

      if (!user) {
        event.target.value =
          "";

        alert(
          "You need an account to upload."
        );

        if (
          typeof openAccount ===
          "function"
        ) {
          openAccount();
        }

        return;
      }

      const file =
        event.target.files?.[0];

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

      try {
        console.log(
          "Uploading video to Cloudinary:",
          file.name
        );

        const cloudinaryData =
          await cloudinaryUpload(
            file
          );

        const videoUrl =
          cloudinaryData.secure_url;

        const title =
          file.name.replace(
            /\.[^/.]+$/,
            ""
          );

        const db =
          getClient();

        let data =
          null;

        if (db) {
          const result =
            await db
              .from("videos")
              .insert({
                storage_path:
                  videoUrl,

                title,

                creator_id:
                  user.id,

                creator_name:
                  typeof creatorName !==
                  "undefined"
                    ? creatorName
                    : "You",

                category:
                  "Funny",

                views:
                  0,

                is_deleted:
                  false,

                thumbnail:
                  "gusty.jpeg"
              })
              .select("*")
              .single();

          data =
            result.data;

          if (result.error) {
            console.warn(
              "Metadata warning:",
              result.error.message
            );
          }
        }

        const newVideo = {
          ...(data || {}),

          id:
            data?.id ||
            null,

          storage_path:
            videoUrl,

          title,

          creator_id:
            user.id,

          creator_name:
            typeof creatorName !==
            "undefined"
              ? creatorName
              : "You",

          video:
            videoUrl,

          thumbnail:
            "gusty.jpeg",

          views:
            0,

          category:
            "Funny",

          created_at:
            data?.created_at ||
            new Date().toISOString()
        };

        const current =
          getVideos();

        setVideos([
          newVideo,
          ...current
        ]);

        if (
          typeof displayHomepage ===
          "function"
        ) {
          displayHomepage();
        }

        alert(
          "Video uploaded!"
        );

        if (
          typeof loadComments !==
          "function"
        ) {
          window.loadComments =
            async function () {
              const list =
                document.getElementById(
                  "commentList"
                );

              if (list) {
                list.innerHTML =
                  "";
              }
            };
        }

        if (
          typeof openVideo ===
          "function"
        ) {
          try {
            await openVideo(
              newVideo
            );
          } catch (error) {
            console.warn(
              "Video opened, but openVideo reported an error:",
              error
            );
          }
        }

      } catch (error) {
        console.error(
          "UPLOAD ERROR:",
          error
        );

        alert(
          "Upload failed: " +
          error.message
        );

      } finally {
        event.target.value =
          "";
      }
    };

  /* =========================================================
     LOAD VIDEOS
     ========================================================= */

  window.loadVideos =
    async function () {
      const db =
        getClient();

      if (!db) {
        return;
      }

      let storageVideos =
        [];

      let dbVideos =
        [];

      /* OLD SUPABASE STORAGE VIDEOS */

      try {
        const {
          data,
          error
        } =
          await db.storage
            .from("videos")
            .list();

        if (!error) {
          storageVideos =
            (data || [])
              .filter(file => {
                const name =
                  file.name.toLowerCase();

                return (
                  name.endsWith(".mp4") ||
                  name.endsWith(".webm") ||
                  name.endsWith(".ogg")
                );
              })
              .map(file => {
                const {
                  data: urlData
                } =
                  db.storage
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

                  thumbnail_path:
                    null,

                  description:
                    null,

                  views:
                    0,

                  category:
                    "Funny",

                  created_at:
                    file.created_at ||
                    file.updated_at ||
                    new Date().toISOString(),

                  is_deleted:
                    false
                };
              });
        }
      } catch (error) {
        console.warn(
          "Supabase storage load:",
          error
        );
      }

      /* DATABASE */

      try {
        const {
          data,
          error
        } =
          await db
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
  dbVideos = data || [];

  const checkedVideos = [];

  for (const video of dbVideos) {
    const url = video.storage_path;

    if (
      typeof url === "string" &&
      url.startsWith("https://res.cloudinary.com/")
    ) {
      try {
        const response = await fetch(url, {
          method: "HEAD",
          cache: "no-store"
        });

        if (response.status === 404) {
          const { error: deleteError } = await db
            .from("videos")
            .delete()
            .eq("id", video.id);

          if (deleteError) {
            console.warn(
              "Could not remove missing Cloudinary video:",
              deleteError.message
            );
            checkedVideos.push(video);
          } else {
            console.log(
              "Removed missing Cloudinary video:",
              video.title
            );
          }

          continue;
        }
      } catch (checkError) {
        console.warn(
          "Cloudinary existence check failed:",
          checkError
        );
      }
    }

    checkedVideos.push(video);
  }

  dbVideos = checkedVideos;
}

} catch (error) {
  console.warn(
    "Database video load:",
    error
  );
}

      const merged =
        [];

      /* OLD SUPABASE VIDEOS */

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
            ...metadata,

            video:
              storageVideo.video,

            storage_path:
              metadata.storage_path,

            thumbnail:
              metadata.thumbnail ||
              storageVideo.thumbnail
          });
        } else {
          merged.push(
            storageVideo
          );
        }
      }

      /* CLOUDINARY VIDEOS */

      for (
        const row
        of dbVideos
      ) {
        if (
          row.is_deleted
        ) {
          continue;
        }

        if (
          typeof row.storage_path !==
          "string"
        ) {
          continue;
        }

        const isCloudinary =
          row.storage_path.startsWith(
            "https://res.cloudinary.com/"
          );

        if (!isCloudinary) {
          continue;
        }

        const alreadyLoaded =
          merged.some(
            item =>
              item.storage_path ===
              row.storage_path
          );

        if (
          alreadyLoaded
        ) {
          continue;
        }

        merged.push({
          ...row,

          video:
            row.storage_path,

          storage_path:
            row.storage_path,

          thumbnail:
            row.thumbnail ||
            "gusty.jpeg",

          views:
            Number(
              row.views
            ) || 0
        });
      }

      setVideos(
        merged
          .filter(
            video =>
              !video.is_deleted
          )
          .sort(
            (a, b) =>
              new Date(
                b.created_at
              ) -
              new Date(
                a.created_at
              )
          )
      );

      if (
        typeof displayHomepage ===
        "function"
      ) {
        displayHomepage();
      }
    };

  /* =========================================================
     FIX MISSING COMMENTS FUNCTION
     ========================================================= */

  if (
    typeof window.loadComments !==
    "function"
  ) {
    window.loadComments =
      async function () {
        const list =
          document.getElementById(
            "commentList"
          );

        if (list) {
          list.innerHTML =
            "";
        }
      };
  }

  /* =========================================================
     INSTALL AFTER UPGRADES.JS HAS CREATED THE UPLOADER
     ========================================================= */

  function installEverything() {
    installCreatorUploader();

    const form =
      document.getElementById(
        "gtUploadForm"
      );

    if (form) {
      form.onsubmit =
        cloudinaryHandleUpload;
    }
  }

  window.addEventListener(
    "load",
    () => {
      setTimeout(
        installEverything,
        300
      );
    }
  );

  document.addEventListener(
    "DOMContentLoaded",
    () => {
      setTimeout(
        installEverything,
        1500
      );
    }
  );

  setInterval(
    installEverything,
    2500
  );

  console.log(
    "GryphonTube Cloudinary patch loaded."
  );

})();
