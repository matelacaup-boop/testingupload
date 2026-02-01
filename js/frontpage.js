// FRONT PAGE JS - UPDATED FOR NEW LOGIN PAGE

// Select the buttons
const loginBtn = document.querySelector(".btn-login");
const guestBtn = document.getElementById("guestBtn");

// Add click event for Login/Register
if (loginBtn) {
  loginBtn.addEventListener("click", (e) => {
    e.preventDefault();
    console.log("Login/Register clicked - Redirecting to login page");
    
    // Clear any previous session data
    localStorage.removeItem("userMode");
    localStorage.removeItem("userSession");
    
    // Store that we're going to login page
    localStorage.setItem("loginRedirect", "true");
    
    // Redirect to login page
    const href = loginBtn.getAttribute("href");
    if (href) {
      window.location.href = href;
    } else {
      window.location.href = "user.html"; // fallback
    }
  });
}

// Add click event for Continue as Guest
if (guestBtn) {
  guestBtn.addEventListener("click", (e) => {
    e.preventDefault();
    console.log("Continue as Guest clicked");
    
    // Store guest session in localStorage
    const guestSession = {
      username: 'guest',
      isLoggedIn: false,
      isGuest: true,
      timestamp: new Date().toISOString(),
      permissions: ['view_dashboard', 'view_data', 'view_history']
    };
    
    localStorage.setItem("userSession", JSON.stringify(guestSession));
    localStorage.setItem("userMode", "guest");
    
    // Optional: Add loading effect
    if (guestBtn.querySelector('.fa-spinner')) {
      guestBtn.innerHTML = '<i class="fas fa-spinner fa-spin"></i> Signing in...';
    }
    
    // Small delay before redirect for better UX
    setTimeout(() => {
      const href = guestBtn.getAttribute("href");
      if (href) {
        window.location.href = href;
      } else {
        window.location.href = "index.html"; // fallback
      }
    }, 500);
  });
}

// Handle login form submission (for user.html page)
const loginForm = document.getElementById("loginForm");
if (loginForm) {
  loginForm.addEventListener("submit", function(e) {
    e.preventDefault();
    
    const username = document.getElementById("username")?.value;
    const password = document.getElementById("password")?.value;
    
    if (!username || !password) {
      console.error("Username or password missing");
      return;
    }
    
    // Store user session
    const userSession = {
      username: username,
      isLoggedIn: true,
      isGuest: false,
      timestamp: new Date().toISOString(),
      permissions: ['full_access']
    };
    
    localStorage.setItem("userSession", JSON.stringify(userSession));
    localStorage.setItem("userMode", "user");
    
    // Redirect to dashboard
    window.location.href = "index.html";
  });
}

// Page load animation for frontpage
window.addEventListener("DOMContentLoaded", () => {
  const frontpageBox = document.querySelector(".frontpage-content");
  if (frontpageBox) {
    frontpageBox.style.opacity = "0";
    frontpageBox.style.transform = "translateY(30px)";
    
    setTimeout(() => {
      frontpageBox.style.transition = "all 0.5s ease";
      frontpageBox.style.opacity = "1";
      frontpageBox.style.transform = "translateY(0)";
    }, 100);
  }
  
  // Check if user is already logged in
  const userSession = localStorage.getItem("userSession");
  if (userSession) {
    try {
      const session = JSON.parse(userSession);
      if (session.isLoggedIn && !session.isGuest) {
        // User is already logged in, you could optionally redirect
        console.log("User is already logged in as:", session.username);
      }
    } catch (error) {
      console.error("Error parsing user session:", error);
      localStorage.removeItem("userSession");
      localStorage.removeItem("userMode");
    }
  }
  
  // Debug info
  console.log("Frontpage JS loaded");
  console.log("Current user mode:", localStorage.getItem("userMode"));
});

// Optional: Add click sound effect (uncomment if you want sound)
/*
function playClickSound() {
  const clickSound = new Audio('click.mp3');
  clickSound.volume = 0.3;
  clickSound.play().catch(e => console.log("Audio play failed:", e));
}

// Add sound to buttons
if (loginBtn) loginBtn.addEventListener('click', playClickSound);
if (guestBtn) guestBtn.addEventListener('click', playClickSound);
*/

// Export functions for use in other scripts (if needed)
window.frontpageJS = {
  clearSession: function() {
    localStorage.removeItem("userSession");
    localStorage.removeItem("userMode");
    localStorage.removeItem("loginRedirect");
    console.log("Session cleared");
  },
  
  getCurrentUser: function() {
    const session = localStorage.getItem("userSession");
    if (session) {
      try {
        return JSON.parse(session);
      } catch (e) {
        return null;
      }
    }
    return null;
  },
  
  isGuest: function() {
    const session = this.getCurrentUser();
    return session && session.isGuest === true;
  }
};