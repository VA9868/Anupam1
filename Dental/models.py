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
    short_description = models.CharField(max_length=300)
    detailed_description = models.TextField()
    duration = models.CharField(max_length=100, default="30-45 Mins")
    price_estimate = models.CharField(max_length=100, default="Affordable Care")
    badge_tag = models.CharField(max_length=50, blank=True, default="Popular")
    is_featured = models.BooleanField(default=True)
    
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

