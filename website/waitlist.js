(function () {
  const shotLightbox = document.getElementById("shot-lightbox");
  const shotLightboxImage = document.getElementById("shot-lightbox-image");
  const shotLightboxClose = document.getElementById("shot-lightbox-close");
  const shotTriggers = Array.from(document.querySelectorAll(".shot-trigger"));
  const waitlistForm = document.getElementById("waitlist-form");
  const waitlistStatus = document.getElementById("waitlist-status");

  if (shotLightbox && shotLightboxImage && shotLightboxClose) {
    const closeLightbox = () => {
      shotLightbox.hidden = true;
      document.body.style.overflow = "";
      shotLightboxImage.setAttribute("src", "");
      shotLightboxImage.setAttribute("alt", "");
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
        document.body.style.overflow = "hidden";
      });
    });

    shotLightbox.addEventListener("click", (event) => {
      const target = event.target;
      if (!(target instanceof HTMLElement)) {
        return;
      }

      if (target.dataset.shotClose === "true") {
        closeLightbox();
      }
    });

    shotLightboxClose.addEventListener("click", closeLightbox);

    document.addEventListener("keydown", (event) => {
      if (event.key === "Escape" && !shotLightbox.hidden) {
        closeLightbox();
      }
    });
  }

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
