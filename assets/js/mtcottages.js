(function () {
  "use strict";

  function setFormValue(name, value) {
    if (!value) return;
    var field = document.querySelector('[name="' + name + '"]');
    if (field) field.value = value;
  }

  function showStatus(status, type, message) {
    if (!status) return;
    status.className = "form-status is-visible " + type;
    status.textContent = message;
  }

  document.addEventListener("DOMContentLoaded", function () {
    document.querySelectorAll("[data-year]").forEach(function (element) {
      element.textContent = new Date().getFullYear();
    });

    var navToggle = document.querySelector("[data-nav-toggle]");
    var nav = document.querySelector("[data-site-nav]");
    if (navToggle && nav) {
      navToggle.addEventListener("click", function () {
        var open = nav.classList.toggle("is-open");
        navToggle.setAttribute("aria-expanded", String(open));
      });
      nav.querySelectorAll("a").forEach(function (link) {
        link.addEventListener("click", function () {
          nav.classList.remove("is-open");
          navToggle.setAttribute("aria-expanded", "false");
        });
      });
    }

    var query = new URLSearchParams(window.location.search);
    setFormValue("stayType", query.get("stayType"));
    setFormValue("preferredLocation", query.get("location"));

    var sourceUrl = document.querySelector('[name="sourceUrl"]');
    if (sourceUrl) sourceUrl.value = window.location.href;

    var form = document.querySelector("[data-application-form]");
    if (!form) return;

    var status = form.querySelector("[data-form-status]");
    form.addEventListener("submit", async function (event) {
      event.preventDefault();
      if (!form.checkValidity()) {
        form.reportValidity();
        return;
      }
      var submit = form.querySelector('button[type="submit"]');
      if (submit) {
        submit.disabled = true;
        submit.setAttribute("aria-busy", "true");
      }
      showStatus(status, "", "Sending your application securely…");

      var formData = new FormData(form);
      formData.set("page", window.location.href);
      var payload = new URLSearchParams(formData).toString();

      try {
        var response = await fetch(form.action, {
          method: "POST",
          headers: { "Content-Type": "application/x-www-form-urlencoded", Accept: "application/json" },
          body: payload
        });
        var result = await response.json().catch(function () { return {}; });
        if (!response.ok || result.success === false) throw new Error("The application was not accepted.");
        form.reset();
        showStatus(status, "success", "Thank you — your application is in. Our team will follow up at the email you provided.");
      } catch (error) {
        showStatus(status, "error", "We could not send the application right now. Please email stay@mtcottages.com and we will help you directly.");
      } finally {
        if (submit) {
          submit.disabled = false;
          submit.removeAttribute("aria-busy");
        }
      }
    });
  });
})();
