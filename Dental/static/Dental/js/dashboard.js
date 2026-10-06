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
      } catch (e) {}

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
              <a href="javascript:void(0)" class="patient-link-btn" title="Open Teeth Chart &amp; Payment" onclick="closeModal('clinicCalendarModal'); openPatientClinicalHub('${a.id}', '${a.code}', '${escapeHtml(a.patient)}', '${escapeHtml(a.phone||'')}', '${escapeHtml(a.age||'')}', '${escapeHtml(a.gender||'')}', '${escapeHtml(a.service||'')}', '${escapeHtml(a.doctor||'')}', 'chart')">
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
            <button type="button" class="btn-quick-pill btn-pill-chart" onclick="closeModal('clinicCalendarModal'); openPatientClinicalHub('${a.id}', '${a.code}', '${escapeHtml(a.patient)}', '${escapeHtml(a.phone||'')}', '${escapeHtml(a.age||'')}', '${escapeHtml(a.gender||'')}', '${escapeHtml(a.service||'')}', '${escapeHtml(a.doctor||'')}', 'chart')">
              <i class="fas fa-tooth"></i> Chart
            </button>
            <button type="button" class="btn-quick-pill btn-pill-pay" onclick="closeModal('clinicCalendarModal'); openPatientClinicalHub('${a.id}', '${a.code}', '${escapeHtml(a.patient)}', '${escapeHtml(a.phone||'')}', '${escapeHtml(a.age||'')}', '${escapeHtml(a.gender||'')}', '${escapeHtml(a.service||'')}', '${escapeHtml(a.doctor||'')}', 'payment')">
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
      }

      if (sectionKey === 'personal') {
        renderPersonalTreatments();
      }

      const headingEl = document.getElementById('pageHeading');
      if (headingEl) {
        if (sectionKey === 'about') {
          headingEl.textContent = 'About & Clinic Profile';
        } else if (sectionKey === 'services') {
          headingEl.textContent = 'Our Dental Services & Treatments';
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

    window.addEventListener('click', function(e) {
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
      modal.addEventListener('click', function(e) {
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

    function filterAppointmentsDate(type, customDate) {
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

      const rows = document.querySelectorAll('.appointment-row');
      let visibleCount = 0;

      rows.forEach(row => {
        let rowDate = (row.getAttribute('data-date') || '').trim();
        let show = false;

        if (type === 'all') {
          show = true;
        } else if (type === 'today') {
          show = (rowDate === todayVal || rowDate.startsWith(todayVal));
        } else if (type === 'upcoming') {
          show = (rowDate >= todayVal);
        } else if (type === 'past') {
          show = (rowDate < todayVal);
        } else if (type === 'custom' && customDate) {
          show = (rowDate === customDate || rowDate.startsWith(customDate));
        }

        if (show) {
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
    window.filterAppointmentsDate = filterAppointmentsDate;

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
        reader.onload = function(e) {
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
        reader.onload = function(e) {
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
        reader.onload = function(e) {
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
    window.addEventListener('keydown', function(e) {
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
            <td style="text-align: right;">
              <button type="button" class="btn-sm" style="background: #eff6ff; color: #2563eb; border: 1px solid #bfdbfe; padding: 6px 10px; border-radius: 6px; font-size: 0.775rem; font-weight: 600; cursor: pointer; margin-right: 6px;" onclick="openEditTreatmentModal(${origIdx})" title="Edit Treatment">
                <i class="fas fa-edit"></i> Edit
              </button>
              <button type="button" class="btn-sm" style="background: #fef2f2; color: #ef4444; border: 1px solid #fecaca; padding: 6px 10px; border-radius: 6px; font-size: 0.775rem; font-weight: 600; cursor: pointer;" onclick="deleteTreatment(${origIdx})" title="Delete Treatment">
                <i class="fas fa-trash-alt"></i>
              </button>
            </td>
          </tr>
        `;
      }).join('');
    }

    function escapeHtml(str) {
      if (!str) return '';
      return String(str).replace(/[&<>"']/g, function(m) {
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

    document.addEventListener('DOMContentLoaded', function() {
      const amountInput = document.getElementById('trt_amount');
      if (amountInput) {
        amountInput.addEventListener('input', function() {
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
      const mode = document.querySelector('input[name="slip_mode"]:checked')?.value || 'filled_one';
      let url = '/dashboard/print-slip-grid/';
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
      const singleCard = (mode === 'single_card') ? '1' : '0';

      url += `?reg_no=${reg}&pid=${pid}&date=${date}&name=${name}&age=${age}&gender=${gender}&address=${address}&prefill_all=${prefillAll}&single_card=${singleCard}`;
      window.open(url, '_blank');
      closeModal('slipGridModal');
    }

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
    } catch(e) {
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
    let activeToothId = '14'; // Currently highlighted tooth

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

      // Switch to requested tab
      switchHubTab(defaultTab || 'chart');

      // Open Modal
      openModal('patientClinicalHubModal');
    }

    function switchHubTab(tabName) {
      const btnChart = document.getElementById('tabBtnTeethChart');
      const btnPay = document.getElementById('tabBtnPayment');
      const secChart = document.getElementById('hubSectionChart');
      const secPay = document.getElementById('hubSectionPayment');

      if (tabName === 'payment') {
        if (btnChart) btnChart.classList.remove('active');
        if (btnPay) btnPay.classList.add('active');
        if (secChart) secChart.style.display = 'none';
        if (secPay) secPay.style.display = 'block';
        renderPatientBillingLedger();
      } else {
        if (btnChart) btnChart.classList.add('active');
        if (btnPay) btnPay.classList.remove('active');
        if (secChart) secChart.style.display = 'block';
        if (secPay) secPay.style.display = 'none';
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
      } else {
        if (btnAdult) btnAdult.classList.add('active');
        if (btnPed) btnPed.classList.remove('active');
        activeToothId = '14';
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
          } catch(e) {}
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
        } catch(e) {}
      }

      if (!currentPatientChart || typeof currentPatientChart !== 'object') {
        currentPatientChart = {};
      }
    }

    function savePatientChartData() {
      // 1. Save to localStorage
      try {
        if (activeHubPatient.id) {
          localStorage.setItem('dental_chart_appt_' + activeHubPatient.id, JSON.stringify(currentPatientChart));
        }
        if (activeHubPatient.name) {
          localStorage.setItem('dental_chart_pat_' + activeHubPatient.name.trim().toLowerCase(), JSON.stringify(currentPatientChart));
        }
      } catch(e) {
        console.error('LocalStorage save error:', e);
      }

      // 2. Sync to Django Backend
      if (activeHubPatient.id && !String(activeHubPatient.id).startsWith('P-')) {
        fetch(`/dashboard/save-chart/${activeHubPatient.id}/`, {
          method: 'POST',
          headers: {
            'Content-Type': 'application/x-www-form-urlencoded',
            'X-Requested-With': 'XMLHttpRequest'
          },
          body: `chart_data=${encodeURIComponent(JSON.stringify(currentPatientChart))}&csrfmiddlewaretoken=${encodeURIComponent(getCsrfToken())}`
        })
        .then(res => res.json())
        .then(data => {
          // Update in-memory appointment data
          const appt = allClinicAppointments.find(a => String(a.id) === String(activeHubPatient.id));
          if (appt) appt.chart_data_raw = JSON.stringify(currentPatientChart);
        })
        .catch(err => console.log('Chart server sync notice:', err));
      }
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

      updateChartCounters();
      selectTooth(activeToothId in dataset ? activeToothId : (isPed ? 'A' : '14'));
    }

    function buildToothCardHtml(toothId, toothObj, isUpper) {
      if (!toothObj) return '';
      const state = currentPatientChart[toothId] || { condition: 'sound', surfaces: [], notes: '', procedure: '', price: 0 };
      const cond = state.condition || 'sound';
      const isSelected = (String(toothId) === String(activeToothId));

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

      return `
        <div class="tooth-card ${isSelected ? 'selected' : ''}" 
             id="tooth_card_${toothId}"
             data-tooth-id="${toothId}"
             data-condition="${cond}"
             title="${toothObj.name} (FDI: ${toothObj.fdi}) - ${condLabel}"
             onclick="selectTooth('${toothId}')">
          <span class="tooth-fdi-tag">${toothObj.fdi}</span>
          <span class="tooth-num-badge">#${toothId}</span>
          <div class="tooth-svg-wrap">
            ${svgGraphic}
          </div>
          <span class="tooth-cond-chip">${condLabel}</span>
        </div>
      `;
    }

    function selectTooth(toothId) {
      activeToothId = toothId;
      const isPed = (hubDentitionMode === 'pediatric');
      const dataset = isPed ? PEDIATRIC_TEETH : ADULT_TEETH;
      const t = dataset[toothId] || ADULT_TEETH[toothId] || { name: 'Tooth #' + toothId, fdi: toothId, short: '' };

      // Highlight active card
      document.querySelectorAll('.tooth-card').forEach(el => el.classList.remove('selected'));
      const activeCard = document.getElementById(`tooth_card_${toothId}`);
      if (activeCard) activeCard.classList.add('selected');

      // Update Detail Panel
      const titleEl = document.getElementById('selToothTitle');
      if (titleEl) titleEl.textContent = `Tooth #${toothId} • ${t.name}`;

      const fdiEl = document.getElementById('selToothFdiNotation');
      if (fdiEl) fdiEl.textContent = `FDI: ${t.fdi} • ${hubDentitionMode === 'pediatric' ? 'Primary Pediatric Dentition' : 'Permanent Adult Dentition'}`;

      const state = currentPatientChart[toothId] || { condition: 'sound', surfaces: [], notes: '', procedure: '', price: '' };

      // Update Condition Buttons Active State
      document.querySelectorAll('.btn-cond-choice').forEach(btn => {
        const btnCond = btn.getAttribute('data-condition');
        if (btnCond === (state.condition || 'sound')) {
          btn.classList.add('active');
        } else {
          btn.classList.remove('active');
        }
      });

      // Update Status Badge
      updateSelToothStatusBadge(state.condition || 'sound');

      // Update Surface Checkboxes
      const surfaces = state.surfaces || [];
      ['o', 'm', 'd', 'b', 'l'].forEach(s => {
        const chk = document.getElementById('surf_' + s);
        if (chk) chk.checked = surfaces.includes(s.toUpperCase());
      });

      // Update Procedure & Price
      const procEl = document.getElementById('selToothProcedure');
      if (procEl) procEl.value = state.procedure || '';

      const priceEl = document.getElementById('selToothPrice');
      if (priceEl) priceEl.value = state.price || '';

      // Update Notes
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

      if (!currentPatientChart[activeToothId]) {
        currentPatientChart[activeToothId] = { condition: 'sound', surfaces: [], notes: '', procedure: '', price: '' };
      }
      currentPatientChart[activeToothId].condition = cond;
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
      if (!activeToothId) return;
      if (!currentPatientChart[activeToothId]) {
        currentPatientChart[activeToothId] = { condition: 'sound', surfaces: [], notes: '', procedure: '', price: '' };
      }

      const activeBtn = document.querySelector('.btn-cond-choice.active');
      const cond = activeBtn ? activeBtn.getAttribute('data-condition') : 'sound';

      const surfaces = [];
      ['o', 'm', 'd', 'b', 'l'].forEach(s => {
        const chk = document.getElementById('surf_' + s);
        if (chk && chk.checked) surfaces.push(s.toUpperCase());
      });

      const proc = document.getElementById('selToothProcedure')?.value || '';
      const price = parseFloat(document.getElementById('selToothPrice')?.value) || 0;
      const notes = document.getElementById('selToothNotes')?.value || '';

      currentPatientChart[activeToothId] = {
        condition: cond,
        surfaces: surfaces,
        procedure: proc,
        price: price,
        notes: notes
      };

      savePatientChartData();
      renderOdontogramArch();
      selectTooth(activeToothId);

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

    function resetCurrentTooth() {
      if (!activeToothId) return;
      currentPatientChart[activeToothId] = { condition: 'sound', surfaces: [], notes: '', procedure: '', price: '' };
      savePatientChartData();
      renderOdontogramArch();
      selectTooth(activeToothId);
    }

    function resetAllTeethChart() {
      if (confirm(`Reset dental chart for ${activeHubPatient.name} to all sound teeth?`)) {
        currentPatientChart = {};
        savePatientChartData();
        renderOdontogramArch();
        selectTooth(activeToothId);
      }
    }

    function addCurrentToothToBilling() {
      saveCurrentToothData();

      const toothState = currentPatientChart[activeToothId] || {};
      const isPed = (hubDentitionMode === 'pediatric');
      const dataset = isPed ? PEDIATRIC_TEETH : ADULT_TEETH;
      const t = dataset[activeToothId] || { name: 'Tooth #' + activeToothId };

      let procDescription = toothState.procedure || `${t.name} Treatment`;
      if (!procDescription.includes(activeToothId)) {
        procDescription = `Tooth #${activeToothId} (${procDescription})`;
      }
      const fee = toothState.price || 1500;

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

      let totalBilled = 0;
      let totalPaid = 0;

      invoices.forEach(inv => {
        const amt = parseFloat(inv.amount) || 0;
        totalBilled += amt;
        if ((inv.payment_status || '').toLowerCase() === 'paid') {
          totalPaid += amt;
        } else if ((inv.payment_status || '').toLowerCase() === 'partial') {
          totalPaid += (amt / 2);
        }
      });

      const balanceDue = Math.max(0, totalBilled - totalPaid);

      // Update counters
      const billEl = document.getElementById('hubTotalBilled');
      if (billEl) billEl.textContent = totalBilled.toLocaleString('en-IN', { minimumFractionDigits: 2, maximumFractionDigits: 2 });

      const paidEl = document.getElementById('hubTotalPaid');
      if (paidEl) paidEl.textContent = totalPaid.toLocaleString('en-IN', { minimumFractionDigits: 2, maximumFractionDigits: 2 });

      const dueEl = document.getElementById('hubBalanceDue');
      if (dueEl) dueEl.textContent = balanceDue.toLocaleString('en-IN', { minimumFractionDigits: 2, maximumFractionDigits: 2 });

      const dueWrap = document.getElementById('hubBalanceDueWrap');
      if (dueWrap) {
        dueWrap.style.color = balanceDue > 0 ? '#dc2626' : '#059669';
      }

      const countBadge = document.getElementById('hubPaymentCountBadge');
      if (countBadge) countBadge.textContent = invoices.length;

      const countTag = document.getElementById('hubInvoiceCountTag');
      if (countTag) countTag.textContent = `${invoices.length} ${invoices.length === 1 ? 'Invoice' : 'Invoices'}`;

      // Render table rows
      const tbody = document.getElementById('hubPatientInvoicesBody');
      if (!tbody) return;

      if (invoices.length === 0) {
        tbody.innerHTML = `
          <tr>
            <td colspan="7" class="empty-row-td">
              <i class="fas fa-file-invoice-dollar" style="font-size: 1.8rem; margin-bottom: 6px; display: block; color: #cbd5e1;"></i>
              No billing entries recorded for ${escapeHtml(activeHubPatient.name)}. Use the form on the right to create an invoice or add treatment from the Teeth Chart.
            </td>
          </tr>
        `;
        return;
      }

      tbody.innerHTML = invoices.map(inv => {
        const amtFormatted = Number(inv.amount || 0).toLocaleString('en-IN', { minimumFractionDigits: 2, maximumFractionDigits: 2 });
        const isPaid = (inv.payment_status === 'Paid');
        return `
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
      }).join('');
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
      reader.onload = function(evt) {
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
      reader.onload = function(evt) {
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
      reader.onload = function(evt) {
        const dataUrl = evt.target.result;
        const img = new Image();
        img.onload = function() {
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

      processSmileImageFile(file, targetType, function(res) {
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

      processSmileImageFile(file, targetType, function(res) {
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

      processSmileImageFile(file, 'auto', function(res) {
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
        try { wrapper.setPointerCapture(e.pointerId); } catch (_) {}
        setDashMakeoverPercent(calcPercent(e));
      });

      wrapper.addEventListener('pointermove', (e) => {
        if (isDragging || e.pointerType === 'mouse') {
          setDashMakeoverPercent(calcPercent(e));
        }
      });

      const stopDrag = (e) => {
        isDragging = false;
        try { if (e && e.pointerId) wrapper.releasePointerCapture(e.pointerId); } catch (_) {}
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


