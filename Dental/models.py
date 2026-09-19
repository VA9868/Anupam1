from django.db import models

class Doctor(models.Model):
    name = models.CharField(max_length=150)
    title = models.CharField(max_length=150, default="Senior Dental Surgeon")
    qualification = models.CharField(max_length=200, help_text="e.g. BDS, MDS (Implantology)")
    specialization = models.CharField(max_length=150)
    experience_years = models.IntegerField(default=15)
    bio = models.TextField()
    avatar_url = models.CharField(max_length=300, blank=True, help_text="Image URL or SVG icon")
    is_chief = models.BooleanField(default=False)
    available_days = models.CharField(max_length=100, default="Mon - Sat")
    
    def __str__(self):
        return f"{self.name} - {self.specialization}"

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

    def __str__(self):
        full_name = f"{self.first_name} {self.last_name}".strip() or self.patient_name or "Patient"
        return f"Booking for {full_name} on {self.preferred_date} ({self.service_name})"

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

