const menuToggle = document.querySelector(".menu-toggle");
const primaryNav = document.querySelector("#primary-nav");
const menuLabel = menuToggle?.querySelector(".sr-only");

function setMenuOpen(isOpen) {
  if (!menuToggle || !primaryNav || !menuLabel) return;

  menuToggle.setAttribute("aria-expanded", String(isOpen));
  menuLabel.textContent = isOpen ? "Close navigation" : "Open navigation";
  primaryNav.classList.toggle("is-open", isOpen);
}

menuToggle?.addEventListener("click", () => {
  setMenuOpen(menuToggle.getAttribute("aria-expanded") !== "true");
});

primaryNav?.querySelectorAll("a").forEach((link) => {
  link.addEventListener("click", () => setMenuOpen(false));
});

document.addEventListener("keydown", (event) => {
  if (event.key === "Escape" && menuToggle?.getAttribute("aria-expanded") === "true") {
    setMenuOpen(false);
    menuToggle.focus();
  }
});

const visibilityButton = document.querySelector(".visibility-button");
const portfolioCard = document.querySelector(".portfolio-card");

visibilityButton?.addEventListener("click", () => {
  const isHidden = portfolioCard?.classList.toggle("balance-hidden") ?? false;
  visibilityButton.setAttribute("aria-label", isHidden ? "Show balances" : "Hide balances");
});

const currentYear = document.querySelector("#current-year");
if (currentYear) currentYear.textContent = String(new Date().getFullYear());
