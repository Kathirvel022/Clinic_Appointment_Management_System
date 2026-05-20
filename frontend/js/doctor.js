let notesModalInstance;

document.addEventListener('DOMContentLoaded', async () => {
    const user = await checkAuth();
    if (!user || user.role !== 'doctor') {
        window.location.href = 'index.html';
        return;
    }

    document.getElementById('userName').textContent = `Dr. ${user.email}`;
    await loadProfile();
    notesModalInstance = new bootstrap.Modal(document.getElementById('notesModal'));
    
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
            document.getElementById('editSpecialty').value = profile.specialty || '';
        }
    } catch(e) { console.error(e); }
}

document.getElementById('formEditProfile')?.addEventListener('submit', async (e) => {
    e.preventDefault();
    const token = localStorage.getItem('token');
    const data = {
        first_name: document.getElementById('editFirstName').value,
        last_name: document.getElementById('editLastName').value,
        phone: document.getElementById('editPhone').value,
        specialty: document.getElementById('editSpecialty').value
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
                tbody.innerHTML = '<tr><td colspan="6" class="text-center">No appointments found.</td></tr>';
                return;
            }
            appts.forEach(appt => {
                const badgeClass = appt.status === 'confirmed' ? 'bg-success' : 
                                   appt.status === 'cancelled' ? 'bg-danger' : 
                                   appt.status === 'completed' ? 'bg-primary' : 'bg-warning text-dark';
                
                tbody.innerHTML += `
                    <tr>
                        <td>Patient #${appt.patient_id}</td>
                        <td>${appt.appointment_date}</td>
                        <td>${appt.appointment_time}</td>
                        <td>${appt.reason_for_visit || '-'}</td>
                        <td><span class="badge ${badgeClass}">${appt.status.toUpperCase()}</span></td>
                        <td>
                            ${appt.status !== 'cancelled' && appt.status !== 'completed' ? `
                                <button class="btn btn-sm btn-primary" onclick="openNotesModal(${appt.id}, '${(appt.consultation_notes || '').replace(/'/g, "\\'")}')">Add Notes & Complete</button>
                            ` : (appt.consultation_notes ? `<button class="btn btn-sm btn-outline-info" onclick="alert('${appt.consultation_notes.replace(/'/g, "\\'")}')">View Notes</button>` : '')}
                        </td>
                    </tr>
                `;
            });
        }
    } catch(e) { console.error(e); }
}

function openNotesModal(id, currentNotes) {
    document.getElementById('currentApptId').value = id;
    document.getElementById('consultationNotes').value = currentNotes && currentNotes !== 'null' ? currentNotes : '';
    notesModalInstance.show();
}

async function saveNotes() {
    const id = document.getElementById('currentApptId').value;
    const notes = document.getElementById('consultationNotes').value;
    const token = localStorage.getItem('token');
    
    try {
        const res = await fetch(`${API_URL}/appointments/${id}/notes`, {
            method: 'PUT',
            headers: { 
                'Authorization': `Bearer ${token}`,
                'Content-Type': 'application/json'
            },
            body: JSON.stringify({ consultation_notes: notes, status: 'completed' })
        });
        if(res.ok) {
            showToast("Notes saved and appointment completed.");
            notesModalInstance.hide();
            loadAppointments();
        } else {
            showToast("Failed to save notes", true);
        }
    } catch(e) { showToast("Network error", true); }
}
