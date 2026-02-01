document.addEventListener("DOMContentLoaded", () => {

  const formTitle = document.getElementById("formTitle");
  const formMsg = document.getElementById("formMsg");
  const loginForm = document.getElementById("loginForm");
  const showRegister = document.getElementById("showRegister");
  const showForgot = document.getElementById("showForgot");

  function showMsg(msg, type = "error") {
    formMsg.innerHTML = `<div class="${type}">${msg}</div>`;
  }

  function clearMsg() {
    formMsg.innerHTML = "";
  }
  // =========================
  // PASSWORD RULES
  // =========================
  function isStrongPassword(password) {
    return (
      password.length >= 8 &&
      /[A-Z]/.test(password) &&
      /[^A-Za-z0-9]/.test(password)
    );
  }


  // =========================
  // LOGIN
  // =========================
  function showLoginForm() {
    formTitle.textContent = "Login";
    loginForm.innerHTML = `
      <label>Email</label>
      <input type="email" id="email" required>
      <label>Password</label>
      <input type="password" id="password" required>
      <button type="submit">Login</button>
    `;
    showRegister.style.display = "block";
    showForgot.style.display = "block";
    clearMsg();

    loginForm.onsubmit = e => {
      e.preventDefault();
      clearMsg();

      const email = document.getElementById("email").value.trim();
      const password = document.getElementById("password").value;

      firebase.auth()
        .signInWithEmailAndPassword(email, password)
        .then(cred => {
          if (!cred.user.emailVerified) {
            firebase.auth().signOut();
            showMsg(
              "Email not verified. Please confirm your email first. Check Spam folder."
            );
            return;
          }

          localStorage.removeItem("userMode");
          window.location.href = "index.html";
        })
        .catch(err => showMsg(err.message));
    };
  }

  // =========================
  // REGISTER
  // =========================
  showRegister.onclick = () => {
    formTitle.textContent = "Create Account";
    loginForm.innerHTML = `
      <label>Email</label>
      <input type="email" id="email" required>
      <label>Password</label>
      <input type="password" id="password" required>
      <small>
        Password must be 8+ characters, include 1 uppercase letter and 1 symbol.
      </small>
      <button type="submit">Register</button>
    `;
    showRegister.style.display = "none";
    showForgot.style.display = "none";
    clearMsg();

    loginForm.onsubmit = e => {
      e.preventDefault();
      clearMsg();

      const email = document.getElementById("email").value.trim();
      const password = document.getElementById("password").value;

      if (!isStrongPassword(password)) {
        showMsg(
          "Password must be at least 8 characters, include an uppercase letter and a symbol."
        );
        return;
      }

      firebase.auth()
        .createUserWithEmailAndPassword(email, password)
        .then(cred => cred.user.sendEmailVerification())
        .then(() => {
          showMsg(
            "Verification email sent. Please confirm your email before logging in. Check Spam folder.",
            "success"
          );
          firebase.auth().signOut();
        
        })
        .catch(err => showMsg(err.message));
    };
  };

  // =========================
  // FORGOT PASSWORD
  // =========================
  showForgot.onclick = () => {
    formTitle.textContent = "Reset Password";
    loginForm.innerHTML = `
      <label>Email</label>
      <input type="email" id="email" required>
      <button type="submit">Send Reset Email</button>
    `;
    showRegister.style.display = "none";
    showForgot.style.display = "none";
    clearMsg();

    loginForm.onsubmit = e => {
      e.preventDefault();
      clearMsg();

      const email = document.getElementById("email").value.trim();

      firebase.auth()
        .sendPasswordResetEmail(email)
        .then(() => {
          showMsg(
            "Password reset email sent. Please check your inbox and Spam folder.",
            "success"
          );
       
        })
        .catch(err => showMsg(err.message));
    };
  };

  // INIT
  showLoginForm();
});
