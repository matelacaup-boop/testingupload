const historyBody = document.getElementById("historyBody");
const dateFromSelect = document.getElementById("dateFromSelect");
const dateToSelect = document.getElementById("dateToSelect");
const filterBtn = document.getElementById("filterBtn");
const sortSelect = document.getElementById("sortSelect");

console.log("DOM Elements check:");
console.log("historyBody:", historyBody);
console.log("dateFromSelect:", dateFromSelect);
console.log("dateToSelect:", dateToSelect);
console.log("filterBtn:", filterBtn);

let historyData = [];
let currentSensorData = null;
let thresholds = {};

// Pagination variables
let currentPage = 1;
let recordsPerPage = 10;
let filteredData = [];

// Check if database is available
console.log("history.js loading...");
if (typeof window.database === 'undefined') {
  console.error("Firebase database not initialized!");
} else {
  console.log("Firebase database available in history.js");
}

// ============== LOAD THRESHOLDS FROM FIREBASE ===============
window.database.ref("thresholds").on("value", snapshot => {
  thresholds = snapshot.val();
  console.log("Thresholds loaded:", thresholds);
  
  if (thresholds) {
    console.log("Temperature thresholds:", thresholds.temperature);
    console.log("pH thresholds:", thresholds.ph);
    console.log("Salinity thresholds:", thresholds.salinity);
    console.log("Turbidity thresholds:", thresholds.turbidity);
    console.log("DO thresholds:", thresholds.do);
  } else {
    console.error("No thresholds found in Firebase!");
  }
});

// ============== HELPER FUNCTION: GET COLOR BASED ON THRESHOLD ===============
function getColorClass(parameter, value) {
  if (!thresholds || !thresholds[parameter] || value === undefined || value === null) {
    return '';
  }

  const threshold = thresholds[parameter];
  const { safeMin, safeMax, warnMin, warnMax } = threshold;

  if (value >= safeMin && value <= safeMax) {
    return 'status-safe';
  }
  
  if ((value >= warnMin && value < safeMin) || (value > safeMax && value <= warnMax)) {
    return 'status-caution';
  }
  
  if (value < warnMin || value > warnMax) {
    return 'status-critical';
  }

  return '';
}

// ============== LOAD CURRENT SENSOR DATA ===============
window.database.ref("sensors").on("value", snapshot => {
  currentSensorData = snapshot.val();
  console.log("Current sensor data:", currentSensorData);
});

// ============== LOAD HISTORICAL DATA ===============
window.database.ref("history").limitToLast(500).on("value", snapshot => {
  historyData = [];

  snapshot.forEach(child => {
    const data = child.val();

    if (typeof data.timestamp !== "number") {
      console.warn("Skipping record with invalid timestamp:", data);
      return;
    }

    historyData.push(data);
  });

  console.log("Total history records loaded:", historyData.length);
  populateDateSelectors();
});

// ============== POPULATE DATE DROPDOWNS ===============
function populateDateSelectors() {
  if (historyData.length === 0) {
    console.warn("No history data to populate date selectors");
    return;
  }

  // Get all unique dates from history data
  const uniqueDates = new Set();
  
  historyData.forEach(d => {
    const date = new Date(d.timestamp);
    // Format as YYYY-MM-DD for easy comparison
    const dateStr = date.toISOString().split('T')[0];
    uniqueDates.add(dateStr);
  });

  // Convert to array and sort (newest first)
  const sortedDates = Array.from(uniqueDates).sort((a, b) => {
    return new Date(b) - new Date(a);
  });

  console.log("Unique dates found:", sortedDates.length);

  // Populate Date From dropdown
  dateFromSelect.innerHTML = `<option value="">Select Start Date</option>`;
  sortedDates.forEach(dateStr => {
    const date = new Date(dateStr);
    const displayDate = date.toLocaleDateString('en-US', { 
      year: 'numeric', 
      month: 'short', 
      day: 'numeric' 
    });
    dateFromSelect.innerHTML += `<option value="${dateStr}">${displayDate}</option>`;
  });

  // Populate Date To dropdown
  dateToSelect.innerHTML = `<option value="">Select End Date</option>`;
  sortedDates.forEach(dateStr => {
    const date = new Date(dateStr);
    const displayDate = date.toLocaleDateString('en-US', { 
      year: 'numeric', 
      month: 'short', 
      day: 'numeric' 
    });
    dateToSelect.innerHTML += `<option value="${dateStr}">${displayDate}</option>`;
  });
  
  console.log("Date selectors populated");
}

// ============== APPLY FILTER ===============
filterBtn.addEventListener("click", () => {
  const dateFrom = dateFromSelect.value;
  const dateTo = dateToSelect.value;

  console.log("Filter applied - Date From:", dateFrom, "Date To:", dateTo);

  // Validation
  if (!dateFrom && !dateTo) {
    alert("Please select at least a start date");
    return;
  }

  if (dateFrom && dateTo) {
    const fromDate = new Date(dateFrom);
    const toDate = new Date(dateTo);
    
    if (fromDate > toDate) {
      alert("Start date cannot be after end date");
      return;
    }
  }

  // Filter data
  let filtered = historyData.filter(item => {
    const itemDate = new Date(item.timestamp);
    const itemDateStr = itemDate.toISOString().split('T')[0];

    // If only dateFrom is selected
    if (dateFrom && !dateTo) {
      return itemDateStr === dateFrom;
    }

    // If only dateTo is selected
    if (!dateFrom && dateTo) {
      return itemDateStr === dateTo;
    }

    // If both dates are selected
    if (dateFrom && dateTo) {
      return itemDateStr >= dateFrom && itemDateStr <= dateTo;
    }

    return true;
  });

  console.log("Historical records matching filter:", filtered.length);

  // Sort data
  const sortOrder = sortSelect.value;
  filtered.sort((a, b) => {
    if (sortOrder === "oldest") {
      return a.timestamp - b.timestamp;
    } else {
      return b.timestamp - a.timestamp;
    }
  });

  console.log("Total filtered results:", filtered.length, "records");
  
  // Store filtered data and reset to page 1
  filteredData = filtered;
  currentPage = 1;
  
  renderTable();
  renderPagination();
});

// ============== RENDER HISTORICAL DATA TABLE WITH PAGINATION ===============
function renderTable() {
  historyBody.innerHTML = "";

  if (filteredData.length === 0) {
    historyBody.innerHTML = `<tr><td colspan="6" style="text-align: center; padding: 40px;">No data available for selected date range</td></tr>`;
    document.getElementById('paginationInfo').innerHTML = '';
    document.getElementById('paginationControls').innerHTML = '';
    return;
  }

  // Calculate pagination
  const startIndex = (currentPage - 1) * recordsPerPage;
  const endIndex = Math.min(startIndex + recordsPerPage, filteredData.length);
  const pageData = filteredData.slice(startIndex, endIndex);

  // Render rows for current page
  pageData.forEach(d => {
    const date = new Date(d.timestamp).toLocaleString();

    const row = document.createElement("tr");
    row.innerHTML = `
      <td><strong>${date}</strong></td>
      <td class="${getColorClass('temperature', d.temperature)}">${d.temperature !== undefined ? d.temperature.toFixed(1) : "--"}</td>
      <td class="${getColorClass('ph', d.ph)}">${d.ph !== undefined ? d.ph.toFixed(2) : "--"}</td>
      <td class="${getColorClass('salinity', d.salinity)}">${d.salinity !== undefined ? d.salinity.toFixed(1) : "--"}</td>
      <td class="${getColorClass('turbidity', d.turbidity)}">${d.turbidity !== undefined ? d.turbidity.toFixed(1) : "--"}</td>
      <td class="${getColorClass('do', d.do)}">${d.do !== undefined ? d.do.toFixed(1) : "--"}</td>
    `;
    historyBody.appendChild(row);
  });

  // Update info display
  updatePaginationInfo(startIndex + 1, endIndex, filteredData.length);
}

// ============== UPDATE PAGINATION INFO ===============
function updatePaginationInfo(start, end, total) {
  const infoElement = document.getElementById('paginationInfo');
  if (infoElement) {
    infoElement.textContent = `Showing ${start}-${end} of ${total} records`;
  }
}

// ============== RENDER PAGINATION CONTROLS ===============
function renderPagination() {
  const totalPages = Math.ceil(filteredData.length / recordsPerPage);
  const paginationContainer = document.getElementById('paginationControls');
  
  if (!paginationContainer || totalPages <= 1) {
    if (paginationContainer) paginationContainer.innerHTML = '';
    return;
  }

  let paginationHTML = '';

  // Previous button
  paginationHTML += `
    <button class="pagination-btn" ${currentPage === 1 ? 'disabled' : ''} onclick="goToPage(${currentPage - 1})">
      <i class="fas fa-chevron-left"></i> Previous
    </button>
  `;

  // Page numbers
  const maxVisiblePages = 5;
  let startPage = Math.max(1, currentPage - Math.floor(maxVisiblePages / 2));
  let endPage = Math.min(totalPages, startPage + maxVisiblePages - 1);

  if (endPage - startPage + 1 < maxVisiblePages) {
    startPage = Math.max(1, endPage - maxVisiblePages + 1);
  }

  if (startPage > 1) {
    paginationHTML += `<button class="pagination-btn" onclick="goToPage(1)">1</button>`;
    if (startPage > 2) {
      paginationHTML += `<span class="pagination-ellipsis">...</span>`;
    }
  }

  for (let i = startPage; i <= endPage; i++) {
    paginationHTML += `
      <button class="pagination-btn ${i === currentPage ? 'active' : ''}" onclick="goToPage(${i})">
        ${i}
      </button>
    `;
  }

  if (endPage < totalPages) {
    if (endPage < totalPages - 1) {
      paginationHTML += `<span class="pagination-ellipsis">...</span>`;
    }
    paginationHTML += `<button class="pagination-btn" onclick="goToPage(${totalPages})">${totalPages}</button>`;
  }

  // Next button
  paginationHTML += `
    <button class="pagination-btn" ${currentPage === totalPages ? 'disabled' : ''} onclick="goToPage(${currentPage + 1})">
      Next <i class="fas fa-chevron-right"></i>
    </button>
  `;

  paginationContainer.innerHTML = paginationHTML;
}

// ============== GO TO PAGE FUNCTION ===============
function goToPage(page) {
  const totalPages = Math.ceil(filteredData.length / recordsPerPage);
  if (page < 1 || page > totalPages) return;
  
  currentPage = page;
  renderTable();
  renderPagination();
  
  // Scroll to top of table
  const table = document.querySelector('.history-table');
  if (table) {
    table.scrollIntoView({ behavior: 'smooth', block: 'start' });
  }
}

// ============== SUBMENU SWITCHING ===============
function showDataView() {
  document.getElementById('dataViewSection').style.display = 'block';
  document.getElementById('analyticsSection').style.display = 'none';
  
  // Update active submenu
  document.querySelectorAll('.submenu-item').forEach(item => item.classList.remove('active'));
  document.getElementById('dataViewTab').classList.add('active');
}

function showAnalytics() {
  document.getElementById('dataViewSection').style.display = 'none';
  document.getElementById('analyticsSection').style.display = 'block';
  
  // Update active submenu
  document.querySelectorAll('.submenu-item').forEach(item => item.classList.remove('active'));
  document.getElementById('analyticsTab').classList.add('active');
}

// Make functions global
window.goToPage = goToPage;
window.showDataView = showDataView;
window.showAnalytics = showAnalytics;