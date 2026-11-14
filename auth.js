const authStage = document.querySelector("#auth-stage");
const validViews = new Set(["login", "signup", "forgot", "forgot-sent", "reset", "otp", "password-updated", "welcome"]);
let resendTimer;
let resendSeconds = 0;
let authState = {
  email: "",
  flow: "login",
  fullName: "",
};

function escapeHtml(value) {
  return String(value).replace(/[&<>"']/g, (character) => ({
    "&": "&amp;",
    "<": "&lt;",
    ">": "&gt;",
    '"': "&quot;",
    "'": "&#39;",
  })[character]);
}

function currentView() {
  const requested = new URLSearchParams(window.location.search).get("view");
  return validViews.has(requested) ? requested : "login";
}

function navigate(view, { replace = false, email = authState.email, flow = authState.flow } = {}) {
  authState.email = email;
  authState.flow = flow;
  const params = new URLSearchParams({ view });
  if (email) params.set("email", email);
  if (view === "otp" || view === "welcome") params.set("flow", flow);
  const url = `${window.location.pathname}?${params.toString()}`;
  window.history[replace ? "replaceState" : "pushState"]({ view }, "", url);
  render(view);
  window.scrollTo({ top: 0, behavior: "smooth" });
}

function fieldMarkup({ id, label, type = "text", placeholder = "", autocomplete = "", required = true, hint = "", value = "", minlength, extra = "" }) {
  const escapedValue = value ? ` value="${escapeHtml(value)}"` : "";
  const minLength = minlength ? ` minlength="${minlength}"` : "";
  return `
    <div class="auth-field">
      <label for="${id}">${label}</label>
      <input id="${id}" name="${id}" type="${type}" placeholder="${placeholder}"${autocomplete ? ` autocomplete="${autocomplete}"` : ""}${required ? " required" : ""}${minLength}${escapedValue}${extra} aria-describedby="${id}-error">
      ${hint ? `<span class="auth-field-hint">${hint}</span>` : ""}
      <span class="auth-field-error" id="${id}-error" data-error-for="${id}"></span>
    </div>`;
}

function passwordMarkup({ id = "password", label = "Password", hint = "", minlength = 10 } = {}) {
  return `
    <div class="auth-field">
      <label for="${id}">${label}</label>
      <div class="auth-password-wrap">
        <input id="${id}" name="${id}" type="password" placeholder="Enter your password" autocomplete="${id === "new-password" ? "new-password" : "current-password"}" minlength="${minlength}" required>
        <button class="password-toggle" type="button" data-toggle-password="${id}" aria-label="Show password">Show</button>
      </div>
      ${hint ? `<span class="auth-field-hint">${hint}</span>` : ""}
      <span class="auth-field-error" id="${id}-error" data-error-for="${id}"></span>
      ${id === "new-password" ? `<div class="password-meter" data-meter-for="${id}" data-strength="0" aria-label="Password strength"><i></i><i></i><i></i><i></i><span>Not set</span></div><span class="auth-field-hint password-rules">Use at least 10 characters, including a letter and a number.</span>` : ""}
    </div>`;
}

function fieldError(id, message) {
  const errorKey = id === "otp-code" ? "otp" : id;
  const input = document.getElementById(errorKey === "otp" ? "otp-code" : errorKey);
  const error = document.querySelector(`[data-error-for="${errorKey}"]`);
  if (!input || !error) return;
  input.setAttribute("aria-invalid", message ? "true" : "false");
  error.textContent = message;
}

function formHeader(kicker, title, subtitle) {
  return `<div class="auth-view-kicker"><span></span>${kicker}</div><h1 class="auth-title">${title}</h1><p class="auth-subtitle">${subtitle}</p>`;
}

function loginView() {
  return `
    ${formHeader("WELCOME BACK", "Good to see you.", "Sign in to your Savant account and pick up where you left off.")}
    <form class="auth-form" data-auth-form="login" novalidate>
      ${fieldMarkup({ id: "email", label: "Email address", type: "email", placeholder: "you@example.com", autocomplete: "email", value: authState.email })}
      ${passwordMarkup({ id: "password" })}
      <div class="auth-form-row">
        <label class="auth-check"><input type="checkbox" name="remember" id="remember"><span>Remember this device</span></label>
        <a class="auth-inline-link" href="?view=forgot" data-auth-view="forgot">Forgot password?</a>
      </div>
      <div class="auth-form-note"><strong>Prototype mode.</strong> Sign-in is simulated. Any valid email and password will take you to a demo verification step.</div>
      <button class="auth-submit" type="submit">Continue <span aria-hidden="true">→</span></button>
    </form>
    <p class="auth-account-prompt">New to Savant? <a href="?view=signup" data-auth-view="signup">Create an account</a></p>`;
}

function signupView() {
  return `
    ${formHeader("YOUR NEXT MOVE STARTS HERE", "Create your account.", "A few details to get your Savant journey started.")}
    <form class="auth-form" data-auth-form="signup" novalidate>
      ${fieldMarkup({ id: "fullName", label: "Full name", placeholder: "As shown on your ID", autocomplete: "name", value: authState.fullName })}
      ${fieldMarkup({ id: "email", label: "Email address", type: "email", placeholder: "you@example.com", autocomplete: "email", value: authState.email })}
      ${passwordMarkup({ id: "new-password", label: "Create a password", minlength: 10 })}
      <label class="auth-check auth-terms"><input type="checkbox" name="terms" id="terms" aria-describedby="terms-error" required><span>I agree to the <a href="mailto:hello@savantcrypto.com?subject=Terms%20enquiry">Terms of Service</a> and acknowledge the <a href="mailto:hello@savantcrypto.com?subject=Privacy%20enquiry">Privacy Notice</a>.</span></label>
      <span class="auth-field-error" id="terms-error" data-error-for="terms"></span>
      <div class="auth-form-note"><strong>Prototype mode.</strong> This form does not create an account or send your information.</div>
      <button class="auth-submit" type="submit">Create account <span aria-hidden="true">→</span></button>
    </form>
    <p class="auth-account-prompt">Already have an account? <a href="?view=login" data-auth-view="login">Sign in</a></p>`;
}

function forgotView() {
  return `
    <a class="auth-back-link" href="?view=login" data-auth-view="login"><span aria-hidden="true">←</span> Back to sign in</a>
    ${formHeader("ACCOUNT RECOVERY", "Forgot your password?", "Enter the email address linked to your account. We'll show the next step.")}
    <form class="auth-form" data-auth-form="forgot" novalidate>
      ${fieldMarkup({ id: "email", label: "Email address", type: "email", placeholder: "you@example.com", autocomplete: "email", value: authState.email })}
      <div class="auth-form-note"><strong>Prototype mode.</strong> Password recovery is not connected to an email service.</div>
      <button class="auth-submit" type="submit">Continue <span aria-hidden="true">→</span></button>
    </form>
    <p class="auth-account-prompt">Remembered your password? <a href="?view=login" data-auth-view="login">Return to sign in</a></p>`;
}

function forgotSentView() {
  const email = escapeHtml(authState.email || "your email address");
  return `
    <a class="auth-back-link" href="?view=forgot" data-auth-view="forgot"><span aria-hidden="true">←</span> Edit email address</a>
    <div class="auth-success-icon" aria-hidden="true">✉</div>
    ${formHeader("NEXT STEP", "Check your inbox.", `If an account is associated with <strong>${email}</strong>, the live service would send password reset instructions.`)}
    <div class="auth-alert"><span>i</span><p>This is a prototype. No email was sent and no account lookup was performed.</p></div>
    <div class="auth-form">
      <button class="auth-submit" type="button" data-preview-reset>Preview password reset <span aria-hidden="true">→</span></button>
    </div>
    <p class="auth-account-prompt">Didn't receive an email? Check the address or <a href="?view=forgot" data-auth-view="forgot">try again</a>.</p>`;
}

function resetView() {
  return `
    <a class="auth-back-link" href="?view=forgot" data-auth-view="forgot"><span aria-hidden="true">←</span> Back to recovery</a>
    ${formHeader("PASSWORD RESET", "Choose a new password.", "Create a strong password that you don't use for other accounts.")}
    <div class="auth-alert"><span>i</span><p>Reset-link verification is not connected in this preview. In the live service, this page is available only through a valid, unexpired link.</p></div>
    <form class="auth-form" data-auth-form="reset" novalidate>
      ${passwordMarkup({ id: "new-password", label: "New password", minlength: 12, hint: "At least 12 characters with a letter and a number." })}
      ${passwordMarkup({ id: "confirm-password", label: "Confirm new password", minlength: 12 })}
      <div class="auth-form-note"><strong>Prototype mode.</strong> Your password is not saved or changed.</div>
      <button class="auth-submit" type="submit">Set new password <span aria-hidden="true">→</span></button>
    </form>`;
}

function otpView() {
  const signup = authState.flow === "signup";
  const email = escapeHtml(authState.email || "your email address");
  const title = signup ? "Verify your email." : "One more step.";
  const subtitle = `Enter the 6-digit code ${signup ? "to finish creating your demo account." : "we would send to"} <strong>${email}</strong>.`;
  return `
    <a class="auth-back-link" href="?view=${signup ? "signup" : "login"}" data-auth-view="${signup ? "signup" : "login"}"><span aria-hidden="true">←</span> Back</a>
    ${formHeader(signup ? "EMAIL VERIFICATION" : "SECURITY CHECK", title, subtitle)}
    <div class="auth-alert"><span>i</span><p>Preview code: <strong>123456</strong>. No code was sent. Use this code to continue through the prototype.</p></div>
    <form class="auth-form" data-auth-form="otp" novalidate>
      <div class="auth-field">
        <label class="auth-otp-label" for="otp-code">Verification code</label>
        <input class="auth-otp-field" id="otp-code" name="otp" type="text" inputmode="numeric" autocomplete="one-time-code" pattern="[0-9]{6}" maxlength="6" placeholder="······" aria-describedby="otp-error" required>
        <span class="auth-field-error" id="otp-error" data-error-for="otp"></span>
      </div>
      <button class="auth-submit" type="submit">Verify and continue <span aria-hidden="true">→</span></button>
    </form>
    <div class="auth-resend-row"><span id="resend-message">Didn't receive a code?</span><button type="button" data-resend>Resend code</button></div>
    <p class="auth-account-prompt"><a href="?view=login" data-auth-view="login">Use a different account</a></p>`;
}

function completedView(view) {
  if (view === "welcome") {
    return `
      <div class="auth-success-icon" aria-hidden="true">✓</div>
      ${formHeader("ACCOUNT SETUP", `You're on your way${authState.fullName ? `, ${escapeHtml(authState.fullName.split(" ")[0])}` : ""}.`, "Your account flow is complete in this preview.")}
      <div class="auth-alert"><span>i</span><p>This is not a real account. Authentication and account creation are not connected.</p></div>
      <div class="auth-form"><a class="auth-submit" href="app.html">Explore the demo exchange <span aria-hidden="true">→</span></a></div>
      <p class="auth-account-prompt"><a href="index.html">Return to Savant home</a></p>`;
  }
  return `
    <div class="auth-success-icon" aria-hidden="true">✓</div>
    ${formHeader("PASSWORD UPDATED", "You're all set.", "Your password was updated in this prototype flow.")}
    <div class="auth-alert"><span>i</span><p>No password was saved or changed. Connect this flow to your identity service before launch.</p></div>
    <div class="auth-form"><a class="auth-submit" href="?view=login" data-auth-view="login">Return to sign in <span aria-hidden="true">→</span></a></div>`;
}

function render(view = currentView()) {
  window.clearInterval(resendTimer);
  authState.email = new URLSearchParams(window.location.search).get("email") || authState.email;
  authState.flow = new URLSearchParams(window.location.search).get("flow") || authState.flow;
  const views = {
    login: loginView,
    signup: signupView,
    forgot: forgotView,
    "forgot-sent": forgotSentView,
    reset: resetView,
    otp: otpView,
    welcome: () => completedView("welcome"),
    "password-updated": () => completedView("password-updated"),
  };
  authStage.innerHTML = views[view]();
  authStage.dataset.view = view;
  document.title = `${{
    login: "Sign in",
    signup: "Create account",
    forgot: "Forgot password",
    "forgot-sent": "Check your inbox",
    reset: "Reset password",
    otp: "Verify your account",
    welcome: "Account ready",
    "password-updated": "Password updated",
  }[view]} — Savant`;
  bindView(view);
}

function validateForm(form) {
  const formType = form.dataset.authForm;
  if (formType === "signup" && !form.elements.terms.checked) {
    fieldError("terms", "Please review and accept the terms to continue.");
    form.elements.terms.focus();
    return false;
  }

  let valid = form.reportValidity();
  if (!valid) return false;

  if (formType === "signup") {
    const password = form.elements["new-password"].value;
    if (!/[A-Za-z]/.test(password) || !/\d/.test(password)) {
      fieldError("new-password", "Include at least one letter and one number.");
      form.elements["new-password"].focus();
      return false;
    }
  }

  if (formType === "reset") {
    const password = form.elements["new-password"].value;
    const confirmation = form.elements["confirm-password"].value;
    if (!/[A-Za-z]/.test(password) || !/\d/.test(password)) {
      fieldError("new-password", "Include at least one letter and one number.");
      form.elements["new-password"].focus();
      return false;
    }
    if (password !== confirmation) {
      fieldError("confirm-password", "Those passwords don't match.");
      form.elements["confirm-password"].focus();
      return false;
    }
  }
  return true;
}

function handleSubmit(event) {
  event.preventDefault();
  const form = event.currentTarget;
  if (!validateForm(form)) return;
  const type = form.dataset.authForm;

  if (type === "login") {
    authState.email = form.elements.email.value.trim();
    navigate("otp", { flow: "login" });
  } else if (type === "signup") {
    authState.email = form.elements.email.value.trim();
    authState.fullName = form.elements.fullName.value.trim();
    navigate("otp", { flow: "signup" });
  } else if (type === "forgot") {
    authState.email = form.elements.email.value.trim();
    navigate("forgot-sent");
  } else if (type === "otp") {
    const input = form.elements.otp;
    if (input.value !== "123456") {
      fieldError("otp", "That code doesn't match the preview code above.");
      input.focus();
      input.select();
      return;
    }
    const flow = authState.flow;
    navigate(flow === "signup" ? "welcome" : "login", { flow });
    if (flow === "login") {
      authStage.insertAdjacentHTML("afterbegin", '<div class="auth-alert auth-login-demo-result"><span>i</span><p>Verification demo complete. No session was created. Connect sign-in to the identity provider.</p></div>');
    }
  } else if (type === "reset") {
    navigate("password-updated");
  }
}

function updatePasswordMeter(input) {
  const meter = document.querySelector(`[data-meter-for="${input.name}"]`);
  if (!meter) return;
  const password = input.value;
  const checks = [
    password.length >= 10,
    /[A-Za-z]/.test(password),
    /\d/.test(password),
    password.length >= 14 || /[^A-Za-z0-9]/.test(password),
  ];
  const score = password ? checks.filter(Boolean).length : 0;
  const strength = score <= 1 ? "Weak" : score === 2 ? "Fair" : score === 3 ? "Good" : "Strong";
  meter.dataset.strength = String(score);
  meter.querySelector("span").textContent = password ? strength : "Not set";
}

function bindView(view) {
  authStage.querySelectorAll("[data-auth-view]").forEach((link) => {
    link.addEventListener("click", (event) => {
      event.preventDefault();
      const target = link.dataset.authView;
      navigate(target, { flow: target === "signup" ? "signup" : "login" });
    });
  });

  authStage.querySelectorAll("[data-auth-form]").forEach((form) => {
    form.addEventListener("submit", handleSubmit);
    form.addEventListener("input", (event) => {
      if (event.target.name === "new-password") updatePasswordMeter(event.target);
      if (event.target.id) fieldError(event.target.id, "");
    });
    form.addEventListener("change", (event) => {
      if (event.target.id === "terms" && event.target.checked) fieldError("terms", "");
    });
  });

  authStage.querySelectorAll("[data-toggle-password]").forEach((button) => {
    button.addEventListener("click", () => {
      const input = document.getElementById(button.dataset.togglePassword);
      const reveal = input.type === "password";
      input.type = reveal ? "text" : "password";
      button.textContent = reveal ? "Hide" : "Show";
      button.setAttribute("aria-label", `${reveal ? "Hide" : "Show"} password`);
    });
  });

  authStage.querySelector("[data-preview-reset]")?.addEventListener("click", () => navigate("reset"));

  const otp = authStage.querySelector("#otp-code");
  otp?.addEventListener("input", () => {
    otp.value = otp.value.replace(/\D/g, "").slice(0, 6);
  });
  otp?.addEventListener("paste", (event) => {
    const pasted = event.clipboardData?.getData("text") ?? "";
    if (!pasted) return;
    event.preventDefault();
    otp.value = pasted.replace(/\D/g, "").slice(0, 6);
  });

  authStage.querySelector("[data-resend]")?.addEventListener("click", () => {
    const message = authStage.querySelector("#resend-message");
    message.textContent = "Preview code: 123456. No email or SMS was sent.";
  });

  if (view === "login") authStage.querySelector("#email")?.focus({ preventScroll: true });
  else if (view === "otp") otp?.focus({ preventScroll: true });
}

window.addEventListener("popstate", () => render(currentView()));
document.querySelector("#auth-year").textContent = String(new Date().getFullYear());

const query = new URLSearchParams(window.location.search);
authState.email = query.get("email") || "";
authState.flow = query.get("flow") || "login";
render();
