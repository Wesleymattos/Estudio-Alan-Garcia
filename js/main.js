document.addEventListener("DOMContentLoaded", () => {

  // ============================================================
  // ANO DO RODAPÉ
  // ============================================================

  const year = document.querySelectorAll("#year");

  year.forEach(el => {
    el.textContent = new Date().getFullYear();
  });


  // ============================================================
  // MENU MOBILE
  // ============================================================

  const toggle = document.querySelector(".menu-toggle");
  const nav = document.querySelector(".main-nav");

  if (toggle && nav) {
    toggle.addEventListener("click", () => {
      nav.classList.toggle("open");
    });
  }


  // ============================================================
  // TRANSIÇÃO ENTRE PÁGINAS
  // ============================================================

  const overlay = document.querySelector(".page-transition");

  document.querySelectorAll("[data-link]").forEach(link => {

    const href = link.getAttribute("href");

    if (!href || href.startsWith("#") || link.target === "_blank") {
      return;
    }

    link.addEventListener("click", e => {

      // Evita transição para a própria página
      const currentPage = location.pathname.split("/").pop() || "index.html";

      if (href === currentPage) {
        return;
      }

      e.preventDefault();

      if (overlay) {
        overlay.classList.add("is-leaving");
      }

      setTimeout(() => {
        window.location.href = href;
      }, 280);

    });

  });


  // ============================================================
  // CORREÇÃO DO BOTÃO VOLTAR / AVANÇAR DO NAVEGADOR
  // ============================================================

  window.addEventListener("pageshow", () => {

    const transition = document.querySelector(".page-transition");

    if (transition) {
      transition.classList.remove("is-leaving");
    }

  });


  // ============================================================
  // ANIMAÇÕES REVEAL
  // ============================================================

  const observer = new IntersectionObserver(entries => {

    entries.forEach(entry => {

      if (entry.isIntersecting) {
        entry.target.classList.add("is-visible");
      }

    });

  }, {
    threshold: 0.12
  });


  document.querySelectorAll(".reveal").forEach(el => {
    observer.observe(el);
  });


  // ============================================================
  // FORMULÁRIO DE CONTATO
  // ============================================================

const contactForm = document.querySelector("#contactForm");

if (contactForm) {

  contactForm.addEventListener("submit", e => {

    e.preventDefault();

    const msg = contactForm.querySelector(".form-message");
    const button = contactForm.querySelector("button[type='submit']");

    if (button) {
      button.disabled = true;

      button.innerHTML = `
        <i class="fa-solid fa-spinner fa-spin"></i>
        Enviando...
      `;
    }

    emailjs.sendForm(
      "service_g2fll5e",
      "template_x312lys",
      contactForm
    )

    .then(() => {

      if (msg) {
        msg.textContent =
          "Mensagem enviada com sucesso! Entraremos em contato em breve.";
      }

      contactForm.reset();

      if (button) {
        button.disabled = false;

        button.innerHTML = `
          <i class="fa-solid fa-envelope"></i>
          Enviar mensagem
          <b>→</b>
        `;
      }

    })

    .catch(error => {

      console.error("Erro ao enviar:", error);

      if (msg) {
        msg.textContent =
          "Não foi possível enviar a mensagem. Tente novamente.";
      }

      if (button) {
        button.disabled = false;

        button.innerHTML = `
          <i class="fa-solid fa-envelope"></i>
          Enviar mensagem
          <b>→</b>
        `;
      }

    });

  });

}

});