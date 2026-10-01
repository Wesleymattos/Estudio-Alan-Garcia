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

    const name = document.querySelector("#name").value.trim();
    const phone = document.querySelector("#phone").value.trim();
    const goal = document.querySelector("#goal").value;
    const message = document.querySelector("#message").value.trim();

    const email = "studioalangarcia@gmail.com";

    const subject = encodeURIComponent(
      `Novo contato pelo site - ${name}`
    );

    const body = encodeURIComponent(
`Olá, Studio Alan Garcia!

Recebemos um novo contato pelo site.

Nome: ${name}
Telefone/WhatsApp: ${phone}
Objetivo: ${goal}

Mensagem:
${message}

------------------------------
Mensagem enviada pelo site
Studio Alan Garcia`
    );

    window.location.href =
      `mailto:${email}?subject=${subject}&body=${body}`;

  });

}

});