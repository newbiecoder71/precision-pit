(function () {
  const shotLightbox = document.getElementById("shot-lightbox");
  const shotLightboxImage = document.getElementById("shot-lightbox-image");
  const shotLightboxClose = document.getElementById("shot-lightbox-close");
  const shotTriggers = Array.from(document.querySelectorAll(".shot-trigger"));
  const videoLightbox = document.getElementById("video-lightbox");
  const videoLightboxPlayer = document.getElementById("video-lightbox-player");
  const videoLightboxClose = document.getElementById("video-lightbox-close");
  const videoTriggers = Array.from(document.querySelectorAll(".video-trigger"));
  const waitlistForm = document.getElementById("waitlist-form");
  const waitlistStatus = document.getElementById("waitlist-status");
  let activeOverlay = null;
  let overlayHistoryOpen = false;

  const syncBodyScroll = () => {
    document.body.style.overflow = activeOverlay ? "hidden" : "";
  };

  const pushOverlayHistory = (overlayType) => {
    history.pushState({ precisionPitOverlay: overlayType }, "", window.location.href);
    overlayHistoryOpen = true;
  };

  const requestOverlayClose = (closeFn) => {
    if (overlayHistoryOpen) {
      history.back();
      return;
    }

    closeFn();
  };

  if (shotLightbox && shotLightboxImage && shotLightboxClose) {
    const closeLightbox = () => {
      shotLightbox.hidden = true;
      shotLightboxImage.setAttribute("src", "");
      shotLightboxImage.setAttribute("alt", "");
      if (activeOverlay === "shot") {
        activeOverlay = null;
      }
      syncBodyScroll();
    };

    shotTriggers.forEach((trigger) => {
      trigger.addEventListener("click", () => {
        const src = trigger.getAttribute("data-shot-src");
        const alt = trigger.getAttribute("data-shot-alt") || "Precision Pit screenshot";

        if (!src) {
          return;
        }

        shotLightboxImage.setAttribute("src", src);
        shotLightboxImage.setAttribute("alt", alt);
        shotLightbox.hidden = false;
        activeOverlay = "shot";
        syncBodyScroll();
        pushOverlayHistory("shot");
      });
    });

    shotLightbox.addEventListener("click", (event) => {
      const target = event.target;
      if (!(target instanceof HTMLElement)) {
        return;
      }

      if (target.dataset.shotClose === "true") {
        requestOverlayClose(closeLightbox);
      }
    });

    shotLightboxClose.addEventListener("click", () => requestOverlayClose(closeLightbox));

    document.addEventListener("keydown", (event) => {
      if (event.key === "Escape" && !shotLightbox.hidden) {
        requestOverlayClose(closeLightbox);
      }
    });
  }

  if (videoLightbox && videoLightboxPlayer instanceof HTMLVideoElement && videoLightboxClose) {
    const closeVideoLightbox = () => {
      videoLightbox.hidden = true;
      videoLightboxPlayer.pause();
      videoLightboxPlayer.removeAttribute("src");
      videoLightboxPlayer.load();
      if (activeOverlay === "video") {
        activeOverlay = null;
      }
      syncBodyScroll();
    };

    videoTriggers.forEach((trigger) => {
      trigger.addEventListener("click", () => {
        const src = trigger.getAttribute("data-video-src");

        if (!src) {
          return;
        }

        videoLightboxPlayer.setAttribute("src", src);
        videoLightbox.hidden = false;
        activeOverlay = "video";
        syncBodyScroll();
        pushOverlayHistory("video");
        videoLightboxPlayer.load();
        videoLightboxPlayer.play().catch(() => {});
      });
    });

    videoLightbox.addEventListener("click", (event) => {
      const target = event.target;
      if (!(target instanceof HTMLElement)) {
        return;
      }

      if (target.dataset.videoClose === "true") {
        requestOverlayClose(closeVideoLightbox);
      }
    });

    videoLightboxClose.addEventListener("click", () => requestOverlayClose(closeVideoLightbox));

    document.addEventListener("keydown", (event) => {
      if (event.key === "Escape" && !videoLightbox.hidden) {
        requestOverlayClose(closeVideoLightbox);
      }
    });
  }

  window.addEventListener("popstate", () => {
    if (!activeOverlay) {
      overlayHistoryOpen = false;
      return;
    }

    overlayHistoryOpen = false;

    if (activeOverlay === "shot" && shotLightbox && shotLightboxImage) {
      shotLightbox.hidden = true;
      shotLightboxImage.setAttribute("src", "");
      shotLightboxImage.setAttribute("alt", "");
    }

    if (activeOverlay === "video" && videoLightbox && videoLightboxPlayer instanceof HTMLVideoElement) {
      videoLightbox.hidden = true;
      videoLightboxPlayer.pause();
      videoLightboxPlayer.removeAttribute("src");
      videoLightboxPlayer.load();
    }

    activeOverlay = null;
    syncBodyScroll();
  });

  if (!waitlistForm || !waitlistStatus) {
    return;
  }

  const endpoint = "https://xaouudfgdcvenomngtcy.supabase.co/functions/v1/join-waitlist";
  const platformInput = waitlistForm.querySelector('input[name="platformPreference"]');
  const platformButtons = Array.from(
    waitlistForm.querySelectorAll(".waitlist-platform-button"),
  );
  const clearButtons = Array.from(waitlistForm.querySelectorAll(".waitlist-clear"));
  const fieldControls = Array.from(waitlistForm.querySelectorAll(".waitlist-field-control"));

  const updateClearState = () => {
    fieldControls.forEach((control) => {
      const input = control.querySelector("input, textarea");
      if (!(input instanceof HTMLInputElement || input instanceof HTMLTextAreaElement)) {
        return;
      }

      control.classList.toggle("has-value", input.value.trim().length > 0);
    });
  };

  platformButtons.forEach((button) => {
    button.addEventListener("click", () => {
      const nextPlatform = button.getAttribute("data-platform") || "Either";

      if (platformInput instanceof HTMLInputElement) {
        platformInput.value = nextPlatform;
      }

      platformButtons.forEach((candidate) => {
        candidate.classList.toggle("is-active", candidate === button);
      });
    });
  });

  clearButtons.forEach((button) => {
    button.addEventListener("click", () => {
      const control = button.closest(".waitlist-field-control");
      const input = control?.querySelector("input, textarea");

      if (input instanceof HTMLInputElement || input instanceof HTMLTextAreaElement) {
        input.value = "";
        input.focus();
        updateClearState();
      }
    });
  });

  waitlistForm.addEventListener("input", updateClearState);
  updateClearState();

  waitlistForm.addEventListener("submit", async (event) => {
    event.preventDefault();

    const submitButton = waitlistForm.querySelector('button[type="submit"]');
    const formData = new FormData(waitlistForm);
    const payload = {
      fullName: String(formData.get("fullName") || ""),
      email: String(formData.get("email") || ""),
      teamName: String(formData.get("teamName") || ""),
      platformPreference: String(formData.get("platformPreference") || "Either"),
      notes: String(formData.get("notes") || ""),
      website: String(formData.get("website") || ""),
    };

    waitlistStatus.textContent = "Submitting your waitlist request...";
    waitlistStatus.dataset.state = "pending";

    if (submitButton instanceof HTMLButtonElement) {
      submitButton.disabled = true;
    }

    try {
      const response = await fetch(endpoint, {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify(payload),
      });

      const result = await response.json().catch(() => ({}));

      if (!response.ok) {
        throw new Error(result.error || "Unable to join the waiting list right now.");
      }

      waitlistForm.reset();
      if (platformInput instanceof HTMLInputElement) {
        platformInput.value = "Either";
      }
      platformButtons.forEach((candidate) => {
        candidate.classList.remove("is-active");
      });
      updateClearState();
      waitlistStatus.textContent =
        result.message || "You are on the waiting list. We will be in touch when Precision Pit launches.";
      waitlistStatus.dataset.state = "success";
    } catch (error) {
      waitlistStatus.textContent =
        error instanceof Error ? error.message : "Unable to join the waiting list right now.";
      waitlistStatus.dataset.state = "error";
    } finally {
      if (submitButton instanceof HTMLButtonElement) {
        submitButton.disabled = false;
      }
    }
  });
})();
