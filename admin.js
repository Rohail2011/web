// Simulated user database
const users = [
  { email: 'user@example.com', password: 'password' },
  { email: 'ch@rohail.com', password: '124' },
  { email: 'user1@rohail.com', password: '124' },
  { email: 'user2@rohail.com', password: '124' },
];

document.addEventListener('DOMContentLoaded', () => {
  const form = document.getElementById('loginForm');
  const emailInput = document.getElementById('emailInput');
  const passwordInput = document.getElementById('passwordInput');
  const rememberMeCheckbox = document.getElementById('rememberMe');

  // If user previously chose 'Remember me', auto-fill email and password
  const savedUser = JSON.parse(localStorage.getItem('rememberedUser'));
  if (savedUser) {
    emailInput.value = savedUser.email;
    passwordInput.value = savedUser.password;
    rememberMeCheckbox.checked = true;
  }

  form.addEventListener('submit', (event) => {
    event.preventDefault();

    const email = emailInput.value.trim();
    const password = passwordInput.value.trim();
    const rememberMe = rememberMeCheckbox.checked;

    const user = users.find(u => u.email === email && u.password === password);

    if (user) {
      sessionStorage.setItem('loggedIn', 'true');

      if (rememberMe) {
        localStorage.setItem('rememberedUser', JSON.stringify({ email, password }));
      } else {
        localStorage.removeItem('rememberedUser');
      }

      window.location.href = 'work.html';
    } else {
      alert('Invalid credentials. Please try again.');
    }
  });
});
