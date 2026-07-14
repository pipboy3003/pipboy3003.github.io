<!DOCTYPE html>
<html lang="de">
<head>
<meta charset="UTF-8">
<meta name="viewport" content="width=device-width, initial-scale=1.0">
<title>Admin Login – AT Learning</title>
<link rel="icon" href="favicon.ico">
<link rel="stylesheet" href="style.css">
</head>
<body>

<section class="admin-login-wrap">
  <div class="admin-login-box">
    <img src="logo.png" alt="AT Learning" class="admin-logo">
    <h1>Admin-Bereich</h1>
    <p class="admin-sub">Bitte geben Sie das Passwort ein, um Kurse und Inhalte zu verwalten.</p>
    <form id="loginForm">
      <input type="password" id="password" placeholder="Passwort" required autocomplete="current-password">
      <button type="submit" class="btn btn-primary">Anmelden</button>
      <p class="form-note" id="loginNote"></p>
    </form>
    <a href="index.html" class="back-link">← Zurück zur Website</a>
  </div>
</section>

<script src="admin-config.js"></script>
<script src="admin-login.js"></script>
</body>
</html>
