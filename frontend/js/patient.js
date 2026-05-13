document.addEventListener('DOMContentLoaded', async () => {
    const user = await checkAuth();
    if (!user || user.role !== 'patient') {
        window.location.href = 'index.html';
        return;
    }

    document.getElementById('userName').textContent = `${user.email}`;
    document.getElementById('welcomeName').textContent = 'Patient';

    await loadDoctors();
    await loadAppointments();
});

async function loadDoctors() {
    try {
        const res = await fetch(`${API_URL}/doctors`);
        if (res.ok) {
            const doctors = await res.json();
            const select = document.getElementById('doctorSelect');
            select.innerHTML = '<option value="" disabled selected>Select a Doctor</option>';
            doctors.forEach(doc => {
                select.innerHTML += `<option value="${doc.id}">Dr. ${doc.first_name} ${doc.last_name} - ${doc.specialty || 'General'}</option>`;
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
                const isPending = appt.status === 'pending';
                const badgeClass = appt.status === 'confirmed' ? 'bg-success' : 
                                   appt.status === 'cancelled' ? 'bg-danger' : 
                                   appt.status === 'completed' ? 'bg-primary' : 'bg-warning text-dark';
                
                tbody.innerHTML += `
                    <tr>
                        <td>Dr. ${appt.doctor_id}</td>
                        <td>${appt.appointment_date}</td>
                        <td>${appt.appointment_time}</td>
                        <td><span class="badge ${badgeClass}">${appt.status.toUpperCase()}</span></td>
                        <td>
                            ${isPending || appt.status === 'confirmed' ? `<button class="btn btn-sm btn-outline-danger" onclick="cancelAppointment(${appt.id})">Cancel</button>` : ''}
                            ${appt.status === 'completed' && appt.consultation_notes ? `<button class="btn btn-sm btn-outline-info" onclick="alert('${appt.consultation_notes.replace(/'/g, "\\'")}')">View Notes</button>` : ''}
                        </td>
                    </tr>
                `;
            });
        }
    } catch(e) { console.error(e); }
}

document.getElementById('formBookAppointment').addEventListener('submit', async (e) => {
    e.preventDefault();
    const token = localStorage.getItem('token');
    
    let timeVal = document.getElementById('appointmentTime').value;
    if(timeVal.length === 5) timeVal += ':00';
    
    const data = {
        doctor_id: parseInt(document.getElementById('doctorSelect').value),
        appointment_date: document.getElementById('appointmentDate').value,
        appointment_time: timeVal,
        reason_for_visit: document.getElementById('reasonForVisit').value
    };

    try {
        const res = await fetch(`${API_URL}/appointments`, {
            method: 'POST',
            headers: { 
                'Authorization': `Bearer ${token}`,
                'Content-Type': 'application/json'
            },
            body: JSON.stringify(data)
        });
        if(res.ok) {
            showToast("Appointment booked successfully!");
            loadAppointments();
            document.getElementById('formBookAppointment').reset();
        } else {
            const err = await res.json();
            showToast(err.detail || "Failed to book appointment", true);
        }
    } catch(e) { showToast("Network error", true); }
});

async function cancelAppointment(id) {
    if(!confirm('Are you sure you want to cancel this appointment?')) return;
    const token = localStorage.getItem('token');
    try {
        const res = await fetch(`${API_URL}/appointments/${id}/status`, {
            method: 'PUT',
            headers: { 
                'Authorization': `Bearer ${token}`,
                'Content-Type': 'application/json'
            },
            body: JSON.stringify({ status: 'cancelled' })
        });
        if(res.ok) {
            showToast("Appointment cancelled");
            loadAppointments();
        } else {
            showToast("Failed to cancel", true);
        }
    } catch(e) { showToast("Network error", true); }
}
