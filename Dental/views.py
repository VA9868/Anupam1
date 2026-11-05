from django.shortcuts import render, redirect, get_object_or_404
from django.http import JsonResponse
from django.contrib import messages
from django.contrib.auth import authenticate, login, logout
from django.contrib.auth.models import User
from django.db.models import Sum, Q
from .models import Doctor, Service, Appointment, Testimonial, ContactMessage, DentalCase, Invoice, AboutClinic, GalleryPhoto, DentalLab, LabPayment, MedicineInventory, PatientMedicine
import datetime
import json

def home_view(request):
    services = Service.objects.filter(is_featured=True).order_by('-id')
    doctors = Doctor.objects.all().order_by('-is_chief')
    testimonials = Testimonial.objects.all().order_by('-id')[:12]

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
                'title': 'General Dentistry',
                'slug': 'teeth-whitening',
                'category': 'cosmetic',
                'icon_name': 'sparkles',
                'short_description': 'Led by Dr. Anoopkumar Ravindranath, our general dentistry services focus on prevention, accurate diagnosis, and long-term oral health. From routine dental check-ups to essential treatments, every step is guided by clarity and ethical care.',
                'detailed_description': 'Safe, effective, and painless cosmetic whitening procedure designed to lift stubborn stains caused by coffee, smoking, and aging.',
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
            },
            {
                'patient_name': 'Rahul Sharma',
                'rating': 5,
                'treatment': 'Painless Root Canal Therapy',
                'review_text': 'Single-sitting root canal done with zero pain. Dr. Anoop explained the entire procedure before starting. Truly world-class dental facility in Vaikom.'
            },
            {
                'patient_name': 'Ananya Menon',
                'rating': 5,
                'treatment': 'Cosmetic Smile Design & Veneers',
                'review_text': 'Dr. Anoop designed my custom ceramic veneers with such precision. My smile looks completely natural, bright and radiant now! The 3D scanning was quick and comfortable.'
            },
            {
                'patient_name': 'George Mathew',
                'rating': 5,
                'treatment': 'Full Mouth Rehabilitation & Zirconia Bridges',
                'review_text': 'Got full arch fixed zirconia teeth after struggling with loose dentures for years. Can now eat apples and solid food without any discomfort. Truly life-changing dental care!'
            },
            {
                'patient_name': 'Revathi S.',
                'rating': 5,
                'treatment': 'Laser Gum Contouring & Smile Styling',
                'review_text': 'Had laser therapy done for uneven gum line. It was totally painless and healed within 3 days. Dr. Anoop is extremely caring, patient and knowledgeable.'
            }
        ]

    about_clinic = AboutClinic.objects.first()
    if not about_clinic:
        about_clinic = AboutClinic.objects.create(
            title="Your Trusted Partner For Total Oral Health",
            subtitle="About Our Clinic",
            description="Anupam Dental Clinic, led by Dr. Anoop, has been caring for patients since 19th August 1996. For nearly three decades, we have remained committed to ethical dentistry, clear communication, and compassionate care.",
            established_date="19th August 1996",
            experience_years="28+"
        )

    gallery_photos = GalleryPhoto.objects.all()
    if not gallery_photos.exists():
        fallback_gallery = [
            {
                'title': 'Anupam Dental Clinic Exterior',
                'caption': 'Modern dental healthcare center located at West Gate Vaikom with ample patient parking.',
                'image_url': '/static/Dental/images/Out1.jpeg',
                'category_label': 'Clinic Facility',
            },
            {
                'title': 'AI Diagnostics & Radiography Suite',
                'caption': 'Digital intraoral diagnostics and 3D panoramic imaging suite with instant analysis.',
                'image_url': '/static/Dental/images/ai_clinic_scan.jpg',
                'category_label': 'Modern Technology',
            },
            {
                'title': 'Laser Teeth Whitening Transformation',
                'caption': 'Single-visit painless laser teeth whitening restoring natural radiant brightness.',
                'image_url': '/static/Dental/images/smile_after_white.jpg',
                'category_label': 'Smile Transformation',
            },
            {
                'title': 'Cosmetic Smile Makeover & Veneers',
                'caption': 'Custom digital smile design and precision porcelain veneers crafted by Dr. Anoop.',
                'image_url': '/static/Dental/images/smile_makeover.jpg',
                'category_label': 'Smile Makeover',
            },
            {
                'title': 'Advanced Dental Operatory Station',
                'caption': 'Ergonomic operatory equipped with class-B sterilization, surgical lighting & micro-tools.',
                'image_url': '/static/Dental/images/Teeth.jpg',
                'category_label': 'Operatory & Surgery',
            },
            {
                'title': 'Smile Reconstruction Case Study',
                'caption': 'Full-mouth functional & aesthetic smile rehabilitation with lifetime warranty implants.',
                'image_url': '/static/Dental/images/sample_patient_makeover.jpg',
                'category_label': 'Clinical Results',
            },
        ]
    else:
        fallback_gallery = None

    context = {
        'doctors': doctors,
        'services': services,
        'testimonials': testimonials,
        'about_clinic': about_clinic,
        'gallery_photos': gallery_photos,
        'fallback_gallery': fallback_gallery,
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
            slot_info = f" ({preferred_time})" if preferred_time else ""
            success_msg = f"Thank you {display_name}! Your appointment on {preferred_date}{slot_info} has been saved and connected successfully. Our clinic team will call you at {phone} to confirm."
            
            # Connect patient session
            request.session['patient_phone'] = phone
            request.session['patient_name'] = display_name
            
            # Connect or create Patient User account
            user = None
            if phone:
                user = User.objects.filter(username__iexact=phone).first()
            if not user and email:
                user = User.objects.filter(email__iexact=email).first()
            if not user and phone:
                try:
                    f_name = first_name or (display_name.split()[0] if display_name else 'Patient')
                    l_name = last_name or (' '.join(display_name.split()[1:]) if display_name and len(display_name.split()) > 1 else '')
                    user = User.objects.create_user(
                        username=phone,
                        email=email or '',
                        first_name=f_name,
                        last_name=l_name
                    )
                    user.is_staff = False
                    user.save()
                except Exception:
                    user = None

            if user:
                login(request, user, backend='django.contrib.auth.backends.ModelBackend')

            if request.headers.get('x-requested-with') == 'XMLHttpRequest':
                return JsonResponse({
                    'status': 'success',
                    'message': success_msg,
                    'id': appointment.id,
                    'redirect_url': '/dashboardpatient/'
                })
            
            messages.success(request, success_msg)
            return redirect('dashboard_patient')

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

ADULT_TEETH_INFO = {
    "1": {"fdi": "18", "name": "Maxillary Right 3rd Molar (Wisdom)"},
    "2": {"fdi": "17", "name": "Maxillary Right 2nd Molar"},
    "3": {"fdi": "16", "name": "Maxillary Right 1st Molar"},
    "4": {"fdi": "15", "name": "Maxillary Right 2nd Premolar"},
    "5": {"fdi": "14", "name": "Maxillary Right 1st Premolar"},
    "6": {"fdi": "13", "name": "Maxillary Right Canine"},
    "7": {"fdi": "12", "name": "Maxillary Right Lateral Incisor"},
    "8": {"fdi": "11", "name": "Maxillary Right Central Incisor"},
    "9": {"fdi": "21", "name": "Maxillary Left Central Incisor"},
    "10": {"fdi": "22", "name": "Maxillary Left Lateral Incisor"},
    "11": {"fdi": "23", "name": "Maxillary Left Canine"},
    "12": {"fdi": "24", "name": "Maxillary Left 1st Premolar"},
    "13": {"fdi": "25", "name": "Maxillary Left 2nd Premolar"},
    "14": {"fdi": "26", "name": "Maxillary Left 1st Molar"},
    "15": {"fdi": "27", "name": "Maxillary Left 2nd Molar"},
    "16": {"fdi": "28", "name": "Maxillary Left 3rd Molar (Wisdom)"},
    "17": {"fdi": "38", "name": "Mandibular Left 3rd Molar (Wisdom)"},
    "18": {"fdi": "37", "name": "Mandibular Left 2nd Molar"},
    "19": {"fdi": "36", "name": "Mandibular Left 1st Molar"},
    "20": {"fdi": "35", "name": "Mandibular Left 2nd Premolar"},
    "21": {"fdi": "34", "name": "Mandibular Left 1st Premolar"},
    "22": {"fdi": "33", "name": "Mandibular Left Canine"},
    "23": {"fdi": "32", "name": "Mandibular Left Lateral Incisor"},
    "24": {"fdi": "31", "name": "Mandibular Left Central Incisor"},
    "25": {"fdi": "41", "name": "Mandibular Right Central Incisor"},
    "26": {"fdi": "42", "name": "Mandibular Right Lateral Incisor"},
    "27": {"fdi": "43", "name": "Mandibular Right Canine"},
    "28": {"fdi": "44", "name": "Mandibular Right 1st Premolar"},
    "29": {"fdi": "45", "name": "Mandibular Right 2nd Premolar"},
    "30": {"fdi": "46", "name": "Mandibular Right 1st Molar"},
    "31": {"fdi": "47", "name": "Mandibular Right 2nd Molar"},
    "32": {"fdi": "48", "name": "Mandibular Right 3rd Molar (Wisdom)"},
}

PEDIATRIC_TEETH_INFO = {
    "A": {"fdi": "55", "name": "Primary Upper Right 2nd Molar"},
    "B": {"fdi": "54", "name": "Primary Upper Right 1st Molar"},
    "C": {"fdi": "53", "name": "Primary Upper Right Canine"},
    "D": {"fdi": "52", "name": "Primary Upper Right Lateral"},
    "E": {"fdi": "51", "name": "Primary Upper Right Central"},
    "F": {"fdi": "61", "name": "Primary Upper Left Central"},
    "G": {"fdi": "62", "name": "Primary Upper Left Lateral"},
    "H": {"fdi": "63", "name": "Primary Upper Left Canine"},
    "I": {"fdi": "64", "name": "Primary Upper Left 1st Molar"},
    "J": {"fdi": "65", "name": "Primary Upper Left 2nd Molar"},
    "T": {"fdi": "85", "name": "Primary Lower Right 2nd Molar"},
    "S": {"fdi": "84", "name": "Primary Lower Right 1st Molar"},
    "R": {"fdi": "83", "name": "Primary Lower Right Canine"},
    "Q": {"fdi": "82", "name": "Primary Lower Right Lateral"},
    "P": {"fdi": "81", "name": "Primary Lower Right Central"},
    "O": {"fdi": "71", "name": "Primary Lower Left Central"},
    "N": {"fdi": "72", "name": "Primary Lower Left Lateral"},
    "M": {"fdi": "73", "name": "Primary Lower Left Canine"},
    "L": {"fdi": "74", "name": "Primary Lower Left 1st Molar"},
    "K": {"fdi": "75", "name": "Primary Lower Left 2nd Molar"},
}

CONDITION_LABELS = {
    'sound': {'name': 'Healthy / Sound', 'badge': 'badge-sound', 'color': '#10b981', 'bg': '#ecfdf5'},
    'caries': {'name': 'Cavity / Caries', 'badge': 'badge-caries', 'color': '#ef4444', 'bg': '#fef2f2'},
    'filled': {'name': 'Restored / Filled', 'badge': 'badge-restored', 'color': '#3b82f6', 'bg': '#eff6ff'},
    'rct': {'name': 'Root Canal (RCT)', 'badge': 'badge-rct', 'color': '#8b5cf6', 'bg': '#f5f3ff'},
    'crown': {'name': 'Crown / Cap Fitted', 'badge': 'badge-crown', 'color': '#d97706', 'bg': '#fffbeb'},
    'missing': {'name': 'Extracted / Missing', 'badge': 'badge-missing', 'color': '#64748b', 'bg': '#f8fafc'},
    'implant': {'name': 'Dental Implant', 'badge': 'badge-implant', 'color': '#06b6d4', 'bg': '#ecfeff'},
    'fractured': {'name': 'Broken / Fractured', 'badge': 'badge-fractured', 'color': '#ea580c', 'bg': '#fff7ed'},
}

def dashboard_patient_view(request):
    if not request.user.is_authenticated and 'patient_phone' not in request.session:
        return redirect('login')

    if request.user.is_authenticated:
        display_name = request.user.first_name or request.user.username
        # Strict matching to ensure ONLY this patient's appointments are shown (single patient name)
        name_filter = Q()
        if request.user.first_name:
            name_filter |= Q(patient_name__icontains=request.user.first_name) | Q(first_name__icontains=request.user.first_name)
        if request.user.last_name:
            name_filter |= Q(last_name__icontains=request.user.last_name) | Q(patient_name__icontains=request.user.last_name)

        contact_filter = Q()
        if request.user.username and request.user.username.isdigit():
            contact_filter |= Q(phone__icontains=request.user.username)
        if request.user.email:
            contact_filter |= Q(email__iexact=request.user.email)

        if name_filter and contact_filter:
            appointments = Appointment.objects.filter(contact_filter & name_filter).order_by('-created_at')
            if not appointments.exists():
                appointments = Appointment.objects.filter(name_filter).order_by('-created_at')
        elif name_filter:
            appointments = Appointment.objects.filter(name_filter).order_by('-created_at')
        elif contact_filter:
            appointments = Appointment.objects.filter(contact_filter).order_by('-created_at')
        else:
            appointments = Appointment.objects.none()
    elif 'patient_phone' in request.session:
        phone = request.session['patient_phone']
        display_name = request.session.get('patient_name') or "Patient"
        if display_name and display_name != 'Patient':
            first_n = display_name.split()[0]
            appointments = Appointment.objects.filter(
                Q(phone__icontains=phone) & (Q(patient_name__icontains=first_n) | Q(first_name__icontains=first_n))
            ).order_by('-created_at')
            if not appointments.exists():
                appointments = Appointment.objects.filter(
                    Q(patient_name__icontains=first_n) | Q(first_name__icontains=first_n)
                ).order_by('-created_at')
        else:
            appointments = Appointment.objects.filter(phone__icontains=phone).order_by('-created_at')
    else:
        appointments = Appointment.objects.none()
        display_name = "Patient"

    latest_appointment = appointments.first() if appointments.exists() else None

    # Calculate patient balance and invoice records
    first_token = display_name.split()[0] if display_name and display_name != 'Patient' else ''
    inv_filter = Q()
    if display_name and display_name != 'Patient':
        inv_filter |= Q(patient_name__iexact=display_name)
    if first_token:
        inv_filter |= Q(patient_name__icontains=first_token)
    if request.user.is_authenticated and request.user.first_name:
        inv_filter |= Q(patient_name__icontains=request.user.first_name)

    patient_invoices = Invoice.objects.filter(inv_filter).order_by('-created_at') if inv_filter else Invoice.objects.none()

    # Parse teeth chart conditions saved for this patient across appointments
    all_chart_items = []
    unbilled_chart_total = 0.0

    for a in appointments:
        a.chart_items = []
        a.unbilled_chart_amount = 0.0
        raw_chart = a.chart_data or "{}"
        try:
            chart_dict = json.loads(raw_chart) if isinstance(raw_chart, str) else raw_chart
        except Exception:
            chart_dict = {}

        if isinstance(chart_dict, dict):
            for tooth_id, tdata in chart_dict.items():
                if not isinstance(tdata, dict):
                    continue
                cond = tdata.get('condition', 'sound')
                proc = (tdata.get('procedure') or '').strip()
                try:
                    price = float(tdata.get('price') or 0.0)
                except (ValueError, TypeError):
                    price = 0.0
                notes = (tdata.get('notes') or '').strip()
                surfaces = tdata.get('surfaces') or []
                doctor = tdata.get('doctor') or a.doctor_name or 'Dr. Anoop'
                purpose = tdata.get('purpose') or ''

                # Only include diagnosed/treated teeth (not default sound without fee or notes)
                if cond != 'sound' or price > 0 or proc or notes:
                    tooth_meta = ADULT_TEETH_INFO.get(str(tooth_id)) or PEDIATRIC_TEETH_INFO.get(str(tooth_id)) or {
                        "fdi": str(tooth_id),
                        "name": f"Tooth #{tooth_id}"
                    }
                    cond_info = CONDITION_LABELS.get(cond, {
                        'name': cond.title(),
                        'badge': 'badge-pending',
                        'color': '#0284c7',
                        'bg': '#e0f2fe'
                    })

                    # Check if this procedure has a matching invoice already
                    is_invoiced = False
                    inv_match = None
                    for inv in patient_invoices:
                        inv_trt = (inv.treatment or '').lower()
                        if f"tooth #{str(tooth_id).lower()}" in inv_trt or f"tooth {str(tooth_id).lower()}" in inv_trt or (proc and proc.lower() in inv_trt and abs(float(inv.amount) - price) < 1):
                            is_invoiced = True
                            inv_match = inv
                            break

                    item_dict = {
                        'tooth_id': str(tooth_id),
                        'fdi': tooth_meta['fdi'],
                        'name': tooth_meta['name'],
                        'condition': cond,
                        'condition_label': cond_info['name'],
                        'badge_color': cond_info['color'],
                        'badge_bg': cond_info['bg'],
                        'procedure': proc or f"{tooth_meta['name']} Procedure",
                        'price': price,
                        'notes': notes,
                        'surfaces': surfaces,
                        'surfaces_str': ", ".join(surfaces) if surfaces else "-",
                        'doctor': doctor,
                        'purpose': purpose,
                        'appointment_id': a.id,
                        'appointment_code': a.formatted_id,
                        'appointment_date': a.preferred_date,
                        'is_invoiced': is_invoiced,
                        'invoice': inv_match,
                    }
                    a.chart_items.append(item_dict)
                    all_chart_items.append(item_dict)

                    if not is_invoiced and price > 0:
                        a.unbilled_chart_amount += price
                        unbilled_chart_total += price

    # Annotate each invoice with debit, credit, and balance
    for inv in patient_invoices:
        inv_amt = float(inv.amount or 0.0)
        inv.debit = inv_amt
        if inv.payment_status == 'Paid':
            inv.credit = inv_amt
            inv.balance = 0.0
        elif inv.payment_status == 'Partial':
            inv.credit = inv_amt / 2.0
            inv.balance = inv_amt / 2.0
        else:
            inv.credit = 0.0
            inv.balance = inv_amt

    # 1. Total billed (Debit) includes both recorded invoices and unbilled tooth condition procedures
    invoice_billed = sum(float(inv.amount) for inv in patient_invoices)
    total_billed = invoice_billed + unbilled_chart_total

    # 2. Total paid (Credit) from invoices
    total_paid = sum(
        float(inv.amount) if inv.payment_status == 'Paid' else (float(inv.amount) / 2 if inv.payment_status == 'Partial' else 0)
        for inv in patient_invoices
    )

    # 3. Balance due is Total Debit minus Total Credit
    balance_due = max(0, float(total_billed) - float(total_paid))

    # 4. Build unified billing ledger entries connecting official invoices and unbilled teeth chart procedures
    ledger_entries = []

    # First add recorded official invoices
    for inv in patient_invoices:
        ledger_entries.append({
            'is_chart': False,
            'id': inv.invoice_id,
            'title': inv.treatment,
            'subtitle': f"Official Invoice &bull; {inv.treatment}",
            'date': inv.created_at,
            'mode': inv.payment_mode or 'Cash / UPI',
            'debit': inv.debit,
            'credit': inv.credit,
            'balance': inv.balance,
            'status': inv.payment_status,
            'badge_type': 'cleared' if inv.payment_status == 'Paid' else ('partial' if inv.payment_status == 'Partial' else 'pending'),
        })

    # Connect unbilled tooth chart procedures from Clinical Teeth Chart (not paid, credit = 0.0)
    for item in all_chart_items:
        if not item.get('is_invoiced') and float(item.get('price', 0)) > 0:
            price_val = float(item.get('price', 0))
            ledger_entries.append({
                'is_chart': True,
                'id': f"TOOTH #{item['tooth_id']}",
                'title': item['procedure'],
                'subtitle': f"Teeth Chart: Tooth #{item['tooth_id']} (FDI {item['fdi']}) &bull; {item['condition_label']} &bull; {item['doctor']}",
                'date': item.get('appointment_date') or datetime.date.today(),
                'mode': 'Pending (Not Paid)',
                'debit': price_val,
                'credit': 0.0,  # Paid is Rs. 0
                'balance': price_val,
                'status': 'Not Paid',
                'badge_type': 'pending',
                'tooth_id': item['tooth_id'],
            })

    # Calculate balance per appointment (including that appointment's tooth condition fees)
    for a in appointments:
        matching_invs = [
            inv for inv in patient_invoices 
            if (inv.treatment and a.service_name and (inv.treatment.lower() in a.service_name.lower() or a.service_name.lower() in inv.treatment.lower()))
        ]
        a_billed = sum(float(inv.amount) for inv in matching_invs) + getattr(a, 'unbilled_chart_amount', 0.0)
        a_paid = sum(float(inv.amount) if inv.payment_status == 'Paid' else (float(inv.amount) / 2 if inv.payment_status == 'Partial' else 0) for inv in matching_invs)
        a.appt_debit = a_billed
        a.appt_credit = a_paid
        a.appt_balance = max(0, float(a_billed) - float(a_paid))

    # Calculate time-of-day greeting (Good Morning, Good Afternoon, Good Evening, Good Night)
    now = datetime.datetime.now()
    current_hour = now.hour
    if 5 <= current_hour < 12:
        greeting = "Good Morning"
        greeting_period = "morning"
        greeting_icon = "fas fa-sun"
        greeting_subtext = "Start your day with a confident, healthy smile! Check your upcoming visits and records below."
    elif 12 <= current_hour < 17:
        greeting = "Good Afternoon"
        greeting_period = "afternoon"
        greeting_icon = "fas fa-sun"
        greeting_subtext = "Hope your day is treating you well! Stay hydrated and keep your dental hygiene on track."
    elif 17 <= current_hour < 21:
        greeting = "Good Evening"
        greeting_period = "evening"
        greeting_icon = "fas fa-cloud-moon"
        greeting_subtext = "Winding down your day? Easily manage your family's oral wellness and consultation history."
    else:
        greeting = "Good Night"
        greeting_period = "night"
        greeting_icon = "fas fa-moon"
        greeting_subtext = "Wishing you a peaceful night! Don't forget your nightly 2-minute brushing routine."

    # Patient's own testimonial: only show reviews submitted by this patient (removes the 6 generic boxes)
    my_testi_ids = request.session.get('my_testimonial_ids', [])
    patient_query = Q(id__in=my_testi_ids)
    if display_name and display_name != 'Patient':
        patient_query |= Q(patient_name__iexact=display_name)
    if request.user.is_authenticated:
        if request.user.first_name:
            patient_query |= Q(patient_name__icontains=request.user.first_name)
        if request.user.username:
            patient_query |= Q(patient_name__icontains=request.user.username)
    if 'patient_name' in request.session and request.session['patient_name']:
        patient_query |= Q(patient_name__iexact=request.session['patient_name'])

    testimonials = Testimonial.objects.filter(patient_query).order_by('-id')
    services = Service.objects.all().order_by('title')

    context = {
        'appointments': appointments,
        'latest_appointment': latest_appointment,
        'testimonials': testimonials,
        'services': services,
        'user': request.user,
        'patient_name': display_name,
        'today': datetime.date.today().strftime('%Y-%m-%d'),
        'greeting': greeting,
        'greeting_period': greeting_period,
        'greeting_icon': greeting_icon,
        'greeting_subtext': greeting_subtext,
        'balance_due': balance_due,
        'total_billed': total_billed,
        'total_paid': total_paid,
        'patient_invoices': patient_invoices,
        'ledger_entries': ledger_entries,
        'all_chart_items': all_chart_items,
        'chart_items_count': len(all_chart_items),
        'unbilled_chart_total': unbilled_chart_total,
    }
    return render(request, 'Dental/dashboardpatient.html', context)


def upload_testimonial_view(request):
    if request.method == 'POST':
        patient_name = request.POST.get('patient_name', '').strip()
        if not patient_name and request.user.is_authenticated:
            patient_name = request.user.first_name or request.user.username
        if not patient_name and 'patient_name' in request.session:
            patient_name = request.session['patient_name']
        if not patient_name:
            patient_name = 'Satisfied Patient'

        try:
            rating = int(request.POST.get('rating', 5))
            if rating < 1 or rating > 5:
                rating = 5
        except (ValueError, TypeError):
            rating = 5

        treatment = request.POST.get('treatment', '').strip() or 'General Dental Care'
        review_text = request.POST.get('review_text', '').strip()

        if review_text:
            testimonial = Testimonial(
                patient_name=patient_name,
                rating=rating,
                treatment=treatment,
                review_text=review_text
            )
            testimonial.save()

            # Store in session so this patient always sees their uploaded testimonial
            my_ids = request.session.get('my_testimonial_ids', [])
            if testimonial.id not in my_ids:
                my_ids.append(testimonial.id)
                request.session['my_testimonial_ids'] = my_ids
                request.session.modified = True

            messages.success(request, "Thank you! Your testimonial has been uploaded and published to 'What Our Patients Say' on the clinic homepage!")
        else:
            messages.error(request, "Please enter your review text before submitting.")

        return redirect('dashboard_patient')

    return redirect('dashboard_patient')


def delete_testimonial_view(request, testimonial_id):
    testimonial = get_object_or_404(Testimonial, id=testimonial_id)
    my_ids = request.session.get('my_testimonial_ids', [])
    if testimonial.id in my_ids:
        my_ids.remove(testimonial.id)
        request.session['my_testimonial_ids'] = my_ids
        request.session.modified = True
    testimonial.delete()
    messages.success(request, "Your review has been successfully deleted.")
    return redirect('dashboard_patient')


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

    # Helper to check if an appointment has a valid non-empty teeth chart
    def parse_teeth_chart(chart_str):
        if not chart_str or chart_str.strip() in ("", "{}", "null", "None"):
            return {}
        try:
            data = json.loads(chart_str)
            return data if isinstance(data, dict) else {}
        except Exception:
            return {}

    # Annotate each appointment with teeth chart status
    for a in appointments:
        c_data = parse_teeth_chart(a.chart_data)
        a.has_chart = bool(c_data and len(c_data) > 0)
        a.chart_teeth_count = len(c_data) if a.has_chart else 0
        a.chart_conditions_list = [
            CONDITION_LABELS.get(v.get('condition', ''), {}).get('name', v.get('condition_label', v.get('condition', 'Diagnosed')))
            for v in c_data.values() if isinstance(v, dict)
        ] if a.has_chart else []

    # Build patient records for the Patient Tab:
    # ONLY patients who have a Teeth Chart connected appear in the Patient Tab
    patient_records_map = {}
    for a in appointments:
        p_name = (a.first_name and f"{a.first_name} {a.last_name or ''}".strip()) or (a.patient_name or '').strip()
        if not p_name:
            continue
        p_key = f"{p_name.lower()}_{a.phone.strip() if a.phone else ''}"

        if a.has_chart:
            if p_key not in patient_records_map:
                patient_records_map[p_key] = {
                    'name': p_name,
                    'phone': a.phone,
                    'age': a.age,
                    'gender': a.gender,
                    'doctor_name': a.doctor_name,
                    'service_name': a.service_name,
                    'preferred_date': a.preferred_date,
                    'created_at': a.created_at,
                    'latest_appointment': a,
                    'appointment_id': a.id,
                    'formatted_id': a.formatted_id,
                    'has_chart': True,
                    'teeth_count': a.chart_teeth_count,
                    'chart_conditions': a.chart_conditions_list[:3],
                    'chart_conditions_count': len(a.chart_conditions_list),
                    'total_appointments': 1,
                }
            else:
                p_rec = patient_records_map[p_key]
                p_rec['total_appointments'] += 1
                if a.chart_teeth_count > p_rec['teeth_count']:
                    p_rec['teeth_count'] = a.chart_teeth_count
                    p_rec['chart_conditions'] = a.chart_conditions_list[:3]
                    p_rec['chart_conditions_count'] = len(a.chart_conditions_list)
                    p_rec['latest_appointment'] = a
                    p_rec['appointment_id'] = a.id
                    p_rec['formatted_id'] = a.formatted_id

    patient_records = list(patient_records_map.values())
    doctors = Doctor.objects.all().order_by('-is_chief')
    invoices = Invoice.objects.all().order_by('-created_at')
    services = Service.objects.all().order_by('-id')

    about_clinic = AboutClinic.objects.first()
    if not about_clinic:
        about_clinic = AboutClinic.objects.create(
            title="Your Trusted Partner For Total Oral Health",
            subtitle="About Our Clinic",
            description="Anupam Dental Clinic, led by Dr. Anoop, has been caring for patients since 19th August 1996. For nearly three decades, we have remained committed to ethical dentistry, clear communication, and compassionate care.",
            established_date="19th August 1996",
            experience_years="28+"
        )

    # Ensure default labs exist
    if DentalLab.objects.count() == 0:
        default_labs = [
            ('Apex Dental Ceramics', 'Mumbai'),
            ('DentCraft Dental Lab', 'Delhi'),
            ('Prime 3D CAD/CAM Lab', 'Bengaluru'),
            ('Dental Art Studio', 'Pune'),
            ('Precision Denture Works', 'Hyderabad'),
            ('DentCare Global Lab', 'Kochi'),
        ]
        for l_name, l_city in default_labs:
            DentalLab.objects.create(name=l_name, city=l_city)

    dental_labs = DentalLab.objects.prefetch_related('payments').all().order_by('name')
    db_lab_ledgers = {}
    for lab in dental_labs:
        db_lab_ledgers[lab.name] = [
            {
                'id': p.id,
                'date': p.issue_date.strftime('%d-%m-%Y'),
                'pid': p.patient_id,
                'patient': p.patient_name,
                'particular': p.particular,
                'dr': float(p.dr_amount),
                'cr': float(p.cr_amount),
            }
            for p in lab.payments.all().order_by('id')
        ]
    db_lab_ledgers_json = json.dumps(db_lab_ledgers)

    context = {
        'total_jobs': total_jobs,
        'in_progress_count': in_progress_count,
        'completed_count': completed_count,
        'overdue_count': overdue_count,
        'total_revenue': total_revenue,
        'cases': cases,
        'appointments': appointments,
        'patient_records': patient_records,
        'doctors': doctors,
        'services': services,
        'invoices': invoices,
        'about_clinic': about_clinic,
        'gallery_photos': GalleryPhoto.objects.all(),
        'dental_labs': dental_labs,
        'medicines': MedicineInventory.objects.all().order_by('-id'),
        'db_medicines_json': json.dumps([
            {
                'id': m.id,
                'category': m.category,
                'item_type': m.item_type,
                'product_name': m.product_name,
                'brand_name': m.brand_name,
                'strength': m.strength,
                'dosage': m.dosage,
                'rate': float(m.rate),
                'frequency': m.frequency,
                'duration': m.duration,
                'ingredients': m.ingredients,
                'contra_indications': m.contra_indications,
            }
            for m in MedicineInventory.objects.all().order_by('-id')
        ]),
        'db_lab_ledgers_json': db_lab_ledgers_json,
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
        identifier = request.POST.get('username', '').strip() or request.POST.get('phone', '').strip() or request.POST.get('email', '').strip()
        password = request.POST.get('password', '').strip()

        if not identifier or not password:
            err = 'Please enter Mobile Number / Email and Password.'
            if request.headers.get('x-requested-with') == 'XMLHttpRequest':
                return JsonResponse({'status': 'error', 'message': err}, status=400)
            messages.error(request, err)
            return redirect('login')

        # 1. Direct authentication with identifier as username
        user = authenticate(request, username=identifier, password=password)

        # 2. If direct fails, lookup User by email or phone/username
        if user is None:
            user_obj = User.objects.filter(
                Q(username__iexact=identifier) | 
                Q(email__iexact=identifier) | 
                Q(username__icontains=identifier)
            ).first()
            if user_obj:
                user = authenticate(request, username=user_obj.username, password=password)

        if user is not None:
            login(request, user)
            request.session['patient_phone'] = user.username
            request.session['patient_name'] = user.first_name or user.username
            target_url = '/dashboard/' if user.is_staff else '/dashboardpatient/'
            msg = f"Welcome back, {user.first_name or user.username}!"
            if request.headers.get('x-requested-with') == 'XMLHttpRequest':
                return JsonResponse({'status': 'success', 'message': msg, 'redirect_url': target_url})
            messages.success(request, msg)
            return redirect('dashboard' if user.is_staff else 'dashboard_patient')

        # 3. Check if patient has appointments with this mobile or email
        patient_appointments = Appointment.objects.filter(phone__icontains=identifier) | Appointment.objects.filter(email__iexact=identifier)
        if patient_appointments.exists():
            latest = patient_appointments.order_by('-created_at').first()
            request.session['patient_phone'] = latest.phone
            request.session['patient_name'] = latest.patient_name
            
            # If User doesn't exist yet for this phone, create it with this password
            user_by_phone = User.objects.filter(username__iexact=latest.phone).first()
            if not user_by_phone:
                try:
                    f_name = latest.first_name or (latest.patient_name.split()[0] if latest.patient_name else 'Patient')
                    l_name = latest.last_name or (' '.join(latest.patient_name.split()[1:]) if latest.patient_name and len(latest.patient_name.split()) > 1 else '')
                    new_user = User.objects.create_user(
                        username=latest.phone,
                        email=latest.email or '',
                        password=password,
                        first_name=f_name,
                        last_name=l_name
                    )
                    new_user.is_staff = False
                    new_user.save()
                    login(request, new_user, backend='django.contrib.auth.backends.ModelBackend')
                except Exception:
                    pass

            msg = f"Welcome, {latest.patient_name}! Connected to your dental dashboard."
            if request.headers.get('x-requested-with') == 'XMLHttpRequest':
                return JsonResponse({'status': 'success', 'message': msg, 'redirect_url': '/dashboardpatient/'})
            messages.success(request, msg)
            return redirect('dashboard_patient')

        err = 'Invalid Mobile Number / Email or Password. Click "Forgot / Replace Password" to reset.'
        if request.headers.get('x-requested-with') == 'XMLHttpRequest':
            return JsonResponse({'status': 'error', 'message': err}, status=400)
        messages.error(request, err)
        return redirect('login')

    return redirect('login')


def register_view(request):
    if request.method == 'POST':
        full_name = request.POST.get('full_name', '').strip()
        phone = request.POST.get('phone', '').strip() or request.POST.get('username', '').strip()
        email = request.POST.get('email', '').strip()
        password = request.POST.get('password', '').strip()

        if not phone and email:
            phone = email
        if not phone:
            phone = request.POST.get('identifier', '').strip()

        if not phone or not password:
            err = 'Mobile Number and Password are required.'
            if request.headers.get('x-requested-with') == 'XMLHttpRequest':
                return JsonResponse({'status': 'error', 'message': err}, status=400)
            messages.error(request, err)
            return redirect('home')

        # Check if already registered
        if User.objects.filter(Q(username__iexact=phone) | (Q(email__iexact=email) if email else Q(pk__isnull=True))).exists():
            err = f'An account with "{phone}" is already registered. Please login or use "Replace Password".'
            if request.headers.get('x-requested-with') == 'XMLHttpRequest':
                return JsonResponse({'status': 'error', 'message': err}, status=400)
            messages.error(request, err)
            return redirect('home')

        try:
            first_name = full_name.split()[0] if full_name else 'Patient'
            last_name = " ".join(full_name.split()[1:]) if full_name and len(full_name.split()) > 1 else ""
            user = User.objects.create_user(
                username=phone,
                email=email,
                password=password,
                first_name=first_name,
                last_name=last_name
            )
            user.is_staff = False
            user.save()

            login(request, user, backend='django.contrib.auth.backends.ModelBackend')
            request.session['patient_phone'] = phone
            request.session['patient_name'] = full_name or user.first_name
            msg = f"Account registered successfully! Welcome, {user.first_name}."
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


def replace_password_view(request):
    if request.method == 'POST':
        identifier = request.POST.get('identifier', '').strip() or request.POST.get('phone', '').strip() or request.POST.get('email', '').strip()
        new_password = request.POST.get('new_password', '').strip()
        confirm_password = request.POST.get('confirm_password', '').strip()

        if not identifier:
            err = 'Please enter your registered Mobile Number or Email.'
            if request.headers.get('x-requested-with') == 'XMLHttpRequest':
                return JsonResponse({'status': 'error', 'message': err}, status=400)
            messages.error(request, err)
            return redirect('login')

        if not new_password or not confirm_password:
            err = 'Please enter and confirm your new password.'
            if request.headers.get('x-requested-with') == 'XMLHttpRequest':
                return JsonResponse({'status': 'error', 'message': err}, status=400)
            messages.error(request, err)
            return redirect('login')

        if new_password != confirm_password:
            err = 'New password and Confirm password do not match.'
            if request.headers.get('x-requested-with') == 'XMLHttpRequest':
                return JsonResponse({'status': 'error', 'message': err}, status=400)
            messages.error(request, err)
            return redirect('login')

        if len(new_password) < 4:
            err = 'Password must be at least 4 characters long.'
            if request.headers.get('x-requested-with') == 'XMLHttpRequest':
                return JsonResponse({'status': 'error', 'message': err}, status=400)
            messages.error(request, err)
            return redirect('login')

        # 1. Search existing User
        user = User.objects.filter(
            Q(username__iexact=identifier) | 
            Q(email__iexact=identifier) | 
            Q(username__icontains=identifier)
        ).first()

        if user:
            user.set_password(new_password)
            user.save()
            login(request, user, backend='django.contrib.auth.backends.ModelBackend')
            request.session['patient_phone'] = user.username
            request.session['patient_name'] = user.first_name or user.username
            target_url = '/dashboard/' if user.is_staff else '/dashboardpatient/'
            msg = f"Password successfully replaced! Welcome back, {user.first_name or user.username}."
            if request.headers.get('x-requested-with') == 'XMLHttpRequest':
                return JsonResponse({'status': 'success', 'message': msg, 'redirect_url': target_url})
            messages.success(request, msg)
            return redirect('dashboard' if user.is_staff else 'dashboard_patient')

        # 2. If no User found, check if Appointment exists for this mobile/email
        appt = Appointment.objects.filter(
            Q(phone__icontains=identifier) | 
            Q(email__iexact=identifier)
        ).order_by('-created_at').first()

        if appt:
            f_name = appt.first_name or (appt.patient_name.split()[0] if appt.patient_name else 'Patient')
            l_name = appt.last_name or (' '.join(appt.patient_name.split()[1:]) if appt.patient_name and len(appt.patient_name.split()) > 1 else '')
            new_user = User.objects.create_user(
                username=appt.phone,
                email=appt.email or '',
                password=new_password,
                first_name=f_name,
                last_name=l_name
            )
            new_user.is_staff = False
            new_user.save()
            login(request, new_user, backend='django.contrib.auth.backends.ModelBackend')
            request.session['patient_phone'] = appt.phone
            request.session['patient_name'] = appt.patient_name
            msg = f"Password set and account activated for {appt.patient_name}! Opening your dashboard..."
            if request.headers.get('x-requested-with') == 'XMLHttpRequest':
                return JsonResponse({'status': 'success', 'message': msg, 'redirect_url': '/dashboardpatient/'})
            messages.success(request, msg)
            return redirect('dashboard_patient')

        err = f'No existing account or appointment found for "{identifier}". Please register or book an appointment first.'
        if request.headers.get('x-requested-with') == 'XMLHttpRequest':
            return JsonResponse({'status': 'error', 'message': err}, status=404)
        messages.error(request, err)
        return redirect('login')

    return redirect('login')

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
        open_teeth_chart = request.POST.get('open_teeth_chart', '0') == '1'

        try:
            appt = Appointment.objects.create(
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
            messages.success(request, f"Appointment for {patient_name} saved successfully!")
            if open_teeth_chart:
                from urllib.parse import quote
                return redirect(f"/dashboard/?open_chart_id={appt.id}&open_chart_name={quote(patient_name or 'Patient')}#appointments")
        except Exception as e:
            messages.error(request, f"Error saving appointment: {str(e)}")

    return redirect('/dashboard/#appointments')


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


def add_service_view(request):
    if request.method == 'POST':
        title = request.POST.get('title', '').strip()
        category = request.POST.get('category', 'general').strip()
        icon_name = request.POST.get('icon_name', 'tooth').strip()
        short_description = request.POST.get('short_description', '').strip()
        detailed_description = request.POST.get('detailed_description', '').strip()
        duration = request.POST.get('duration', '30-45 Mins').strip()
        price_estimate = request.POST.get('price_estimate', 'Affordable Care').strip()
        badge_tag = request.POST.get('badge_tag', 'Popular').strip()
        is_featured = request.POST.get('is_featured') in ['on', 'true', '1', True]
        image = request.FILES.get('image')

        if not title:
            messages.error(request, "Service title is required.")
            return redirect('dashboard')

        try:
            service = Service.objects.create(
                title=title,
                category=category,
                icon_name=icon_name or 'tooth',
                short_description=short_description or f"Quality {title} procedures at Anupam Dental Clinic.",
                detailed_description=detailed_description or short_description,
                duration=duration or '30-45 Mins',
                price_estimate=price_estimate or 'Affordable Care',
                badge_tag=badge_tag or 'Featured',
                is_featured=is_featured,
                image=image
            )
            messages.success(request, f"Service '{service.title}' uploaded and added to the services-grid successfully!")
        except Exception as e:
            messages.error(request, f"Error uploading service: {str(e)}")

    return redirect('dashboard')


def edit_service_view(request, service_id):
    service = get_object_or_404(Service, id=service_id)
    if request.method == 'POST':
        title = request.POST.get('title', '').strip()
        category = request.POST.get('category', '').strip()
        icon_name = request.POST.get('icon_name', '').strip()
        short_description = request.POST.get('short_description', '').strip()
        detailed_description = request.POST.get('detailed_description', '').strip()
        duration = request.POST.get('duration', '').strip()
        price_estimate = request.POST.get('price_estimate', '').strip()
        badge_tag = request.POST.get('badge_tag', '').strip()
        is_featured = request.POST.get('is_featured') in ['on', 'true', '1', True]

        if title:
            service.title = title
        if category:
            service.category = category
        if icon_name:
            service.icon_name = icon_name
        if short_description:
            service.short_description = short_description
        if detailed_description is not None:
            service.detailed_description = detailed_description
        if duration:
            service.duration = duration
        if price_estimate:
            service.price_estimate = price_estimate
        service.badge_tag = badge_tag
        service.is_featured = is_featured

        if 'image' in request.FILES and request.FILES['image']:
            service.image = request.FILES['image']

        try:
            service.save()
            messages.success(request, f"Service '{service.title}' updated successfully!")
        except Exception as e:
            messages.error(request, f"Error updating service: {str(e)}")

    return redirect('dashboard')


def delete_service_view(request, service_id):
    if request.method == 'POST':
        service = get_object_or_404(Service, id=service_id)
        name = service.title
        service.delete()
        messages.info(request, f"Service '{name}' has been deleted from services-grid.")
    return redirect('dashboard')


def edit_about_view(request):
    if request.method == 'POST':
        about = AboutClinic.objects.first()
        if not about:
            about = AboutClinic.objects.create()

        title = request.POST.get('title', '').strip()
        subtitle = request.POST.get('subtitle', '').strip()
        description = request.POST.get('description', '').strip()
        established_date = request.POST.get('established_date', '').strip()
        experience_years = request.POST.get('experience_years', '').strip()
        operating_hours = request.POST.get('operating_hours', '').strip()
        helpline = request.POST.get('helpline', '').strip()
        email = request.POST.get('email', '').strip()
        facility_location = request.POST.get('facility_location', '').strip()
        sterilization_safety = request.POST.get('sterilization_safety', '').strip()

        if title:
            about.title = title
        if subtitle:
            about.subtitle = subtitle
        if description:
            about.description = description
        if established_date:
            about.established_date = established_date
        if experience_years:
            about.experience_years = experience_years
        if operating_hours:
            about.operating_hours = operating_hours
        if helpline:
            about.helpline = helpline
        if email:
            about.email = email
        if facility_location:
            about.facility_location = facility_location
        if sterilization_safety:
            about.sterilization_safety = sterilization_safety

        if 'photo' in request.FILES and request.FILES['photo']:
            about.photo = request.FILES['photo']

        try:
            about.save()
            messages.success(request, "About Our Clinic details, hours, contact & safety updated successfully!")
        except Exception as e:
            messages.error(request, f"Error updating About section: {str(e)}")

    return redirect('dashboard')


def upload_gallery_photo_view(request):
    if not (request.user.is_authenticated and request.user.is_staff):
        messages.error(request, "Staff authorization required to upload gallery photos.")
        return redirect('dashboard')

    if request.method == 'POST':
        photo_file = request.FILES.get('photo')
        title = request.POST.get('title', '').strip() or "Clinic Photo"
        category = request.POST.get('category', 'clinic').strip() or "clinic"
        caption = request.POST.get('caption', '').strip()

        if not photo_file:
            messages.error(request, "Please select an image file to upload for the gallery.")
            return redirect('dashboard')

        try:
            item = GalleryPhoto.objects.create(
                title=title,
                caption=caption,
                image=photo_file,
                category=category
            )
            messages.success(request, "Gallery photo uploaded and saved successfully! It is now live in the website gallery.")
        except Exception as e:
            messages.error(request, f"Failed to upload gallery photo: {str(e)}")

    return redirect('dashboard')


def delete_gallery_photo_view(request, photo_id):
    if not (request.user.is_authenticated and request.user.is_staff):
        messages.error(request, "Staff authorization required.")
        return redirect('dashboard')

    photo = get_object_or_404(GalleryPhoto, id=photo_id)
    title = photo.title
    try:
        if photo.image and hasattr(photo.image, 'path'):
            import os
            if os.path.isfile(photo.image.path):
                os.remove(photo.image.path)
    except Exception:
        pass
    photo.delete()
    messages.info(request, f"Gallery photo '{title}' removed successfully.")
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
            inv = Invoice.objects.create(
                invoice_id=invoice_id,
                patient_name=patient_name or 'Patient',
                treatment=treatment,
                amount=float(amount),
                payment_status=payment_status,
                payment_mode=payment_mode
            )
            success_msg = f"Invoice {invoice_id} for ₹{amount} recorded successfully!"
            if request.headers.get('x-requested-with') == 'XMLHttpRequest' or request.POST.get('is_ajax') == '1':
                return JsonResponse({
                    'status': 'success',
                    'message': success_msg,
                    'invoice': {
                        'id': inv.id,
                        'invoice_id': inv.invoice_id,
                        'patient_name': inv.patient_name,
                        'treatment': inv.treatment,
                        'amount': float(inv.amount),
                        'payment_status': inv.payment_status,
                        'payment_mode': inv.payment_mode,
                        'created_at': inv.created_at.strftime('%b %d, %Y')
                    }
                })
            messages.success(request, success_msg)
        except Exception as e:
            err_msg = f"Error creating invoice: {str(e)}"
            if request.headers.get('x-requested-with') == 'XMLHttpRequest' or request.POST.get('is_ajax') == '1':
                return JsonResponse({'status': 'error', 'message': err_msg}, status=500)
            messages.error(request, err_msg)

    return redirect('dashboard')


def save_patient_chart_view(request, appointment_id):
    if request.method == 'POST':
        chart_data = request.POST.get('chart_data', '')
        patient_name = request.POST.get('patient_name', '').strip()
        if not chart_data:
            import json
            try:
                payload = json.loads(request.body.decode('utf-8'))
                chart_data = payload.get('chart_data', '')
                patient_name = patient_name or payload.get('patient_name', '').strip()
            except Exception:
                pass
        
        appointment = None
        if appointment_id and appointment_id > 0:
            appointment = Appointment.objects.filter(id=appointment_id).first()
        
        if not appointment and patient_name:
            first_n = patient_name.split()[0]
            appointment = Appointment.objects.filter(
                Q(patient_name__iexact=patient_name) | Q(first_name__icontains=first_n)
            ).order_by('-created_at').first()

        if not appointment and appointment_id > 0:
            appointment = get_object_or_404(Appointment, id=appointment_id)

        if appointment:
            appointment.chart_data = chart_data or "{}"
            appointment.save()
            return JsonResponse({
                'status': 'success',
                'message': f"Teeth chart for {appointment.patient_name or 'Patient'} saved successfully!",
                'chart_data': appointment.chart_data,
                'appointment_id': appointment.id
            })
        return JsonResponse({'status': 'error', 'message': 'Appointment or patient record not found.'}, status=404)
    return JsonResponse({'status': 'error', 'message': 'Invalid HTTP method.'}, status=400)


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
    date_val = request.GET.get('date', '').strip()
    name = request.GET.get('name', '').strip()
    age = request.GET.get('age', '').strip()
    gender = request.GET.get('gender', '').strip()
    address = request.GET.get('address', '').strip()
    prefill_all = request.GET.get('prefill_all', '0') == '1'
    source = request.GET.get('source', request.GET.get('from', '')).strip().lower()
    single_card = request.GET.get('single_card', '1') == '1'
    if source in ['appointment', 'patient']:
        single_card = True

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
        'source': source,
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
    appointment_id = request.GET.get('appointment_id', '').strip()
    patient_name = request.GET.get('name', '').strip()
    date_val = request.GET.get('date', datetime.date.today().strftime('%d/%m/%Y')).strip()
    doctor = request.GET.get('doctor', 'Dr. Anoop').strip()
    age = request.GET.get('age', '').strip()
    gender = request.GET.get('gender', '').strip()
    pid = request.GET.get('pid', '').strip()

    medicines = []
    if appointment_id and appointment_id.isdigit():
        try:
            appt = Appointment.objects.get(id=int(appointment_id))
            if not patient_name:
                patient_name = (appt.first_name and f"{appt.first_name} {appt.last_name or ''}".strip()) or appt.patient_name or 'Patient'
            if not age and appt.age:
                age = str(appt.age)
            if not gender and appt.gender:
                gender = appt.gender
            if not doctor and appt.doctor_name:
                doctor = appt.doctor_name
            if not pid:
                pid = appt.formatted_id
            medicines = list(appt.prescribed_medicines.all().order_by('id'))
        except Appointment.DoesNotExist:
            pass

    if not medicines and patient_name:
        medicines = list(PatientMedicine.objects.filter(patient_name__iexact=patient_name).order_by('id'))

    about_clinic = AboutClinic.objects.first()
    context = {
        'appointment_id': appointment_id,
        'name': patient_name,
        'patient_name': patient_name,
        'age': age,
        'gender': gender,
        'doctor': doctor,
        'pid': pid,
        'date': date_val,
        'medicines': medicines,
        'about_clinic': about_clinic,
    }
    return render(request, 'Dental/print_prescription.html', context)






# ==========================================
# DENTAL LAB & LAB PAYMENTS DATABASE VIEWS
# ==========================================
def save_dental_lab_view(request):
    if request.method != 'POST':
        return JsonResponse({'status': 'error', 'message': 'Invalid request method.'}, status=405)
    
    name = request.POST.get('name', '').strip()
    city = request.POST.get('city', '').strip()
    logo_file = request.FILES.get('logo')

    if not name:
        return JsonResponse({'status': 'error', 'message': 'Please provide a valid Lab Name.'}, status=400)

    try:
        lab, created = DentalLab.objects.get_or_create(name=name)
        if city:
            lab.city = city
        if logo_file:
            lab.logo = logo_file
        lab.save()

        logo_url = lab.logo.url if lab.logo else ''
        return JsonResponse({
            'status': 'success',
            'created': created,
            'message': f'Lab "{lab.name}" successfully saved in database!',
            'lab': {
                'id': lab.id,
                'name': lab.name,
                'city': lab.city,
                'logo_url': logo_url
            }
        })
    except Exception as e:
        return JsonResponse({'status': 'error', 'message': str(e)}, status=500)


def save_lab_payment_view(request):
    if request.method != 'POST':
        return JsonResponse({'status': 'error', 'message': 'Invalid request method.'}, status=405)

    lab_name = request.POST.get('lab_name', '').strip()
    date_str = request.POST.get('date', '').strip()
    patient_id = request.POST.get('patient_id', '').strip()
    patient_name = request.POST.get('patient_name', '').strip() or 'Walk-in Patient'
    particular = request.POST.get('particular', '').strip() or 'Dental Lab Order'
    dr_amount = request.POST.get('dr_amount', 0)
    cr_amount = request.POST.get('cr_amount', 0)

    try:
        dr = float(dr_amount) if dr_amount else 0.0
    except ValueError:
        dr = 0.0

    try:
        cr = float(cr_amount) if cr_amount else 0.0
    except ValueError:
        cr = 0.0

    if not lab_name:
        return JsonResponse({'status': 'error', 'message': 'Please specify a Lab Name.'}, status=400)

    # Parse date
    parsed_date = datetime.date.today()
    if date_str:
        for fmt in ('%d-%m-%Y', '%Y-%m-%d', '%d/%m/%Y', '%Y/%m/%d'):
            try:
                parsed_date = datetime.datetime.strptime(date_str, fmt).date()
                break
            except ValueError:
                pass

    try:
        lab, _ = DentalLab.objects.get_or_create(name=lab_name)
        payment = LabPayment.objects.create(
            lab=lab,
            issue_date=parsed_date,
            patient_id=patient_id,
            patient_name=patient_name,
            particular=particular,
            dr_amount=dr,
            cr_amount=cr
        )
        return JsonResponse({
            'status': 'success',
            'message': f'Payment transaction #{payment.id} saved to database!',
            'payment': {
                'id': payment.id,
                'date': payment.issue_date.strftime('%d-%m-%Y'),
                'pid': payment.patient_id,
                'patient': payment.patient_name,
                'particular': payment.particular,
                'dr': float(payment.dr_amount),
                'cr': float(payment.cr_amount),
            }
        })
    except Exception as e:
        return JsonResponse({'status': 'error', 'message': str(e)}, status=500)


def delete_lab_payment_view(request, payment_id):
    if request.method != 'POST':
        return JsonResponse({'status': 'error', 'message': 'Invalid request method.'}, status=405)

    try:
        payment = get_object_or_404(LabPayment, id=payment_id)
        payment.delete()
        return JsonResponse({'status': 'success', 'message': f'Payment record #{payment_id} deleted from database.'})
    except Exception as e:
        return JsonResponse({'status': 'error', 'message': str(e)}, status=500)


def get_lab_payments_view(request, lab_name):
    try:
        lab = DentalLab.objects.filter(name=lab_name).first()
        if not lab:
            return JsonResponse({'status': 'success', 'payments': [], 'lab': {'name': lab_name, 'city': '', 'logo_url': ''}})
        
        payments = [
            {
                'id': p.id,
                'date': p.issue_date.strftime('%d-%m-%Y'),
                'pid': p.patient_id,
                'patient': p.patient_name,
                'particular': p.particular,
                'dr': float(p.dr_amount),
                'cr': float(p.cr_amount),
            }
            for p in lab.payments.all().order_by('id')
        ]
        return JsonResponse({
            'status': 'success',
            'lab': {
                'id': lab.id,
                'name': lab.name,
                'city': lab.city,
                'logo_url': lab.logo.url if lab.logo else ''
            },
            'payments': payments
        })
    except Exception as e:
        return JsonResponse({'status': 'error', 'message': str(e)}, status=500)


def save_medicine_inventory_view(request):
    if request.method != 'POST':
        return JsonResponse({'status': 'error', 'message': 'Invalid request method.'}, status=405)

    try:
        med_id = request.POST.get('med_id')
        category = request.POST.get('category', '').strip()
        item_type = request.POST.get('item_type', '').strip()
        product_name = request.POST.get('product_name', '').strip()
        brand_name = request.POST.get('brand_name', '').strip()
        strength = request.POST.get('strength', '').strip()
        dosage = request.POST.get('dosage', '').strip()
        rate_raw = request.POST.get('rate', '0.0').strip()
        frequency = request.POST.get('frequency', '').strip()
        duration = request.POST.get('duration', '').strip()
        ingredients = request.POST.get('ingredients', '').strip()
        contra_indications = request.POST.get('contra_indications', '').strip()

        try:
            rate = float(rate_raw) if rate_raw else 0.0
        except ValueError:
            rate = 0.0

        if not product_name:
            product_name = 'Product'

        if med_id and str(med_id).isdigit():
            med = get_object_or_404(MedicineInventory, id=int(med_id))
            med.category = category
            med.item_type = item_type
            med.product_name = product_name
            med.brand_name = brand_name
            med.strength = strength
            med.dosage = dosage
            med.rate = rate
            med.frequency = frequency
            med.duration = duration
            med.ingredients = ingredients
            med.contra_indications = contra_indications
            med.save()
            action = 'updated'
        else:
            med = MedicineInventory.objects.create(
                category=category,
                item_type=item_type,
                product_name=product_name,
                brand_name=brand_name,
                strength=strength,
                dosage=dosage,
                rate=rate,
                frequency=frequency,
                duration=duration,
                ingredients=ingredients,
                contra_indications=contra_indications,
            )
            action = 'created'

        return JsonResponse({
            'status': 'success',
            'action': action,
            'message': f'Medicine "{med.product_name}" saved to database.',
            'medicine': {
                'id': med.id,
                'category': med.category,
                'item_type': med.item_type,
                'product_name': med.product_name,
                'brand_name': med.brand_name,
                'strength': med.strength,
                'dosage': med.dosage,
                'rate': float(med.rate),
                'frequency': med.frequency,
                'duration': med.duration,
                'ingredients': med.ingredients,
                'contra_indications': med.contra_indications,
            }
        })
    except Exception as e:
        return JsonResponse({'status': 'error', 'message': str(e)}, status=500)


def delete_medicine_inventory_view(request, item_id):
    if request.method != 'POST':
        return JsonResponse({'status': 'error', 'message': 'Invalid request method.'}, status=405)

    try:
        med = get_object_or_404(MedicineInventory, id=item_id)
        prod_name = med.product_name
        med.delete()
        return JsonResponse({'status': 'success', 'message': f'Medicine "{prod_name}" deleted from database.'})
    except Exception as e:
        return JsonResponse({'status': 'error', 'message': str(e)}, status=500)


def get_medicine_inventory_view(request):
    try:
        items = [
            {
                'id': m.id,
                'category': m.category,
                'item_type': m.item_type,
                'product_name': m.product_name,
                'brand_name': m.brand_name,
                'strength': m.strength,
                'dosage': m.dosage,
                'rate': float(m.rate),
                'frequency': m.frequency,
                'duration': m.duration,
                'ingredients': m.ingredients,
                'contra_indications': m.contra_indications,
            }
            for m in MedicineInventory.objects.all().order_by('-id')
        ]
        return JsonResponse({'status': 'success', 'medicines': items})
    except Exception as e:
        return JsonResponse({'status': 'error', 'message': str(e)}, status=500)


# ==========================================
# PATIENT MEDICINES (CONNECTED WITH MATERIAL BOX 1)
# ==========================================
def save_patient_medicine_view(request):
    if request.method != 'POST':
        return JsonResponse({'status': 'error', 'message': 'Invalid request method.'}, status=405)

    try:
        appointment_id = request.POST.get('appointment_id', '').strip()
        patient_name = request.POST.get('patient_name', '').strip()
        med_inv_id = request.POST.get('medicine_inventory_id', '').strip()
        category = request.POST.get('category', '').strip()
        item_type = request.POST.get('item_type', '').strip()
        product_name = request.POST.get('product_name', '').strip()
        brand_name = request.POST.get('brand_name', '').strip()
        strength = request.POST.get('strength', '').strip()
        dosage = request.POST.get('dosage', '').strip()
        frequency = request.POST.get('frequency', '').strip() or '1-0-1'
        duration = request.POST.get('duration', '').strip() or '5 Days'
        ingredients = request.POST.get('ingredients', '').strip()
        instructions = request.POST.get('instructions', '').strip() or 'After Food'

        if not product_name:
            return JsonResponse({'status': 'error', 'message': 'Medicine name is required.'}, status=400)

        appt = None
        if appointment_id and appointment_id.isdigit():
            appt = Appointment.objects.filter(id=int(appointment_id)).first()
            if appt and not patient_name:
                patient_name = (appt.first_name and f"{appt.first_name} {appt.last_name or ''}".strip()) or appt.patient_name or 'Patient'

        med_inv = None
        if med_inv_id and med_inv_id.isdigit():
            med_inv = MedicineInventory.objects.filter(id=int(med_inv_id)).first()

        pm = PatientMedicine.objects.create(
            appointment=appt,
            patient_name=patient_name or 'Patient',
            medicine_inventory=med_inv,
            category=category,
            item_type=item_type,
            product_name=product_name,
            brand_name=brand_name,
            strength=strength,
            dosage=dosage,
            frequency=frequency,
            duration=duration,
            ingredients=ingredients,
            instructions=instructions
        )

        return JsonResponse({
            'status': 'success',
            'message': f'Prescribed "{pm.product_name}" for {pm.patient_name}.',
            'medicine': {
                'id': pm.id,
                'appointment_id': pm.appointment_id or 0,
                'patient_name': pm.patient_name,
                'medicine_inventory_id': pm.medicine_inventory_id or 0,
                'category': pm.category,
                'item_type': pm.item_type,
                'product_name': pm.product_name,
                'brand_name': pm.brand_name,
                'strength': pm.strength,
                'dosage': pm.dosage,
                'frequency': pm.frequency,
                'duration': pm.duration,
                'ingredients': pm.ingredients,
                'instructions': pm.instructions,
                'created_at': pm.created_at.strftime('%d-%m-%Y %H:%M'),
            }
        })
    except Exception as e:
        return JsonResponse({'status': 'error', 'message': str(e)}, status=500)


def get_patient_medicines_view(request, appointment_id):
    try:
        patient_name = request.GET.get('patient_name', '').strip()
        qs = PatientMedicine.objects.all()
        if appointment_id and int(appointment_id) > 0:
            qs = qs.filter(appointment_id=int(appointment_id))
        elif patient_name:
            qs = qs.filter(patient_name__iexact=patient_name)
        else:
            qs = qs.none()

        items = [
            {
                'id': m.id,
                'appointment_id': m.appointment_id or 0,
                'patient_name': m.patient_name,
                'medicine_inventory_id': m.medicine_inventory_id or 0,
                'category': m.category,
                'item_type': m.item_type,
                'product_name': m.product_name,
                'brand_name': m.brand_name,
                'strength': m.strength,
                'dosage': m.dosage,
                'frequency': m.frequency,
                'duration': m.duration,
                'ingredients': m.ingredients,
                'instructions': m.instructions,
                'created_at': m.created_at.strftime('%d-%m-%Y %H:%M'),
            }
            for m in qs.order_by('id')
        ]
        return JsonResponse({'status': 'success', 'medicines': items})
    except Exception as e:
        return JsonResponse({'status': 'error', 'message': str(e)}, status=500)


def delete_patient_medicine_view(request, item_id):
    if request.method != 'POST':
        return JsonResponse({'status': 'error', 'message': 'Invalid request method.'}, status=405)

    try:
        pm = get_object_or_404(PatientMedicine, id=item_id)
        prod = pm.product_name
        pm.delete()
        return JsonResponse({'status': 'success', 'message': f'Medicine "{prod}" removed from patient record.'})
    except Exception as e:
        return JsonResponse({'status': 'error', 'message': str(e)}, status=500)
