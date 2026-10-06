from django.db import models

class Doctor(models.Model):
    name = models.CharField(max_length=150)
    reg_no = models.CharField(max_length=100, blank=True, default="", help_text="Registration Number")
    designation = models.CharField(max_length=150, blank=True, default="", help_text="e.g. Senior Dental Surgeon")
    qualification = models.CharField(max_length=200, help_text="e.g. BDS, MDS (Implantology)")
    title = models.CharField(max_length=150, blank=True, default="Senior Dental Surgeon")
    specialization = models.CharField(max_length=150, blank=True, default="")
    experience_years = models.IntegerField(default=15)
    bio = models.TextField(blank=True)
    photo = models.ImageField(upload_to='doctors/', blank=True, null=True, help_text="Doctor profile photo")
    avatar_url = models.CharField(max_length=300, blank=True, help_text="Image URL or SVG icon")
    is_chief = models.BooleanField(default=False)
    available_days = models.CharField(max_length=100, default="Mon - Sat")
    
    def save(self, *args, **kwargs):
        if self.designation:
            if not self.title:
                self.title = self.designation
            if not self.specialization:
                self.specialization = self.designation
        super().save(*args, **kwargs)

    def __str__(self):
        return f"{self.name} - {self.designation or self.title or self.specialization}"

class Service(models.Model):
    CATEGORY_CHOICES = [
        ('general', 'General & Preventive'),
        ('cosmetic', 'Cosmetic & Whitening'),
        ('implant', 'Implants & Surgery'),
        ('ortho', 'Braces & Aligners'),
        ('rootcanal', 'Root Canal Therapy'),
        ('pediatric', 'Pediatric Dentistry'),
    ]
    
    title = models.CharField(max_length=200)
    slug = models.SlugField(unique=True, blank=True)
    category = models.CharField(max_length=50, choices=CATEGORY_CHOICES, default='general')
    icon_name = models.CharField(max_length=50, default='tooth', help_text="FontAwesome icon class name")
    image = models.ImageField(upload_to='services/', blank=True, null=True, help_text="Service photo or banner image")
    short_description = models.CharField(max_length=300)
    detailed_description = models.TextField(blank=True, default="")
    duration = models.CharField(max_length=100, default="30-45 Mins")
    price_estimate = models.CharField(max_length=100, default="Affordable Care")
    badge_tag = models.CharField(max_length=50, blank=True, default="Popular")
    is_featured = models.BooleanField(default=True)
    
    def save(self, *args, **kwargs):
        if not self.slug:
            from django.utils.text import slugify
            base_slug = slugify(self.title) or 'service'
            slug = base_slug
            count = 1
            while Service.objects.filter(slug=slug).exclude(pk=self.pk).exists():
                slug = f"{base_slug}-{count}"
                count += 1
            self.slug = slug
        super().save(*args, **kwargs)

    def __str__(self):
        return self.title

class Appointment(models.Model):
    STATUS_CHOICES = [
        ('pending', 'Pending Confirmation'),
        ('confirmed', 'Confirmed'),
        ('completed', 'Completed'),
        ('cancelled', 'Cancelled'),
    ]

    first_name = models.CharField(max_length=100, blank=True, null=True)
    last_name = models.CharField(max_length=100, blank=True, null=True)
    patient_name = models.CharField(max_length=150, blank=True, null=True)
    age = models.IntegerField(blank=True, null=True, help_text="Patient Age")
    gender = models.CharField(max_length=20, blank=True, null=True, choices=[('Male', 'Male'), ('Female', 'Female'), ('Other', 'Other')])
    phone = models.CharField(max_length=20)
    phone2 = models.CharField(max_length=20, blank=True, null=True, help_text="Alternate Phone Number")
    email = models.EmailField(blank=True, null=True)
    address = models.TextField(blank=True, null=True)
    city = models.CharField(max_length=100, blank=True, null=True)
    state = models.CharField(max_length=100, blank=True, null=True)
    pincode = models.CharField(max_length=20, blank=True, null=True)
    service_name = models.CharField(max_length=200, blank=True, null=True, default="General Consultation")
    doctor_name = models.CharField(max_length=150, default="Dr. Anoop")
    preferred_date = models.DateField()
    preferred_time = models.CharField(max_length=50, blank=True, null=True, default="Morning (09:30 AM - 12:00 PM)")
    notes = models.TextField(blank=True, null=True, help_text="Comments / Notes")
    chart_data = models.TextField(blank=True, null=True, default="{}", help_text="JSON teeth chart data")
    status = models.CharField(max_length=20, choices=STATUS_CHOICES, default='pending')
    created_at = models.DateTimeField(auto_now_add=True)

    @property
    def formatted_id(self):
        date_str = self.created_at.strftime('%Y%m%d') if self.created_at else (self.preferred_date.strftime('%Y%m%d') if self.preferred_date else '20260919')
        return f"{date_str}-{self.id:04d}"

    def __str__(self):
        full_name = f"{self.first_name} {self.last_name}".strip() or self.patient_name or "Patient"
        return f"Booking {self.formatted_id} for {full_name} on {self.preferred_date} ({self.service_name})"

class Testimonial(models.Model):
    patient_name = models.CharField(max_length=150)
    rating = models.IntegerField(default=5)
    review_text = models.TextField()
    treatment = models.CharField(max_length=150, default="General Dentistry")
    photo = models.ImageField(upload_to='testimonials/', blank=True, null=True, help_text="Patient photo or smile image")
    created_at = models.DateField(auto_now_add=True)

    def __str__(self):
        return f"{self.patient_name} - {self.rating} Stars"

class ContactMessage(models.Model):
    name = models.CharField(max_length=150)
    phone = models.CharField(max_length=20)
    email = models.EmailField()
    subject = models.CharField(max_length=200, blank=True)
    message = models.TextField()
    created_at = models.DateTimeField(auto_now_add=True)

    def __str__(self):
        return f"Message from {self.name} - {self.subject}"


class DentalCase(models.Model):
    CASE_STATUS_CHOICES = [
        ('in_progress', 'In Progress'),
        ('completed', 'Completed'),
        ('overdue', 'Overdue'),
        ('pending', 'Pending Review'),
    ]

    case_id = models.CharField(max_length=50, unique=True)
    patient_name = models.CharField(max_length=150)
    doctor_name = models.CharField(max_length=150, default="Dr. Anoop")
    case_type = models.CharField(max_length=100, default='Crown & Bridge')
    status = models.CharField(max_length=30, choices=CASE_STATUS_CHOICES, default='in_progress')
    due_date = models.DateField()
    amount = models.DecimalField(max_digits=10, decimal_places=2, default=0.00)
    notes = models.TextField(blank=True, null=True)
    created_at = models.DateTimeField(auto_now_add=True)

    def __str__(self):
        return f"{self.case_id} - {self.patient_name} ({self.case_type})"


class Invoice(models.Model):
    invoice_id = models.CharField(max_length=50, unique=True)
    patient_name = models.CharField(max_length=150)
    treatment = models.CharField(max_length=150)
    amount = models.DecimalField(max_digits=10, decimal_places=2)
    payment_status = models.CharField(max_length=50, choices=[('Paid', 'Paid'), ('Pending', 'Pending'), ('Partial', 'Partial')], default='Paid')
    payment_mode = models.CharField(max_length=50, default='UPI / Card')
    created_at = models.DateField(auto_now_add=True)

    def __str__(self):
        return f"{self.invoice_id} - {self.patient_name} - ₹{self.amount}"


class AboutClinic(models.Model):
    DEFAULT_DESC = """Our Philosophy
We believe that trust is the foundation of good dental care. Every treatment at our clinic begins only after a detailed explanation of the diagnosis and treatment plan, helping patients and their families make informed and confident decisions.

Ethics & Safety First
From day one, we have strictly followed ethical dental practices with zero compromise on sterilization and infection control protocols. Your safety and well-being are always our highest priorities.

Trusted by Generations
Our journey has been shaped by the trust of our patients. The clinic continues to grow through word-of-mouth recommendations, reflecting the confidence and satisfaction of the families we serve.

Comprehensive Dental Care
With specialists across all dental specialties, we provide complete and personalized dental solutions for patients of all ages—under one roof.

Gentle Care for Children
We offer special care and attention to pediatric patients, creating a friendly and comforting environment that helps children feel relaxed and happy during their visits."""

    subtitle = models.CharField(max_length=150, default="About Our Clinic")
    title = models.CharField(max_length=200, default="Your Trusted Partner For Total Oral Health")
    description = models.TextField(default=DEFAULT_DESC)
    photo = models.ImageField(upload_to='about/', blank=True, null=True, help_text="Clinic about section photo")
    experience_years = models.CharField(max_length=50, default="28+", blank=True)
    established_date = models.CharField(max_length=100, default="19th August 1996", blank=True)
    operating_hours = models.CharField(max_length=200, default="Mon - Sun: 9:00 AM – 8:00 PM (Tuesday Holiday)", blank=True)
    helpline = models.CharField(max_length=200, default="Call / WhatsApp: +91 94460 46868 | Email: info@anupamdental.com", blank=True)
    facility_location = models.CharField(max_length=250, default="Anupam Dental Clinic, Vaikom / Cherthala, Kerala, India", blank=True)
    sterilization_safety = models.CharField(max_length=300, default="Class-B 7-Step Autoclaving, UV sterilization chambers, 100% infection control.", blank=True)
    updated_at = models.DateTimeField(auto_now=True)

    @property
    def formatted_description_html(self):
        if not self.description:
            return ""
        import html
        import re
        lines = self.description.strip().split('\n')
        html_parts = []
        for line in lines:
            line_str = line.strip()
            if not line_str:
                continue
            m = re.match(r'^\*\*(.*?)\*\*:?$', line_str)
            if m:
                heading = html.escape(m.group(1))
                html_parts.append(f'<h4 class="about-desc-heading" style="font-family: \'Outfit\', \'Inter\', sans-serif; font-size: 1.05rem; font-weight: 700; color: #0f172a; margin: 16px 0 6px 0;">{heading}</h4>')
            elif line_str in ['Our Philosophy', 'Ethics & Safety First', 'Trusted by Generations', 'Comprehensive Dental Care', 'Gentle Care for Children'] or (len(line_str) < 40 and not line_str.endswith('.') and not line_str.endswith(',')):
                heading = html.escape(line_str)
                html_parts.append(f'<h4 class="about-desc-heading" style="font-family: \'Outfit\', \'Inter\', sans-serif; font-size: 1.05rem; font-weight: 700; color: #0f172a; margin: 16px 0 6px 0;">{heading}</h4>')
            else:
                p_text = html.escape(line_str)
                html_parts.append(f'<p class="about-desc-p" style="font-family: \'Inter\', sans-serif; font-size: 0.92rem; color: #475569; line-height: 1.65; margin: 0 0 12px 0;">{p_text}</p>')
        return "\n".join(html_parts)

    def __str__(self):
        return self.title

