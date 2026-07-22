// AOS animation
if (window.AOS) {
  AOS.init();
}

// Scroll progress control. Some compact pages intentionally omit it.
const scrollProgress = document.getElementById("progress");
const progressValue = document.getElementById("progress-value");

const scrollPercentage = () => {
  if (!scrollProgress || !progressValue) return;
  let pos = document.documentElement.scrollTop;
  let calcHeight =
    document.documentElement.scrollHeight -
    document.documentElement.clientHeight;
  let scrollValue = calcHeight > 0 ? Math.round((pos * 100) / calcHeight) : 0;

  scrollProgress.style.background = `conic-gradient(#6E7C6B ${scrollValue}%, #52614e75 ${scrollValue}%)`;
  progressValue.textContent = `${scrollValue}%`;

  if (pos > 20) {
    scrollProgress.classList.remove("hide");
    scrollProgress.classList.add("show");
  } else {
    scrollProgress.classList.remove("show");
    scrollProgress.classList.add("hide");
  }

};

if (scrollProgress && progressValue) {
  scrollProgress.addEventListener("click", () => {
    window.scrollTo({ top: 0, behavior: "smooth" });
  });
  window.addEventListener("scroll", scrollPercentage, { passive: true });
  window.addEventListener("load", scrollPercentage);
}
