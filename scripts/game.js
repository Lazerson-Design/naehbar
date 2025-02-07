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
let currentWeapon = null; // "needle", "scissors", or "iron"
let ironSpeed = 0; // We'll update this later
let enemiesPassed = 0; // global variable for enemies passing the player
let sewedCount = 0; //needle + torn
let cutCount = 0; // scissors + long
let ironedCount = 0; // iron + scrum
// Global variables for weapon pickups and ammo counts:
let activeWeapons = [];
let lastWeaponSpawnTime = 0;
let weaponSpawnInterval = 3000; // e.g., spawn a weapon every 3 seconds (adjust as desired)
// Global ammo counts:
let ammoCounts = {
  needle: 0,
  scissors: 0,
  iron: 0,
};

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

  if (currentAnimation) {
    currentAnimation.destroy();
  }
  playerContainer.innerHTML = "";

  let animPath = "";
  let weaponLetter = "";

  // Build animation path as before...
  if (currentWeapon) {
    if (currentWeapon === "needle") {
      weaponLetter = "N";
    } else if (currentWeapon === "scissors") {
      weaponLetter = "S";
    } else if (currentWeapon === "iron") {
      weaponLetter = "I";
    }

    if (animationType === "idle") {
      animPath = `../public/idle${weaponLetter}.json`;
    } else if (animationType === "run") {
      animPath = `../public/run${weaponLetter}.json`;
    } else if (animationType === "jump") {
      animPath = `../public/jump${weaponLetter}.json`;
    } else if (animationType === "death") {
      animPath = `../public/death${weaponLetter}.json`;
    }
  } else {
    if (animationType === "idle") {
      animPath = "../public/idle.json";
    } else if (animationType === "run") {
      animPath = "../public/run.json";
    } else if (animationType === "jump") {
      animPath = "../public/jump.json";
    } else if (animationType === "death") {
      animPath = "../public/death.json";
    }
  }

  let anim;
  if (animationType === "jump" || animationType === "death") {
    anim = loadAnimation(animPath, false);
  } else {
    anim = loadAnimation(animPath, true);
  }
  anim.goToAndPlay(0, true);
  currentAnimation = anim;

  // Apply the specific scale for this animation type and weapon combination
  const scale = currentWeapon
    ? animationScales[animationType][currentWeapon]
    : animationScales[animationType].unarmed;

  adjustPlayerScale(scale);

  // Update state flags.
  if (animationType === "run") {
    isRunning = true;
    isJumping = false;
  } else if (animationType === "idle") {
    isRunning = false;
    isJumping = false;
  } else if (animationType === "jump") {
    isJumping = true;
    isRunning = false;
  } else if (animationType === "death") {
    isJumping = false;
    isRunning = false;
    anim.addEventListener("complete", () => {
      isDead = false;
      awaitingKeyPress = true;
      for (const key in keyState) {
        keyState[key] = false;
      }
    });
  }

  /*  // Apply a scale adjustment based on whether a weapon is equipped.
  if (currentWeapon) {
    adjustPlayerScale(weaponScales[currentWeapon] || 1.0);
  } else {
    adjustPlayerScale(weaponScales.unarmed);
  } */
}

// Function to initialize animations
function initAnimations() {
  const playerContainer = document.getElementById("player");

  // Clear the container to prevent duplicate idle animations
  playerContainer.innerHTML = "";

  // Load the initial idle animation
  idleAnimation = loadAnimation("../public/idle.json");
  idleAnimation.goToAndPlay(0, true); // Ensure it starts playing
  currentAnimation = idleAnimation; // Set as current animation
}

function getCollisionOverlay() {
  let overlay = document.getElementById("collision-overlay");
  if (!overlay) {
    overlay = document.createElement("div");
    overlay.id = "collision-overlay";
    overlay.style.position = "absolute";
    // We no longer set top/left here; they will be updated in playCollisionOverlay.
    overlay.style.width = "100%"; // or a specific size if desired
    overlay.style.height = "30vh"; // adjust as needed
    overlay.style.pointerEvents = "none";
    const gameArea = document.getElementById("gameArea");
    if (gameArea) {
      gameArea.appendChild(overlay);
    } else {
      document.body.appendChild(overlay);
    }
  }
  return overlay;
}

function playCollisionOverlay(type, collisionPoint) {
  // Get the game area container and its bounding rectangle.
  const gameArea = document.getElementById("gameArea");
  const gameAreaRect = gameArea.getBoundingClientRect();

  // Get (or create) the overlay element.
  let overlay = document.getElementById("collision-overlay");
  if (!overlay) {
    overlay = document.createElement("div");
    overlay.id = "collision-overlay";
    overlay.style.position = "absolute";
    overlay.style.pointerEvents = "none";
    // Append the overlay to the game area.
    gameArea.appendChild(overlay);
  }

  // Compute the collision point relative to the game area.
  // collisionPoint is assumed to be an object with absolute coordinates {x, y}
  const relX = collisionPoint.x - gameAreaRect.left;
  const relY = collisionPoint.y - gameAreaRect.top;

  // Set the overlay's position relative to the game area.
  overlay.style.left = relX + "px";
  overlay.style.top = relY + "px";

  // Adjust the overlay size relative to the game area.
  // For example, if you want the overlay to be 10% of the game area height:
  overlay.style.width = gameAreaRect.width * 0.1 + "px";
  overlay.style.height = gameAreaRect.height * 0.1 + "px";

  // Clear any previous content.
  overlay.innerHTML = "";

  // Determine the animation file path based on the collision type.
  let animPath = "";
  if (type === "yarn") {
    animPath = "../public/yarn.json";
  } else if (type === "steam") {
    animPath = "../public/short.json";
  } else if (type === "short") {
    animPath = "../public/steam.json";
  }

  // Load the overlay animation using Lottie.
  const overlayAnimation = lottie.loadAnimation({
    container: overlay,
    renderer: "svg",
    loop: false,
    autoplay: true,
    path: animPath,
  });

  // When the overlay animation completes, clear its content so it disappears.
  overlayAnimation.addEventListener("complete", () => {
    overlay.innerHTML = "";
  });
}

// /*GameArea and Background*/

// Store game area dimensions
let gameAreaWidth = 0;
let gameAreaHeight = 0;
let floorY = 0; // Floor position

// Function to initialize the game area
function initGameArea() {
  const gameArea = document.getElementById("gameArea");

  // Get dimensions of the game area
  gameAreaWidth = gameArea.offsetWidth;
  gameAreaHeight = gameArea.offsetHeight;

  // Now update ironSpeed based on the new gameAreaHeight
  ironSpeed = gameAreaHeight * 0.005;

  // Initialize the floor
  initFloor();

  // Placeholder for background initialization
  initBackground();
}

// Initialize Floor
function initFloor() {
  const floor = document.getElementById("floor");
  floorY = gameAreaHeight * 0.9; // Floor at 90% of game area height
  floor.style.top = floorY + "px";
}

// Placeholder function for background initialization
function initBackground() {
  // Code to initialize the background
}

function adjustPlayerScale(scale) {
  const player = document.getElementById("player");
  // Apply both centering and scaling
  player.style.transform = `translate(-50%, -50%) scale(${scale})`;
}

const animationScales = {
  idle: {
    needle: 1.4,
    scissors: 1.4,
    iron: 1.7,
    unarmed: 1.0,
  },
  run: {
    needle: 2, // Adjust these values based on testing
    scissors: 1.6,
    iron: 2.2,
    unarmed: 1.0,
  },
  jump: {
    needle: 2, // Adjust these values based on testing
    scissors: 2,
    iron: 1.9,
    unarmed: 1.0,
  },
  death: {
    needle: 1.4, // Adjust these values based on testing
    scissors: 1.4,
    iron: 1.6,
    unarmed: 1.0,
  },
};

// Player (red) hitbox configurations by state and weapon type
const playerHitboxConfigurations = {
  idle: {
    unarmed: {
      width: 0.3, // 30% of player width
      height: 0.95, // 80% of player height
      offsetX: 0, // no offset
      offsetY: 0,
    },
    needle: {
      width: 0.25,
      height: 0.68,
      offsetX: -0.025, // shift 10% of player width to right
      offsetY: 0,
    },
    scissors: {
      width: 0.25,
      height: 0.68,
      offsetX: -0.025,
      offsetY: 0,
    },
    iron: {
      width: 0.2,
      height: 0.6,
      offsetX: -0.165, // shift left 5% of player width
      offsetY: -0.065,
    },
  },
  run: {
    unarmed: {
      width: 0.3,
      height: 0.85,
      offsetX: 0.1,
      offsetY: 0,
    },
    needle: {
      width: 0.18,
      height: 0.45,
      offsetX: -0.025,
      offsetY: 0.01,
    },
    scissors: {
      width: 0.18,
      height: 0.53,
      offsetX: -0.02,
      offsetY: 0.01,
    },
    iron: {
      width: 0.2,
      height: 0.4,
      offsetX: -0.05,
      offsetY: -0.26,
    },
  },
  jump: {
    unarmed: {
      width: 0.3,
      height: 0.7,
      offsetX: 0.1,
      offsetY: -0.1,
    },
    needle: {
      width: 0.25,
      height: 0.4,
      offsetX: 0,
      offsetY: 0,
    },
    scissors: {
      width: 0.16,
      height: 0.4,
      offsetX: 0.04,
      offsetY: -0.03,
    },
    iron: {
      width: 0.2,
      height: 0.4,
      offsetX: -0.17,
      offsetY: -0.26,
    },
  },
};

// Weapon (blue) hitbox configurations for each animation state and weapon type.
// All values are expressed as fractions of the player's current width/height.
const weaponHitboxConfigurations = {
  idle: {
    // When the player is idle and has the needle equipped:
    needle: {
      width: 0.35, // The weapon hitbox's width will equal 100% of the player's width.
      height: 0.1, // The weapon hitbox's height will be 20% of the player's height.
      offsetX: 0.55, // The hitbox will start at 100% of the player's width (i.e. at the right edge).
      offsetY: 0.15, // The hitbox is positioned at 95% down from the top of the player's area.
    },
    scissors: {
      width: 0.2, // 25% of the player's width.
      height: 0.15, // 25% of the player's height.
      offsetX: 0.75, // The hitbox starts at 12% of the player's width from the left edge.
      offsetY: 0.35, // The hitbox is shifted upward by 5% of the player's height.
    },
    iron: {
      width: 0.45, // 30% of the player's width.
      height: 0.4, // 30% of the player's height.
      offsetX: 0.45, // The hitbox starts 15% of the player's width from the left edge.
      offsetY: 0.46, // The hitbox is shifted upward by 10% of the player's height.
    },
  },
  run: {
    needle: {
      width: 0.4,
      height: 0.02,
      offsetX: 0.56,
      offsetY: 0.49,
    },
    scissors: {
      width: 0.4,
      height: 0.1,
      offsetX: 0.54,
      offsetY: 0.47,
    },
    iron: {
      width: 0.36,
      height: 0.3,
      offsetX: 0.46,
      offsetY: 0.3,
    },
  },
  jump: {
    needle: {
      width: 0.3,
      height: 0.05,
      offsetX: 0.65,
      offsetY: 0.45,
    },
    scissors: {
      width: 0.4,
      height: 0.1,
      offsetX: 0.49,
      offsetY: 0.41,
    },
    iron: {
      width: 0.36,
      height: 0.3,
      offsetX: 0.48,
      offsetY: 0.35,
    },
  },
};

// /*Physics*/

// Physics variables
let gravity = 0; // Gravity acceleration (will be set based on gameAreaHeight)
let gravitySpeed = 0; // Accumulated gravity speed
let playerY = 0; // Player's vertical position
let speedY = 0; // Player's vertical speed (unused currently)

// Function to initialize physics
function initPhysics() {
  const player = document.getElementById("player");
  playerY = parseFloat(window.getComputedStyle(player).top);
  gravity = gameAreaHeight * 0.002; // Set gravity relative to game area height

  // Start the physics update loop
  setInterval(updatePhysics, 20); // Update physics every 20ms
}

// Function to update player's position based on physics
function updatePhysics() {
  const player = document.getElementById("player");
  gravitySpeed += gravity; // Increase gravity speed
  playerY += speedY + gravitySpeed;

  // Collision detection with ground (assuming ground is at the bottom of game area)
  const groundY = floorY; // floorY is set in initFloor
  if (playerY + player.offsetHeight / 2 >= groundY) {
    playerY = groundY - player.offsetHeight / 2;
    gravitySpeed = 0; // Reset gravity speed when on ground
    if (isJumping) {
      // Only proceed if the player was jumping
      isJumping = false; // Reset jumping state

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

// Controls mapped to keys (using 'a', 'd', and 'w')
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
    if (isDead) return;
    if (awaitingKeyPress) {
      awaitingKeyPress = false;
      resetGame();
      return;
    }

    // Handle movement keys (a, d, w) first.
    if (controls[event.key] !== undefined) {
      if (event.key === "w" && !isJumping) {
        controls[event.key]();
      } else if (event.key !== "w") {
        keyState[event.key] = true;
        // Only switch to run if no weapon is active.
        if (!isRunning && !isJumping) {
          isRunning = true;
          switchAnimation("run");
        }
      }
    }

    // Weapon keys (1, 2, 3)
    if (event.key === "1") {
      switchWeapon("needle");
    } else if (event.key === "2") {
      switchWeapon("scissors");
    } else if (event.key === "3") {
      switchWeapon("iron");
    }
  });

  // Event listener for key release
  document.addEventListener("keyup", (event) => {
    if (isDead) return;
    if (controls[event.key] !== undefined && event.key !== "w") {
      keyState[event.key] = false;
    }

    // Switch to idle if no movement keys are active and not jumping.
    if (!Object.values(keyState).some((state) => state) && !isJumping) {
      isRunning = false;
      switchAnimation("idle");
    }
  });

  // Movement loop
  setInterval(() => {
    for (const key in keyState) {
      if (keyState[key] && controls[key]) {
        controls[key](); // Trigger the movement function mapped to the key
      }
    }
  }, 20); // Adjust speed of movement by changing this interval
}

// Movements
function moveLeft() {
  if (isDead) return;
  const player = document.getElementById("player");
  const currentLeft = parseFloat(window.getComputedStyle(player).left);
  // Movement speed relative to game area width
  const speed = isJumping ? gameAreaHeight * 0.008 : gameAreaHeight * 0.02; //Geschwindigkeit in der luft oder auf dem boden
  let newLeft = currentLeft - speed;
  if (newLeft < 0) {
    newLeft = 0;
  }
  player.style.left = newLeft + "px";
}

function moveRight() {
  if (isDead) return;
  const player = document.getElementById("player");
  const currentLeft = parseFloat(window.getComputedStyle(player).left);
  // Movement speed relative to game area width
  const speed = isJumping ? gameAreaHeight * 0.008 : gameAreaHeight * 0.02; //Geschwindigkeit in der luft oder auf dem boden
  let newLeft = currentLeft + speed;
  const playerWidth = player.offsetWidth;
  if (newLeft + playerWidth > gameAreaWidth) {
    newLeft = gameAreaWidth - playerWidth;
  }
  player.style.left = newLeft + "px";
}

function jump() {
  if (isJumping) return;
  isJumping = true;

  // Set the desired maximum jump height (20% of gameAreaHeight)
  const desiredJumpHeight = gameAreaHeight * 0.7;

  // Use the gravity value (set in initPhysics) and the physics formula:
  // v = sqrt(2 * gravity * desiredJumpHeight)
  const initialJumpSpeed = Math.sqrt(2 * gravity * desiredJumpHeight);

  // Set the upward speed (negative because upward is negative)
  gravitySpeed = -initialJumpSpeed;

  switchAnimation("jump");
}

function switchWeapon(weapon) {
  if (currentWeapon === weapon) {
    // Weapon is already active; deselect it.
    currentWeapon = null;
    console.log(`${weapon} deselected, switching to idle`);
    switchAnimation("idle");
  } else {
    // Equip the new weapon.
    currentWeapon = weapon;
    console.log(`${weapon} is equipped`);
    // For now, default to the idle state for the equipped weapon.
    switchAnimation("idle");
  }
}

// /*Particles and Collisions*/

// repaired variants
const repairedEnemies = [
  "../public/jacket.svg",
  "../public/dress1.svg",
  "../public/dress2.svg",
  "../public/dress3.svg",
  "../public/pants1.svg",
  "../public/pants2.svg",
  "../public/shirt.svg",
  "../public/suit1.svg",
  "../public/skirt1.svg",
];

// Torn variants
const tornEnemies = [
  "../public/jackettorn.svg",
  "../public/dress1torn.svg",
  "../public/dress2torn.svg",
  "../public/dress3torn.svg",
  "../public/pants1torn.svg",
  "../public/pants2torn.svg",
  "../public/shirttorn.svg",
  "../public/suit1torn.svg",
  "../public/skirt1torn.svg",
];

// Crumpled variants
const crumEnemies = [
  "../public/jacketcrum.svg",
  "../public/dress1crum.svg",
  "../public/dress2crum.svg",
  "../public/dress3crum.svg",
  "../public/pants1crum.svg",
  "../public/pants2crum.svg",
  "../public/shirtcrum.svg",
  "../public/suit1crum.svg",
  "../public/skirt1crum.svg",
];

// Long variants
const longEnemies = [
  "../public/jacketlong.svg",
  "../public/dress1long.svg",
  "../public/dress2long.svg",
  "../public/dress3long.svg",
  "../public/pants1long.svg",
  "../public/pants2long.svg",
  "../public/shirtlong.svg",
  "../public/suit1long.svg",
  "../public/skirt1long.svg",
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
  if (isDead) return;
  spawnEnemy();
  spawnWeapon(); // spawn pickups
  moveEnemies();
  moveWeapons(); // update pickups movement
  checkCollisions();
  checkWeaponPickups(); // check for pickups
  requestAnimationFrame(gameLoop);
}

function resetGame() {
  currentWeapon = null; // Unarm the player on respawn
  activeEnemies.forEach((enemyObj) => {
    if (enemyObj.debugDiv) {
      enemyObj.debugDiv.remove(); // Remove the enemy's debug element
    }
    enemyObj.element.remove();
  });
  activeEnemies.length = 0;
  lastSpawnTime = Date.now();
  spawnInterval = getRandomSpawnInterval(600, 1700);

  // Optionally clear any global debug elements
  clearDebugHitboxes();

  requestAnimationFrame(gameLoop);
}

// Function to spawn a new enemy if enough time has passed
function spawnEnemy() {
  const now = Date.now();
  if (now - lastSpawnTime < spawnInterval) {
    return;
  }
  lastSpawnTime = now;
  spawnInterval = getRandomSpawnInterval(400, 1700);

  const enemySrc = pickRandomEnemy();
  const enemy = document.createElement("img");
  enemy.src = enemySrc;
  enemy.style.position = "absolute";

  // Set enemy width relative to game area width (e.g., 10% of game area width)
  const enemyWidth = gameAreaHeight * 0.1; // enemy will be 10% of game area height
  enemy.style.width = enemyWidth + "px";
  enemy.style.height = "auto";

  // Determine enemy type based on source
  let enemyType;
  if (tornEnemies.includes(enemySrc)) {
    enemyType = "torn";
  } else if (crumEnemies.includes(enemySrc)) {
    enemyType = "crum";
  } else {
    enemyType = "long";
  }

  const gameArea = document.getElementById("gameArea");
  // Spawn enemy off-screen to the right (10% beyond game area width)
  const enemyX = gameAreaWidth * 1.1;

  // Random scale between 0.5 and 1.5
  const randomScale = Math.random() * (1.5 - 0.5) + 0.8;

  // Define margins as percentages of game area height
  const topMargin = gameAreaHeight * 0.2;
  const bottomMargin = gameAreaHeight * 0.2;
  const availableHeight = gameAreaHeight - topMargin - bottomMargin;
  const randomY = Math.floor(Math.random() * availableHeight) + topMargin;

  // Position the enemy using transform for relative positioning
  enemy.style.transform = `translate(${enemyX}px, ${randomY}px) scale(${randomScale})`;

  gameArea.appendChild(enemy);

  // Determine wiggle parameters and speed factor based on enemy type
  let wiggleAmplitude = 0;
  let wiggleFrequency = 0;
  let speedFactor = 1;
  if (tornEnemies.includes(enemySrc)) {
    wiggleAmplitude = gameAreaHeight * 0.06; // Torn enemies wiggle more
    wiggleFrequency = 0.5;
    speedFactor = 0.7;
  } else if (longEnemies.includes(enemySrc)) {
    wiggleAmplitude = gameAreaHeight * 0.02; // Long enemies wiggle less
    wiggleFrequency = 0.3;
    speedFactor = 0.9;
  }
  // Crumpled enemies have default values

  activeEnemies.push({
    element: enemy,
    x: enemyX,
    y: randomY,
    wiggleAmplitude,
    wiggleFrequency,
    startTime: now,
    scale: randomScale,
    speedFactor,
    type: enemyType,
    src: enemySrc,
  });
}

// Function to move enemies, count them when they pass the player,
// and remove them if they move far off the left side of the screen.
function moveEnemies() {
  if (isDead) return;

  // Base enemy speed relative to game area height
  const baseEnemySpeed = gameAreaHeight * 0.003;

  // Get the player's bounding rectangle
  const playerRect = document.getElementById("player").getBoundingClientRect();

  // Loop backwards through activeEnemies array
  for (let i = activeEnemies.length - 1; i >= 0; i--) {
    const enemyObj = activeEnemies[i];

    // Update enemy position based on its speed factor
    const enemySpeed = baseEnemySpeed * enemyObj.speedFactor;
    enemyObj.x -= enemySpeed;

    // Compute wiggle offset for slight vertical movement
    let wiggleOffset = 0;
    if (enemyObj.wiggleAmplitude > 0 && enemyObj.wiggleFrequency > 0) {
      const elapsedTime = Date.now() - enemyObj.startTime;
      const wiggleProgress =
        (elapsedTime / 1000) * enemyObj.wiggleFrequency * Math.PI * 2;
      wiggleOffset = Math.sin(wiggleProgress) * enemyObj.wiggleAmplitude;
    }

    // Apply the transform to update the enemy's position and scale
    enemyObj.element.style.transform = `translate(${enemyObj.x}px, ${
      enemyObj.y + wiggleOffset
    }px) scale(${enemyObj.scale})`;

    // Get the enemy's bounding rectangle after transformation
    const enemyRect = enemyObj.element.getBoundingClientRect();

    // COUNTING: If the enemy's right edge has passed to the left of the player's left edge,
    // and we haven't already counted it, increment the counter.
    if (!enemyObj.counted && enemyRect.right < playerRect.left) {
      enemiesPassed++;
      enemyObj.counted = true; // Mark it as counted so it isn't counted again.
      console.log("Enemies passed: " + enemiesPassed);
    }

    // REMOVAL: Remove the enemy if its right edge is far off the left side.
    // Here, we remove it if enemyRect.right is less than -20% of gameAreaWidth.
    // (You can adjust the multiplier as needed to represent "1.2 off from the screen width.")
    if (enemyRect.right < -gameAreaWidth * 0.2) {
      enemyObj.element.remove();
      activeEnemies.splice(i, 1);
      continue; // Proceed to the next enemy
    }
  }
}

function triggerDeath() {
  isDead = true;
  switchAnimation("death");
}

//funkction to clear hitboxes after restart
function clearDebugHitboxes() {
  const weaponDebug = document.getElementById("weapon-hitbox-debug");
  if (weaponDebug) {
    weaponDebug.style.border = "none";
    weaponDebug.style.width = "0px";
    weaponDebug.style.height = "0px";
  }

  const enemyDebug = document.getElementById("enemy-hitbox-debug");
  if (enemyDebug) {
    enemyDebug.style.border = "none";
    enemyDebug.style.width = "0px";
    enemyDebug.style.height = "0px";
  }
}

// Collision detection
// Collision detection
function checkCollisions() {
  const player = document.getElementById("player");
  const playerRect = player.getBoundingClientRect();

  // Determine current state: "idle", "run", or "jump"
  const currentState = isJumping ? "jump" : isRunning ? "run" : "idle";

  // Get player hitbox configuration (red box)
  const playerConfig =
    playerHitboxConfigurations[currentState][currentWeapon || "unarmed"];
  const playerHitboxWidth = playerRect.width * playerConfig.width;
  const playerHitboxHeight = playerRect.height * playerConfig.height;
  let playerHitbox = {
    left:
      playerRect.left +
      (playerRect.width - playerHitboxWidth) / 2 +
      playerConfig.offsetX * playerRect.width,
    right:
      playerRect.left +
      (playerRect.width + playerHitboxWidth) / 2 +
      playerConfig.offsetX * playerRect.width,
    top:
      playerRect.top +
      (playerRect.height - playerHitboxHeight) / 2 +
      playerConfig.offsetY * playerRect.height,
    bottom:
      playerRect.top +
      (playerRect.height + playerHitboxHeight) / 2 +
      playerConfig.offsetY * playerRect.height,
  };

  // Compute weapon hitbox if a weapon is equipped and config exists (blue box)
  let weaponHitbox = null;
  if (
    currentWeapon &&
    weaponHitboxConfigurations[currentState] &&
    weaponHitboxConfigurations[currentState][currentWeapon]
  ) {
    const weaponConfig =
      weaponHitboxConfigurations[currentState][currentWeapon];
    const weaponWidth = playerRect.width * weaponConfig.width;
    const weaponHeight = playerRect.height * weaponConfig.height;
    const weaponOffsetX = playerRect.width * weaponConfig.offsetX;
    const weaponOffsetY = playerRect.height * weaponConfig.offsetY;

    weaponHitbox = {
      left: playerRect.left + weaponOffsetX,
      right: playerRect.left + weaponOffsetX + weaponWidth,
      top: playerRect.top + weaponOffsetY,
      bottom: playerRect.top + weaponOffsetY + weaponHeight,
    };
  }

  // Update red debug box for player hitbox
  const hitboxDebug = document.getElementById("hitbox-debug");
  if (hitboxDebug) {
    hitboxDebug.style.left = playerHitbox.left + "px";
    hitboxDebug.style.top = playerHitbox.top + "px";
    hitboxDebug.style.width = playerHitbox.right - playerHitbox.left + "px";
    hitboxDebug.style.height = playerHitbox.bottom - playerHitbox.top + "px";
    hitboxDebug.style.border = "2px solid red";
  }

  // Update blue debug box for weapon hitbox, if available
  if (weaponHitbox) {
    const weaponDebug = document.getElementById("weapon-hitbox-debug");
    if (weaponDebug) {
      weaponDebug.style.left = weaponHitbox.left + "px";
      weaponDebug.style.top = weaponHitbox.top + "px";
      weaponDebug.style.width = weaponHitbox.right - weaponHitbox.left + "px";
      weaponDebug.style.height = weaponHitbox.bottom - weaponHitbox.top + "px";
      weaponDebug.style.border = "2px solid blue";
    }
  }

  // Check collisions with each enemy
  for (const enemyObj of activeEnemies) {
    // If this enemy has already been processed for collision, skip it.
    if (enemyObj.collisionHandled) continue;

    const enemyRect = enemyObj.element.getBoundingClientRect();
    const enemyShrinkFactor = 0.5;
    const enemyNewWidth = enemyRect.width * 0.2;
    const enemyNewHeight = enemyRect.height * 0.4;
    const enemyHitbox = {
      left: enemyRect.left + (enemyRect.width - enemyNewWidth) / 2,
      right: enemyRect.right - (enemyRect.width - enemyNewWidth) / 2,
      top: enemyRect.top + (enemyRect.height - enemyNewHeight) / 2,
      bottom: enemyRect.bottom - (enemyRect.height - enemyNewHeight) / 2,
    };

    // **Call the debug update function here for each enemy**
    updateEnemyHitboxDebug(enemyObj, enemyHitbox);

    const collidesPlayer = checkBoxCollision(playerHitbox, enemyHitbox);
    const collidesWeapon = weaponHitbox
      ? checkBoxCollision(weaponHitbox, enemyHitbox)
      : false;

    if (collidesPlayer || collidesWeapon) {
      enemyObj.collisionHandled = true;
      console.log("Collision detected!");
      console.log("Enemy type:", enemyObj.type);
      console.log("Enemy source:", enemyObj.src);

      // Compute the centers of the player's and enemy's hitboxes:
      const playerCenterX = (playerHitbox.left + playerHitbox.right) / 2;
      const playerCenterY = (playerHitbox.top + playerHitbox.bottom) / 2;
      const enemyCenterX = (enemyHitbox.left + enemyHitbox.right) / 2;
      const enemyCenterY = (enemyHitbox.top + enemyHitbox.bottom) / 2;

      // Compute the collision point as the midpoint between these centers.
      const collisionPoint = {
        x: (playerCenterX + enemyCenterX) / 2,
        y: (playerCenterY + enemyCenterY) / 2,
      };

      // Call the overlay function with the collision point.
      if (currentWeapon === "needle" && tornEnemies.includes(enemyObj.src)) {
        let index = tornEnemies.indexOf(enemyObj.src);
        if (index !== -1) {
          enemyObj.element.src = repairedEnemies[index];
        }
        playCollisionOverlay("yarn", collisionPoint);
        sewedCount++;
        console.log("Enemies sewed: " + sewedCount);
      } else if (
        currentWeapon === "scissors" &&
        longEnemies.includes(enemyObj.src)
      ) {
        let index = longEnemies.indexOf(enemyObj.src);
        if (index !== -1) {
          enemyObj.element.src = repairedEnemies[index];
        }
        playCollisionOverlay("steam", collisionPoint);
        cutCount++;
        console.log("Enemies cut: " + cutCount);
      } else if (
        currentWeapon === "iron" &&
        crumEnemies.includes(enemyObj.src)
      ) {
        let index = crumEnemies.indexOf(enemyObj.src);
        if (index !== -1) {
          enemyObj.element.src = repairedEnemies[index];
        }
        playCollisionOverlay("short", collisionPoint);
        ironedCount++;
        console.log("Enemies ironed: " + ironedCount);
      } else {
        triggerDeath();
        break;
      }
    }
  }
}

// Helper function to check collision between two boxes
function checkBoxCollision(box1, box2) {
  return (
    box1.left < box2.right &&
    box1.right > box2.left &&
    box1.top < box2.bottom &&
    box1.bottom > box2.top
  );
}

// Function to update the enemy hitbox debug element (green)
function updateEnemyHitboxDebug(enemyObj, enemyHitbox) {
  // Check if the enemy already has a debug element stored.
  if (!enemyObj.debugDiv) {
    // If not, create one.
    enemyObj.debugDiv = document.createElement("div");
    enemyObj.debugDiv.className = "enemy-hitbox-debug"; // optional class for styling
    enemyObj.debugDiv.style.position = "absolute";
    enemyObj.debugDiv.style.pointerEvents = "none";
    enemyObj.debugDiv.style.border = "2px solid green";
    // Append it to the game area.
    const gameArea = document.getElementById("gameArea");
    if (gameArea) {
      gameArea.appendChild(enemyObj.debugDiv);
    } else {
      document.body.appendChild(enemyObj.debugDiv);
    }
  }
  // Update the debug element's style using the computed enemyHitbox values.
  enemyObj.debugDiv.style.left = enemyHitbox.left + "px";
  enemyObj.debugDiv.style.top = enemyHitbox.top + "px";
  enemyObj.debugDiv.style.width = enemyHitbox.right - enemyHitbox.left + "px";
  enemyObj.debugDiv.style.height = enemyHitbox.bottom - enemyHitbox.top + "px";
}

// Helper function to check collision between two boxes
function checkBoxCollision(box1, box2) {
  return (
    box1.left < box2.right &&
    box1.right > box2.left &&
    box1.top < box2.bottom &&
    box1.bottom > box2.top
  );
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
  const enemyIndex = Math.floor(Math.random() * chosenPool.length);
  return chosenPool[enemyIndex];
}

// ----------------------------
// SPAWN WEAPON FUNCTION
// ----------------------------
function spawnWeapon() {
  const now = Date.now();
  if (now - lastWeaponSpawnTime < weaponSpawnInterval) return;
  lastWeaponSpawnTime = now;

  // Randomly choose a weapon type:
  const types = ["needle", "scissors", "iron"];
  const type = types[Math.floor(Math.random() * types.length)];

  // Create the weapon pickup element:
  const weapon = document.createElement("img");
  weapon.src = `../public/${type}.svg`;
  weapon.style.position = "absolute";

  // Set weapon width relative to game area height (e.g., 5% of gameAreaHeight)
  const weaponWidth = gameAreaHeight * 0.05;
  weapon.style.width = weaponWidth + "px";
  weapon.style.height = "auto";

  // Spawn position: off-screen to the right and a random vertical position within game area margins.
  const weaponX = gameAreaWidth * 1.1; // spawn off-screen right
  const topMargin = gameAreaHeight * 0.2;
  const bottomMargin = gameAreaHeight * 0.2;
  const availableHeight = gameAreaHeight - topMargin - bottomMargin;
  const weaponY = Math.floor(Math.random() * availableHeight) + topMargin;

  // Set initial rotation to 0 and determine a rotation speed (in degrees per update)
  let rotation = 0;
  let rotationSpeed = Math.random() * (3 - 1) + 1; // between 1 and 3 degrees per update

  // Apply initial transform (translation and rotation)
  weapon.style.transform = `translate(${weaponX}px, ${weaponY}px) rotate(${rotation}deg)`;

  // Append the weapon to the game area
  document.getElementById("gameArea").appendChild(weapon);

  // Push a weapon object into the activeWeapons array with its properties
  activeWeapons.push({
    element: weapon,
    type: type,
    x: weaponX,
    y: weaponY,
    rotation: rotation,
    rotationSpeed: rotationSpeed,
    // Horizontal speed relative to gameAreaHeight, adjust as needed:
    speed: gameAreaHeight * 0.005,
  });
}

// ----------------------------
// MOVE WEAPONS FUNCTION
// ----------------------------
function moveWeapons() {
  if (isDead) return;
  // Loop through active weapon pickups:
  for (let i = activeWeapons.length - 1; i >= 0; i--) {
    let weaponObj = activeWeapons[i];
    // Update horizontal position:
    weaponObj.x -= weaponObj.speed;
    // Update rotation:
    weaponObj.rotation += weaponObj.rotationSpeed;
    // Update the transform on the DOM element:
    weaponObj.element.style.transform = `translate(${weaponObj.x}px, ${weaponObj.y}px) rotate(${weaponObj.rotation}deg)`;

    // Remove the pickup if it moves far off the left side (e.g., 20% of gameAreaWidth off-screen)
    if (
      weaponObj.x + parseFloat(weaponObj.element.style.width) <
      -gameAreaWidth * 0.2
    ) {
      weaponObj.element.remove();
      activeWeapons.splice(i, 1);
    }
  }
}

// ----------------------------
// CHECK WEAPON PICKUPS FUNCTION
// ----------------------------
function checkWeaponPickups() {
  const player = document.getElementById("player");
  const playerRect = player.getBoundingClientRect();

  // Loop through each active weapon pickup:
  for (let i = activeWeapons.length - 1; i >= 0; i--) {
    let weaponObj = activeWeapons[i];
    const weaponRect = weaponObj.element.getBoundingClientRect();

    // Use a simple box collision check between player and weapon pickup
    if (checkBoxCollision(playerRect, weaponRect)) {
      // Compute collision point as the player's center
      const collisionPoint = {
        x: (playerRect.left + playerRect.right) / 2,
        y: (playerRect.top + playerRect.bottom) / 2,
      };

      // Play the pickup overlay animation using "pickup" type.
      playCollisionOverlay("pickup", collisionPoint);

      // Increase ammo count for the type:
      ammoCounts[weaponObj.type] = (ammoCounts[weaponObj.type] || 0) + 1;
      console.log(
        `Ammo - needle: ${ammoCounts["needle"]}, scissors: ${ammoCounts["scissors"]}, iron: ${ammoCounts["iron"]}`
      );

      // Remove the weapon pickup:
      weaponObj.element.remove();
      activeWeapons.splice(i, 1);
    }
  }
}

// ----------------------------
// MODIFY PLAY COLLISION OVERLAY FUNCTION
// ----------------------------
function playCollisionOverlay(type, collisionPoint) {
  const gameArea = document.getElementById("gameArea");
  const gameAreaRect = gameArea.getBoundingClientRect();

  // Create or get the overlay element dynamically:
  let overlay = document.getElementById("collision-overlay");
  if (!overlay) {
    overlay = document.createElement("div");
    overlay.id = "collision-overlay";
    overlay.style.position = "absolute";
    overlay.style.pointerEvents = "none";
    // Append it to the game area
    gameArea.appendChild(overlay);
  }

  // Compute the collision point relative to the game area:
  const relX = collisionPoint.x - gameAreaRect.left;
  const relY = collisionPoint.y - gameAreaRect.top;

  // Set the overlay's position relative to the game area:
  overlay.style.left = relX + "px";
  overlay.style.top = relY + "px";

  // Set the overlay's size relative to the game area (adjust as desired, here 10% of height)
  overlay.style.width = gameAreaRect.width * 0.1 + "px";
  overlay.style.height = gameAreaRect.height * 0.1 + "px";

  // Clear any previous overlay content.
  overlay.innerHTML = "";

  // Determine the animation file path:
  let animPath = "";
  if (type === "pickup") {
    animPath = "../public/pickup.json";
  } else if (type === "yarn") {
    animPath = "../public/yarn.json";
  } else if (type === "steam") {
    animPath = "../public/short.json";
  } else if (type === "short") {
    animPath = "../public/steam.json";
  }

  // Load the overlay animation using Lottie.
  const overlayAnimation = lottie.loadAnimation({
    container: overlay,
    renderer: "svg",
    loop: false,
    autoplay: true,
    path: animPath,
  });

  // When the overlay animation completes, clear its content.
  overlayAnimation.addEventListener("complete", () => {
    overlay.innerHTML = "";
  });
}

// ----------------------------
// HELPER: BOX COLLISION CHECK
// ----------------------------
function checkBoxCollision(box1, box2) {
  return (
    box1.left < box2.right &&
    box1.right > box2.left &&
    box1.top < box2.bottom &&
    box1.bottom > box2.top
  );
}

window.addEventListener("resize", () => {
  initGameArea();
});

// Placeholder for particles and collision detection initialization
function initParticlesAndCollisions() {
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
  showLoadingAnimation();

  // Initialize game components
  initGameArea();
  initPhysics();
  initAnimations();
  initControls();
  initParticlesAndCollisions();
  initGameHUD();
  initScoreAndHighscores();

  hideLoadingAnimation();
}

// Call startGame to initialize everything
// startGame();
