from django.contrib import admin
from .models import Doctor, Service, Appointment, Testimonial, ContactMessage

@admin.register(Doctor)
class DoctorAdmin(admin.ModelAdmin):
    list_display = ('name', 'title', 'specialization', 'experience_years', 'is_chief')
    list_filter = ('is_chief', 'specialization')
    search_fields = ('name', 'specialization', 'qualification')

@admin.register(Service)
class ServiceAdmin(admin.ModelAdmin):
    list_display = ('title', 'category', 'duration', 'price_estimate', 'is_featured')
    list_filter = ('category', 'is_featured')
    search_fields = ('title', 'short_description')
    prepopulated_fields = {'slug': ('title',)}

@admin.register(Appointment)
class AppointmentAdmin(admin.ModelAdmin):
    list_display = ('get_full_name', 'age', 'gender', 'phone', 'phone2', 'city', 'state', 'preferred_date', 'service_name', 'status')
    list_filter = ('status', 'gender', 'preferred_date', 'city', 'state', 'doctor_name')
    search_fields = ('first_name', 'last_name', 'patient_name', 'phone', 'phone2', 'email', 'city', 'address', 'pincode', 'notes')

    def get_full_name(self, obj):
        return f"{obj.first_name or ''} {obj.last_name or ''}".strip() or obj.patient_name or "Patient"
    get_full_name.short_description = "Patient Name"

@admin.register(Testimonial)
class TestimonialAdmin(admin.ModelAdmin):
    list_display = ('patient_name', 'rating', 'treatment', 'created_at')
    list_filter = ('rating',)
    search_fields = ('patient_name', 'review_text')

@admin.register(ContactMessage)
class ContactMessageAdmin(admin.ModelAdmin):
    list_display = ('name', 'email', 'phone', 'subject', 'created_at')
    search_fields = ('name', 'email', 'message')

