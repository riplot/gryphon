/* =========================================================
   GRYPHONTUBE UPGRADE PACK
   Adds:
   1) Better channel pages
   2) Reporting / moderation
   3) Custom thumbnails + upload manager
   4) Real notifications
   5) Playlists
   6) Creator Studio / video management
   ========================================================= */

(() => {
  "use strict";

  if (window.__gryphonTubeUpgradePackLoaded) return;
  window.__gryphonTubeUpgradePackLoaded = true;

  const GT = {
    profileCache: new Map(),
    notificationTimer: null,
    syncTimer: null,
    lastVideoSignature: "",
    syncRunning: false
  };

  function q(selector, root = document) {
    return root.querySelector(selector);
  }

  function qa(selector, root = document) {
    return Array.from(root.querySelectorAll(selector));
  }

  function gtEsc(value) {
    return String(value ?? "")
      .replace(/&/g, "&amp;")
      .replace(/</g, "&lt;")
      .replace(/>/g, "&gt;")
      .replace(/"/g, "&quot;")
      .replace(/'/g, "&#39;");
  }

  function gtUserRequired() {
    if (typeof currentUser !== "undefined" && currentUser) return true;
    alert("Sign in to use this feature.");
    if (typeof openAccount === "function") openAccount();
    return false;
  }

  function gtCurrentVideos() {
    return typeof videos !== "undefined" && Array.isArray(videos) ? videos : [];
  }

  function gtCurrentUser() {
    return typeof currentUser !== "undefined" ? currentUser : null;
  }

  function gtClient() {
    return typeof supabaseClient !== "undefined" ? supabaseClient : null;
  }

  function gtShowModal(id) {
    const el = document.getElementById(id);
    if (el) el.classList.remove("hidden");
  }

  function gtHideModal(id) {
    const el = document.getElementById(id);
    if (el) el.classList.add("hidden");
  }

  function gtNotify(message) {
    if (typeof alert === "function") alert(message);
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

      .gt-actions {
        display: flex;
        gap: 8px;
        flex-wrap: wrap;
        margin-top: 10px;
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

      .gt-row {
        display: flex;
        gap: 12px;
        align-items: center;
        justify-content: space-between;
        flex-wrap: wrap;
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
      }

      .gt-channel-main {
        display: flex;
        gap: 18px;
        align-items: center;
        padding: 18px;
        margin-top: -36px;
      }

      .gt-channel-avatar {
        width: 92px;
        height: 92px;
        border-radius: 50%;
        display: flex;
        align-items: center;
        justify-content: center;
        color: #fff;
        font-size: 34px;
        font-weight: 800;
        border: 5px solid var(--card-bg, #fff);
        flex: 0 0 auto;
      }

      body.dark-mode .gt-channel-avatar {
        border-color: #181818;
      }

      .gt-tabs {
        display: flex;
        gap: 8px;
        flex-wrap: wrap;
        padding: 0 18px 18px;
      }

      .gt-tab.active {
        background: #673ab7;
        color: white;
      }

      .gt-stat {
        display: inline-block;
        margin-right: 10px;
        opacity: .8;
      }

      .gt-report-text {
        min-height: 100px;
      }

      .gt-studio-item {
        display: grid;
        grid-template-columns: 190px 1fr;
        gap: 14px;
      }

      .gt-studio-item + .gt-studio-item {
        margin-top: 14px;
      }

      @media (max-width: 700px) {
        .gt-studio-item {
          grid-template-columns: 1fr;
        }

        .gt-channel-main {
          align-items: flex-start;
          flex-direction: column;
          margin-top: -24px;
        }
      }
    `;

    document.head.appendChild(style);
  }

  function ensureBaseModals() {
    const existingIds = [
      "gtUploadModal",
      "gtStudioModal",
      "gtPlaylistModal",
      "gtNotificationModal",
      "gtReportModal",
      "gtChannelModal"
    ];

    for (const id of existingIds) {
      if (!document.getElementById(id)) {
        const div = document.createElement("div");
        div.id = id;
        div.className = "gt-overlay hidden";
        document.body.appendChild(div);
      }
    }
  }

  function setModal(id, innerHtml) {
    const modal = document.getElementById(id);
    if (!modal) return;
    modal.innerHTML = `<div class="gt-modal">${innerHtml}</div>`;
  }

  async function gtGetProfile(creatorId, fallbackName = "Creator") {
    if (!creatorId) {
      return {
        creator_id: null,
        channel_name: fallbackName,
        bio: "",
        color: "#673ab7"
      };
    }

    if (GT.profileCache.has(creatorId)) {
      return GT.profileCache.get(creatorId);
    }

    const client = gtClient();
    if (!client) return null;

    const { data, error } = await client
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
      color: "#673ab7"
    };

    GT.profileCache.set(creatorId, profile);
    return profile;
  }

  async function gtUpsertOwnProfile() {
    const user = gtCurrentUser();
    const client = gtClient();

    if (!user || !client) return;

    const name =
      typeof creatorName !== "undefined"
        ? creatorName
        : (user.user_metadata?.creator_name || "You");

    const bio =
      typeof creatorBio !== "undefined"
        ? creatorBio
        : (user.user_metadata?.bio || "");

    const color =
      typeof creatorColor !== "undefined"
        ? creatorColor
        : (user.user_metadata?.color || "#673ab7");

    const { error } = await client
      .from("creator_profiles")
      .upsert({
        creator_id: user.id,
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
      GT.profileCache.delete(user.id);
    }
  }
async function gtOpenChannelByName(name) {
  const cleanName = String(name || "").trim() || "Creator";

  const list = gtCurrentVideos().filter(
    video => video.creator_name === cleanName
  );

  const creatorId =
    list.find(video => video.creator_id)?.creator_id ||
    (
      gtCurrentUser() &&
      typeof creatorName !== "undefined" &&
      cleanName === creatorName
        ? gtCurrentUser().id
        : null
    );

  const profile = await gtGetProfile(
    creatorId,
    cleanName
  );

  const subscriberCount =
    typeof getSubscriberCount === "function" && creatorId
      ? await getSubscriberCount(creatorId)
      : 0;

  const own =
    !!gtCurrentUser() &&
    !!creatorId &&
    creatorId === gtCurrentUser().id;

  setModal(
    "gtChannelModal",
    `
      <button
        class="gt-close"
        onclick="gtCloseChannel()"
      >
        ✕
      </button>

      <div class="gt-channel-hero">

        <div
          class="gt-channel-banner"
          style="
            background:
              radial-gradient(
                circle at 20% 20%,
                rgba(255,255,255,.24),
                transparent 35%
              ),
              linear-gradient(
                120deg,
                ${gtEsc(profile?.color || "#673ab7")},
                #1976d2
              );
          "
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
            style="
              background:${gtEsc(
                profile?.color || "#673ab7"
              )};
              width:92px;
              height:92px;
              min-width:92px;
              min-height:92px;
              box-sizing:border-box;
            "
          >
            ${gtEsc(
              (profile?.channel_name || cleanName)
                .slice(0,1)
                .toUpperCase()
            )}
          </div>

          <div
            style="
              min-width:0;
              width:100%;
              overflow:visible;
            "
          >

            <h1
              style="
                margin:0 0 10px 0;
                line-height:1.2;
                overflow-wrap:anywhere;
                word-break:break-word;
              "
            >
              ${gtEsc(
                profile?.channel_name || cleanName
              )}
            </h1>

            <div
              style="
                display:flex;
                flex-wrap:wrap;
                align-items:center;
                gap:8px 14px;
                margin-top:8px;
              "
            >

              <span
                class="gt-stat"
                style="
                  display:inline-block;
                  white-space:nowrap;
                  margin:0;
                "
              >
                ${list.length}
                video${list.length === 1 ? "" : "s"}
              </span>

              <span
                class="gt-stat"
                style="
                  display:inline-block;
                  white-space:nowrap;
                  margin:0;
                "
              >
                ${subscriberCount}
                subscriber${subscriberCount === 1 ? "" : "s"}
              </span>

            </div>

            <p
              class="gt-muted"
              style="
                margin:10px 0 0;
                line-height:1.5;
                overflow-wrap:anywhere;
                word-break:break-word;
                max-width:100%;
              "
            >
              ${gtEsc(profile?.bio || "")}
            </p>

          </div>

          <div
            class="gt-actions"
            style="
              display:flex;
              flex-wrap:wrap;
              gap:8px;
              align-items:center;
              justify-content:flex-end;
              min-width:150px;
            "
          >

            ${
              own
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
                `
            }

          </div>

        </div>

        <div
          class="gt-tabs"
          style="
            display:flex;
            flex-wrap:wrap;
            gap:8px;
            padding:0 22px 18px;
          "
        >

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
    `
  );

  const body = q("#gtChannelBody");

  function renderChannelVideos() {
    if (!body) return;

    body.innerHTML = `
      <div
        class="gt-grid"
        style="
          display:grid;
          grid-template-columns:
            repeat(
              auto-fill,
              minmax(230px,280px)
            );
          justify-content:start;
          align-items:start;
          gap:18px;
          padding:0 22px 22px;
        "
      >
        ${
          list.length
            ? list
                .map(
                  video => `
                    <div
                      class="gt-card"
                      style="
                        width:100%;
                        max-width:280px;
                        min-width:0;
                        box-sizing:border-box;
                        overflow:hidden;
                      "
                    >

                      <img
                        src="${gtEsc(
                          video.thumbnail || "gusty.jpeg"
                        )}"
                        alt=""
                        onerror="this.src='gusty.jpeg'"
                        style="
                          display:block;
                          width:100%;
                          aspect-ratio:16/9;
                          object-fit:cover;
                          border-radius:10px;
                        "
                      >

                      <h3
                        style="
                          margin:10px 0 6px;
                          line-height:1.3;
                          overflow-wrap:anywhere;
                          word-break:break-word;
                        "
                      >
                        ${gtEsc(
                          video.title || "Untitled"
                        )}
                      </h3>

                      <p
                        class="gt-muted"
                        style="
                          line-height:1.4;
                          overflow-wrap:anywhere;
                          word-break:break-word;
                        "
                      >
                        ${
                          typeof formatViews === "function"
                            ? gtEsc(
                                formatViews(
                                  video.views
                                )
                              )
                            : `${video.views || 0} views`
                        }
                      </p>

                      <button
                        class="gt-button gt-secondary"
                        data-gt-play="${gtEsc(
                          video.storage_path
                        )}"
                      >
                        Watch
                      </button>

                    </div>
                  `
                )
                .join("")
            : `
              <div
                class="gt-card"
                style="
                  grid-column:1/-1;
                "
              >
                <h3>No videos yet</h3>
                <p>
                  This channel hasn't uploaded anything.
                </p>
              </div>
            `
        }
      </div>
    `;

    body
      .querySelectorAll("[data-gt-play]")
      .forEach(button => {
        button.addEventListener(
          "click",
          event => {
            event.stopPropagation();

            const path =
              button.getAttribute(
                "data-gt-play"
              );

            const video =
              gtCurrentVideos().find(
                v =>
                  v.storage_path === path
              );

            if (
              video &&
              typeof openVideo === "function"
            ) {
              gtCloseChannel();
              openVideo(video);
            }
          }
        );
      });
  }

  function renderChannelAbout() {
    if (!body) return;

    body.innerHTML = `
      <div
        class="gt-card"
        style="
          margin:0 22px 22px;
        "
      >

        <h2>About</h2>

        <p
          style="
            line-height:1.6;
            overflow-wrap:anywhere;
            word-break:break-word;
          "
        >
          ${gtEsc(
            profile?.bio ||
            "No channel bio yet."
          )}
        </p>

        <p class="gt-muted">
          ${list.length}
          video${list.length === 1 ? "" : "s"}
          •
          ${subscriberCount}
          subscriber${subscriberCount === 1 ? "" : "s"}
        </p>

      </div>
    `;
  }

  renderChannelVideos();

  const subscribeButton =
    q("#gtChannelSubscribeButton");

  if (
    subscribeButton &&
    creatorId &&
    typeof toggleSubscription === "function"
  ) {
    if (!gtCurrentUser()) {

      subscribeButton.textContent =
        "🔒 Sign in to Subscribe";

    } else if (own) {

      subscribeButton.textContent =
        "Your Channel";

      subscribeButton.disabled = true;

    } else {

      const { data } =
        await gtClient()
          .from("channel_subscriptions")
          .select("creator_id")
          .eq(
            "subscriber_id",
            gtCurrentUser().id
          )
          .eq(
            "creator_id",
            creatorId
          )
          .maybeSingle();

      const subscribed =
        !!data;

      subscribeButton.textContent =
        subscribed
          ? "✓ Subscribed"
          : "Subscribe";

      subscribeButton.classList.toggle(
        "subscribed",
        subscribed
      );

      subscribeButton.onclick =
        async () => {

          await toggleSubscription(
            creatorId,
            cleanName
          );

          await gtOpenChannelByName(
            cleanName
          );
        };
    }
  }

  const videosTab =
    q("#gtChannelVideosTab");

  const aboutTab =
    q("#gtChannelAboutTab");

  if (
    videosTab &&
    aboutTab
  ) {

    videosTab.onclick =
      () => {

        videosTab.classList.add(
          "active"
        );

        aboutTab.classList.remove(
          "active"
        );

        renderChannelVideos();
      };

    aboutTab.onclick =
      () => {

        aboutTab.classList.add(
          "active"
        );

        videosTab.classList.remove(
          "active"
        );

        renderChannelAbout();
      };
  }

  gtShowModal(
    "gtChannelModal"
  );
}

    const subscribeButton = q("#gtChannelSubscribeButton");

    if (
      subscribeButton &&
      creatorId &&
      typeof toggleSubscription === "function"
    ) {
      if (!gtCurrentUser()) {
        subscribeButton.textContent = "🔒 Sign in to Subscribe";
      } else if (own) {
        subscribeButton.textContent = "Your Channel";
        subscribeButton.disabled = true;
      } else {
        const { data } = await gtClient()
          .from("channel_subscriptions")
          .select("creator_id")
          .eq("subscriber_id", gtCurrentUser().id)
          .eq("creator_id", creatorId)
          .maybeSingle();

        const subscribed = !!data;

        subscribeButton.textContent =
          subscribed ? "✓ Subscribed" : "Subscribe";

        subscribeButton.classList.toggle("subscribed", subscribed);

        subscribeButton.onclick = async () => {
          await toggleSubscription(creatorId, cleanName);
          gtOpenChannelByName(cleanName);
        };
      }
    }

    const videosTab = q("#gtChannelVideosTab");
    const aboutTab = q("#gtChannelAboutTab");

    if (videosTab && aboutTab && body) {
      videosTab.onclick = () => {
        videosTab.classList.add("active");
        aboutTab.classList.remove("active");

        body.innerHTML = `
          <div class="gt-grid">
            ${
              list.length
                ? list.map(video => `
                  <div class="gt-card">
                    <img
                      src="${gtEsc(video.thumbnail || "gusty.jpeg")}"
                      alt=""
                      onerror="this.src='gusty.jpeg'"
                    >

                    <h3>${gtEsc(video.title || "Untitled")}</h3>

                    <p class="gt-muted">
                      ${
                        typeof formatViews === "function"
                          ? gtEsc(formatViews(video.views))
                          : `${video.views || 0} views`
                      }
                    </p>

                    <button
                      class="gt-button gt-secondary"
                      data-gt-play="${gtEsc(video.storage_path)}"
                    >
                      Watch
                    </button>
                  </div>
                `).join("")
                : `<div class="gt-card"><h3>No videos yet</h3></div>`
            }
          </div>
        `;
      };

      aboutTab.onclick = () => {
        aboutTab.classList.add("active");
        videosTab.classList.remove("active");

        body.innerHTML = `
          <div class="gt-card">
            <h2>About</h2>

            <p>
              ${gtEsc(profile?.bio || "No channel bio yet.")}
            </p>

            <p class="gt-muted">
              ${list.length} uploaded video${list.length === 1 ? "" : "s"}
              •
              ${subscriberCount} subscriber${subscriberCount === 1 ? "" : "s"}
            </p>
          </div>
        `;
      };
    }

    q("#gtChannelModal")
      .querySelectorAll("[data-gt-play]")
      .forEach(button => {
        button.addEventListener("click", event => {
          event.stopPropagation();

          const path = button.getAttribute("data-gt-play");
          const video = gtCurrentVideos()
            .find(v => v.storage_path === path);

          if (video && typeof openVideo === "function") {
            gtCloseChannel();
            openVideo(video);
          }
        });
      });

    gtShowModal("gtChannelModal");
  }

  function gtCloseChannel() {
    gtHideModal("gtChannelModal");
  }

  function gtOpenReport(videoId, title = "video") {
    if (!gtUserRequired()) return;

    setModal("gtReportModal", `
      <button class="gt-close" onclick="gtCloseReport()">✕</button>

      <h1>Report ${gtEsc(title)}</h1>

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
          class="gt-report-text"
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

        const client = gtClient();
        const user = gtCurrentUser();

        if (!client || !user) return;

        const status = q("#gtReportStatus");
        status.textContent = "Submitting...";

        const { error } = await client
          .from("video_reports")
          .insert({
            video_id: videoId,
            reporter_id: user.id,
            reason: q("#gtReportReason").value,
            details: q("#gtReportDetails").value.trim() || null
          });

        if (error) {
          status.textContent = error.message;
          return;
        }

        status.textContent = "Report submitted.";
        setTimeout(gtCloseReport, 700);
      };
    }

    gtShowModal("gtReportModal");
  }

  function gtCloseReport() {
    gtHideModal("gtReportModal");
  }

  function gtOpenUploader() {
    if (!gtUserRequired()) return;

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
          id="gtUploadTitle"
          maxlength="120"
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
    const titleInput = q("#gtUploadTitle");
    const videoInput = q("#gtUploadVideoFile");

    if (videoInput && titleInput) {
      videoInput.addEventListener("change", () => {
        const file = videoInput.files?.[0];

        if (file && !titleInput.value.trim()) {
          titleInput.value = file.name.replace(/\.[^/.]+$/, "");
        }
      });
    }

    if (form) {
      form.onsubmit = gtHandleUpload;
    }

    gtShowModal("gtUploadModal");
  }

  async function gtHandleUpload(event) {
    event.preventDefault();

    const client = gtClient();
    const user = gtCurrentUser();

    if (!client || !user) return;

    const status = q("#gtUploadStatus");

    const videoFile =
      q("#gtUploadVideoFile")?.files?.[0];

    const thumbnailFile =
      q("#gtUploadThumbnail")?.files?.[0];

    const title =
      q("#gtUploadTitle")?.value.trim();

    const category =
      q("#gtUploadCategory")?.value || "Funny";

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

    if (videoFile.size > 50 * 1024 * 1024) {
      status.textContent =
        "That video is over the 50 MB Supabase limit.";
      return;
    }

    if (thumbnailFile) {
      if (!thumbnailFile.type.startsWith("image/")) {
        status.textContent =
          "The thumbnail must be an image.";
        return;
      }

      if (thumbnailFile.size > 5 * 1024 * 1024) {
        status.textContent =
          "Thumbnail must be 5 MB or smaller.";
        return;
      }
    }

    status.textContent = "Uploading video...";

    const safeVideoName =
      videoFile.name.replace(
        /[^a-zA-Z0-9._-]/g,
        "_"
      );

    const videoPath =
      `${user.id}__${Date.now()}__${Math.random()
        .toString(36).slice(2, 8)}__${safeVideoName}`;

    const {
      error: videoError
    } = await client.storage
      .from("videos")
      .upload(videoPath, videoFile);

    if (videoError) {
      status.textContent =
        `Video upload failed: ${videoError.message}`;
      return;
    }

    let thumbnailUrl = "gusty.jpeg";
    let thumbnailPath = null;

    if (thumbnailFile) {
      status.textContent =
        "Uploading thumbnail...";

      const safeThumbName =
        thumbnailFile.name.replace(
          /[^a-zA-Z0-9._-]/g,
          "_"
        );

      thumbnailPath =
        `thumb__${user.id}__${Date.now()}__${Math.random()
          .toString(36).slice(2, 8)}__${safeThumbName}`;

      const {
        error: thumbError
      } = await client.storage
        .from("videos")
        .upload(
          thumbnailPath,
          thumbnailFile
        );

      if (thumbError) {
        console.warn(
          "Thumbnail upload:",
          thumbError.message
        );
      } else {
        thumbnailUrl =
          client.storage
            .from("videos")
            .getPublicUrl(thumbnailPath)
            .data.publicUrl;
      }
    }

    status.textContent =
      "Saving video information...";

    const {
      data,
      error
    } = await client
      .from("videos")
      .insert({
        storage_path: videoPath,
        title:
          title ||
          videoFile.name.replace(
            /\.[^/.]+$/,
            ""
          ),
        creator_id: user.id,
        creator_name:
          typeof creatorName !== "undefined"
            ? creatorName
            : (
                user.user_metadata
                  ?.creator_name || "You"
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
      status.textContent =
        `Database save failed: ${error.message}`;
      return;
    }

    const publicUrl =
      client.storage
        .from("videos")
        .getPublicUrl(videoPath)
        .data.publicUrl;

    const newVideo = {
      ...data,
      video: publicUrl,
      thumbnail: thumbnailUrl,
      storage_path: videoPath,
      views: 0,
      created_at:
        data.created_at ||
        new Date().toISOString()
    };

    if (Array.isArray(videos)) {
      videos = [newVideo, ...videos];
    }

    if (typeof displayHomepage === "function") {
      displayHomepage();
    }

    gtCloseUpload();

    if (typeof openVideo === "function") {
      openVideo(newVideo);
    }
  }

  function gtCloseUpload() {
    gtHideModal("gtUploadModal");
  }

  function gtEnsureBellBadge() {
    const bell =
      document.querySelector(
        ".top-buttons button[title='Notifications']"
      );

    if (!bell) return null;

    let badge =
      bell.querySelector(".gt-badge");

    if (!badge) {
      badge = document.createElement("span");
      badge.className = "gt-badge";
      badge.style.display = "none";
      badge.textContent = "0";
      bell.appendChild(badge);
    }

    return badge;
  }

  async function gtRefreshNotificationCount() {
    const badge = gtEnsureBellBadge();
    const user = gtCurrentUser();
    const client = gtClient();

    if (!badge || !user || !client) {
      if (badge) badge.style.display = "none";
      return;
    }

    const {
      count,
      error
    } = await client
      .from("notifications")
      .select("id", {
        count: "exact",
        head: true
      })
      .eq("recipient_id", user.id)
      .is("read_at", null);

    if (error) {
      badge.style.display = "none";
      return;
    }

    if ((count || 0) > 0) {
      badge.textContent =
        count > 99 ? "99+" : String(count);

      badge.style.display = "inline-flex";
    } else {
      badge.style.display = "none";
    }
  }

  async function gtShowNotifications() {
    const user = gtCurrentUser();
    const client = gtClient();

    if (!gtUserRequired()) return;
    if (!user || !client) return;

    setModal("gtNotificationModal", `
      <button
        class="gt-close"
        onclick="gtCloseNotifications()"
      >
        ✕
      </button>

      <div class="gt-row">
        <div>
          <h1>Notifications</h1>
          <p class="gt-muted">
            Subscriptions, comments, likes, and live alerts.
          </p>
        </div>

        <button
          class="gt-button gt-secondary"
          id="gtMarkAllRead"
        >
          Mark all read
        </button>
      </div>

      <div id="gtNotificationList">
        Loading...
      </div>
    `);

    const list = q("#gtNotificationList");

    const {
      data,
      error
    } = await client
      .from("notifications")
      .select("*")
      .eq("recipient_id", user.id)
      .order("created_at", {
        ascending: false
      })
      .limit(50);

    if (error) {
      list.textContent =
        error.message;

      gtShowModal(
        "gtNotificationModal"
      );

      return;
    }

    list.innerHTML =
      (data || [])
        .map(notification => `
          <div
            class="gt-notification ${notification.read_at ? "" : "unread"}"
            data-id="${gtEsc(notification.id)}"
          >
            <strong>
              ${gtEsc(
                notification.title ||
                "GryphonTube"
              )}
            </strong>

            <div>
              ${gtEsc(
                notification.body || ""
              )}
            </div>

            <small class="gt-muted">
              ${
                typeof formatDate === "function"
                  ? gtEsc(
                      formatDate(
                        notification.created_at
                      )
                    )
                  : new Date(
                      notification.created_at
                    ).toLocaleString()
              }
            </small>
          </div>
        `)
        .join("") ||
      `
        <div class="gt-card">
          No notifications yet.
        </div>
      `;

    const markAll =
      q("#gtMarkAllRead");

    if (markAll) {
      markAll.onclick = async () => {
        await client
          .from("notifications")
          .update({
            read_at:
              new Date().toISOString()
          })
          .eq(
            "recipient_id",
            user.id
          )
          .is(
            "read_at",
            null
          );

        gtRefreshNotificationCount();
        gtShowNotifications();
      };
    }

    gtShowModal("gtNotificationModal");
    gtRefreshNotificationCount();
  }

  function gtCloseNotifications() {
    gtHideModal(
      "gtNotificationModal"
    );
  }

  async function gtLoadPlaylists() {
    const client = gtClient();
    const user = gtCurrentUser();

    if (!client || !user) return [];

    const {
      data,
      error
    } = await client
      .from("playlists")
      .select("*")
      .eq("owner_id", user.id)
      .order("created_at", {
        ascending: false
      });

    if (error) {
      console.warn(
        "Playlists:",
        error.message
      );

      return [];
    }

    return data || [];
  }

  async function gtOpenPlaylists() {
    if (!gtUserRequired()) return;

    setModal("gtPlaylistModal", `
      <button
        class="gt-close"
        onclick="gtClosePlaylists()"
      >
        ✕
      </button>

      <div class="gt-row">
        <div>
          <h1>Your Playlists</h1>
          <p class="gt-muted">
            Save videos into your own collections.
          </p>
        </div>
      </div>

      <form
        id="gtPlaylistCreateForm"
        class="gt-form"
      >
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

        <button
          class="gt-button gt-primary"
          type="submit"
        >
          Create playlist
        </button>
      </form>

      <hr
        style="margin:18px 0;opacity:.2"
      >

      <div id="gtPlaylistList">
        Loading...
      </div>
    `);

    const list =
      q("#gtPlaylistList");

    const render =
      async () => {
        const playlists =
          await gtLoadPlaylists();

        if (!playlists.length) {
          list.innerHTML = `
            <div class="gt-card">
              <h3>No playlists yet</h3>
              <p>
                Create your first one above.
              </p>
            </div>
          `;

          return;
        }

        const client =
          gtClient();

        const cards = [];

        for (
          const playlist
          of playlists
        ) {
          const {
            count
          } = await client
            .from("playlist_items")
            .select(
              "playlist_id",
              {
                count: "exact",
                head: true
              }
            )
            .eq(
              "playlist_id",
              playlist.id
            );

          cards.push(`
            <div class="gt-card">
              <div class="gt-row">
                <div>
                  <h3>
                    ${gtEsc(
                      playlist.name
                    )}
                  </h3>

                  <p class="gt-muted">
                    ${gtEsc(
                      playlist.description || ""
                    )}
                  </p>

                  <span class="gt-stat">
                    ${count || 0} video${
                      count === 1 ? "" : "s"
                    }
                  </span>
                </div>

                <div class="gt-actions">

                  <button
                    class="gt-button gt-secondary"
                    data-gt-open-playlist="${gtEsc(
                      playlist.id
                    )}"
                  >
                    Open
                  </button>

                  <button
                    class="gt-button gt-danger"
                    data-gt-delete-playlist="${gtEsc(
                      playlist.id
                    )}"
                  >
                    Delete
                  </button>

                </div>
              </div>
            </div>
          `);
        }

        list.innerHTML =
          cards.join("");

        list
          .querySelectorAll(
            "[data-gt-open-playlist]"
          )
          .forEach(button => {
            button.onclick = () =>
              gtOpenPlaylist(
                button.getAttribute(
                  "data-gt-open-playlist"
                )
              );
          });

        list
          .querySelectorAll(
            "[data-gt-delete-playlist]"
          )
          .forEach(button => {
            button.onclick =
              async () => {
                const id =
                  button.getAttribute(
                    "data-gt-delete-playlist"
                  );

                if (
                  !confirm(
                    "Delete this playlist?"
                  )
                ) {
                  return;
                }

                await client
                  .from("playlists")
                  .delete()
                  .eq("id", id)
                  .eq(
                    "owner_id",
                    gtCurrentUser().id
                  );

                render();
              };
          });
      };

    const form =
      q("#gtPlaylistCreateForm");

    if (form) {
      form.onsubmit =
        async event => {
          event.preventDefault();

          const client =
            gtClient();

          const {
            error
          } = await client
            .from("playlists")
            .insert({
              owner_id:
                gtCurrentUser().id,

              name:
                q("#gtPlaylistName")
                  .value
                  .trim(),

              description:
                q("#gtPlaylistDescription")
                  .value
                  .trim() || null
            });

          if (error) {
            alert(
              error.message
            );

            return;
          }

          q("#gtPlaylistName")
            .value = "";

          q("#gtPlaylistDescription")
            .value = "";

          render();
        };
    }

    await render();

    gtShowModal(
      "gtPlaylistModal"
    );
  }

  async function gtOpenPlaylist(id) {
    const client =
      gtClient();

    const user =
      gtCurrentUser();

    if (!client || !user) return;

    const {
      data: playlist,
      error: playlistError
    } = await client
      .from("playlists")
      .select("*")
      .eq("id", id)
      .eq("owner_id", user.id)
      .maybeSingle();

    if (
      playlistError ||
      !playlist
    ) {
      alert(
        playlistError?.message ||
        "Playlist not found."
      );

      return;
    }

    const {
      data: items
    } = await client
      .from("playlist_items")
      .select(
        "video_id, position"
      )
      .eq(
        "playlist_id",
        id
      )
      .order(
        "position",
        {
          ascending: true
        }
      );

    const localVideos =
      gtCurrentVideos();

    const byId =
      new Map(
        localVideos.map(
          video => [
            video.id,
            video
          ]
        )
      );

    setModal(
      "gtPlaylistModal",
      `
        <button
          class="gt-close"
          onclick="gtClosePlaylists()"
        >
          ✕
        </button>

        <div class="gt-row">
          <div>
            <h1>
              ${gtEsc(
                playlist.name
              )}
            </h1>

            <p class="gt-muted">
              ${gtEsc(
                playlist.description || ""
              )}
            </p>
          </div>

          <button
            class="gt-button gt-secondary"
            onclick="gtOpenPlaylists()"
          >
            ← All playlists
          </button>
        </div>

        <div
          id="gtPlaylistVideos"
          class="gt-grid"
        ></div>
      `
    );

    const body =
      q("#gtPlaylistVideos");

    const existing =
      (items || [])
        .map(
          item =>
            byId.get(
              item.video_id
            )
        )
        .filter(Boolean);

    body.innerHTML =
      existing
        .map(video => `
          <div class="gt-card">

            <img
              src="${gtEsc(
                video.thumbnail ||
                "gusty.jpeg"
              )}"
              onerror="this.src='gusty.jpeg'"
              alt=""
            >

            <h3>
              ${gtEsc(
                video.title
              )}
            </h3>

            <p class="gt-muted">
              ${gtEsc(
                video.creator_name ||
                ""
              )}
            </p>

            <button
              class="gt-button gt-secondary"
              data-gt-play="${gtEsc(
                video.storage_path
              )}"
            >
              Watch
            </button>
          </div>
        `)
        .join("") ||
      `
        <div class="gt-card">
          <h3>
            This playlist is empty.
          </h3>
        </div>
      `;

    body
      .querySelectorAll(
        "[data-gt-play]"
      )
      .forEach(button => {
        button.onclick =
          () => {
            const video =
              existing.find(
                v =>
                  v.storage_path ===
                  button.getAttribute(
                    "data-gt-play"
                  )
              );

            if (
              video &&
              typeof openVideo ===
                "function"
            ) {
              gtClosePlaylists();
              openVideo(video);
            }
          };
      });

    gtShowModal(
      "gtPlaylistModal"
    );
  }

  function gtClosePlaylists() {
    gtHideModal(
      "gtPlaylistModal"
    );
  }

  async function gtAddCurrentToPlaylist() {
    const video =
      typeof currentVideo !== "undefined"
        ? currentVideo
        : null;

    if (
      !gtUserRequired() ||
      !video?.id
    ) {
      if (
        video &&
        !video.id
      ) {
        alert(
          "This video doesn't have database metadata yet."
        );
      }

      return;
    }

    const playlists =
      await gtLoadPlaylists();

    if (!playlists.length) {
      if (
        confirm(
          "You don't have any playlists yet. Create one now?"
        )
      ) {
        gtOpenPlaylists();
      }

      return;
    }

    setModal(
      "gtPlaylistModal",
      `
        <button
          class="gt-close"
          onclick="gtClosePlaylists()"
        >
          ✕
        </button>

        <h1>
          Add to playlist
        </h1>

        <div
          id="gtAddPlaylistList"
          class="gt-grid"
        >
          ${playlists.map(p => `
            <button
              class="gt-card"
              data-gt-add-playlist="${gtEsc(
                p.id
              )}"
              style="text-align:left;cursor:pointer"
            >
              <strong>
                ${gtEsc(
                  p.name
                )}
              </strong>

              <span class="gt-muted">
                ${gtEsc(
                  p.description || ""
                )}
              </span>
            </button>
          `).join("")}
        </div>
      `
    );

    const list =
      q("#gtAddPlaylistList");

    list
      .querySelectorAll(
        "[data-gt-add-playlist]"
      )
      .forEach(button => {
        button.onclick =
          async () => {
            const playlistId =
              button.getAttribute(
                "data-gt-add-playlist"
              );

            const {
              count
            } = await gtClient()
              .from("playlist_items")
              .select(
                "position",
                {
                  count: "exact",
                  head: true
                }
              )
              .eq(
                "playlist_id",
                playlistId
              );

            const {
              error
            } = await gtClient()
              .from("playlist_items")
              .insert({
                playlist_id:
                  playlistId,

                video_id:
                  video.id,

                position:
                  count || 0
              });

            if (error) {
              if (
                error.code ===
                "23505"
              ) {
                alert(
                  "That video is already in this playlist."
                );
              } else {
                alert(
                  error.message
                );
              }

              return;
            }

            alert(
              "Added to playlist!"
            );

            gtClosePlaylists();
          };
      });

    gtShowModal(
      "gtPlaylistModal"
    );
  }

  async function gtOpenStudio() {
    if (!gtUserRequired()) return;

    setModal(
      "gtStudioModal",
      `
        <button
          class="gt-close"
          onclick="gtCloseStudio()"
        >
          ✕
        </button>

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
      `
    );

    gtShowModal(
      "gtStudioModal"
    );

    gtRenderStudioVideos();

    q("#gtStudioVideosTab").onclick =
      () => {
        qa(
          ".gt-tab",
          q("#gtStudioModal")
        ).forEach(
          el =>
            el.classList.remove(
              "active"
            )
        );

        q(
          "#gtStudioVideosTab"
        ).classList.add(
          "active"
        );

        gtRenderStudioVideos();
      };

    q("#gtStudioReportsTab").onclick =
      () => {
        qa(
          ".gt-tab",
          q("#gtStudioModal")
        ).forEach(
          el =>
            el.classList.remove(
              "active"
            )
        );

        q(
          "#gtStudioReportsTab"
        ).classList.add(
          "active"
        );

        gtRenderStudioReports();
      };

    q("#gtStudioPlaylistsTab").onclick =
      () => {
        qa(
          ".gt-tab",
          q("#gtStudioModal")
        ).forEach(
          el =>
            el.classList.remove(
              "active"
            )
        );

        q(
          "#gtStudioPlaylistsTab"
        ).classList.add(
          "active"
        );

        gtRenderStudioPlaylists();
      };
  }

  function gtCloseStudio() {
    gtHideModal(
      "gtStudioModal"
    );
  }

  async function gtRenderStudioVideos() {
    const body =
      q("#gtStudioBody");

    if (!body) return;

    const user =
      gtCurrentUser();

    const client =
      gtClient();

    const owned =
      gtCurrentVideos()
        .filter(
          v =>
            v.creator_id ===
              user?.id &&
            !v.is_deleted
        );

    if (!owned.length) {
      body.innerHTML = `
        <div class="gt-card">
          <h2>No managed videos yet</h2>

          <p>
            Upload a video from Creator Studio.
          </p>
        </div>
      `;

      return;
    }

    body.innerHTML = "";

    for (
      const video
      of owned
    ) {
      const item =
        document.createElement(
          "div"
        );

      item.className =
        "gt-card gt-studio-item";

      item.innerHTML = `
        <div>
          <img
            src="${gtEsc(
              video.thumbnail ||
              "gusty.jpeg"
            )}"
            onerror="this.src='gusty.jpeg'"
            alt=""
          >
        </div>

        <div class="gt-form">

          <label>Title</label>

          <input
            data-gt-title
            value="${gtEsc(
              video.title || ""
            )}"
            maxlength="120"
          >

          <label>Category</label>

          <select data-gt-category>
            ${[
              "Gaming",
              "Music",
              "Animation",
              "Funny"
            ]
              .map(
                category =>
                  `<option ${
                    video.category ===
                    category
                      ? "selected"
                      : ""
                  }>${category}</option>`
              )
              .join("")}
          </select>

          <label>Description</label>

          <textarea
            data-gt-description
            maxlength="2000"
          >${gtEsc(
            video.description || ""
          )}</textarea>

          <label>
            Replace thumbnail
          </label>

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

          <p
            class="gt-muted"
            data-gt-status
          ></p>

        </div>
      `;

      const status =
        q(
          "[data-gt-status]",
          item
        );

      q(
        "[data-gt-watch]",
        item
      ).onclick =
        () => {
          gtCloseStudio();

          if (
            typeof openVideo ===
            "function"
          ) {
            openVideo(video);
          }
        };

      q(
        "[data-gt-save]",
        item
      ).onclick =
        async () => {
          status.textContent =
            "Saving...";

          const updates = {
            title:
              q(
                "[data-gt-title]",
                item
              ).value.trim(),

            category:
              q(
                "[data-gt-category]",
                item
              ).value,

            description:
              q(
                "[data-gt-description]",
                item
              ).value.trim() ||
              null,

            updated_at:
              new Date().toISOString()
          };

          if (!updates.title) {
            status.textContent =
              "Title is required.";

            return;
          }

          const thumbFile =
            q(
              "[data-gt-thumb]",
              item
            ).files?.[0];

          if (thumbFile) {
            if (
              !thumbFile.type.startsWith(
                "image/"
              )
            ) {
              status.textContent =
                "Thumbnail must be an image.";

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

            const safe =
              thumbFile.name.replace(
                /[^a-zA-Z0-9._-]/g,
                "_"
              );

            const path =
              `thumb__${user.id}__${Date.now()}__${Math.random()
                .toString(36)
                .slice(2, 8)}__${safe}`;

            const {
              error: uploadError
            } = await client.storage
              .from("videos")
              .upload(
                path,
                thumbFile
              );

            if (uploadError) {
              status.textContent =
                uploadError.message;

              return;
            }

            updates.thumbnail_path =
              path;

            updates.thumbnail =
              client.storage
                .from("videos")
                .getPublicUrl(path)
                .data.publicUrl;

            if (
              video.thumbnail_path
            ) {
              client.storage
                .from("videos")
                .remove([
                  video.thumbnail_path
                ])
                .catch(
                  () => {}
                );
            }
          }

          const {
            data,
            error
          } = await client
            .from("videos")
            .update(updates)
            .eq(
              "id",
              video.id
            )
            .eq(
              "creator_id",
              user.id
            )
            .select("*")
            .single();

          if (error) {
            status.textContent =
              error.message;

            return;
          }

          Object.assign(
            video,
            data
          );

          status.textContent =
            "Saved.";

          if (
            typeof displayHomepage ===
            "function"
          ) {
            displayHomepage();
          }
        };

      q(
        "[data-gt-delete]",
        item
      ).onclick =
        async () => {
          if (
            !confirm(
              `Delete "${video.title}"?`
            )
          ) {
            return;
          }

          status.textContent =
            "Deleting...";

          const {
            error
          } = await client
            .from("videos")
            .update({
              is_deleted:
                true,

              deleted_at:
                new Date().toISOString(),

              updated_at:
                new Date().toISOString()
            })
            .eq(
              "id",
              video.id
            )
            .eq(
              "creator_id",
              user.id
            );

          if (error) {
            status.textContent =
              error.message;

            return;
          }

          const paths = [
            video.storage_path,
            video.thumbnail_path
          ].filter(Boolean);

          if (paths.length) {
            const {
              error: storageError
            } = await client.storage
              .from("videos")
              .remove(paths);

            if (storageError) {
              console.warn(
                "Storage delete:",
                storageError.message
              );
            }
          }

          videos =
            gtCurrentVideos()
              .filter(
                v =>
                  v.id !==
                  video.id
              );

          if (
            typeof displayHomepage ===
            "function"
          ) {
            displayHomepage();
          }

          gtRenderStudioVideos();
        };

      body.appendChild(item);
    }
  }

  async function gtRenderStudioReports() {
    const body =
      q("#gtStudioBody");

    const user =
      gtCurrentUser();

    const client =
      gtClient();

    if (
      !body ||
      !user ||
      !client
    ) {
      return;
    }

    body.innerHTML =
      "Loading reports...";

    const {
      data,
      error
    } = await client
      .from("video_reports")
      .select(`
        *,
        videos!inner(title, creator_id)
      `)
      .eq(
        "videos.creator_id",
        user.id
      )
      .order(
        "created_at",
        {
          ascending: false
        }
      );

    if (error) {
      body.innerHTML =
        `<div class="gt-card">${gtEsc(
          error.message
        )}</div>`;

      return;
    }

    body.innerHTML =
      (data || [])
        .map(
          report => `
            <div class="gt-card">

              <h3>
                ${gtEsc(
                  report.videos?.title ||
                  "Video"
                )}
              </h3>

              <p>
                <strong>
                  ${gtEsc(
                    report.reason
                  )}
                </strong>
              </p>

              <p>
                ${gtEsc(
                  report.details ||
                  "No additional details."
                )}
              </p>

              <small class="gt-muted">
                ${new Date(
                  report.created_at
                ).toLocaleString()}
              </small>

            </div>
          `
        )
        .join("") ||
      `
        <div class="gt-card">
          <h3>No reports.</h3>
          <p>
            Your videos don't have any reports right now.
          </p>
        </div>
      `;
  }

  async function gtRenderStudioPlaylists() {
    const body =
      q("#gtStudioBody");

    if (!body) return;

    const playlists =
      await gtLoadPlaylists();

    body.innerHTML =
      playlists
        .map(
          playlist => `
            <div class="gt-card">

              <h3>
                ${gtEsc(
                  playlist.name
                )}
              </h3>

              <p class="gt-muted">
                ${gtEsc(
                  playlist.description ||
                  ""
                )}
              </p>

              <button
                class="gt-button gt-secondary"
                data-gt-open-playlist="${gtEsc(
                  playlist.id
                )}"
              >
                Open
              </button>

            </div>
          `
        )
        .join("") ||
      `
        <div class="gt-card">
          <h3>No playlists.</h3>
          <p>
            Create one from the Playlists button.
          </p>
        </div>
      `;

    body
      .querySelectorAll(
        "[data-gt-open-playlist]"
      )
      .forEach(button => {
        button.onclick =
          () =>
            gtOpenPlaylist(
              button.getAttribute(
                "data-gt-open-playlist"
              )
            );
      });
  }

  async function gtSyncVideoMetadata(
    force = false
  ) {
    if (GT.syncRunning) return;

    const current =
      gtCurrentVideos();

    const signature =
      current
        .map(
          video =>
            `${video.id || ""}|${video.storage_path || ""}|${video.title || ""}`
        )
        .join("||");

    if (
      !force &&
      signature ===
        GT.lastVideoSignature
    ) {
      return;
    }

    GT.lastVideoSignature =
      signature;

    const client =
      gtClient();

    if (
      !client ||
      !current.length
    ) {
      return;
    }

    GT.syncRunning = true;

    try {
      const {
        data,
        error
      } = await client
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
        console.warn(
          "Upgrade video sync:",
          error.message
        );

        return;
      }

      const byPath =
        new Map(
          (data || []).map(
            row => [
              row.storage_path,
              row
            ]
          )
        );

      const merged =
        current
          .map(video => {
            const row =
              byPath.get(
                video.storage_path
              );

            return row
              ? { ...video, ...row }
              : video;
          })
          .filter(
            video =>
              !video.is_deleted
          );

      videos = merged;

      if (
        typeof displayHomepage ===
        "function"
      ) {
        displayHomepage();
      }
    } finally {
      GT.syncRunning = false;
    }
  }

  function installPlayerButtons() {
    const actionArea =
      q("#likeButton")?.parentElement;

    if (
      actionArea &&
      !q(
        "#gtPlaylistPlayerButton",
        actionArea
      )
    ) {
      const button =
        document.createElement(
          "button"
        );

      button.id =
        "gtPlaylistPlayerButton";

      button.className =
        "gt-button gt-secondary";

      button.textContent =
        "➕ Playlist";

      button.onclick =
        gtAddCurrentToPlaylist;

      actionArea.appendChild(
        button
      );
    }

    if (
      actionArea &&
      !q(
        "#gtReportPlayerButton",
        actionArea
      )
    ) {
      const button =
        document.createElement(
          "button"
        );

      button.id =
        "gtReportPlayerButton";

      button.className =
        "gt-button gt-secondary";

      button.textContent =
        "🚩 Report";

      button.onclick =
        () => {
          const video =
            typeof currentVideo !==
            "undefined"
              ? currentVideo
              : null;

          if (video?.id) {
            gtOpenReport(
              video.id,
              video.title ||
                "video"
            );
          } else {
            alert(
              "This video cannot be reported yet because it has no database ID."
            );
          }
        };

      actionArea.appendChild(
        button
      );
    }

    const creatorButton =
      q("#playerCreator");

    if (
      creatorButton &&
      !creatorButton.dataset
        .gtUpgraded
    ) {
      creatorButton.dataset
        .gtUpgraded = "1";

      creatorButton.removeAttribute(
        "onclick"
      );

      creatorButton.addEventListener(
        "click",
        () => {
          gtOpenChannelByName(
            creatorButton.textContent.trim()
          );
        }
      );
    }

    qa(
      "button[onclick*='openOwnChannel']"
    ).forEach(button => {
      button.removeAttribute(
        "onclick"
      );

      button.addEventListener(
        "click",
        () =>
          gtOpenChannelByName(
            typeof creatorName !==
              "undefined"
              ? creatorName
              : "You"
          )
      );
    });
  }

  function injectNavigationButtons() {
    const sidebar =
      q("#sidebar");

    if (sidebar) {
      if (
        !q("#gtPlaylistNav")
      ) {
        const button =
          document.createElement(
            "button"
          );

        button.id =
          "gtPlaylistNav";

        button.className =
          "side-button";

        button.innerHTML =
          "📚 <span>Playlists</span>";

        button.onclick =
          gtOpenPlaylists;

        const sideButtons =
          qa(
            ".side-button",
            sidebar
          );

        const target =
          sideButtons[3] ||
          sideButtons.at(-1);

        if (
          target?.nextSibling
        ) {
          sidebar.insertBefore(
            button,
            target.nextSibling
          );
        } else {
          sidebar.appendChild(
            button
          );
        }
      }

      if (
        !q("#gtStudioNav")
      ) {
        const button =
          document.createElement(
            "button"
          );

        button.id =
          "gtStudioNav";

        button.className =
          "side-button";

        button.innerHTML =
          "🛠️ <span>Creator Studio</span>";

        button.onclick =
          gtOpenStudio;

        sidebar.appendChild(
          button
        );
      }
    }

    const uploadButton =
      q(
        ".top-buttons button[title='Upload video']"
      ) ||
      q(
        ".top-buttons button[title='Upload']"
      );

    if (
      uploadButton &&
      !uploadButton.dataset
        .gtUpgraded
    ) {
      uploadButton.dataset
        .gtUpgraded = "1";

      uploadButton.removeAttribute(
        "onclick"
      );

      uploadButton.onclick =
        gtOpenUploader;
    }

    const notificationButton =
      q(
        ".top-buttons button[title='Notifications']"
      );

    if (
      notificationButton &&
      !notificationButton.dataset
        .gtUpgraded
    ) {
      notificationButton.dataset
        .gtUpgraded = "1";

      notificationButton.removeAttribute(
        "onclick"
      );

      notificationButton.onclick =
        gtShowNotifications;
    }

    const accountModal =
      q("#loggedInAccount");

    if (
      accountModal &&
      !q(
        "#gtStudioAccountButton",
        accountModal
      )
    ) {
      const button =
        document.createElement(
          "button"
        );

      button.id =
        "gtStudioAccountButton";

      button.className =
        "primary-button";

      button.textContent =
        "🛠️ Creator Studio";

      button.onclick =
        gtOpenStudio;

      accountModal.insertBefore(
        button,
        accountModal.firstChild
      );
    }
  }

  function wrapProfileSave() {
    if (
      window.__gtProfileSaveWrapped
    ) {
      return;
    }

    if (
      typeof window.saveAccountProfile !==
      "function"
    ) {
      return;
    }

    const original =
      window.saveAccountProfile;

    window.saveAccountProfile =
      async function (...args) {
        const result =
          await original.apply(
            this,
            args
          );

        await gtUpsertOwnProfile();

        return result;
      };

    window.__gtProfileSaveWrapped =
      true;
  }

  function wrapChannelButtons() {
    const playerCreator =
      q("#playerCreator");

    if (
      playerCreator &&
      !playerCreator.dataset
        .gtUpgraded
    ) {
      playerCreator.dataset
        .gtUpgraded = "1";

      playerCreator.removeAttribute(
        "onclick"
      );

      playerCreator.addEventListener(
        "click",
        () =>
          gtOpenChannelByName(
            playerCreator.textContent.trim()
          )
      );
    }

    qa(
      "[onclick*='openSelectedCreatorChannel']"
    ).forEach(button => {
      button.removeAttribute(
        "onclick"
      );

      button.addEventListener(
        "click",
        () => {
          const creatorButton =
            q("#playerCreator");

          gtOpenChannelByName(
            creatorButton?.textContent ||
              "Creator"
          );
        }
      );
    });
  }

  async function startupSync() {
    injectStyles();
    ensureBaseModals();
    injectNavigationButtons();
    installPlayerButtons();
    wrapProfileSave();
    wrapChannelButtons();

    if (gtCurrentUser()) {
      await gtUpsertOwnProfile()
        .catch(() => {});

      await gtRefreshNotificationCount();
    }

    await gtSyncVideoMetadata(
      true
    );

    if (
      !GT.notificationTimer
    ) {
      GT.notificationTimer =
        setInterval(
          () => {
            gtRefreshNotificationCount();
          },
          15000
        );
    }

    if (!GT.syncTimer) {
      GT.syncTimer =
        setInterval(
          () => {
            injectNavigationButtons();
            installPlayerButtons();
            wrapProfileSave();
            wrapChannelButtons();
            gtSyncVideoMetadata(false);
          },
          2500
        );
    }
  }

  document.addEventListener(
    "DOMContentLoaded",
    () => {
      setTimeout(
        startupSync,
        1200
      );
    }
  );

  window.gtOpenChannelByName =
    gtOpenChannelByName;

  window.gtOpenOwnChannel =
    () =>
      gtOpenChannelByName(
        typeof creatorName !==
          "undefined"
          ? creatorName
          : "You"
      );

  window.gtCloseChannel =
    gtCloseChannel;

  window.gtOpenReport =
    gtOpenReport;

  window.gtCloseReport =
    gtCloseReport;

  window.gtOpenUploader =
    gtOpenUploader;

  window.gtCloseUpload =
    gtCloseUpload;

  window.gtShowNotifications =
    gtShowNotifications;

  window.gtCloseNotifications =
    gtCloseNotifications;

  window.gtOpenPlaylists =
    gtOpenPlaylists;

  window.gtOpenPlaylist =
    gtOpenPlaylist;

  window.gtClosePlaylists =
    gtClosePlaylists;

  window.gtOpenStudio =
    gtOpenStudio;

  window.gtCloseStudio =
    gtCloseStudio;

})();
window.openVideoByPath = function (path) {
  const rawPath = String(path ?? "");

  let decodedPath = rawPath;

  try {
    decodedPath = decodeURIComponent(rawPath);
  } catch (error) {
    // Keep the original path if it was not encoded.
  }

  const allVideos =
    typeof videos !== "undefined" && Array.isArray(videos)
      ? videos
      : [];

  const video = allVideos.find(
    item =>
      item.storage_path === rawPath ||
      item.storage_path === decodedPath ||
      item.id === rawPath ||
      item.video === rawPath ||
      item.url === rawPath
  );

  if (video) {
    if (typeof openVideo === "function") {
      openVideo(video);
    } else {
      console.error("openVideo() is not available.");
    }

    return;
  }

  console.error(
    "GryphonTube couldn't find video:",
    rawPath
  );
};
