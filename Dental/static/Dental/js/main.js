// Anupam Dental Clinic - Main JavaScript Interactive Logic

document.addEventListener('DOMContentLoaded', () => {
  // Mobile Navigation Toggle
  const mobileToggle = document.getElementById('mobileToggle');
  const navLinks = document.getElementById('navLinks');

  if (mobileToggle && navLinks) {
    mobileToggle.addEventListener('click', () => {
      if (navLinks.style.display === 'flex') {
        navLinks.style.display = 'none';
      } else {
        navLinks.style.display = 'flex';
        navLinks.style.flexDirection = 'column';
        navLinks.style.position = 'absolute';
        navLinks.style.top = '100%';
        navLinks.style.left = '0';
        navLinks.style.width = '100%';
        navLinks.style.background = 'white';
        navLinks.style.padding = '20px';
        navLinks.style.boxShadow = '0 10px 20px rgba(0,0,0,0.1)';
      }
    });
  }

  // Appointment Modal Controls
  const appointmentModal = document.getElementById('appointmentModal');
  const openModalBtns = document.querySelectorAll('.open-appointment-modal');
  const closeModalBtn = document.getElementById('closeModalBtn');
  const serviceSelect = document.getElementById('service_name');

  window.openAppointmentModal = function(serviceName = '') {
    if (appointmentModal) {
      if (serviceName && serviceSelect) {
        serviceSelect.value = serviceName;
      }
      appointmentModal.classList.add('active');
      document.body.style.overflow = 'hidden';
    }
  };

  openModalBtns.forEach(btn => {
    btn.addEventListener('click', (e) => {
      e.preventDefault();
      const service = btn.getAttribute('data-service') || '';
      openAppointmentModal(service);
    });
  });

  if (closeModalBtn) {
    closeModalBtn.addEventListener('click', () => {
      appointmentModal.classList.remove('active');
      document.body.style.overflow = 'auto';
    });
  }

  if (appointmentModal) {
    appointmentModal.addEventListener('click', (e) => {
      if (e.target === appointmentModal) {
        appointmentModal.classList.remove('active');
        document.body.style.overflow = 'auto';
      }
    });
  }

  // Services Filter Tabs
  const tabBtns = document.querySelectorAll('.tab-btn');
  const serviceCards = document.querySelectorAll('.service-card');

  tabBtns.forEach(tab => {
    tab.addEventListener('click', () => {
      tabBtns.forEach(t => t.classList.remove('active'));
      tab.classList.add('active');

      const category = tab.getAttribute('data-category');
      serviceCards.forEach(card => {
        if (category === 'all' || card.getAttribute('data-category') === category) {
          card.style.display = 'flex';
        } else {
          card.style.display = 'none';
        }
      });
    });
  });

  // Interactive Dental Symptom Checker
  const symptomChips = document.querySelectorAll('.symptom-chip');
  const resultTitle = document.getElementById('symptomResultTitle');
  const resultDesc = document.getElementById('symptomResultDesc');
  const resultDuration = document.getElementById('symptomResultDuration');
  const resultBookBtn = document.getElementById('symptomBookBtn');

  const symptomData = {
    toothache: {
      title: 'Painless Single-Visit Root Canal (RCT)',
      desc: 'Severe or throbbing tooth pain is often caused by nerve inflammation or deep infection. Dr. Anoop performs painless microscopic RCT to instantly relieve pain and preserve your natural tooth.',
      duration: '45-60 Mins',
      service: 'Single-Visit Root Canal (RCT)'
    },
    yellow: {
      title: 'Laser Teeth Whitening & Polishing',
      desc: 'Surface staining or discoloration can be transformed up to 8 shades brighter using our pain-free US-FDA approved laser teeth whitening system.',
      duration: '45 Mins',
      service: 'Laser Teeth Whitening'
    },
    missing: {
      title: 'Lifetime Dental Implants & Fixed Teeth',
      desc: 'Replace missing teeth permanently with titanium implants that look, chew, and feel exactly like natural teeth with 99.4% clinical success rate.',
      duration: '45 Mins Procedure',
      service: 'Dental Implants & Fixed Teeth'
    },
    crooked: {
      title: 'Invisible Clear Aligners (Invisalign® Style)',
      desc: 'Straighten your misaligned teeth without visible metal braces. Removable 3D printed clear aligners offer comfortable, discreet orthodontic correction.',
      duration: '6-12 Months',
      service: 'Invisible Clear Aligners'
    },
    bleeding: {
      title: 'Ultrasonic Gum Scaling & Deep Cleaning',
      desc: 'Bleeding gums or bad breath signal early gingivitis. Ultrasonic scaling removes bacterial tartar buildup and revitalizes your gum health.',
      duration: '30 Mins',
      service: 'Scaling & Deep Teeth Cleaning'
    }
  };

  symptomChips.forEach(chip => {
    chip.addEventListener('click', () => {
      symptomChips.forEach(c => c.classList.remove('active'));
      chip.classList.add('active');

      const symptomKey = chip.getAttribute('data-symptom');
      const data = symptomData[symptomKey];
      if (data && resultTitle) {
        resultTitle.textContent = data.title;
        resultDesc.textContent = data.desc;
        resultDuration.textContent = `Estimated Treatment Time: ${data.duration}`;
        if (resultBookBtn) {
          resultBookBtn.setAttribute('onclick', `openAppointmentModal('${data.service}')`);
        }
      }
    });
  });

  // AJAX Appointment Form Handling
  const appointmentForm = document.getElementById('appointmentForm');
  const appointmentAlert = document.getElementById('appointmentAlert');

  if (appointmentForm) {
    appointmentForm.addEventListener('submit', function(e) {
      e.preventDefault();
      const formData = new FormData(this);

      const submitBtn = appointmentForm.querySelector('button[type="submit"]');
      const originalText = submitBtn.innerHTML;
      submitBtn.disabled = true;
      submitBtn.innerHTML = '<i class="fas fa-spinner fa-spin"></i> Booking...';

      fetch('/book-appointment/', {
        method: 'POST',
        headers: {
          'X-Requested-With': 'XMLHttpRequest'
        },
        body: formData
      })
      .then(res => res.json())
      .then(data => {
        submitBtn.disabled = false;
        submitBtn.innerHTML = originalText;

        if (data.status === 'success') {
          appointmentForm.reset();
          if (appointmentAlert) {
            appointmentAlert.style.display = 'block';
            appointmentAlert.className = 'alert alert-success';
            appointmentAlert.innerHTML = `<i class="fas fa-check-circle"></i> ${data.message}`;
          }
          setTimeout(() => {
            if (appointmentModal) appointmentModal.classList.remove('active');
            document.body.style.overflow = 'auto';
            alert(data.message);
          }, 800);
        } else {
          if (appointmentAlert) {
            appointmentAlert.style.display = 'block';
            appointmentAlert.className = 'alert alert-danger';
            appointmentAlert.innerHTML = `<i class="fas fa-exclamation-triangle"></i> ${data.message}`;
          }
        }
      })
      .catch(err => {
        submitBtn.disabled = false;
        submitBtn.innerHTML = originalText;
        console.error(err);
      });
    });
  }

  // Active Navigation Link Highlight on Scroll
  const sections = document.querySelectorAll('section[id]');
  window.addEventListener('scroll', () => {
    let current = '';
    sections.forEach(section => {
      const sectionTop = section.offsetTop - 120;
      if (window.pageYOffset >= sectionTop) {
        current = section.getAttribute('id');
      }
    });

    document.querySelectorAll('.nav-links a').forEach(a => {
      a.classList.remove('active');
      if (a.getAttribute('href') === `#${current}`) {
        a.classList.add('active');
      }
    });
  });

  // Login Modal Controls
  const loginModal = document.getElementById('loginModal');
  const openLoginBtns = document.querySelectorAll('.open-login-modal');
  const closeLoginModalBtn = document.getElementById('closeLoginModalBtn');
  const loginForm = document.getElementById('loginForm');
  const loginAlert = document.getElementById('loginAlert');

  openLoginBtns.forEach(btn => {
    btn.addEventListener('click', (e) => {
      e.preventDefault();
      if (loginModal) {
        loginModal.classList.add('active');
        document.body.style.overflow = 'hidden';
      }
    });
  });

  if (closeLoginModalBtn) {
    closeLoginModalBtn.addEventListener('click', () => {
      loginModal.classList.remove('active');
      document.body.style.overflow = 'auto';
    });
  }

  if (loginModal) {
    loginModal.addEventListener('click', (e) => {
      if (e.target === loginModal) {
        loginModal.classList.remove('active');
        document.body.style.overflow = 'auto';
      }
    });
  }

  // Auth Tab Switchers (Login vs Register)
  const tabLoginBtn = document.getElementById('tabLoginBtn');
  const tabRegisterBtn = document.getElementById('tabRegisterBtn');
  const registerForm = document.getElementById('registerForm');

  if (tabLoginBtn && tabRegisterBtn && loginForm && registerForm) {
    tabLoginBtn.addEventListener('click', () => {
      tabLoginBtn.classList.add('active');
      tabRegisterBtn.classList.remove('active');
      loginForm.style.display = 'block';
      registerForm.style.display = 'none';
      if (loginAlert) loginAlert.style.display = 'none';
    });

    tabRegisterBtn.addEventListener('click', () => {
      tabRegisterBtn.classList.add('active');
      tabLoginBtn.classList.remove('active');
      registerForm.style.display = 'block';
      loginForm.style.display = 'none';
      if (loginAlert) loginAlert.style.display = 'none';
    });
  }

  const handleAjaxAuthForm = (formElement) => {
    if (!formElement) return;
    formElement.addEventListener('submit', (e) => {
      e.preventDefault();
      const submitBtn = formElement.querySelector('button[type="submit"]');
      const originalText = submitBtn.innerHTML;
      submitBtn.disabled = true;
      submitBtn.innerHTML = `<i class="fas fa-spinner fa-spin"></i> Processing...`;

      const formData = new FormData(formElement);
      fetch(formElement.action, {
        method: 'POST',
        body: formData,
        headers: {
          'X-Requested-With': 'XMLHttpRequest'
        }
      })
      .then(res => res.json())
      .then(data => {
        submitBtn.disabled = false;
        submitBtn.innerHTML = originalText;
        if (data.status === 'success') {
          if (loginAlert) {
            loginAlert.style.display = 'block';
            loginAlert.style.background = '#dcfce7';
            loginAlert.style.color = '#15803d';
            loginAlert.innerHTML = `<i class="fas fa-check-circle"></i> ${data.message}`;
          }
          setTimeout(() => {
            window.location.href = data.redirect_url || '/';
          }, 800);
        } else {
          if (loginAlert) {
            loginAlert.style.display = 'block';
            loginAlert.style.background = '#fee2e2';
            loginAlert.style.color = '#b91c1c';
            loginAlert.innerHTML = `<i class="fas fa-exclamation-triangle"></i> ${data.message}`;
          }
        }
      })
      .catch(err => {
        submitBtn.disabled = false;
        submitBtn.innerHTML = originalText;
        console.error(err);
      });
    });
  };

  handleAjaxAuthForm(loginForm);
  handleAjaxAuthForm(registerForm);
});
