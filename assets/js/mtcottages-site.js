(function () {
  "use strict";

  var navMarkup = `
    <div class="mt-site-topbar">
      <div class="mt-site-container">
        <p>Fully furnished places to settle in across the Mid-Ohio Valley.</p>
        <a href="mailto:stay@mtcottages.com">stay@mtcottages.com</a>
      </div>
    </div>
    <div class="mt-site-nav-shell">
      <div class="mt-site-container mt-site-nav-row">
        <a class="mt-site-logo" href="index.html" aria-label="Mt Cottages home">
          <img src="assets/images/logo-mtcottages.svg" alt="Mt Cottages">
        </a>
        <button class="mt-nav-toggle" type="button" aria-expanded="false" aria-controls="mt-site-nav" aria-label="Open navigation">
          <span></span>
        </button>
        <nav class="mt-site-nav" id="mt-site-nav" aria-label="Main navigation" data-site-nav>
          <ul class="mt-nav-list">
            <li class="mt-nav-item mt-has-submenu">
              <a href="cottages.html">Cottages</a>
              <button class="mt-submenu-toggle" type="button" aria-expanded="false" aria-label="Open Cottages menu"><span>⌄</span></button>
              <ul class="mt-submenu">
                <li><a href="cottages.html">Find Your Place</a></li>
                <li><a href="cottages.html#marietta">Marietta, OH</a></li>
                <li><a href="cottages.html#parkersburg">Parkersburg, WV</a></li>
                <li><a href="cottages.html#ravenswood">Ravenswood, WV</a></li>
                <li><a href="available.html">Available Now</a></li>
              </ul>
            </li>
            <li class="mt-nav-item mt-has-submenu">
              <a href="locations.html">Locations</a>
              <button class="mt-submenu-toggle" type="button" aria-expanded="false" aria-label="Open Locations menu"><span>⌄</span></button>
              <ul class="mt-submenu">
                <li><a href="locations.html#marietta">Marietta, OH</a></li>
                <li><a href="locations.html#parkersburg">Parkersburg, WV</a></li>
                <li><a href="locations.html#ravenswood">Ravenswood, WV</a></li>
              </ul>
            </li>
            <li class="mt-nav-item mt-has-submenu">
              <a href="living.html">Living</a>
              <button class="mt-submenu-toggle" type="button" aria-expanded="false" aria-label="Open Living menu"><span>⌄</span></button>
              <ul class="mt-submenu">
                <li><a href="living.html#travel-nurses">Travel Nurses &amp; Healthcare Professionals</a></li>
                <li><a href="living.html#relocation">Work &amp; Relocation</a></li>
                <li><a href="living.html#insurance">Insurance Housing</a></li>
                <li><a href="living.html#families">Families &amp; Extended Stays</a></li>
              </ul>
            </li>
            <li class="mt-nav-item"><a href="services.html">Services</a></li>
            <li class="mt-nav-item"><a href="about.html">About</a></li>
            <li class="mt-nav-item"><a href="contact.html">Contact</a></li>
            <li class="mt-nav-item"><a href="residents.html">Residents</a></li>
            <li class="mt-nav-item mt-nav-mobile-cta"><a href="apply.html">Stay with Us</a></li>
          </ul>
        </nav>
        <a class="mt-nav-cta" href="apply.html">Stay with Us <span aria-hidden="true">↗</span></a>
      </div>
    </div>`;

  var footerMarkup = `
    <footer class="mt-footer">
      <div class="mt-site-container">
        <div class="mt-footer-grid">
          <div class="mt-footer-brand">
            <a href="index.html"><img src="assets/images/logo-mtcottages.svg" alt="Mt Cottages"></a>
            <p>Fully furnished places to settle in across the Mid-Ohio Valley—whether life brings you for an assignment, a transition, or a longer chapter.</p>
          </div>
          <div>
            <h3>Cottages</h3>
            <ul class="mt-footer-list">
              <li><a href="cottages.html">Find Your Place</a></li>
              <li><a href="cottages.html#marietta">Marietta, OH</a></li>
              <li><a href="cottages.html#parkersburg">Parkersburg, WV</a></li>
              <li><a href="cottages.html#ravenswood">Ravenswood, WV</a></li>
              <li><a href="available.html">Available Now</a></li>
            </ul>
          </div>
          <div>
            <h3>Explore</h3>
            <ul class="mt-footer-list">
              <li><a href="locations.html">Locations</a></li>
              <li><a href="living.html">Living</a></li>
              <li><a href="services.html">Services</a></li>
              <li><a href="faq.html">Guest FAQs</a></li>
              <li><a href="about.html">About</a></li>
            </ul>
          </div>
          <div>
            <h3>Connect</h3>
            <ul class="mt-footer-list">
              <li><a href="apply.html">Stay with Us</a></li>
              <li><a href="residents.html">Residents</a></li>
              <li><a href="partnerships.html">Partnerships</a></li>
              <li><a href="contact.html">Contact</a></li>
              <li><a href="mailto:stay@mtcottages.com">stay@mtcottages.com</a></li>
            </ul>
          </div>
        </div>
        <div class="mt-footer-bottom">
          <p>© <span data-year></span> Mt Cottages. A guest-facing furnished housing company.</p>
          <p>Mid-Ohio Valley · Ohio &amp; West Virginia</p>
        </div>
      </div>
    </footer>`;

  function currentPage() {
    var file = window.location.pathname.split("/").pop();
    return file || "index.html";
  }

  function markActiveLinks() {
    var page = currentPage();
    document.querySelectorAll(".mt-site-nav a, .mt-footer a").forEach(function (link) {
      var href = link.getAttribute("href") || "";
      var linkPage = href.split("#")[0];
      if (linkPage === page || (page === "index.html" && linkPage === "")) {
        link.classList.add("is-active");
      }
    });
  }

  function initNavigation() {
    var toggle = document.querySelector(".mt-nav-toggle");
    var nav = document.querySelector("[data-site-nav]");

    if (toggle && nav) {
      toggle.addEventListener("click", function () {
        var isOpen = nav.classList.toggle("is-open");
        toggle.setAttribute("aria-expanded", String(isOpen));
        toggle.setAttribute("aria-label", isOpen ? "Close navigation" : "Open navigation");
      });
    }

    document.querySelectorAll(".mt-submenu-toggle").forEach(function (button) {
      button.addEventListener("click", function () {
        var item = button.closest(".mt-nav-item");
        var isOpen = item.classList.toggle("is-open");
        button.setAttribute("aria-expanded", String(isOpen));
      });
    });

    document.querySelectorAll(".mt-site-nav a").forEach(function (link) {
      link.addEventListener("click", function () {
        if (nav) nav.classList.remove("is-open");
        if (toggle) {
          toggle.setAttribute("aria-expanded", "false");
          toggle.setAttribute("aria-label", "Open navigation");
        }
      });
    });
  }

  document.addEventListener("DOMContentLoaded", function () {
    var header = document.querySelector("[data-site-header]");
    var footer = document.querySelector("[data-site-footer]");
    if (header) header.outerHTML = "<header class=\"mt-site-header\">" + navMarkup + "</header>";
    if (footer) footer.outerHTML = footerMarkup;
    initNavigation();
    markActiveLinks();
  });
})();
