"""
Comprehensive seed: adds missing properties, fixes coordinates, creates hostel
configs with rooms/beds, adds reviews, favorites, inquiries.

Run: python manage.py seed_all_data
"""

from datetime import date, timedelta
from decimal import Decimal
from django.core.management.base import BaseCommand
from django.contrib.auth import get_user_model
from django.db import transaction
from django.utils import timezone

User = get_user_model()
DEMO_PASSWORD = 'demo1234'


class Command(BaseCommand):
    help = 'Comprehensive seed: all property types, hostel configs, rooms, beds, reviews, etc.'

    def handle(self, *args, **options):
        self.stdout.write(self.style.MIGRATE_HEADING('Seeding comprehensive demo data...'))

        with transaction.atomic():
            users = self._ensure_users()
            geo = self._ensure_geo()
            self._ensure_property_types()
            self._fix_coordinates()
            self._add_missing_properties(users, geo)
            self._ensure_hostel_configs()
            self._ensure_property_media()
            self._ensure_reviews(users)
            self._ensure_favorites(users)

        self._summary()

    # ── Users ──────────────────────────────────────────────────────
    def _ensure_users(self):
        from accounts.models import Role, UserRole
        users = {}
        role_map = {
            'landlord@mynilam.com': ('Rahul', 'Menon', 'normal'),
            'tenant@mynilam.com': ('Anita', 'Nair', 'normal'),
            'tenant2@mynilam.com': ('Vikram', 'Pillai', 'normal'),
            'employee@mynilam.com': ('Priya', 'Kumar', 'employee'),
            'hosteladmin@mynilam.com': ('Suresh', 'Babu', 'hostel_admin'),
            'admin@mynilam.com': ('Admin', 'MyNilam', 'super_admin'),
        }
        for email, (first, last, role_name) in role_map.items():
            user, created = User.objects.get_or_create(
                email=email, defaults={'first_name': first, 'last_name': last}
            )
            if created:
                user.set_password(DEMO_PASSWORD)
                user.save()
            role, _ = Role.objects.get_or_create(name=role_name)
            UserRole.objects.get_or_create(user=user, role=role)
            users[email] = user
        self.stdout.write(f'  Users: {len(users)} ensured')
        return users

    # ── Geo ────────────────────────────────────────────────────────
    def _ensure_geo(self):
        from geo.models import Country, State, District, City, Area

        india, _ = Country.objects.get_or_create(name='India', defaults={'country_code': 'IN', 'currency_code': 'INR', 'phone_code': '+91'})
        kerala, _ = State.objects.get_or_create(country=india, name='Kerala', defaults={'state_code': 'KL'})
        karnataka, _ = State.objects.get_or_create(country=india, name='Karnataka', defaults={'state_code': 'KA'})

        ernakulam, _ = District.objects.get_or_create(state=kerala, name='Ernakulam')
        tvm_d, _ = District.objects.get_or_create(state=kerala, name='Thiruvananthapuram')
        blr_d, _ = District.objects.get_or_create(state=karnataka, name='Bengaluru Urban')
        kozhikode_d, _ = District.objects.get_or_create(state=kerala, name='Kozhikode')
        thrissur_d, _ = District.objects.get_or_create(state=kerala, name='Thrissur')

        def city(d, name):
            c, _ = City.objects.get_or_create(district=d, name=name)
            return c

        def area(c, name):
            a, _ = Area.objects.get_or_create(city=c, name=name)
            return a

        kochi = city(ernakulam, 'Kochi')
        blr = city(blr_d, 'Bengaluru')
        tvm = city(tvm_d, 'Thiruvananthapuram')
        calicut = city(kozhikode_d, 'Kozhikode')
        thrissur = city(thrissur_d, 'Thrissur')

        geo = {
            'kakkanad': {'country': india, 'state': kerala, 'district': ernakulam, 'city': kochi, 'area': area(kochi, 'Kakkanad')},
            'kalamassery': {'country': india, 'state': kerala, 'district': ernakulam, 'city': kochi, 'area': area(kochi, 'Kalamassery')},
            'edappally': {'country': india, 'state': kerala, 'district': ernakulam, 'city': kochi, 'area': area(kochi, 'Edappally')},
            'mg_road': {'country': india, 'state': kerala, 'district': ernakulam, 'city': kochi, 'area': area(kochi, 'MG Road')},
            'fort_kochi': {'country': india, 'state': kerala, 'district': ernakulam, 'city': kochi, 'area': area(kochi, 'Fort Kochi')},
            'palarivattom': {'country': india, 'state': kerala, 'district': ernakulam, 'city': kochi, 'area': area(kochi, 'Palarivattom')},
            'vyttila': {'country': india, 'state': kerala, 'district': ernakulam, 'city': kochi, 'area': area(kochi, 'Vyttila')},
            'panampilly': {'country': india, 'state': kerala, 'district': ernakulam, 'city': kochi, 'area': area(kochi, 'Panampilly Nagar')},
            'maradu': {'country': india, 'state': kerala, 'district': ernakulam, 'city': kochi, 'area': area(kochi, 'Maradu')},
            'kaloor': {'country': india, 'state': kerala, 'district': ernakulam, 'city': kochi, 'area': area(kochi, 'Kaloor')},
            'koramangala': {'country': india, 'state': karnataka, 'district': blr_d, 'city': blr, 'area': area(blr, 'Koramangala')},
            'indiranagar': {'country': india, 'state': karnataka, 'district': blr_d, 'city': blr, 'area': area(blr, 'Indiranagar')},
            'whitefield': {'country': india, 'state': karnataka, 'district': blr_d, 'city': blr, 'area': area(blr, 'Whitefield')},
            'kazhakoottam': {'country': india, 'state': kerala, 'district': tvm_d, 'city': tvm, 'area': area(tvm, 'Kazhakoottam')},
            'kozhikode_beach': {'country': india, 'state': kerala, 'district': kozhikode_d, 'city': calicut, 'area': area(calicut, 'Beach Road')},
            'thrissur_round': {'country': india, 'state': kerala, 'district': thrissur_d, 'city': thrissur, 'area': area(thrissur, 'Round South')},
        }
        self.stdout.write(f'  Geo: {len(geo)} areas ensured')
        return geo

    # ── Property Types ─────────────────────────────────────────────
    def _ensure_property_types(self):
        from properties.models import PropertyType
        names = ['Apartment / Flat', 'House / Villa', 'Commercial', 'Hostel Space',
                 'PG / Co-Living', 'Plot / Land', 'Commercial Unit', 'Shared Room', 'Flat Share']
        for name in names:
            PropertyType.objects.get_or_create(name=name)
        self.stdout.write(f'  Property types: {len(names)} ensured')

    # ── Fix missing coordinates ────────────────────────────────────
    def _fix_coordinates(self):
        from properties.models import Property
        COORD_FIXES = {
            15: (10.0159, 76.3067),   # Apartmnent -> Kakkanad
            6: (10.0136, 76.3566),    # Infopark Studio
            7: (10.0234, 76.3097),    # Edappally 2BHK
            8: (9.9686, 76.3200),     # Vyttila Flat Share
            9: (10.0033, 76.3083),    # Palarivattom PG
            10: (9.9667, 76.2400),    # Fort Kochi Villa
            11: (9.9933, 76.2933),    # Kaloor Studio
            12: (9.9600, 76.2950),    # Panampilly Luxury
            13: (9.9460, 76.3450),    # Thrippunithura Villa
            3: (9.9317, 76.3164),     # Lakeview PG
            4: (12.9352, 77.6245),    # City Nest Hostel
            5: (8.5475, 76.8800),     # Orchid Heights
        }
        count = 0
        for pid, (lat, lng) in COORD_FIXES.items():
            try:
                p = Property.objects.get(id=pid)
                if not p.latitude or not p.longitude:
                    p.latitude = Decimal(str(lat))
                    p.longitude = Decimal(str(lng))
                    p.save(update_fields=['latitude', 'longitude'])
                    count += 1
            except Property.DoesNotExist:
                pass
        self.stdout.write(f'  Coordinates fixed: {count} properties')

    # ── Add missing property types ─────────────────────────────────
    def _add_missing_properties(self, users, geo):
        from properties.models import Property, PropertyType, PropertyMedia, HostelConfig, HostelRoom, HostelBed
        from properties.models import HostelPhoto
        from django.core.files.storage import default_storage

        landlord = users['landlord@mynilam.com']
        hostel_admin = users['hosteladmin@mynilam.com']
        tenant = users['tenant@mynilam.com']
        admin = users['admin@mynilam.com']

        PROPS = [
            # ── Hostels ────────────────────────────────────────────
            {
                'title': 'TechStay Boys Hostel — Infopark Kochi',
                'desc': 'Premium hostel for IT professionals near Infopark. AC rooms, 100 Mbps WiFi, mess with North & South Indian food, laundry, 24/7 security. Single, double, and triple sharing.',
                'price': 6500, 'type': 'Hostel Space', 'purpose': 'Rent',
                'beds': 1, 'baths': 1, 'area': 120, 'geo': 'kakkanad',
                'addr': 'Infopark Back Gate, Kakkanad', 'landmark': 'Opposite Forum Mall',
                'lat': 10.0100, 'lng': 76.3100, 'owner': hostel_admin,
                'specs': {'total_rooms': 40, 'num_beds': 120, 'preferred_tenant': 'bachelors', 'preferred_gender': 'male',
                          'sharing_occupancy': '2', 'food_included': True, 'wifi_available': True, 'ac_available': True,
                          'laundry_available': True, 'water_source': 'both', 'power_backup': 'full', 'parking': 'bike',
                          'security_features': ['cctv', 'guard', 'intercom']},
            },
            {
                'title': 'Sakhi Ladies PG — Palarivattom Kochi',
                'desc': 'Safe and comfortable PG for women professionals. Homely food, AC rooms, WiFi, CCTV. Walking distance to Palarivattom metro.',
                'price': 5500, 'type': 'PG / Co-Living', 'purpose': 'Rent',
                'beds': 1, 'baths': 1, 'area': 100, 'geo': 'palarivattom',
                'addr': 'Palarivattom Junction Road', 'landmark': 'Near Palarivattom Metro',
                'lat': 10.0076, 'lng': 76.3062, 'owner': hostel_admin,
                'specs': {'total_rooms': 25, 'num_beds': 60, 'preferred_tenant': 'bachelors', 'preferred_gender': 'female',
                          'sharing_occupancy': '2', 'food_included': True, 'wifi_available': True, 'ac_available': True,
                          'laundry_available': True, 'water_source': 'municipal', 'power_backup': 'full',
                          'security_features': ['cctv', 'guard']},
            },
            {
                'title': 'Zolo Stays Men\'s PG — Koramangala Bengaluru',
                'desc': 'Men\'s PG with single, double, triple sharing. 3 meals + snacks, WiFi, housekeeping, gym. 5 min walk from Koramangala 4th Block.',
                'price': 8000, 'type': 'PG / Co-Living', 'purpose': 'Rent',
                'beds': 1, 'baths': 1, 'area': 80, 'geo': 'koramangala',
                'addr': '4th Block, Koramangala', 'landmark': 'Near Jyoti Nivas College',
                'lat': 12.9352, 'lng': 77.6245, 'owner': tenant,
                'specs': {'total_rooms': 30, 'num_beds': 80, 'preferred_tenant': 'bachelors', 'preferred_gender': 'male',
                          'sharing_occupancy': '3', 'food_included': True, 'wifi_available': True, 'ac_available': True,
                          'laundry_available': True},
            },
            {
                'title': 'City Central Hostel — Near Ernakulam Station',
                'desc': 'Budget hostel 500m from Ernakulam South Railway Station. Shared and private rooms. Common kitchen and TV lounge.',
                'price': 4000, 'type': 'Hostel Space', 'purpose': 'Rent',
                'beds': 1, 'baths': 1, 'area': 90, 'geo': 'mg_road',
                'addr': 'Shanmugham Road, Ernakulam', 'landmark': 'Near Ernakulam South Station',
                'lat': 9.9650, 'lng': 76.2900, 'owner': hostel_admin,
                'specs': {'total_rooms': 20, 'num_beds': 60, 'preferred_tenant': 'any', 'preferred_gender': 'any',
                          'sharing_occupancy': '3', 'food_included': False, 'wifi_available': True, 'ac_available': False,
                          'laundry_available': False},
            },

            # ── Roommate ───────────────────────────────────────────
            {
                'title': 'Looking for Flatmate — Edappally 2BHK',
                'desc': 'Clean, non-smoking flatmate needed for 2BHK near Edappally. Rent split equally. Fridge, washing machine, WiFi included. Near Lulu Mall.',
                'price': 9000, 'type': 'Flat Share', 'purpose': 'Roommate',
                'beds': 1, 'bathrooms': 1, 'area': 800, 'geo': 'edappally',
                'addr': 'Edappally Junction', 'landmark': 'Near Lulu Mall',
                'lat': 10.0265, 'lng': 76.3082, 'owner': tenant,
                'specs': {'preferred_tenant': 'bachelors', 'preferred_gender': 'any', 'wifi_available': True},
            },
            {
                'title': 'Roommate Needed — Koramangala 5th Block, Bengaluru',
                'desc': 'Fun, responsible flatmate for 2BHK in Koramangala. Balcony, good WiFi, walking distance to cafes. Non-smoker preferred.',
                'price': 12000, 'type': 'Flat Share', 'purpose': 'Roommate',
                'beds': 1, 'bathrooms': 1, 'area': 900, 'geo': 'koramangala',
                'addr': '5th Block, Koramangala', 'landmark': 'Near 100 Feet Road',
                'lat': 12.9340, 'lng': 77.6200, 'owner': tenant,
                'specs': {'preferred_tenant': 'bachelors', 'preferred_gender': 'any', 'wifi_available': True},
            },

            # ── For Sale ───────────────────────────────────────────
            {
                'title': 'Luxury 3BHK Flat — Panampilly Nagar (For Sale)',
                'desc': 'Premium 3BHK with Italian marble, smart home, infinity pool, dedicated parking. Walking to MG Road & Marine Drive.',
                'price': 8500000, 'type': 'Apartment / Flat', 'purpose': 'Sale',
                'bedrooms': 3, 'bathrooms': 3, 'area': 1850, 'geo': 'panampilly',
                'addr': 'Panampilly Nagar Main Road', 'landmark': 'Near Oberoi Hotel',
                'lat': 9.9680, 'lng': 76.2890, 'owner': landlord,
                'specs': {'total_rooms': 5, 'furniture_list': ['AC', 'Sofa', 'Dining Table', 'TV', 'Wardrobe', 'Washing Machine'],
                          'num_beds': 3, 'water_source': 'municipal', 'power_backup': 'full', 'parking': 'car-covered',
                          'gated_community': True, 'security_features': ['cctv', 'guard', 'intercom', 'fire']},
            },
            {
                'title': 'Residential Plot — Kazhakoottam 4 Cents (For Sale)',
                'desc': 'Prime residential plot in Kazhakoottam. 4 cents. Clear title, DTCP approved. Near Technopark and NH bypass.',
                'price': 3500000, 'type': 'Plot / Land', 'purpose': 'Sale',
                'bedrooms': None, 'bathrooms': None, 'area': 1728, 'geo': 'kazhakoottam',
                'addr': 'Kazhakoottam Main Road', 'landmark': 'Near Technopark Phase 3',
                'lat': 8.5570, 'lng': 76.8830, 'owner': landlord, 'specs': {},
            },
            {
                'title': 'Heritage Nalukettu — Fort Kochi (For Sale)',
                'desc': 'Traditional Kerala nalukettu (courtyard house). Restored teak wood architecture, spacious courtyard, tropical garden.',
                'price': 12000000, 'type': 'House / Villa', 'purpose': 'Sale',
                'bedrooms': 4, 'bathrooms': 3, 'area': 2800, 'geo': 'fort_kochi',
                'addr': 'Bazaar Road, Fort Kochi', 'landmark': 'Near Chinese Fishing Nets',
                'lat': 9.9676, 'lng': 76.2334, 'owner': admin,
                'specs': {'total_rooms': 7, 'water_source': 'both', 'power_backup': 'partial', 'parking': 'car-open'},
            },
            {
                'title': 'Independent Villa with Pool — Thripunithura',
                'desc': 'Beautiful 4BHK villa with private pool, landscaped garden, double garage. Peaceful residential area.',
                'price': 45000, 'type': 'House / Villa', 'purpose': 'Rent',
                'bedrooms': 4, 'bathrooms': 4, 'area': 3200, 'geo': 'maradu',
                'addr': 'Hill Palace Road, Thripunithura', 'landmark': 'Near Hill Palace Museum',
                'lat': 9.9520, 'lng': 76.3420, 'owner': landlord,
                'specs': {'total_rooms': 7, 'water_source': 'both', 'power_backup': 'partial', 'parking': 'car-covered'},
            },

            # ── Commercial ─────────────────────────────────────────
            {
                'title': 'Grade A Office Space — Infopark SmartSpace',
                'desc': 'Ready-to-move office. 2400 sqft, AC, server room, conference room, pantry. 24/7 security and power.',
                'price': 250000, 'type': 'Commercial Unit', 'purpose': 'Rent',
                'bedrooms': None, 'bathrooms': 2, 'area': 2400, 'geo': 'kakkanad',
                'addr': 'SmartSpace, Infopark Phase 2', 'landmark': 'Near SmartCity',
                'lat': 10.0080, 'lng': 76.3120, 'owner': admin,
                'specs': {'water_source': 'municipal', 'power_backup': 'full', 'parking': 'car-covered',
                          'gated_community': True, 'security_features': ['cctv', 'guard', 'intercom', 'fire']},
            },

            # ── More Kochi apartments ──────────────────────────────
            {
                'title': 'Modern 2BHK — Kalamassery Metro',
                'desc': 'Well-maintained 2BHK near Kalamassery metro. Semi-furnished with modular kitchen. Quiet neighborhood.',
                'price': 15000, 'type': 'Apartment / Flat', 'purpose': 'Rent',
                'bedrooms': 2, 'bathrooms': 1, 'area': 900, 'geo': 'kalamassery',
                'addr': 'Kalamassery Town', 'landmark': 'Near Kalamassery Metro',
                'lat': 10.0200, 'lng': 76.3300, 'owner': landlord,
                'specs': {'water_source': 'municipal', 'power_backup': 'partial', 'parking': 'bike'},
            },
            {
                'title': 'Beach View 1BHK — Kozhikode Beach Road',
                'desc': 'Cozy 1BHK with sea view. Fully furnished. Steps from Kozhikode Beach. Perfect for a single professional.',
                'price': 11000, 'type': 'Apartment / Flat', 'purpose': 'Rent',
                'bedrooms': 1, 'bathrooms': 1, 'area': 500, 'geo': 'kozhikode_beach',
                'addr': 'Beach Road, Kozhikode', 'landmark': 'Near SM Street',
                'lat': 11.2588, 'lng': 75.7804, 'owner': landlord,
                'specs': {'total_rooms': 2, 'water_source': 'municipal', 'parking': 'bike'},
            },
            {
                'title': 'Spacious 3BHK — Thrissur Round South',
                'desc': 'Family-friendly 3BHK in the heart of Thrissur. Near Sobha City Mall and Thrissur Round. Good schools nearby.',
                'price': 20000, 'type': 'Apartment / Flat', 'purpose': 'Rent',
                'bedrooms': 3, 'bathrooms': 2, 'area': 1400, 'geo': 'thrissur_round',
                'addr': 'Round South, Thrissur', 'landmark': 'Near Sobha City Mall',
                'lat': 10.5155, 'lng': 76.2140, 'owner': landlord,
                'specs': {'total_rooms': 5, 'water_source': 'municipal', 'power_backup': 'partial', 'parking': 'car-covered'},
            },
            {
                'title': 'Premium 2BHK — Whitefield Bengaluru',
                'desc': 'Fully furnished 2BHK in Whitefield IT corridor. Near ITPL, VMware, SAP offices. Gym and pool in complex.',
                'price': 28000, 'type': 'Apartment / Flat', 'purpose': 'Rent',
                'bedrooms': 2, 'bathrooms': 2, 'area': 1200, 'geo': 'whitefield',
                'addr': 'Whitefield Main Road', 'landmark': 'Near ITPL',
                'lat': 12.9698, 'lng': 77.7500, 'owner': landlord,
                'specs': {'total_rooms': 4, 'furniture_list': ['AC', 'Wardrobe', 'Washing Machine'],
                          'num_beds': 2, 'water_source': 'municipal', 'power_backup': 'full',
                          'parking': 'car-covered', 'gated_community': True,
                          'security_features': ['cctv', 'guard', 'intercom']},
            },
        ]

        created = 0
        for p in PROPS:
            title = p['title']
            if Property.objects.filter(title=title).exists():
                continue
            g = geo[p['geo']]
            pt = PropertyType.objects.get(name=p['type'])
            prop = Property.objects.create(
                owner=p['owner'], title=title, description=p['desc'],
                property_type=pt, listing_purpose=p['purpose'],
                country=g['country'], state=g['state'], district=g['district'],
                city=g['city'], area=g['area'],
                address_line_1=p['addr'], landmark=p.get('landmark'),
                price=Decimal(str(p['price'])), currency_code='INR',
                bedrooms=p.get('bedrooms'), bathrooms=p.get('bathrooms') or p.get('baths', 1),
                area_sqft=p.get('area'),
                latitude=Decimal(str(p['lat'])), longitude=Decimal(str(p['lng'])),
                furnishing_status='Furnished', show_contact_details=True,
                available_from=date.today(), listing_status='Active',
                verification_status='Verified', specs=p.get('specs', {}),
            )
            created += 1
            self.stdout.write(f'  + Created: {title[:50]}')

        self.stdout.write(f'  New properties: {created}')

    # ── Ensure hostel configs with rooms & beds ────────────────────
    def _ensure_hostel_configs(self):
        from properties.models import Property, HostelConfig, HostelRoom, HostelBed

        hostel_specs = {
            'TechStay Boys Hostel': {
                'gender': 'boys', 'beds': 120, 'rooms': 40,
                'sharings': ['1', '2', '3'], 'wifi': True, 'mess': True, 'ac': True, 'laundry': True,
                'price': 6500,
            },
            'Sakhi Ladies PG': {
                'gender': 'girls', 'beds': 60, 'rooms': 25,
                'sharings': ['1', '2'], 'wifi': True, 'mess': True, 'ac': True, 'laundry': True,
                'price': 5500,
            },
            'Zolo Stays': {
                'gender': 'boys', 'beds': 80, 'rooms': 30,
                'sharings': ['1', '2', '3'], 'wifi': True, 'mess': True, 'ac': True, 'laundry': True,
                'price': 8000,
            },
            'City Central Hostel': {
                'gender': 'unisex', 'beds': 60, 'rooms': 20,
                'sharings': ['2', '3'], 'wifi': True, 'mess': False, 'ac': False, 'laundry': False,
                'price': 4000,
            },
        }

        count = 0
        for prop in Property.objects.filter(property_type__name__in=['Hostel Space', 'PG / Co-Living']):
            if HostelConfig.objects.filter(property=prop).exists():
                continue

            # Find matching spec
            spec = None
            for key, s in hostel_specs.items():
                if key.lower() in prop.title.lower():
                    spec = s
                    break
            if not spec:
                continue

            price = spec['price']
            config = HostelConfig.objects.create(
                property=prop, hostel_name=prop.title,
                total_bed_spaces=spec['beds'], total_rooms=spec['rooms'],
                bathroom_count=spec['rooms'] // 2, attached_bathrooms=True,
                gender_type=spec['gender'], sharings=spec['sharings'],
                wifi_enabled=spec['wifi'], wifi_speed='100 Mbps',
                hot_water=True, water_filter=True,
                mess_food=spec['mess'], laundry_enabled=spec['laundry'],
                ac_available=spec['ac'], water_source='municipal',
                vacant_beds=spec['beds'] // 3, vacant_rooms=spec['rooms'] // 4,
                price_monthly=Decimal(str(price)),
                hostel_pricing=[
                    {'share': '1', 'rate': price * 1.8},
                    {'share': '2', 'rate': price * 1.3},
                    {'share': '3', 'rate': price},
                ],
                landmark=prop.landmark, street_address=prop.address_line_1,
                parking='bike', preferred_tenant='bachelors',
            )

            # Create rooms & beds
            sharing_types = spec['sharings']
            for floor in range(1, 4):
                for rn in range(1, 7):
                    st = sharing_types[rn % len(sharing_types)]
                    is_ac = rn % 3 == 0
                    room = HostelRoom.objects.create(
                        hostel_config=config, room_number=f'{floor}{rn:02d}',
                        floor_number=floor, sharing_type=st,
                        monthly_rate=Decimal(str(price)) * (Decimal('1.2') if is_ac else Decimal('1')),
                        is_ac=is_ac, has_attached_bathroom=floor > 1,
                    )
                    bed_count = int(st) if st.isdigit() else 4
                    for b in range(bed_count):
                        HostelBed.objects.create(
                            room=room, bed_name=f'Bed {chr(65 + b)}',
                            bed_status='Vacant' if b < bed_count - 1 else 'Occupied',
                        )
            count += 1
            self.stdout.write(f'  [HOSTEL] {prop.title}: {spec["rooms"]} rooms, {spec["beds"]} beds')

        self.stdout.write(f'  Hostel configs created: {count}')

    # ── Property media ─────────────────────────────────────────────
    def _ensure_property_media(self):
        from properties.models import Property, PropertyMedia

        IMAGES = {
            'TechStay Boys': ['https://images.unsplash.com/photo-1555854877-bab0e564b8d5?w=800', 'https://images.unsplash.com/photo-1522771739844-6a9f6d5f14af?w=800', 'https://images.unsplash.com/photo-1584132967334-10e028bd69f7?w=800'],
            'Sakhi Ladies': ['https://images.unsplash.com/photo-1595526114035-0d45ed16cfbf?w=800', 'https://images.unsplash.com/photo-1540518614846-7eded433c457?w=800'],
            'Zolo Stays': ['https://images.unsplash.com/photo-1555854877-bab0e564b8d5?w=800', 'https://images.unsplash.com/photo-1595526114035-0d45ed16cfbf?w=800'],
            'City Central': ['https://images.unsplash.com/photo-1522771739844-6a9f6d5f14af?w=800'],
            'Looking for Flatmate': ['https://images.unsplash.com/photo-1522708323590-d24dbb6b0267?w=800', 'https://images.unsplash.com/photo-1502672260266-1c1ef2d93688?w=800'],
            'Roommate Needed': ['https://images.unsplash.com/photo-1502672260266-1c1ef2d93688?w=800'],
            'Luxury 3BHK': ['https://images.unsplash.com/photo-1560448204-e02f11c3d0e2?w=800', 'https://images.unsplash.com/photo-1600607687939-ce8a6c25118c?w=800', 'https://images.unsplash.com/photo-1522708323590-d24dbb6b0267?w=800'],
            'Residential Plot': ['https://images.unsplash.com/photo-1500382017468-9049fed747ef?w=800'],
            'Heritage Nalukettu': ['https://images.unsplash.com/photo-1564013799919-ab600027ffc6?w=800', 'https://images.unsplash.com/photo-1600585154340-be6161a56a0c?w=800'],
            'Villa with Pool': ['https://images.unsplash.com/photo-1564013799919-ab600027ffc6?w=800', 'https://images.unsplash.com/photo-1600596542815-ffad4c1539a9?w=800'],
            'Office Space': ['https://images.unsplash.com/photo-1497366216548-37526070297c?w=800', 'https://images.unsplash.com/photo-1497366811353-6870744d04b2?w=800'],
            '2BHK Kalamassery': ['https://images.unsplash.com/photo-1502672260266-1c1ef2d93688?w=800'],
            'Beach View 1BHK': ['https://images.unsplash.com/photo-1560448204-e02f11c3d0e2?w=800'],
            '3BHK Thrissur': ['https://images.unsplash.com/photo-1522708323590-d24dbb6b0267?w=800'],
            'Premium 2BHK Whitefield': ['https://images.unsplash.com/photo-1560448204-e02f11c3d0e2?w=800', 'https://images.unsplash.com/photo-1502672260266-1c1ef2d93688?w=800'],
            'Modern 2BHK': ['https://images.unsplash.com/photo-1502672260266-1c1ef2d93688?w=800'],
            'Green View Villa': ['https://images.unsplash.com/photo-1564013799919-ab600027ffc6?w=800', 'https://images.unsplash.com/photo-1600596542815-ffad4c1539a9?w=800'],
        }

        count = 0
        for prop in Property.objects.all():
            if prop.media.exists():
                continue
            # Match by title
            for key, imgs in IMAGES.items():
                if key.lower() in prop.title.lower():
                    for i, url in enumerate(imgs):
                        PropertyMedia.objects.create(
                            property=prop, media_type='Image',
                            media_url=url, sort_order=i, is_primary=(i == 0),
                        )
                        count += 1
                    break
            else:
                # Default image for unmatched properties
                PropertyMedia.objects.create(
                    property=prop, media_type='Image',
                    media_url='https://images.unsplash.com/photo-1560448204-e02f11c3d0e2?w=800',
                    sort_order=0, is_primary=True,
                )
                count += 1

        self.stdout.write(f'  Media: {count} images ensured')

    # ── Reviews ────────────────────────────────────────────────────
    def _ensure_reviews(self, users):
        from communications.models import Review
        from properties.models import Property

        landlord = users['landlord@mynilam.com']
        tenant = users['tenant@mynilam.com']

        reviews_data = [
            (tenant, 1, 4, 'Great location near Infopark', 'Well maintained flat. Minor maintenance was handled quickly. Good for IT professionals.'),
            (tenant, 2, 5, 'Beautiful villa with great garden', 'Loved the pool and garden area. Very peaceful neighborhood.'),
            (tenant, 3, 3, 'Decent PG but noisy', 'Food is good but the WiFi is slow during peak hours. AC works well.'),
            (tenant, 7, 4, 'Value for money apartment', 'Good location near Edappally mall. Parking is a bit tight.'),
        ]

        count = 0
        for reviewer, prop_id, rating, title, body in reviews_data:
            if Review.objects.filter(reviewer=reviewer, reviewee_type='Property', reviewee_id=prop_id).exists():
                continue
            Review.objects.create(
                reviewer=reviewer, reviewee_type='Property', reviewee_id=prop_id,
                overall_rating=rating, title=title, body=body,
                status='Published',
            )
            count += 1
        self.stdout.write(f'  Reviews: {count} created')

    # ── Favorites ──────────────────────────────────────────────────
    def _ensure_favorites(self, users):
        from communications.models import Favorite
        from properties.models import Property

        tenant = users['tenant@mynilam.com']
        tenant2 = users['tenant2@mynilam.com']

        favs = [(tenant, 2), (tenant, 7), (tenant, 12), (tenant2, 1), (tenant2, 6)]
        count = 0
        for user, prop_id in favs:
            fav, created = Favorite.objects.get_or_create(user=user, property_id=prop_id)
            if created:
                count += 1
        self.stdout.write(f'  Favorites: {count} created')

    # ── Summary ────────────────────────────────────────────────────
    def _summary(self):
        from properties.models import Property, HostelConfig, HostelRoom, HostelBed

        total = Property.objects.count()
        hostels = Property.objects.filter(property_type__name__in=['Hostel Space', 'PG / Co-Living']).count()
        configs = HostelConfig.objects.count()
        rooms = HostelRoom.objects.count()
        beds = HostelBed.objects.count()

        self.stdout.write(self.style.SUCCESS(
            f'\nAll done!\n'
            f'  Properties: {total} total, {hostels} hostels/PGs\n'
            f'  Hostel configs: {configs} with {rooms} rooms, {beds} beds\n'
            f'\nDemo logins (password: demo1234):\n'
            f'  landlord@mynilam.com  - Landlord (all properties)\n'
            f'  hosteladmin@mynilam.com - Hostel admin\n'
            f'  tenant@mynilam.com    - Tenant\n'
            f'  employee@mynilam.com  - Employee\n'
            f'  admin@mynilam.com     - Super admin'
        ))
