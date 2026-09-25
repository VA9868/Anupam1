from django.urls import path
from . import views

urlpatterns = [
    path('', views.home_view, name='home'),
    path('dashboard/', views.dashboard_view, name='dashboard'),
    path('dashboardpatient/', views.dashboard_patient_view, name='dashboard_patient'),
    path('dashboard/add-case/', views.add_case_view, name='add_case'),
    path('dashboard/add-patient/', views.add_patient_view, name='add_patient'),
    path('dashboard/add-doctor/', views.add_doctor_view, name='add_doctor'),
    path('dashboard/edit-doctor/<int:doctor_id>/', views.edit_doctor_view, name='edit_doctor'),
    path('dashboard/delete-doctor/<int:doctor_id>/', views.delete_doctor_view, name='delete_doctor'),
    path('dashboard/new-invoice/', views.new_invoice_view, name='new_invoice'),
    path('dashboard/update-case-status/<int:case_id>/', views.update_case_status_view, name='update_case_status'),
    path('dashboard/delete-case/<int:case_id>/', views.delete_case_view, name='delete_case'),
    path('book-appointment/', views.book_appointment_view, name='book_appointment'),
    path('contact/', views.contact_view, name='contact'),
    path('login/', views.login_view, name='login'),
    path('vidhu/', views.login_view, name='login_vidhu'),
    path('dashboard/print-slip-grid/', views.print_slip_grid_view, name='print_slip_grid'),
    path('dashboard/print-letterhead/', views.print_letterhead_view, name='print_letterhead'),
    path('dashboard/print-clinical-notes/', views.print_clinical_notes_view, name='print_clinical_notes'),
    path('dashboard/print-prescription/', views.print_prescription_view, name='print_prescription'),
    path('register/', views.register_view, name='register'),
    path('logout/', views.logout_view, name='logout'),
]
