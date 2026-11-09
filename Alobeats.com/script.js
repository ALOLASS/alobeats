const siteScriptUrl = document.currentScript?.src || document.baseURI;

document.addEventListener("DOMContentLoaded", () => {
  const beatGrid = document.getElementById("beat-grid");
  const pagination = document.getElementById("pagination");
  const searchInput = document.getElementById("search-input");
  const bpmSelect = document.getElementById("bpm-select");
  const keySelect = document.getElementById("key-select");
  const bottomPlayer = document.getElementById("bottom-player");
  const audioElement = document.getElementById("audio-element");
  const playerCover = document.getElementById("player-cover");
  const playerTitle = document.getElementById("player-title");
  const playerPlayBtn = document.getElementById("player-play-btn");
  const playerPreviousBtn = document.getElementById("player-previous-btn");
  const playerStopBtn = document.getElementById("player-stop-btn");
  const playerNextBtn = document.getElementById("player-next-btn");
  const playerSeek = document.getElementById("player-seek");
  const playerCurrentTime = document.getElementById("player-current-time");
  const playerDuration = document.getElementById("player-duration");
  const playerStatus = document.getElementById("player-status");
  const playerBuyLink = document.getElementById("player-buy-link");
  const playerDownloadLink = document.getElementById("player-download-link");
  const downloadModal = document.getElementById("download-modal");
  const downloadModalClose = document.getElementById("download-modal-close");
  const downloadModalTrack = document.getElementById("download-modal-track");
  const downloadForm = document.getElementById("download-form");
  const downloadEmail = document.getElementById("download-email");
  const downloadSubmit = document.getElementById("download-submit");
  const downloadModalMessage = document.getElementById("download-modal-message");
  const newsletterForm = document.getElementById("newsletter-form");
  const newsletterEmail = document.getElementById("newsletter-email");
  const newsletterButton = document.getElementById("newsletter-btn");
  const newsletterMessage = document.getElementById("newsletter-msg");

  const beatsPerPage = 8;

  let allBeats = [];
  let filteredBeats = [];
  let currentPage = 1;
  let currentBeatId = null;
  let currentBeat = null;
  let currentDownloadUrl = "";
  let isPlaying = false;
  let newsletterMessageTimer;

  loadBeats();

  async function loadBeats() {
    const endpoint = new URL("get_beats.php", siteScriptUrl);
    let beats;

    try {
      if (!["http:", "https:"].includes(window.location.protocol)) {
        throw new Error("Open this page through XAMPP/Apache, not directly as a file.");
      }

      const response = await fetch(endpoint.href, { cache: "no-store" });
      if (!response.ok) {
        throw new Error(`The server returned HTTP ${response.status}.`);
      }

      const contentType = response.headers.get("content-type") || "";
      if (!contentType.toLowerCase().includes("application/json")) {
        throw new Error("The PHP endpoint did not return JSON. Check that Apache/PHP is running.");
      }

      beats = await response.json();
      if (!Array.isArray(beats)) {
        throw new Error("The PHP endpoint returned invalid beat data.");
      }
    } catch (error) {
      console.error(`Could not load beats from ${endpoint.href}:`, error);
      if (beatGrid) {
        beatGrid.replaceChildren();
        const message = document.createElement("p");
        message.className = "beat-message";
        const reason = error instanceof Error ? error.message : "Unknown loading error.";
        message.textContent = `Could not load beats from ${endpoint.href}. ${reason}`;
        beatGrid.appendChild(message);
      }
      if (pagination) pagination.hidden = true;
      return;
    }

    allBeats = beats.filter((beat) => beat && typeof beat === "object");
    filteredBeats = allBeats;
    renderBeats();
  }

  function normalizeKey(value) {
    const match = String(value || "").trim().match(/^([A-G])([#b]?)/i);
    if (!match) return "";

    const root = `${match[1].toUpperCase()}${match[2]}`;
    const enharmonicRoots = {
      Db: "C#",
      Eb: "D#",
      Gb: "F#",
      Ab: "G#",
      Bb: "A#"
    };
    return enharmonicRoots[root] || root;
  }

  function renderBeats() {
    if (!beatGrid) return;

    beatGrid.replaceChildren();
    const start = (currentPage - 1) * beatsPerPage;
    const pageBeats = filteredBeats.slice(start, start + beatsPerPage);

    if (pageBeats.length === 0) {
      const message = document.createElement("p");
      message.className = "beat-message";
      message.textContent = "No beats found.";
      beatGrid.appendChild(message);
    } else {
      pageBeats.forEach((beat) => {
        beatGrid.appendChild(createBeatCard(beat, allBeats.indexOf(beat)));
      });
    }

    renderPagination();
  }

  function createBeatCard(beat, beatIndex) {
    const card = document.createElement("article");
    card.className = "beat-card";
    card.style.setProperty("--beat-hue", `${(beatIndex * 37 + 18) % 360}deg`);
    const title = String(beat.title || "Untitled beat");
    const cover = safeMediaUrl(beat.cover);
    card.classList.toggle("playing", beat.id === currentBeatId);
    card.classList.toggle("is-playing", beat.id === currentBeatId && isPlaying);
    card.dataset.beatId = String(beat.id);

    const selectButton = document.createElement("button");
    selectButton.type = "button";
    selectButton.className = "beat-select";
    selectButton.setAttribute("aria-label", `Preview ${title}`);

    const art = document.createElement("div");
    art.className = "beat-art";

    const image = document.createElement("img");
    image.src = new URL("../3D Render GIF by xponentialdesign.gif", siteScriptUrl).href;
    image.alt = `${title} animated artwork`;
    image.loading = "lazy";
    image.addEventListener("error", () => {
      if (cover && !image.dataset.fallback) {
        image.dataset.fallback = "true";
        image.src = cover;
      } else {
        image.remove();
      }
    });
    art.appendChild(image);

    const overlay = document.createElement("div");
    overlay.className = "play-overlay";
    const icon = document.createElement("span");
    icon.className = "play-icon";
    icon.textContent = "▶";
    overlay.appendChild(icon);
    art.appendChild(overlay);

    const visualizer = document.createElement("div");
    visualizer.className = "card-visualizer";
    visualizer.setAttribute("aria-hidden", "true");
    for (let index = 0; index < 7; index += 1) {
      visualizer.appendChild(document.createElement("span"));
    }
    art.appendChild(visualizer);

    const heading = document.createElement("h3");
    heading.className = "beat-title";
    heading.title = title;
    heading.textContent = title;

    selectButton.append(art, heading);
    selectButton.addEventListener("click", () => selectBeat(beat, card));

    const buyLink = document.createElement("a");
    buyLink.className = "beat-buy-link";
    buyLink.href = getBeatStarsUrl(beat);
    buyLink.target = "_blank";
    buyLink.rel = "noopener noreferrer";
    buyLink.textContent = "Buy on BeatStars";
    buyLink.setAttribute("aria-label", `Find ${title} on BeatStars (opens in a new tab)`);

    card.append(selectButton, buyLink);
    return card;
  }

  function renderPagination() {
    if (!pagination) return;
    pagination.replaceChildren();

    const pageCount = Math.ceil(filteredBeats.length / beatsPerPage);
    pagination.hidden = pageCount <= 1;
    if (pageCount <= 1) return;

    addPageButton("«", currentPage - 1, currentPage === 1, "Previous page");
    for (let page = 1; page <= pageCount; page += 1) {
      const button = addPageButton(String(page), page, false, `Page ${page}`);
      if (page === currentPage) {
        button.classList.add("active");
        button.setAttribute("aria-current", "page");
      }
    }
    addPageButton("»", currentPage + 1, currentPage === pageCount, "Next page");
  }

  function addPageButton(label, page, disabled, accessibleLabel) {
    const button = document.createElement("button");
    button.type = "button";
    button.className = "page-btn";
    button.textContent = label;
    button.setAttribute("aria-label", accessibleLabel);
    button.disabled = disabled;
    button.addEventListener("click", () => {
      currentPage = page;
      renderBeats();
    });
    pagination.appendChild(button);
    return button;
  }

  function filterBeats() {
    const search = (searchInput?.value || "").trim().toLowerCase();
    const bpmFilter = bpmSelect?.value || "all";
    const keyFilter = keySelect?.value || "all";

    filteredBeats = allBeats.filter((beat) => {
      const bpm = Number(beat.bpm);
      const searchableText = [
        beat.title,
        beat.genre,
        beat.mood,
        beat.bpm,
        beat.key
      ]
        .filter((value) => value != null)
        .join(" ")
        .toLowerCase();

      const matchesSearch = searchableText.includes(search);
      const matchesBpm =
        bpmFilter === "all" ||
        (Number.isFinite(bpm) &&
          ((bpmFilter === "slow" && bpm < 120) ||
            (bpmFilter === "mid" && bpm >= 120 && bpm <= 140) ||
            (bpmFilter === "fast" && bpm > 140)));
      const matchesKey = keyFilter === "all" || normalizeKey(beat.key) === keyFilter;

      return matchesSearch && matchesBpm && matchesKey;
    });

    currentPage = 1;
    renderBeats();
  }

  searchInput?.addEventListener("input", filterBeats);
  bpmSelect?.addEventListener("change", filterBeats);
  keySelect?.addEventListener("change", filterBeats);

  function selectBeat(beat, card) {
    const title = String(beat.title || "Untitled beat");
    const audioSrc = safeMediaUrl(beat.audio);
    const cover = safeMediaUrl(beat.cover);

    if (beat.id === currentBeatId) {
      togglePlayback();
      return;
    }

    setPlaybackState(false);
    currentBeatId = beat.id;
    currentBeat = beat;
    beatGrid?.querySelectorAll(".beat-card.playing").forEach((playingCard) => {
      playingCard.classList.remove("playing", "is-playing");
    });
    card?.classList.add("playing");

    if (playerTitle) playerTitle.textContent = title;
    if (playerCover && cover) playerCover.src = cover;
    updatePlayerActions(beat);
    bottomPlayer?.classList.add("active");
    audioElement?.pause();
    if (audioElement) {
      audioElement.removeAttribute("src");
      audioElement.load();
    }
    updatePlaybackUi(false);
    updateTimeline();
    updateTrackNavigation();

    if (!audioSrc || !audioElement) {
      if (playerStatus) playerStatus.textContent = "Preview unavailable";
      return;
    }

    if (playerStatus) playerStatus.textContent = "";
    audioElement.src = audioSrc;
    togglePlayback();
  }

  function safeMediaUrl(value) {
    if (typeof value !== "string" || !value.trim()) return "";
    try {
      const url = new URL(value, document.baseURI);
      return url.protocol === "http:" || url.protocol === "https:" ? url.href : "";
    } catch {
      return "";
    }
  }

  function getBeatStarsUrl(beat) {
    return (
      safeMediaUrl(beat.beatstars_url) ||
      safeMediaUrl(beat.link) ||
      "https://www.beatstars.com/alolas"
    );
  }

  function updatePlayerActions(beat) {
    if (playerBuyLink) playerBuyLink.href = getBeatStarsUrl(beat);
    if (!playerDownloadLink) return;

    const downloadUrl = safeMediaUrl(beat.download);
    const previewUrl = safeMediaUrl(beat.audio);
    const destination = downloadUrl || previewUrl;
    currentDownloadUrl = destination;
    playerDownloadLink.classList.toggle("is-disabled", !destination);
    playerDownloadLink.disabled = !destination;
  }

  playerDownloadLink?.addEventListener("click", () => {
    if (!currentBeat || !currentDownloadUrl || !downloadModal) return;
    if (downloadModalTrack) {
      downloadModalTrack.textContent = `Selected beat: ${String(currentBeat.title || "Untitled beat")}`;
    }
    if (downloadModalMessage) {
      downloadModalMessage.textContent = "";
      downloadModalMessage.className = "download-modal-message";
    }
    downloadModal.showModal();
    downloadEmail?.focus();
  });

  downloadModalClose?.addEventListener("click", () => downloadModal?.close());
  downloadModal?.addEventListener("click", (event) => {
    if (event.target === downloadModal) downloadModal.close();
  });

  downloadForm?.addEventListener("submit", async (event) => {
    event.preventDefault();
    if (!downloadEmail || !downloadSubmit || !downloadModalMessage || !currentBeat || !currentDownloadUrl) {
      return;
    }

    const selectedBeat = currentBeat;
    const selectedDownloadUrl = currentDownloadUrl;
    const trackUrl = new URL(selectedDownloadUrl, document.baseURI);
    if (trackUrl.origin !== window.location.origin) {
      downloadModalMessage.textContent = "This beat cannot be downloaded from this page.";
      downloadModalMessage.classList.add("feedback-error");
      return;
    }

    const trackFile = decodeURIComponent(trackUrl.pathname.split("/").pop() || "");
    if (!trackFile) {
      downloadModalMessage.textContent = "The selected beat file is unavailable.";
      downloadModalMessage.classList.add("feedback-error");
      return;
    }

    downloadModalMessage.textContent = "";
    downloadModalMessage.className = "download-modal-message";
    downloadSubmit.disabled = true;
    downloadSubmit.textContent = "Saving...";

    try {
      const response = await fetch("save_email.php", {
        method: "POST",
        headers: { "Content-Type": "application/x-www-form-urlencoded;charset=UTF-8" },
        body: new URLSearchParams({
          email: downloadEmail.value.trim(),
          track_title: String(selectedBeat.title || "Untitled beat"),
          track_file: trackFile
        })
      });
      let result;
      try {
        result = await response.json();
      } catch {
        throw new Error("Could not contact the download service. Please try again.");
      }

      if (!response.ok || result.status !== "success") {
        throw new Error(result.message || "Could not save your email. Please try again.");
      }

      const downloadLink = document.createElement("a");
      downloadLink.href = selectedDownloadUrl;
      downloadLink.download = trackFile;
      document.body.appendChild(downloadLink);
      downloadLink.click();
      downloadLink.remove();
      downloadForm.reset();
      downloadModal.close();
    } catch (error) {
      console.error("Free beat download failed:", error);
      downloadModalMessage.textContent =
        error instanceof Error ? error.message : "Could not start the download. Please try again.";
      downloadModalMessage.classList.add("feedback-error");
    } finally {
      downloadSubmit.disabled = false;
      downloadSubmit.textContent = "Download Now";
    }
  });

  function setPlaybackState(playing) {
    isPlaying = playing;
    beatGrid?.querySelectorAll(".beat-card").forEach((card) => {
      card.classList.toggle(
        "is-playing",
        playing && card.dataset.beatId === String(currentBeatId)
      );
    });
  }

  function togglePlayback() {
    if (!audioElement || !audioElement.getAttribute("src")) {
      if (playerStatus) playerStatus.textContent = "Preview unavailable";
      updatePlaybackUi(false);
      return;
    }

    if (audioElement.paused) {
      audioElement.play().catch((error) => {
        console.error("Could not play beat preview:", error);
        if (playerStatus) playerStatus.textContent = "Could not play preview";
        updatePlaybackUi(false);
      });
    } else {
      audioElement.pause();
    }
  }

  function formatTime(seconds) {
    if (!Number.isFinite(seconds) || seconds < 0) return "0:00";
    const minutes = Math.floor(seconds / 60);
    const remainingSeconds = Math.floor(seconds % 60);
    return `${minutes}:${String(remainingSeconds).padStart(2, "0")}`;
  }

  function updateTimeline() {
    if (!audioElement) return;
    const duration = audioElement.duration;
    const hasDuration = Number.isFinite(duration) && duration > 0;
    if (playerSeek) {
      playerSeek.disabled = !hasDuration;
      playerSeek.value = hasDuration
        ? String(Math.round((audioElement.currentTime / duration) * Number(playerSeek.max)))
        : "0";
    }
    if (playerCurrentTime) playerCurrentTime.textContent = formatTime(audioElement.currentTime);
    if (playerDuration) playerDuration.textContent = formatTime(duration);
  }

  function updateTrackNavigation() {
    const currentIndex = allBeats.findIndex((beat) => beat.id === currentBeatId);
    if (playerPreviousBtn) playerPreviousBtn.disabled = currentIndex <= 0;
    if (playerNextBtn) playerNextBtn.disabled = currentIndex < 0 || currentIndex >= allBeats.length - 1;
    if (playerStopBtn) playerStopBtn.disabled = !audioElement?.getAttribute("src");
  }

  function changeTrack(offset) {
    const currentIndex = allBeats.findIndex((beat) => beat.id === currentBeatId);
    const nextBeat = allBeats[currentIndex + offset];
    if (!nextBeat) return;

    const matchingCard = Array.from(beatGrid?.querySelectorAll(".beat-card") || [])
      .find((card) => card.dataset.beatId === String(nextBeat.id));
    selectBeat(nextBeat, matchingCard);
  }

  function stopPlayback() {
    if (!audioElement) return;
    audioElement.pause();
    audioElement.currentTime = 0;
    if (playerStatus) playerStatus.textContent = "";
    updateTimeline();
    setPlaybackState(false);
    updatePlaybackUi(false);
  }

  function updatePlaybackUi(isPlaying) {
    if (playerPlayBtn) {
      playerPlayBtn.textContent = isPlaying ? "⏸" : "▶";
      playerPlayBtn.disabled = !audioElement?.getAttribute("src");
      playerPlayBtn.setAttribute("aria-label", isPlaying ? "Pause preview" : "Play preview");
    }
    updateTrackNavigation();
  }

  playerPlayBtn?.addEventListener("click", togglePlayback);
  playerPreviousBtn?.addEventListener("click", () => changeTrack(-1));
  playerNextBtn?.addEventListener("click", () => changeTrack(1));
  playerStopBtn?.addEventListener("click", stopPlayback);
  playerSeek?.addEventListener("input", () => {
    if (!audioElement || !Number.isFinite(audioElement.duration)) return;
    audioElement.currentTime = (Number(playerSeek.value) / Number(playerSeek.max)) * audioElement.duration;
    updateTimeline();
  });
  audioElement?.addEventListener("loadedmetadata", updateTimeline);
  audioElement?.addEventListener("durationchange", updateTimeline);
  audioElement?.addEventListener("timeupdate", updateTimeline);
  audioElement?.addEventListener("play", () => {
    if (playerStatus) playerStatus.textContent = "";
    setPlaybackState(true);
    updatePlaybackUi(true);
  });
  audioElement?.addEventListener("pause", () => {
    setPlaybackState(false);
    updatePlaybackUi(false);
  });
  audioElement?.addEventListener("ended", () => {
    setPlaybackState(false);
    updatePlaybackUi(false);
    updateTimeline();
  });
  audioElement?.addEventListener("error", () => {
    if (!audioElement.getAttribute("src")) return;
    console.error("The selected beat preview could not be loaded.");
    setPlaybackState(false);
    if (playerStatus) playerStatus.textContent = "Could not load preview";
    updatePlaybackUi(false);
  });

  newsletterForm?.addEventListener("submit", async (event) => {
    event.preventDefault();
    if (!newsletterEmail || !newsletterButton || !newsletterMessage) return;

    newsletterMessage.textContent = "";
    newsletterMessage.className = "newsletter-msg";
    newsletterButton.disabled = true;
    newsletterButton.textContent = "Joining...";

    try {
      const response = await fetch("save_email.php", {
        method: "POST",
        headers: { "Content-Type": "application/x-www-form-urlencoded;charset=UTF-8" },
        body: new URLSearchParams({ email: newsletterEmail.value.trim() })
      });
      let result;
      try {
        result = await response.json();
      } catch {
        throw new Error("Could not contact the subscription service. Please try again.");
      }

      if (!response.ok || result.status !== "success") {
        throw new Error(result.message || "Subscription failed. Please try again.");
      }

      newsletterMessage.textContent = result.message;
      newsletterMessage.classList.add("feedback-success");
      newsletterForm.reset();
    } catch (error) {
      console.error("Newsletter subscription failed:", error);
      newsletterMessage.textContent =
        error instanceof Error ? error.message : "Could not subscribe. Please try again.";
      newsletterMessage.classList.add("feedback-error");
    } finally {
      newsletterButton.disabled = false;
      newsletterButton.textContent = "Join";

      window.clearTimeout(newsletterMessageTimer);
      newsletterMessageTimer = window.setTimeout(() => {
        newsletterMessage.textContent = "";
        newsletterMessage.className = "newsletter-msg";
      }, 6000);
    }
  });
});
