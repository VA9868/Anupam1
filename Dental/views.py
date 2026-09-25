from django.shortcuts import render, redirect, get_object_or_404
from django.http import JsonResponse
from django.contrib import messages
from django.contrib.auth import authenticate, login, logout
from django.contrib.auth.models import User
from django.db.models import Sum, Q
from .models import Doctor, Service, Appointment, Testimonial, ContactMessage, DentalCase, Invoice
import datetime

def home_view(request):
    services = Service.objects.filter(is_featured=True)
    doctors = Doctor.objects.all().order_by('-is_chief')
    testimonials = Testimonial.objects.all().order_by('-created_at')[:6]

    # Fallback initial dataset if database is empty yet
    if not doctors.exists():
        doctors = [
            {
                'id': 1,
                'name': 'Dr. Anoop',
                'title': 'Chief Dental Surgeon & Implantologist',
                'qualification': 'BDS, MDS (Oral & Maxillofacial Surgery)',
                'specialization': 'Dental Implants, Smile Makeovers & Full Mouth Rehabilitation',
                'experience_years': 16,
                'is_chief': True,
                'available_days': 'Mon - Sun (9:00 AM - 8:00 PM | Tue Holiday)',
                'bio': 'Dr. Anoop is a renowned Dental Surgeon with over 16 years of clinical excellence. Specializing in painless root canal treatments, immediate dental implants, and laser cosmetic dentistry, Dr. Anoop has successfully transformed over 12,000+ smiles with utmost precision and care.'
            },
            {
                'id': 2,
                'name': 'Dr. Priya Sharma',
                'title': 'Senior Orthodontist',
                'qualification': 'BDS, MDS (Orthodontics & Dentofacial Orthopedics)',
                'specialization': 'Invisalign®, Clear Aligners & Metal/Ceramic Braces',
                'experience_years': 10,
                'is_chief': False,
                'available_days': 'Tue - Sat (10:00 AM - 6:00 PM)',
                'bio': 'Dr. Priya specializes in modern dentofacial orthopedics and invisible braces, crafting confident smiles for teenagers and adults using state-of-the-art 3D digital smile design.'
            },
            {
                'id': 3,
                'name': 'Dr. Rahul Mehta',
                'title': 'Pediatric Dental Specialist',
                'qualification': 'BDS, MDS (Pediatric & Preventive Dentistry)',
                'specialization': 'Child Dental Care, Preventive Dentistry & Habit Breaking',
                'experience_years': 8,
                'is_chief': False,
                'available_days': 'Mon, Wed, Fri, Sat (11:00 AM - 7:00 PM)',
                'bio': 'Dr. Rahul creates a gentle, stress-free environment for children. Expert in painless cavity treatments, fluoride therapy, and preventive pediatric oral healthcare.'
            }
        ]

    if not services.exists():
        services = [
            {
                'id': 1,
                'title': 'Laser Teeth Whitening',
                'slug': 'teeth-whitening',
                'category': 'cosmetic',
                'icon_name': 'sparkles',
                'short_description': 'Get a sparkling white smile up to 8 shades lighter in just 45 minutes using advanced laser technology.',
                'detailed_description': 'Safe, effective, and painless cosmetic whitening procedure designed to lift stubborn stains caused by coffee, smoking, and aging.',
                'duration': '45 Mins',
                'price_estimate': '₹2,999 onwards',
                'badge_tag': 'Most Popular'
            },
            {
                'id': 2,
                'title': 'Single-Visit Root Canal (RCT)',
                'slug': 'root-canal',
                'category': 'rootcanal',
                'icon_name': 'tooth',
                'short_description': 'Painless, rotary endodontic root canal treatment done in a single comfortable visit.',
                'detailed_description': 'Modern microscopic RCT that saves your natural tooth with zero discomfort, followed by durable zirconia crowns.',
                'duration': '60 Mins',
                'price_estimate': '₹3,500 onwards',
                'badge_tag': 'Painless Tech'
            },
            {
                'id': 3,
                'title': 'Dental Implants & Fixed Teeth',
                'slug': 'dental-implants',
                'category': 'implant',
                'icon_name': 'shield-check',
                'short_description': 'Permanent, natural-looking replacement for missing teeth with lifetime warranty Titanium implants.',
                'detailed_description': 'Precision 3D guided implant surgery restoring 100% chewing function, confidence, and natural jaw structure.',
                'duration': '45 Mins / Surgery',
                'price_estimate': '₹18,000 onwards',
                'badge_tag': 'Lifetime Warranty'
            },
            {
                'id': 4,
                'title': 'Invisible Clear Aligners',
                'slug': 'clear-aligners',
                'category': 'ortho',
                'icon_name': 'smile',
                'short_description': 'Straighten your teeth discreetly without metal wires or braces using custom 3D aligners.',
                'detailed_description': 'Removable, invisible aligners custom 3D printed for comfortable, fast teeth alignment.',
                'duration': '6-12 Months',
                'price_estimate': '₹39,999 onwards',
                'badge_tag': 'Modern Ortho'
            },
            {
                'id': 5,
                'title': 'Smile Makeover & Veneers',
                'slug': 'smile-makeover',
                'category': 'cosmetic',
                'icon_name': 'gem',
                'short_description': 'Custom ultra-thin porcelain veneers to correct gaps, chips, discolored, or uneven teeth.',
                'detailed_description': 'Digital Smile Design (DSD) crafted bespoke ceramic veneers for Hollywood-standard aesthetic perfection.',
                'duration': '2 Appointments',
                'price_estimate': '₹6,500 / Tooth',
                'badge_tag': 'Hollywood Smile'
            },
            {
                'id': 6,
                'title': 'Pediatric & Kids Dental Care',
                'slug': 'pediatric-dentistry',
                'category': 'pediatric',
                'icon_name': 'child',
                'short_description': 'Gentle, fun, and child-friendly dental care including pit & fissure sealants and cavity fillings.',
                'detailed_description': 'Preventive checkups, fluoride varnish, space maintainers, and gentle painless treatments tailored for kids.',
                'duration': '30 Mins',
                'price_estimate': '₹800 onwards',
                'badge_tag': 'Kids Friendly'
            },
            {
                'id': 7,
                'title': 'Painless Tooth Extraction',
                'slug': 'tooth-extraction',
                'category': 'implant',
                'icon_name': 'syringe',
                'short_description': 'Gentle extraction of wisdom teeth or damaged teeth under micro-anesthesia with fast recovery.',
                'detailed_description': 'Surgical and non-surgical atraumatic tooth extraction ensuring quick healing and minimal post-op pain.',
                'duration': '30-45 Mins',
                'price_estimate': '₹1,500 onwards',
                'badge_tag': 'Atraumatic'
            },
            {
                'id': 8,
                'title': 'Scaling & Deep Teeth Cleaning',
                'slug': 'teeth-cleaning',
                'category': 'general',
                'icon_name': 'pump-soap',
                'short_description': 'Ultrasonic scaling and polishing to eliminate plaque, tartar, bleeding gums, and bad breath.',
                'detailed_description': 'Thorough gum therapy, deep ultrasonic cleaning, stain removal, and protective fluoridation.',
                'duration': '30 Mins',
                'price_estimate': '₹1,200 onwards',
                'badge_tag': 'Essential Hygiene'
            }
        ]

    if not testimonials.exists():
        testimonials = [
            {
                'patient_name': 'Rajesh Kumar',
                'rating': 5,
                'treatment': 'Dental Implants & RCT',
                'review_text': 'Dr. Anoop is an absolute genius! I was terrified of dental treatments, but his painless root canal procedure was completely stress-free. The implant feels 100% like my natural tooth.'
            },
            {
                'patient_name': 'Sneha Verma',
                'rating': 5,
                'treatment': 'Teeth Whitening & Smile Makeover',
                'review_text': 'Got my smile makeover done at Anupam Dental Clinic before my wedding. The result exceeded my expectations! Brilliant staff, squeaky clean clinic, and Dr. Anoop is super patient.'
            },
            {
                'patient_name': 'Amitabh Roy',
                'rating': 5,
                'treatment': 'Clear Aligners',
                'review_text': 'Dr. Priya & Dr. Anoop transformed my crowded teeth within 8 months using aligners. Highly recommended clinic with top-notch technology!'
            },
            {
                'patient_name': 'Meera Patel',
                'rating': 5,
                'treatment': 'Kids Dentistry',
                'review_text': 'Took my 6 year old daughter for cavity filling. Dr. Rahul made her feel so comfortable that she actually enjoyed the visit! Excellent pediatric care.'
            }
        ]

    context = {
        'doctors': doctors,
        'services': services,
        'testimonials': testimonials,
        'today': datetime.date.today().strftime('%Y-%m-%d'),
        'patient_name': request.session.get('patient_name'),
    }
    return render(request, 'Dental/index.html', context)

def book_appointment_view(request):
    if request.method == 'POST':
        first_name = request.POST.get('first_name', '').strip()
        last_name = request.POST.get('last_name', '').strip()
        patient_name = request.POST.get('patient_name', '').strip()
        
        if not patient_name and (first_name or last_name):
            patient_name = f"{first_name} {last_name}".strip()

        age = request.POST.get('age', '').strip()
        gender = request.POST.get('gender', '').strip()
        age_int = int(age) if age and age.isdigit() else None

        phone = request.POST.get('phone', '').strip()
        phone2 = request.POST.get('phone2', '').strip()
        email = request.POST.get('email', '').strip()
        address = request.POST.get('address', '').strip()
        city = request.POST.get('city', '').strip()
        state = request.POST.get('state', '').strip()
        pincode = request.POST.get('pincode', '').strip()
        
        service_name = request.POST.get('service_name', 'General Consultation')
        doctor_name = request.POST.get('doctor_name', 'Dr. Anoop')
        preferred_date = request.POST.get('preferred_date')
        preferred_time = request.POST.get('preferred_time', 'Morning (09:30 AM - 12:00 PM)')
        notes = request.POST.get('notes', '').strip() or request.POST.get('commit', '').strip()

        if not (first_name or patient_name) or not phone or not preferred_date:
            err = 'Please fill in all required fields (Name, Phone number, and Appointment Date).'
            if request.headers.get('x-requested-with') == 'XMLHttpRequest':
                return JsonResponse({'status': 'error', 'message': err}, status=400)
            messages.error(request, err)
            return redirect('home')

        try:
            appointment = Appointment.objects.create(
                first_name=first_name,
                last_name=last_name,
                patient_name=patient_name,
                age=age_int,
                gender=gender,
                phone=phone,
                phone2=phone2,
                email=email,
                address=address,
                city=city,
                state=state,
                pincode=pincode,
                service_name=service_name,
                doctor_name=doctor_name,
                preferred_date=preferred_date,
                preferred_time=preferred_time,
                notes=notes
            )
            display_name = f"{first_name} {last_name}".strip() or patient_name
            success_msg = f"Thank you {display_name}! Your appointment on {preferred_date} has been requested successfully. Our clinic team will call you at {phone} to confirm."
            
            if request.headers.get('x-requested-with') == 'XMLHttpRequest':
                return JsonResponse({'status': 'success', 'message': success_msg, 'id': appointment.id})
            
            messages.success(request, success_msg)
            return redirect('home')

        except Exception as e:
            err_msg = f"Submission error: {str(e)}"
            if request.headers.get('x-requested-with') == 'XMLHttpRequest':
                return JsonResponse({'status': 'error', 'message': err_msg}, status=500)
            messages.error(request, err_msg)
            return redirect('home')

    return redirect('home')

def contact_view(request):
    if request.method == 'POST':
        name = request.POST.get('name')
        phone = request.POST.get('phone')
        email = request.POST.get('email')
        subject = request.POST.get('subject', 'General Inquiry')
        message_text = request.POST.get('message')

        if name and phone and message_text:
            ContactMessage.objects.create(
                name=name,
                phone=phone,
                email=email or '',
                subject=subject,
                message=message_text
            )
            success_msg = f"Thank you {name}! We received your inquiry and our team at Anupam Dental Clinic will get back to you shortly."
            if request.headers.get('x-requested-with') == 'XMLHttpRequest':
                return JsonResponse({'status': 'success', 'message': success_msg})
            messages.success(request, success_msg)
            return redirect('home')
        else:
            if request.headers.get('x-requested-with') == 'XMLHttpRequest':
                return JsonResponse({'status': 'error', 'message': 'Please provide your name, phone number, and message.'}, status=400)
            messages.error(request, 'Please complete the required contact fields.')
            return redirect('home')
            
    return redirect('home')

def dashboard_patient_view(request):
    if not request.user.is_authenticated and 'patient_phone' not in request.session:
        return redirect('login')

    if request.user.is_authenticated:
        appointments = Appointment.objects.filter(
            Q(email__iexact=request.user.email) | Q(phone__icontains=request.user.username) | Q(patient_name__icontains=request.user.first_name)
        ).order_by('-created_at')
        display_name = request.user.first_name or request.user.username
    elif 'patient_phone' in request.session:
        appointments = Appointment.objects.filter(phone__icontains=request.session['patient_phone']).order_by('-created_at')
        display_name = request.session.get('patient_name') or "Patient"
    else:
        appointments = Appointment.objects.none()
        display_name = "Patient"

    latest_appointment = appointments.first() if appointments.exists() else None

    context = {
        'appointments': appointments,
        'latest_appointment': latest_appointment,
        'user': request.user,
        'patient_name': display_name,
        'today': datetime.date.today().strftime('%Y-%m-%d'),
    }
    return render(request, 'Dental/dashboardpatient.html', context)


def dashboard_view(request):
    if not request.user.is_authenticated and 'patient_phone' not in request.session:
        return redirect('login')

    # If regular patient (not staff), render the patient dashboard
    if not (request.user.is_authenticated and request.user.is_staff):
        return dashboard_patient_view(request)

    cases = DentalCase.objects.all().order_by('-due_date')
    total_jobs = cases.count()
    in_progress_count = cases.filter(status='in_progress').count()
    completed_count = cases.filter(status='completed').count()
    overdue_count = cases.filter(status='overdue').count()

    paid_revenue = Invoice.objects.filter(payment_status='Paid').aggregate(s=Sum('amount'))['s'] or 0
    total_revenue = f"{int(paid_revenue):,}"

    appointments = Appointment.objects.all().order_by('-created_at')
    doctors = Doctor.objects.all().order_by('-is_chief')
    invoices = Invoice.objects.all().order_by('-created_at')

    context = {
        'total_jobs': total_jobs,
        'in_progress_count': in_progress_count,
        'completed_count': completed_count,
        'overdue_count': overdue_count,
        'total_revenue': total_revenue,
        'cases': cases,
        'appointments': appointments,
        'doctors': doctors,
        'invoices': invoices,
        'user': request.user,
        'today': datetime.date.today().strftime('%Y-%m-%d'),
        'patient_name': request.user.first_name or request.user.username or "Admin",
    }
    return render(request, 'Dental/dashboard.html', context)


def login_view(request):
    if request.method == 'GET':
        if request.user.is_authenticated:
            if request.user.is_staff:
                return redirect('dashboard')
            return redirect('dashboard_patient')
        return render(request, 'Dental/login.html')

    if request.method == 'POST':
        username = request.POST.get('username', '').strip()
        password = request.POST.get('password', '').strip()

        if not username or not password:
            err = 'Please enter both Username and Password.'
            if request.headers.get('x-requested-with') == 'XMLHttpRequest':
                return JsonResponse({'status': 'error', 'message': err}, status=400)
            messages.error(request, err)
            return redirect('login')

        user = authenticate(request, username=username, password=password)
        if user is None and '@' in username:
            user_obj = User.objects.filter(email__iexact=username).first()
            if user_obj:
                user = authenticate(request, username=user_obj.username, password=password)

        if user is not None:
            login(request, user)
            target_url = '/dashboard/' if user.is_staff else '/dashboardpatient/'
            msg = f"Welcome back, {user.first_name or user.username}!"
            if request.headers.get('x-requested-with') == 'XMLHttpRequest':
                return JsonResponse({'status': 'success', 'message': msg, 'redirect_url': target_url})
            messages.success(request, msg)
            return redirect('dashboard' if user.is_staff else 'dashboard_patient')

        patient_appointments = Appointment.objects.filter(phone__icontains=username) | Appointment.objects.filter(email__iexact=username)
        if patient_appointments.exists():
            latest = patient_appointments.order_by('-created_at').first()
            request.session['patient_phone'] = latest.phone
            request.session['patient_name'] = latest.patient_name
            msg = f"Welcome, {latest.patient_name}! Opening your dashboard..."
            if request.headers.get('x-requested-with') == 'XMLHttpRequest':
                return JsonResponse({'status': 'success', 'message': msg, 'redirect_url': '/dashboardpatient/'})
            messages.success(request, msg)
            return redirect('dashboard_patient')

        err = 'Invalid Username or Password. Please try again.'
        if request.headers.get('x-requested-with') == 'XMLHttpRequest':
            return JsonResponse({'status': 'error', 'message': err}, status=400)
        messages.error(request, err)
        return redirect('login')

    return redirect('login')


def register_view(request):
    if request.method == 'POST':
        full_name = request.POST.get('full_name', '').strip()
        username = request.POST.get('username', '').strip()
        email = request.POST.get('email', '').strip()
        password = request.POST.get('password', '').strip()

        if not username or not password:
            err = 'Username and Password are required.'
            if request.headers.get('x-requested-with') == 'XMLHttpRequest':
                return JsonResponse({'status': 'error', 'message': err}, status=400)
            messages.error(request, err)
            return redirect('home')

        if User.objects.filter(username__iexact=username).exists():
            err = f'Username "{username}" is already registered. Please choose another or login.'
            if request.headers.get('x-requested-with') == 'XMLHttpRequest':
                return JsonResponse({'status': 'error', 'message': err}, status=400)
            messages.error(request, err)
            return redirect('home')

        try:
            first_name = full_name.split()[0] if full_name else username
            last_name = " ".join(full_name.split()[1:]) if full_name and len(full_name.split()) > 1 else ""
            user = User.objects.create_user(
                username=username,
                email=email,
                password=password,
                first_name=first_name,
                last_name=last_name
            )
            user.is_staff = False
            user.save()

            login(request, user)
            msg = f"Account registered successfully! Welcome, {user.first_name or user.username}."
            if request.headers.get('x-requested-with') == 'XMLHttpRequest':
                return JsonResponse({'status': 'success', 'message': msg, 'redirect_url': '/dashboardpatient/'})
            messages.success(request, msg)
            return redirect('dashboard_patient')
        except Exception as e:
            err = f"Registration error: {str(e)}"
            if request.headers.get('x-requested-with') == 'XMLHttpRequest':
                return JsonResponse({'status': 'error', 'message': err}, status=500)
            messages.error(request, err)
            return redirect('home')

    return redirect('home')

def logout_view(request):
    logout(request)
    if 'patient_name' in request.session:
        del request.session['patient_name']
    if 'patient_phone' in request.session:
        del request.session['patient_phone']
    messages.info(request, "You have been logged out successfully.")
    return redirect('home')


def add_case_view(request):
    if request.method == 'POST':
        patient_name = request.POST.get('patient_name', '').strip()
        doctor_name = request.POST.get('doctor_name', 'Dr. Anoop').strip()
        case_type = request.POST.get('case_type', 'Crown & Bridge').strip()
        status = request.POST.get('status', 'in_progress').strip()
        due_date = request.POST.get('due_date') or datetime.date.today().strftime('%Y-%m-%d')
        amount = request.POST.get('amount', '0').strip() or '0'
        notes = request.POST.get('notes', '').strip()

        case_count = DentalCase.objects.count() + 1
        case_id = f"DC-{datetime.date.today().year}-{case_count:03d}"

        try:
            DentalCase.objects.create(
                case_id=case_id,
                patient_name=patient_name or 'Walk-in Patient',
                doctor_name=doctor_name,
                case_type=case_type,
                status=status,
                due_date=due_date,
                amount=float(amount),
                notes=notes
            )
            messages.success(request, f"Dental Case {case_id} added successfully!")
        except Exception as e:
            messages.error(request, f"Error adding case: {str(e)}")

    return redirect('dashboard')


def add_patient_view(request):
    if request.method == 'POST':
        patient_name = request.POST.get('patient_name', '').strip()
        phone = request.POST.get('phone', '').strip()
        age = request.POST.get('age', '').strip()
        gender = request.POST.get('gender', 'Male').strip()
        service_name = request.POST.get('service_name', 'General Consultation').strip()
        doctor_name = request.POST.get('doctor_name', 'Dr. Anoop').strip()
        preferred_date = request.POST.get('preferred_date') or datetime.date.today().strftime('%Y-%m-%d')
        notes = request.POST.get('notes', '').strip()

        try:
            Appointment.objects.create(
                patient_name=patient_name or 'New Patient',
                phone=phone or '9999999999',
                age=int(age) if age.isdigit() else None,
                gender=gender,
                service_name=service_name,
                doctor_name=doctor_name,
                preferred_date=preferred_date,
                notes=notes,
                status='confirmed'
            )
            messages.success(request, f"Patient {patient_name} registered successfully!")
        except Exception as e:
            messages.error(request, f"Error adding patient: {str(e)}")

    return redirect('dashboard')


def add_doctor_view(request):
    if request.method == 'POST':
        name = request.POST.get('name', '').strip()
        reg_no = request.POST.get('reg_no', '').strip()
        qualification = request.POST.get('qualification', 'BDS, MDS').strip()
        designation = request.POST.get('designation', '').strip()
        available_days = request.POST.get('available_days', 'Mon - Sat (10:00 AM - 6:00 PM)').strip()
        bio = request.POST.get('bio', '').strip()
        photo = request.FILES.get('photo')

        try:
            Doctor.objects.create(
                name=name or 'Dr. Specialist',
                reg_no=reg_no,
                qualification=qualification,
                designation=designation or 'Consultant Dental Surgeon',
                title=designation or 'Consultant Dental Surgeon',
                specialization=designation or 'General & Cosmetic Dentistry',
                available_days=available_days,
                experience_years=5,
                bio=bio or f"{name} is an experienced dental surgeon at Anupam Dental Clinic.",
                photo=photo
            )
            success_info = f"Doctor {name}"
            if reg_no:
                success_info += f" (Reg No: {reg_no})"
            messages.success(request, f"{success_info} added to clinic staff successfully!")
        except Exception as e:
            messages.error(request, f"Error adding doctor: {str(e)}")

    return redirect('dashboard')


def edit_doctor_view(request, doctor_id):
    doctor = get_object_or_404(Doctor, id=doctor_id)
    if request.method == 'POST':
        name = request.POST.get('name', '').strip()
        reg_no = request.POST.get('reg_no', '').strip()
        qualification = request.POST.get('qualification', '').strip()
        designation = request.POST.get('designation', '').strip()
        available_days = request.POST.get('available_days', '').strip()
        bio = request.POST.get('bio', '').strip()

        if name:
            doctor.name = name
        doctor.reg_no = reg_no
        if qualification:
            doctor.qualification = qualification
        if designation:
            doctor.designation = designation
            doctor.title = designation
            doctor.specialization = designation
        if available_days:
            doctor.available_days = available_days
        doctor.bio = bio

        if 'photo' in request.FILES and request.FILES['photo']:
            doctor.photo = request.FILES['photo']

        try:
            doctor.save()
            messages.success(request, f"Doctor {doctor.name} updated successfully!")
        except Exception as e:
            messages.error(request, f"Error updating doctor: {str(e)}")

    return redirect('dashboard')


def delete_doctor_view(request, doctor_id):
    if request.method == 'POST':
        doctor = get_object_or_404(Doctor, id=doctor_id)
        name = doctor.name
        doctor.delete()
        messages.info(request, f"Doctor {name} has been removed.")
    return redirect('dashboard')


def new_invoice_view(request):
    if request.method == 'POST':
        patient_name = request.POST.get('patient_name', '').strip()
        treatment = request.POST.get('treatment', 'Dental Treatment').strip()
        amount = request.POST.get('amount', '0').strip() or '0'
        payment_status = request.POST.get('payment_status', 'Paid').strip()
        payment_mode = request.POST.get('payment_mode', 'UPI').strip()

        inv_count = Invoice.objects.count() + 1
        invoice_id = f"INV-{datetime.date.today().year}-{inv_count:03d}"

        try:
            Invoice.objects.create(
                invoice_id=invoice_id,
                patient_name=patient_name or 'Patient',
                treatment=treatment,
                amount=float(amount),
                payment_status=payment_status,
                payment_mode=payment_mode
            )
            messages.success(request, f"Invoice {invoice_id} for ₹{amount} recorded successfully!")
        except Exception as e:
            messages.error(request, f"Error creating invoice: {str(e)}")

    return redirect('dashboard')


def update_case_status_view(request, case_id):
    if request.method == 'POST':
        case = get_object_or_404(DentalCase, id=case_id)
        new_status = request.POST.get('status', case.status)
        if new_status in ['in_progress', 'completed', 'overdue', 'pending']:
            case.status = new_status
            case.save()
            messages.success(request, f"Case {case.case_id} status updated to {case.get_status_display()}!")
    return redirect('dashboard')


def delete_case_view(request, case_id):
    if request.method == 'POST':
        case = get_object_or_404(DentalCase, id=case_id)
        cid = case.case_id
        case.delete()
        messages.info(request, f"Case {cid} has been archived/deleted.")
    return redirect('dashboard')


def print_slip_grid_view(request):
    reg_no = request.GET.get('reg_no', '').strip()
    pid = request.GET.get('pid', '').strip()
    date_val = request.GET.get('date', datetime.date.today().strftime('%d/%m/%Y')).strip()
    name = request.GET.get('name', '').strip()
    age = request.GET.get('age', '').strip()
    gender = request.GET.get('gender', '').strip()
    address = request.GET.get('address', '').strip()
    prefill_all = request.GET.get('prefill_all', '0') == '1'
    single_card = request.GET.get('single_card', '0') == '1'

    context = {
        'reg_no': reg_no,
        'pid': pid,
        'date': date_val,
        'name': name,
        'age': age,
        'gender': gender,
        'address': address,
        'prefill_all': prefill_all,
        'single_card': single_card,
    }
    return render(request, 'Dental/print_slip_grid.html', context)


def print_letterhead_view(request):
    return render(request, 'Dental/print_letterhead.html', {})


def print_clinical_notes_view(request):
    date_val = request.GET.get('date', datetime.date.today().strftime('%d/%m/%Y')).strip()
    context = {
        'date': date_val,
    }
    return render(request, 'Dental/print_clinical_notes.html', context)


def print_prescription_view(request):
    return print_clinical_notes_view(request)



