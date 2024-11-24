// fade-in.js

document.addEventListener("DOMContentLoaded", function () {
  // Check if the browser supports IntersectionObserver
  if ("IntersectionObserver" in window) {
    const sections = document.querySelectorAll(".section");
    const observerOptions = {
      root: null, // Use the browser viewport as the container
      rootMargin: "0px",
      threshold: 0.3, // Trigger when 10% of the element is visible
    };

    const observer = new IntersectionObserver((entries) => {
      entries.forEach((entry) => {
        if (entry.isIntersecting) {
          // Add the 'fade-in' class to trigger the animation
          entry.target.classList.add("fade-in");
        } else {
          // Remove the 'fade-in' class when not intersecting
          entry.target.classList.remove("fade-in");
        }
      });
    }, observerOptions);

    // Observe each section
    sections.forEach((section) => {
      observer.observe(section);
    });
  } else {
    // Fallback for browsers that don't support IntersectionObserver
    // Simply show all sections
    const sections = document.querySelectorAll(".section");
    sections.forEach((section) => {
      section.classList.add("fade-in");
    });
  }
});
