
/* =========================================
   STUDIO ALAN GARCIA — PÁGINA DE VÍDEOS
   Arquivo: js/videos.js
   ========================================= */

(() => {
  "use strict";

  const carousel = document.getElementById("videosCarousel");
  const cards = [...document.querySelectorAll(".videos-card")];
  const counter = document.getElementById("videosCounter");

  const modal = document.getElementById("videosModal");
  const player = document.getElementById("videosPlayer");
  const closeButton = document.getElementById("videosClose");
  const modalTitle = document.getElementById("videosModalTitle");

  if (!carousel || !modal || !player || !closeButton || !modalTitle) {
    console.error(
      "Não foi possível encontrar os elementos da página de vídeos."
    );
    return;
  }

  /* =========================================
     CARROSSEL
     ========================================= */

  function getStepSize() {
    const firstCard = cards[0];

    if (!firstCard) return 0;

    const styles = window.getComputedStyle(carousel);
    const gap = parseFloat(styles.columnGap || styles.gap) || 0;

    return firstCard.getBoundingClientRect().width + gap;
  }

  function moveCarousel(direction) {
    const maxScroll = carousel.scrollWidth - carousel.clientWidth;

    if (maxScroll <= 1) return;

    const distance = getStepSize();

    if (distance <= 0) return;

    let nextPosition = carousel.scrollLeft + direction * distance;

    if (direction > 0 && nextPosition >= maxScroll - 5) {
      nextPosition = 0;
    } else if (direction < 0 && nextPosition <= 5) {
      nextPosition = maxScroll;
    }

    carousel.scrollTo({
      left: nextPosition,
      behavior: window.matchMedia(
        "(prefers-reduced-motion: reduce)"
      ).matches
        ? "auto"
        : "smooth"
    });
  }

  const previousButton = document.getElementById("videosPrev");
  const nextButton = document.getElementById("videosNext");

  if (previousButton) {
    previousButton.addEventListener("click", () => {
      moveCarousel(-1);
    });
  }

  if (nextButton) {
    nextButton.addEventListener("click", () => {
      moveCarousel(1);
    });
  }

  /* =========================================
     CONTADOR DOS VÍDEOS
     ========================================= */

  function updateCounter() {
    if (!counter || cards.length === 0) return;

    let nearestIndex = 0;
    let nearestDistance = Infinity;

    cards.forEach((card, index) => {
      const distance = Math.abs(
        card.getBoundingClientRect().left -
          carousel.getBoundingClientRect().left
      );

      if (distance < nearestDistance) {
        nearestDistance = distance;
        nearestIndex = index;
      }
    });

    counter.textContent =
      String(nearestIndex + 1).padStart(2, "0") +
      " — " +
      String(cards.length).padStart(2, "0");
  }

  carousel.addEventListener("scroll", updateCounter, {
    passive: true
  });

  window.addEventListener("resize", updateCounter);

  updateCounter();

  /* =========================================
     IDENTIFICAÇÃO DO VÍDEO
     Aceita MP4, WEBM, OGG e YouTube.
     ========================================= */

  function parseVideo(url) {
    if (!url || typeof url !== "string") {
      return null;
    }

    const value = url.trim();

    // Arquivos locais ou URLs de vídeos.
    if (/\.(mp4|webm|ogg)(?:[?#].*)?$/i.test(value)) {
      return {
        type: "file",
        url: value
      };
    }

    try {
      const parsed = new URL(value, window.location.href);
      const hostname = parsed.hostname.toLowerCase();

      // Links curtos do YouTube.
      if (
        hostname === "youtu.be" &&
        ["http:", "https:"].includes(parsed.protocol)
      ) {
        return {
          type: "youtube",
          id: parsed.pathname.split("/").filter(Boolean)[0] || ""
        };
      }

      // Links normais, incorporados ou Shorts do YouTube.
      const youtubeHosts = [
        "youtube.com",
        "www.youtube.com",
        "m.youtube.com",
        "music.youtube.com"
      ];

      if (
        youtubeHosts.includes(hostname) &&
        ["http:", "https:"].includes(parsed.protocol)
      ) {
        if (parsed.pathname === "/watch") {
          return {
            type: "youtube",
            id: parsed.searchParams.get("v") || ""
          };
        }

        const match = parsed.pathname.match(
          /^\/(?:embed|shorts)\/([^/]+)/
        );

        if (match) {
          return {
            type: "youtube",
            id: match[1]
          };
        }
      }
    } catch (error) {
      console.error(
        "Erro ao interpretar o endereço do vídeo:",
        error
      );
    }

    return null;
  }

  /* =========================================
     ABRIR E REPRODUZIR VÍDEO
     ========================================= */

  let previouslyFocusedElement = null;

  function openVideo(card) {
    const videoUrl = card.dataset.video || "";
    const videoTitle = card.dataset.title || "Assistir vídeo";
    const source = parseVideo(videoUrl);

    if (
      !source ||
      (
        source.type === "youtube" &&
        !/^[\w-]{11}$/.test(source.id)
      )
    ) {
      alert(
        "Este vídeo não está configurado corretamente. " +
        "Confira o caminho do arquivo ou o link do YouTube."
      );
      return;
    }

    previouslyFocusedElement = document.activeElement;

    modalTitle.textContent = videoTitle;
    player.replaceChildren();

    if (source.type === "youtube") {
      const iframe = document.createElement("iframe");

      iframe.src =
        "https://www.youtube-nocookie.com/embed/" +
        encodeURIComponent(source.id) +
        "?autoplay=1&rel=0";

      iframe.title = videoTitle;

      iframe.allow =
        "accelerometer; autoplay; clipboard-write; encrypted-media; " +
        "gyroscope; picture-in-picture; web-share";

      iframe.allowFullscreen = true;
      iframe.referrerPolicy = "strict-origin-when-cross-origin";

      player.appendChild(iframe);
    } else {
      const video = document.createElement("video");

      video.src = source.url;
      video.controls = true;
      video.autoplay = true;
      video.playsInline = true;
      video.preload = "metadata";

      video.addEventListener("error", () => {
        console.error(
          "Não foi possível carregar o arquivo:",
          source.url
        );
      });

      player.appendChild(video);

      const playPromise = video.play();

      if (
        playPromise &&
        typeof playPromise.catch === "function"
      ) {
        playPromise.catch(() => {
          // O visitante pode iniciar o vídeo pelos controles.
        });
      }
    }

    modal.hidden = false;
    document.body.classList.add("videos-modal-open");

    closeButton.focus();
  }

  /* =========================================
     FECHAR MODAL
     ========================================= */

  function closeVideo() {
    if (modal.hidden) return;

    player.replaceChildren();

    modal.hidden = true;
    document.body.classList.remove("videos-modal-open");

    if (
      previouslyFocusedElement &&
      typeof previouslyFocusedElement.focus === "function"
    ) {
      previouslyFocusedElement.focus();
    }

    previouslyFocusedElement = null;
  }

  cards.forEach(card => {
    card.addEventListener("click", () => {
      openVideo(card);
    });
  });

  closeButton.addEventListener("click", closeVideo);

  const backdrop = modal.querySelector("[data-close-videos]");

  if (backdrop) {
    backdrop.addEventListener("click", closeVideo);
  }

  document.addEventListener("keydown", event => {
    if (event.key === "Escape" && !modal.hidden) {
      closeVideo();
    }
  });

  /* =========================================
     MENU MOBILE
     IMPORTANTE:
     O menu é controlado exclusivamente pelo
     js/main.js. Não adicionar outro listener
     para .menu-toggle neste arquivo.
     ========================================= */

  console.log("Página de vídeos inicializada com sucesso.");
})();
