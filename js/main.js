document.addEventListener("DOMContentLoaded", () => {
  const year = document.querySelectorAll("#year");
  year.forEach(el => el.textContent = new Date().getFullYear());

  const toggle = document.querySelector(".menu-toggle");
  const nav = document.querySelector(".main-nav");
  if (toggle && nav) {
    toggle.addEventListener("click", () => nav.classList.toggle("open"));
  }

  document.querySelectorAll("[data-link]").forEach(link => {
    const href = link.getAttribute("href");
    if (!href || href.startsWith("#") || link.target === "_blank") return;
    link.addEventListener("click", e => {
      if (href === location.pathname.split("/").pop()) return;
      e.preventDefault();
      const overlay = document.querySelector(".page-transition");
      overlay.classList.add("is-leaving");
      setTimeout(() => location.href = href, 280);
    });
  });

  const observer = new IntersectionObserver(entries => {
    entries.forEach(entry => {
      if (entry.isIntersecting) entry.target.classList.add("is-visible");
    });
  }, { threshold: 0.12 });
  document.querySelectorAll(".reveal").forEach(el => observer.observe(el));

  const contactForm = document.querySelector("#contactForm");
  if (contactForm) {
    contactForm.addEventListener("submit", e => {
      e.preventDefault();
      const msg = contactForm.querySelector(".form-message");
      msg.textContent = "Mensagem registrada nesta versão inicial. Em breve podemos conectar ao WhatsApp ou Firebase.";
      contactForm.reset();
    });
  }
});