document.querySelectorAll("[data-learning-story]").forEach((story) => {
  const steps = Array.from(story.querySelectorAll("[data-story-step]"));
  const links = story.querySelectorAll("[data-story-link]");
  let framePending = false;

  function activate(step) {
    const active = step.dataset.storyStep;
    if (story.dataset.activeStep === active) return;

    story.dataset.activeStep = active;
    for (const link of links) {
      if (link.dataset.storyLink === active) link.setAttribute("aria-current", "step");
      else link.removeAttribute("aria-current");
    }
  }

  function update() {
    framePending = false;
    const last = steps.at(-1);
    const activeLine = parseFloat(getComputedStyle(steps[0]).scrollMarginTop) + 18;
    const atPageEnd = window.scrollY > 0 && Math.ceil(window.scrollY + window.innerHeight) >= document.documentElement.scrollHeight;
    const step = atPageEnd && last.getBoundingClientRect().bottom <= window.innerHeight
      ? last
      : steps.findLast((section) => section.getBoundingClientRect().top <= activeLine) ?? steps[0];
    activate(step);
  }

  function showStep(target) {
    const offset = parseFloat(getComputedStyle(target).scrollMarginTop);
    window.scrollTo({ top: window.scrollY + target.getBoundingClientRect().top - offset, behavior: "instant" });
    activate(target);
  }

  function alignLinkedStep() {
    const target = steps.find((step) => "#" + step.id === window.location.hash);
    if (target) showStep(target);
  }

  function requestUpdate() {
    if (framePending) return;
    framePending = true;
    requestAnimationFrame(update);
  }

  window.addEventListener("scroll", requestUpdate, { passive: true });
  window.addEventListener("resize", requestUpdate);
  window.addEventListener("hashchange", alignLinkedStep);
  window.addEventListener("load", alignLinkedStep, { once: true });
  for (const link of links) {
    link.addEventListener("click", (event) => {
      if (event.metaKey || event.ctrlKey || event.shiftKey || event.altKey) return;
      const target = steps.find((step) => step.dataset.storyStep === link.dataset.storyLink);
      event.preventDefault();
      if (window.location.hash !== link.hash) window.history.pushState(null, "", link.hash);
      target.focus({ preventScroll: true });
      showStep(target);
    });
  }
  update();
});
