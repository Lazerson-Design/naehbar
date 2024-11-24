// snapScroll.js

let isAnimating = false; // Flag to prevent multiple animations
let currentSectionIndex = 0; // Tracks the current active section
const sections = document.querySelectorAll(".snap"); // All sections with class 'snap'
const numSections = sections.length; // Total number of sections
const background = document.querySelector(".background"); // The fixed background div

const scrollDuration = 2000; // Duration for scroll animation in ms
const bgTransitionDuration = 500; // Duration for background transition in ms

// Set the initial background color based on the first section's data attribute
background.style.backgroundColor =
  sections[currentSectionIndex].dataset.bgColor;

// Listen for 'wheel' events to detect scroll actions
window.addEventListener(
  "wheel",
  function (e) {
    if (isAnimating) return; // If animating, do nothing

    e.preventDefault(); // Prevent default scroll behavior

    const deltaY = e.deltaY;
    if (deltaY > 0) {
      // Scroll down
      if (currentSectionIndex < numSections - 1) {
        currentSectionIndex++;
        scrollToSection(currentSectionIndex);
      }
    } else if (deltaY < 0) {
      // Scroll up
      if (currentSectionIndex > 0) {
        currentSectionIndex--;
        scrollToSection(currentSectionIndex);
      }
    }
  },
  { passive: false }
);

// Handle touch events for mobile devices
let touchStartY = null;

window.addEventListener("touchstart", function (e) {
  if (e.touches.length === 1) {
    touchStartY = e.touches[0].clientY; // Record the starting Y position
  }
});

window.addEventListener("touchend", function (e) {
  if (isAnimating || touchStartY === null) return;

  const touchEndY = e.changedTouches[0].clientY; // Record the ending Y position
  const deltaY = touchStartY - touchEndY; // Determine swipe direction

  if (deltaY > 50) {
    // Swipe up (scroll down)
    if (currentSectionIndex < numSections - 1) {
      currentSectionIndex++;
      scrollToSection(currentSectionIndex);
    }
  } else if (deltaY < -50) {
    // Swipe down (scroll up)
    if (currentSectionIndex > 0) {
      currentSectionIndex--;
      scrollToSection(currentSectionIndex);
    }
  }

  touchStartY = null; // Reset touch start position
});

// Function to scroll to a specific section
function scrollToSection(index) {
  isAnimating = true; // Set animating flag
  const currentSection = sections[currentSectionIndex]; // Current section
  const targetSection = sections[index]; // Target section
  const targetPosition = targetSection.offsetTop; // Get its vertical position

  // Fade out current section immediately
  fadeOut(currentSection);

  // Update background color with its own transition duration
  updateBackgroundColor(targetSection.dataset.bgColor, bgTransitionDuration);

  // Delay 500ms before fading in the next section and scrolling
  setTimeout(() => {
    // Scroll to the next section
    smoothScrollTo(targetPosition, 1500).then(() => {
      // Fade in the target section
      fadeIn(targetSection);

      isAnimating = false; // Reset animating flag
      currentSectionIndex = index; // Update the current section index
    });
  }, 500); // 500ms delay for the fade-in
}

function fadeOut(element) {
  element.classList.remove("visible");
  element.classList.add("hidden");
}

function fadeIn(element) {
  element.classList.remove("hidden");
  element.classList.add("visible");
}

// Function to update the background color with dynamic transition duration
function updateBackgroundColor(color, duration) {
  // Temporarily set the transition duration for the background
  background.style.transition = `background-color ${duration}ms ease-out`;

  // Change the background color
  background.style.backgroundColor = color;
}

// Function to smoothly scroll to a target position over a duration
function smoothScrollTo(targetPosition, duration) {
  return new Promise(function (resolve) {
    const startPosition = window.scrollY || document.documentElement.scrollTop; // Current scroll position
    const distance = targetPosition - startPosition; // Distance to scroll
    let startTime = null; // Animation start time

    // Easing function for smooth animation (easeInOutCubic)
    const easing = (t) =>
      t < 0.5 ? 4 * t * t * t : 1 - Math.pow(-2 * t + 2, 3) / 2;

    // Animation function called on each frame
    function animation(currentTime) {
      if (startTime === null) startTime = currentTime;
      const timeElapsed = currentTime - startTime;

      const progress = Math.min(timeElapsed / duration, 1);
      const ease = easing(progress);

      window.scrollTo(0, startPosition + distance * ease);

      if (timeElapsed < duration) {
        requestAnimationFrame(animation);
      } else {
        resolve(); // Resolve the promise when the animation is complete
      }
    }

    requestAnimationFrame(animation); // Start the animation
  });
}

// Optional: Update section index on manual scroll (e.g., using keyboard or scrollbar)
window.addEventListener("scroll", function () {
  if (isAnimating) return; // If animating, do nothing

  const scrollPosition = window.scrollY || document.documentElement.scrollTop;
  let closestSection = 0;
  let minDistance = Infinity;

  sections.forEach((section, index) => {
    const distance = Math.abs(section.offsetTop - scrollPosition);
    if (distance < minDistance) {
      minDistance = distance;
      closestSection = index;
    }
  });

  if (closestSection !== currentSectionIndex) {
    currentSectionIndex = closestSection;
    updateBackgroundColor(
      sections[currentSectionIndex].dataset.bgColor,
      bgTransitionDuration
    );
  }
});
