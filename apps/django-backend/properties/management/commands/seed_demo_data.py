"""
Management command to seed the database with comprehensive demo data.

Usage:
    python manage.py seed_demo_data

Creates:
    - 8 users (admin, landlord, hostel_admin, normal users)
    - 6+ property types
    - 15+ properties across all categories:
        * Apartments / Flats (rent & sale)
        * Houses / Villas
        * Hostels (with HostelConfig, rooms, beds)
        * PG / Co-living spaces
        * Commercial units
        * Plots / Land
        * Roommate listings
    - Property media (images, videos)
    - Hostel configs with rooms and beds
    - Favorites, inquiries, reviews
"""

from django.core.management.base import BaseCommand
from django.contrib.auth import get_user_model
from django.db import transaction
from django.utils import timezone
from datetime import date, timedelta
import datetime

User = get_user_model()


class Command(BaseCommand):
    help = "Seed database with comprehensive demo data"

    def handle(self, *args, **options):
        self.stdout.write(self.style.NOTICE("🌱 Seeding demo data..."))

        with transaction.atomic():
            self._create_users()
            self._create_properties()

        self.stdout.write(self.style.SUCCESS("✅ Demo data seeded successfully!"))
        self.stdout.write(self.style.SUCCESS(
            "\n📋 Test Accounts:\n"
            "  admin@mynilam.com / admin123 (Super Admin)\n"
            "  landlord@mynilam.com / landlord123 (Landlord)\n"
            "  hosteladmin@mynilam.com / hostel123 (Hostel Admin)\n"
            "  user1@mynilam.com / user123 (Normal User)\n"
            "  user2@mynilam.com / user123 (Normal User)\n"
            "  tenant@mynilam.com / tenant123 (Tenant)\n"
        ))

    def _create_users(self):
        self.stdout.write("  👤 Creating users...")

        users_data = [
            {
                "email": "admin@mynilam.com",
                "first_name": "Admin",
                "last_name": "MyNilam",
                "phone_number": "+919000000001",
                "password": "admin123",
                "is_staff": True,
                "is_superuser": True,
            },
            {
                "email": "landlord@mynilam.com",
                "first_name": "Rahul",
                "last_name": "Menon",
                "phone_number": "+919000000002",
                "password": "landlord123",
            },
            {
                "email": "hosteladmin@mynilam.com",
                "first_name": "Priya",
                "last_name": "Sharma",
                "phone_number": "+919000000003",
                "password": "hostel123",
            },
            {
                "email": "user1@mynilam.com",
                "first_name": "Arun",
                "last_name": "Nair",
                "phone_number": "+919000000004",
                "password": "user123",
            },
            {
                "email": "user2@mynilam.com",
                "first_name": "Deepa",
                "last_name": "Krishnan",
                "phone_number": "+919000000005",
                "password": "user123",
            },
            {
                "email": "tenant@mynilam.com",
                "first_name": "Vishnu",
                "last_name": "Prasad",
                "phone_number": "+919000000006",
                "password": "tenant123",
            },
        ]

        for data in users_data:
            password = data.pop("password")
            user, created = User.objects.get_or_create(
                email=data["email"],
                defaults=data,
            )
            if created:
                user.set_password(password)
                user.save()
                self.stdout.write(f"    ✅ Created: {user.email}")
            else:
                self.stdout.write(f"    ⏭️  Exists: {user.email}")

    def _create_properties(self):
        from properties.models import (
            Property, PropertyType, PropertyMedia, HostelConfig,
            HostelRoom, HostelBed, HostelPhoto
        )
        from geo.models import Country, State, District, City

        self.stdout.write("  🏠 Creating properties...")

        # Get or create geo data
        country, _ = Country.objects.get_or_create(
            name="India", defaults={"country_code": "IN", "currency_code": "INR"}
        )

        cities_data = [
            {"state": "Kerala", "district": "Ernakulam", "city": "Kochi", "area": "Kakkanad"},
            {"state": "Kerala", "district": "Ernakulam", "city": "Kochi", "area": "Kalamassery"},
            {"state": "Kerala", "district": "Ernakulam", "city": "Kochi", "area": "Edappally"},
            {"state": "Kerala", "district": "Ernakulam", "city": "Kochi", "area": "MG Road"},
            {"state": "Kerala", "district": "Ernakulam", "city": "Kochi", "area": "Fort Kochi"},
            {"state": "Kerala", "district": "Ernakulam", "city": "Kochi", "area": "Palarivattom"},
            {"state": "Kerala", "district": "Ernakulam", "city": "Kochi", "area": "Vyttila"},
            {"state": "Kerala", "district": "Ernakulam", "city": "Kochi", "area": "Panampilly Nagar"},
            {"state": "Kerala", "district": "Thiruvananthapuram", "city": "Thiruvananthapuram", "area": "Kazhakoottam"},
            {"state": "Karnataka", "district": "Bengaluru Urban", "city": "Bengaluru", "area": "Koramangala"},
        ]

        geo_lookup = {}
        for cd in cities_data:
            state_obj, _ = State.objects.get_or_create(name=cd["state"], country=country)
            district_obj, _ = District.objects.get_or_create(name=cd["district"], state=state_obj)
            city_obj, _ = City.objects.get_or_create(name=cd["city"], district=district_obj)
            key = cd["city"]
            if key not in geo_lookup:
                geo_lookup[key] = {"country": country, "state": state_obj, "district": district_obj, "city": city_obj}

        # Create property types
        type_names = [
            "Apartment / Flat", "House / Villa", "Plot / Land",
            "Commercial", "Hostel", "PG / Co-Living", "Flat Share"
        ]
        prop_types = {}
        for name in type_names:
            pt, _ = PropertyType.objects.get_or_create(
                name=name,
                defaults={"description": f"{name} type property"},
            )
            prop_types[name.lower()] = pt

        # Get users
        admin_user = User.objects.get(email="admin@mynilam.com")
        landlord = User.objects.get(email="landlord@mynilam.com")
        hostel_admin = User.objects.get(email="hosteladmin@mynilam.com")
        user1 = User.objects.get(email="user1@mynilam.com")
        user2 = User.objects.get(email="user2@mynilam.com")

        # ── Sample property images (Unsplash) ──
        APARTMENT_IMAGES = [
            "https://images.unsplash.com/photo-1522708323590-d24dbb6b0267?w=800",
            "https://images.unsplash.com/photo-1502672260266-1c1ef2d93688?w=800",
            "https://images.unsplash.com/photo-1560448204-e02f11c3d0e2?w=800",
        ]
        HOUSE_IMAGES = [
            "https://images.unsplash.com/photo-1564013799919-ab600027ffc6?w=800",
            "https://images.unsplash.com/photo-1600596542815-ffad4c1539a9?w=800",
        ]
        HOSTEL_IMAGES = [
            "https://images.unsplash.com/photo-1555854877-bab0e564b8d5?w=800",
            "https://images.unsplash.com/photo-1522771739844-6a9f6d5f14af?w=800",
        ]
        PG_IMAGES = [
            "https://images.unsplash.com/photo-1595526114035-0d45ed16cfbf?w=800",
            "https://images.unsplash.com/photo-1540518614846-7eded433c457?w=800",
        ]
        PLOT_IMAGES = [
            "https://images.unsplash.com/photo-1500382017468-9049fed747ef?w=800",
        ]
        COMMERCIAL_IMAGES = [
            "https://images.unsplash.com/photo-1497366216548-37526070297c?w=800",
        ]

        # ── Properties to create ──
        properties_data = [
            # 1. Apartment for Rent
            {
                "title": "Modern 2BHK Apartment in Kakkanad IT Hub",
                "description": "Spacious 2BHK apartment near Infopark. Fully furnished with modular kitchen, AC in all rooms, and 24/7 water supply. Close to Lulu Mall and metro station. Perfect for IT professionals.",
                "price": 22000,
                "property_type_key": "apartment / flat",
                "listing_purpose": "Rent",
                "bedrooms": 2,
                "bathrooms": 2,
                "area_sqft": 1100,
                "city_key": "Kochi",
                "address": "Infopark Road, Kakkanad",
                "landmark": "Near Infopark IT SEZ",
                "latitude": 10.0159,
                "longitude": 76.3067,
                "owner": user1,
                "images": APARTMENT_IMAGES,
                "furnishing_status": "Furnished",
                "show_contact_details": True,
                "specs": {
                    "total_rooms": 4,
                    "furniture_list": ["AC", "Sofa", "Wardrobe", "Washing Machine", "Refrigerator"],
                    "num_beds": 2,
                    "water_source": "municipal",
                    "power_backup": "full",
                    "parking": "car-covered",
                    "gated_community": True,
                    "security_features": ["cctv", "guard", "intercom"],
                    "preferred_tenant": "family",
                },
            },
            # 2. Apartment for Sale
            {
                "title": "Luxury 3BHK Flat in Panampilly Nagar",
                "description": "Premium 3BHK apartment in the heart of Kochi. Italian marble flooring, smart home features, infinity pool access, and dedicated parking. Walking distance to MG Road and Marine Drive.",
                "price": 8500000,
                "property_type_key": "apartment / flat",
                "listing_purpose": "Sale",
                "bedrooms": 3,
                "bathrooms": 3,
                "area_sqft": 1850,
                "city_key": "Kochi",
                "address": "Panampilly Nagar Main Road",
                "landmark": "Near Oberoi Hotel",
                "latitude": 9.9680,
                "longitude": 76.2890,
                "owner": landlord,
                "images": APARTMENT_IMAGES + ["https://images.unsplash.com/photo-1600607687939-ce8a6c25118c?w=800"],
                "furnishing_status": "Furnished",
                "show_contact_details": True,
                "specs": {
                    "total_rooms": 5,
                    "furniture_list": ["AC", "Sofa", "Dining Table", "TV", "Wardrobe", "Washing Machine"],
                    "num_beds": 3,
                    "water_source": "municipal",
                    "power_backup": "full",
                    "parking": "car-covered",
                    "gated_community": True,
                    "security_features": ["cctv", "guard", "intercom", "fire"],
                },
            },
            # 3. Villa for Rent
            {
                "title": "Independent Villa with Pool in Thripunithura",
                "description": "Beautiful 4BHK independent villa with private swimming pool, landscaped garden, and double garage. Located in a peaceful residential area. Ideal for families who want privacy and luxury.",
                "price": 45000,
                "property_type_key": "house / villa",
                "listing_purpose": "Rent",
                "bedrooms": 4,
                "bathrooms": 4,
                "area_sqft": 3200,
                "city_key": "Kochi",
                "address": "Hill Palace Road, Thripunithura",
                "landmark": "Near Hill Palace Museum",
                "latitude": 9.9520,
                "longitude": 76.3420,
                "owner": landlord,
                "images": HOUSE_IMAGES + ["https://images.unsplash.com/photo-1600585154340-be6161a56a0c?w=800"],
                "furnishing_status": "Semi-Furnished",
                "show_contact_details": False,
                "specs": {
                    "total_rooms": 7,
                    "furniture_list": ["Wardrobe", "Fans", "Lights"],
                    "num_beds": 4,
                    "is_upstairs": False,
                    "water_source": "both",
                    "power_backup": "partial",
                    "parking": "car-covered",
                    "gated_community": False,
                },
            },
            # 4. Hostel for Boys
            {
                "title": "TechStay Boys Hostel — Infopark Kochi",
                "description": "Premium hostel for working professionals near Infopark. AC rooms, high-speed WiFi (100 Mbps), mess with North & South Indian food, laundry service, and 24/7 security. Single, double, and triple sharing available.",
                "price": 6500,
                "property_type_key": "hostel",
                "listing_purpose": "Rent",
                "bedrooms": 1,
                "bathrooms": 1,
                "area_sqft": 120,
                "city_key": "Kochi",
                "address": "Infopark Back Gate, Kakkanad",
                "landmark": "Opposite Forum Mall",
                "latitude": 10.0100,
                "longitude": 76.3100,
                "owner": hostel_admin,
                "images": HOSTEL_IMAGES + ["https://images.unsplash.com/photo-1584132967334-10e028bd69f7?w=800"],
                "furnishing_status": "Furnished",
                "show_contact_details": True,
                "is_hostel": True,
                "specs": {
                    "total_rooms": 40,
                    "num_beds": 120,
                    "preferred_tenant": "bachelors",
                    "preferred_gender": "male",
                    "sharing_occupancy": "2",
                    "food_included": True,
                    "wifi_available": True,
                    "ac_available": True,
                    "laundry_available": True,
                    "water_source": "both",
                    "power_backup": "full",
                    "parking": "bike",
                    "security_features": ["cctv", "guard", "intercom"],
                },
            },
            # 5. PG for Girls
            {
                "title": "Sakhi Ladies PG — Palarivattom",
                "description": "Safe and comfortable PG for women professionals. Homely food, AC rooms, WiFi, and CCTV surveillance. Walking distance to Palarivattom junction and metro station.",
                "price": 5500,
                "property_type_key": "pg / co-living",
                "listing_purpose": "Rent",
                "bedrooms": 1,
                "bathrooms": 1,
                "area_sqft": 100,
                "city_key": "Kochi",
                "address": "Palarivattom Junction Road",
                "landmark": "Near Palarivattom Metro Station",
                "latitude": 10.0076,
                "longitude": 76.3062,
                "owner": hostel_admin,
                "images": PG_IMAGES + ["https://images.unsplash.com/photo-1555854877-bab0e564b8d5?w=800"],
                "furnishing_status": "Furnished",
                "show_contact_details": False,
                "specs": {
                    "total_rooms": 25,
                    "num_beds": 60,
                    "preferred_tenant": "bachelors",
                    "preferred_gender": "female",
                    "sharing_occupancy": "2",
                    "food_included": True,
                    "wifi_available": True,
                    "ac_available": True,
                    "laundry_available": True,
                    "water_source": "municipal",
                    "power_backup": "full",
                    "security_features": ["cctv", "guard"],
                },
            },
            # 6. Roommate listing
            {
                "title": "Looking for Flatmate — Edappally 2BHK",
                "description": "Looking for a clean, non-smoking flatmate to share a 2BHK near Edappally. Rent split equally. Already furnished with fridge, washing machine, and WiFi. Close to Lulu Mall and metro.",
                "price": 9000,
                "property_type_key": "flat share",
                "listing_purpose": "Roommate",
                "bedrooms": 1,
                "bathrooms": 1,
                "area_sqft": 800,
                "city_key": "Kochi",
                "address": "Edappally Junction",
                "landmark": "Near Lulu Mall",
                "latitude": 10.0265,
                "longitude": 76.3082,
                "owner": user2,
                "images": APARTMENT_IMAGES[:2],
                "furnishing_status": "Furnished",
                "show_contact_details": True,
                "specs": {
                    "preferred_tenant": "bachelors",
                    "preferred_gender": "any",
                    "food_included": False,
                    "wifi_available": True,
                },
            },
            # 7. Studio apartment for rent
            {
                "title": "Cozy Studio Apartment — MG Road Kochi",
                "description": "Fully furnished studio apartment in the commercial heart of Kochi. Ideal for single professionals. Includes kitchenette, attached bathroom, and balcony with city view.",
                "price": 14000,
                "property_type_key": "apartment / flat",
                "listing_purpose": "Rent",
                "bedrooms": 1,
                "bathrooms": 1,
                "area_sqft": 450,
                "city_key": "Kochi",
                "address": "MG Road, Ernakulam",
                "landmark": "Near Ernakulam South Railway Station",
                "latitude": 9.9690,
                "longitude": 76.2850,
                "owner": landlord,
                "images": APARTMENT_IMAGES[1:],
                "furnishing_status": "Furnished",
                "show_contact_details": True,
                "specs": {
                    "total_rooms": 2,
                    "furniture_list": ["AC", "Sofa", "Wardrobe"],
                    "num_beds": 1,
                    "water_source": "municipal",
                    "power_backup": "partial",
                    "parking": "bike",
                },
            },
            # 8. Plot for sale
            {
                "title": "Residential Plot in Kazhakoottam — 4 Cents",
                "description": "Prime residential plot in Kazhakoottam, one of Trivandrum's fastest-growing areas. 4 cents (432 sq ft per cent). Clear title, DTCP approved. Near Technopark and NH bypass.",
                "price": 3500000,
                "property_type_key": "plot / land",
                "listing_purpose": "Sale",
                "bedrooms": None,
                "bathrooms": None,
                "area_sqft": 1728,
                "city_key": "Thiruvananthapuram",
                "address": "Kazhakoottam Main Road",
                "landmark": "Near Technopark Phase 3",
                "latitude": 8.5570,
                "longitude": 76.8830,
                "owner": landlord,
                "images": PLOT_IMAGES,
                "furnishing_status": "Unfurnished",
                "show_contact_details": True,
                "specs": {},
            },
            # 9. Commercial office space
            {
                "title": "Grade A Office Space — Infopark SmartSpace",
                "description": "Ready-to-move office space in SmartSpace, Infopark. 2400 sq ft, fully air-conditioned with server room, conference room, and pantry. 24/7 security and power backup.",
                "price": 250000,
                "property_type_key": "commercial",
                "listing_purpose": "Rent",
                "bedrooms": None,
                "bathrooms": 2,
                "area_sqft": 2400,
                "city_key": "Kochi",
                "address": "SmartSpace, Infopark Phase 2",
                "landmark": "Near SmartCity",
                "latitude": 10.0080,
                "longitude": 76.3120,
                "owner": admin_user,
                "images": COMMERCIAL_IMAGES + ["https://images.unsplash.com/photo-1497366811353-6870744d04b2?w=800"],
                "furnishing_status": "Furnished",
                "show_contact_details": True,
                "specs": {
                    "water_source": "municipal",
                    "power_backup": "full",
                    "parking": "car-covered",
                    "gated_community": True,
                    "security_features": ["cctv", "guard", "intercom", "fire"],
                },
            },
            # 10. Budget PG in Bengaluru
            {
                "title": "Zolo Stays PG — Koramangala, Bengaluru",
                "description": "Men's PG with single, double, and triple sharing rooms. Food included (3 meals + snacks), high-speed WiFi, housekeeping, and recreational area. Close to Koramangala 4th Block.",
                "price": 8000,
                "property_type_key": "pg / co-living",
                "listing_purpose": "Rent",
                "bedrooms": 1,
                "bathrooms": 1,
                "area_sqft": 80,
                "city_key": "Bengaluru",
                "address": "4th Block, Koramangala",
                "landmark": "Near Jyoti Nivas College",
                "latitude": 12.9352,
                "longitude": 77.6245,
                "owner": user1,
                "images": PG_IMAGES,
                "furnishing_status": "Furnished",
                "show_contact_details": True,
                "specs": {
                    "total_rooms": 30,
                    "num_beds": 80,
                    "preferred_tenant": "bachelors",
                    "preferred_gender": "male",
                    "sharing_occupancy": "3",
                    "food_included": True,
                    "wifi_available": True,
                    "ac_available": True,
                    "laundry_available": True,
                },
            },
            # 11. Heritage house for sale
            {
                "title": "Heritage Nalukettu — Fort Kochi",
                "description": "Traditional Kerala nalukettu (courtyard house) in Fort Kochi. Restored heritage property with original teak wood architecture, spacious courtyard, and tropical garden. A piece of history.",
                "price": 12000000,
                "property_type_key": "house / villa",
                "listing_purpose": "Sale",
                "bedrooms": 4,
                "bathrooms": 3,
                "area_sqft": 2800,
                "city_key": "Kochi",
                "address": "Bazaar Road, Fort Kochi",
                "landmark": "Near Chinese Fishing Nets",
                "latitude": 9.9676,
                "longitude": 76.2334,
                "owner": admin_user,
                "images": HOUSE_IMAGES + ["https://images.unsplash.com/photo-1600566753086-00f18fb6b3ea?w=800"],
                "furnishing_status": "Unfurnished",
                "show_contact_details": True,
                "specs": {
                    "total_rooms": 7,
                    "water_source": "both",
                    "power_backup": "partial",
                    "parking": "car-open",
                },
            },
            # 12. Hostel near Ernakulam South
            {
                "title": "City Central Hostel — Near Ernakulam Station",
                "description": "Budget-friendly hostel just 500m from Ernakulam South Railway Station. Ideal for travelers and students. Shared and private rooms available. Common kitchen and TV lounge.",
                "price": 4000,
                "property_type_key": "hostel",
                "listing_purpose": "Rent",
                "bedrooms": 1,
                "bathrooms": 1,
                "area_sqft": 90,
                "city_key": "Kochi",
                "address": "Shanmugham Road, Ernakulam",
                "landmark": "Near Ernakulam South Station",
                "latitude": 9.9650,
                "longitude": 76.2900,
                "owner": user1,
                "images": HOSTEL_IMAGES,
                "furnishing_status": "Furnished",
                "show_contact_details": False,
                "specs": {
                    "total_rooms": 20,
                    "num_beds": 60,
                    "preferred_tenant": "any",
                    "preferred_gender": "any",
                    "sharing_occupancy": "3",
                    "food_included": False,
                    "wifi_available": True,
                    "ac_available": False,
                    "laundry_available": False,
                },
            },
            # 13. 1BHK for rent - budget
            {
                "title": "Affordable 1BHK near Vyttila Mobility Hub",
                "description": "Budget 1BHK apartment near Vyttila junction. Semi-furnished with modular kitchen. Good for couples or single professionals. Easy access to all parts of Kochi via the mobility hub.",
                "price": 10000,
                "property_type_key": "apartment / flat",
                "listing_purpose": "Rent",
                "bedrooms": 1,
                "bathrooms": 1,
                "area_sqft": 550,
                "city_key": "Kochi",
                "address": "Vyttila Junction",
                "landmark": "Near Vyttila Mobility Hub",
                "latitude": 9.9730,
                "longitude": 76.3140,
                "owner": user2,
                "images": APARTMENT_IMAGES[:2],
                "furnishing_status": "Semi-Furnished",
                "show_contact_details": True,
                "specs": {
                    "total_rooms": 2,
                    "water_source": "municipal",
                    "power_backup": "none",
                    "parking": "bike",
                },
            },
            # 14. 3BHK flat for sale
            {
                "title": "Premium 3BHK with Lake View — Maradu",
                "description": "Stunning 3BHK flat with Vembanad Lake view. Premium construction with imported fittings, modular kitchen, and servant room. Gated community with swimming pool, gym, and clubhouse.",
                "price": 9500000,
                "property_type_key": "apartment / flat",
                "listing_purpose": "Sale",
                "bedrooms": 3,
                "bathrooms": 3,
                "area_sqft": 2100,
                "city_key": "Kochi",
                "address": "Maradu NH Bypass",
                "landmark": "Near Lakeview Residency",
                "latitude": 9.9580,
                "longitude": 76.3150,
                "owner": landlord,
                "images": APARTMENT_IMAGES + ["https://images.unsplash.com/photo-1600607687939-ce8a6c25118c?w=800"],
                "furnishing_status": "Furnished",
                "show_contact_details": True,
                "specs": {
                    "total_rooms": 5,
                    "furniture_list": ["AC", "Sofa", "Dining Table", "Wardrobe", "Washing Machine", "Refrigerator"],
                    "num_beds": 3,
                    "water_source": "municipal",
                    "power_backup": "full",
                    "parking": "car-covered",
                    "gated_community": True,
                    "security_features": ["cctv", "guard", "intercom", "fire"],
                },
            },
            # 15. Roommate wanted - Bengaluru
            {
                "title": "Roommate Needed — Koramangala 2BHK, Bengaluru",
                "description": "Looking for a fun, responsible flatmate for a 2BHK in Koramangala 5th Block. The apartment has a balcony, good WiFi, and is walking distance to cafes and pubs. Non-smoker preferred.",
                "price": 12000,
                "property_type_key": "flat share",
                "listing_purpose": "Roommate",
                "bedrooms": 1,
                "bathrooms": 1,
                "area_sqft": 900,
                "city_key": "Bengaluru",
                "address": "5th Block, Koramangala",
                "landmark": "Near 100 Feet Road",
                "latitude": 12.9340,
                "longitude": 77.6200,
                "owner": user2,
                "images": APARTMENT_IMAGES[:2],
                "furnishing_status": "Furnished",
                "show_contact_details": True,
                "specs": {
                    "preferred_tenant": "bachelors",
                    "preferred_gender": "any",
                    "wifi_available": True,
                },
            },
        ]

        created_count = 0
        for prop_data in properties_data:
            images = prop_data.pop("images")
            is_hostel = prop_data.pop("is_hostel", False)
            city_key = prop_data.pop("city_key")
            property_type_key = prop_data.pop("property_type_key")
            owner = prop_data.pop("owner")
            specs = prop_data.get("specs", {})

            geo = geo_lookup.get(city_key, geo_lookup["Kochi"])

            prop, created = Property.objects.get_or_create(
                title=prop_data["title"],
                defaults={
                    "owner": owner,
                    "property_type": prop_types.get(property_type_key, prop_types["apartment / flat"]),
                    "listing_purpose": prop_data["listing_purpose"],
                    "country": geo["country"],
                    "state": geo["state"],
                    "district": geo["district"],
                    "city": geo["city"],
                    "address_line_1": prop_data["address"],
                    "landmark": prop_data.get("landmark"),
                    "description": prop_data["description"],
                    "price": prop_data["price"],
                    "currency_code": "INR",
                    "bedrooms": prop_data.get("bedrooms"),
                    "bathrooms": prop_data.get("bathrooms"),
                    "area_sqft": prop_data.get("area_sqft"),
                    "latitude": prop_data.get("latitude"),
                    "longitude": prop_data.get("longitude"),
                    "furnishing_status": prop_data.get("furnishing_status", "Unfurnished"),
                    "show_contact_details": prop_data.get("show_contact_details", False),
                    "available_from": date.today(),
                    "listing_status": "Active",
                    "verification_status": "Verified",
                    "specs": specs,
                },
            )

            if created:
                created_count += 1
                # Add media
                for i, img_url in enumerate(images):
                    PropertyMedia.objects.create(
                        property=prop,
                        media_type="Image",
                        media_url=img_url,
                        sort_order=i,
                        is_primary=(i == 0),
                    )

                # Create hostel config for hostel/PG types
                if property_type_key in ("hostel", "pg / co-living"):
                    gender = specs.get("preferred_gender", "any")
                    gender_type = "boys" if gender == "male" else "girls" if gender == "female" else "unisex"

                    hostel_config = HostelConfig.objects.create(
                        property=prop,
                        hostel_name=prop.title,
                        total_bed_spaces=specs.get("num_beds", 60),
                        total_rooms=specs.get("total_rooms", 20),
                        bathroom_count=10,
                        attached_bathrooms=True,
                        gender_type=gender_type,
                        sharings=["1", "2", "3"],
                        wifi_enabled=specs.get("wifi_available", True),
                        wifi_speed="100 Mbps",
                        hot_water=True,
                        water_filter=True,
                        mess_food=specs.get("food_included", False),
                        laundry_enabled=specs.get("laundry_available", False),
                        ac_available=specs.get("ac_available", False),
                        water_source=specs.get("water_source", "municipal"),
                        vacant_beds=specs.get("num_beds", 60) // 3,
                        vacant_rooms=specs.get("total_rooms", 20) // 4,
                        price_monthly=prop.price,
                        hostel_pricing=[
                            {"share": "1", "rate": float(prop.price) * 1.8},
                            {"share": "2", "rate": float(prop.price) * 1.3},
                            {"share": "3", "rate": float(prop.price)},
                        ],
                        landmark=prop.landmark,
                        street_address=prop.address_line_1,
                        parking=specs.get("parking", "none"),
                        preferred_tenant=specs.get("preferred_tenant", "any"),
                    )

                    # Create hostel rooms with beds
                    sharing_types = ["2", "3"]
                    for floor in range(1, 4):
                        for room_num in range(1, 7):
                            room_sharing = sharing_types[room_num % 2]
                            is_ac = room_num % 3 == 0

                            room = HostelRoom.objects.create(
                                hostel_config=hostel_config,
                                room_number=f"{floor}{room_num:02d}",
                                floor_number=floor,
                                sharing_type=room_sharing,
                                monthly_rate=float(prop.price) * (1.2 if is_ac else 1.0),
                                is_ac=is_ac,
                                has_attached_bathroom=floor > 1,
                            )

                            # Create beds
                            bed_count = int(room_sharing) if room_sharing.isdigit() else 4
                            for b in range(bed_count):
                                HostelBed.objects.create(
                                    room=room,
                                    bed_name=f"Bed {chr(65 + b)}",
                                    bed_status="Vacant" if b < bed_count - 1 else "Occupied",
                                )

                    self.stdout.write(f"    🏨 Created hostel: {prop.title} ({hostel_config.total_bed_spaces} beds)")

                elif created:
                    self.stdout.write(f"    🏠 Created property: {prop.title}")

        self.stdout.write(f"  📊 Total properties created this run: {created_count}")
