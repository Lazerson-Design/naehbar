window.addEventListener("DOMContentLoaded", (event) => {
  const controller = new ScrollMagic.Controller();
  const elem = document.getElementById("bm");

  // Initialize Lottie Animation
  const anim = lottie.loadAnimation({
    container: elem,
    renderer: "svg",
    loop: false,
    autoplay: false,
    path: "../naebarfullrestransU.json",
  });

  // Define frame ranges for each animation segment
  const frameRanges = [
    { start: 0, end: 70 },
    { start: 70, end: 126 },
    { start: 126, end: 185 },
    { start: 185, end: 256 },
    { start: 256, end: 310 },
    { start: 310, end: 368 },
    { start: 368, end: 467 },
  ];

  // Create a ScrollMagic scene and GSAP tween for each animation segment
  frameRanges.forEach((range, index) => {
    const obj = { frame: range.start };

    const tween = gsap.to(obj, {
      frame: range.end,
      ease: "none",
      onUpdate: function () {
        anim.goToAndStop(Math.round(obj.frame), true);
      },
    });

    new ScrollMagic.Scene({
      triggerElement: `#animation-trigger-${index + 1}`,
      duration: 400, // Adjust duration to match the height of your trigger divs
      triggerHook: 1, // Start animation when trigger hits the top of the viewport
      offset: 1,
    })
      .setTween(tween)
      .on("enter", () => {
        // Update the z-index when entering the scene
        const newZIndex = 2 + index;
        const overlayElement = document.querySelector(".lottie-overlay");
        overlayElement.style.zIndex = newZIndex;

        // Log the current z-index
        console.log(`Current z-index of .lottie-overlay: ${newZIndex}`);
      })

      //.addIndicators({ name: `Animation ${index + 1}` }) // Uncomment for debugging
      .addTo(controller);
  });
});
