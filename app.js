(() => {
  const qs = (s, el=document) => el.querySelector(s);
  const qsa = (s, el=document) => [...el.querySelectorAll(s)];

  // Year
  const yearEl = qs("#year");
  if (yearEl) yearEl.textContent = new Date().getFullYear();

  // Mobile nav
  const navToggle = qs("#navToggle");
  const navMenu = qs("#navMenu");
  if (navToggle && navMenu) {
    navToggle.addEventListener("click", () => {
      const open = navMenu.classList.toggle("is-open");
      navToggle.setAttribute("aria-expanded", String(open));
    });

    qsa(".nav__link").forEach(a => {
      a.addEventListener("click", () => {
        navMenu.classList.remove("is-open");
        navToggle.setAttribute("aria-expanded", "false");
      });
    });

    document.addEventListener("click", (e) => {
      const within = navMenu.contains(e.target) || navToggle.contains(e.target);
      if (!within) {
        navMenu.classList.remove("is-open");
        navToggle.setAttribute("aria-expanded", "false");
      }
    });
  }

  // Theme toggle (persist)
  const themeToggle = qs("#themeToggle");
  const savedTheme = localStorage.getItem("hio_theme");
  if (savedTheme) {
    if (savedTheme === "dark") document.documentElement.setAttribute("data-theme", "dark");
  }

  const updateThemeButton = () => {
    const theme = document.documentElement.getAttribute("data-theme") || "light";
    const icon = qs("#themeToggle .icon");
    const text = qs("#themeToggle .btn__text");
    if (!icon || !text) return;
    if (theme === "dark") { icon.textContent = "🌙"; text.textContent = "Dark"; }
    else { icon.textContent = "☀️"; text.textContent = "Light"; }
  };
  updateThemeButton();

  if (themeToggle) {
    themeToggle.addEventListener("click", () => {
      const cur = document.documentElement.getAttribute("data-theme") || "light";
      const next = cur === "dark" ? "light" : "dark";
      if (next === "light") document.documentElement.removeAttribute("data-theme");
      else document.documentElement.setAttribute("data-theme", "dark");
      localStorage.setItem("hio_theme", next);
      updateThemeButton();
    });
  }

  // Menu filtering
  const tabs = qsa(".tab");
  const items = qsa(".menuItem");
  tabs.forEach(t => {
    t.addEventListener("click", () => {
      tabs.forEach(x => x.classList.remove("is-active"));
      t.classList.add("is-active");

      const filter = t.dataset.filter;
      items.forEach(card => {
        const type = card.dataset.type;
        const show = filter === "all" || type === filter;
        card.style.display = show ? "" : "none";
      });

      tabs.forEach(x => x.setAttribute("aria-selected", "false"));
      t.setAttribute("aria-selected", "true");
    });
  });

  // Gallery modal
  const modal = qs("#modal");
  const modalImg = qs("#modalImg");
  const modalCap = qs("#modalCap");
  const galleryBtns = qsa("#galleryGrid .shot");

  const openModal = (src, alt) => {
    if (!modal || !modalImg) return;
    modal.classList.add("is-open");
    modal.setAttribute("aria-hidden", "false");

    modalImg.onerror = () => {
      modalImg.removeAttribute("src");
      modalImg.style.height = "420px";
      modalImg.style.background =
        "radial-gradient(520px 240px at 20% 20%, rgba(37,99,235,.22), transparent 60%)," +
        "radial-gradient(520px 240px at 80% 30%, rgba(34,197,94,.18), transparent 62%)," +
        "linear-gradient(180deg, rgba(0,0,0,.04), rgba(0,0,0,.02))";
    };

    modalImg.style.height = "";
    modalImg.style.background = "";
    modalImg.src = src;
    modalImg.alt = alt || "Photo";
    if (modalCap) modalCap.textContent = alt || "";
    document.body.style.overflow = "hidden";
  };

  const closeModal = () => {
    if (!modal) return;
    modal.classList.remove("is-open");
    modal.setAttribute("aria-hidden", "true");
    document.body.style.overflow = "";
  };

  galleryBtns.forEach(btn => {
    btn.addEventListener("click", () => openModal(btn.dataset.img, btn.dataset.alt));
  });

  if (modal) {
    modal.addEventListener("click", (e) => {
      const close = e.target && e.target.dataset && e.target.dataset.close === "true";
      if (close) closeModal();
    });
  }
  document.addEventListener("keydown", (e) => { if (e.key === "Escape") closeModal(); });

  // Hours + "Open now"
  // From their official hours: Mon–Sun 11AM–2AM; NFL Sundays 10AM–2AM
  const hours = [
    { day: "Mon", open: "11:00 AM", close: "2:00 AM" },
    { day: "Tue", open: "11:00 AM", close: "2:00 AM" },
    { day: "Wed", open: "11:00 AM", close: "2:00 AM" },
    { day: "Thu", open: "11:00 AM", close: "2:00 AM" },
    { day: "Fri", open: "11:00 AM", close: "2:00 AM" },
    { day: "Sat", open: "11:00 AM", close: "2:00 AM" },
    { day: "Sun", open: "10:00 AM", close: "2:00 AM" }, // NFL Sunday hours
  ];

  const hoursList = qs("#hoursList");
  if (hoursList) {
    hoursList.innerHTML = hours.map(h => `
      <div class="hoursRow">
        <strong>${h.day}</strong>
        <span>${h.open} – ${h.close}</span>
      </div>
    `).join("");
  }

  // Parse time like "11:00 AM" into minutes since midnight
  const toMinutes = (t) => {
    const m = t.match(/^(\d{1,2}):(\d{2})\s*(AM|PM)$/i);
    if (!m) return null;
    let hh = parseInt(m[1], 10);
    const mm = parseInt(m[2], 10);
    const ap = m[3].toUpperCase();
    if (ap === "PM" && hh !== 12) hh += 12;
    if (ap === "AM" && hh === 12) hh = 0;
    return hh * 60 + mm;
  };

  const openNowText = qs("#openNowText");
  if (openNowText) {
    const now = new Date();
    const dayIdx = now.getDay(); // Sun=0
    const dayMap = ["Sun","Mon","Tue","Wed","Thu","Fri","Sat"];
    const today = dayMap[dayIdx];
    const todayHours = hours.find(h => h.day === today);

    if (!todayHours) {
      openNowText.textContent = "Hours not set";
    } else {
      const nowMin = now.getHours() * 60 + now.getMinutes();
      const openMin = toMinutes(todayHours.open);
      let closeMin = toMinutes(todayHours.close);

      // If close is past midnight (e.g., 2:00 AM), treat it as next day
      if (closeMin !== null && openMin !== null && closeMin < openMin) closeMin += 1440;

      const isOpen = (openMin !== null && closeMin !== null) && (
        (nowMin >= openMin && nowMin <= closeMin) ||
        (closeMin > 1440 && (nowMin + 1440) <= closeMin)
      );

      openNowText.textContent = isOpen
        ? `Open now • closes ${todayHours.close}`
        : `Closed • opens ${todayHours.open}`;
    }
  }

  // Forms -> mailto (no backend)
  const makeMailto = ({ to, subject, body }) => {
    const params = new URLSearchParams({
      subject: subject || "",
      body: body || ""
    });
    return `mailto:${encodeURIComponent(to)}?${params.toString()}`;
  };

  const CONTACT_EMAIL = "info@holeinonemontebello.com";

  const contactForm = qs("#contactForm");
  if (contactForm) {
    contactForm.addEventListener("submit", (e) => {
      e.preventDefault();
      const fd = new FormData(contactForm);
      const name = (fd.get("name") || "").toString().trim();
      const email = (fd.get("email") || "").toString().trim();
      const message = (fd.get("message") || "").toString().trim();

      const body =
`Name: ${name}
Email: ${email}

Message:
${message}
`;

      window.location.href = makeMailto({
        to: CONTACT_EMAIL,
        subject: "Website Contact — Hole in One Bar & Grill",
        body
      });
    });
  }

  const eventForm = qs("#eventForm");
  if (eventForm) {
    eventForm.addEventListener("submit", (e) => {
      e.preventDefault();
      const fd = new FormData(eventForm);
      const name = (fd.get("name") || "").toString().trim();
      const size = (fd.get("size") || "").toString().trim();
      const details = (fd.get("details") || "").toString().trim();

      const body =
`Name: ${name}
Group size: ${size}

Details:
${details}
`;

      window.location.href = makeMailto({
        to: CONTACT_EMAIL,
        subject: "Event Request — Hole in One Bar & Grill",
        body
      });
    });
  }
})();
