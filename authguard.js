firebase.auth().onAuthStateChanged(user => {
  const isGuest = localStorage.getItem("userMode") === "guest";
  const page = window.location.pathname;

  // If NOT logged in and NOT guest
  if (!user && !isGuest) {
    window.location.href = "../html/frontpage.html";
    return;
  }

  // Guest restrictions
  if (isGuest) {
    const blockedPages = [
      "history.html",
      "alerts.html",
      "user.html"
    ];

    blockedPages.forEach(p => {
      if (page.includes(p)) {
        alert("Guest access is limited. Please log in.");
        window.location.href = "../html/index.html";
      }
    });
  }
});
