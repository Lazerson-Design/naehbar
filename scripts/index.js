// Define keyframes in frames
var keyframes = [0, 70, 126, 185, 256, 310, 368, 467];
var currentKeyframeIndex = 0;
var timeBase = 25; // Frame rate (25 FPS)

var animation = lottie.loadAnimation({
  container: document.getElementById("bm"),
  renderer: "svg",
  rendererSettings: {
    preserveAspectRatio: "xMidYMid meet",
  },
  loop: false,
  autoplay: false,
  path: "../naebarfullres.json",
});

// Function to play between keyframes with a fixed duration (1 second)
function playBetweenKeyframes(fromFrame, toFrame) {
  var totalFrames = toFrame - fromFrame;
  var durationInSeconds = 2; // Fixed duration of x second
  var frameRate = timeBase; // 25 FPS
  var totalDurationFrames = durationInSeconds * frameRate;

  // Calculate the playback speed multiplier for Lottie
  var speed = totalFrames / totalDurationFrames;

  animation.setSpeed(speed);
  animation.playSegments([fromFrame, toFrame], true);
}

// Throttle the scroll event to ensure one keyframe per scroll
let isScrolling = false;
document.addEventListener("wheel", function (event) {
  if (isScrolling) return; // Ignore additional scroll events while handling one
  isScrolling = true;

  var direction = event.deltaY > 0 ? 1 : -1; // Scroll direction
  var nextKeyframeIndex = currentKeyframeIndex + direction;

  // Ensure index is within bounds
  if (nextKeyframeIndex < 0 || nextKeyframeIndex >= keyframes.length) {
    isScrolling = false; // Allow future scrolls
    return;
  }

  // Play the animation between the current and next keyframes
  var fromFrame = keyframes[currentKeyframeIndex];
  var toFrame = keyframes[nextKeyframeIndex];

  playBetweenKeyframes(fromFrame, toFrame);

  currentKeyframeIndex = nextKeyframeIndex; // Update the current keyframe index

  // Add a delay before allowing the next scroll
  setTimeout(() => {
    isScrolling = false;
  }, 1000); // Match the duration of the animation (1 second)
});

// Middle mouse click to reset
document.addEventListener("mousedown", function (event) {
  if (event.button === 1) {
    currentKeyframeIndex = 0; // Reset to the first keyframe
    animation.goToAndStop(keyframes[0], true);
  }
});
