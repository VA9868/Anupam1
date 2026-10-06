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
            if (data.redirect_url) {
              window.location.href = data.redirect_url;
            } else {
              alert(data.message);
            }
          }, 1200);
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

  // Auth Tab Switchers (Login vs Register vs Replace Password)
  const tabLoginBtn = document.getElementById('tabLoginBtn');
  const tabRegisterBtn = document.getElementById('tabRegisterBtn');
  const tabReplaceBtn = document.getElementById('tabReplaceBtn');
  const registerForm = document.getElementById('registerForm');
  const replacePasswordForm = document.getElementById('replacePasswordForm');
  const linkForgotPassword = document.getElementById('linkForgotPassword');
  const backToLoginLink = document.getElementById('backToLoginLink');

  function switchAuthTab(tab) {
    if (loginAlert) loginAlert.style.display = 'none';

    // Reset tab button states
    if (tabLoginBtn) tabLoginBtn.classList.remove('active');
    if (tabRegisterBtn) tabRegisterBtn.classList.remove('active');
    if (tabReplaceBtn) tabReplaceBtn.classList.remove('active');

    // Hide all forms
    if (loginForm) loginForm.style.display = 'none';
    if (registerForm) registerForm.style.display = 'none';
    if (replacePasswordForm) replacePasswordForm.style.display = 'none';

    // Activate selected tab & form
    if (tab === 'login') {
      if (tabLoginBtn) tabLoginBtn.classList.add('active');
      if (loginForm) loginForm.style.display = 'block';
    } else if (tab === 'register') {
      if (tabRegisterBtn) tabRegisterBtn.classList.add('active');
      if (registerForm) registerForm.style.display = 'block';
    } else if (tab === 'replace') {
      if (tabReplaceBtn) tabReplaceBtn.classList.add('active');
      if (replacePasswordForm) replacePasswordForm.style.display = 'block';
    }
  }

  window.switchAuthTab = switchAuthTab;

  window.togglePasswordVisibility = function(inputId, btn) {
    const input = document.getElementById(inputId);
    if (!input) return;
    const icon = btn.querySelector('i');
    if (input.type === 'password') {
      input.type = 'text';
      if (icon) {
        icon.classList.remove('fa-eye');
        icon.classList.add('fa-eye-slash');
      }
    } else {
      input.type = 'password';
      if (icon) {
        icon.classList.remove('fa-eye-slash');
        icon.classList.add('fa-eye');
      }
    }
  };

  window.openForgetPassword = function() {
    const modal = document.getElementById('loginModal');
    if (modal) {
      modal.classList.add('active');
      document.body.style.overflow = 'hidden';
    }
    switchAuthTab('replace');
    const loginUser = document.getElementById('login_username');
    const replaceId = document.getElementById('replace_identifier');
    const newPass = document.getElementById('replace_new_password');
    if (loginUser && replaceId && loginUser.value.trim() && !replaceId.value.trim()) {
      replaceId.value = loginUser.value.trim();
    }
    if (replaceId && replaceId.value.trim() && newPass) {
      setTimeout(() => newPass.focus(), 150);
    } else if (replaceId) {
      setTimeout(() => replaceId.focus(), 150);
    }
  };

  // Live password matching indicator for Replace Password
  const replaceNewPass = document.getElementById('replace_new_password');
  const replaceConfirmPass = document.getElementById('replace_confirm_password');
  const matchHint = document.getElementById('passwordMatchHint');

  function checkPasswordMatch() {
    if (!replaceNewPass || !replaceConfirmPass || !matchHint) return;
    const v1 = replaceNewPass.value;
    const v2 = replaceConfirmPass.value;
    if (!v2) {
      matchHint.style.display = 'none';
      return;
    }
    matchHint.style.display = 'block';
    if (v1 === v2) {
      matchHint.style.color = '#16a34a';
      matchHint.innerHTML = '<i class="fas fa-check-circle"></i> Passwords match';
    } else {
      matchHint.style.color = '#dc2626';
      matchHint.innerHTML = '<i class="fas fa-times-circle"></i> Passwords do not match';
    }
  }

  if (replaceNewPass) replaceNewPass.addEventListener('input', checkPasswordMatch);
  if (replaceConfirmPass) replaceConfirmPass.addEventListener('input', checkPasswordMatch);

  if (tabLoginBtn) tabLoginBtn.addEventListener('click', () => switchAuthTab('login'));
  if (tabRegisterBtn) tabRegisterBtn.addEventListener('click', () => switchAuthTab('register'));
  if (tabReplaceBtn) tabReplaceBtn.addEventListener('click', () => switchAuthTab('replace'));
  
  if (linkForgotPassword) {
    linkForgotPassword.addEventListener('click', (e) => {
      e.preventDefault();
      window.openForgetPassword();
    });
  }

  if (backToLoginLink) {
    backToLoginLink.addEventListener('click', (e) => {
      e.preventDefault();
      switchAuthTab('login');
    });
  }

  const pendingAuthTab = sessionStorage.getItem('openAuth');
  if (pendingAuthTab && loginModal) {
    sessionStorage.removeItem('openAuth');
    loginModal.classList.add('active');
    document.body.style.overflow = 'hidden';
    switchAuthTab(pendingAuthTab);
  } else if (window.location.hash === '#forgot-password' || window.location.hash === '#replace-password') {
    window.openForgetPassword();
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
  handleAjaxAuthForm(replacePasswordForm);

  // =========================================================
  // AI CLINICAL SIMULATION SANDBOX CONTROLS
  // =========================================================
  const startScanBtn = document.getElementById('startScanBtn');
  const scanBtnText = document.getElementById('scanBtnText');
  const scanStatusText = document.getElementById('scanStatusText');
  const scannerViewport = document.getElementById('scannerViewport');
  let isScanning = false;
  let scanTimer = null;

  if (startScanBtn && scannerViewport) {
    startScanBtn.addEventListener('click', () => {
      if (isScanning) {
        // Reset scan
        clearTimeout(scanTimer);
        isScanning = false;
        scannerViewport.classList.remove('scanning-running', 'scanning-active');
        if (scanBtnText) scanBtnText.textContent = 'Start AI Scan';
        startScanBtn.querySelector('i').className = 'fas fa-play';
        if (scanStatusText) {
          scanStatusText.textContent = 'Diagnostics idle. Click scan.';
          scanStatusText.style.color = '#64748b';
        }
      } else {
        // Start scan simulation
        isScanning = true;
        scannerViewport.classList.add('scanning-running');
        scannerViewport.classList.remove('scanning-active');
        if (scanBtnText) scanBtnText.textContent = 'Scanning...';
        startScanBtn.querySelector('i').className = 'fas fa-spinner fa-spin';
        if (scanStatusText) {
          scanStatusText.textContent = 'Running neural network detection...';
          scanStatusText.style.color = '#0284c7';
        }

        scanTimer = setTimeout(() => {
          scannerViewport.classList.remove('scanning-running');
          scannerViewport.classList.add('scanning-active');
          if (scanBtnText) scanBtnText.textContent = 'Reset Scan';
          startScanBtn.querySelector('i').className = 'fas fa-redo';
          if (scanStatusText) {
            scanStatusText.innerHTML = '<strong style="color: #10b981;">✓ 3 Pathologies Identified</strong> (Caries, Joint, Margin)';
          }
        }, 1800);
      }
    });

    // Homepage OPG Upload & Sample Switcher
    const homeOpgUploadInput = document.getElementById('homeOpgUploadInput');
    const homeSampleOpgBtn = document.getElementById('homeSampleOpgBtn');
    const opgToggleBtnText = document.getElementById('opgToggleBtnText');
    const scannerImg = scannerViewport.querySelector('.scanner-img');
    const box1 = document.getElementById('box1');
    const box2 = document.getElementById('box2');
    const box3 = document.getElementById('box3');
    let isOpgMode = false;

    function switchToOpgMode(imageSrc) {
      isOpgMode = true;
      if (scannerImg) {
        scannerImg.src = imageSrc;
        scannerImg.style.objectFit = 'contain';
        scannerImg.style.background = '#000';
      }
      if (opgToggleBtnText) opgToggleBtnText.textContent = 'Clinic View';
      if (box1) {
        box1.style.cssText = 'top: 55%; left: 74%; width: 12%; height: 20%;';
        const tag1 = box1.querySelector('.box-tag');
        if (tag1) tag1.innerHTML = '<i class="fas fa-exclamation-triangle"></i> Impacted #48 (98.4%)';
      }
      if (box2) {
        box2.style.cssText = 'top: 52%; left: 24%; width: 9%; height: 16%;';
        const tag2 = box2.querySelector('.box-tag');
        if (tag2) tag2.innerHTML = '<i class="fas fa-tooth"></i> Caries #36 (94.7%)';
      }
      if (box3) {
        box3.style.cssText = 'top: 72%; left: 40%; width: 20%; height: 12%;';
        const tag3 = box3.querySelector('.box-tag');
        if (tag3) tag3.innerHTML = '<i class="fas fa-bone"></i> Bone Margin (99.1%)';
      }
    }

    function switchToClinicMode(imageSrc) {
      isOpgMode = false;
      if (scannerImg) {
        scannerImg.src = imageSrc;
        scannerImg.style.objectFit = 'cover';
        scannerImg.style.background = 'transparent';
      }
      if (opgToggleBtnText) opgToggleBtnText.textContent = 'OPG X-Ray';
      if (box1) {
        box1.style.cssText = 'top: 38%; left: 15%; width: 14%; height: 26%;';
        const tag1 = box1.querySelector('.box-tag');
        if (tag1) tag1.innerHTML = '<i class="fas fa-exclamation-triangle"></i> Caries Detected (94.2%)';
      }
      if (box2) {
        box2.style.cssText = 'top: 52%; left: 40%; width: 19%; height: 18%;';
        const tag2 = box2.querySelector('.box-tag');
        if (tag2) tag2.innerHTML = '<i class="fas fa-info-circle"></i> Fixture Joint (91.8%)';
      }
      if (box3) {
        box3.style.cssText = 'top: 36%; left: 68%; width: 13%; height: 26%;';
        const tag3 = box3.querySelector('.box-tag');
        if (tag3) tag3.innerHTML = '<i class="fas fa-check-circle"></i> Bone Margin (99.4%)';
      }
    }

    if (homeSampleOpgBtn) {
      homeSampleOpgBtn.addEventListener('click', () => {
        const opgUrl = homeSampleOpgBtn.getAttribute('data-opg-url');
        const clinicUrl = homeSampleOpgBtn.getAttribute('data-clinic-url');
        if (!isOpgMode) {
          switchToOpgMode(opgUrl);
        } else {
          switchToClinicMode(clinicUrl);
        }
        if (!isScanning) startScanBtn.click();
      });
    }

    if (homeOpgUploadInput) {
      homeOpgUploadInput.addEventListener('change', (e) => {
        const file = e.target.files && e.target.files[0];
        if (!file) return;
        const reader = new FileReader();
        reader.onload = (evt) => {
          switchToOpgMode(evt.target.result);
          if (!isScanning) startScanBtn.click();
        };
        reader.readAsDataURL(file);
        e.target.value = '';
      });
    }
  }

  // AI Cosmetic Smile Makeover Slider (Horizontal Resize on Pointer Move & Drag)
  const makeoverWrapper = document.getElementById('makeoverWrapper');
  const makeoverRange = document.getElementById('makeoverRange');
  const makeoverClipOverlay = document.getElementById('makeoverClipOverlay');
  const makeoverSliderBar = document.getElementById('makeoverSliderBar');

  if (makeoverWrapper && makeoverClipOverlay && makeoverSliderBar) {
    let isDragging = false;

    const setMakeoverPercent = (percent) => {
      const clamped = Math.max(0, Math.min(100, percent));
      makeoverClipOverlay.style.clipPath = `polygon(0 0, ${clamped}% 0, ${clamped}% 100%, 0 100%)`;
      makeoverSliderBar.style.left = `${clamped}%`;
      if (makeoverRange) {
        makeoverRange.value = clamped;
      }
    };

    const calculatePercentFromPointer = (e) => {
      const rect = makeoverWrapper.getBoundingClientRect();
      const clientX = e.touches ? e.touches[0].clientX : e.clientX;
      const x = clientX - rect.left;
      return (x / rect.width) * 100;
    };

    // 1. Pointer Move (instantly resizes horizontally following the mouse cursor)
    makeoverWrapper.addEventListener('mousemove', (e) => {
      setMakeoverPercent(calculatePercentFromPointer(e));
    });

    // 2. Pointer Down & Drag (supports click, touch, and stylus drag)
    makeoverWrapper.addEventListener('pointerdown', (e) => {
      isDragging = true;
      try { makeoverWrapper.setPointerCapture(e.pointerId); } catch (_) {}
      setMakeoverPercent(calculatePercentFromPointer(e));
    });

    makeoverWrapper.addEventListener('pointermove', (e) => {
      if (isDragging || e.pointerType === 'mouse') {
        setMakeoverPercent(calculatePercentFromPointer(e));
      }
    });

    const stopDragging = (e) => {
      isDragging = false;
      try { if (e && e.pointerId) makeoverWrapper.releasePointerCapture(e.pointerId); } catch (_) {}
    };

    makeoverWrapper.addEventListener('pointerup', stopDragging);
    makeoverWrapper.addEventListener('pointercancel', stopDragging);

    // 3. Mobile Touch Drag
    makeoverWrapper.addEventListener('touchmove', (e) => {
      setMakeoverPercent(calculatePercentFromPointer(e));
    }, { passive: true });

    // 4. Keyboard / Accessible Range Input
    if (makeoverRange) {
      makeoverRange.addEventListener('input', (e) => {
        setMakeoverPercent(parseFloat(e.target.value));
      });
    }

    // Initialize at center (50%)
    setMakeoverPercent(50);
  }

  // =========================================================
  // TESTIMONIALS CAROUSEL (3 PER VIEW WITH NEXT & PREVIOUS)
  // =========================================================
  window.slideTestimonials = function(direction) {
    const track = document.getElementById('testimonialsTrack');
    if (!track) return;
    const card = track.querySelector('.testimonial-card');
    if (!card) return;

    const gap = 24;
    const cardWidth = card.offsetWidth + gap;
    // Moves 1 box (card) per click for granular browsing
    const scrollAmount = cardWidth;
    const maxScrollLeft = track.scrollWidth - track.clientWidth;

    if (direction > 0) {
      if (track.scrollLeft >= maxScrollLeft - 10) {
        track.scrollTo({ left: 0, behavior: 'smooth' });
      } else {
        track.scrollBy({ left: scrollAmount, behavior: 'smooth' });
      }
    } else {
      if (track.scrollLeft <= 10) {
        track.scrollTo({ left: maxScrollLeft, behavior: 'smooth' });
      } else {
        track.scrollBy({ left: -scrollAmount, behavior: 'smooth' });
      }
    }
  };

  const initTestimonialsCarousel = () => {
    const track = document.getElementById('testimonialsTrack');
    const dotsContainer = document.getElementById('testimonialDots');
    if (!track || !dotsContainer) return;

    const cards = track.querySelectorAll('.testimonial-card');
    if (cards.length === 0) return;

    const updateDots = () => {
      const card = cards[0];
      const gap = 24;
      const cardWidth = card.offsetWidth + gap;
      const maxScrollLeft = Math.max(0, track.scrollWidth - track.clientWidth);
      const totalSteps = Math.max(1, Math.round(maxScrollLeft / cardWidth) + 1);

      dotsContainer.innerHTML = '';
      for (let i = 0; i < totalSteps; i++) {
        const dot = document.createElement('button');
        dot.type = 'button';
        dot.className = `testimonial-dot ${i === 0 ? 'active' : ''}`;
        dot.setAttribute('aria-label', `Go to review ${i + 1}`);
        dot.addEventListener('click', () => {
          track.scrollTo({ left: Math.min(i * cardWidth, maxScrollLeft), behavior: 'smooth' });
        });
        dotsContainer.appendChild(dot);
      }
    };

    updateDots();
    window.addEventListener('resize', updateDots);

    // Update active dot on scroll
    track.addEventListener('scroll', () => {
      const card = cards[0];
      const gap = 24;
      const cardWidth = card.offsetWidth + gap;
      const maxScrollLeft = Math.max(0, track.scrollWidth - track.clientWidth);
      const totalSteps = Math.max(1, Math.round(maxScrollLeft / cardWidth) + 1);
      const scrollLeft = track.scrollLeft;
      const stepIndex = Math.min(totalSteps - 1, Math.round(scrollLeft / cardWidth));
      const dots = dotsContainer.querySelectorAll('.testimonial-dot');
      dots.forEach((d, idx) => {
        if (idx === stepIndex) d.classList.add('active');
        else d.classList.remove('active');
      });
    }, { passive: true });

    // Auto-slide every 5 seconds, pause on hover
    let autoSlideTimer = setInterval(() => {
      window.slideTestimonials(1);
    }, 5000);

    const container = track.closest('.testimonials-carousel-container');
    if (container) {
      container.addEventListener('mouseenter', () => clearInterval(autoSlideTimer));
      container.addEventListener('mouseleave', () => {
        clearInterval(autoSlideTimer);
        autoSlideTimer = setInterval(() => {
          window.slideTestimonials(1);
        }, 5000);
      });
    }
  };

  initTestimonialsCarousel();
});

