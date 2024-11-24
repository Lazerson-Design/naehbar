// Initialize ScrollMagic Controller
const controller = new ScrollMagic.Controller();

// Initialize Lottie Animations
const animationElements = [
  { id: "a1", path: "public/anim1.json" },
  { id: "a2", path: "public/anim2.json" },
  { id: "a3", path: "public/anim3.json" },
  { id: "a4", path: "public/anim4.json" },
  { id: "a5", path: "public/anim5.json" },
  { id: "a6", path: "public/anim6.json" },
  { id: "a7", path: "public/anim7.json" },
];

const animations = [];

// Function to initialize Lottie animations
function initializeLottieAnimations(callback) {
  let loadedCount = 0;

  animationElements.forEach(({ id, path }, index) => {
    // Get the container element for this animation
    const elem = document.getElementById(id);

    if (!elem) {
      console.error(`Element with ID '${id}' not found.`);
      return;
    }

    // Initialize Lottie animation
    const anim = lottie.loadAnimation({
      container: elem,
      renderer: "svg",
      loop: false,
      autoplay: false,
      path: path,
    });

    // Wait for the animation data to be ready
    anim.addEventListener("DOMLoaded", function () {
      // Ensure totalFrames is available
      const checkFramesLoaded = setInterval(function () {
        if (anim.totalFrames > 0) {
          clearInterval(checkFramesLoaded);
          console.log(`Animation ${id} is ready.`);

          // Increment loaded count
          loadedCount++;

          // If all animations are loaded, call the callback
          if (loadedCount === animationElements.length) {
            if (callback && typeof callback === "function") {
              callback();
            }
          }
        }
      }, 100);
    });

    // Store the animation instance
    animations.push(anim);
  });
}

// Select all sections with the class "trigger"
const sections = document.querySelectorAll(".trigger");

// Array to store ScrollMagic scenes
const scenes = [];

// Array to store scene positions
const scenePositions = [];

// Array to store Lottie animation scenes
const lottieAnimationScenes = [];

// Function to calculate offset and duration based on viewport height
function calculateValues() {
  return {
    offsetInPixels: window.innerHeight * 0.5, // 50% of the viewport height
    durationInPixels: window.innerHeight * 0.4, // 40% of viewport height
  };
}

// Function to create ScrollMagic scenes
function createScenes() {
  // Get initial values
  const { offsetInPixels, durationInPixels } = calculateValues();

  // Loop through each section
  sections.forEach((section, index) => {
    // Skip the last section if needed
    if (index === sections.length - 1) return;

    console.log(`Creating pinning scene for section index: ${index}`);

    // Create a new ScrollMagic Scene
    const scene = new ScrollMagic.Scene({
      triggerElement: section,
      triggerHook: 0.5,
      duration: durationInPixels,
      offset: offsetInPixels,
    })
      .setPin(section)
      .on("enter", function () {
        section.style.zIndex = 14; // Ensure higher z-index during pin
      })
      .on("leave", function () {
        section.style.zIndex = ""; // Reset z-index after pin
      })
      //.addIndicators({ name: `Pin Section ${index}` }) // Remove this in production
      .addTo(controller);

    // Add the scene to the scenes array
    scenes.push(scene);
  });
}

// Function to update scenes on window resize
function updateScenes() {
  // Recalculate offset and duration
  const { offsetInPixels, durationInPixels } = calculateValues();

  // Update each scene
  scenes.forEach((scene) => {
    scene.offset(offsetInPixels);
    scene.duration(durationInPixels);
    scene.refresh();
  });
}

// Function to log start and end positions of each scene
function logScenePositions() {
  scenePositions.length = 0; // Clear previous positions
  scenes.forEach((scene, index) => {
    const startPosition = scene.scrollOffset(); // Start position of the scene
    const endPosition = startPosition + scene.duration(); // End position of the scene

    console.log(`startPinSection ${index} = ${startPosition}`);
    console.log(`endPinSection ${index} = ${endPosition}`);

    // Store positions in the array
    scenePositions.push({
      index: index,
      start: startPosition,
      end: endPosition,
    });
  });
}

// Function to create Lottie animation scenes
function createLottieAnimationScenes() {
  // Remove existing animation scenes
  lottieAnimationScenes.forEach((scene) => {
    scene.destroy(true); // Remove the scene from controller and nullify vars
  });
  lottieAnimationScenes.length = 0; // Clear the array

  // Ensure that we have calculated the scene positions
  if (scenePositions.length === 0) {
    console.error(
      "Scene positions are not calculated. Call logScenePositions() first."
    );
    return;
  }

  // Loop through the animations
  animations.forEach((anim, index) => {
    // For each animation, we need to get the start and end positions
    const prevScene = scenePositions[index]; // Scene corresponding to previous section
    const nextScene = scenePositions[index + 1]; // Scene corresponding to next section

    if (!prevScene || !nextScene) {
      console.warn(
        `Cannot create animation scene for animation ${index} due to missing scene positions.`
      );
      return;
    }

    const start = prevScene.end; // endPinSection of previous scene
    const end = nextScene.start; // startPinSection of next scene
    const duration = end - start;

    console.log(
      `Creating Lottie animation scene for animation ${index} from ${start} to ${end}`
    );

    // Create a ScrollMagic scene
    const animationScene = new ScrollMagic.Scene({
      triggerElement: null, // No trigger element, use global scroll position
      triggerHook: 0.5, // Start at scroll position equals offset
      duration: duration,
      offset: start, // Start position of the animation
    })
      .on("progress", function (event) {
        const progress = event.progress;
        anim.goToAndStop(progress * anim.totalFrames, true);

        // !!! --- Start of FadeOut Manipulation --- !!!
        const snapElements = document.querySelectorAll(".snap");
        if (snapElements[index]) {
          snapElements[index].style.opacity = Math.max(1 - progress * 3, 0); // progress * Geschwindigkeit
        }
        // !!! --- End of FadeOut Manipulation --- !!!

        // !!! --- Start of FadeIn Manipulation --- !!!
        const fadeInElements = document.querySelectorAll(".snap");
        if (fadeInElements[index + 1]) {
          fadeInElements[index + 1].style.opacity = Math.min(progress * 3, 1);
        }
        // !!! --- End of FadeIn Manipulation --- !!!
      })
      //.addIndicators({ name: `Animation ${index}` }) // For debugging; remove in production
      .addTo(controller);

    // Store the animation scene
    lottieAnimationScenes.push(animationScene);
  });
}

// Debounce function to optimize resize events
function debounce(func, wait) {
  let timeout;
  return function () {
    clearTimeout(timeout);
    timeout = setTimeout(func, wait);
  };
}

// Function to log and create Lottie animation scenes after scenes are created
function afterScenesCreated() {
  logScenePositions();
  createLottieAnimationScenes();
}

// Initialize ScrollMagic scenes
createScenes();

// Initialize Lottie animations and create animation scenes once loaded
initializeLottieAnimations(afterScenesCreated);

// Add event listener for window resize with debounced handler
window.addEventListener(
  "resize",
  debounce(() => {
    updateScenes();
    logScenePositions(); // Recalculate scene positions after updating scenes
    createLottieAnimationScenes(); // Recreate Lottie animation scenes
  }, 100)
);
/* new ScrollMagic.Scene({
   triggerElement: section, // Use the section as the trigger
   triggerHook: 0.8, // Trigger animation when the section is 80% in the viewport
   duration: 100, // Scroll duration for opacity transition
   // reverse: false Prevent the animation from reversing when scrolling up
 })
   .setTween(fadeInTween)
   .on("enter", () => {
     // Get the background color from the section's data attribute
     const newBgColor = section.getAttribute("data-bg-color");
     if (newBgColor) {
       const backgroundElement = document.querySelector(".background");
       backgroundElement.style.backgroundColor = newBgColor;
       console.log(`Background color changed to: ${newBgColor}`);
     }
   })
   //.addIndicators({ name: `Section ${index + 1}` }) // Debugging indicators (optional)
   .addTo(controller);

 // Create a tween to animate opacity from 1 to 0
 const fadeOutTween = gsap.to(section, {
   opacity: 0,
   ease: "none",
   immediateRender: false,
 });
 // Hide section
 new ScrollMagic.Scene({
   triggerElement: section, // Use the section as the trigger
   offset: 500, // Start animation slightly after entering the viewport
   triggerHook: 0.5, // Trigger animation slightly later than reveal
   duration: 100, // Scroll duration for opacity transition
 })
   .setTween(fadeOutTween)
   //.addIndicators({ name: `Section ${index + 1}` }) // Debugging indicators (optional)
   .addTo(controller);
*/
document.addEventListener("DOMContentLoaded", () => {
  // Select the hamburger button and navigation links
  const hamburger = document.querySelector(".hamburger");
  const navLinks = document.querySelector(".nav-links");
  const navItems = document.querySelectorAll(".nav-item");

  // Function to toggle the 'active' class on nav-links
  const toggleMenu = () => {
    navLinks.classList.toggle("active");
    if (navLinks.classList.contains("active")) {
      hamburger.setAttribute("aria-expanded", "true");
    } else {
      hamburger.setAttribute("aria-expanded", "false");
      hamburger.blur(); // Remove focus when menu is closed
    }
  };

  // Function to close the menu
  const closeMenu = () => {
    if (navLinks.classList.contains("active")) {
      navLinks.classList.remove("active");
      hamburger.setAttribute("aria-expanded", "false");
      hamburger.blur(); // Remove focus when menu is closed
    }
  };

  // Event listener for hamburger button click
  hamburger.addEventListener("click", toggleMenu);

  // Event listeners for each navigation link click
  navItems.forEach((item) => {
    item.addEventListener("click", closeMenu);
  });

  // Event listener for window scroll to close the menu
  window.addEventListener("scroll", closeMenu);

  // Event listener for clicking outside the menu to close it
  document.addEventListener("click", (event) => {
    // Check if the click is outside the hamburger and nav-links
    if (!hamburger.contains(event.target) && !navLinks.contains(event.target)) {
      closeMenu();
    }
  });

  // Optional: Close menu when pressing the 'Escape' key
  document.addEventListener("keydown", (event) => {
    if (event.key === "Escape") {
      closeMenu();
    }
  });
});

document.addEventListener("DOMContentLoaded", () => {
  const navbar = document.querySelector(".navbar");
  let lastScrollY = window.scrollY;
  let ticking = false;

  const handleScroll = () => {
    const currentScrollY = window.scrollY;

    // Always show navbar when at the top
    if (currentScrollY <= 0) {
      navbar.classList.remove("navbar--hidden");
    }
    // Scrolling Up - Show Navbar
    else if (currentScrollY < lastScrollY && currentScrollY > 0) {
      navbar.classList.remove("navbar--hidden");
    }
    // Scrolling Down - Hide Navbar
    else {
      navbar.classList.add("navbar--hidden");
    }

    lastScrollY = currentScrollY;
    ticking = false;
  };

  const onScroll = () => {
    if (!ticking) {
      window.requestAnimationFrame(handleScroll);
      ticking = true;
    }
  };

  // Function to determine if the screen is small
  const isSmallScreen = () => window.innerWidth <= 768;

  // Initial check to add or remove scroll listener
  if (isSmallScreen()) {
    window.addEventListener("scroll", onScroll);
  }

  // Listen for window resize to add/remove scroll listener dynamically
  window.addEventListener("resize", () => {
    if (isSmallScreen()) {
      window.addEventListener("scroll", onScroll);
    } else {
      window.removeEventListener("scroll", onScroll);
      navbar.classList.remove("navbar--hidden"); // Ensure navbar is visible on larger screens
    }
  });
});

/* function isMobileDevice() {
  return /Mobi|Android|iPhone|iPad|iPod|Windows Phone|BlackBerry|IEMobile|Opera Mini/i.test(
    navigator.userAgent
  );
}

// Check if it's a mobile device
if (isMobileDevice()) {
  // Activate existing media query styles by toggling the active class
  const hamburger = document.querySelector(".hamburger");
  const navLinks = document.querySelector(".nav-links");

  // Ensure the hamburger menu shows on mobile
  hamburger.style.display = "block";

  // Toggle navigation menu visibility on hamburger click
  hamburger.addEventListener("click", () => {
    navLinks.classList.toggle("active"); // Leverages .nav-links.active in your CSS
  });
} */
