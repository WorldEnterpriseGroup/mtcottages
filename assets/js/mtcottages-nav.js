(function () {
  'use strict';

  function closeDesktopMenus(except) {
    document.querySelectorAll('[data-mtc-mega-details][open]').forEach(function (menu) {
      if (menu !== except) menu.removeAttribute('open');
    });
  }

  function initialiseNavigation() {
    var mobileToggle = document.querySelector('[data-mtc-mobile-toggle]');
    var mobileDrawer = document.querySelector('[data-mtc-mobile-drawer]');

    if (mobileToggle && mobileDrawer) {
      mobileDrawer.hidden = true;
      mobileToggle.addEventListener('click', function () {
        var expanded = mobileToggle.getAttribute('aria-expanded') === 'true';
        mobileToggle.setAttribute('aria-expanded', String(!expanded));
        mobileDrawer.hidden = expanded;
        document.body.classList.toggle('mtc-mobile-nav-open', !expanded);
      });

      mobileDrawer.addEventListener('click', function (event) {
        if (event.target.closest('a')) {
          mobileToggle.setAttribute('aria-expanded', 'false');
          mobileDrawer.hidden = true;
          document.body.classList.remove('mtc-mobile-nav-open');
        }
      });
    }

    document.querySelectorAll('[data-mtc-mega-details]').forEach(function (menu) {
      menu.addEventListener('toggle', function () {
        if (menu.open) closeDesktopMenus(menu);
      });
    });

    document.addEventListener('click', function (event) {
      if (!event.target.closest('[data-mtc-mega-details]')) closeDesktopMenus();
    });

    document.addEventListener('keydown', function (event) {
      if (event.key !== 'Escape') return;

      closeDesktopMenus();
      if (mobileToggle && mobileDrawer && mobileToggle.getAttribute('aria-expanded') === 'true') {
        mobileToggle.setAttribute('aria-expanded', 'false');
        mobileDrawer.hidden = true;
        document.body.classList.remove('mtc-mobile-nav-open');
        mobileToggle.focus();
      }
    });
  }

  if (document.readyState === 'loading') {
    document.addEventListener('DOMContentLoaded', initialiseNavigation);
  } else {
    initialiseNavigation();
  }
}());
