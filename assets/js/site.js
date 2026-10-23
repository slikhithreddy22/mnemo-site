// Shared behaviour for index.html and docs.html: menu, theme, active link, copy buttons.
(function () {
  const root = document.documentElement;

  // theme: follows the OS until the visitor picks one
  const toggle = document.querySelector(".theme-toggle");
  if (toggle) {
    toggle.addEventListener("click", () => {
      const dark = root.dataset.theme
        ? root.dataset.theme === "dark"
        : matchMedia("(prefers-color-scheme: dark)").matches;
      root.dataset.theme = dark ? "light" : "dark";
      try { localStorage.setItem("mnemo-theme", root.dataset.theme); } catch (e) {}
      document.dispatchEvent(new CustomEvent("themechange"));
    });
  }
  matchMedia("(prefers-color-scheme: dark)").addEventListener("change", () =>
    document.dispatchEvent(new CustomEvent("themechange")));

  // small-screen menu
  const menu = document.querySelector(".menu-btn");
  const nav = document.getElementById("nav");
  if (menu && nav) {
    menu.addEventListener("click", () => {
      const open = nav.classList.toggle("open");
      menu.setAttribute("aria-expanded", String(open));
    });
    nav.addEventListener("click", (e) => {
      if (e.target.closest("a")) { nav.classList.remove("open"); menu.setAttribute("aria-expanded", "false"); }
    });
  }

  // hairline under the bar once the page scrolls
  const bar = document.querySelector(".bar");
  const onScroll = () => bar && bar.classList.toggle("scrolled", scrollY > 8);
  addEventListener("scroll", onScroll, { passive: true });
  onScroll();

  // highlight the link of the section in view (top nav on the home page, sidebar on docs)
  const links = [...document.querySelectorAll('.nav a[href^="#"], .toc a[href^="#"]')];
  const targets = links.map((a) => document.querySelector(a.getAttribute("href"))).filter(Boolean);
  if (targets.length && "IntersectionObserver" in window) {
    const seen = new Map();
    const io = new IntersectionObserver((entries) => {
      entries.forEach((e) => seen.set(e.target.id, e.isIntersecting));
      const current = targets.find((t) => seen.get(t.id));
      links.forEach((a) => a.classList.toggle("active", !!current && a.getAttribute("href") === "#" + current.id));
    }, { rootMargin: "-30% 0px -60% 0px" });
    targets.forEach((t) => io.observe(t));
  }

  // copy buttons: <button class="copy" data-copy="id-of-pre">
  document.querySelectorAll(".copy").forEach((b) => {
    b.addEventListener("click", async () => {
      const el = document.getElementById(b.dataset.copy) || b.parentElement.querySelector("pre");
      try {
        await navigator.clipboard.writeText(el.textContent.trim());
        b.textContent = "Copied";
      } catch (e) {
        b.textContent = "Select and copy";
      }
      setTimeout(() => (b.textContent = "Copy"), 1600);
    });
  });
})();
