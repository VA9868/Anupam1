import os
import django

os.environ.setdefault('DJANGO_SETTINGS_MODULE', 'DrAnoop.settings')
django.setup()

from Dental.models import Doctor, Service, Testimonial

# Seed Doctors
Doctor.objects.all().delete()
doctors_data = [
    {
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

for d in doctors_data:
    Doctor.objects.create(**d)

# Seed Services
Service.objects.all().delete()
services_data = [
    {
        'title': 'Laser Teeth Whitening',
        'slug': 'teeth-whitening',
        'category': 'cosmetic',
        'icon_name': 'sparkles',
        'short_description': 'Get a sparkling white smile up to 8 shades lighter in just 45 minutes using advanced laser technology.',
        'detailed_description': 'Safe, effective, and painless cosmetic whitening procedure designed to lift stubborn stains caused by coffee, smoking, and aging.',
        'duration': '45 Mins',
        'price_estimate': '₹2,999 onwards',
        'badge_tag': 'Most Popular',
        'is_featured': True
    },
    {
        'title': 'Single-Visit Root Canal (RCT)',
        'slug': 'root-canal',
        'category': 'rootcanal',
        'icon_name': 'tooth',
        'short_description': 'Painless, rotary endodontic root canal treatment done in a single comfortable visit.',
        'detailed_description': 'Modern microscopic RCT that saves your natural tooth with zero discomfort, followed by durable zirconia crowns.',
        'duration': '60 Mins',
        'price_estimate': '₹3,500 onwards',
        'badge_tag': 'Painless Tech',
        'is_featured': True
    },
    {
        'title': 'Dental Implants & Fixed Teeth',
        'slug': 'dental-implants',
        'category': 'implant',
        'icon_name': 'shield-check',
        'short_description': 'Permanent, natural-looking replacement for missing teeth with lifetime warranty Titanium implants.',
        'detailed_description': 'Precision 3D guided implant surgery restoring 100% chewing function, confidence, and natural jaw structure.',
        'duration': '45 Mins / Surgery',
        'price_estimate': '₹18,000 onwards',
        'badge_tag': 'Lifetime Warranty',
        'is_featured': True
    },
    {
        'title': 'Invisible Clear Aligners',
        'slug': 'clear-aligners',
        'category': 'ortho',
        'icon_name': 'smile',
        'short_description': 'Straighten your teeth discreetly without metal wires or braces using custom 3D aligners.',
        'detailed_description': 'Removable, invisible aligners custom 3D printed for comfortable, fast teeth alignment.',
        'duration': '6-12 Months',
        'price_estimate': '₹39,999 onwards',
        'badge_tag': 'Modern Ortho',
        'is_featured': True
    },
    {
        'title': 'Smile Makeover & Veneers',
        'slug': 'smile-makeover',
        'category': 'cosmetic',
        'icon_name': 'gem',
        'short_description': 'Custom ultra-thin porcelain veneers to correct gaps, chips, discolored, or uneven teeth.',
        'detailed_description': 'Digital Smile Design (DSD) crafted bespoke ceramic veneers for Hollywood-standard aesthetic perfection.',
        'duration': '2 Appointments',
        'price_estimate': '₹6,500 / Tooth',
        'badge_tag': 'Hollywood Smile',
        'is_featured': True
    },
    {
        'title': 'Pediatric & Kids Dental Care',
        'slug': 'pediatric-dentistry',
        'category': 'pediatric',
        'icon_name': 'child',
        'short_description': 'Gentle, fun, and child-friendly dental care including pit & fissure sealants and cavity fillings.',
        'detailed_description': 'Preventive checkups, fluoride varnish, space maintainers, and gentle painless treatments tailored for kids.',
        'duration': '30 Mins',
        'price_estimate': '₹800 onwards',
        'badge_tag': 'Kids Friendly',
        'is_featured': True
    },
    {
        'title': 'Painless Tooth Extraction',
        'slug': 'tooth-extraction',
        'category': 'implant',
        'icon_name': 'syringe',
        'short_description': 'Gentle extraction of wisdom teeth or damaged teeth under micro-anesthesia with fast recovery.',
        'detailed_description': 'Surgical and non-surgical atraumatic tooth extraction ensuring quick healing and minimal post-op pain.',
        'duration': '30-45 Mins',
        'price_estimate': '₹1,500 onwards',
        'badge_tag': 'Atraumatic',
        'is_featured': True
    },
    {
        'title': 'Scaling & Deep Teeth Cleaning',
        'slug': 'teeth-cleaning',
        'category': 'general',
        'icon_name': 'pump-soap',
        'short_description': 'Ultrasonic scaling and polishing to eliminate plaque, tartar, bleeding gums, and bad breath.',
        'detailed_description': 'Thorough gum therapy, deep ultrasonic cleaning, stain removal, and protective fluoridation.',
        'duration': '30 Mins',
        'price_estimate': '₹1,200 onwards',
        'badge_tag': 'Essential Hygiene',
        'is_featured': True
    }
]

for s in services_data:
    Service.objects.create(**s)

# Seed Testimonials
Testimonial.objects.all().delete()
testimonials_data = [
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

for t in testimonials_data:
    Testimonial.objects.create(**t)

print("Database seeded successfully!")
