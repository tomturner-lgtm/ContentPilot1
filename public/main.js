/**
 * ContentPilot - Main JavaScript
 */

document.addEventListener('DOMContentLoaded', () => {
  initCustomCursor();
  initScrollAnimations();
  initMobileMenu();
});

/**
 * Custom Cursor Implementation
 */
function initCustomCursor() {
  const cursorDot = document.createElement('div');
  const cursorOutline = document.createElement('div');
  
  cursorDot.className = 'cursor-dot';
  cursorOutline.className = 'cursor-outline';
  
  document.body.appendChild(cursorDot);
  document.body.appendChild(cursorOutline);
  
  window.addEventListener('mousemove', (e) => {
    const posX = e.clientX;
    const posY = e.clientY;
    
    // Dot follows immediately
    cursorDot.style.left = `${posX}px`;
    cursorDot.style.top = `${posY}px`;
    
    // Outline follows with slight delay (handled by CSS transition or requestAnimationFrame for smoother feel)
    cursorOutline.animate([
      { left: `${posX}px`, top: `${posY}px` }
    ], { duration: 500, fill: "forwards" });
  });
  
  // Hover effects
  const interactiveElements = document.querySelectorAll('a, button, input, textarea, .card, .interactive');
  
  interactiveElements.forEach(el => {
    el.addEventListener('mouseenter', () => {
      document.body.classList.add('hovering');
    });
    
    el.addEventListener('mouseleave', () => {
      document.body.classList.remove('hovering');
    });
  });
}

/**
 * Scroll Animations using Intersection Observer
 */
function initScrollAnimations() {
  const revealElements = document.querySelectorAll('.reveal');
  
  const revealObserver = new IntersectionObserver((entries) => {
    entries.forEach(entry => {
      if (entry.isIntersecting) {
        entry.target.classList.add('active');
        // Optional: Stop observing once revealed
        // revealObserver.unobserve(entry.target);
      }
    });
  }, {
    root: null,
    threshold: 0.15,
    rootMargin: "0px"
  });
  
  revealElements.forEach(el => revealObserver.observe(el));
}

/**
 * Mobile Menu Toggle (Placeholder)
 */
function initMobileMenu() {
  // To be implemented when header is created
  console.log('Mobile menu init');
}
