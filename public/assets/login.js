const form = document.getElementById('login-form');
const err = document.getElementById('error');

form.addEventListener('submit', async (e) => {
  e.preventDefault();
  err.hidden = true;
  const body = {
    member_number: form.member_number.value.trim(),
    surname: form.surname.value.trim(),
  };
  const r = await fetch('/api/login', {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify(body),
  });
  if (r.ok) {
    const data = await r.json();
    location.href = data.redirect;
  } else {
    err.textContent = "We couldn't find a matching booking. Please check the details and try again.";
    err.hidden = false;
  }
});
