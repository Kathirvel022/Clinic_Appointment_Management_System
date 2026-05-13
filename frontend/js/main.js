const API_URL = 'https://clinic-appointment-management-system-ej6s.onrender.com/api';

const themeToggle = document.getElementById('themeToggle');
if (themeToggle) {
    themeToggle.addEventListener('click', () => {
        const currentTheme = document.body.getAttribute('data-theme');
        if (currentTheme === 'dark') {
            document.body.removeAttribute('data-theme');
            themeToggle.innerHTML = '<i class="fa-solid fa-moon"></i>';
            localStorage.setItem('theme', 'light');
        } else {
            document.body.setAttribute('data-theme', 'dark');
            themeToggle.innerHTML = '<i class="fa-solid fa-sun"></i>';
            localStorage.setItem('theme', 'dark');
        }
    });

    if (localStorage.getItem('theme') === 'dark') {
        document.body.setAttribute('data-theme', 'dark');
        themeToggle.innerHTML = '<i class="fa-solid fa-sun"></i>';
    }
}

function showForm(formType) {
    const loginForm = document.getElementById('loginForm');
    const registerForm = document.getElementById('registerForm');
    if(loginForm && registerForm) {
        if (formType === 'login') {
            loginForm.classList.remove('d-none');
            registerForm.classList.add('d-none');
        } else {
            loginForm.classList.add('d-none');
            registerForm.classList.remove('d-none');
        }
    }
}

function showToast(message, isError = false) {
    const toastEl = document.getElementById('liveToast');
    const toastBody = document.getElementById('toastMessage');
    if(toastEl) {
        toastBody.textContent = message;
        if(isError) {
            toastEl.classList.remove('bg-primary', 'bg-success');
            toastEl.classList.add('bg-danger');
        } else {
            toastEl.classList.remove('bg-primary', 'bg-danger');
            toastEl.classList.add('bg-success');
        }
        const toast = new bootstrap.Toast(toastEl);
        toast.show();
    } else {
        alert(message);
    }
}

async function checkAuth() {
    const token = localStorage.getItem('token');
    if (!token) return null;

    try {
        const res = await fetch(`${API_URL}/auth/me`, {
            headers: { 'Authorization': `Bearer ${token}` }
        });
        if (res.ok) {
            const user = await res.json();
            return user;
        } else {
            localStorage.removeItem('token');
            return null;
        }
    } catch (e) {
        console.error(e);
        return null;
    }
}

if(window.location.pathname.endsWith('/') || window.location.pathname.endsWith('index.html')) {
    checkAuth().then(user => {
        if(user) {
            if(user.role === 'patient') window.location.href = 'patient.html';
            else if(user.role === 'doctor') window.location.href = 'doctor.html';
            else if(user.role === 'admin') window.location.href = 'admin.html';
        }
    });
}

const formLogin = document.getElementById('formLogin');
if(formLogin) {
    formLogin.addEventListener('submit', async (e) => {
        e.preventDefault();
        const email = document.getElementById('loginEmail').value;
        const password = document.getElementById('loginPassword').value;

        try {
            const formData = new URLSearchParams();
            formData.append('username', email);
            formData.append('password', password);

            const res = await fetch(`${API_URL}/auth/login`, {
                method: 'POST',
                headers: { 'Content-Type': 'application/x-www-form-urlencoded' },
                body: formData
            });

            if (res.ok) {
                const data = await res.json();
                localStorage.setItem('token', data.access_token);
                showToast("Login successful!");
                setTimeout(() => window.location.reload(), 1000);
            } else {
                const err = await res.json();
                showToast(err.detail || "Login failed", true);
            }
        } catch (err) {
            showToast("Network error", true);
        }
    });
}

const formRegister = document.getElementById('formRegister');
if(formRegister) {
    formRegister.addEventListener('submit', async (e) => {
        e.preventDefault();
        const body = {
            email: document.getElementById('regEmail').value,
            password: document.getElementById('regPassword').value,
            first_name: document.getElementById('regFirstName').value,
            last_name: document.getElementById('regLastName').value,
            role: "patient"
        };

        try {
            const res = await fetch(`${API_URL}/auth/register`, {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify(body)
            });

            if (res.ok) {
                showToast("Registration successful! Please login.");
                showForm('login');
                document.getElementById('loginEmail').value = body.email;
            } else {
                const err = await res.json();
                showToast(err.detail || "Registration failed", true);
            }
        } catch (err) {
            showToast("Network error", true);
        }
    });
}

function logout() {
    localStorage.removeItem('token');
    window.location.href = 'index.html';
}
