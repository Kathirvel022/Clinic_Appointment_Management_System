document.addEventListener('DOMContentLoaded', async () => {
    const user = await checkAuth();
    if (!user || user.role !== 'admin') {
        window.location.href = 'index.html';
        return;
    }

    document.getElementById('userName').textContent = `${user.email}`;

    await loadProfile();
    await loadSummary();
    await loadDoctors();
    await loadPatients();
    await loadAppointments();
});

async function loadProfile() {
    try {
        const token = localStorage.getItem('token');
        const res = await fetch(`${API_URL}/auth/profile`, {
            headers: { 'Authorization': `Bearer ${token}` }
        });
        if (res.ok) {
            const profile = await res.json();
            document.getElementById('editFirstName').value = profile.first_name || '';
            document.getElementById('editLastName').value = profile.last_name || '';
            document.getElementById('editPhone').value = profile.phone || '';
        }
    } catch(e) { console.error(e); }
}

document.getElementById('formEditProfile')?.addEventListener('submit', async (e) => {
    e.preventDefault();
    const token = localStorage.getItem('token');
    const data = {
        first_name: document.getElementById('editFirstName').value,
        last_name: document.getElementById('editLastName').value,
        phone: document.getElementById('editPhone').value
    };

    try {
        const res = await fetch(`${API_URL}/auth/profile`, {
            method: 'PUT',
            headers: { 
                'Authorization': `Bearer ${token}`,
                'Content-Type': 'application/json'
            },
            body: JSON.stringify(data)
        });
        if(res.ok) {
            showToast("Profile updated successfully!");
            const modal = bootstrap.Modal.getInstance(document.getElementById('editProfileModal'));
            modal.hide();
        } else {
            const err = await res.json();
            showToast(err.detail || "Failed to update profile", true);
        }
    } catch(e) { showToast("Network error", true); }
});

async function loadSummary() {
    try {
        const token = localStorage.getItem('token');
        const res = await fetch(`${API_URL}/dashboard/summary`, {
            headers: { 'Authorization': `Bearer ${token}` }
        });
        if (res.ok) {
            const stats = await res.json();
            document.getElementById('statPatients').textContent = stats.total_patients;
            document.getElementById('statDoctors').textContent = stats.active_doctors;
            document.getElementById('statTodayAppts').textContent = stats.today_appointments;
            document.getElementById('statPendingAppts').textContent = stats.pending_appointments;
        }
    } catch(e) { console.error(e); }
}

async function loadDoctors() {
    try {
        const token = localStorage.getItem('token');
        const res = await fetch(`${API_URL}/doctors`);
        if (res.ok) {
            const doctors = await res.json();
            const tbody = document.getElementById('doctorsList');
            tbody.innerHTML = '';
            if(doctors.length === 0) {
                tbody.innerHTML = '<tr><td colspan="4" class="text-center">No doctors found.</td></tr>';
                return;
            }
            doctors.forEach(doc => {
                const badge = doc.is_active ? '<span class="badge bg-success">Active</span>' : '<span class="badge bg-danger">Inactive</span>';
                tbody.innerHTML += `
                    <tr>
                        <td>#${doc.id}</td>
                        <td>Dr. ${doc.first_name} ${doc.last_name}</td>
                        <td>${doc.specialty || '-'}</td>
                        <td>${badge}</td>
                    </tr>
                `;
            });
        }
    } catch(e) { console.error(e); }
}

async function loadPatients() {
    try {
        const token = localStorage.getItem('token');
        const res = await fetch(`${API_URL}/patients`, {
            headers: { 'Authorization': `Bearer ${token}` }
        });
        if (res.ok) {
            const patients = await res.json();
            const tbody = document.getElementById('patientsList');
            tbody.innerHTML = '';
            if(patients.length === 0) {
                tbody.innerHTML = '<tr><td colspan="3" class="text-center">No patients found.</td></tr>';
                return;
            }
            patients.forEach(pat => {
                tbody.innerHTML += `
                    <tr>
                        <td>#${pat.id}</td>
                        <td>${pat.first_name} ${pat.last_name}</td>
                        <td>${pat.phone || '-'}</td>
                    </tr>
                `;
            });
        }
    } catch(e) { console.error(e); }
}

async function loadAppointments() {
    try {
        const token = localStorage.getItem('token');
        const res = await fetch(`${API_URL}/appointments`, {
            headers: { 'Authorization': `Bearer ${token}` }
        });
        if (res.ok) {
            const appts = await res.json();
            const tbody = document.getElementById('appointmentsList');
            tbody.innerHTML = '';
            if(appts.length === 0) {
                tbody.innerHTML = '<tr><td colspan="5" class="text-center">No appointments found.</td></tr>';
                return;
            }
            appts.forEach(appt => {
                 const badgeClass = appt.status === 'confirmed' ? 'bg-success' : 
                                   appt.status === 'cancelled' ? 'bg-danger' : 
                                   appt.status === 'completed' ? 'bg-primary' : 'bg-warning text-dark';
                tbody.innerHTML += `
                    <tr>
                        <td>#${appt.id}</td>
                        <td>Patient #${appt.patient_id}</td>
                        <td>Dr. #${appt.doctor_id}</td>
                        <td>${appt.appointment_date} <br> <small class="text-secondary">${appt.appointment_time}</small></td>
                        <td><span class="badge ${badgeClass}">${appt.status.toUpperCase()}</span></td>
                    </tr>
                `;
            });
        }
    } catch(e) { console.error(e); }
}

document.getElementById('formAddDoctor').addEventListener('submit', async (e) => {
    e.preventDefault();
    const token = localStorage.getItem('token');
    const data = {
        first_name: document.getElementById('docFirstName').value,
        last_name: document.getElementById('docLastName').value,
        email: document.getElementById('docEmail').value,
        password: document.getElementById('docPassword').value,
        specialty: document.getElementById('docSpecialty').value,
        phone: document.getElementById('docPhone').value,
        is_active: true
    };

    try {
        const res = await fetch(`${API_URL}/doctors`, {
            method: 'POST',
            headers: { 
                'Authorization': `Bearer ${token}`,
                'Content-Type': 'application/json'
            },
            body: JSON.stringify(data)
        });
        if(res.ok) {
            showToast("Doctor added successfully!");
            document.getElementById('formAddDoctor').reset();
            const modal = bootstrap.Modal.getInstance(document.getElementById('addDoctorModal'));
            modal.hide();
            loadDoctors();
            loadSummary();
        } else {
            const err = await res.json();
            showToast(err.detail || "Failed to add doctor", true);
        }
    } catch(e) { showToast("Network error", true); }
});
