// /*Animations*/

// Variables for animations and state
let idleAnimation = null;
let runAnimation = null;
let jumpAnimation = null; // Add jump animation variable
let isRunning = false;
let isJumping = false; // Add jumping state
let deathAnimation = null;
let isDead = false; // Global flag for death state
let currentAnimation = null;
let activeEnemies = [];
let lastSpawnTime = 0;
let spawnInterval;
let awaitingKeyPress = false;

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

// Function to switch animations
function switchAnimation(animationType) {
  const playerContainer = document.getElementById("player");

  // Destroy only the current animation
  if (currentAnimation) {
    currentAnimation.destroy();
  }
  playerContainer.innerHTML = ""; // Clear the container for the new animation

  if (animationType === "run") {
    runAnimation = loadAnimation("public/run.json");
    runAnimation.goToAndPlay(0, true); // Start from the first frame
    currentAnimation = runAnimation; // Update current animation
    isRunning = true;
    isJumping = false; // Reset jumping state
  } else if (animationType === "idle") {
    idleAnimation = loadAnimation("public/idle.json");
    idleAnimation.goToAndPlay(0, true); // Start from the first frame
    currentAnimation = idleAnimation; // Update current animation
    isRunning = false;
    isJumping = false; // Reset jumping state
  } else if (animationType === "jump") {
    jumpAnimation = loadAnimation("public/jump.json", false); // No loop for jump
    jumpAnimation.goToAndPlay(0, true); // Start from the first frame
    currentAnimation = jumpAnimation; // Update current animation
    isJumping = true;
    isRunning = false;
  } else if (animationType === "death") {
    deathAnimation = loadAnimation("public/death.json", false); // no loop for death
    deathAnimation.goToAndPlay(0, true);
    currentAnimation = deathAnimation;
    isJumping = false;
    isRunning = false;
    // Add the event listener here, where deathAnimation is guaranteed to exist:
    deathAnimation.addEventListener("complete", () => {
      isDead = false; // Re-enable input after death animation completes
      awaitingKeyPress = true; // Now we wait for a key press before restarting
    });

    /* jumpAnimation.addEventListener("complete", () => {
      // Only switch to idle if still jumping and no keys are pressed
      if (isJumping && !Object.values(keyState).some((state) => state)) {
        isJumping = false;
        switchAnimation("idle");
      }
    }); */
  }
}

// Function to initialize animations
function initAnimations() {
  const playerContainer = document.getElementById("player");

  // Clear the container to prevent duplicate idle animations
  playerContainer.innerHTML = "";

  // Load the initial idle animation
  idleAnimation = loadAnimation("public/idle.json");
  idleAnimation.goToAndPlay(0, true); // Ensure it starts playing
  currentAnimation = idleAnimation; // Set as current animation
}

// Example event listeners for triggering animations
document.addEventListener("keydown", (event) => {
  if (event.code === "ArrowUp" && !isJumping) {
    // Trigger jump animation when the up arrow is pressed and not already jumping
    switchAnimation("jump");
  } else if (event.code === "ArrowRight" && !isJumping) {
    // Trigger run animation when the right arrow is pressed
    switchAnimation("run");
  } else if (event.code === "ArrowDown" && !isJumping) {
    // Trigger idle animation when the down arrow is pressed
    switchAnimation("idle");
  }
});

// /*GameArea and Background*/

// Store game area dimensions
let gameAreaWidth = 0;
let gameAreaHeight = 0;

// Movement and speed
let speedX = 0; // Horizontal speed based on game area width

// Function to initialize the game area
function initGameArea() {
  const gameArea = document.getElementById("gameArea");

  // Get dimensions of the game area
  gameAreaWidth = gameArea.offsetWidth;
  gameAreaHeight = gameArea.offsetHeight;

  // Set speedX dynamically as 1% of gameArea width
  speedX = gameAreaWidth * 0.01;

  // Initialize the floor
  initFloor();

  // Placeholder for background initialization
  initBackground();
}

//initiate Floor
function initFloor() {
  const floor = document.getElementById("floor");
  floorY = gameAreaHeight * 0.9; //adjust Floor here!
  floor.style.top = floorY + "px";
}

// Placeholder function for background initialization
function initBackground() {
  // Code to initialize the background
}

// /*Physics*/

// Physics variables
let gravity = 1; // Gravity acceleration
let gravitySpeed = 0; // Accumulated gravity speed
let playerY = 0; // Player's vertical position
let speedY = 0; // Player's vertical speed

// Function to initialize physics
function initPhysics() {
  const player = document.getElementById("player");
  playerY = parseFloat(window.getComputedStyle(player).top);

  // Start the physics update loop
  setInterval(updatePhysics, 20); // Update physics every 20ms
}

// Function to update player's position based on physics
function updatePhysics() {
  const player = document.getElementById("player");
  gravitySpeed += gravity; // Increase gravity speed
  playerY += speedY + gravitySpeed;

  // Collision detection with ground (assuming ground is at the bottom of game area)
  const groundY = floorY; // floorY is set in GameArea section (initiate Floor)
  if (playerY + player.offsetHeight / 2 >= groundY) {
    playerY = groundY - player.offsetHeight / 2;
    gravitySpeed = 0; // Reset gravity speed when on ground
    if (isJumping) {
      // Only proceed if the player was jumping
      isJumping = false; // Reset jumping state here

      // Check if any movement keys are currently pressed
      if (Object.values(keyState).some((state) => state)) {
        // Movement keys are pressed; switch to "run" animation
        if (!isRunning) {
          isRunning = true;
          switchAnimation("run");
        }
      } else {
        // No movement keys are pressed; switch to "idle" animation
        if (isRunning) {
          isRunning = false;
        }
        switchAnimation("idle");
      }
    }
  }
  // Update player's position
  player.style.top = playerY + "px";
}

// /*Controls*/

// Controls
const controls = {
  a: moveLeft, // A key triggers moveLeft
  d: moveRight, // D key triggers moveRight
  w: jump, // W key triggers jump
};

let keyState = {}; // Dynamically tracks key states

// Function to initialize controls
function initControls() {
  // Initialize keyState dynamically based on controls
  for (const key in controls) {
    keyState[key] = false; // Set all keys to false initially
  }

  // Event listener for key press
  document.addEventListener("keydown", (event) => {
    if (isDead) return; // If dead, ignore key presses
    if (awaitingKeyPress) {
      // The death animation finished and we're waiting for a key press
      // to restart the game loop and spawning.
      awaitingKeyPress = false;
      resetGame();
      return;
    }
    if (controls[event.key] !== undefined) {
      // Check if the key is mapped in controls
      if (event.key === "w" && !isJumping) {
        // Trigger jump only if not already jumping
        controls[event.key](); // Call the jump function directly
      } else if (event.key !== "w") {
        // For other keys, update key state
        keyState[event.key] = true;
        if (!isRunning && !isJumping) {
          isRunning = true;
          switchAnimation("run"); // Start run animation
        }
      }
    }
  });

  // Event listener for key release
  document.addEventListener("keyup", (event) => {
    if (isDead) return; // If dead, ignore key releases
    if (controls[event.key] !== undefined && event.key !== "w") {
      // Check if the key is mapped in controls and is not 'w' (jump key)
      keyState[event.key] = false; // Set key state to false
    }

    // Stop running animation when no keys are active and not jumping
    if (!Object.values(keyState).some((state) => state) && !isJumping) {
      isRunning = false;
      switchAnimation("idle"); // Switch back to idle animation
    }
  });

  // Movement loop
  setInterval(() => {
    for (const key in keyState) {
      if (keyState[key] && controls[key]) {
        controls[key](); // Trigger the movement function mapped to the key
      }
    }
  }, 20); // Adjust speed of movement by changing this interval (e.g., lower for faster)
}

// Movements
function moveLeft() {
  if (isDead) return; // Prevent any movement if isDead is true
  const player = document.getElementById("player"); // Get the player element
  const currentLeft = parseFloat(window.getComputedStyle(player).left); // Get current 'left' position
  // If jumping, move slower (half speed), else move at normal speed
  const speed = isJumping ? 5 : 15;
  player.style.left = currentLeft - speed + "px"; // Subtract 5px for movement to the left
  // Adjust speed of movement by changing "- 5" (e.g., use "- 10" for faster left movement)
}

function moveRight() {
  if (isDead) return; // Prevent any movement if isDead is true
  const player = document.getElementById("player"); // Get the player element
  const currentLeft = parseFloat(window.getComputedStyle(player).left); // Get current 'left' position
  // If jumping, move slower (half speed), else move at normal speed
  const speed = isJumping ? 5 : 15;
  player.style.left = currentLeft + speed + "px"; // Add 5px for movement to the right
  // Adjust speed of movement by changing "+ 5" (e.g., use "+ 10" for faster right movement)
}

// Jump function
function jump() {
  if (isJumping) return; // Prevent double jumps
  isJumping = true; // Set jumping state
  gravitySpeed = -25; // Initial upward speed (negative to go up)
  switchAnimation("jump"); // Switch to jump animation
}

// /*Particles and Collisions*/

// Torn variants
const tornEnemies = [
  "public/jackettorn.svg",
  "public/dress1torn.svg",
  "public/dress2torn.svg",
  "public/dress3torn.svg",
  "public/pants1torn.svg",
  "public/pants2torn.svg",
  "public/shirttorn.svg",
  "public/suit1torn.svg",
  "public/skirt1torn.svg",
];

// Crumpled variants
const crumEnemies = [
  "public/jacketcrum.svg",
  "public/dress1crum.svg",
  "public/dress2crum.svg",
  "public/dress3crum.svg",
  "public/pants1crum.svg",
  "public/pants2crum.svg",
  "public/shirtcrum.svg",
  "public/suit1crum.svg",
  "public/skirt1crum.svg",
];

// Long variants
const longEnemies = [
  "public/jacketlong.svg",
  "public/dress1long.svg",
  "public/dress2long.svg",
  "public/dress3long.svg",
  "public/pants1long.svg",
  "public/pants2long.svg",
  "public/shirtlong.svg",
  "public/suit1long.svg",
  "public/skirt1long.svg",
];

// Define probabilities for each pool
const tornProb = 0.5; // 50%
const crumProb = 0.3; // 30%
const longProb = 0.2; // 20%

function getRandomSpawnInterval(min, max) {
  return Math.floor(Math.random() * (max - min + 1)) + min;
}

/**
 * The main game loop, called every frame
 */
function gameLoop() {
  if (isDead) {
    // If isDead is true, return early and do not request another animation frame.
    return;
  }
  spawnEnemy(); // Attempt to spawn a new enemy if enough time has passed
  moveEnemies(); // Move all active enemies
  checkCollisions();
  requestAnimationFrame(gameLoop); // Request the next frame
}

function resetGame() {
  // Access activeEnemies here since it's globally defined now
  activeEnemies.forEach((enemyObj) => enemyObj.element.remove());
  activeEnemies.length = 0;
  lastSpawnTime = Date.now();
  spawnInterval = getRandomSpawnInterval(600, 1700);
  requestAnimationFrame(gameLoop);
}

// Function to spawn a new enemy if enough time has passed
function spawnEnemy() {
  const now = Date.now(); // Get the current time
  if (now - lastSpawnTime < spawnInterval) {
    // Not enough time has passed since the last spawn
    return;
  }

  // Update the last spawn time
  lastSpawnTime = now;

  // Update the spawn interval to a new random value
  spawnInterval = getRandomSpawnInterval(300, 1700);

  // Create a new enemy element
  const enemySrc = pickRandomEnemy(); // Select a random enemy from the pools
  const enemy = document.createElement("img"); // Create an <img> element
  enemy.src = enemySrc; // Set the image source
  enemy.style.position = "absolute"; // Position it absolutely
  enemy.style.width = "100px"; // Set a default width
  enemy.style.height = "auto"; // Maintain aspect ratio

  // After deciding enemySrc, also store its type:
  let enemyType;
  if (tornEnemies.includes(enemySrc)) {
    enemyType = "torn";
  } else if (crumEnemies.includes(enemySrc)) {
    enemyType = "crum";
  } else {
    enemyType = "long";
  }

  // Position the enemy off-screen to the right
  const gameArea = document.getElementById("gameArea");
  const enemyX = gameArea.offsetWidth + 100; // Initial X position off-screen

  // Random scale between 0.5 and 1.5
  const randomScale = Math.random() * (1.3 - 0.7) + 0.5; // Scale range: 0.5 to 1.5

  // Define margins to ensure enemies don't spawn too close to the top or bottom
  // Increasing these margins will keep enemies away from the edges.
  const topMargin = 200; // Margin from the top
  const bottomMargin = 200; // Margin from the bottom

  // Randomize the initial vertical placement within the game area height
  const gameAreaHeight = gameArea.offsetHeight;
  // Calculate available height by subtracting both margins
  const availableHeight = gameAreaHeight - topMargin - bottomMargin;
  // Now pick a random Y position within this constrained range
  const randomY = Math.floor(Math.random() * availableHeight) + topMargin;

  // IMPORTANT: We now incorporate randomY directly into the transform instead of using 'top'
  // This ensures vertical positioning is handled purely via transform.
  enemy.style.transform = `translate(${enemyX}px, ${randomY}px) scale(${randomScale})`;

  gameArea.appendChild(enemy); // Add the enemy to the game area

  // Determine wiggle parameters and speed factor based on enemy type
  let wiggleAmplitude = 0; // Default: no wiggle
  let wiggleFrequency = 0; // Default: no wiggle
  let speedFactor = 1; // Default speed (no slowdown)

  if (tornEnemies.includes(enemySrc)) {
    wiggleAmplitude = 50; // Torn enemies wiggle more
    wiggleFrequency = 0.5; // Frequency of wiggle
    speedFactor = 0.7; // Torn enemies move at 80% of normal speed (20% slower)
  } else if (longEnemies.includes(enemySrc)) {
    wiggleAmplitude = 10; // Long enemies wiggle less
    wiggleFrequency = 0.3; // Lower frequency
    speedFactor = 0.9; // Long enemies move at 50% of normal speed
  }
  // Crumpled enemies have default values (no wiggle, speedFactor = 1)

  activeEnemies.push({
    element: enemy,
    x: enemyX,
    y: randomY,
    wiggleAmplitude,
    wiggleFrequency,
    startTime: now,
    scale: randomScale,
    speedFactor, // Store the speed factor so it can be applied in moveEnemies()
    type: enemyType, // store the type of the enemy
  });
}

// Function to move enemies and handle their removal when off-screen
function moveEnemies() {
  if (isDead) {
    // If isDead is true, just return and don't move enemies
    return;
  }
  const baseEnemySpeed = 3; // Base horizontal speed

  for (let i = activeEnemies.length - 1; i >= 0; i--) {
    const enemyObj = activeEnemies[i];

    // Adjust speed by this enemy’s speed factor
    const enemySpeed = baseEnemySpeed * enemyObj.speedFactor;

    // Move enemy left
    enemyObj.x -= enemySpeed; // Reduce X position by the adjusted speed
    // Calculate wiggle offset using a sine wave
    let wiggleOffset = 0; // Default wiggle offset is zero (no vertical movement if wiggle=0)
    if (enemyObj.wiggleAmplitude > 0 && enemyObj.wiggleFrequency > 0) {
      const elapsedTime = Date.now() - enemyObj.startTime; // Time since spawn
      // wiggleProgress uses frequency and elapsed time to determine how far along in the sine wave we are
      const wiggleProgress =
        (elapsedTime / 1000) * enemyObj.wiggleFrequency * Math.PI * 2;
      wiggleOffset = Math.sin(wiggleProgress) * enemyObj.wiggleAmplitude; // Calculate wiggle based on sine wave
    }

    // Apply movement and wiggle
    // We now combine x (horizontal), y (vertical baseline) and wiggleOffset (vertical movement)
    // We also maintain the scale that was set at spawn.
    enemyObj.element.style.transform = `translate(${enemyObj.x}px, ${
      enemyObj.y + wiggleOffset
    }px) scale(${enemyObj.scale})`;

    // Remove enemy if it goes off-screen
    const enemyRect = enemyObj.element.getBoundingClientRect();
    if (enemyRect.right < 0) {
      enemyObj.element.remove(); // Remove the enemy from DOM
      activeEnemies.splice(i, 1); // Remove it from the activeEnemies array
    }
  }
}

function triggerDeath() {
  // Set a gameOver flag or isDead flag in your global scope:
  isDead = true;

  // Switch to death animation (assuming you have switchAnimation function):
  switchAnimation("death");
  // Disable character movement (e.g., remove event listeners or check gameOver flag in controls)
  // For example, if you have a global flag, your movement code can check `if (gameOver) return;`
}

// Collision detection
function checkCollisions() {
  //player HITBOX
  //---------------------------------------------------------------
  const playerRect = player.getBoundingClientRect();
  // Define separate shrink factors
  const shrinkFactorWidth = 0.95; // reduce width by 95% (keep 5%)
  const shrinkFactorHeight = 0.1; // reduce height by 10% (keep 90%)

  const newWidth = playerRect.width * (1 - shrinkFactorWidth);
  const newHeight = playerRect.height * (1 - shrinkFactorHeight);

  // Calculate how much to move each side inward
  // For width: the total reduction is playerRect.width * shrinkFactorWidth
  // Half of that for each side (left and right):
  const horizontalInset = (playerRect.width - newWidth) / 2;

  // For height: the total reduction is playerRect.height * shrinkFactorHeight
  // Half of that for each side (top and bottom):
  const verticalInset = (playerRect.height - newHeight) / 2;

  const playerHitbox = {
    left: playerRect.left + horizontalInset,
    right: playerRect.right - horizontalInset,
    top: playerRect.top + verticalInset,
    bottom: playerRect.bottom - verticalInset,
  };
  //--------------------------------------------------------------------------------------

  // Loop through all active enemies and calculate their hitboxes inside this loop
  for (const enemyObj of activeEnemies) {
    //Enemy HITBOX
    //---------------------------------------------------------------------------------------
    const enemyRect = enemyObj.element.getBoundingClientRect();
    const enemyShrinkFactor = 0.5; // Reduce both width and height by 50%

    const enemyNewWidth = enemyRect.width * (1 - enemyShrinkFactor); // enemyRect.width * 0.5
    const enemyNewHeight = enemyRect.height * (1 - enemyShrinkFactor); // enemyRect.height * 0.5

    // Calculate how much to move each side inward to keep it centered
    const enemyHorizontalInset = (enemyRect.width - enemyNewWidth) / 2;
    const enemyVerticalInset = (enemyRect.height - enemyNewHeight) / 2;

    const enemyHitbox = {
      left: enemyRect.left + enemyHorizontalInset,
      right: enemyRect.right - enemyHorizontalInset,
      top: enemyRect.top + enemyVerticalInset,
      bottom: enemyRect.bottom - enemyVerticalInset,
    };
    //-----------------------------------------------------------------------------------------------

    /*   const hitboxDebug = document.getElementById("hitbox-debug");
    hitboxDebug.style.left = playerHitbox.left + "px";
    hitboxDebug.style.top = playerHitbox.top + "px";
    hitboxDebug.style.width = playerHitbox.right - playerHitbox.left + "px";
    hitboxDebug.style.height = playerHitbox.bottom - playerHitbox.top + "px";
    */

    // Perform collision check using adjusted hitboxes
    if (
      playerHitbox.left < enemyHitbox.right &&
      playerHitbox.right > enemyHitbox.left &&
      playerHitbox.top < enemyHitbox.bottom &&
      playerHitbox.bottom > enemyHitbox.top
    ) {
      console.log("Collision detected!");
      console.log("Collided with:", enemyObj.type); // Log the type of enemy collided
      triggerDeath();
      break;
    }
  }
}

function pickRandomEnemy() {
  const rand = Math.random();
  let chosenPool;
  if (rand < tornProb) {
    chosenPool = tornEnemies;
  } else if (rand < tornProb + crumProb) {
    chosenPool = crumEnemies;
  } else {
    chosenPool = longEnemies;
  }

  // Pick a random element from the chosen pool
  const enemyIndex = Math.floor(Math.random() * chosenPool.length);
  return chosenPool[enemyIndex];
}
// Placeholder for particles and collision detection
function initParticlesAndCollisions() {
  // ----------------------------------------
  // Manage enemy spawning and movement
  // ----------------------------------------

  /**
   * Function to generate a random interval between min and max (inclusive)
   * @param {number} min - Minimum interval in milliseconds
   * @param {number} max - Maximum interval in milliseconds
   * @returns {number} - Random interval within the range
   */

  /**
   * Function to pick a random enemy from the pools according to defined probabilities
   * @returns {string} - Path to the randomly selected enemy image
   */

  // Start the continuous game loop
  requestAnimationFrame(gameLoop);
}

// /*Game HUD*/

// Placeholder for Game Heads-Up Display
function initGameHUD() {
  // Initialize game HUD elements
}

// /*Score and Highscores*/

// Placeholder for score tracking and high scores
function initScoreAndHighscores() {
  // Initialize score tracking and high score management
}

// Placeholder functions for loading animation
function showLoadingAnimation() {
  // Code to display a loading animation or screen
}

function hideLoadingAnimation() {
  // Code to hide the loading animation or screen
}

// Main function startGame
function startGame() {
  /* console.log("startGame called"); */
  // Placeholder for loading animation
  showLoadingAnimation();

  // Initialize game components
  initGameArea();
  initPhysics();
  initAnimations();
  initControls();
  initParticlesAndCollisions();
  initGameHUD();
  initScoreAndHighscores();

  // Hide loading animation when initialization is complete
  hideLoadingAnimation();
}

// Call startGame to initialize everything
/* startGame(); */
