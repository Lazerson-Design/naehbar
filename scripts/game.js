// Function to load an animation dynamically
function loadAnimation(path, loop = true, autoplay = true) {
  const container = document.getElementById("player");
  return lottie.loadAnimation({
    container: container, // Target div for the animation
    renderer: "svg", // Render as SVG
    loop: loop, // Loop the animation
    autoplay: autoplay, // Automatically play the animation
    path: path, // Path to your Bodymovin JSON file
  });
}

// Initialize variables for animations and state
let idleAnimation = null;
let runAnimation = null;
let isRunning = false;

//movement
function moveLeft() {
  const player = document.getElementById("player"); // Get the player element
  const currentLeft = parseFloat(window.getComputedStyle(player).left); // Get current 'left' in pixels
  player.style.left = currentLeft - 5 + "px"; // Subtract 1px and update
}

function moveRight() {
  const player = document.getElementById("player"); // Get the player element
  const currentLeft = parseFloat(window.getComputedStyle(player).left); // Get current 'left' in pixels
  player.style.left = currentLeft + 5 + "px"; // Add 1px and update
}

let keyState = { a: false, d: false }; // Track if A or D is pressed

function startGame() {
  const playerContainer = document.getElementById("player");

  // Function to switch animations
  function switchAnimation(animationType) {
    lottie.destroy(); // Stops and removes the current animation
    playerContainer.innerHTML = ""; // Clear the container for the new animation

    if (animationType === "run") {
      runAnimation = loadAnimation("public/run.json");
      runAnimation.goToAndPlay(0, true); // Start from the first frame
    } else if (animationType === "idle") {
      idleAnimation = loadAnimation("public/idle.json");
      idleAnimation.goToAndPlay(0, true); // Start from the first frame
    }
  }

  // Load the initial idle animation
  idleAnimation = loadAnimation("public/idle.json");

  // Event listener for key press
  document.addEventListener("keydown", (event) => {
    if (event.key === "a") {
      keyState.a = true; // Set A key state to true
      if (!isRunning) {
        isRunning = true;
        switchAnimation("run"); // Start run animation
      }
    } else if (event.key === "d") {
      keyState.d = true; // Set D key state to true
      if (!isRunning) {
        isRunning = true;
        switchAnimation("run"); // Start run animation
      }
    }
  });

  // Event listener for key release
  document.addEventListener("keyup", (event) => {
    if (event.key === "a") {
      keyState.a = false; // Set A key state to false
    } else if (event.key === "d") {
      keyState.d = false; // Set D key state to false
    }

    if (!keyState.a && !keyState.d) {
      isRunning = false; // Reset running state if no keys are pressed
      switchAnimation("idle"); // Switch back to idle animation
    }
  });

  // Game loop for continuous movement
  setInterval(() => {
    if (keyState.a) moveLeft(); // Move left if A is pressed
    if (keyState.d) moveRight(); // Move right if D is pressed
  }, 20); // Update every 20ms for smooth movement
}
