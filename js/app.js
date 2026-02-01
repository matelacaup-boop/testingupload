// =========================
// DOM ELEMENTS
// =========================
console.log("app.js loading - checking DOM elements");

const tempEl = document.getElementById("temp");
const phEl = document.getElementById("ph");
const salinityEl = document.getElementById("salinity");
const turbidityEl = document.getElementById("turbidity");
const doEl = document.getElementById("do");

const espEl = document.getElementById("espStatus");
const batteryEl = document.getElementById("battery");
const aeratorEl = document.getElementById("aerator");
const lastUpdateEl = document.getElementById("lastUpdate");

console.log("DOM Elements found:", {
  tempEl: !!tempEl,
  phEl: !!phEl,
  salinityEl: !!salinityEl,
  turbidityEl: !!turbidityEl,
  doEl: !!doEl,
  espEl: !!espEl,
  batteryEl: !!batteryEl,
  aeratorEl: !!aeratorEl,
  lastUpdateEl: !!lastUpdateEl
});

// Check if database is available
if (typeof window.database === 'undefined') {
  console.error("Firebase database not initialized!");
  // Fallback: Use mock data for testing navigation
  useMockDataForNavigation();
} else {
  console.log("Firebase database initialized successfully");
}

// =========================
// MOCK DATA FOR NAVIGATION TESTING
// =========================
function useMockDataForNavigation() {
  console.log("Using mock data for dashboard");
  
  // Only set values if elements exist
  const mockData = {
    temp: 28.5,
    ph: 7.2,
    salinity: 32.8,
    turbidity: 3.5,
    do: 6.8,
    battery: 85,
    aerator: "ON",
    lastUpdate: new Date().toLocaleTimeString()
  };
  
  // Update dashboard with mock data
  setTimeout(() => {
    if (tempEl) {
      tempEl.textContent = mockData.temp.toFixed(1);
      tempEl.className = "safe";
    }
    if (phEl) {
      phEl.textContent = mockData.ph.toFixed(2);
      phEl.className = "safe";
    }
    if (salinityEl) {
      salinityEl.textContent = mockData.salinity.toFixed(1);
      salinityEl.className = "safe";
    }
    if (turbidityEl) {
      turbidityEl.textContent = mockData.turbidity.toFixed(1);
      turbidityEl.className = "caution";
    }
    if (doEl) {
      doEl.textContent = mockData.do.toFixed(1);
      doEl.className = "safe";
    }
    if (batteryEl) {
      batteryEl.textContent = mockData.battery + "%";
    }
    if (aeratorEl) {
      aeratorEl.textContent = mockData.aerator;
      aeratorEl.style.color = mockData.aerator === "ON" ? "#22c55e" : "#ef4444";
    }
    if (lastUpdateEl) {
      lastUpdateEl.textContent = mockData.lastUpdate;
    }
    if (espEl) {
      espEl.classList.add("online");
      espEl.classList.remove("offline");
    }
  }, 500);
}

// =========================
// LOAD THRESHOLDS (OPTIONAL)
// =========================
let thresholds = null;
if (typeof window.database !== 'undefined') {
  window.database.ref("thresholds").on("value", snapshot => {
    thresholds = snapshot.val();
    console.log("Thresholds loaded:", thresholds);
  });
}

// =========================
// SENSOR DATA
// =========================
if (typeof window.database !== 'undefined') {
  window.database.ref("sensors").on("value", snapshot => {
    const data = snapshot.val();
    console.log("Sensor data received:", data);

    if (!data) {
      console.warn("No sensor data found in Firebase");
      return;
    }

    if (tempEl) {
      tempEl.textContent = data.temperature !== undefined ? data.temperature.toFixed(1) : "--";
      const statusClass = getStatusClass(data.temperature, thresholds?.temperature);
      tempEl.className = statusClass;
      console.log("Temperature:", data.temperature, "Threshold:", thresholds?.temperature, "Status class:", statusClass);
    }

    if (phEl) {
      phEl.textContent = data.ph !== undefined ? data.ph.toFixed(2) : "--";
      const statusClass = getStatusClass(data.ph, thresholds?.ph);
      phEl.className = statusClass;
    }

    if (salinityEl) {
      salinityEl.textContent = data.salinity !== undefined ? data.salinity.toFixed(1) : "--";
      const statusClass = getStatusClass(data.salinity, thresholds?.salinity);
      salinityEl.className = statusClass;
    }

    if (turbidityEl) {
      turbidityEl.textContent = data.turbidity !== undefined ? data.turbidity.toFixed(1) : "--";
      const statusClass = getStatusClass(data.turbidity, thresholds?.turbidity);
      turbidityEl.className = statusClass;
    }

    if (doEl) {
      doEl.textContent = data.do !== undefined ? data.do.toFixed(1) : "--";
      const statusClass = getStatusClass(data.do, thresholds?.do);
      doEl.className = statusClass;
    }

    // Update last update time from sensor data
    if (lastUpdateEl && data.lastUpdate) {
      const date = new Date(data.lastUpdate);
      lastUpdateEl.textContent = date.toLocaleString();
    } else if (lastUpdateEl) {
      // Fallback to current time
      lastUpdateEl.textContent = new Date().toLocaleTimeString();
    }
  });
}

// =========================
// SYSTEM STATUS
// =========================
if (typeof window.database !== 'undefined') {
  window.database.ref("system").on("value", snapshot => {
    const system = snapshot.val();
    console.log("System data received:", system);

    if (!system) {
      console.warn("No system data found in Firebase");
      return;
    }

    // ESP32 status
    if (espEl) {
      if (system.esp32Online) {
        espEl.classList.add("online");
        espEl.classList.remove("offline");
      } else {
        espEl.classList.add("offline");
        espEl.classList.remove("online");
      }
    }

    // Battery percentage
    if (batteryEl && system.battery !== undefined) {
      batteryEl.textContent = system.battery + "%";
    }

    // Aerator status
    if (aeratorEl && system.aerator !== undefined) {
      aeratorEl.textContent = system.aerator ? "ON" : "OFF";
      aeratorEl.style.color = system.aerator ? "#22c55e" : "#ef4444";
    }
  });
}

// =========================
// HELPER FUNCTION
// =========================
function getStatusClass(value, threshold) {
  if (!threshold || value === undefined) return "unknown";
  
  // CRITICAL
  if (value < threshold.warnMin || value > threshold.warnMax) {
    return "critical";
  }
  
  // CAUTION
  if (value < threshold.safeMin || value > threshold.safeMax) {
    return "caution";
  }
  
  // SAFE
  return "safe";
}

// =========================
// THEME TOGGLE
// =========================
function toggleSettings() {
  const panel = document.getElementById('settingsPanel');
  if (panel) {
    panel.classList.toggle('open');
  }
}

function setTheme(mode) {
  if (mode === 'dark') {
    document.body.classList.add('dark');
    // Save theme preference
    localStorage.setItem('theme', 'dark');
  } else {
    document.body.classList.remove('dark');
    localStorage.setItem('theme', 'light');
  }
}

// =========================
// LOAD SAVED THEME
// =========================
document.addEventListener("DOMContentLoaded", () => {
  // Load saved theme
  const savedTheme = localStorage.getItem('theme');
  if (savedTheme === 'dark') {
    document.body.classList.add('dark');
    // Update radio button
    const darkRadio = document.querySelector('input[value="dark"]');
    if (darkRadio) darkRadio.checked = true;
  }

  /* ======================================================
     DEAD FISH LOGO – JS ADDITION (NO EXISTING CODE CHANGED)
  ====================================================== */
  const sidebar = document.querySelector(".sidebar");
  const fishLogo = document.querySelector(".fish-logo");

  if (!sidebar || !fishLogo) return;

  sidebar.addEventListener("mouseenter", () => {
    fishLogo.classList.remove("wiggle");
    void fishLogo.offsetWidth; // restart animation
    fishLogo.classList.add("wiggle");
  });

  // =========================
  // ADD CARD CLICK HANDLERS FOR EXTRA FEEDBACK
  // =========================
  const cards = document.querySelectorAll('.card');
  cards.forEach(card => {
    // Remove any existing click handlers to prevent conflicts
    card.onclick = null;
    
    // Add visual feedback on click
    card.addEventListener('click', function(e) {
      console.log(`Card clicked: ${this.querySelector('h3').textContent}`);
      // Add brief animation
      this.style.transform = 'scale(0.98)';
      setTimeout(() => {
        this.style.transform = '';
      }, 150);
    });
  });

  // =========================
  // CHECK IF NAVIGATION PAGES EXIST
  // =========================
  const checkPages = async () => {
    const pages = ['temp.html', 'ph.html', 'salinity.html', 'turbidity.html', 'do.html'];
    
    for (const page of pages) {
      try {
        const response = await fetch(page, { method: 'HEAD' });
        console.log(`${page}: ${response.ok ? '✅ Found' : '❌ Not found'}`);
      } catch (error) {
        console.warn(`${page}: ❌ Not found (${error.message})`);
      }
    }
  };
  
  // Run check after a short delay
  setTimeout(checkPages, 1000);
});

