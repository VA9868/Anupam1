// Clinic Calendar Data & Logic
let allClinicAppointments = [];
try {
  const rawCalData = document.getElementById('clinicAppointmentsData');
  if (rawCalData) allClinicAppointments = JSON.parse(rawCalData.textContent);
} catch (e) {
  console.error('Error parsing calendar appointments:', e);
}

let calCurrentDate = new Date();
const djangoTodayStr = window.djangoTodayStr || "";
if (djangoTodayStr) {
  const parts = djangoTodayStr.split('-');
  if (parts.length === 3) {
    calCurrentDate = new Date(parseInt(parts[0]), parseInt(parts[1]) - 1, parseInt(parts[2]));
  }
}

let calDisplayYear = calCurrentDate.getFullYear();
let calDisplayMonth = calCurrentDate.getMonth();
let calSelectedDateStr = formatCalDate(calCurrentDate);

function formatCalDate(d) {
  const y = d.getFullYear();
  const m = String(d.getMonth() + 1).padStart(2, '0');
  const day = String(d.getDate()).padStart(2, '0');
  return `${y}-${m}-${day}`;
}

function openClinicCalendar() {
  openModal('clinicCalendarModal');
  renderClinicCalendar();
}

function changeCalMonth(delta) {
  calDisplayMonth += delta;
  if (calDisplayMonth < 0) {
    calDisplayMonth = 11;
    calDisplayYear -= 1;
  } else if (calDisplayMonth > 11) {
    calDisplayMonth = 0;
    calDisplayYear += 1;
  }
  renderClinicCalendar();
}

function jumpCalToToday() {
  calDisplayYear = calCurrentDate.getFullYear();
  calDisplayMonth = calCurrentDate.getMonth();
  calSelectedDateStr = formatCalDate(calCurrentDate);
  renderClinicCalendar();
}

function selectCalDate(dateStr) {
  calSelectedDateStr = dateStr;
  renderClinicCalendar();
}

function renderClinicCalendar() {
  const monthNames = ["January", "February", "March", "April", "May", "June", "July", "August", "September", "October", "November", "December"];
  const titleEl = document.getElementById('calMonthYearTitle');
  if (titleEl) {
    titleEl.textContent = `${monthNames[calDisplayMonth]} ${calDisplayYear}`;
  }

  const gridEl = document.getElementById('calDaysGrid');
  if (!gridEl) return;
  gridEl.innerHTML = '';

  const firstDay = new Date(calDisplayYear, calDisplayMonth, 1);
  let startDayOfWeek = (firstDay.getDay() + 6) % 7;
  const daysInMonth = new Date(calDisplayYear, calDisplayMonth + 1, 0).getDate();
  const prevMonthDays = new Date(calDisplayYear, calDisplayMonth, 0).getDate();

  const todayFormatted = formatCalDate(calCurrentDate);

  for (let i = startDayOfWeek - 1; i >= 0; i--) {
    const pDay = prevMonthDays - i;
    const cell = document.createElement('div');
    cell.className = 'cal-day-cell other-month';
    cell.innerHTML = `<span class="cal-day-num">${pDay}</span>`;
    gridEl.appendChild(cell);
  }

  for (let day = 1; day <= daysInMonth; day++) {
    const thisDate = new Date(calDisplayYear, calDisplayMonth, day);
    const dateStr = formatCalDate(thisDate);
    const dayOfWeek = (thisDate.getDay() + 6) % 7;
    const isTue = (dayOfWeek === 1);
    const isToday = (dateStr === todayFormatted);
    const isSelected = (dateStr === calSelectedDateStr);

    const matchingAppts = allClinicAppointments.filter(a => a.date === dateStr);

    const cell = document.createElement('div');
    let cellClasses = ['cal-day-cell'];
    if (isToday) cellClasses.push('today');
    if (isSelected) cellClasses.push('selected');
    if (isTue) cellClasses.push('tuesday');
    cell.className = cellClasses.join(' ');
    cell.onclick = () => selectCalDate(dateStr);

    let apptHtml = '';
    if (matchingAppts.length > 0) {
      apptHtml = `<span class="cal-appt-dot" title="${matchingAppts.length} appointments"><i class="fas fa-circle" style="font-size: 5px;"></i> ${matchingAppts.length} ${matchingAppts.length === 1 ? 'appt' : 'appts'}</span>`;
    } else if (isTue) {
      apptHtml = `<span style="font-size: 0.65rem; color: #b45309; font-weight: 600;">Holiday</span>`;
    }

    cell.innerHTML = `
          <div style="display: flex; justify-content: space-between; align-items: center;">
            <span class="cal-day-num">${day}</span>
            ${isToday ? '<span style="font-size: 0.6rem; color: #2563eb; font-weight: 800; background: #dbeafe; padding: 1px 4px; border-radius: 3px;">TODAY</span>' : ''}
          </div>
          ${apptHtml}
        `;
    gridEl.appendChild(cell);
  }

  const totalRendered = startDayOfWeek + daysInMonth;
  const remaining = (7 - (totalRendered % 7)) % 7;
  for (let n = 1; n <= remaining; n++) {
    const cell = document.createElement('div');
    cell.className = 'cal-day-cell other-month';
    cell.innerHTML = `<span class="cal-day-num">${n}</span>`;
    gridEl.appendChild(cell);
  }

  renderSelectedDateSchedule();
}

function renderSelectedDateSchedule() {
  const titleEl = document.getElementById('calSelectedDateTitle');
  const countEl = document.getElementById('calSelectedApptCount');
  const listEl = document.getElementById('calApptList');
  if (!listEl) return;

  let displayDateText = calSelectedDateStr;
  try {
    const parts = calSelectedDateStr.split('-');
    const d = new Date(parts[0], parts[1] - 1, parts[2]);
    displayDateText = d.toLocaleDateString('en-US', { weekday: 'short', month: 'short', day: 'numeric', year: 'numeric' });
  } catch (e) { }

  if (titleEl) {
    titleEl.textContent = `Schedule for ${displayDateText}`;
  }

  const appts = allClinicAppointments.filter(a => a.date === calSelectedDateStr);

  if (countEl) {
    countEl.textContent = `${appts.length} Scheduled`;
    countEl.style.display = appts.length > 0 ? 'inline-block' : 'none';
  }

  if (appts.length === 0) {
    listEl.innerHTML = `
          <div style="text-align: center; padding: 20px 16px; color: #94a3b8;">
            <i class="far fa-calendar-times" style="font-size: 1.8rem; margin-bottom: 6px; color: #cbd5e1; display: block;"></i>
            <p style="margin: 0; font-size: 0.875rem; font-weight: 500; color: #64748b;">No appointments scheduled for this date.</p>
          </div>
        `;
    return;
  }

  listEl.innerHTML = appts.map(a => `
        <div class="cal-appt-card">
          <div style="display: flex; align-items: center; gap: 12px;">
            <div style="background: #eff6ff; color: #2563eb; font-weight: 700; font-size: 0.75rem; padding: 6px 10px; border-radius: 6px; text-align: center; min-width: 75px;">
              ${a.time}
            </div>
            <div>
              <a href="javascript:void(0)" class="patient-link-btn" title="Open Teeth Chart &amp; Payment" onclick="closeModal('clinicCalendarModal'); openPatientClinicalHub('${a.id}', '${a.code}', '${escapeHtml(a.patient)}', '${escapeHtml(a.phone || '')}', '${escapeHtml(a.age || '')}', '${escapeHtml(a.gender || '')}', '${escapeHtml(a.service || '')}', '${escapeHtml(a.doctor || '')}', 'chart')">
                <i class="fas fa-tooth" style="color: #2563eb; font-size: 0.8rem;"></i>
                <strong style="color: #0f172a; font-size: 0.9rem;">${escapeHtml(a.patient)}</strong>
                <i class="fas fa-external-link-alt patient-link-icon"></i>
              </a>
              <span style="font-size: 0.75rem; color: #64748b; margin-left: 6px;">(${a.code})</span>
              <div style="font-size: 0.775rem; color: #475569; margin-top: 2px;">
                <i class="fas fa-stethoscope" style="color: #0e7490; font-size: 0.7rem;"></i> ${escapeHtml(a.service)} &bull; 
                <i class="fas fa-user-md" style="color: #64748b; font-size: 0.7rem;"></i> ${escapeHtml(a.doctor)}
              </div>
            </div>
          </div>
          <div style="display: flex; align-items: center; gap: 8px;">
            <button type="button" class="btn-quick-pill btn-pill-chart" onclick="closeModal('clinicCalendarModal'); openPatientClinicalHub('${a.id}', '${a.code}', '${escapeHtml(a.patient)}', '${escapeHtml(a.phone || '')}', '${escapeHtml(a.age || '')}', '${escapeHtml(a.gender || '')}', '${escapeHtml(a.service || '')}', '${escapeHtml(a.doctor || '')}', 'chart')">
              <i class="fas fa-tooth"></i> Chart
            </button>
            <button type="button" class="btn-quick-pill btn-pill-pay" onclick="closeModal('clinicCalendarModal'); openPatientClinicalHub('${a.id}', '${a.code}', '${escapeHtml(a.patient)}', '${escapeHtml(a.phone || '')}', '${escapeHtml(a.age || '')}', '${escapeHtml(a.gender || '')}', '${escapeHtml(a.service || '')}', '${escapeHtml(a.doctor || '')}', 'payment')">
              <i class="fas fa-receipt"></i> Pay
            </button>
            <span class="badge ${a.status === 'confirmed' ? 'badge-completed' : (a.status === 'pending' ? 'badge-pending' : 'badge-overdue')}" style="text-transform: capitalize;">
              ${a.status}
            </span>
          </div>
        </div>
      `).join('');
}

function switchTab(sectionKey, event) {
  if (event) event.preventDefault();

  document.querySelectorAll('.nav-link').forEach(link => {
    link.classList.remove('active');
  });
  const activeLink = document.querySelector(`.nav-link[data-section="${sectionKey}"]`);
  if (activeLink) activeLink.classList.add('active');

  document.querySelectorAll('.content-section').forEach(sec => {
    sec.style.display = 'none';
  });

  const targetSec = document.getElementById(`section-${sectionKey}`);
  if (targetSec) {
    targetSec.style.display = 'block';
    targetSec.scrollIntoView({ behavior: 'smooth', block: 'start' });
  }

  if (sectionKey === 'personal') {
    renderPersonalTreatments();
  }

  const headingEl = document.getElementById('pageHeading');
  if (headingEl) {
    if (sectionKey === 'about') {
      headingEl.textContent = 'About';
    } else if (sectionKey === 'gallery') {
      headingEl.textContent = 'Clinic & Smile Gallery';
    } else if (sectionKey === 'services') {
      headingEl.textContent = 'Services';
    } else {
      headingEl.textContent = sectionKey.charAt(0).toUpperCase() + sectionKey.slice(1);
    }
  }

  const sidebarEl = document.getElementById('sidebar');
  if (sidebarEl) sidebarEl.classList.remove('open');
}

function toggleSidebar() {
  const sidebarEl = document.getElementById('sidebar');
  if (sidebarEl) sidebarEl.classList.toggle('open');
}

function toggleProfileDropdown() {
  const dd = document.getElementById('profileDropdown');
  if (dd) dd.classList.toggle('show');
}

window.addEventListener('click', function (e) {
  const userPill = document.querySelector('.user-pill');
  const dropdown = document.getElementById('profileDropdown');
  if (userPill && dropdown && !userPill.contains(e.target)) {
    dropdown.classList.remove('show');
  }
});

function toggleNotifications() {
  alert("Clinic Notifications:\n- 2 Dental lab deliveries arriving today\n- Dr. Priya has 4 clear aligner consults scheduled\n- 1 overdue case pending lab shade verification");
}

function openModal(modalId) {
  const modal = document.getElementById(modalId);
  if (modal) {
    modal.classList.add('active');
    modal.style.display = 'flex';
  }
}
window.openModal = openModal;

function closeModal(modalId) {
  const modal = document.getElementById(modalId);
  if (modal) {
    modal.classList.remove('active');
    modal.style.display = 'none';
  }
}
window.closeModal = closeModal;

function openUploadSmileMakeoverModal() {
  openModal('uploadSmileMakeoverModal');
}
window.openUploadSmileMakeoverModal = openUploadSmileMakeoverModal;

document.querySelectorAll('.modal-backdrop').forEach(modal => {
  modal.addEventListener('click', function (e) {
    if (e.target === modal) closeModal(modal.id);
  });
});

function filterCasesTable(customVal) {
  const topSearch = document.getElementById('dashboardSearch');
  const tableSearch = document.getElementById('casesSearchInput');
  const clearBtn = document.getElementById('clearCasesSearchBtn');

  let query = "";
  if (typeof customVal === 'string') {
    query = customVal.toLowerCase().trim();
    if (topSearch && topSearch !== document.activeElement) topSearch.value = customVal;
    if (tableSearch && tableSearch !== document.activeElement) tableSearch.value = customVal;
  } else {
    const activeSearch = (document.activeElement === tableSearch) ? tableSearch : (topSearch || tableSearch);
    query = (activeSearch ? activeSearch.value : '').toLowerCase().trim();
    if (topSearch && topSearch !== activeSearch) topSearch.value = query;
    if (tableSearch && tableSearch !== activeSearch) tableSearch.value = query;
  }

  if (clearBtn) {
    clearBtn.style.display = query ? 'block' : 'none';
  }

  const rows = document.querySelectorAll('.case-row');
  let visibleCount = 0;
  rows.forEach(row => {
    const text = (row.getAttribute('data-search') || '').toLowerCase();
    if (text.includes(query)) {
      row.style.display = '';
      visibleCount++;
    } else {
      row.style.display = 'none';
    }
  });

  const noResultsRow = document.getElementById('casesNoResultsRow');
  if (noResultsRow) {
    noResultsRow.style.display = (visibleCount === 0 && rows.length > 0) ? '' : 'none';
  }
}
window.filterCasesTable = filterCasesTable;

function clearCasesSearch() {
  const topSearch = document.getElementById('dashboardSearch');
  const tableSearch = document.getElementById('casesSearchInput');
  const clearBtn = document.getElementById('clearCasesSearchBtn');
  if (topSearch) topSearch.value = '';
  if (tableSearch) tableSearch.value = '';
  if (clearBtn) clearBtn.style.display = 'none';
  filterCasesTable('');
}
window.clearCasesSearch = clearCasesSearch;

function filterStatus(status) {
  const panel = document.querySelector('#section-dashboard .dash-panel');
  if (panel) {
    panel.querySelectorAll('.filter-btn').forEach(btn => btn.classList.remove('active'));
  }
  if (event && event.target && event.target.classList.contains('filter-btn')) {
    event.target.classList.add('active');
  }

  const rows = document.querySelectorAll('.case-row');
  rows.forEach(row => {
    if (status === 'all' || row.getAttribute('data-status') === status) {
      row.style.display = '';
    } else {
      row.style.display = 'none';
    }
  });
}

let currentApptDateType = 'today';
let currentApptCustomDate = '';
let currentApptSearchQuery = '';

function applyAppointmentsFilter() {
  const now = new Date();
  const yyyy = now.getFullYear();
  const mm = String(now.getMonth() + 1).padStart(2, '0');
  const dd = String(now.getDate()).padStart(2, '0');
  const todayVal = `${yyyy}-${mm}-${dd}`;

  const rows = document.querySelectorAll('.appointment-row');
  let visibleCount = 0;

  rows.forEach(row => {
    let rowDate = (row.getAttribute('data-date') || '').trim();
    let showDate = false;

    if (currentApptDateType === 'all') {
      showDate = true;
    } else if (currentApptDateType === 'today') {
      showDate = (rowDate === todayVal || rowDate.startsWith(todayVal));
    } else if (currentApptDateType === 'upcoming') {
      showDate = (rowDate >= todayVal);
    } else if (currentApptDateType === 'past') {
      showDate = (rowDate < todayVal);
    } else if (currentApptDateType === 'custom' && currentApptCustomDate) {
      showDate = (rowDate === currentApptCustomDate || rowDate.startsWith(currentApptCustomDate));
    }

    let showSearch = true;
    if (currentApptSearchQuery) {
      const patientName = (row.getAttribute('data-patient') || row.innerText || '').toLowerCase();
      showSearch = patientName.includes(currentApptSearchQuery);
    }

    if (showDate && showSearch) {
      row.style.display = '';
      visibleCount++;
    } else {
      row.style.display = 'none';
    }
  });

  const noResults = document.getElementById('apptNoResultsRow');
  if (noResults) {
    noResults.style.display = (visibleCount === 0 && rows.length > 0) ? '' : 'none';
  }
}

function filterAppointmentsDate(type, customDate) {
  currentApptDateType = type;
  currentApptCustomDate = customDate || '';

  const apptSection = document.getElementById('section-appointments');
  if (apptSection) {
    apptSection.querySelectorAll('.filter-btn').forEach(btn => btn.classList.remove('active'));
  }

  const now = new Date();
  const yyyy = now.getFullYear();
  const mm = String(now.getMonth() + 1).padStart(2, '0');
  const dd = String(now.getDate()).padStart(2, '0');
  const todayVal = `${yyyy}-${mm}-${dd}`;

  const picker = document.getElementById('apptDatePicker');

  if (type === 'all') {
    const b = document.getElementById('btnApptAll');
    if (b) b.classList.add('active');
    if (picker) picker.value = '';
  } else if (type === 'today') {
    const b = document.getElementById('btnApptToday');
    if (b) b.classList.add('active');
    if (picker) picker.value = todayVal;
  } else if (type === 'upcoming') {
    const b = document.getElementById('btnApptUpcoming');
    if (b) b.classList.add('active');
  } else if (type === 'past') {
    const b = document.getElementById('btnApptPast');
    if (b) b.classList.add('active');
  } else if (type === 'custom') {
    if (customDate === todayVal) {
      const b = document.getElementById('btnApptToday');
      if (b) b.classList.add('active');
    }
  }

  applyAppointmentsFilter();
}

function filterAppointmentsSearch(query) {
  currentApptSearchQuery = (query || '').toLowerCase().trim();
  applyAppointmentsFilter();
}

window.filterAppointmentsDate = filterAppointmentsDate;
window.filterAppointmentsSearch = filterAppointmentsSearch;

function openCaseDetails(id, caseId, patient, doctor, type, status, dueDate, amount, notes) {
  document.getElementById('vcTitle').innerHTML = `<i class="fas fa-folder-open" style="color: #2563eb; margin-right: 8px;"></i>Case: ${caseId}`;
  document.getElementById('vcCaseId').textContent = caseId;
  document.getElementById('vcPatient').textContent = patient;
  document.getElementById('vcDoctor').textContent = doctor;
  document.getElementById('vcType').textContent = type;
  document.getElementById('vcDueDate').textContent = dueDate;
  document.getElementById('vcAmount').textContent = amount;
  document.getElementById('vcNotes').textContent = notes || 'No special clinical notes recorded.';
  document.getElementById('vcUpdateStatus').value = status;

  document.getElementById('updateCaseStatusForm').action = `/dashboard/update-case-status/${id}/`;
  openModal('viewCaseModal');
}

function previewDoctorPhoto(input) {
  if (input.files && input.files[0]) {
    const reader = new FileReader();
    reader.onload = function (e) {
      const preview = document.getElementById('doctorPhotoPreview');
      const icon = document.getElementById('doctorPhotoPlaceholderIcon');
      if (preview && icon) {
        preview.src = e.target.result;
        preview.style.display = 'block';
        icon.style.display = 'none';
      }
    };
    reader.readAsDataURL(input.files[0]);
  }
}

function openEditDoctorModalFromBtn(btn) {
  const id = btn.getAttribute('data-id');
  const name = btn.getAttribute('data-name');
  const regNo = btn.getAttribute('data-regno');
  const designation = btn.getAttribute('data-designation');
  const qualification = btn.getAttribute('data-qual');
  const availableDays = btn.getAttribute('data-days');
  const bio = btn.getAttribute('data-bio');
  const photoUrl = btn.getAttribute('data-photo');

  openEditDoctorModal(id, name, regNo, designation, qualification, availableDays, bio, photoUrl);
}

function openEditDoctorModal(id, name, regNo, designation, qualification, availableDays, bio, photoUrl) {
  document.getElementById('editDoctorForm').action = `/dashboard/edit-doctor/${id}/`;
  document.getElementById('edit_doc_name').value = name || '';
  document.getElementById('edit_doc_reg_no').value = regNo || '';
  document.getElementById('edit_doc_designation').value = designation || '';
  document.getElementById('edit_doc_qual').value = qualification || '';
  document.getElementById('edit_doc_days').value = availableDays || '';
  document.getElementById('edit_doc_bio').value = bio || '';

  const preview = document.getElementById('editDoctorPhotoPreview');
  const icon = document.getElementById('editDoctorPhotoPlaceholderIcon');
  const fileInput = document.getElementById('edit_doc_photo');
  if (fileInput) fileInput.value = '';

  if (photoUrl && photoUrl.trim() !== '') {
    preview.src = photoUrl;
    preview.style.display = 'block';
    icon.style.display = 'none';
  } else {
    preview.src = '';
    preview.style.display = 'none';
    icon.style.display = 'block';
  }
  openModal('editDoctorModal');
}

function previewEditDoctorPhoto(input) {
  if (input.files && input.files[0]) {
    const reader = new FileReader();
    reader.onload = function (e) {
      const preview = document.getElementById('editDoctorPhotoPreview');
      const icon = document.getElementById('editDoctorPhotoPlaceholderIcon');
      if (preview && icon) {
        preview.src = e.target.result;
        preview.style.display = 'block';
        icon.style.display = 'none';
      }
    };
    reader.readAsDataURL(input.files[0]);
  }
}

// ==========================================
// CLINICAL SERVICES & SERVICES-GRID CONNECT
// ==========================================
function previewServiceIcon(input, imgPreviewId, faIconId) {
  const img = document.getElementById(imgPreviewId);
  const fa = document.getElementById(faIconId);
  if (input.files && input.files[0]) {
    const reader = new FileReader();
    reader.onload = function (e) {
      if (img) {
        img.src = e.target.result;
        img.style.display = 'block';
      }
      if (fa) {
        fa.style.display = 'none';
      }
    };
    reader.readAsDataURL(input.files[0]);
  }
}

function updateServiceIconSelect(iconName, imgPreviewId, faIconId) {
  const img = document.getElementById(imgPreviewId);
  const fa = document.getElementById(faIconId);
  if (img && img.style.display === 'block') {
    img.style.display = 'none';
    img.src = '';
  }
  if (fa) {
    fa.style.display = 'block';
    fa.className = `fas fa-${iconName || 'tooth'}`;
  }
}

function handleCategoryIconDefault(category, mode) {
  const iconMap = {
    'general': 'pump-soap',
    'cosmetic': 'sparkles',
    'implant': 'shield-virus',
    'ortho': 'smile',
    'rootcanal': 'tooth',
    'pediatric': 'child'
  };
  const defIcon = iconMap[category] || 'tooth';
  const selectId = mode === 'add' ? 'svc_icon' : 'edit_svc_icon';
  const imgId = mode === 'add' ? 'addSvcIconImg' : 'editSvcIconImg';
  const faId = mode === 'add' ? 'addSvcIconFa' : 'editSvcIconFa';

  const sel = document.getElementById(selectId);
  if (sel) {
    sel.value = defIcon;
    updateServiceIconSelect(defIcon, imgId, faId);
  }
}

function openEditServiceModalFromBtn(btn) {
  const id = btn.getAttribute('data-id');
  const title = btn.getAttribute('data-title');
  const category = btn.getAttribute('data-category');
  const icon = btn.getAttribute('data-icon');
  const shortDesc = btn.getAttribute('data-short');
  const detailDesc = btn.getAttribute('data-detail');
  const duration = btn.getAttribute('data-duration');
  const price = btn.getAttribute('data-price');
  const badge = btn.getAttribute('data-badge');
  const featured = btn.getAttribute('data-featured') === '1';
  const imageUrl = btn.getAttribute('data-image');

  document.getElementById('editServiceForm').action = `/dashboard/edit-service/${id}/`;
  document.getElementById('edit_svc_title').value = title || '';
  document.getElementById('edit_svc_category').value = category || 'general';
  document.getElementById('edit_svc_icon').value = icon || 'tooth';
  document.getElementById('edit_svc_short_desc').value = shortDesc || '';
  document.getElementById('edit_svc_detailed_desc').value = detailDesc || '';
  document.getElementById('edit_svc_duration').value = duration || '';
  document.getElementById('edit_svc_price').value = price || '';
  document.getElementById('edit_svc_badge').value = badge || '';
  document.getElementById('edit_svc_featured').checked = featured;

  const imgPreview = document.getElementById('editSvcIconImg');
  const faIcon = document.getElementById('editSvcIconFa');
  const fileInput = document.getElementById('edit_svc_image');
  if (fileInput) fileInput.value = '';

  if (imageUrl && imageUrl.trim() !== '') {
    imgPreview.src = imageUrl;
    imgPreview.style.display = 'block';
    if (faIcon) faIcon.style.display = 'none';
  } else {
    imgPreview.src = '';
    imgPreview.style.display = 'none';
    if (faIcon) {
      faIcon.style.display = 'block';
      faIcon.className = `fas fa-${icon || 'tooth'}`;
    }
  }

  openModal('editServiceModal');
}

function filterDashboardServices() {
  const searchInput = document.getElementById('serviceSearchInput');
  if (!searchInput) return;
  const query = searchInput.value.toLowerCase().trim();
  const cards = document.querySelectorAll('.dash-service-card');

  cards.forEach(card => {
    const text = (card.getAttribute('data-search') || '').toLowerCase();
    if (text.includes(query)) {
      card.style.display = 'flex';
    } else {
      card.style.display = 'none';
    }
  });
}

function filterServiceCategory(cat, btn) {
  document.querySelectorAll('.svc-cat-btn').forEach(b => b.classList.remove('active'));
  if (btn) btn.classList.add('active');

  const cards = document.querySelectorAll('.dash-service-card');
  cards.forEach(card => {
    const itemCat = card.getAttribute('data-category');
    if (cat === 'all' || itemCat === cat) {
      card.style.display = 'flex';
    } else {
      card.style.display = 'none';
    }
  });
}

// Close modals on Escape key
window.addEventListener('keydown', function (e) {
  if (e.key === 'Escape') {
    document.querySelectorAll('.modal-backdrop.active').forEach(m => m.classList.remove('active'));
  }
});

// ==========================================
// PERSONAL TREATMENTS LOGIC (ID, TREATMENT, RATE, AMOUNT)
// ==========================================
const defaultTreatments = [
  { id: '1', treatment: 'Single-Visit Root Canal Treatment (RCT)', rate: 3500, amount: 3500 },
  { id: '2', treatment: 'Dental Implant & Crown (Titanium)', rate: 18000, amount: 18000 },
  { id: '3', treatment: 'Ultrasonic Scaling & Deep Cleaning', rate: 1200, amount: 1200 },
  { id: '4', treatment: 'Laser Teeth Whitening (Single Session)', rate: 2999, amount: 2999 },
  { id: '5', treatment: 'Multi-layer Zirconia Crown', rate: 5500, amount: 5500 },
  { id: '6', treatment: 'Invisible Clear Aligners (Initial Arch)', rate: 39999, amount: 39999 },
  { id: '7', treatment: 'Painless Surgical Tooth Extraction', rate: 1500, amount: 1500 }
];

function getPersonalTreatments() {
  try {
    const stored = localStorage.getItem('clinic_personal_treatments');
    if (stored) {
      const parsed = JSON.parse(stored);
      if (Array.isArray(parsed) && parsed.length > 0) return parsed;
    }
  } catch (e) {
    console.error('Error reading personal treatments:', e);
  }
  return defaultTreatments;
}

function savePersonalTreatments(items) {
  localStorage.setItem('clinic_personal_treatments', JSON.stringify(items));
  renderPersonalTreatments();
}

function renderPersonalTreatments() {
  const tbody = document.getElementById('personalTreatmentsTableBody');
  if (!tbody) return;
  const treatments = getPersonalTreatments();
  const searchEl = document.getElementById('treatmentSearchInput');
  const searchQuery = (searchEl ? searchEl.value : '').toLowerCase().trim();

  const filtered = treatments.filter(t => {
    if (!searchQuery) return true;
    return (t.id && t.id.toLowerCase().includes(searchQuery)) ||
      (t.treatment && t.treatment.toLowerCase().includes(searchQuery)) ||
      String(t.rate).includes(searchQuery) ||
      String(t.amount).includes(searchQuery);
  });

  if (filtered.length === 0) {
    tbody.innerHTML = `<tr><td colspan="5" class="empty-row-td"><i class="fas fa-tooth" style="font-size: 1.8rem; margin-bottom: 6px; display: block; color: #cbd5e1;"></i>No treatments found. Click <strong>New Treatment</strong> to add one.</td></tr>`;
    return;
  }

  tbody.innerHTML = filtered.map((t) => {
    const origIdx = treatments.findIndex(item => item.id === t.id);
    const rateFormatted = Number(t.rate || 0).toLocaleString('en-IN', { minimumFractionDigits: 2, maximumFractionDigits: 2 });
    const amountFormatted = Number(t.amount || 0).toLocaleString('en-IN', { minimumFractionDigits: 2, maximumFractionDigits: 2 });
    return `
          <tr class="treatment-row">
            <td><strong class="case-id-badge" style="color: #2563eb;">${escapeHtml(t.id)}</strong></td>
            <td>
              <div style="font-weight: 600; color: #0f172a;">${escapeHtml(t.treatment)}</div>
            </td>
            <td style="font-weight: 600; color: #334155;">₹${rateFormatted}</td>
            <td style="font-weight: 700; color: #059669;">₹${amountFormatted}</td>
            <td style="text-align: right; white-space: nowrap;">
              <button type="button" class="btn-sm" style="background: #eff6ff; color: #2563eb; border: 1px solid #bfdbfe; padding: 6px 12px; border-radius: 6px; font-size: 0.775rem; font-weight: 600; cursor: pointer; margin-right: 6px; display: inline-flex; align-items: center; gap: 5px;" onclick="openEditTreatmentModal(${origIdx})" title="Edit Treatment">
                <i class="fas fa-edit"></i> Edit
              </button>
              <button type="button" class="btn-sm" style="background: #fef2f2; color: #ef4444; border: 1px solid #fecaca; padding: 6px 12px; border-radius: 6px; font-size: 0.775rem; font-weight: 600; cursor: pointer; display: inline-flex; align-items: center; gap: 5px;" onclick="deleteTreatment(${origIdx})" title="Delete Treatment">
                <i class="fas fa-trash-alt"></i> Delete
              </button>
            </td>
          </tr>
        `;
  }).join('');
}

function escapeHtml(str) {
  if (!str) return '';
  return String(str).replace(/[&<>"']/g, function (m) {
    return { '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;', "'": '&#39;' }[m];
  });
}

function openNewTreatmentModal() {
  const treatments = getPersonalTreatments();
  let nextNum = treatments.length + 1;
  let nextId = `TRT-${String(nextNum).padStart(3, '0')}`;
  while (treatments.some(t => t.id && t.id.toUpperCase() === nextId.toUpperCase())) {
    nextNum++;
    nextId = `TRT-${String(nextNum).padStart(3, '0')}`;
  }

  document.getElementById('treatmentModalTitle').innerHTML = '<i class="fas fa-tooth" style="color: #2563eb; margin-right: 8px;"></i>New Treatment';
  document.getElementById('treatment_edit_index').value = '-1';
  document.getElementById('trt_id').value = nextId;
  document.getElementById('trt_name').value = '';
  document.getElementById('trt_rate').value = '';
  document.getElementById('trt_amount').value = '';
  openModal('newTreatmentModal');
}

function openEditTreatmentModal(index) {
  const treatments = getPersonalTreatments();
  const item = treatments[index];
  if (!item) return;

  document.getElementById('treatmentModalTitle').innerHTML = '<i class="fas fa-edit" style="color: #2563eb; margin-right: 8px;"></i>Edit Treatment';
  document.getElementById('treatment_edit_index').value = index;
  document.getElementById('trt_id').value = item.id;
  document.getElementById('trt_name').value = item.treatment;
  document.getElementById('trt_rate').value = item.rate;
  document.getElementById('trt_amount').value = item.amount;
  openModal('newTreatmentModal');
}

function handleRateInput(val) {
  const amountInput = document.getElementById('trt_amount');
  if (amountInput && (!amountInput.value || amountInput.dataset.manual !== 'true')) {
    amountInput.value = val;
  }
}

document.addEventListener('DOMContentLoaded', function () {
  const amountInput = document.getElementById('trt_amount');
  if (amountInput) {
    amountInput.addEventListener('input', function () {
      amountInput.dataset.manual = 'true';
    });
  }
  renderPersonalTreatments();
});

function handleSaveTreatment(e) {
  e.preventDefault();
  const editIdx = parseInt(document.getElementById('treatment_edit_index').value, 10);
  const id = document.getElementById('trt_id').value.trim();
  const treatment = document.getElementById('trt_name').value.trim();
  const rate = parseFloat(document.getElementById('trt_rate').value) || 0;
  const amount = parseFloat(document.getElementById('trt_amount').value) || 0;

  if (!id || !treatment) {
    alert('Please fill in both Treatment ID and Treatment Name.');
    return;
  }

  const treatments = getPersonalTreatments();

  const duplicate = treatments.some((t, i) => i !== editIdx && t.id.toLowerCase() === id.toLowerCase());
  if (duplicate) {
    alert(`Treatment ID "${id}" already exists. Please choose a unique ID.`);
    return;
  }

  const treatmentData = { id, treatment, rate, amount };

  if (editIdx >= 0 && editIdx < treatments.length) {
    treatments[editIdx] = treatmentData;
  } else {
    treatments.unshift(treatmentData);
  }

  savePersonalTreatments(treatments);
  closeModal('newTreatmentModal');
}

function deleteTreatment(index) {
  const treatments = getPersonalTreatments();
  const item = treatments[index];
  if (!item) return;
  if (confirm(`Are you sure you want to delete treatment "${item.treatment}" (${item.id})?`)) {
    treatments.splice(index, 1);
    savePersonalTreatments(treatments);
  }
}

function filterTreatmentsTable() {
  renderPersonalTreatments();
}

// ==========================================
// PATIENT SLIP GRID PDF CONNECT & OPEN
// ==========================================
function openSlipGridModal() {
  openModal('slipGridModal');
}

function toggleSlipPrefillMode(mode) {
  const fillSection = document.getElementById('slipFillFields');
  if (fillSection) {
    fillSection.style.display = (mode === 'blank') ? 'none' : 'block';
  }
}

function toggleSlipFormat(val) {
  const prefillWrap = document.getElementById('gridPrefillAllWrap');
  if (prefillWrap) {
    prefillWrap.style.display = (val === '8_card') ? 'block' : 'none';
  }
}
window.toggleSlipFormat = toggleSlipFormat;

function loadPatientIntoSlip(selectEl) {
  if (!selectEl || !selectEl.value) return;
  const opt = selectEl.options[selectEl.selectedIndex];
  if (!opt) return;

  const name = opt.getAttribute('data-name') || '';
  const age = opt.getAttribute('data-age') || '';
  const gender = opt.getAttribute('data-gender') || 'Male';
  const address = opt.getAttribute('data-address') || '';
  const pid = opt.getAttribute('data-pid') || '';
  const id = opt.getAttribute('data-id') || '001';

  if (document.getElementById('grid_name')) document.getElementById('grid_name').value = name;
  if (document.getElementById('grid_age')) document.getElementById('grid_age').value = age;
  if (document.getElementById('grid_gender')) document.getElementById('grid_gender').value = gender;
  if (document.getElementById('grid_address')) document.getElementById('grid_address').value = address;
  if (document.getElementById('grid_pid')) document.getElementById('grid_pid').value = pid;
  if (document.getElementById('grid_reg')) document.getElementById('grid_reg').value = 'REG-' + id;
}

function generateSlipGridPDF() {
  const format = document.querySelector('input[name="slip_format"]:checked')?.value || 'single_card';
  const mode = document.querySelector('input[name="slip_mode"]:checked')?.value || 'filled';
  const isSingle = (format === 'single_card');
  let url = `/dashboard/print-slip-grid/?single_card=${isSingle ? '1' : '0'}&source=personal`;

  if (mode === 'blank') {
    window.open(url, '_blank');
    closeModal('slipGridModal');
    return;
  }

  const reg = encodeURIComponent((document.getElementById('grid_reg')?.value || '').trim());
  const pid = encodeURIComponent((document.getElementById('grid_pid')?.value || '').trim());
  const date = encodeURIComponent((document.getElementById('grid_date')?.value || '').trim());
  const name = encodeURIComponent((document.getElementById('grid_name')?.value || '').trim());
  const age = encodeURIComponent((document.getElementById('grid_age')?.value || '').trim());
  const gender = encodeURIComponent((document.getElementById('grid_gender')?.value || '').trim());
  const address = encodeURIComponent((document.getElementById('grid_address')?.value || '').trim());
  const prefillAll = document.getElementById('grid_prefill_all')?.checked ? '1' : '0';

  url += `&reg_no=${reg}&pid=${pid}&date=${date}&name=${name}&age=${age}&gender=${gender}&address=${address}&prefill_all=${prefillAll}`;
  window.open(url, '_blank');
  closeModal('slipGridModal');
}
window.generateSlipGridPDF = generateSlipGridPDF;

// ==========================================
// CASE DETAILS BUTTON HELPER
// ==========================================
function openCaseDetailsFromBtn(btn) {
  if (!btn) return;
  const id = btn.getAttribute('data-id');
  const caseId = btn.getAttribute('data-case-id');
  const patient = btn.getAttribute('data-patient');
  const doctor = btn.getAttribute('data-doctor');
  const type = btn.getAttribute('data-type');
  const status = btn.getAttribute('data-status');
  const dueDate = btn.getAttribute('data-due');
  const amount = btn.getAttribute('data-amount');
  const notes = btn.getAttribute('data-notes');
  openCaseDetails(id, caseId, patient, doctor, type, status, dueDate, amount, notes);
}

// =========================================================================
// PATIENT CLINICAL HUB: TEETH CHART (ODONTOGRAM) & BILLING / PAYMENTS
// =========================================================================
let allClinicInvoices = [];
try {
  const rawInvData = document.getElementById('clinicInvoicesData');
  if (rawInvData) allClinicInvoices = JSON.parse(rawInvData.textContent);
} catch (e) {
  console.error('Error parsing clinic invoices:', e);
}

let activeHubPatient = {
  id: null,
  code: '',
  name: '',
  phone: '',
  age: '',
  gender: '',
  service: '',
  doctor: ''
};

let hubDentitionMode = 'adult'; // 'adult' or 'pediatric'
let currentPatientChart = {}; // Keyed by tooth number
let activeToothId = '12'; // Currently active tooth
let selectedToothIds = ['12']; // Multiple selected teeth (e.g. #12, #13, #14)
let multiSelectMode = true; // Teeth chart multi-click ON by default: clicking teeth toggles/adds them to selection

// DENTAL ANATOMY DICTIONARIES
// 32 Adult Teeth (Universal Numbering 1-32 & FDI World Dental Federation)
const ADULT_TEETH = {
  // UPPER ARCH - QUADRANT 1 (UR: 1 to 8)
  "1": { fdi: "18", name: "Maxillary Right 3rd Molar (Wisdom)", short: "M3", type: "molar", arch: "upper", quad: "UR" },
  "2": { fdi: "17", name: "Maxillary Right 2nd Molar", short: "M2", type: "molar", arch: "upper", quad: "UR" },
  "3": { fdi: "16", name: "Maxillary Right 1st Molar", short: "M1", type: "molar", arch: "upper", quad: "UR" },
  "4": { fdi: "15", name: "Maxillary Right 2nd Premolar", short: "P2", type: "premolar", arch: "upper", quad: "UR" },
  "5": { fdi: "14", name: "Maxillary Right 1st Premolar", short: "P1", type: "premolar", arch: "upper", quad: "UR" },
  "6": { fdi: "13", name: "Maxillary Right Canine (Cuspid)", short: "C", type: "canine", arch: "upper", quad: "UR" },
  "7": { fdi: "12", name: "Maxillary Right Lateral Incisor", short: "I2", type: "incisor", arch: "upper", quad: "UR" },
  "8": { fdi: "11", name: "Maxillary Right Central Incisor", short: "I1", type: "incisor", arch: "upper", quad: "UR" },

  // UPPER ARCH - QUADRANT 2 (UL: 9 to 16)
  "9": { fdi: "21", name: "Maxillary Left Central Incisor", short: "I1", type: "incisor", arch: "upper", quad: "UL" },
  "10": { fdi: "22", name: "Maxillary Left Lateral Incisor", short: "I2", type: "incisor", arch: "upper", quad: "UL" },
  "11": { fdi: "23", name: "Maxillary Left Canine (Cuspid)", short: "C", type: "canine", arch: "upper", quad: "UL" },
  "12": { fdi: "24", name: "Maxillary Left 1st Premolar", short: "P1", type: "premolar", arch: "upper", quad: "UL" },
  "13": { fdi: "25", name: "Maxillary Left 2nd Premolar", short: "P2", type: "premolar", arch: "upper", quad: "UL" },
  "14": { fdi: "26", name: "Maxillary Left 1st Molar", short: "M1", type: "molar", arch: "upper", quad: "UL" },
  "15": { fdi: "27", name: "Maxillary Left 2nd Molar", short: "M2", type: "molar", arch: "upper", quad: "UL" },
  "16": { fdi: "28", name: "Maxillary Left 3rd Molar (Wisdom)", short: "M3", type: "molar", arch: "upper", quad: "UL" },

  // LOWER ARCH - QUADRANT 4 (LR: 32 to 25)
  "32": { fdi: "48", name: "Mandibular Right 3rd Molar (Wisdom)", short: "M3", type: "molar", arch: "lower", quad: "LR" },
  "31": { fdi: "47", name: "Mandibular Right 2nd Molar", short: "M2", type: "molar", arch: "lower", quad: "LR" },
  "30": { fdi: "46", name: "Mandibular Right 1st Molar", short: "M1", type: "molar", arch: "lower", quad: "LR" },
  "29": { fdi: "45", name: "Mandibular Right 2nd Premolar", short: "P2", type: "premolar", arch: "lower", quad: "LR" },
  "28": { fdi: "44", name: "Mandibular Right 1st Premolar", short: "P1", type: "premolar", arch: "lower", quad: "LR" },
  "27": { fdi: "43", name: "Mandibular Right Canine", short: "C", type: "canine", arch: "lower", quad: "LR" },
  "26": { fdi: "42", name: "Mandibular Right Lateral Incisor", short: "I2", type: "incisor", arch: "lower", quad: "LR" },
  "25": { fdi: "41", name: "Mandibular Right Central Incisor", short: "I1", type: "incisor", arch: "lower", quad: "LR" },

  // LOWER ARCH - QUADRANT 3 (LL: 24 to 17)
  "24": { fdi: "31", name: "Mandibular Left Central Incisor", short: "I1", type: "incisor", arch: "lower", quad: "LL" },
  "23": { fdi: "32", name: "Mandibular Left Lateral Incisor", short: "I2", type: "incisor", arch: "lower", quad: "LL" },
  "22": { fdi: "33", name: "Mandibular Left Canine", short: "C", type: "canine", arch: "lower", quad: "LL" },
  "21": { fdi: "34", name: "Mandibular Left 1st Premolar", short: "P1", type: "premolar", arch: "lower", quad: "LL" },
  "20": { fdi: "35", name: "Mandibular Left 2nd Premolar", short: "P2", type: "premolar", arch: "lower", quad: "LL" },
  "19": { fdi: "36", name: "Mandibular Left 1st Molar", short: "M1", type: "molar", arch: "lower", quad: "LL" },
  "18": { fdi: "37", name: "Mandibular Left 2nd Molar", short: "M2", type: "molar", arch: "lower", quad: "LL" },
  "17": { fdi: "38", name: "Mandibular Left 3rd Molar (Wisdom)", short: "M3", type: "molar", arch: "lower", quad: "LL" }
};

// 20 Pediatric Teeth (Primary / Deciduous A to T)
const PEDIATRIC_TEETH = {
  // Upper Right: A, B, C, D, E (55, 54, 53, 52, 51)
  "A": { fdi: "55", name: "Primary Upper Right 2nd Molar", short: "m2", type: "molar", arch: "upper", quad: "UR" },
  "B": { fdi: "54", name: "Primary Upper Right 1st Molar", short: "m1", type: "molar", arch: "upper", quad: "UR" },
  "C": { fdi: "53", name: "Primary Upper Right Canine", short: "c", type: "canine", arch: "upper", quad: "UR" },
  "D": { fdi: "52", name: "Primary Upper Right Lateral", short: "i2", type: "incisor", arch: "upper", quad: "UR" },
  "E": { fdi: "51", name: "Primary Upper Right Central", short: "i1", type: "incisor", arch: "upper", quad: "UR" },
  // Upper Left: F, G, H, I, J (61, 62, 63, 64, 65)
  "F": { fdi: "61", name: "Primary Upper Left Central", short: "i1", type: "incisor", arch: "upper", quad: "UL" },
  "G": { fdi: "62", name: "Primary Upper Left Lateral", short: "i2", type: "incisor", arch: "upper", quad: "UL" },
  "H": { fdi: "63", name: "Primary Upper Left Canine", short: "c", type: "canine", arch: "upper", quad: "UL" },
  "I": { fdi: "64", name: "Primary Upper Left 1st Molar", short: "m1", type: "molar", arch: "upper", quad: "UL" },
  "J": { fdi: "65", name: "Primary Upper Left 2nd Molar", short: "m2", type: "molar", arch: "upper", quad: "UL" },
  // Lower Right: T, S, R, Q, P (85, 84, 83, 82, 81)
  "T": { fdi: "85", name: "Primary Lower Right 2nd Molar", short: "m2", type: "molar", arch: "lower", quad: "LR" },
  "S": { fdi: "84", name: "Primary Lower Right 1st Molar", short: "m1", type: "molar", arch: "lower", quad: "LR" },
  "R": { fdi: "83", name: "Primary Lower Right Canine", short: "c", type: "canine", arch: "lower", quad: "LR" },
  "Q": { fdi: "82", name: "Primary Lower Right Lateral", short: "i2", type: "incisor", arch: "lower", quad: "LR" },
  "P": { fdi: "81", name: "Primary Lower Right Central", short: "i1", type: "incisor", arch: "lower", quad: "LR" },
  // Lower Left: O, N, M, L, K (71, 72, 73, 74, 75)
  "O": { fdi: "71", name: "Primary Lower Left Central", short: "i1", type: "incisor", arch: "lower", quad: "LL" },
  "N": { fdi: "72", name: "Primary Lower Left Lateral", short: "i2", type: "incisor", arch: "lower", quad: "LL" },
  "M": { fdi: "73", name: "Primary Lower Left Canine", short: "c", type: "canine", arch: "lower", quad: "LL" },
  "L": { fdi: "74", name: "Primary Lower Left 1st Molar", short: "m1", type: "molar", arch: "lower", quad: "LL" },
  "K": { fdi: "75", name: "Primary Lower Left 2nd Molar", short: "m2", type: "molar", arch: "lower", quad: "LL" }
};

function getCsrfToken() {
  const input = document.querySelector('input[name="csrfmiddlewaretoken"]');
  if (input) return input.value;
  const match = document.cookie.match(/csrftoken=([^;]+)/);
  return match ? match[1] : '';
}

function openClinicalHubFromBtn(btn, defaultTab) {
  if (!btn) return;
  const id = btn.getAttribute('data-id');
  const code = btn.getAttribute('data-code');
  const name = btn.getAttribute('data-name');
  const phone = btn.getAttribute('data-phone');
  const age = btn.getAttribute('data-age');
  const gender = btn.getAttribute('data-gender');
  const service = btn.getAttribute('data-service');
  const doctor = btn.getAttribute('data-doctor');
  openPatientClinicalHub(id, code, name, phone, age, gender, service, doctor, defaultTab || 'chart');
}

function openClinicalHubByName(patientName, defaultTab) {
  if (!patientName) return;
  const cleanName = patientName.trim();
  const match = allClinicAppointments.find(a => (a.patient || '').toLowerCase() === cleanName.toLowerCase());
  if (match) {
    openPatientClinicalHub(match.id, match.code, match.patient, match.phone, match.age || '', match.gender || '', match.service || '', match.doctor || '', defaultTab || 'chart');
  } else {
    openPatientClinicalHub('P-' + Date.now().toString().slice(-4), 'PAT-W01', cleanName, '', '', '', 'Dental Consultation', 'Dr. Anoop', defaultTab || 'chart');
  }
}

function openPatientClinicalHub(apptId, apptCode, patientName, phone, age, gender, service, doctor, defaultTab) {
  activeHubPatient = {
    id: apptId,
    code: apptCode || ('#APT-' + (apptId || '001')),
    name: patientName || 'Patient',
    phone: phone || '+91 94460 46868',
    age: age || '',
    gender: gender || 'Patient',
    service: service || 'General Consultation',
    doctor: doctor || 'Dr. Anoop'
  };

  // Header Meta
  const nameEl = document.getElementById('hubPatientName');
  if (nameEl) nameEl.textContent = activeHubPatient.name;

  const codeEl = document.getElementById('hubPatientCode');
  if (codeEl) codeEl.textContent = activeHubPatient.code;

  const phoneEl = document.getElementById('hubPatientPhone');
  if (phoneEl) phoneEl.textContent = activeHubPatient.phone;

  const demoEl = document.getElementById('hubPatientDemographics');
  if (demoEl) {
    demoEl.textContent = (activeHubPatient.age ? `${activeHubPatient.age} Y / ` : '') + (activeHubPatient.gender || 'Patient');
  }

  const docEl = document.getElementById('hubPatientDoctor');
  if (docEl) docEl.textContent = activeHubPatient.doctor;

  const avatarEl = document.getElementById('hubPatientAvatar');
  if (avatarEl) {
    avatarEl.textContent = (activeHubPatient.name.charAt(0) || 'P').toUpperCase();
  }

  // Load Chart Data
  loadPatientChartData(activeHubPatient.id, activeHubPatient.name);

  // Render Odontogram
  renderOdontogramArch();

  // Render Billing
  renderPatientBillingLedger();

  // Load Patient Medicines
  loadPatientMedicines();

  // Switch to requested tab
  switchHubTab(defaultTab || 'chart');

  // Open Modal
  openModal('patientClinicalHubModal');
}

function switchHubTab(tabName) {
  const btnChart = document.getElementById('tabBtnTeethChart');
  const btnPay = document.getElementById('tabBtnPayment');
  const btnMed = document.getElementById('tabBtnMedicine');
  const secChart = document.getElementById('hubSectionChart');
  const secPay = document.getElementById('hubSectionPayment');
  const secMed = document.getElementById('hubSectionMedicine');

  if (btnChart) btnChart.classList.remove('active');
  if (btnPay) btnPay.classList.remove('active');
  if (btnMed) btnMed.classList.remove('active');
  if (secChart) secChart.style.display = 'none';
  if (secPay) secPay.style.display = 'none';
  if (secMed) secMed.style.display = 'none';

  if (tabName === 'payment') {
    if (btnPay) btnPay.classList.add('active');
    if (secPay) secPay.style.display = 'block';
    renderPatientBillingLedger();
  } else if (tabName === 'medicine') {
    if (btnMed) btnMed.classList.add('active');
    if (secMed) secMed.style.display = 'block';
    loadPatientMedicines();
  } else {
    if (btnChart) btnChart.classList.add('active');
    if (secChart) secChart.style.display = 'block';
  }
}

function setDentitionMode(mode) {
  hubDentitionMode = mode;
  const btnAdult = document.getElementById('btnDentAdult');
  const btnPed = document.getElementById('btnDentPediatric');
  if (mode === 'pediatric') {
    if (btnAdult) btnAdult.classList.remove('active');
    if (btnPed) btnPed.classList.add('active');
    activeToothId = 'A';
    selectedToothIds = ['A'];
  } else {
    if (btnAdult) btnAdult.classList.add('active');
    if (btnPed) btnPed.classList.remove('active');
    activeToothId = '12';
    selectedToothIds = ['12'];
  }
  renderOdontogramArch();
  selectTooth(activeToothId);
}

function loadPatientChartData(apptId, patientName) {
  currentPatientChart = {};

  // Try from appointments JSON data
  if (apptId) {
    const appt = allClinicAppointments.find(a => String(a.id) === String(apptId));
    if (appt && appt.chart_data_raw) {
      try {
        const parsed = JSON.parse(appt.chart_data_raw);
        if (parsed && typeof parsed === 'object') {
          currentPatientChart = parsed;
        }
      } catch (e) { }
    }
  }

  // If empty, check localStorage
  if (Object.keys(currentPatientChart).length === 0) {
    try {
      const localAppt = localStorage.getItem('dental_chart_appt_' + apptId);
      if (localAppt) {
        currentPatientChart = JSON.parse(localAppt);
      } else {
        const localName = localStorage.getItem('dental_chart_pat_' + (patientName || '').trim().toLowerCase());
        if (localName) currentPatientChart = JSON.parse(localName);
      }
    } catch (e) { }
  }

  if (!currentPatientChart || typeof currentPatientChart !== 'object') {
    currentPatientChart = {};
  }

  // Populate vitals box (Date, Disease, Unit, Reading)
  const vitals = currentPatientChart._vitals || {};
  const diagDateEl = document.getElementById('chartDiagDate');
  if (diagDateEl) diagDateEl.value = vitals.date || window.djangoTodayStr || '';
  const diagDisEl = document.getElementById('chartDiagDisease');
  if (diagDisEl) diagDisEl.value = vitals.disease || '';
  const diagUnitEl = document.getElementById('chartDiagUnit');
  if (diagUnitEl) diagUnitEl.value = vitals.unit || '';
  const diagReadingEl = document.getElementById('chartDiagReading');
  if (diagReadingEl) diagReadingEl.value = vitals.reading || '';
}

function saveChartVitalsData() {
  if (!currentPatientChart) currentPatientChart = {};
  currentPatientChart._vitals = {
    date: document.getElementById('chartDiagDate')?.value || '',
    disease: document.getElementById('chartDiagDisease')?.value || '',
    unit: document.getElementById('chartDiagUnit')?.value || '',
    reading: document.getElementById('chartDiagReading')?.value || ''
  };
  savePatientChartData();
}
window.saveChartVitalsData = saveChartVitalsData;

function savePatientChartData() {
  // 1. Save to localStorage
  try {
    if (activeHubPatient.id) {
      localStorage.setItem('dental_chart_appt_' + activeHubPatient.id, JSON.stringify(currentPatientChart));
    }
    if (activeHubPatient.name) {
      localStorage.setItem('dental_chart_pat_' + activeHubPatient.name.trim().toLowerCase(), JSON.stringify(currentPatientChart));
    }
  } catch (e) {
    console.error('LocalStorage save error:', e);
  }

  // 2. Sync to Django Backend
  const targetApptId = (!activeHubPatient.id || String(activeHubPatient.id).startsWith('P-')) ? 0 : activeHubPatient.id;
  fetch(`/dashboard/save-chart/${targetApptId}/`, {
    method: 'POST',
    headers: {
      'Content-Type': 'application/x-www-form-urlencoded',
      'X-Requested-With': 'XMLHttpRequest'
    },
    body: `chart_data=${encodeURIComponent(JSON.stringify(currentPatientChart))}&patient_name=${encodeURIComponent(activeHubPatient.name || '')}&csrfmiddlewaretoken=${encodeURIComponent(getCsrfToken())}`
  })
    .then(res => res.json())
    .then(data => {
      // Update in-memory appointment data
      const appt = allClinicAppointments.find(a => String(a.id) === String(activeHubPatient.id) || (data.appointment_id && String(a.id) === String(data.appointment_id)));
      if (appt) appt.chart_data_raw = JSON.stringify(currentPatientChart);
    })
    .catch(err => console.log('Chart server sync notice:', err));
}

function getToothSvg(t, isUpper) {
  if (isUpper) {
    if (t.type === 'molar') {
      return `
            <svg viewBox="0 0 32 44" fill="none" xmlns="http://www.w3.org/2000/svg">
              <path class="root-canal" d="M8 4 C8 12, 10 16, 12 18 M16 2 C16 10, 16 14, 16 18 M24 4 C24 12, 22 16, 20 18" stroke="#94a3b8" stroke-width="2" stroke-linecap="round"/>
              <path class="crown-main" d="M6 18 C6 18, 5 36, 10 38 C14 40, 18 40, 22 38 C27 36, 26 18, 26 18 Z" fill="#ffffff" stroke="#64748b" stroke-width="1.5"/>
              <rect class="crown-surface" x="12" y="24" width="8" height="8" rx="2" fill="#e2e8f0" stroke="#cbd5e1" stroke-width="1"/>
            </svg>
          `;
    } else if (t.type === 'premolar') {
      return `
            <svg viewBox="0 0 32 44" fill="none" xmlns="http://www.w3.org/2000/svg">
              <path class="root-canal" d="M13 4 C13 11, 14 15, 14 18 M19 4 C19 11, 18 15, 18 18" stroke="#94a3b8" stroke-width="2" stroke-linecap="round"/>
              <path class="crown-main" d="M8 18 C8 18, 7 35, 11 38 C14 39, 18 39, 21 38 C25 35, 24 18, 24 18 Z" fill="#ffffff" stroke="#64748b" stroke-width="1.5"/>
              <circle class="crown-surface" cx="16" cy="28" r="4" fill="#e2e8f0" stroke="#cbd5e1" stroke-width="1"/>
            </svg>
          `;
    } else if (t.type === 'canine') {
      return `
            <svg viewBox="0 0 32 44" fill="none" xmlns="http://www.w3.org/2000/svg">
              <path class="root-canal" d="M16 3 C16 10, 16 15, 16 18" stroke="#94a3b8" stroke-width="2.5" stroke-linecap="round"/>
              <path class="crown-main" d="M9 18 C9 18, 8 32, 16 40 C24 32, 23 18, 23 18 Z" fill="#ffffff" stroke="#64748b" stroke-width="1.5"/>
              <path class="crown-surface" d="M16 23 L16 33" stroke="#cbd5e1" stroke-width="1.5" stroke-linecap="round"/>
            </svg>
          `;
    } else {
      return `
            <svg viewBox="0 0 32 44" fill="none" xmlns="http://www.w3.org/2000/svg">
              <path class="root-canal" d="M16 3 C16 10, 16 14, 16 18" stroke="#94a3b8" stroke-width="2.5" stroke-linecap="round"/>
              <path class="crown-main" d="M8 18 C8 18, 8 36, 9 38 C10 39, 22 39, 23 38 C24 36, 24 18, 24 18 Z" fill="#ffffff" stroke="#64748b" stroke-width="1.5"/>
              <path class="crown-surface" d="M12 26 L20 26" stroke="#cbd5e1" stroke-width="1.5" stroke-linecap="round"/>
            </svg>
          `;
    }
  } else {
    // Lower Arch: Crown at top, roots pointing down
    if (t.type === 'molar') {
      return `
            <svg viewBox="0 0 32 44" fill="none" xmlns="http://www.w3.org/2000/svg">
              <path class="crown-main" d="M6 24 C6 24, 5 6, 10 4 C14 2, 18 2, 22 4 C27 6, 26 24, 26 24 Z" fill="#ffffff" stroke="#64748b" stroke-width="1.5"/>
              <rect class="crown-surface" x="12" y="10" width="8" height="8" rx="2" fill="#e2e8f0" stroke="#cbd5e1" stroke-width="1"/>
              <path class="root-canal" d="M10 24 C10 32, 11 38, 11 41 M22 24 C22 32, 21 38, 21 41" stroke="#94a3b8" stroke-width="2" stroke-linecap="round"/>
            </svg>
          `;
    } else if (t.type === 'premolar') {
      return `
            <svg viewBox="0 0 32 44" fill="none" xmlns="http://www.w3.org/2000/svg">
              <path class="crown-main" d="M8 24 C8 24, 7 7, 11 4 C14 3, 18 3, 21 4 C25 7, 24 24, 24 24 Z" fill="#ffffff" stroke="#64748b" stroke-width="1.5"/>
              <circle class="crown-surface" cx="16" cy="14" r="4" fill="#e2e8f0" stroke="#cbd5e1" stroke-width="1"/>
              <path class="root-canal" d="M14 24 C14 32, 15 38, 15 41 M18 24 C18 32, 17 38, 17 41" stroke="#94a3b8" stroke-width="2" stroke-linecap="round"/>
            </svg>
          `;
    } else if (t.type === 'canine') {
      return `
            <svg viewBox="0 0 32 44" fill="none" xmlns="http://www.w3.org/2000/svg">
              <path class="crown-main" d="M9 24 C9 24, 8 10, 16 3 C24 10, 23 24, 23 24 Z" fill="#ffffff" stroke="#64748b" stroke-width="1.5"/>
              <path class="crown-surface" d="M16 11 L16 20" stroke="#cbd5e1" stroke-width="1.5" stroke-linecap="round"/>
              <path class="root-canal" d="M16 24 C16 31, 16 37, 16 41" stroke="#94a3b8" stroke-width="2.5" stroke-linecap="round"/>
            </svg>
          `;
    } else {
      return `
            <svg viewBox="0 0 32 44" fill="none" xmlns="http://www.w3.org/2000/svg">
              <path class="crown-main" d="M8 24 C8 24, 8 6, 9 4 C10 3, 22 3, 23 4 C24 6, 24 24, 24 24 Z" fill="#ffffff" stroke="#64748b" stroke-width="1.5"/>
              <path class="crown-surface" d="M12 14 L20 14" stroke="#cbd5e1" stroke-width="1.5" stroke-linecap="round"/>
              <path class="root-canal" d="M16 24 C16 31, 16 37, 16 41" stroke="#94a3b8" stroke-width="2.5" stroke-linecap="round"/>
            </svg>
          `;
    }
  }
}

function renderOdontogramArch() {
  const isPed = (hubDentitionMode === 'pediatric');
  const dataset = isPed ? PEDIATRIC_TEETH : ADULT_TEETH;

  // Quadrants
  let upperQ1Keys = isPed ? ["A", "B", "C", "D", "E"] : ["1", "2", "3", "4", "5", "6", "7", "8"];
  let upperQ2Keys = isPed ? ["F", "G", "H", "I", "J"] : ["9", "10", "11", "12", "13", "14", "15", "16"];
  let lowerQ4Keys = isPed ? ["T", "S", "R", "Q", "P"] : ["32", "31", "30", "29", "28", "27", "26", "25"];
  let lowerQ3Keys = isPed ? ["O", "N", "M", "L", "K"] : ["24", "23", "22", "21", "20", "19", "18", "17"];

  // Render Upper Row
  const upperRowEl = document.getElementById('upperTeethRow');
  if (upperRowEl) {
    upperRowEl.innerHTML = `
          <div class="teeth-quadrant" id="upperQuadRight">
            ${upperQ1Keys.map(k => buildToothCardHtml(k, dataset[k], true)).join('')}
          </div>
          <div class="teeth-midline-separator">
            <span class="midline-tag">MIDLINE</span>
          </div>
          <div class="teeth-quadrant" id="upperQuadLeft">
            ${upperQ2Keys.map(k => buildToothCardHtml(k, dataset[k], true)).join('')}
          </div>
        `;
  }

  // Render Lower Row
  const lowerRowEl = document.getElementById('lowerTeethRow');
  if (lowerRowEl) {
    lowerRowEl.innerHTML = `
          <div class="teeth-quadrant" id="lowerQuadRight">
            ${lowerQ4Keys.map(k => buildToothCardHtml(k, dataset[k], false)).join('')}
          </div>
          <div class="teeth-midline-separator">
            <span class="midline-tag">MIDLINE</span>
          </div>
          <div class="teeth-quadrant" id="lowerQuadLeft">
            ${lowerQ3Keys.map(k => buildToothCardHtml(k, dataset[k], false)).join('')}
          </div>
        `;
  }

  // Update Arch Labels with tooth number range (#)
  const archUpperEl = document.getElementById('archLabelUpper');
  if (archUpperEl) {
    archUpperEl.innerHTML = isPed
      ? `Upper Jaw &bull; Maxillary Arch (No. #A &ndash; #J)`
      : `Upper Jaw &bull; Maxillary Arch (No. #1 &ndash; #16)`;
  }
  const archLowerEl = document.getElementById('archLabelLower');
  if (archLowerEl) {
    archLowerEl.innerHTML = isPed
      ? `Lower Jaw &bull; Mandibular Arch (No. #K &ndash; #T)`
      : `Lower Jaw &bull; Mandibular Arch (No. #17 &ndash; #32)`;
  }
  const numUR = document.getElementById('archNumUpperRight');
  if (numUR) numUR.innerHTML = isPed ? `No. #A &#8592; #E` : `No. #1 &#8592; #8`;
  const numUL = document.getElementById('archNumUpperLeft');
  if (numUL) numUL.innerHTML = isPed ? `No. #F &#8594; #J` : `No. #9 &#8594; #16`;
  const numLR = document.getElementById('archNumLowerRight');
  if (numLR) numLR.innerHTML = isPed ? `No. #T &#8592; #P` : `No. #32 &#8592; #25`;
  const numLL = document.getElementById('archNumLowerLeft');
  if (numLL) numLL.innerHTML = isPed ? `No. #O &#8594; #K` : `No. #24 &#8594; #17`;

  updateChartCounters();
  const fallbackId = isPed ? 'A' : '12';
  const initialId = (selectedToothIds[0] && selectedToothIds[0] in dataset) ? selectedToothIds[0] : (activeToothId in dataset ? activeToothId : fallbackId);
  selectTooth(initialId);
}

function buildToothCardHtml(toothId, toothObj, isUpper) {
  if (!toothObj) return '';
  const state = currentPatientChart[toothId] || { condition: 'sound', surfaces: [], notes: '', procedure: '', price: 0 };
  const cond = state.condition || 'sound';
  const isSelected = selectedToothIds.map(String).includes(String(toothId));

  const condLabels = {
    'sound': 'Sound',
    'caries': 'Cavity',
    'filled': 'Filled',
    'rct': 'RCT',
    'crown': 'Crown',
    'missing': 'Missing',
    'implant': 'Implant',
    'fractured': 'Broken'
  };

  const condLabel = condLabels[cond] || 'Sound';
  const svgGraphic = getToothSvg(toothObj, isUpper);

  // Upper (Maxillary): #-number on top connects to arch label above the teeth
  // Lower (Mandibular): #-number on bottom connects to arch label below the teeth
  if (isUpper) {
    return `
          <div class="tooth-card ${isSelected ? 'selected' : ''} tooth-upper"
               id="tooth_card_${toothId}"
               data-tooth-id="${toothId}"
               data-condition="${cond}"
               title="Maxillary Arch: ${toothObj.name} (Tooth No. #${toothId} | FDI: ${toothObj.fdi}) - ${condLabel}"
               onclick="selectTooth('${toothId}')">
            <span class="tooth-num-badge tooth-num-top" title="Maxillary Arch Tooth No. #${toothId}">#${toothId}</span>
            <div class="tooth-svg-wrap">
              ${svgGraphic}
            </div>
            <span class="tooth-fdi-tag">${toothObj.fdi}</span>
            <span class="tooth-cond-chip">${condLabel}</span>
          </div>
        `;
  } else {
    return `
          <div class="tooth-card ${isSelected ? 'selected' : ''} tooth-lower"
               id="tooth_card_${toothId}"
               data-tooth-id="${toothId}"
               data-condition="${cond}"
               title="Mandibular Arch: ${toothObj.name} (Tooth No. #${toothId} | FDI: ${toothObj.fdi}) - ${condLabel}"
               onclick="selectTooth('${toothId}')">
            <span class="tooth-fdi-tag">${toothObj.fdi}</span>
            <span class="tooth-cond-chip">${condLabel}</span>
            <div class="tooth-svg-wrap">
              ${svgGraphic}
            </div>
            <span class="tooth-num-badge tooth-num-bottom" title="Mandibular Arch Tooth No. #${toothId}">#${toothId}</span>
          </div>
        `;
  }
}

function getNextSequentialTeeth(baseId, count = 1) {
  const isPed = (hubDentitionMode === 'pediatric');
  const allKeys = isPed
    ? ["A", "B", "C", "D", "E", "F", "G", "H", "I", "J", "K", "L", "M", "N", "O", "P", "Q", "R", "S", "T"]
    : ["1", "2", "3", "4", "5", "6", "7", "8", "9", "10", "11", "12", "13", "14", "15", "16", "17", "18", "19", "20", "21", "22", "23", "24", "25", "26", "27", "28", "29", "30", "31", "32"];

  const currentIdx = allKeys.indexOf(String(baseId).toUpperCase());
  const nextTeeth = [];
  let startIdx = currentIdx >= 0 ? currentIdx + 1 : 0;

  while (nextTeeth.length < count && startIdx < allKeys.length) {
    const candidate = allKeys[startIdx];
    if (!selectedToothIds.includes(candidate)) {
      nextTeeth.push(candidate);
    }
    startIdx++;
  }
  return nextTeeth;
}

function addNextSequentialTooth() {
  const baseId = selectedToothIds[selectedToothIds.length - 1] || activeToothId || '12';
  const next = getNextSequentialTeeth(baseId, 1);
  if (next.length > 0) {
    selectedToothIds.push(next[0]);
    activeToothId = next[0];
    updateSelectedTeethUi(true);
  } else {
    alert("All sequential teeth in this arch are already selected.");
  }
}
window.addNextSequentialTooth = addNextSequentialTooth;

function addTwoMoreSequentialTeeth() {
  const baseId = selectedToothIds[selectedToothIds.length - 1] || activeToothId || '12';
  const next = getNextSequentialTeeth(baseId, 2);
  if (next.length > 0) {
    next.forEach(id => {
      if (!selectedToothIds.includes(id)) selectedToothIds.push(id);
    });
    activeToothId = next[next.length - 1];
    updateSelectedTeethUi(true);
  } else {
    alert("No more sequential teeth available to add.");
  }
}
window.addTwoMoreSequentialTeeth = addTwoMoreSequentialTeeth;

function toggleMultiSelectMode() {
  multiSelectMode = !multiSelectMode;
  const statusEl = document.getElementById('multiSelectStatus');
  const btnEl = document.getElementById('btnToggleMultiSelect');
  if (statusEl) {
    statusEl.textContent = multiSelectMode ? 'ON (Click teeth to add)' : 'OFF';
    statusEl.style.fontWeight = '800';
    statusEl.style.color = multiSelectMode ? '#059669' : '#2563eb';
  }
  if (btnEl) {
    btnEl.style.color = multiSelectMode ? '#059669' : '#2563eb';
  }
}
window.toggleMultiSelectMode = toggleMultiSelectMode;

function parseTeethInput(val) {
  if (!val) return [];
  const isPed = (hubDentitionMode === 'pediatric');
  const dataset = isPed ? PEDIATRIC_TEETH : ADULT_TEETH;
  const results = [];

  // Check for range e.g. 12-14 or #12-#14
  const rangeMatch = val.match(/#?([0-9]{1,2}|[A-Za-z])\s*[-–—to]+\s*#?([0-9]{1,2}|[A-Za-z])/i);
  if (rangeMatch && !val.includes(',')) {
    const start = rangeMatch[1].toUpperCase();
    const end = rangeMatch[2].toUpperCase();
    const allKeys = isPed
      ? ["A", "B", "C", "D", "E", "F", "G", "H", "I", "J", "K", "L", "M", "N", "O", "P", "Q", "R", "S", "T"]
      : Array.from({ length: 32 }, (_, i) => String(i + 1));
    const idx1 = allKeys.indexOf(start);
    const idx2 = allKeys.indexOf(end);
    if (idx1 >= 0 && idx2 >= 0) {
      const minIdx = Math.min(idx1, idx2);
      const maxIdx = Math.max(idx1, idx2);
      for (let i = minIdx; i <= maxIdx; i++) {
        results.push(allKeys[i]);
      }
      return results;
    }
  }

  // Split by commas, slashes, plus, spaces
  const tokens = val.split(/[,;+/ ]+/);
  tokens.forEach(tok => {
    const cleaned = tok.replace(/[^0-9a-zA-Z]/g, '').toUpperCase();
    if (cleaned && cleaned in dataset && !results.includes(cleaned)) {
      results.push(cleaned);
    }
  });
  return results;
}

function handleToothNumberInput(val) {
  if (!val) return;
  const parsed = parseTeethInput(val);
  if (parsed.length > 0) {
    selectedToothIds = parsed;
    activeToothId = parsed[0];
    updateSelectedTeethUi(false); // false = don't overwrite user's in-progress typing
  }
}
window.handleToothNumberInput = handleToothNumberInput;

function selectTooth(toothId, forceMulti = false) {
  toothId = String(toothId).toUpperCase();
  const isPed = (hubDentitionMode === 'pediatric');
  const dataset = isPed ? PEDIATRIC_TEETH : ADULT_TEETH;
  if (!(toothId in dataset)) return;

  // Teeth chart multi-click is ON: clicking teeth adds/toggles them into selection
  const shouldMulti = (multiSelectMode !== false) || forceMulti;

  if (shouldMulti) {
    if (selectedToothIds.includes(toothId)) {
      if (selectedToothIds.length > 1) {
        selectedToothIds = selectedToothIds.filter(id => id !== toothId);
      }
    } else {
      selectedToothIds.push(toothId);
    }
  } else {
    selectedToothIds = [toothId];
  }

  // Sort selected teeth in natural anatomical arch order
  const allKeys = isPed
    ? ["A", "B", "C", "D", "E", "F", "G", "H", "I", "J", "K", "L", "M", "N", "O", "P", "Q", "R", "S", "T"]
    : Array.from({ length: 32 }, (_, i) => String(i + 1));
  selectedToothIds.sort((a, b) => allKeys.indexOf(a) - allKeys.indexOf(b));

  activeToothId = selectedToothIds[0] || toothId;
  updateSelectedTeethUi(true);
}

function updateSelectedTeethUi(syncInput = true) {
  const isPed = (hubDentitionMode === 'pediatric');
  const dataset = isPed ? PEDIATRIC_TEETH : ADULT_TEETH;

  // 1. Highlight all selected tooth cards in Odontogram
  document.querySelectorAll('.tooth-card').forEach(el => el.classList.remove('selected'));
  selectedToothIds.forEach(id => {
    const card = document.getElementById(`tooth_card_${id}`);
    if (card) card.classList.add('selected');
  });

  // 2. Sync Input with formatted teeth "#12, #13, #14"
  const toothNumInput = document.getElementById('selToothNumberInput') || document.getElementById('selToothInput');
  if (toothNumInput && syncInput) {
    toothNumInput.value = selectedToothIds.map(id => '#' + id).join(', ');
  }

  // 3. Update Count Badge
  const countTag = document.getElementById('selTeethCountTag');
  if (countTag) {
    const c = selectedToothIds.length;
    countTag.textContent = c === 1 ? '1 Tooth' : `${c} Teeth Selected`;
    countTag.style.background = c > 1 ? '#dbeafe' : '#eff6ff';
    countTag.style.color = c > 1 ? '#1e40af' : '#1d4ed8';
  }

  // 4. Update Panel Header Title & FDI
  const titleEl = document.getElementById('selToothTitle');
  if (titleEl) {
    if (selectedToothIds.length === 1) {
      const t = dataset[activeToothId] || { name: 'Tooth #' + activeToothId };
      titleEl.textContent = `Tooth #${activeToothId} • ${t.name}`;
    } else {
      const allUpper = selectedToothIds.every(id => isPed ? id <= 'J' : parseInt(id) <= 16);
      const allLower = selectedToothIds.every(id => isPed ? id > 'J' : parseInt(id) > 16);
      const archName = allUpper ? 'Maxillary Arch' : (allLower ? 'Mandibular Arch' : 'Both Arches');
      titleEl.textContent = `Teeth ${selectedToothIds.map(id => '#' + id).join(', ')} • ${archName} (${selectedToothIds.length} Teeth)`;
    }
  }

  const fdiEl = document.getElementById('selToothFdiNotation');
  if (fdiEl) {
    if (selectedToothIds.length === 1) {
      const t = dataset[activeToothId] || { fdi: activeToothId };
      fdiEl.textContent = `FDI: ${t.fdi} • ${isPed ? 'Primary Pediatric Dentition' : 'Permanent Adult Dentition'}`;
    } else {
      const fdis = selectedToothIds.map(id => (dataset[id] ? dataset[id].fdi : id)).join(', ');
      fdiEl.textContent = `FDI: ${fdis} • Multiple Teeth Selected`;
    }
  }

  // 5. Populate condition, doctor, procedure from active tooth
  const state = currentPatientChart[activeToothId] || { condition: 'sound', surfaces: [], notes: '', procedure: '', price: '' };

  document.querySelectorAll('.btn-cond-choice').forEach(btn => {
    const btnCond = btn.getAttribute('data-condition');
    if (btnCond === (state.condition || 'sound')) {
      btn.classList.add('active');
    } else {
      btn.classList.remove('active');
    }
  });

  updateSelToothStatusBadge(state.condition || 'sound');

  const surfaces = state.surfaces || [];
  ['o', 'm', 'd', 'b', 'l'].forEach(s => {
    const chk = document.getElementById('surf_' + s);
    if (chk) chk.checked = surfaces.includes(s.toUpperCase());
  });

  const docEl = document.getElementById('selToothDoctor');
  if (docEl) {
    if (state.doctor) {
      docEl.value = state.doctor;
    } else if (activeHubPatient && activeHubPatient.doctor) {
      docEl.value = activeHubPatient.doctor;
    } else if (docEl.options.length > 1) {
      docEl.selectedIndex = 1;
    }
  }

  const purposeEl = document.getElementById('selToothPurpose');
  if (purposeEl) purposeEl.value = state.purpose || '';

  const procEl = document.getElementById('selToothProcedure');
  if (procEl) procEl.value = state.procedure || '';

  const priceEl = document.getElementById('selToothPrice');
  if (priceEl) priceEl.value = state.price || '';

  const notesEl = document.getElementById('selToothNotes');
  if (notesEl) notesEl.value = state.notes || '';
}

function updateSelToothStatusBadge(cond) {
  const badgeEl = document.getElementById('selToothCurrentStatusBadge');
  if (!badgeEl) return;

  const badgeClasses = {
    'sound': { text: 'Healthy / Sound', cls: 'badge-completed' },
    'caries': { text: 'Active Caries / Decay', cls: 'badge-overdue' },
    'filled': { text: 'Restored / Filled', cls: 'badge-pending' },
    'rct': { text: 'Root Canal (RCT)', cls: 'badge-in_progress' },
    'crown': { text: 'Crown / Cap Fitted', cls: 'badge-in_progress' },
    'missing': { text: 'Extracted / Missing', cls: 'badge-overdue' },
    'implant': { text: 'Dental Implant Fixture', cls: 'badge-completed' },
    'fractured': { text: 'Fractured / Broken Tooth', cls: 'badge-overdue' }
  };

  const b = badgeClasses[cond] || badgeClasses['sound'];
  badgeEl.className = 'badge ' + b.cls;
  badgeEl.textContent = b.text;
}

function selectToothCondition(cond) {
  document.querySelectorAll('.btn-cond-choice').forEach(btn => {
    if (btn.getAttribute('data-condition') === cond) {
      btn.classList.add('active');
    } else {
      btn.classList.remove('active');
    }
  });

  selectedToothIds.forEach(tId => {
    if (!currentPatientChart[tId]) {
      currentPatientChart[tId] = { condition: 'sound', surfaces: [], notes: '', procedure: '', price: '' };
    }
    currentPatientChart[tId].condition = cond;
  });
  updateSelToothStatusBadge(cond);

  // Auto suggest procedure if empty
  const procEl = document.getElementById('selToothProcedure');
  const priceEl = document.getElementById('selToothPrice');
  if (procEl && (!procEl.value || procEl.value === '')) {
    if (cond === 'caries') {
      procEl.value = 'Composite Tooth Restoration / Filling';
      if (priceEl && !priceEl.value) priceEl.value = 1200;
    } else if (cond === 'rct') {
      procEl.value = 'Single-Visit Root Canal Treatment (RCT)';
      if (priceEl && !priceEl.value) priceEl.value = 3500;
    } else if (cond === 'crown') {
      procEl.value = 'Multi-layer Zirconia Crown';
      if (priceEl && !priceEl.value) priceEl.value = 5500;
    } else if (cond === 'implant') {
      procEl.value = 'Titanium Dental Implant Fixture';
      if (priceEl && !priceEl.value) priceEl.value = 18000;
    } else if (cond === 'missing') {
      procEl.value = 'Surgical / Atraumatic Extraction';
      if (priceEl && !priceEl.value) priceEl.value = 1500;
    }
  }

  // Live update the tooth card in arch
  const card = document.getElementById(`tooth_card_${activeToothId}`);
  if (card) {
    card.setAttribute('data-condition', cond);
    const chip = card.querySelector('.tooth-cond-chip');
    if (chip) {
      const labels = { sound: 'Sound', caries: 'Cavity', filled: 'Filled', rct: 'RCT', crown: 'Crown', missing: 'Missing', implant: 'Implant', fractured: 'Broken' };
      chip.textContent = labels[cond] || 'Sound';
    }
  }
  updateChartCounters();
}

function toggleToothSurface(surf) {
  if (!currentPatientChart[activeToothId]) {
    currentPatientChart[activeToothId] = { condition: 'sound', surfaces: [], notes: '', procedure: '', price: '' };
  }
  let surfaces = currentPatientChart[activeToothId].surfaces || [];
  const chk = document.getElementById('surf_' + surf.toLowerCase());
  if (chk && chk.checked) {
    if (!surfaces.includes(surf)) surfaces.push(surf);
  } else {
    surfaces = surfaces.filter(s => s !== surf);
  }
  currentPatientChart[activeToothId].surfaces = surfaces;
}

function handlePurposeSelect(purpose) {
  const procEl = document.getElementById('selToothProcedure');
  const priceEl = document.getElementById('selToothPrice');
  if (!procEl) return;

  const purposeMapping = {
    'Root Canal Therapy (Endodontics)': { proc: 'Single-Visit Root Canal Treatment (RCT)', price: 3500 },
    'Crown & Bridge (Prosthodontics)': { proc: 'Multi-layer Zirconia Crown', price: 5500 },
    'Cavity Restoration / Filling': { proc: 'Composite Tooth Restoration / Filling', price: 1200 },
    'Dental Implant & Surgery': { proc: 'Titanium Dental Implant Fixture', price: 18000 },
    'Scaling & Deep Cleaning': { proc: 'Ultrasonic Scaling & Deep Cleaning', price: 1200 },
    'Tooth Extraction / Surgery': { proc: 'Surgical / Atraumatic Extraction', price: 1500 },
    'Laser Teeth Whitening': { proc: 'Laser Teeth Whitening', price: 2999 },
    'Cosmetic & Smile Makeover': { proc: 'Porcelain Ceramic Veneer', price: 6500 }
  };

  const match = purposeMapping[purpose];
  if (match) {
    procEl.value = match.proc;
    if (priceEl) priceEl.value = match.price;
  }
}

function handleProcedureSelect(procName) {
  const procEl = document.getElementById('selToothProcedure');
  const priceEl = document.getElementById('selToothPrice');
  if (!procEl || !priceEl) return;
  const opt = procEl.options[procEl.selectedIndex];
  if (opt && opt.getAttribute('data-price')) {
    priceEl.value = opt.getAttribute('data-price');
  }
}

function saveCurrentToothData() {
  if (!selectedToothIds || selectedToothIds.length === 0) {
    selectedToothIds = [activeToothId || '12'];
  }

  const activeBtn = document.querySelector('.btn-cond-choice.active');
  const cond = activeBtn ? activeBtn.getAttribute('data-condition') : 'sound';

  const surfaces = [];
  ['o', 'm', 'd', 'b', 'l'].forEach(s => {
    const chk = document.getElementById('surf_' + s);
    if (chk && chk.checked) surfaces.push(s.toUpperCase());
  });

  const doc = document.getElementById('selToothDoctor')?.value || '';
  const toothNumVal = document.getElementById('selToothNumberInput')?.value || selectedToothIds.map(t => '#' + t).join(', ');
  const purpose = document.getElementById('selToothPurpose')?.value || '';
  const proc = document.getElementById('selToothProcedure')?.value || '';
  const price = parseFloat(document.getElementById('selToothPrice')?.value) || 0;
  const notes = document.getElementById('selToothNotes')?.value || '';

  selectedToothIds.forEach(tId => {
    currentPatientChart[tId] = {
      condition: cond,
      surfaces: [...surfaces],
      doctor: doc,
      tooth_number: '#' + tId,
      purpose: purpose,
      procedure: proc,
      price: price,
      notes: notes
    };
  });

  savePatientChartData();
  renderOdontogramArch();
  updateSelectedTeethUi(true);

  // Connect saved tooth condition directly to Payment (Total Billed & Balance Due)
  renderPatientBillingLedger();

  // Brief toast confirmation
  const saveBtn = event?.target?.closest('button');
  if (saveBtn) {
    const originalHtml = saveBtn.innerHTML;
    saveBtn.innerHTML = '<i class="fas fa-check"></i> Saved!';
    saveBtn.style.background = '#10b981';
    setTimeout(() => {
      saveBtn.innerHTML = originalHtml;
      saveBtn.style.background = '#2563eb';
    }, 1200);
  }
}

function addTwoMoreTeethToChart() {
  if (!activeHubPatient || !activeHubPatient.id) {
    alert("Please open a patient's Teeth Chart first.");
    return;
  }

  const isPed = (hubDentitionMode === 'pediatric');
  const dataset = isPed ? PEDIATRIC_TEETH : ADULT_TEETH;
  const doc = document.getElementById('selToothDoctor')?.value || activeHubPatient.doctor || 'Dr. Anoop';

  // Continue sequentially from current active tooth (e.g. from #12 adds #13, #14)
  const baseId = selectedToothIds[selectedToothIds.length - 1] || activeToothId || (isPed ? 'A' : '12');
  let nextKeys = getNextSequentialTeeth(baseId, 2);
  if (nextKeys.length < 2) {
    const allKeys = Object.keys(dataset);
    const candidates = allKeys.filter(k => !selectedToothIds.includes(k) && !nextKeys.includes(k));
    while (nextKeys.length < 2 && candidates.length > 0) {
      nextKeys.push(candidates.shift());
    }
  }

  const presets = [
    {
      condition: 'crown',
      surfaces: ['O', 'B'],
      doctor: doc,
      purpose: 'Crown & Bridge (Prosthodontics)',
      procedure: 'Multi-layer Zirconia Crown',
      price: 5500,
      notes: 'Zirconia Crown planned'
    },
    {
      condition: 'rct',
      surfaces: ['O', 'D'],
      doctor: doc,
      purpose: 'Root Canal Therapy (Endodontics)',
      procedure: 'Single-Visit Root Canal Treatment (RCT)',
      price: 3500,
      notes: 'Root canal treatment required'
    }
  ];

  nextKeys.forEach((toothKey, idx) => {
    currentPatientChart[toothKey] = {
      ...presets[idx % presets.length],
      doctor: doc,
      tooth_number: '#' + toothKey
    };
    if (!selectedToothIds.includes(toothKey)) {
      selectedToothIds.push(toothKey);
    }
  });

  activeToothId = nextKeys[nextKeys.length - 1] || activeToothId;
  savePatientChartData();
  renderOdontogramArch();
  updateSelectedTeethUi(true);
  renderPatientBillingLedger();

  // Update in-memory appointment data
  const appt = allClinicAppointments.find(a => String(a.id) === String(activeHubPatient.id));
  if (appt) {
    appt.chart_data_raw = JSON.stringify(currentPatientChart);
  }

  alert(`Successfully added 2 more teeth (${addedTeeth.join(' & ')}) to ${activeHubPatient.name}'s chart!`);
}

function resetCurrentTooth() {
  if (!selectedToothIds || selectedToothIds.length === 0) return;
  selectedToothIds.forEach(id => {
    currentPatientChart[id] = { condition: 'sound', surfaces: [], doctor: '', purpose: '', notes: '', procedure: '', price: '', tooth_number: '#' + id };
  });
  savePatientChartData();
  renderOdontogramArch();
  updateSelectedTeethUi(true);
  renderPatientBillingLedger();
}

function resetAllTeethChart() {
  if (confirm(`Reset dental chart for ${activeHubPatient.name} to all sound teeth?`)) {
    currentPatientChart = {};
    savePatientChartData();
    renderOdontogramArch();
    selectTooth(activeToothId);
    renderPatientBillingLedger();
  }
}

function addCurrentToothToBilling() {
  saveCurrentToothData();

  const toothState = currentPatientChart[activeToothId] || {};
  const count = selectedToothIds.length;
  const teethStr = selectedToothIds.map(t => '#' + t).join(', ');

  let procDescription = toothState.procedure || 'Dental Treatment';
  if (count > 1) {
    procDescription = `Teeth ${teethStr} (${procDescription} - ${count} Teeth)`;
  } else {
    procDescription = `Tooth #${activeToothId} (${procDescription})`;
  }
  const unitFee = parseFloat(toothState.price) || 1500;
  const fee = count > 1 ? (unitFee * count) : unitFee;

  // Switch to Billing Tab
  switchHubTab('payment');

  // Pre-fill Billing Form
  const payTrt = document.getElementById('hubPayTreatment');
  const payAmt = document.getElementById('hubPayAmount');
  if (payTrt) payTrt.value = procDescription;
  if (payAmt) payAmt.value = fee;

  // Focus amount
  if (payAmt) {
    payAmt.focus();
    payAmt.select();
  }
}

function updateChartCounters() {
  let sound = 0, caries = 0, restored = 0, rct = 0, crown = 0, missing = 0, total = 0;
  const isPed = (hubDentitionMode === 'pediatric');
  const dataset = isPed ? PEDIATRIC_TEETH : ADULT_TEETH;
  const keys = Object.keys(dataset);
  total = keys.length;

  keys.forEach(k => {
    const item = currentPatientChart[k];
    const cond = item ? (item.condition || 'sound') : 'sound';
    if (cond === 'caries') caries++;
    else if (cond === 'filled') restored++;
    else if (cond === 'rct') rct++;
    else if (cond === 'crown') crown++;
    else if (cond === 'missing') missing++;
    else sound++;
  });

  if (document.getElementById('cntSound')) document.getElementById('cntSound').textContent = sound;
  if (document.getElementById('cntCaries')) document.getElementById('cntCaries').textContent = caries;
  if (document.getElementById('cntRestored')) document.getElementById('cntRestored').textContent = restored;
  if (document.getElementById('cntRct')) document.getElementById('cntRct').textContent = rct;
  if (document.getElementById('cntCrown')) document.getElementById('cntCrown').textContent = crown;
  if (document.getElementById('cntMissing')) document.getElementById('cntMissing').textContent = missing;
  if (document.getElementById('hubToothCountBadge')) document.getElementById('hubToothCountBadge').textContent = total;
}

function printDentalChartSummary() {
  const isPed = (hubDentitionMode === 'pediatric');
  const dataset = isPed ? PEDIATRIC_TEETH : ADULT_TEETH;

  const findings = [];
  Object.keys(dataset).forEach(k => {
    const item = currentPatientChart[k];
    if (item && item.condition && item.condition !== 'sound') {
      const t = dataset[k];
      findings.push(`• Tooth #${k} (${t.name}, FDI: ${t.fdi}): ${item.condition.toUpperCase()} ${item.surfaces && item.surfaces.length ? '[' + item.surfaces.join('') + ']' : ''} - ${item.procedure || 'Monitored'} ${item.notes ? '(' + item.notes + ')' : ''}`);
    }
  });

  const reportWindow = window.open('', '_blank', 'width=750,height=600');
  reportWindow.document.write(`
        <html>
        <head>
          <title>Dental Chart Examination Report - ${escapeHtml(activeHubPatient.name)}</title>
          <style>
            body { font-family: -apple-system, BlinkMacSystemFont, "Segoe UI", Roboto, sans-serif; padding: 30px; color: #0f172a; line-height: 1.5; }
            h2 { margin: 0; color: #2563eb; }
            hr { border: none; border-top: 1px solid #cbd5e1; margin: 15px 0; }
            .meta { font-size: 0.9rem; color: #475569; margin-bottom: 20px; }
            .findings-box { background: #f8fafc; border: 1px solid #e2e8f0; padding: 15px 20px; border-radius: 8px; font-family: monospace; font-size: 0.9rem; }
          </style>
        </head>
        <body>
          <h2>Dr. Anoop's Dental Clinic</h2>
          <div class="meta">
            <strong>Clinical Dental Chart & Treatment Plan</strong><br>
            Patient: <strong>${escapeHtml(activeHubPatient.name)}</strong> (PID: ${escapeHtml(activeHubPatient.code)})<br>
            Phone: ${escapeHtml(activeHubPatient.phone)} | Doctor: ${escapeHtml(activeHubPatient.doctor)}<br>
            Date: ${new Date().toLocaleDateString('en-US', { month: 'short', day: 'numeric', year: 'numeric' })}
          </div>
          <hr>
          <h3>Odontogram Findings & Procedures Planned:</h3>
          <div class="findings-box">
            ${findings.length > 0 ? findings.join('<br>') : 'All examined teeth evaluated as Healthy / Sound.'}
          </div>
          <br>
          <button onclick="window.print()" style="padding: 8px 16px; background: #2563eb; color: #fff; border: none; border-radius: 6px; cursor: pointer; font-weight: 600;">Print Report</button>
        </body>
        </html>
      `);
  reportWindow.document.close();
}

// ==========================================
// PATIENT BILLING & PAYMENT LEDGER LOGIC
// ==========================================
function quickBillToothProcedure(toothId, procedure, amount) {
  switchHubTab('payment');
  const payTrt = document.getElementById('hubPayTreatment');
  const payAmt = document.getElementById('hubPayAmount');
  if (payTrt) {
    payTrt.value = procedure.toLowerCase().includes(String(toothId).toLowerCase()) ? procedure : `Tooth #${toothId} - ${procedure}`;
  }
  if (payAmt) {
    payAmt.value = amount;
    payAmt.focus();
  }
}

function renderPatientBillingLedger() {
  const patientName = (activeHubPatient.name || '').trim().toLowerCase();
  const nameInput = document.getElementById('hubPayPatientName');
  if (nameInput) nameInput.value = activeHubPatient.name;

  // Filter invoices for this patient
  const invoices = allClinicInvoices.filter(inv => {
    const invPatient = (inv.patient_name || '').trim().toLowerCase();
    if (!invPatient || !patientName) return false;
    return invPatient === patientName || invPatient.includes(patientName) || patientName.includes(invPatient);
  });

  // Gather diagnosed tooth procedures from currentPatientChart (saved tooth conditions)
  const isPed = (hubDentitionMode === 'pediatric');
  const dataset = isPed ? PEDIATRIC_TEETH : ADULT_TEETH;
  const chartItems = [];

  for (const toothId in currentPatientChart) {
    const tState = currentPatientChart[toothId];
    const fee = parseFloat(tState?.price) || 0;
    const procName = tState?.procedure?.trim() || '';
    if (fee > 0 || procName) {
      const tInfo = dataset[toothId] || ADULT_TEETH[toothId] || { name: 'Tooth #' + toothId };
      chartItems.push({
        toothId: toothId,
        toothName: tInfo.name,
        procedure: procName || `${tInfo.name} Procedure`,
        amount: fee,
        doctor: tState.doctor || activeHubPatient.doctor || 'Dr. Anoop',
        purpose: tState.purpose || 'Dental Procedure',
        condition: tState.condition || 'treated'
      });
    }
  }

  // Check which chart procedures already have a paid/recorded invoice
  const unbilledChartItems = [];
  chartItems.forEach(ci => {
    const hasInv = invoices.some(inv => {
      const invTrt = (inv.treatment || '').toLowerCase();
      return invTrt.includes(`tooth #${ci.toothId.toLowerCase()}`) ||
        invTrt.includes(`tooth ${ci.toothId.toLowerCase()}`) ||
        (invTrt.includes(ci.procedure.toLowerCase()) && Math.abs(parseFloat(inv.amount) - ci.amount) < 1);
    });
    if (!hasInv) {
      unbilledChartItems.push(ci);
    }
  });

  let totalBilled = 0;
  let totalPaid = 0;

  // 1. Add recorded invoices
  invoices.forEach(inv => {
    const amt = parseFloat(inv.amount) || 0;
    totalBilled += amt;
    if ((inv.payment_status || '').toLowerCase() === 'paid') {
      totalPaid += amt;
    } else if ((inv.payment_status || '').toLowerCase() === 'partial') {
      totalPaid += (amt / 2);
    }
  });

  // 2. Add unbilled tooth procedures from saved tooth conditions into Total Billed
  unbilledChartItems.forEach(ci => {
    totalBilled += ci.amount;
  });

  // 3. Balance Due is Total Billed minus Total Paid
  const balanceDue = Math.max(0, totalBilled - totalPaid);

  // Update Total Billed, Total Paid, and Balance Due stat cards
  const billEl = document.getElementById('hubTotalBilled');
  if (billEl) billEl.textContent = totalBilled.toLocaleString('en-IN', { minimumFractionDigits: 2, maximumFractionDigits: 2 });

  const paidEl = document.getElementById('hubTotalPaid');
  if (paidEl) paidEl.textContent = totalPaid.toLocaleString('en-IN', { minimumFractionDigits: 2, maximumFractionDigits: 2 });

  const dueEl = document.getElementById('hubBalanceDue');
  if (dueEl) dueEl.textContent = balanceDue.toLocaleString('en-IN', { minimumFractionDigits: 2, maximumFractionDigits: 2 });

  const dueWrap = document.getElementById('hubBalanceDueWrap');
  const balanceCard = document.getElementById('hubBalanceCard');
  const balanceLabel = document.getElementById('hubBalanceLabel');
  const balanceIconWrap = document.getElementById('hubBalanceIconWrap');
  const balanceIcon = document.getElementById('hubBalanceIcon');

  if (balanceDue > 0) {
    if (dueWrap) dueWrap.style.color = '#dc2626';
    if (balanceCard) balanceCard.style.borderLeft = '4px solid #dc2626';
    if (balanceLabel) {
      balanceLabel.textContent = 'BALANCE DUE / PENDING';
      balanceLabel.style.color = '#dc2626';
    }
    if (balanceIconWrap) {
      balanceIconWrap.style.background = '#fee2e2';
      balanceIconWrap.style.color = '#dc2626';
    }
    if (balanceIcon) balanceIcon.className = 'fas fa-exclamation-circle';
  } else {
    if (dueWrap) dueWrap.style.color = '#16a34a';
    if (balanceCard) balanceCard.style.borderLeft = '4px solid #16a34a';
    if (balanceLabel) {
      balanceLabel.textContent = 'BALANCE COMPLETE / CLEARED';
      balanceLabel.style.color = '#16a34a';
    }
    if (balanceIconWrap) {
      balanceIconWrap.style.background = '#ecfdf5';
      balanceIconWrap.style.color = '#16a34a';
    }
    if (balanceIcon) balanceIcon.className = 'fas fa-check-circle';
  }

  const totalItemsCount = invoices.length + unbilledChartItems.length;
  const countBadge = document.getElementById('hubPaymentCountBadge');
  if (countBadge) countBadge.textContent = totalItemsCount;

  const countTag = document.getElementById('hubInvoiceCountTag');
  if (countTag) countTag.textContent = `${totalItemsCount} ${totalItemsCount === 1 ? 'Entry' : 'Entries'}`;

  // Render table rows
  const tbody = document.getElementById('hubPatientInvoicesBody');
  if (!tbody) return;

  if (totalItemsCount === 0) {
    tbody.innerHTML = `
          <tr>
            <td colspan="7" class="empty-row-td">
              <i class="fas fa-file-invoice-dollar" style="font-size: 1.8rem; margin-bottom: 6px; display: block; color: #cbd5e1;"></i>
              No billing entries recorded for ${escapeHtml(activeHubPatient.name)}. Select tooth conditions and save procedures on the Teeth Chart, or record payment on the right.
            </td>
          </tr>
        `;
    return;
  }

  let html = '';

  // First render unbilled chart procedures from saved tooth conditions
  unbilledChartItems.forEach(ci => {
    const amtFormatted = Number(ci.amount || 0).toLocaleString('en-IN', { minimumFractionDigits: 2, maximumFractionDigits: 2 });
    html += `
          <tr style="background: #f0fdf4;">
            <td><strong style="color: #059669; font-weight: 700;"><i class="fas fa-tooth" style="font-size: 0.75rem;"></i> TOOTH #${escapeHtml(ci.toothId)}</strong></td>
            <td><span style="font-size: 0.75rem; color: #059669; font-weight: 600;"><i class="fas fa-check-circle"></i> Chart Saved</span></td>
            <td>
              <strong>${escapeHtml(ci.procedure)}</strong>
              <div style="font-size: 0.725rem; color: #64748b;">${escapeHtml(ci.doctor)} &bull; <strong style="color: #475569;">Teeth:</strong> ${escapeHtml(ci.purpose || ('Tooth #' + ci.toothId))}</div>
            </td>
            <td style="font-weight: 800; color: #0f172a;">₹${amtFormatted}</td>
            <td><span style="font-size: 0.775rem; color: #94a3b8;">Pending Bill</span></td>
            <td>
              <span class="badge badge-overdue" style="cursor: pointer;" onclick="quickBillToothProcedure('${escapeHtml(ci.toothId)}', '${escapeHtml(ci.procedure)}', ${ci.amount})" title="Click to Record Payment">
                <i class="fas fa-exclamation-circle"></i> Balance Due
              </span>
            </td>
            <td style="text-align: right;">
              <button type="button" class="btn-sm" style="background: #059669; color: #ffffff; border: none; padding: 5px 10px; border-radius: 6px; font-size: 0.75rem; font-weight: 700; cursor: pointer; display: inline-flex; align-items: center; gap: 4px;"
                      onclick="quickBillToothProcedure('${escapeHtml(ci.toothId)}', '${escapeHtml(ci.procedure)}', ${ci.amount})" title="Record Payment for Tooth #${escapeHtml(ci.toothId)}">
                <i class="fas fa-credit-card"></i> Pay Now
              </button>
            </td>
          </tr>
        `;
  });

  // Then render recorded invoices
  invoices.forEach(inv => {
    const amtFormatted = Number(inv.amount || 0).toLocaleString('en-IN', { minimumFractionDigits: 2, maximumFractionDigits: 2 });
    const isPaid = (inv.payment_status === 'Paid');
    html += `
          <tr>
            <td><strong style="color: #2563eb; font-weight: 700;">${escapeHtml(inv.invoice_id)}</strong></td>
            <td>${escapeHtml(inv.created_at || 'Today')}</td>
            <td><strong>${escapeHtml(inv.treatment)}</strong></td>
            <td style="font-weight: 800; color: #0f172a;">₹${amtFormatted}</td>
            <td><span style="font-size: 0.775rem; color: #64748b;">${escapeHtml(inv.payment_mode || 'UPI')}</span></td>
            <td>
              <span class="badge ${isPaid ? 'badge-completed' : 'badge-in_progress'}">
                ${isPaid ? '<i class="fas fa-check"></i> Paid' : '<i class="fas fa-clock"></i> ' + escapeHtml(inv.payment_status)}
              </span>
            </td>
            <td style="text-align: right;">
              <button type="button" class="btn-sm" style="background: #eff6ff; color: #2563eb; border: 1px solid #bfdbfe; padding: 4px 8px; border-radius: 6px; font-size: 0.75rem; font-weight: 600; cursor: pointer;"
                      onclick="openReceiptModal('${escapeHtml(inv.invoice_id)}', '${escapeHtml(inv.created_at || 'Today')}', '${escapeHtml(inv.patient_name)}', '${escapeHtml(inv.treatment)}', '${amtFormatted}', '${escapeHtml(inv.payment_mode || 'UPI')}', '${escapeHtml(inv.payment_status || 'Paid')}')">
                <i class="fas fa-receipt"></i> Slip
              </button>
            </td>
          </tr>
        `;
  });

  tbody.innerHTML = html;
}

function handleHubRecordPayment(e) {
  e.preventDefault();
  const patientName = activeHubPatient.name || 'Patient';
  const treatment = document.getElementById('hubPayTreatment')?.value.trim();
  const amount = parseFloat(document.getElementById('hubPayAmount')?.value) || 0;
  const status = document.getElementById('hubPayStatus')?.value || 'Paid';
  const mode = document.getElementById('hubPayMode')?.value || 'UPI';

  if (!treatment || amount <= 0) {
    alert('Please enter a valid treatment description and billed amount.');
    return;
  }

  const submitBtn = document.getElementById('btnSubmitPayment');
  if (submitBtn) {
    submitBtn.disabled = true;
    submitBtn.innerHTML = '<i class="fas fa-spinner fa-spin"></i> Recording Payment...';
  }

  const formData = new FormData();
  formData.append('patient_name', patientName);
  formData.append('treatment', treatment);
  formData.append('amount', amount);
  formData.append('payment_status', status);
  formData.append('payment_mode', mode);
  formData.append('is_ajax', '1');
  formData.append('csrfmiddlewaretoken', getCsrfToken());

  fetch('/dashboard/new-invoice/', {
    method: 'POST',
    headers: {
      'X-Requested-With': 'XMLHttpRequest'
    },
    body: formData
  })
    .then(res => res.json())
    .then(data => {
      if (data.status === 'success' && data.invoice) {
        allClinicInvoices.unshift(data.invoice);
        renderPatientBillingLedger();

        // Reset inputs
        if (document.getElementById('hubPayTreatment')) document.getElementById('hubPayTreatment').value = '';
        if (document.getElementById('hubPayAmount')) document.getElementById('hubPayAmount').value = '';

        // Toast / button feedback
        if (submitBtn) {
          submitBtn.innerHTML = '<i class="fas fa-check-circle"></i> Payment Recorded!';
          submitBtn.style.background = '#10b981';
          setTimeout(() => {
            submitBtn.disabled = false;
            submitBtn.innerHTML = '<i class="fas fa-check-circle"></i> Save Invoice &amp; Record Payment';
            submitBtn.style.background = '#059669';
          }, 1500);
        }
      } else {
        alert('Notice: ' + (data.message || 'Payment recorded.'));
        if (submitBtn) {
          submitBtn.disabled = false;
          submitBtn.innerHTML = '<i class="fas fa-check-circle"></i> Save Invoice &amp; Record Payment';
        }
      }
    })
    .catch(err => {
      console.error('Payment submit error:', err);
      // Fallback local append if network hiccup
      const localInvId = `INV-${new Date().getFullYear()}-${String(allClinicInvoices.length + 1).padStart(3, '0')}`;
      allClinicInvoices.unshift({
        id: Date.now(),
        invoice_id: localInvId,
        patient_name: patientName,
        treatment: treatment,
        amount: amount,
        payment_status: status,
        payment_mode: mode,
        created_at: new Date().toLocaleDateString('en-US', { month: 'short', day: 'numeric', year: 'numeric' })
      });
      renderPatientBillingLedger();
      if (submitBtn) {
        submitBtn.disabled = false;
        submitBtn.innerHTML = '<i class="fas fa-check-circle"></i> Save Invoice &amp; Record Payment';
      }
    });
}

function openReceiptModal(invoiceId, date, patient, treatment, amount, mode, status) {
  if (document.getElementById('recNo')) document.getElementById('recNo').textContent = invoiceId;
  if (document.getElementById('recDate')) document.getElementById('recDate').textContent = date;
  if (document.getElementById('recPatient')) document.getElementById('recPatient').textContent = patient;
  if (document.getElementById('recTreatment')) document.getElementById('recTreatment').textContent = treatment;
  if (document.getElementById('recMode')) document.getElementById('recMode').textContent = mode;
  if (document.getElementById('recStatus')) document.getElementById('recStatus').textContent = status;
  if (document.getElementById('recAmount')) document.getElementById('recAmount').textContent = amount;
  openModal('patientReceiptModal');
}

// =========================================================
// DIGITAL OPG X-RAY AI SCANNING ANALYZER
// =========================================================
let isDashOpgScanning = false;
let dashOpgScanTimer = null;

function openOpgAiScannerModal(imageUrl, patientName) {
  const targetUrl = imageUrl || window.sampleOpgUrl || "/static/Dental/images/sample_opg_xray.jpg";
  const imgEl = document.getElementById('dashOpgImg');
  if (imgEl) imgEl.src = targetUrl;

  const nameEl = document.getElementById('dashOpgPatientName');
  if (nameEl && patientName) nameEl.textContent = patientName;

  resetDashOpgScan();
  openModal('opgAiScanModal');
}

function handleOpgDashboardUpload(e) {
  const file = e.target.files && e.target.files[0];
  if (!file) return;

  const reader = new FileReader();
  reader.onload = function (evt) {
    openOpgAiScannerModal(evt.target.result, "Custom Uploaded OPG Patient");
    // Trigger auto deep scan
    setTimeout(() => {
      toggleDashOpgScan();
    }, 350);
  };
  reader.readAsDataURL(file);
  e.target.value = "";
}

function handleModalOpgUpload(e) {
  const file = e.target.files && e.target.files[0];
  if (!file) return;

  const reader = new FileReader();
  reader.onload = function (evt) {
    const imgEl = document.getElementById('dashOpgImg');
    if (imgEl) imgEl.src = evt.target.result;
    const nameEl = document.getElementById('dashOpgPatientName');
    if (nameEl) nameEl.textContent = file.name.replace(/\.[^/.]+$/, "") + " (Uploaded)";
    resetDashOpgScan();
    setTimeout(() => {
      toggleDashOpgScan();
    }, 250);
  };
  reader.readAsDataURL(file);
  e.target.value = "";
}

function toggleDashOpgScan() {
  const viewport = document.getElementById('dashOpgViewport');
  const scanBtnText = document.getElementById('dashOpgScanBtnText');
  const statusEl = document.getElementById('dashOpgStatus');
  const btn = document.getElementById('dashOpgScanBtn');

  if (!viewport) return;

  if (isDashOpgScanning) {
    resetDashOpgScan();
  } else {
    isDashOpgScanning = true;
    viewport.classList.add('scanning-running');
    viewport.classList.remove('scanning-active');
    if (scanBtnText) scanBtnText.textContent = "Analyzing Neural Layers...";
    if (btn) btn.querySelector('i').className = "fas fa-spinner fa-spin";
    if (statusEl) {
      statusEl.textContent = "Scanning mandibular & maxillary dentition (48%)...";
      statusEl.style.color = "#0284c7";
    }

    dashOpgScanTimer = setTimeout(() => {
      viewport.classList.remove('scanning-running');
      viewport.classList.add('scanning-active');
      if (scanBtnText) scanBtnText.textContent = "Reset Scan";
      if (btn) btn.querySelector('i').className = "fas fa-redo";
      if (statusEl) {
        statusEl.innerHTML = '<strong style="color: #10b981;">✓ 3 Pathologies Identified</strong> (Impaction, Caries, Crest)';
      }
    }, 1600);
  }
}

function resetDashOpgScan() {
  clearTimeout(dashOpgScanTimer);
  isDashOpgScanning = false;
  const viewport = document.getElementById('dashOpgViewport');
  const scanBtnText = document.getElementById('dashOpgScanBtnText');
  const statusEl = document.getElementById('dashOpgStatus');
  const btn = document.getElementById('dashOpgScanBtn');

  if (viewport) viewport.classList.remove('scanning-running', 'scanning-active');
  if (scanBtnText) scanBtnText.textContent = "Start AI Deep Scan";
  if (btn) btn.querySelector('i').className = "fas fa-play";
  if (statusEl) {
    statusEl.textContent = "Diagnostics idle. Click scan.";
    statusEl.style.color = "#64748b";
  }
}

// =========================================================
// AI COSMETIC SMILE MAKEOVER & DIGITAL SMILE DESIGN
// =========================================================
let modalPreparedBefore = null;
let modalPreparedAfter = null;
let modalPreparedAspect = null;

function openSmileMakeoverModal(beforeImg, afterImg, patientName, aspectRatio) {
  const defaultBefore = window.samplePatientBeforeUrl || window.sampleSmileBeforeUrl || "/static/Dental/images/sample_patient_before.jpg";
  const defaultAfter = window.samplePatientAfterUrl || window.sampleSmileAfterUrl || "/static/Dental/images/sample_patient_after.jpg";

  const beforeEl = document.getElementById('dashMakeoverBeforeImg');
  const afterEl = document.getElementById('dashMakeoverAfterImg');
  const nameEl = document.getElementById('dashSmilePatientName');
  const wrapper = document.getElementById('dashMakeoverWrapper');

  const bSrc = beforeImg || defaultBefore;
  const aSrc = afterImg || defaultAfter;

  if (beforeEl) beforeEl.src = bSrc;
  if (afterEl) afterEl.src = aSrc;
  if (nameEl && patientName) nameEl.textContent = patientName;

  if (wrapper) {
    if (aspectRatio) {
      wrapper.style.aspectRatio = aspectRatio;
    } else if (bSrc.includes('sample_patient') || (afterImg && afterImg.includes('sample_patient'))) {
      wrapper.style.aspectRatio = "576 / 508";
    } else {
      wrapper.style.aspectRatio = "16 / 10";
    }
  }

  setDashMakeoverPercent(50);
  openModal('smileMakeoverModal');
  setupDashMakeoverEvents();
}
window.openSmileMakeoverModal = openSmileMakeoverModal;

function loadSmileCase(caseKey, patientName) {
  if (caseKey === 'patient_ortho') {
    openSmileMakeoverModal(
      window.samplePatientBeforeUrl || "/static/Dental/images/sample_patient_before.jpg",
      window.samplePatientAfterUrl || "/static/Dental/images/sample_patient_after.jpg",
      patientName || "Ananya Sharma",
      "576 / 508"
    );
  } else {
    openSmileMakeoverModal(
      window.sampleSmileBeforeUrl || "/static/Dental/images/smile_before_brown.jpg",
      window.sampleSmileAfterUrl || "/static/Dental/images/smile_after_white.jpg",
      patientName || "Kavitha Ramesh",
      "16 / 10"
    );
  }
}
window.loadSmileCase = loadSmileCase;

function resetDashSmileToDefault() {
  loadSmileCase('patient_ortho', 'Ananya Sharma');
}
window.resetDashSmileToDefault = resetDashSmileToDefault;

// Helper: Process an image file, auto-detecting 2-in-1 composite (Top: Before, Bottom: After)
function processSmileImageFile(file, targetType, callback) {
  if (!file) return;
  const reader = new FileReader();
  reader.onload = function (evt) {
    const dataUrl = evt.target.result;
    const img = new Image();
    img.onload = function () {
      const w = img.naturalWidth;
      const h = img.naturalHeight;

      // Check if it's a 2-in-1 composite (vertical split: height > 1.15 * width) or explicitly requested
      if (targetType === 'split' || (targetType !== 'after' && targetType !== 'before' && h > 1.15 * w)) {
        const halfH = Math.floor(h / 2);

        // Canvas 1: Top Half (BEFORE)
        const cBefore = document.createElement('canvas');
        cBefore.width = w;
        cBefore.height = halfH;
        const ctxB = cBefore.getContext('2d');
        ctxB.drawImage(img, 0, 0, w, halfH, 0, 0, w, halfH);
        const beforeData = cBefore.toDataURL('image/jpeg', 0.95);

        // Canvas 2: Bottom Half (AFTER)
        const cAfter = document.createElement('canvas');
        cAfter.width = w;
        cAfter.height = h - halfH;
        const ctxA = cAfter.getContext('2d');
        ctxA.drawImage(img, 0, halfH, w, h - halfH, 0, 0, w, h - halfH);
        const afterData = cAfter.toDataURL('image/jpeg', 0.95);

        callback({
          isSplit: true,
          beforeData: beforeData,
          afterData: afterData,
          aspectRatio: `${w} / ${halfH}`,
          width: w,
          height: halfH
        });
      } else {
        callback({
          isSplit: false,
          dataUrl: dataUrl,
          aspectRatio: `${w} / ${h}`,
          width: w,
          height: h
        });
      }
    };
    img.src = dataUrl;
  };
  reader.readAsDataURL(file);
}

function handleDashSmileUpload(e, targetType) {
  const file = e.target.files && e.target.files[0];
  if (!file) return;

  processSmileImageFile(file, targetType, function (res) {
    if (res.isSplit) {
      openSmileMakeoverModal(
        res.beforeData,
        res.afterData,
        file.name.replace(/\.[^/.]+$/, "") + " (2-in-1 Patient Smile)",
        res.aspectRatio
      );
    } else if (targetType === 'after') {
      const afterEl = document.getElementById('dashMakeoverAfterImg');
      if (afterEl) afterEl.src = res.dataUrl;
    } else {
      const beforeEl = document.getElementById('dashMakeoverBeforeImg');
      if (beforeEl) beforeEl.src = res.dataUrl;
      openSmileMakeoverModal(
        res.dataUrl,
        null,
        file.name.replace(/\.[^/.]+$/, "") + " (Patient Smile)",
        res.aspectRatio
      );
    }
  });
  e.target.value = "";
}
window.handleDashSmileUpload = handleDashSmileUpload;

// Functions for dedicated Upload Modal
function switchSmileUploadMode(mode) {
  const splitSec = document.getElementById('smileSplitUploadSection');
  const dualSec = document.getElementById('smileDualUploadSection');
  const tabSplit = document.getElementById('tabSplitModeBtn');
  const tabDual = document.getElementById('tabDualModeBtn');

  if (mode === 'split') {
    if (splitSec) splitSec.style.display = 'block';
    if (dualSec) dualSec.style.display = 'none';
    if (tabSplit) {
      tabSplit.style.background = 'white';
      tabSplit.style.color = '#0f172a';
      tabSplit.style.boxShadow = '0 1px 3px rgba(0,0,0,0.1)';
    }
    if (tabDual) {
      tabDual.style.background = 'transparent';
      tabDual.style.color = '#64748b';
      tabDual.style.boxShadow = 'none';
    }
  } else {
    if (splitSec) splitSec.style.display = 'none';
    if (dualSec) dualSec.style.display = 'block';
    if (tabDual) {
      tabDual.style.background = 'white';
      tabDual.style.color = '#0f172a';
      tabDual.style.boxShadow = '0 1px 3px rgba(0,0,0,0.1)';
    }
    if (tabSplit) {
      tabSplit.style.background = 'transparent';
      tabSplit.style.color = '#64748b';
      tabSplit.style.boxShadow = 'none';
    }
  }
}
window.switchSmileUploadMode = switchSmileUploadMode;

function handleModalSmileUpload(e, targetType) {
  const file = e.target.files && e.target.files[0];
  if (!file) return;

  processSmileImageFile(file, targetType, function (res) {
    const previewBox = document.getElementById('smileUploadPreviewBox');
    const prevB = document.getElementById('modalPreviewBeforeImg');
    const prevA = document.getElementById('modalPreviewAfterImg');
    const prevDim = document.getElementById('previewPhotoDim');

    if (res.isSplit) {
      modalPreparedBefore = res.beforeData;
      modalPreparedAfter = res.afterData;
      modalPreparedAspect = res.aspectRatio;

      if (prevB) prevB.src = res.beforeData;
      if (prevA) prevA.src = res.afterData;
      if (prevDim) prevDim.textContent = `${res.width} x ${res.height} px (Top: Before, Bottom: After)`;
      if (previewBox) previewBox.style.display = 'block';

      // Auto-launch the simulator directly after picking the 2-in-1 photo
      setTimeout(() => {
        launchPreparedSmileMakeover();
      }, 350);
    } else if (targetType === 'after') {
      modalPreparedAfter = res.dataUrl;
      if (prevA) prevA.src = res.dataUrl;
      if (!modalPreparedAspect) modalPreparedAspect = res.aspectRatio;
      if (previewBox) previewBox.style.display = 'block';
    } else {
      modalPreparedBefore = res.dataUrl;
      if (prevB) prevB.src = res.dataUrl;
      modalPreparedAspect = res.aspectRatio;
      if (!modalPreparedAfter) {
        modalPreparedAfter = window.samplePatientAfterUrl || window.sampleSmileAfterUrl;
        if (prevA) prevA.src = modalPreparedAfter;
      }
      if (previewBox) previewBox.style.display = 'block';
    }
  });
  e.target.value = "";
}
window.handleModalSmileUpload = handleModalSmileUpload;

function handleDirectSmileCaseUpload(e) {
  const file = e.target.files && e.target.files[0];
  if (!file) return;

  processSmileImageFile(file, 'auto', function (res) {
    if (res.isSplit) {
      openSmileMakeoverModal(
        res.beforeData,
        res.afterData,
        file.name.replace(/\.[^/.]+$/, "") + " (Patient Case)",
        res.aspectRatio
      );
    } else {
      const defaultAfter = window.samplePatientAfterUrl || window.sampleSmileAfterUrl;
      openSmileMakeoverModal(
        res.dataUrl,
        defaultAfter,
        file.name.replace(/\.[^/.]+$/, "") + " (Patient Case)",
        res.aspectRatio
      );
    }
  });
  e.target.value = "";
}
window.handleDirectSmileCaseUpload = handleDirectSmileCaseUpload;

function launchPreparedSmileMakeover() {
  const pName = document.getElementById('smileUploadPatientName')?.value?.trim() || "Ananya Sharma";
  closeModal('uploadSmileMakeoverModal');

  const bSrc = modalPreparedBefore || window.samplePatientBeforeUrl;
  const aSrc = modalPreparedAfter || window.samplePatientAfterUrl;
  const aspect = modalPreparedAspect || "576 / 508";

  openSmileMakeoverModal(bSrc, aSrc, pName, aspect);
}
window.launchPreparedSmileMakeover = launchPreparedSmileMakeover;

function setDashMakeoverPercent(percent) {
  const clamped = Math.max(0, Math.min(100, percent));
  const clipEl = document.getElementById('dashMakeoverClip');
  const barEl = document.getElementById('dashMakeoverBar');
  const rangeEl = document.getElementById('dashMakeoverRange');

  if (clipEl) clipEl.style.clipPath = `polygon(0 0, ${clamped}% 0, ${clamped}% 100%, 0 100%)`;
  if (barEl) barEl.style.left = `${clamped}%`;
  if (rangeEl) rangeEl.value = clamped;
}

let dashMakeoverEventsBound = false;
function setupDashMakeoverEvents() {
  if (dashMakeoverEventsBound) return;
  dashMakeoverEventsBound = true;

  const wrapper = document.getElementById('dashMakeoverWrapper');
  const rangeEl = document.getElementById('dashMakeoverRange');
  if (!wrapper) return;

  let isDragging = false;

  const calcPercent = (e) => {
    const rect = wrapper.getBoundingClientRect();
    const clientX = e.touches ? e.touches[0].clientX : e.clientX;
    const x = clientX - rect.left;
    return (x / rect.width) * 100;
  };

  wrapper.addEventListener('mousemove', (e) => {
    setDashMakeoverPercent(calcPercent(e));
  });

  wrapper.addEventListener('pointerdown', (e) => {
    isDragging = true;
    try { wrapper.setPointerCapture(e.pointerId); } catch (_) { }
    setDashMakeoverPercent(calcPercent(e));
  });

  wrapper.addEventListener('pointermove', (e) => {
    if (isDragging || e.pointerType === 'mouse') {
      setDashMakeoverPercent(calcPercent(e));
    }
  });

  const stopDrag = (e) => {
    isDragging = false;
    try { if (e && e.pointerId) wrapper.releasePointerCapture(e.pointerId); } catch (_) { }
  };

  wrapper.addEventListener('pointerup', stopDrag);
  wrapper.addEventListener('pointercancel', stopDrag);

  wrapper.addEventListener('touchmove', (e) => {
    setDashMakeoverPercent(calcPercent(e));
  }, { passive: true });

  if (rangeEl) {
    rangeEl.addEventListener('input', (e) => {
      setDashMakeoverPercent(parseFloat(e.target.value));
    });
  }
}

function selectVeneerShade(shade, btnEl) {
  document.querySelectorAll('#shadeSelectorGrid .shade-chip').forEach(chip => {
    chip.style.border = '1px solid #cbd5e1';
    chip.style.background = '#fff';
    chip.style.color = '#334155';
    chip.classList.remove('active');
  });

  if (btnEl) {
    btnEl.style.border = '2px solid #d97706';
    btnEl.style.background = '#fffbeb';
    btnEl.style.color = '#b45309';
    btnEl.classList.add('active');
  }

  const labelEl = document.getElementById('currentShadeLabel');
  if (labelEl) labelEl.textContent = shade;

  const afterEl = document.getElementById('dashMakeoverAfterImg');
  if (afterEl) {
    if (shade === 'BL1') afterEl.style.filter = 'brightness(1.15) contrast(1.08)';
    else if (shade === 'A1') afterEl.style.filter = 'brightness(1.06) contrast(1.04)';
    else if (shade === 'A2') afterEl.style.filter = 'brightness(1.0) contrast(1.0)';
    else if (shade === 'B1') afterEl.style.filter = 'brightness(1.1) contrast(1.05)';
  }
}

function adjustWhiteningIntensity(val) {
  const textEl = document.getElementById('whiteningLevelText');
  if (textEl) textEl.textContent = `${val}% (${val > 80 ? 'Ultra Bright' : (val > 60 ? 'Natural Bright' : 'Subtle Clean')})`;

  const afterEl = document.getElementById('dashMakeoverAfterImg');
  if (afterEl) {
    const factor = 0.8 + (val / 100) * 0.35;
    afterEl.style.filter = `brightness(${factor.toFixed(2)}) contrast(1.06)`;
  }
}

// Modal openers for Appointment vs Patient with Teeth Chart
function openAddAppointmentModal() {
  const chk = document.getElementById('chkOpenTeethChart');
  if (chk) chk.checked = false;
  const header = document.getElementById('addPatientModalHeader');
  if (header) header.innerHTML = '<i class="fas fa-calendar-plus" style="color: #2563eb; margin-right: 8px;"></i>Book Appointment';
  const desc = document.getElementById('addPatientModalDesc');
  if (desc) desc.innerHTML = 'Saves an appointment only. Patient is added to the <strong>Patient Tab</strong> once a Teeth Chart is attached.';
  openModal('addPatientModal');
}

function openAddPatientWithChartModal() {
  const chk = document.getElementById('chkOpenTeethChart');
  if (chk) chk.checked = true;
  const header = document.getElementById('addPatientModalHeader');
  if (header) header.innerHTML = '<i class="fas fa-tooth" style="color: #0284c7; margin-right: 8px;"></i>Add Patient & Teeth Chart';
  const desc = document.getElementById('addPatientModalDesc');
  if (desc) desc.innerHTML = 'Creates appointment and immediately opens the <strong>Clinical Teeth Chart</strong> to register patient in the Patient Tab.';
  openModal('addPatientModal');
}

// Export helpers globally
window.switchTab = switchTab;

let isAllTabsViewActive = false;

function toggleAllTabsView() {
  const sections = document.querySelectorAll('.content-section');
  const btn = document.getElementById('btnShowAllTabs');

  if (!isAllTabsViewActive) {
    sections.forEach(sec => { sec.style.display = 'block'; });
    document.querySelectorAll('.nav-link').forEach(l => l.classList.remove('active'));
    isAllTabsViewActive = true;
    if (btn) {
      btn.innerHTML = '<i class="fas fa-eye-slash" style="color: #dc2626;"></i> <span>Single Tab View</span>';
      btn.style.background = '#fee2e2';
      btn.style.borderColor = '#fca5a5';
      btn.style.color = '#991b1b';
    }
    const heading = document.getElementById('pageHeading');
    if (heading) heading.textContent = 'All Dashboard Sections (Full View)';
    window.scrollTo({ top: 0, behavior: 'smooth' });
  } else {
    isAllTabsViewActive = false;
    if (btn) {
      btn.innerHTML = '<i class="fas fa-layer-group" style="color: #2563eb;"></i> <span>Show All Tabs</span>';
      btn.style.background = '#f1f5f9';
      btn.style.borderColor = '#cbd5e1';
      btn.style.color = '#1e293b';
    }
    const curHash = window.location.hash.replace('#', '').trim() || 'dashboard';
    switchTab(curHash);
  }
}

window.toggleAllTabsView = toggleAllTabsView;
window.showAllTabs = function() { if (!isAllTabsViewActive) toggleAllTabsView(); };

window.openAddAppointmentModal = openAddAppointmentModal;
window.openAddPatientWithChartModal = openAddPatientWithChartModal;
window.openPatientClinicalHub = openPatientClinicalHub;
window.openClinicalHubByName = openClinicalHubByName;
window.addTwoMoreTeethToChart = addTwoMoreTeethToChart;

// Handle hash navigation and auto-open of chart on page load
window.addEventListener('DOMContentLoaded', function () {
  // Initial filter for appointments (default today)
  if (typeof applyAppointmentsFilter === 'function') { applyAppointmentsFilter(); }
  // 1. Check URL hash
  if (window.location.hash) {
    const hashSec = window.location.hash.replace('#', '').trim();
    if (hashSec && document.getElementById('section-' + hashSec)) {
      switchTab(hashSec);
    }
  }

  // 2. Check query params for auto-opening clinical hub
  const urlParams = new URLSearchParams(window.location.search);
  const openChartId = urlParams.get('open_chart_id');
  const openChartName = urlParams.get('open_chart_name');
  if (openChartId) {
    // Try finding matching appointment from allClinicAppointments
    const match = (allClinicAppointments || []).find(a => String(a.id) === String(openChartId));
    if (match) {
      openPatientClinicalHub(match.id, match.code, match.patient, match.phone, match.age || '', match.gender || '', match.service || '', match.doctor || '', 'chart');
    } else {
      openPatientClinicalHub(openChartId, '#APT-' + openChartId, openChartName || 'Patient', '', '', '', 'Dental Consultation', 'Dr. Anoop', 'chart');
    }
  }
});





// ==========================================
// MATERIAL TAB: BOX 1 & BOX 2 CONTROLLERS
// ==========================================
function switchMaterialBox(mode) {
  const box1 = document.getElementById('materialBox1Panel');
  const box2 = document.getElementById('materialBox2Panel');
  const btn1 = document.getElementById('btnMatBox1');
  const btn2 = document.getElementById('btnMatBox2');
  const btnAll = document.getElementById('btnMatBoxAll');

  [btn1, btn2, btnAll].forEach(b => { if (b) b.classList.remove('active'); });

  if (mode === 'box1') {
    if (box1) box1.style.display = 'block';
    if (box2) box2.style.display = 'none';
    if (btn1) btn1.classList.add('active');
  } else if (mode === 'box2') {
    if (box1) box1.style.display = 'none';
    if (box2) box2.style.display = 'block';
    if (btn2) btn2.classList.add('active');
  } else {
    if (box1) box1.style.display = 'block';
    if (box2) box2.style.display = 'block';
    if (btnAll) btnAll.classList.add('active');
  }
}

// BOX 1 (MEDICINE INVENTORY)
let selectedMedRow = null;

function selectMedLookup(targetInputId, value, el) {
  const input = document.getElementById(targetInputId);
  if (input) {
    input.value = value;
  }
  if (el && el.parentElement) {
    el.parentElement.querySelectorAll('.med-lookup-item').forEach(item => item.classList.remove('active'));
    el.classList.add('active');
  }
  // Connect selection directly to live table filter
  filterMedicineTableFromInputs();
}

function selectMedInventoryRow(row) {
  const table = document.getElementById('medInventoryTable');
  if (table) {
    table.querySelectorAll('.clickable-table-row').forEach(r => r.classList.remove('selected-row'));
  }
  row.classList.add('selected-row');
  selectedMedRow = row;

  const cells = row.getElementsByTagName('td');
  if (cells.length >= 11) {
    const val = (txt) => txt.trim() === '-' ? '' : txt.trim();
    if (document.getElementById('medCategory')) document.getElementById('medCategory').value = val(cells[0].innerText);
    if (document.getElementById('medType')) document.getElementById('medType').value = val(cells[1].innerText);
    if (document.getElementById('medProductName')) document.getElementById('medProductName').value = val(cells[2].innerText);
    if (document.getElementById('medBrandName')) document.getElementById('medBrandName').value = val(cells[3].innerText);
    if (document.getElementById('medStrength')) document.getElementById('medStrength').value = val(cells[4].innerText);
    if (document.getElementById('medDosage')) document.getElementById('medDosage').value = val(cells[5].innerText);
    if (document.getElementById('medRate')) document.getElementById('medRate').value = val(cells[6].innerText);
    if (document.getElementById('medFrequency')) document.getElementById('medFrequency').value = val(cells[7].innerText);
    if (document.getElementById('medDuration')) document.getElementById('medDuration').value = val(cells[8].innerText);
    if (document.getElementById('medIngredients')) document.getElementById('medIngredients').value = val(cells[9].innerText);
    if (document.getElementById('medComments')) document.getElementById('medComments').value = val(cells[10].innerText);

    // Synchronize highlight across right 6 lookup boxes
    const highlightBoxItem = (containerId, textVal) => {
      const box = document.getElementById(containerId);
      if (!box) return;
      box.querySelectorAll('.med-lookup-item').forEach(item => {
        const itemVal = (item.getAttribute('data-val') || item.innerText || '').trim().toLowerCase();
        if (textVal && itemVal === textVal.toLowerCase()) {
          item.classList.add('active');
        } else {
          item.classList.remove('active');
        }
      });
    };
    highlightBoxItem('lookupContainerCategory', val(cells[0].innerText));
    highlightBoxItem('lookupContainerType', val(cells[1].innerText));
    highlightBoxItem('lookupContainerProductName', val(cells[2].innerText));
    highlightBoxItem('lookupContainerBrandName', val(cells[3].innerText));
    highlightBoxItem('lookupContainerIngredients', val(cells[9].innerText));
    highlightBoxItem('lookupContainerContraIndications', val(cells[10].innerText));
  }
}

function updateMedInventoryCountBadge() {
  const tbody = document.getElementById('medInventoryTableBody');
  const badge = document.getElementById('medInventoryCountBadge');
  if (!tbody || !badge) return;
  const rows = tbody.querySelectorAll('tr');
  let visibleCount = 0;
  rows.forEach(r => { if (r.style.display !== 'none') visibleCount++; });
  badge.innerText = `${visibleCount} item${visibleCount === 1 ? '' : 's'}`;
}

function addMedicineInventoryRow() {
  const category = (document.getElementById('medCategory')?.value || '').trim();
  const type = (document.getElementById('medType')?.value || '').trim();
  const prodName = (document.getElementById('medProductName')?.value || '').trim() || 'Product';
  const brandName = (document.getElementById('medBrandName')?.value || '').trim();
  const strength = (document.getElementById('medStrength')?.value || '').trim();
  const dosage = (document.getElementById('medDosage')?.value || '').trim();
  const rate = (document.getElementById('medRate')?.value || '').trim() || '0.0';
  const frequency = (document.getElementById('medFrequency')?.value || '').trim() || 'Daily';
  const duration = (document.getElementById('medDuration')?.value || '').trim() || '5 Days';
  const ingredients = (document.getElementById('medIngredients')?.value || '').trim();
  const comments = (document.getElementById('medComments')?.value || '').trim();

  const tbody = document.getElementById('medInventoryTableBody');
  if (!tbody) return;

  const emptyNotice = document.getElementById('emptyMedNoticeRow');
  if (emptyNotice) emptyNotice.remove();

  const newRow = document.createElement('tr');
  newRow.className = 'clickable-table-row';
  newRow.innerHTML = `
    <td style="padding: 7px 10px; border: 1px solid #e2e8f0;">${category || '-'}</td>
    <td style="padding: 7px 10px; border: 1px solid #e2e8f0;">${type || '-'}</td>
    <td style="padding: 7px 10px; border: 1px solid #e2e8f0; font-weight: 600;">${prodName}</td>
    <td style="padding: 7px 10px; border: 1px solid #e2e8f0;">${brandName || '-'}</td>
    <td style="padding: 7px 10px; border: 1px solid #e2e8f0;">${strength || '-'}</td>
    <td style="padding: 7px 10px; border: 1px solid #e2e8f0;">${dosage || '-'}</td>
    <td style="padding: 7px 10px; border: 1px solid #e2e8f0; font-weight: 600;">${rate}</td>
    <td style="padding: 7px 10px; border: 1px solid #e2e8f0;">${frequency || '-'}</td>
    <td style="padding: 7px 10px; border: 1px solid #e2e8f0;">${duration || '-'}</td>
    <td style="padding: 7px 10px; border: 1px solid #e2e8f0;">${ingredients || '-'}</td>
    <td style="padding: 7px 10px; border: 1px solid #e2e8f0;">${comments || '-'}</td>
  `;
  tbody.insertBefore(newRow, tbody.firstChild);
  selectMedInventoryRow(newRow);

  // Smooth visual feedback on added row
  newRow.style.transition = 'background-color 0.4s ease';
  newRow.style.backgroundColor = '#dcfce7';
  setTimeout(() => { if (newRow) newRow.style.backgroundColor = ''; }, 1200);

  updateMedInventoryCountBadge();

  // Save to database via AJAX
  const formData = new URLSearchParams();
  formData.append('csrfmiddlewaretoken', getCsrfToken());
  formData.append('category', category);
  formData.append('item_type', type);
  formData.append('product_name', prodName);
  formData.append('brand_name', brandName);
  formData.append('strength', strength);
  formData.append('dosage', dosage);
  formData.append('rate', rate);
  formData.append('frequency', frequency);
  formData.append('duration', duration);
  formData.append('ingredients', ingredients);
  formData.append('contra_indications', comments);

  fetch('/dashboard/save-medicine/', {
    method: 'POST',
    headers: {
      'Content-Type': 'application/x-www-form-urlencoded',
      'X-Requested-With': 'XMLHttpRequest'
    },
    body: formData.toString()
  })
  .then(res => res.json())
  .then(data => {
    if (data.status === 'success' && data.medicine) {
      newRow.setAttribute('data-id', data.medicine.id);
      console.log('Saved medicine to database:', data.medicine);
    }
  })
  .catch(err => console.error('Error saving medicine to database:', err));
}

function updateMedicineInventoryRow() {
  const tbody = document.getElementById('medInventoryTableBody');
  if (!tbody) return;

  if (!selectedMedRow) {
    addMedicineInventoryRow();
    return;
  }

  const category = (document.getElementById('medCategory')?.value || '').trim();
  const type = (document.getElementById('medType')?.value || '').trim();
  const prodName = (document.getElementById('medProductName')?.value || '').trim() || 'Product';
  const brandName = (document.getElementById('medBrandName')?.value || '').trim();
  const strength = (document.getElementById('medStrength')?.value || '').trim();
  const dosage = (document.getElementById('medDosage')?.value || '').trim();
  const rate = (document.getElementById('medRate')?.value || '').trim() || '0.0';
  const frequency = (document.getElementById('medFrequency')?.value || '').trim() || 'Daily';
  const duration = (document.getElementById('medDuration')?.value || '').trim() || '5 Days';
  const ingredients = (document.getElementById('medIngredients')?.value || '').trim();
  const comments = (document.getElementById('medComments')?.value || '').trim();

  const cells = selectedMedRow.getElementsByTagName('td');
  if (cells.length >= 11) {
    cells[0].innerText = category || '-';
    cells[1].innerText = type || '-';
    cells[2].innerText = prodName;
    cells[3].innerText = brandName || '-';
    cells[4].innerText = strength || '-';
    cells[5].innerText = dosage || '-';
    cells[6].innerText = rate;
    cells[7].innerText = frequency || '-';
    cells[8].innerText = duration || '-';
    cells[9].innerText = ingredients || '-';
    cells[10].innerText = comments || '-';

    selectedMedRow.style.transition = 'background-color 0.4s ease';
    selectedMedRow.style.backgroundColor = '#ccfbf1';
    setTimeout(() => { if (selectedMedRow) selectedMedRow.style.backgroundColor = ''; }, 1200);
  }

  updateMedInventoryCountBadge();

  // Save changes to database via AJAX
  const medId = selectedMedRow.getAttribute('data-id') || '';
  const formData = new URLSearchParams();
  formData.append('csrfmiddlewaretoken', getCsrfToken());
  if (medId) formData.append('med_id', medId);
  formData.append('category', category);
  formData.append('item_type', type);
  formData.append('product_name', prodName);
  formData.append('brand_name', brandName);
  formData.append('strength', strength);
  formData.append('dosage', dosage);
  formData.append('rate', rate);
  formData.append('frequency', frequency);
  formData.append('duration', duration);
  formData.append('ingredients', ingredients);
  formData.append('contra_indications', comments);

  fetch('/dashboard/save-medicine/', {
    method: 'POST',
    headers: {
      'Content-Type': 'application/x-www-form-urlencoded',
      'X-Requested-With': 'XMLHttpRequest'
    },
    body: formData.toString()
  })
  .then(res => res.json())
  .then(data => {
    if (data.status === 'success' && data.medicine) {
      selectedMedRow.setAttribute('data-id', data.medicine.id);
      console.log('Updated medicine in database:', data.medicine);
    }
  })
  .catch(err => console.error('Error updating medicine in database:', err));
}

function deleteMedicineInventoryRow() {
  const tbody = document.getElementById('medInventoryTableBody');
  if (!tbody) return;

  if (!selectedMedRow) {
    alert("Please select a row in the Medicine Inventory List to delete.");
    return;
  }

  const medId = selectedMedRow.getAttribute('data-id');
  const prodName = selectedMedRow.getElementsByTagName('td')[2]?.innerText.trim() || 'this item';

  if (confirm(`Are you sure you want to delete "${prodName}" from the database?`)) {
    if (medId) {
      const formData = new URLSearchParams();
      formData.append('csrfmiddlewaretoken', getCsrfToken());
      fetch(`/dashboard/delete-medicine/${medId}/`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/x-www-form-urlencoded',
          'X-Requested-With': 'XMLHttpRequest'
        },
        body: formData.toString()
      })
      .then(res => res.json())
      .then(data => console.log('Deleted medicine from database:', data))
      .catch(err => console.error('Error deleting medicine from database:', err));
    }

    selectedMedRow.remove();
    selectedMedRow = null;
    refreshMedicineInventoryForm();
    updateMedInventoryCountBadge();
  }
}

function newMedicineInventoryRow() {
  refreshMedicineInventoryForm();
  const catInput = document.getElementById('medCategory');
  if (catInput) catInput.focus();
}

function refreshMedicineInventoryForm() {
  const form = document.getElementById('medInventoryForm');
  if (form) form.reset();
  const table = document.getElementById('medInventoryTable');
  if (table) {
    table.querySelectorAll('.clickable-table-row').forEach(r => r.classList.remove('selected-row'));
  }
  selectedMedRow = null;
  // Reset all 6 lookup boxes
  ['lookupContainerCategory', 'lookupContainerType', 'lookupContainerIngredients', 'lookupContainerProductName', 'lookupContainerBrandName', 'lookupContainerContraIndications'].forEach(id => {
    filterLookupList(id, '');
  });
  // Reset table filter
  filterMedicineTableFromInputs();
  updateMedInventoryCountBadge();
}

// BOX 2 (LAB PAYMENTS)
let selectedLabRow = null;
let currentSelectedLab = 'Apex Dental Ceramics';

const sampleLabLedgers = {
  'Apex Dental Ceramics': [],
  'DentCraft Dental Lab': [],
  'Prime 3D CAD/CAM Lab': [],
  'Dental Art Studio': [],
  'Precision Denture Works': [],
  'DentCare Global Lab': []
};


// LAB METADATA & REGISTRATION (LAB NAME, CITY, UPLOAD LOGO)
let currentNewLabLogoDataUrl = '';
const labMetadata = {
  'Apex Dental Ceramics': { city: 'Mumbai', logo: '' },
  'DentCraft Dental Lab': { city: 'Delhi', logo: '' },
  'Prime 3D CAD/CAM Lab': { city: 'Bengaluru', logo: '' },
  'Dental Art Studio': { city: 'Pune', logo: '' },
  'Precision Denture Works': { city: 'Hyderabad', logo: '' },
  'DentCare Global Lab': { city: 'Kochi', logo: '' }
};

function previewLabLogoInput(input) {
  if (input.files && input.files[0]) {
    const file = input.files[0];
    const reader = new FileReader();
    reader.onload = function (e) {
      currentNewLabLogoDataUrl = e.target.result;
      const img = document.getElementById('labLogoPreviewImg');
      const placeholder = document.getElementById('labLogoPlaceholderIcon');
      if (img) {
        img.src = currentNewLabLogoDataUrl;
        img.style.display = 'block';
      }
      if (placeholder) placeholder.style.display = 'none';
    };
    reader.readAsDataURL(file);
  }
}

function resetNewLabForm() {
  const form = document.getElementById('addNewLabForm');
  if (form) form.reset();
  currentNewLabLogoDataUrl = '';
  const img = document.getElementById('labLogoPreviewImg');
  const placeholder = document.getElementById('labLogoPlaceholderIcon');
  if (img) { img.src = ''; img.style.display = 'none'; }
  if (placeholder) placeholder.style.display = 'block';
}

function addNewDentalLab() {
  const nameInput = document.getElementById('inputLabName');
  const cityInput = document.getElementById('inputLabCity');
  const labName = (nameInput?.value || '').trim();
  const city = (cityInput?.value || '').trim();
  const logo = currentNewLabLogoDataUrl;

  if (!labName) {
    alert("Please enter a Lab Name.");
    if (nameInput) nameInput.focus();
    return;
  }

  // Store metadata
  labMetadata[labName] = { city: city, logo: logo };
  if (!sampleLabLedgers[labName]) {
    sampleLabLedgers[labName] = [];
  }

  // Append to labNameListContainer
  const container = document.getElementById('labNameListContainer');
  if (container) {
    let existingItem = Array.from(container.querySelectorAll('.lab-name-item')).find(el => (el.getAttribute('data-lab') || el.innerText.trim()).startsWith(labName));
    if (!existingItem) {
      const newItem = document.createElement('div');
      newItem.className = 'lab-name-item active-lab';
      newItem.setAttribute('data-lab', labName);
      newItem.setAttribute('data-city', city);
      newItem.setAttribute('data-logo', logo);
      newItem.onclick = function () { selectLabName(labName, this); };
      newItem.innerHTML = `
        <span style="display: flex; align-items: center; justify-content: space-between; gap: 6px;">
          <span style="display: flex; align-items: center; gap: 5px;">
            ${logo ? `<img src="${logo}" style="width: 16px; height: 16px; border-radius: 2px; object-fit: contain;">` : `<i class="fas fa-flask" style="font-size: 0.7rem; color: #2563eb;"></i>`}
            <strong>${labName}</strong>
          </span>
          ${city ? `<small style="font-size: 0.68rem; color: #64748b; background: #f1f5f9; padding: 1px 5px; border-radius: 3px;">${city}</small>` : ''}
        </span>
      `;
      container.insertBefore(newItem, container.firstChild);
      selectLabName(labName, newItem);
    } else {
      selectLabName(labName, existingItem);
    }
  }

  resetNewLabForm();
  alert(`Dental Lab "${labName}" has been successfully added!`);
}

function selectLabName(labName, el) {
  currentSelectedLab = labName;
  const list = document.getElementById('labNameListContainer');
  if (list) {
    list.querySelectorAll('.lab-name-item').forEach(item => item.classList.remove('active-lab'));
  }
  if (el) el.classList.add('active-lab');

  // Metadata (City & Logo)
  const meta = labMetadata[labName] || { city: el?.getAttribute('data-city') || '', logo: el?.getAttribute('data-logo') || '' };

  const header = document.getElementById('currentLabNameHeader');
  if (header) header.innerText = labName;

  const cityHeader = document.getElementById('currentLabCityHeader');
  if (cityHeader) {
    if (meta.city) {
      cityHeader.innerText = meta.city;
      cityHeader.style.display = 'inline-block';
    } else {
      cityHeader.style.display = 'none';
    }
  }

  const logoHeader = document.getElementById('currentLabLogoHeaderImg');
  if (logoHeader) {
    if (meta.logo) {
      logoHeader.src = meta.logo;
      logoHeader.style.display = 'inline-block';
    } else {
      logoHeader.style.display = 'none';
    }
  }

  loadLabTransactions(labName);
}

function loadLabTransactions(labName) {
  const tbody = document.getElementById('labPaymentTableBody');
  if (!tbody) return;
  tbody.innerHTML = '';

  const records = sampleLabLedgers[labName] || [];
  records.forEach(rec => {
    const tr = document.createElement('tr');
    tr.className = 'clickable-table-row';
    tr.onclick = function () { selectLabTableRow(this); };
    tr.innerHTML = `
      <td style="padding: 7px 10px; border: 1px solid #e2e8f0; font-weight: 700;">${rec.id}</td>
      <td style="padding: 7px 10px; border: 1px solid #e2e8f0;">${rec.date}</td>
      <td style="padding: 7px 10px; border: 1px solid #e2e8f0; font-weight: 600;">${rec.pid}</td>
      <td style="padding: 7px 10px; border: 1px solid #e2e8f0;">${rec.patient}</td>
      <td style="padding: 7px 10px; border: 1px solid #e2e8f0;">${rec.particular}</td>
      <td style="padding: 7px 10px; border: 1px solid #e2e8f0; text-align: right; font-weight: 600;">${rec.dr.toFixed(2)}</td>
      <td style="padding: 7px 10px; border: 1px solid #e2e8f0; text-align: right; color: ${rec.cr > 0 ? '#16a34a' : '#64748b'}; font-weight: ${rec.cr > 0 ? '600' : 'normal'};">${rec.cr.toFixed(2)}</td>
    `;
    tbody.appendChild(tr);
  });

  recalculateLabTotals();
  clearLabForm();
}

function selectLabTableRow(row) {
  const table = document.getElementById('labPaymentTable');
  if (table) {
    table.querySelectorAll('.clickable-table-row').forEach(r => r.classList.remove('selected-row'));
  }
  row.classList.add('selected-row');
  selectedLabRow = row;

  const cells = row.getElementsByTagName('td');
  if (cells.length >= 7) {
    if (document.getElementById('labDate')) document.getElementById('labDate').value = cells[1].innerText.trim();
    if (document.getElementById('labPatientId')) document.getElementById('labPatientId').value = cells[2].innerText.trim();
    if (document.getElementById('labPatientName')) document.getElementById('labPatientName').value = cells[3].innerText.trim();
    if (document.getElementById('labParticular')) document.getElementById('labParticular').value = cells[4].innerText.trim();
    if (document.getElementById('labDrAmount')) document.getElementById('labDrAmount').value = cells[5].innerText.trim();
    if (document.getElementById('labCrAmount')) document.getElementById('labCrAmount').value = cells[6].innerText.trim();
  }
}

function addLabPaymentRow() {
  const tbody = document.getElementById('labPaymentTableBody');
  if (!tbody) return;

  const date = (document.getElementById('labDate')?.value || '').trim() || '04-11-2026';
  const pid = (document.getElementById('labPatientId')?.value || '').trim() || 'P-Walkin';
  const pname = (document.getElementById('labPatientName')?.value || '').trim() || 'Walk-in Patient';
  const particular = (document.getElementById('labParticular')?.value || '').trim() || 'Dental Lab Work';
  const dr = parseFloat(document.getElementById('labDrAmount')?.value || 0) || 0;
  const cr = parseFloat(document.getElementById('labCrAmount')?.value || 0) || 0;

  const nextId = tbody.rows.length + 1;

  const tr = document.createElement('tr');
  tr.className = 'clickable-table-row';
  tr.onclick = function () { selectLabTableRow(this); };
  tr.innerHTML = `
    <td style="padding: 7px 10px; border: 1px solid #e2e8f0; font-weight: 700;">${nextId}</td>
    <td style="padding: 7px 10px; border: 1px solid #e2e8f0;">${date}</td>
    <td style="padding: 7px 10px; border: 1px solid #e2e8f0; font-weight: 600;">${pid}</td>
    <td style="padding: 7px 10px; border: 1px solid #e2e8f0;">${pname}</td>
    <td style="padding: 7px 10px; border: 1px solid #e2e8f0;">${particular}</td>
    <td style="padding: 7px 10px; border: 1px solid #e2e8f0; text-align: right; font-weight: 600;">${dr.toFixed(2)}</td>
    <td style="padding: 7px 10px; border: 1px solid #e2e8f0; text-align: right; color: ${cr > 0 ? '#16a34a' : '#64748b'}; font-weight: ${cr > 0 ? '600' : 'normal'};">${cr.toFixed(2)}</td>
  `;
  tbody.appendChild(tr);

  recalculateLabTotals();
  selectLabTableRow(tr);
}


function updateLabPaymentRow() {
  if (!selectedLabRow) {
    addLabPaymentRow();
    return;
  }
  const dateVal = document.getElementById('labDate')?.value || '04-11-2026';
  const pidVal = document.getElementById('labPatientId')?.value || '';
  const pnameVal = document.getElementById('labPatientName')?.value || '';
  const partVal = document.getElementById('labParticular')?.value || '';
  const drVal = parseFloat(document.getElementById('labDrAmount')?.value) || 0.0;
  const crVal = parseFloat(document.getElementById('labCrAmount')?.value) || 0.0;

  const cells = selectedLabRow.getElementsByTagName('td');
  if (cells.length >= 7) {
    cells[1].innerText = dateVal;
    cells[2].innerText = pidVal;
    cells[3].innerText = pnameVal;
    cells[4].innerText = partVal;
    cells[5].innerText = drVal.toFixed(2);
    cells[6].innerText = crVal.toFixed(2);

    selectedLabRow.style.transition = 'background-color 0.4s ease';
    selectedLabRow.style.backgroundColor = '#e0f2fe';
    setTimeout(() => { if (selectedLabRow) selectedLabRow.style.backgroundColor = ''; }, 1200);
  }

  recalculateLabTotals();
}

function deleteLabPaymentRow() {
  if (!selectedLabRow) {
    alert("Please select a transaction row in the Lab Register table to delete.");
    return;
  }
  if (confirm("Are you sure you want to delete this lab transaction?")) {
    selectedLabRow.remove();
    selectedLabRow = null;
    recalculateLabTotals();
    clearLabForm();
  }
}

function clearLabForm() {
  const form = document.getElementById('labPaymentForm');
  if (form) {
    if (document.getElementById('labPatientId')) document.getElementById('labPatientId').value = '';
    if (document.getElementById('labPatientName')) document.getElementById('labPatientName').value = '';
    if (document.getElementById('labParticular')) document.getElementById('labParticular').value = '';
    if (document.getElementById('labDrAmount')) document.getElementById('labDrAmount').value = '';
    if (document.getElementById('labCrAmount')) document.getElementById('labCrAmount').value = '';
  }
  const table = document.getElementById('labPaymentTable');
  if (table) {
    table.querySelectorAll('.clickable-table-row').forEach(r => r.classList.remove('selected-row'));
  }
  selectedLabRow = null;
  filterLabPaymentTableFromInputs();
}

function recalculateLabTotals() {
  const tbody = document.getElementById('labPaymentTableBody');
  if (!tbody) return;

  let totalDr = 0;
  let totalCr = 0;

  Array.from(tbody.rows).forEach(row => {
    if (row.style.display === 'none') return;
    const cells = row.getElementsByTagName('td');
    if (cells.length >= 7) {
      const dr = parseFloat(cells[5].innerText.replace(/[^0-9.-]/g, '')) || 0;
      const cr = parseFloat(cells[6].innerText.replace(/[^0-9.-]/g, '')) || 0;
      totalDr += dr;
      totalCr += cr;
    }
  });

  const balance = totalDr - totalCr;

  if (document.getElementById('labTotalDrDisplay')) document.getElementById('labTotalDrDisplay').value = totalDr.toFixed(2);
  if (document.getElementById('labTotalCrDisplay')) document.getElementById('labTotalCrDisplay').value = totalCr.toFixed(2);
  if (document.getElementById('labBalanceDisplay')) {
    const bEl = document.getElementById('labBalanceDisplay');
    bEl.value = balance.toFixed(2);
    bEl.style.color = balance > 0 ? '#dc2626' : '#16a34a';
  }
}

function previewLabRegister() {
  const modal = document.getElementById('labRegisterPreviewModal');
  const tbody = document.getElementById('labPaymentTableBody');
  const previewBody = document.getElementById('labRegisterModalTableBody');
  const labHeader = document.getElementById('previewModalLabName');
  const dateHeader = document.getElementById('previewModalDate');

  if (labHeader) labHeader.innerText = currentSelectedLab;
  if (dateHeader) dateHeader.innerText = document.getElementById('labDate')?.value || '04-11-2026';

  if (previewBody && tbody) {
    previewBody.innerHTML = '';
    Array.from(tbody.rows).forEach(r => {
      const clone = r.cloneNode(true);
      clone.classList.remove('selected-row');
      previewBody.appendChild(clone);
    });
  }

  const drVal = document.getElementById('labTotalDrDisplay')?.value || '0.00';
  const crVal = document.getElementById('labTotalCrDisplay')?.value || '0.00';
  const balVal = document.getElementById('labBalanceDisplay')?.value || '0.00';

  if (document.getElementById('modalPreviewTotalDr')) document.getElementById('modalPreviewTotalDr').innerText = '₹' + drVal;
  if (document.getElementById('modalPreviewTotalCr')) document.getElementById('modalPreviewTotalCr').innerText = '₹' + crVal;
  if (document.getElementById('modalPreviewBalance')) document.getElementById('modalPreviewBalance').innerText = '₹' + balVal;

  if (modal) {
    modal.classList.add('active');
    modal.style.display = 'flex';
  }
}

// Expose globally
window.switchMaterialBox = switchMaterialBox;
window.selectMedLookup = selectMedLookup;
window.selectMedInventoryRow = selectMedInventoryRow;
window.addMedicineInventoryRow = addMedicineInventoryRow;
window.updateMedicineInventoryRow = updateMedicineInventoryRow;
window.newMedicineInventoryRow = newMedicineInventoryRow;
window.updateMedInventoryCountBadge = updateMedInventoryCountBadge;
window.updateLabPaymentRow = updateLabPaymentRow;
window.deleteMedicineInventoryRow = deleteMedicineInventoryRow;
window.refreshMedicineInventoryForm = refreshMedicineInventoryForm;
window.selectLabName = selectLabName;
window.selectLabTableRow = selectLabTableRow;
window.addLabPaymentRow = addLabPaymentRow;
window.deleteLabPaymentRow = deleteLabPaymentRow;
window.clearLabForm = clearLabForm;
window.recalculateLabTotals = recalculateLabTotals;
window.previewLabRegister = previewLabRegister;

window.previewLabLogoInput = previewLabLogoInput;
window.resetNewLabForm = resetNewLabForm;
window.addNewDentalLab = addNewDentalLab;


// ==========================================
// MATERIAL TAB FULL INPUT SEARCH CONTROLLERS
// ==========================================
function filterMaterialFullSearch(query) {
  const q = (query || '').toLowerCase().trim();
  const clearBtn = document.getElementById('clearMaterialGlobalSearchBtn');
  if (clearBtn) clearBtn.style.display = q ? 'block' : 'none';

  // Synchronize to specific table search inputs
  const medInput = document.getElementById('medTableSearchInput');
  if (medInput) medInput.value = query || '';
  filterMedicineTable(q);

  const labInput = document.getElementById('labTableSearchInput');
  if (labInput) labInput.value = query || '';
  filterLabPaymentTable(q);
}

function clearMaterialFullSearch() {
  const gInput = document.getElementById('materialGlobalSearchInput');
  if (gInput) gInput.value = '';
  filterMaterialFullSearch('');
}

function filterMedicineTable(query) {
  const q = (query || '').toLowerCase().trim();
  const tbody = document.getElementById('medInventoryTableBody');
  if (!tbody) return;

  const rows = tbody.querySelectorAll('tr');
  let visibleCount = 0;

  rows.forEach(row => {
    const text = (row.innerText || '').toLowerCase();
    if (!q || text.includes(q)) {
      row.style.display = '';
      visibleCount++;
    } else {
      row.style.display = 'none';
    }
  });

  const badge = document.getElementById('medInventoryCountBadge');
  if (badge) {
    badge.innerText = `${visibleCount} item${visibleCount === 1 ? '' : 's'}`;
  }
}

function filterLabPaymentTable(query) {
  const q = (query || '').toLowerCase().trim();
  const tbody = document.getElementById('labPaymentTableBody');
  if (!tbody) return;

  const rows = tbody.querySelectorAll('tr');
  rows.forEach(row => {
    const text = (row.innerText || '').toLowerCase();
    if (!q || text.includes(q)) {
      row.style.display = '';
    } else {
      row.style.display = 'none';
    }
  });

  // Recalculate totals for visible rows
  recalculateLabTotals();
}

function filterLabNameList(query) {
  const q = (query || '').toLowerCase().trim();
  const container = document.getElementById('labNameListContainer');
  if (!container) return;

  const items = container.querySelectorAll('.lab-name-item');
  let matchCount = 0;

  items.forEach(item => {
    const text = (item.innerText || '').toLowerCase();
    if (!q || text.includes(q)) {
      item.style.display = '';
      matchCount++;
    } else {
      item.style.display = 'none';
    }
  });

  const badge = document.getElementById('labNameCountBadge');
  if (badge) badge.innerText = `${matchCount} lab${matchCount === 1 ? '' : 's'}`;
}

// Filter specific lookup container by user query
function filterLookupList(containerId, query) {
  const container = document.getElementById(containerId);
  if (!container) return;
  const q = (query || '').toLowerCase().trim();
  const items = container.querySelectorAll('.med-lookup-item');
  items.forEach(item => {
    const val = (item.getAttribute('data-val') || item.innerText || '').toLowerCase();
    if (!q || val.includes(q)) {
      item.style.display = '';
      if (q && val === q) {
        item.classList.add('active');
      } else if (!q) {
        item.classList.remove('active');
      }
    } else {
      item.style.display = 'none';
      item.classList.remove('active');
    }
  });
}

// Live-filter Medicine Inventory table based on all entered left form values
function filterMedicineTableFromInputs() {
  const cat = (document.getElementById('medCategory')?.value || '').toLowerCase().trim();
  const type = (document.getElementById('medType')?.value || '').toLowerCase().trim();
  const prod = (document.getElementById('medProductName')?.value || '').toLowerCase().trim();
  const brand = (document.getElementById('medBrandName')?.value || '').toLowerCase().trim();
  const strength = (document.getElementById('medStrength')?.value || '').toLowerCase().trim();
  const dosage = (document.getElementById('medDosage')?.value || '').toLowerCase().trim();
  const rate = (document.getElementById('medRate')?.value || '').toLowerCase().trim();
  const freq = (document.getElementById('medFrequency')?.value || '').toLowerCase().trim();
  const dur = (document.getElementById('medDuration')?.value || '').toLowerCase().trim();
  const ingr = (document.getElementById('medIngredients')?.value || '').toLowerCase().trim();
  const comm = (document.getElementById('medComments')?.value || '').toLowerCase().trim();

  const tbody = document.getElementById('medInventoryTableBody');
  if (!tbody) return;

  const rows = Array.from(tbody.querySelectorAll('tr'));
  if (rows.length === 0) return;

  const hasFilter = Boolean(cat || type || prod || brand || strength || dosage || rate || freq || (dur && dur !== '5 days') || ingr || comm);

  if (!hasFilter) {
    rows.forEach(r => r.style.display = '');
    updateMedInventoryCountBadge();
    return;
  }

  // 1. Strict match: row matches all non-empty filter inputs
  const strictMatches = rows.filter(row => {
    const cells = row.getElementsByTagName('td');
    if (cells.length < 11) return true;
    const rCat = (cells[0].innerText || '').toLowerCase();
    const rType = (cells[1].innerText || '').toLowerCase();
    const rProd = (cells[2].innerText || '').toLowerCase();
    const rBrand = (cells[3].innerText || '').toLowerCase();
    const rStrength = (cells[4].innerText || '').toLowerCase();
    const rDosage = (cells[5].innerText || '').toLowerCase();
    const rRate = (cells[6].innerText || '').toLowerCase();
    const rFreq = (cells[7].innerText || '').toLowerCase();
    const rDur = (cells[8].innerText || '').toLowerCase();
    const rIngr = (cells[9].innerText || '').toLowerCase();
    const rComm = (cells[10].innerText || '').toLowerCase();

    return (!cat || rCat.includes(cat)) &&
           (!type || rType.includes(type)) &&
           (!prod || rProd.includes(prod)) &&
           (!brand || rBrand.includes(brand)) &&
           (!strength || rStrength.includes(strength)) &&
           (!dosage || rDosage.includes(dosage)) &&
           (!rate || rRate.includes(rate)) &&
           (!freq || rFreq.includes(freq)) &&
           (!dur || dur === '5 days' || rDur.includes(dur)) &&
           (!ingr || rIngr.includes(ingr)) &&
           (!comm || rComm.includes(comm));
  });

  // 2. Fallback partial match if strict matches are 0
  let finalMatches = strictMatches;
  if (finalMatches.length === 0) {
    finalMatches = rows.filter(row => {
      const cells = row.getElementsByTagName('td');
      if (cells.length < 11) return false;
      const rCat = (cells[0].innerText || '').toLowerCase();
      const rType = (cells[1].innerText || '').toLowerCase();
      const rProd = (cells[2].innerText || '').toLowerCase();
      const rBrand = (cells[3].innerText || '').toLowerCase();
      const rIngr = (cells[9].innerText || '').toLowerCase();
      const rComm = (cells[10].innerText || '').toLowerCase();

      return (prod && rProd.includes(prod)) ||
             (brand && rBrand.includes(brand)) ||
             (cat && rCat.includes(cat)) ||
             (type && rType.includes(type)) ||
             (ingr && rIngr.includes(ingr)) ||
             (comm && rComm.includes(comm));
    });
  }

  let visibleCount = 0;
  let topRow = null;
  rows.forEach(row => {
    if (finalMatches.includes(row)) {
      row.style.display = '';
      visibleCount++;
      if (!topRow) topRow = row;
    } else {
      row.style.display = 'none';
      row.classList.remove('selected-row');
    }
  });

  // Find & highlight connected row in table
  if (topRow && (prod || brand || cat || type)) {
    rows.forEach(r => r.classList.remove('selected-row'));
    topRow.classList.add('selected-row');
    selectedMedRow = topRow;
    topRow.scrollIntoView({ behavior: 'smooth', block: 'nearest' });
  }

  const badge = document.getElementById('medInventoryCountBadge');
  if (badge) {
    badge.innerText = `${visibleCount} item${visibleCount === 1 ? '' : 's'}`;
  }
}

// Live-filter Lab Register table based on Patient ID, Patient Name, Particular, etc.
function filterLabPaymentTableFromInputs() {
  const pid = (document.getElementById('labPatientId')?.value || '').toLowerCase().trim();
  const pname = (document.getElementById('labPatientName')?.value || '').toLowerCase().trim();
  const part = (document.getElementById('labParticular')?.value || '').toLowerCase().trim();
  const dt = (document.getElementById('labDate')?.value || '').toLowerCase().trim();

  const tbody = document.getElementById('labPaymentTableBody');
  if (!tbody) return;

  const rows = tbody.querySelectorAll('tr');
  rows.forEach(row => {
    const cells = row.getElementsByTagName('td');
    if (cells.length < 5) {
      row.style.display = '';
      return;
    }

    const rowDate = (cells[1]?.innerText || '').toLowerCase();
    const rowPid = (cells[2]?.innerText || '').toLowerCase();
    const rowPname = (cells[3]?.innerText || '').toLowerCase();
    const rowPart = (cells[4]?.innerText || '').toLowerCase();

    const match = (!pid || rowPid.includes(pid)) &&
      (!pname || rowPname.includes(pname)) &&
      (!part || rowPart.includes(part));

    row.style.display = match ? '' : 'none';
  });

  recalculateLabTotals();
}

window.filterLookupList = filterLookupList;
window.filterMedicineTableFromInputs = filterMedicineTableFromInputs;
window.filterLabPaymentTableFromInputs = filterLabPaymentTableFromInputs;
window.filterMaterialFullSearch = filterMaterialFullSearch;
window.clearMaterialFullSearch = clearMaterialFullSearch;
window.filterMedicineTable = filterMedicineTable;
window.filterLabPaymentTable = filterLabPaymentTable;
window.filterLabNameList = filterLabNameList;


// ========================================================
// MATERIAL TAB: EVENT LISTENERS (WITHOUT INLINE ONCLICK)
// ========================================================
document.addEventListener('DOMContentLoaded', function () {
  // Ensure both Box 1 and Box 2 are visible
  const box1 = document.getElementById('materialBox1Panel');
  const box2 = document.getElementById('materialBox2Panel');
  if (box1) box1.style.display = 'block';
  if (box2) box2.style.display = 'block';

  // Global search clear button
  const clearGlobalBtn = document.getElementById('clearMaterialGlobalSearchBtn');
  if (clearGlobalBtn) {
    clearGlobalBtn.addEventListener('click', clearMaterialFullSearch);
  }

  // Box 1 Action Buttons
  const btnMedAdd = document.getElementById('btnMedAdd');
  if (btnMedAdd) btnMedAdd.addEventListener('click', addMedicineInventoryRow);

  const btnMedUpdate = document.getElementById('btnMedUpdate');
  if (btnMedUpdate) btnMedUpdate.addEventListener('click', updateMedicineInventoryRow);

  const btnMedNew = document.getElementById('btnMedNew');
  if (btnMedNew) btnMedNew.addEventListener('click', newMedicineInventoryRow);

  const btnMedRefresh = document.getElementById('btnMedRefresh');
  if (btnMedRefresh) btnMedRefresh.addEventListener('click', refreshMedicineInventoryForm);

  const btnMedDelete = document.getElementById('btnMedDelete');
  if (btnMedDelete) btnMedDelete.addEventListener('click', deleteMedicineInventoryRow);

  const btnMedClose = document.getElementById('btnMedClose');
  if (btnMedClose) btnMedClose.addEventListener('click', refreshMedicineInventoryForm);

  const btnClearMedSearch = document.getElementById('btnClearMedTableSearch');
  if (btnClearMedSearch) {
    btnClearMedSearch.addEventListener('click', function () {
      const input = document.getElementById('medTableSearchInput');
      if (input) input.value = '';
      filterMedicineTable('');
    });
  }

  // Box 2 Lab Action Buttons
  const btnResetLab = document.getElementById('btnResetNewLab');
  if (btnResetLab) btnResetLab.addEventListener('click', resetNewLabForm);

  const btnLabAdd = document.getElementById('btnLabPaymentAdd');
  if (btnLabAdd) btnLabAdd.addEventListener('click', addLabPaymentRow);

  const btnLabUpdate = document.getElementById('btnLabPaymentUpdate');
  if (btnLabUpdate) btnLabUpdate.addEventListener('click', updateLabPaymentRow);

  const btnLabDelete = document.getElementById('btnLabPaymentDelete');
  if (btnLabDelete) btnLabDelete.addEventListener('click', deleteLabPaymentRow);

  const btnLabClear = document.getElementById('btnLabPaymentClear');
  if (btnLabClear) btnLabClear.addEventListener('click', clearLabForm);

  const btnLabPreview = document.getElementById('btnLabPaymentPreview');
  if (btnLabPreview) btnLabPreview.addEventListener('click', previewLabRegister);

  const btnClearLabSearch = document.getElementById('btnClearLabTableSearch');
  if (btnClearLabSearch) {
    btnClearLabSearch.addEventListener('click', function () {
      const input = document.getElementById('labTableSearchInput');
      if (input) input.value = '';
      filterLabPaymentTable('');
    });
  }

  // ========================================================
  // LIVE INPUT SEARCH CONNECTED TO RIGHT TABLES & LOOKUP BOXES
  // ========================================================
  const medCategoryInput = document.getElementById('medCategory');
  if (medCategoryInput) {
    medCategoryInput.addEventListener('input', function () {
      filterLookupList('lookupContainerCategory', this.value);
      filterMedicineTableFromInputs();
    });
  }

  const medTypeInput = document.getElementById('medType');
  if (medTypeInput) {
    medTypeInput.addEventListener('input', function () {
      filterLookupList('lookupContainerType', this.value);
      filterMedicineTableFromInputs();
    });
  }

  const medProductNameInput = document.getElementById('medProductName');
  if (medProductNameInput) {
    medProductNameInput.addEventListener('input', function () {
      filterLookupList('lookupContainerProductName', this.value);
      filterMedicineTableFromInputs();
    });
  }

  const medBrandNameInput = document.getElementById('medBrandName');
  if (medBrandNameInput) {
    medBrandNameInput.addEventListener('input', function () {
      filterLookupList('lookupContainerBrandName', this.value);
      filterMedicineTableFromInputs();
    });
  }

  const medIngredientsInput = document.getElementById('medIngredients');
  if (medIngredientsInput) {
    medIngredientsInput.addEventListener('input', function () {
      filterLookupList('lookupContainerIngredients', this.value);
      filterMedicineTableFromInputs();
    });
  }

  const medCommentsInput = document.getElementById('medComments');
  if (medCommentsInput) {
    medCommentsInput.addEventListener('input', function () {
      filterLookupList('lookupContainerContraIndications', this.value);
      filterMedicineTableFromInputs();
    });
  }

  // Additional Medicine Form inputs that filter the table below
  ['medStrength', 'medDosage', 'medRate', 'medFrequency', 'medDuration'].forEach(id => {
    const el = document.getElementById(id);
    if (el) {
      el.addEventListener('input', filterMedicineTableFromInputs);
      el.addEventListener('change', filterMedicineTableFromInputs);
    }
  });

  // Box 2 Lab Payments: Input search connected to right table
  const labPatientIdInput = document.getElementById('labPatientId');
  if (labPatientIdInput) {
    labPatientIdInput.addEventListener('input', filterLabPaymentTableFromInputs);
  }

  const labPatientNameInput = document.getElementById('labPatientName');
  if (labPatientNameInput) {
    labPatientNameInput.addEventListener('input', filterLabPaymentTableFromInputs);
  }

  const labParticularInput = document.getElementById('labParticular');
  if (labParticularInput) {
    labParticularInput.addEventListener('input', filterLabPaymentTableFromInputs);
  }

  const labDateInput = document.getElementById('labDate');
  if (labDateInput) {
    labDateInput.addEventListener('input', filterLabPaymentTableFromInputs);
    labDateInput.addEventListener('change', filterLabPaymentTableFromInputs);
  }
});

// Listen for browser back/forward or hash changes to auto-open tabs
window.addEventListener('hashchange', function () {
  if (window.location.hash) {
    const hashSec = window.location.hash.replace('#', '').trim();
    if (hashSec && document.getElementById('section-' + hashSec)) {
      if (typeof switchTab === 'function') switchTab(hashSec);
    }
  }
});

// Event delegation for dynamically added or rendered items & navigation links
document.addEventListener('click', function (e) {
  // Nav-link tab opening (e.g. materials, appointments, patient, etc.)
  const navLink = e.target.closest('.nav-link[data-section]');
  if (navLink) {
    const sec = navLink.getAttribute('data-section');
    if (sec && document.getElementById('section-' + sec)) {
      e.preventDefault();
      if (typeof switchTab === 'function') switchTab(sec);
      if (history.pushState) {
        history.pushState(null, null, '#' + sec);
      } else {
        window.location.hash = sec;
      }
      return;
    }
  }
  // 1. Medicine lookup items
  const lookupItem = e.target.closest('.med-lookup-item');
  if (lookupItem) {
    const field = lookupItem.getAttribute('data-field');
    const val = lookupItem.getAttribute('data-val') || lookupItem.innerText.trim();
    if (field && val) {
      selectMedLookup(field, val, lookupItem);
    }
  }

  // 2. Medicine table row selection
  const medRow = e.target.closest('#medInventoryTableBody tr');
  if (medRow) {
    selectMedInventoryRow(medRow);
  }

  // 3. Lab Name list items
  const labItem = e.target.closest('.lab-name-item');
  if (labItem) {
    const labName = labItem.getAttribute('data-lab') || labItem.innerText.trim();
    if (labName) {
      selectLabName(labName, labItem);
    }
  }

  // 4. Lab payment table row selection
  const labRow = e.target.closest('#labPaymentTableBody tr');
  if (labRow) {
    selectLabTableRow(labRow);
  }
});


// ==========================================
// DATABASE-CONNECTED LAB & PAYMENT ACTIONS
// ==========================================

// Initialize sampleLabLedgers from window.dbLabLedgers if present
if (window.dbLabLedgers && Object.keys(window.dbLabLedgers).length > 0) {
  Object.assign(sampleLabLedgers, window.dbLabLedgers);
}

function addNewDentalLab() {
  const nameInput = document.getElementById('inputLabName');
  const cityInput = document.getElementById('inputLabCity');
  const logoInput = document.getElementById('inputLabLogo');
  const labName = (nameInput?.value || '').trim();
  const city = (cityInput?.value || '').trim();

  if (!labName) {
    alert("Please enter a Lab Name.");
    if (nameInput) nameInput.focus();
    return;
  }

  // Prepare FormData for database persistence
  const formData = new FormData();
  formData.append('name', labName);
  formData.append('city', city);
  if (logoInput && logoInput.files && logoInput.files[0]) {
    formData.append('logo', logoInput.files[0]);
  }
  formData.append('csrfmiddlewaretoken', getCsrfToken());

  // Show immediate optimistic feedback or loading state
  const saveBtn = document.querySelector('#addNewLabForm button[type="submit"]');
  const originalBtnHtml = saveBtn ? saveBtn.innerHTML : '';
  if (saveBtn) {
    saveBtn.disabled = true;
    saveBtn.innerHTML = '<i class="fas fa-spinner fa-spin"></i> Saving...';
  }

  fetch('/dashboard/save-lab/', {
    method: 'POST',
    body: formData,
    headers: {
      'X-Requested-With': 'XMLHttpRequest'
    }
  })
    .then(res => res.json())
    .then(data => {
      if (saveBtn) {
        saveBtn.disabled = false;
        saveBtn.innerHTML = originalBtnHtml;
      }

      if (data.status === 'success') {
        const savedLab = data.lab;
        const logoUrl = savedLab.logo_url || '';

        // Store in metadata cache
        labMetadata[savedLab.name] = { city: savedLab.city, logo: logoUrl };
        if (!sampleLabLedgers[savedLab.name]) {
          sampleLabLedgers[savedLab.name] = [];
        }

        // Append or activate in DOM
        const container = document.getElementById('labNameListContainer');
        const noNotice = document.getElementById('noLabsDbNotice');
        if (noNotice) noNotice.remove();

        if (container) {
          let existingItem = Array.from(container.querySelectorAll('.lab-name-item')).find(el => (el.getAttribute('data-lab') || el.innerText.trim()).toLowerCase() === savedLab.name.toLowerCase());
          if (!existingItem) {
            const newItem = document.createElement('div');
            newItem.className = 'lab-name-item active-lab';
            newItem.setAttribute('data-lab', savedLab.name);
            newItem.setAttribute('data-city', savedLab.city);
            newItem.setAttribute('data-logo', logoUrl);
            newItem.innerHTML = `
            <span style="display: flex; align-items: center; justify-content: space-between; gap: 6px;">
              <span style="display: flex; align-items: center; gap: 5px;">
                ${logoUrl ? `<img src="${logoUrl}" style="width: 16px; height: 16px; border-radius: 2px; object-fit: contain;">` : `<i class="fas fa-flask" style="font-size: 0.7rem; color: #2563eb;"></i>`}
                <strong>${savedLab.name}</strong>
              </span>
              ${savedLab.city ? `<small style="font-size: 0.68rem; color: #64748b; background: #f1f5f9; padding: 1px 5px; border-radius: 3px;">${savedLab.city}</small>` : ''}
            </span>
          `;
            container.insertBefore(newItem, container.firstChild);
            selectLabName(savedLab.name, newItem);
          } else {
            existingItem.setAttribute('data-city', savedLab.city);
            if (logoUrl) existingItem.setAttribute('data-logo', logoUrl);
            selectLabName(savedLab.name, existingItem);
          }

          // Update count badge
          const countBadge = document.getElementById('labNameCountBadge');
          if (countBadge) {
            const totalLabs = container.querySelectorAll('.lab-name-item').length;
            countBadge.innerText = `${totalLabs} labs`;
          }
        }

        resetNewLabForm();
        alert(`Success: Lab "${savedLab.name}" is saved in the database!`);
      } else {
        alert("Error saving lab: " + (data.message || "Failed to save."));
      }
    })
    .catch(err => {
      if (saveBtn) {
        saveBtn.disabled = false;
        saveBtn.innerHTML = originalBtnHtml;
      }
      console.error("Save lab error:", err);
      // Fallback to local
      labMetadata[labName] = { city: city, logo: currentNewLabLogoDataUrl };
      if (!sampleLabLedgers[labName]) sampleLabLedgers[labName] = [];
      alert(`Notice: Saved "${labName}" locally. Server responded with notice.`);
    });
}

function addLabPaymentRow() {
  const tbody = document.getElementById('labPaymentTableBody');
  if (!tbody) return;

  const date = (document.getElementById('labDate')?.value || '').trim() || '04-11-2026';
  const pid = (document.getElementById('labPatientId')?.value || '').trim() || 'P-Walkin';
  const pname = (document.getElementById('labPatientName')?.value || '').trim() || 'Walk-in Patient';
  const particular = (document.getElementById('labParticular')?.value || '').trim() || 'Dental Lab Work';
  const dr = parseFloat(document.getElementById('labDrAmount')?.value || 0) || 0;
  const cr = parseFloat(document.getElementById('labCrAmount')?.value || 0) || 0;

  // Persist to database
  const formData = new URLSearchParams();
  formData.append('lab_name', currentSelectedLab);
  formData.append('date', date);
  formData.append('patient_id', pid);
  formData.append('patient_name', pname);
  formData.append('particular', particular);
  formData.append('dr_amount', dr);
  formData.append('cr_amount', cr);
  formData.append('csrfmiddlewaretoken', getCsrfToken());

  fetch('/dashboard/save-lab-payment/', {
    method: 'POST',
    headers: {
      'Content-Type': 'application/x-www-form-urlencoded',
      'X-Requested-With': 'XMLHttpRequest'
    },
    body: formData.toString()
  })
    .then(res => res.json())
    .then(data => {
      const paymentId = (data.status === 'success' && data.payment) ? data.payment.id : (tbody.rows.length + 1);

      const tr = document.createElement('tr');
      tr.className = 'clickable-table-row';
      tr.setAttribute('data-payment-id', paymentId);
      tr.onclick = function () { selectLabTableRow(this); };
      tr.innerHTML = `
      <td style="padding: 7px 10px; border: 1px solid #e2e8f0; font-weight: 700;">${paymentId}</td>
      <td style="padding: 7px 10px; border: 1px solid #e2e8f0;">${date}</td>
      <td style="padding: 7px 10px; border: 1px solid #e2e8f0; font-weight: 600;">${pid}</td>
      <td style="padding: 7px 10px; border: 1px solid #e2e8f0;">${pname}</td>
      <td style="padding: 7px 10px; border: 1px solid #e2e8f0;">${particular}</td>
      <td style="padding: 7px 10px; border: 1px solid #e2e8f0; text-align: right; font-weight: 600;">${dr.toFixed(2)}</td>
      <td style="padding: 7px 10px; border: 1px solid #e2e8f0; text-align: right; color: ${cr > 0 ? '#16a34a' : '#64748b'}; font-weight: ${cr > 0 ? '600' : 'normal'};">${cr.toFixed(2)}</td>
    `;
      tbody.appendChild(tr);

      // Save in cache
      if (!sampleLabLedgers[currentSelectedLab]) sampleLabLedgers[currentSelectedLab] = [];
      sampleLabLedgers[currentSelectedLab].push({
        id: paymentId,
        date: date,
        pid: pid,
        patient: pname,
        particular: particular,
        dr: dr,
        cr: cr
      });

      recalculateLabTotals();
      selectLabTableRow(tr);
      alert(`Payment transaction #${paymentId} for "${pname}" connected and saved to database!`);
    })
    .catch(err => {
      console.error("Save lab payment error:", err);
      // Local fallback
      const nextId = tbody.rows.length + 1;
      const tr = document.createElement('tr');
      tr.className = 'clickable-table-row';
      tr.onclick = function () { selectLabTableRow(this); };
      tr.innerHTML = `
      <td style="padding: 7px 10px; border: 1px solid #e2e8f0; font-weight: 700;">${nextId}</td>
      <td style="padding: 7px 10px; border: 1px solid #e2e8f0;">${date}</td>
      <td style="padding: 7px 10px; border: 1px solid #e2e8f0; font-weight: 600;">${pid}</td>
      <td style="padding: 7px 10px; border: 1px solid #e2e8f0;">${pname}</td>
      <td style="padding: 7px 10px; border: 1px solid #e2e8f0;">${particular}</td>
      <td style="padding: 7px 10px; border: 1px solid #e2e8f0; text-align: right; font-weight: 600;">${dr.toFixed(2)}</td>
      <td style="padding: 7px 10px; border: 1px solid #e2e8f0; text-align: right; color: ${cr > 0 ? '#16a34a' : '#64748b'}; font-weight: ${cr > 0 ? '600' : 'normal'};">${cr.toFixed(2)}</td>
    `;
      tbody.appendChild(tr);
      recalculateLabTotals();
    });
}


function updateLabPaymentRow() {
  if (!selectedLabRow) {
    addLabPaymentRow();
    return;
  }
  const dateVal = document.getElementById('labDate')?.value || '04-11-2026';
  const pidVal = document.getElementById('labPatientId')?.value || '';
  const pnameVal = document.getElementById('labPatientName')?.value || '';
  const partVal = document.getElementById('labParticular')?.value || '';
  const drVal = parseFloat(document.getElementById('labDrAmount')?.value) || 0.0;
  const crVal = parseFloat(document.getElementById('labCrAmount')?.value) || 0.0;

  const cells = selectedLabRow.getElementsByTagName('td');
  if (cells.length >= 7) {
    cells[1].innerText = dateVal;
    cells[2].innerText = pidVal;
    cells[3].innerText = pnameVal;
    cells[4].innerText = partVal;
    cells[5].innerText = drVal.toFixed(2);
    cells[6].innerText = crVal.toFixed(2);

    selectedLabRow.style.transition = 'background-color 0.4s ease';
    selectedLabRow.style.backgroundColor = '#e0f2fe';
    setTimeout(() => { if (selectedLabRow) selectedLabRow.style.backgroundColor = ''; }, 1200);
  }

  recalculateLabTotals();
}

function deleteLabPaymentRow() {
  if (!selectedLabRow) {
    alert("Please select a transaction row in the Lab Register table to delete.");
    return;
  }
  const paymentId = selectedLabRow.getAttribute('data-payment-id');
  if (confirm("Are you sure you want to delete this lab transaction from the database?")) {
    if (paymentId) {
      const formData = new URLSearchParams();
      formData.append('csrfmiddlewaretoken', getCsrfToken());
      fetch(`/dashboard/delete-lab-payment/${paymentId}/`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/x-www-form-urlencoded',
          'X-Requested-With': 'XMLHttpRequest'
        },
        body: formData.toString()
      })
        .then(res => res.json())
        .then(data => {
          console.log("Deleted payment from DB:", data);
        })
        .catch(err => console.error("Error deleting payment from DB:", err));
    }

    selectedLabRow.remove();
    selectedLabRow = null;
    recalculateLabTotals();
    clearLabForm();
  }
}


// ==========================================
// PATIENT MEDICINES (CONNECTED WITH MATERIAL BOX 1)
// ==========================================
let activePatientMedicines = [];

function openPatientMedicineModal(btn) {
  openClinicalHubFromBtn(btn, 'medicine');
}

function onSelectMaterialBox1Med(selectEl) {
  if (!selectEl) return;
  const opt = selectEl.options[selectEl.selectedIndex];
  if (!opt || !opt.value) {
    return;
  }
  const category = opt.getAttribute('data-category') || '';
  const type = opt.getAttribute('data-type') || '';
  const product = opt.getAttribute('data-product') || '';
  const brand = opt.getAttribute('data-brand') || '';
  const strength = opt.getAttribute('data-strength') || '';
  const dosage = opt.getAttribute('data-dosage') || '';
  const frequency = opt.getAttribute('data-frequency') || '1-0-1';
  const duration = opt.getAttribute('data-duration') || '5 Days';
  const ingredients = opt.getAttribute('data-ingredients') || '';
  const contra = opt.getAttribute('data-contra') || '';

  const catInp = document.getElementById('hubMedCategory');
  if (catInp) catInp.value = category;

  const typeInp = document.getElementById('hubMedType');
  if (typeInp) typeInp.value = type;

  const prodInp = document.getElementById('hubMedProductName');
  if (prodInp) prodInp.value = product;

  const brandInp = document.getElementById('hubMedBrandName');
  if (brandInp) brandInp.value = brand;

  const strengthInp = document.getElementById('hubMedStrength');
  if (strengthInp) strengthInp.value = strength;

  const dosageInp = document.getElementById('hubMedDosage');
  if (dosageInp) dosageInp.value = dosage;

  const freqInp = document.getElementById('hubMedFrequency');
  if (freqInp) freqInp.value = frequency;

  const durInp = document.getElementById('hubMedDuration');
  if (durInp) durInp.value = duration;

  const ingInp = document.getElementById('hubMedIngredients');
  if (ingInp) ingInp.value = ingredients;

  const instInp = document.getElementById('hubMedInstructions');
  if (instInp) {
    instInp.value = contra ? `Note: ${contra}` : 'After Food';
  }
}

async function loadPatientMedicines() {
  const tbody = document.getElementById('hubPatientMedicinesBody');
  const countBadge = document.getElementById('hubMedTableCountBadge');
  const hubBadge = document.getElementById('hubMedCountBadge');

  if (!activeHubPatient) return;
  const apptId = activeHubPatient.id || 0;
  const pName = activeHubPatient.name || '';

  if (tbody) {
    tbody.innerHTML = '<tr><td colspan="8" style="text-align: center; padding: 20px; color: #64748b;"><i class="fas fa-spinner fa-spin"></i> Loading prescribed medicines...</td></tr>';
  }

  try {
    const res = await fetch(`/dashboard/patient/get-medicines/${apptId}/?patient_name=${encodeURIComponent(pName)}`);
    const data = await res.json();
    if (data.status === 'success') {
      activePatientMedicines = data.medicines || [];
      renderPatientMedicinesTable();
    } else {
      if (tbody) {
        tbody.innerHTML = '<tr><td colspan="8" style="text-align: center; padding: 20px; color: #ef4444;">Failed to load medicines.</td></tr>';
      }
    }
  } catch (err) {
    console.error('Error fetching patient medicines:', err);
    if (tbody) {
      tbody.innerHTML = '<tr><td colspan="8" style="text-align: center; padding: 20px; color: #ef4444;">Error connecting to database.</td></tr>';
    }
  }
}

function renderPatientMedicinesTable() {
  const tbody = document.getElementById('hubPatientMedicinesBody');
  const countBadge = document.getElementById('hubMedTableCountBadge');
  const hubBadge = document.getElementById('hubMedCountBadge');

  const count = activePatientMedicines.length;
  if (countBadge) countBadge.innerText = `${count} Prescription${count === 1 ? '' : 's'}`;
  if (hubBadge) hubBadge.innerText = count;

  if (!tbody) return;

  if (count === 0) {
    tbody.innerHTML = `
      <tr>
        <td colspan="8" style="text-align: center; padding: 32px 16px; color: #64748b; background: #f8fafc;">
          <div style="font-size: 1.8rem; color: #0284c7; margin-bottom: 8px;"><i class="fas fa-pills"></i></div>
          <div style="font-weight: 600; color: #1e293b; margin-bottom: 4px;">No Medicines Prescribed Yet</div>
          <div style="font-size: 0.75rem; color: #64748b;">Select a medicine from Material Box 1 on the left and click "Add to Patient Table".</div>
        </td>
      </tr>
    `;
    return;
  }

  tbody.innerHTML = activePatientMedicines.map((m, idx) => `
    <tr class="clickable-table-row" style="border-bottom: 1px solid #f1f5f9;">
      <td style="padding: 7px 6px; font-weight: 700; color: #64748b;">${idx + 1}</td>
      <td style="padding: 7px 10px;">
        <strong style="color: #0f172a; font-size: 0.82rem;">${escapeHtml(m.product_name)}</strong>
        ${m.brand_name ? `<span style="font-size: 0.72rem; color: #0284c7; font-weight: 600; margin-left: 4px;">(${escapeHtml(m.brand_name)})</span>` : ''}
      </td>
      <td style="padding: 7px 10px; color: #475569;">
        <span style="background: #f1f5f9; padding: 2px 6px; border-radius: 4px; font-size: 0.72rem;">${escapeHtml(m.category || 'Med')}</span>
        ${m.item_type ? `<span style="font-size: 0.72rem; color: #64748b; margin-left: 3px;">/ ${escapeHtml(m.item_type)}</span>` : ''}
      </td>
      <td style="padding: 7px 10px; color: #334155; font-weight: 600;">
        ${escapeHtml(m.strength || m.dosage || '-')}
      </td>
      <td style="padding: 7px 10px;">
        <span style="font-weight: 700; color: #1e293b;">${escapeHtml(m.frequency || '1-0-1')}</span>
        <span style="font-size: 0.72rem; color: #64748b; margin-left: 4px;">(${escapeHtml(m.duration || '5 Days')})</span>
      </td>
      <td style="padding: 7px 10px; color: #475569; font-size: 0.75rem;">
        ${escapeHtml(m.instructions || 'After Food')}
      </td>
      <td style="padding: 7px 10px; text-align: right;">
        <button type="button" class="btn-action-icon" title="Remove Medicine"
          style="color: #dc2626; background: #fef2f2; border: 1px solid #fecaca; width: 26px; height: 26px; border-radius: 4px; cursor: pointer;"
          onclick="deletePatientMedicine(${m.id})">
          <i class="fas fa-trash-alt" style="font-size: 0.7rem;"></i>
        </button>
      </td>
    </tr>
  `).join('');
}

async function handleHubAddPatientMedicine(e) {
  if (e) e.preventDefault();
  if (!activeHubPatient) {
    alert('No active patient selected.');
    return;
  }

  const prodInput = document.getElementById('hubMedProductName');
  const prodName = prodInput ? prodInput.value.trim() : '';
  if (!prodName) {
    alert('Please enter a medicine name or select from Material Box 1.');
    return;
  }

  const selectBox1 = document.getElementById('hubMedSelectBox1');
  const medInvId = selectBox1 ? selectBox1.value : '';

  const cat = document.getElementById('hubMedCategory') ? document.getElementById('hubMedCategory').value.trim() : '';
  const type = document.getElementById('hubMedType') ? document.getElementById('hubMedType').value.trim() : '';
  const brand = document.getElementById('hubMedBrandName') ? document.getElementById('hubMedBrandName').value.trim() : '';
  const strength = document.getElementById('hubMedStrength') ? document.getElementById('hubMedStrength').value.trim() : '';
  const dosage = document.getElementById('hubMedDosage') ? document.getElementById('hubMedDosage').value.trim() : '';
  const freq = document.getElementById('hubMedFrequency') ? document.getElementById('hubMedFrequency').value.trim() : '1-0-1';
  const duration = document.getElementById('hubMedDuration') ? document.getElementById('hubMedDuration').value : '5 Days';
  const instructions = document.getElementById('hubMedInstructions') ? document.getElementById('hubMedInstructions').value.trim() : 'After Food';
  const ingredients = document.getElementById('hubMedIngredients') ? document.getElementById('hubMedIngredients').value.trim() : '';

  const formData = new FormData();
  formData.append('csrfmiddlewaretoken', getCsrfToken());
  formData.append('appointment_id', activeHubPatient.id || 0);
  formData.append('patient_name', activeHubPatient.name || 'Patient');
  formData.append('medicine_inventory_id', medInvId);
  formData.append('category', cat);
  formData.append('item_type', type);
  formData.append('product_name', prodName);
  formData.append('brand_name', brand);
  formData.append('strength', strength);
  formData.append('dosage', dosage);
  formData.append('frequency', freq);
  formData.append('duration', duration);
  formData.append('instructions', instructions);
  formData.append('ingredients', ingredients);

  const btnSubmit = document.getElementById('btnHubAddMedSubmit');
  const originalText = btnSubmit ? btnSubmit.innerHTML : '';
  if (btnSubmit) {
    btnSubmit.disabled = true;
    btnSubmit.innerHTML = '<i class="fas fa-spinner fa-spin"></i> Adding...';
  }

  try {
    const res = await fetch('/dashboard/patient/save-medicine/', {
      method: 'POST',
      body: formData,
    });
    const data = await res.json();
    if (data.status === 'success') {
      activePatientMedicines.push(data.medicine);
      renderPatientMedicinesTable();

      // Reset form
      const form = document.getElementById('hubNewMedicineForm');
      if (form) form.reset();
      if (selectBox1) selectBox1.value = '';
      const freqInp = document.getElementById('hubMedFrequency');
      if (freqInp) freqInp.value = '1-0-1';
      const durInp = document.getElementById('hubMedDuration');
      if (durInp) durInp.value = '5 Days';
      const instInp = document.getElementById('hubMedInstructions');
      if (instInp) instInp.value = 'After Food';
    } else {
      alert(data.message || 'Error prescribing medicine.');
    }
  } catch (err) {
    console.error('Error saving patient medicine:', err);
    alert('Server error saving medicine.');
  } finally {
    if (btnSubmit) {
      btnSubmit.disabled = false;
      btnSubmit.innerHTML = originalText;
    }
  }
}

async function deletePatientMedicine(item_id) {
  if (!confirm('Remove this medicine from patient prescription?')) return;

  const formData = new FormData();
  formData.append('csrfmiddlewaretoken', getCsrfToken());

  try {
    const res = await fetch(`/dashboard/patient/delete-medicine/${item_id}/`, {
      method: 'POST',
      body: formData,
    });
    const data = await res.json();
    if (data.status === 'success') {
      activePatientMedicines = activePatientMedicines.filter(m => m.id !== item_id);
      renderPatientMedicinesTable();
    } else {
      alert(data.message || 'Could not delete medicine.');
    }
  } catch (err) {
    console.error('Error deleting patient medicine:', err);
    alert('Server error removing medicine.');
  }
}

function printPatientPrescription() {
  if (!activeHubPatient) return;
  const apptId = activeHubPatient.id || '';
  const pName = encodeURIComponent(activeHubPatient.name || '');
  const doctor = encodeURIComponent(activeHubPatient.doctor || 'Dr. Anoop');
  const pid = encodeURIComponent(activeHubPatient.code || '');
  const age = encodeURIComponent(activeHubPatient.age || '');
  const gender = encodeURIComponent(activeHubPatient.gender || '');

  const url = `/dashboard/print-prescription/?appointment_id=${apptId}&name=${pName}&doctor=${doctor}&pid=${pid}&age=${age}&gender=${gender}`;
  window.open(url, '_blank');
}
