"""
Seed demo data for manual testing of every feature.

Creates a full, connected dataset so each dashboard tab has real rows to render:
users (landlord / tenants / employee), geo, property types, properties (with map
coordinates, clustered around Kochi, Kerala), the lease lifecycle
(applications → contracts → payments → invoices), maintenance requests in every
status, and communications (conversations, messages, notifications, reviews,
favorites, saved searches, inquiries).

Idempotent: reference data (roles, geo, types, users, properties) use
get_or_create and coordinates are re-applied on every run; the relational block
is skipped if it was already seeded.

Usage:
    .venv/Scripts/python.exe manage.py seed_demo_data

Demo logins (password for all: demo1234):
    landlord@mynilam.com   (normal — owns 13 properties, mostly in Kochi)
    tenant@mynilam.com     (normal — leases "Sunset Residency 2BHK")
    tenant2@mynilam.com    (normal — leases "Orchid Heights 3BHK")
    employee@mynilam.com   (employee — verifies listings)

Note on the map: exact coordinates are only revealed by the backend to the
property owner / staff, or to a user with an Accepted inquiry or an active
conversation about that property (see properties/selectors.py
can_see_exact_location). Log in as landlord or admin to see all Kochi markers.
"""
from datetime import date, timedelta
from decimal import Decimal

from django.contrib.auth import get_user_model
from django.core.management.base import BaseCommand
from django.utils import timezone

from accounts.models import Role, UserRole
from geo.models import Area, City, Country, District, Locality, State
from properties.models import Property, PropertyType, HostelConfig, HostelRoom, HostelBed, PropertyMedia
from leases.models import LeaseApplication, LeaseContract, LeaseInvoice, LeasePayment
from maintenance.models import MaintenanceCategory, MaintenanceRequest
from communications.models import (
    Conversation,
    ConversationParticipant,
    Favorite,
    Inquiry,
    Message,
    Notification,
    Review,
    SavedSearch,
)

User = get_user_model()
DEMO_PASSWORD = 'demo1234'


def _dec(value):
    """Coerce a float/str to Decimal for model DecimalField assignment."""
    return Decimal(str(value))


class Command(BaseCommand):
    help = 'Seed demo data (users, geo, properties, leases, maintenance, chat) for manual testing.'

    def handle(self, *args, **options):
        self.stdout.write(self.style.MIGRATE_HEADING('Seeding demo data…'))

        roles = self._seed_roles()
        geo = self._seed_geo()
        self._seed_property_types()
        users = self._seed_users(roles)

        # Properties are always (re)seeded so new Kochi listings + coordinates land.
        properties = self._seed_properties(users['landlord'], geo)

        # Always seed hostel configs (idempotent)
        self._seed_hostel_configs(properties)

        # Always seed property media (idempotent)
        self._seed_property_media(properties)

        # Relational data is created once (guarded by an existing contract).
        if LeaseContract.objects.exists():
            self.stdout.write(self.style.WARNING('Demo leases already present — skipping relational seed.'))
        else:
            self._seed_leases(users, properties)
            self._seed_maintenance(users, properties)
            self._seed_communications(users, properties)

        # Location-unlock touch-up (idempotent): accept one inquiry so the exact
        # location reveal path is testable for a normal user.
        self._touch_locations(users, properties)

        self._print_summary(users)

    # ------------------------------------------------------------------
    # Roles
    # ------------------------------------------------------------------
    def _seed_roles(self):
        names = {
            'normal': 'Standard user (post listings, lease as tenant or landlord).',
            'employee': 'Staff who verify and moderate listings.',
            'guest': 'Read-only browser.',
            'hostel_admin': 'Operator of a hostel/PG property.',
        }
        roles = {}
        for name, description in names.items():
            role, _ = Role.objects.get_or_create(name=name, defaults={'description': description})
            roles[name] = role
        self.stdout.write(f'  Roles: {len(roles)} ensured.')
        return roles

    # ------------------------------------------------------------------
    # Geo (Country -> State -> District -> City -> Area -> Locality)
    # Coordinates are real so properties show correctly on the Leaflet/OSM map.
    # ------------------------------------------------------------------
    def _seed_geo(self):
        india, _ = Country.objects.get_or_create(
            name='India', defaults={'country_code': 'IN', 'currency_code': 'INR', 'phone_code': '+91'},
        )
        kerala, _ = State.objects.get_or_create(country=india, name='Kerala', defaults={'state_code': 'KL'})
        karnataka, _ = State.objects.get_or_create(country=india, name='Karnataka', defaults={'state_code': 'KA'})

        ernakulam, _ = District.objects.get_or_create(state=kerala, name='Ernakulam')
        tvm_district, _ = District.objects.get_or_create(state=kerala, name='Thiruvananthapuram')
        bengaluru_district, _ = District.objects.get_or_create(state=karnataka, name='Bengaluru Urban')

        def city(district, name, lat, lng):
            obj, _ = City.objects.get_or_create(district=district, name=name)
            if obj.latitude != _dec(lat) or obj.longitude != _dec(lng):
                obj.latitude, obj.longitude = _dec(lat), _dec(lng)
                obj.save(update_fields=['latitude', 'longitude'])
            return obj

        kochi = city(ernakulam, 'Kochi', 9.9312, 76.2673)
        bengaluru = city(bengaluru_district, 'Bengaluru', 12.9716, 77.5946)
        tvm = city(tvm_district, 'Thiruvananthapuram', 8.5241, 76.9366)

        # (city, area_name, locality_name) — multiple areas per city.
        areas = {
            'kakkanad': (kochi, 'Kakkanad', 'Infopark'),
            'maradu': (kochi, 'Maradu', 'Kundannoor'),
            'edappally': (kochi, 'Edappally', 'Lulu Mall'),
            'vytilla': (kochi, 'Vyttila', 'Vyttila Hub'),
            'palarivattom': (kochi, 'Palarivattom', 'Civil Station'),
            'fort_kochi': (kochi, 'Fort Kochi', 'Beach Road'),
            'kaloor': (kochi, 'Kaloor', 'Stadium'),
            'panampilly': (kochi, 'Panampilly Nagar', 'Walkway'),
            'thrippunithura': (kochi, 'Thrippunithura', 'Hill Palace'),
            'indiranagar': (bengaluru, 'Indiranagar', '100 Feet Road'),
            'koramangala': (bengaluru, 'Koramangala', '5th Block'),
            'kazhakoottam': (tvm, 'Kazhakoottam', 'Technopark'),
        }
        geo = {}
        for key, (c, area_name, locality_name) in areas.items():
            area, _ = Area.objects.get_or_create(city=c, name=area_name)
            locality, _ = Locality.objects.get_or_create(area=area, name=locality_name)
            geo[key] = {
                'country': india, 'state': c.district.state, 'district': c.district,
                'city': c, 'area': area, 'locality': locality,
            }
        self.stdout.write(f'  Geo: 3 cities + {len(areas)} areas ensured (with coordinates).')
        return geo

    # ------------------------------------------------------------------
    # Property types
    # ------------------------------------------------------------------
    def _seed_property_types(self):
        names = ['Apartment / Flat', 'House / Villa', 'Commercial', 'Hostel Space',
                 'PG / Co-Living', 'Plot / Land', 'Commercial Unit', 'Shared Room', 'Flat Share']
        for name in names:
            PropertyType.objects.get_or_create(name=name)
        self.stdout.write(f'  Property types: {len(names)} ensured.')

    # ------------------------------------------------------------------
    # Users
    # ------------------------------------------------------------------
    def _seed_users(self, roles):
        def make_user(email, first, last, role_name):
            user, created = User.objects.get_or_create(email=email, defaults={'first_name': first, 'last_name': last})
            if created:
                # get_or_create can't hash the password, so hash it after creation.
                user.set_password(DEMO_PASSWORD)
                user.save()
            if role_name:
                UserRole.objects.get_or_create(user=user, role=roles[role_name])
            return user

        users = {
            'landlord': make_user('landlord@mynilam.com', 'Rahul', 'Menon', 'normal'),
            'tenant': make_user('tenant@mynilam.com', 'Anita', 'Nair', 'normal'),
            'tenant2': make_user('tenant2@mynilam.com', 'Vikram', 'Pillai', 'normal'),
            'employee': make_user('employee@mynilam.com', 'Priya', 'Kumar', 'employee'),
        }
        self.stdout.write(f'  Users: {len(users)} ensured.')
        return users

    # ------------------------------------------------------------------
    # Properties (with map coordinates)
    # ------------------------------------------------------------------
    def _seed_properties(self, landlord, geo):
        # (property_type, title, geo_key, price, bedrooms, listing_status, lat, lng)
        specs = {
            'sunset': ('Apartment / Flat', 'Sunset Residency 2BHK', 'kakkanad', '18000', 2, 'Active', 10.0150, 76.3570),
            'green_view': ('House / Villa', 'Green View Villa', 'indiranagar', '45000', 4, 'Active', 12.9784, 77.6408),
            'lakeview': ('PG / Co-Living', 'Lakeview PG Single Room', 'maradu', '8500', 1, 'Active', 9.9317, 76.3164),
            'city_hostel': ('Hostel Space', 'City Nest Hostel Bed', 'koramangala', '7000', 1, 'Active', 12.9352, 77.6245),
            'orchid': ('Apartment / Flat', 'Orchid Heights 3BHK', 'kazhakoottam', '30000', 3, 'Rented', 8.5475, 76.8800),
            # Extra Kochi listings (spread across the city so the map is populated).
            'infopark_studio': ('Apartment / Flat', 'Infopark Studio Apartment', 'kakkanad', '15000', 1, 'Active', 10.0136, 76.3566),
            'edappally_tower': ('Apartment / Flat', 'Edappally 2BHK Tower', 'edappally', '22000', 2, 'Active', 10.0234, 76.3097),
            'vytilla_share': ('Flat Share', 'Vyttila Flat Share', 'vytilla', '9500', 1, 'Active', 9.9686, 76.3200),
            'palarivattom_pg': ('PG / Co-Living', 'Palarivattom PG Deluxe', 'palarivattom', '7500', 1, 'Active', 10.0033, 76.3083),
            'fort_kochi_villa': ('House / Villa', 'Fort Kochi Heritage Villa', 'fort_kochi', '38000', 3, 'Active', 9.9667, 76.2400),
            'kaloor_studio': ('Apartment / Flat', 'Kaloor Studio', 'kaloor', '13000', 1, 'Active', 9.9933, 76.2933),
            'panampilly_lux': ('Apartment / Flat', 'Panampilly Nagar Luxury 3BHK', 'panampilly', '55000', 3, 'Active', 9.9600, 76.2950),
            'thrippunithura_villa': ('House / Villa', 'Thrippunithura Family Villa', 'thrippunithura', '28000', 3, 'Active', 9.9460, 76.3450),
        }
        props = {}
        for key, (ptype_name, title, geo_key, price, bedrooms, status, lat, lng) in specs.items():
            loc = geo[geo_key]
            ptype = PropertyType.objects.get(name=ptype_name)
            prop, _ = Property.objects.get_or_create(
                owner=landlord,
                title=title,
                defaults={
                    'property_type': ptype,
                    'country': loc['country'],
                    'state': loc['state'],
                    'district': loc['district'],
                    'city': loc['city'],
                    'area': loc['area'],
                    'locality': loc['locality'],
                    'address_line_1': f"{loc['area'].name}, {title}",
                    'listing_purpose': 'Rent',
                    'price': _dec(price),
                    'currency_code': 'INR',
                    'rent_frequency': 'Monthly',
                    'available_from': date.today() + timedelta(days=15),
                    'bedrooms': bedrooms,
                    'bathrooms': max(1, bedrooms - 1),
                    'furnishing_status': 'Furnished',
                    'listing_status': status,
                    'verification_status': 'Verified',
                    'view_count': 120,
                    'latitude': _dec(lat),
                    'longitude': _dec(lng),
                },
            )
            # (Re)apply coordinates even if the row already existed without them.
            if prop.latitude != _dec(lat) or prop.longitude != _dec(lng):
                prop.latitude, prop.longitude = _dec(lat), _dec(lng)
                prop.save(update_fields=['latitude', 'longitude'])
            props[key] = prop
        self.stdout.write(f'  Properties: {len(props)} ensured with map coordinates.')
        return props

    # ------------------------------------------------------------------
    # Leases: applications -> contracts -> payments -> invoices
    # ------------------------------------------------------------------
    def _seed_leases(self, users, props):
        landlord = users['landlord']
        tenant = users['tenant']
        tenant2 = users['tenant2']
        today = date.today()

        LeaseApplication.objects.get_or_create(
            property=props['sunset'], applicant=tenant,
            defaults={'proposed_rent_amount': _dec('18000'),
                      'proposed_move_in_date': today + timedelta(days=30),
                      'proposed_lease_duration_months': 12,
                      'cover_letter': 'Looking for a long-term 2BHK near Infopark.'},
        )
        LeaseApplication.objects.get_or_create(
            property=props['green_view'], applicant=tenant2,
            defaults={'proposed_rent_amount': _dec('45000'),
                      'proposed_move_in_date': today + timedelta(days=45),
                      'proposed_lease_duration_months': 24,
                      'application_status': 'UnderReview'},
        )
        LeaseApplication.objects.get_or_create(
            property=props['orchid'], applicant=tenant2,
            defaults={'proposed_rent_amount': _dec('30000'),
                      'proposed_move_in_date': today - timedelta(days=90),
                      'proposed_lease_duration_months': 12,
                      'application_status': 'Approved',
                      'reviewed_by': landlord,
                      'review_notes': 'Verified employment and references.',
                      'reviewed_at': timezone.now()},
        )
        LeaseApplication.objects.get_or_create(
            property=props['sunset'], applicant=tenant2,
            defaults={'proposed_rent_amount': _dec('17500'),
                      'proposed_move_in_date': today - timedelta(days=120),
                      'proposed_lease_duration_months': 12,
                      'application_status': 'Rejected',
                      'reviewed_by': landlord,
                      'review_notes': 'Offered below asking and no references.',
                      'reviewed_at': timezone.now()},
        )

        sunset_lease, _ = LeaseContract.objects.get_or_create(
            property=props['sunset'], tenant=tenant,
            defaults={'landlord': landlord, 'lease_start_date': today - timedelta(days=180),
                      'lease_end_date': today + timedelta(days=185), 'monthly_rent': _dec('18000'),
                      'currency_code': 'INR', 'security_deposit_amount': _dec('36000'),
                      'payment_day_of_month': 1, 'lease_status': 'Active'},
        )
        orchid_lease, _ = LeaseContract.objects.get_or_create(
            property=props['orchid'], tenant=tenant2,
            defaults={'landlord': landlord, 'lease_start_date': today - timedelta(days=90),
                      'lease_end_date': today + timedelta(days=275), 'monthly_rent': _dec('30000'),
                      'currency_code': 'INR', 'security_deposit_amount': _dec('60000'),
                      'payment_day_of_month': 5, 'lease_status': 'Active'},
        )

        LeasePayment.objects.get_or_create(
            lease=sunset_lease, payment_type='Rent', payment_date=today - timedelta(days=5),
            defaults={'payer': tenant, 'amount': _dec('18000'), 'currency_code': 'INR',
                      'payment_method': 'BankTransfer', 'payment_status': 'Completed',
                      'due_date': today - timedelta(days=5)},
        )
        LeasePayment.objects.get_or_create(
            lease=sunset_lease, payment_type='SecurityDeposit', payment_date=today - timedelta(days=180),
            defaults={'payer': tenant, 'amount': _dec('36000'), 'currency_code': 'INR',
                      'payment_method': 'BankTransfer', 'payment_status': 'Pending',
                      'due_date': today - timedelta(days=180)},
        )
        LeasePayment.objects.get_or_create(
            lease=orchid_lease, payment_type='Rent', payment_date=today - timedelta(days=2),
            defaults={'payer': tenant2, 'amount': _dec('30000'), 'currency_code': 'INR',
                      'payment_method': 'Digital', 'payment_status': 'Completed',
                      'due_date': today - timedelta(days=2)},
        )

        LeaseInvoice.objects.get_or_create(
            lease=sunset_lease, invoice_number='INV-DEMO-0001',
            defaults={'billing_period_start': today - timedelta(days=30), 'billing_period_end': today,
                      'subtotal': _dec('18000'), 'tax_amount': _dec('0'), 'total_amount': _dec('18000'),
                      'currency_code': 'INR', 'due_date': today + timedelta(days=5), 'invoice_status': 'Sent'},
        )
        LeaseInvoice.objects.get_or_create(
            lease=sunset_lease, invoice_number='INV-DEMO-0002',
            defaults={'billing_period_start': today - timedelta(days=60), 'billing_period_end': today - timedelta(days=30),
                      'subtotal': _dec('18000'), 'tax_amount': _dec('0'), 'total_amount': _dec('18000'),
                      'currency_code': 'INR', 'due_date': today - timedelta(days=25), 'invoice_status': 'Paid'},
        )
        LeaseInvoice.objects.get_or_create(
            lease=orchid_lease, invoice_number='INV-DEMO-0003',
            defaults={'billing_period_start': today - timedelta(days=30), 'billing_period_end': today,
                      'subtotal': _dec('30000'), 'tax_amount': _dec('0'), 'total_amount': _dec('30000'),
                      'currency_code': 'INR', 'due_date': today + timedelta(days=10), 'invoice_status': 'Draft'},
        )
        self.stdout.write('  Leases: 4 applications, 2 contracts, 3 payments, 3 invoices.')

    # ------------------------------------------------------------------
    # Maintenance requests (every status)
    # ------------------------------------------------------------------
    def _seed_maintenance(self, users, props):
        tenant = users['tenant']
        employee = users['employee']
        sunset = props['sunset']

        def category(name):
            return MaintenanceCategory.objects.get(name=name)

        requests = [
            {'title': 'Leaky kitchen tap', 'category': 'Plumbing', 'priority': 'High', 'status': 'Submitted',
             'description': 'Kitchen tap drips constantly, wasting water.'},
            {'title': 'AC not cooling', 'category': 'Appliance', 'priority': 'Medium', 'status': 'Acknowledged',
             'description': 'Bedroom AC blows warm air since yesterday.'},
            {'title': 'Power tripping in hall', 'category': 'Electrical', 'priority': 'Urgent', 'status': 'InProgress',
             'description': 'Main breaker trips when both ACs are on.', 'assigned_to': employee,
             'scheduled_date': date.today() + timedelta(days=2)},
            {'title': 'Peeling paint in bedroom', 'category': 'Painting', 'priority': 'Low', 'status': 'OnHold',
             'description': 'Damp patch and peeling paint near the window.'},
            {'title': 'Toilet flush broken', 'category': 'Plumbing', 'priority': 'Medium', 'status': 'Completed',
             'description': 'Flush handle broken in master bathroom.',
             'resolution_notes': 'Replaced flush mechanism.', 'actual_cost': _dec('450'),
             'completed_date': timezone.now() - timedelta(days=3)},
            {'title': 'Fridge making noise', 'category': 'Appliance', 'priority': 'Low', 'status': 'Cancelled',
             'description': 'Fridge hums loudly at night.'},
        ]
        for r in requests:
            lease = LeaseContract.objects.filter(property=sunset, tenant=tenant).first()
            MaintenanceRequest.objects.get_or_create(
                property=sunset, reported_by=tenant, title=r['title'],
                defaults={'lease': lease, 'category': category(r['category']), 'description': r['description'],
                          'priority': r['priority'], 'status': r['status'],
                          'assigned_to': r.get('assigned_to'), 'scheduled_date': r.get('scheduled_date'),
                          'resolution_notes': r.get('resolution_notes'), 'actual_cost': r.get('actual_cost'),
                          'completed_date': r.get('completed_date'), 'currency_code': 'INR'},
            )
        self.stdout.write(f'  Maintenance: {len(requests)} requests across all statuses.')

    # ------------------------------------------------------------------
    # Communications: chat, notifications, reviews, favorites, searches, inquiries
    # ------------------------------------------------------------------
    def _seed_communications(self, users, props):
        landlord = users['landlord']
        tenant = users['tenant']
        tenant2 = users['tenant2']

        def make_conversation(participants, msgs, property=None):
            conv = Conversation.objects.create(conversation_type='General', property=property)
            for u in participants:
                ConversationParticipant.objects.get_or_create(conversation=conv, user=u)
            for sender_email, body in msgs:
                sender = next(u for u in participants if u.email == sender_email)
                Message.objects.create(conversation=conv, sender=sender, body=body, message_type='Text')
            conv.last_message_at = timezone.now()
            conv.save(update_fields=['last_message_at'])
            return conv

        make_conversation([landlord, tenant], [
            ('tenant@mynilam.com', 'Hi! I have a question about the lease renewal.'),
            ('landlord@mynilam.com', 'Sure, happy to help. What would you like to know?'),
            ('tenant@mynilam.com', 'Is the rent staying the same next year?'),
            ('landlord@mynilam.com', 'Yes, ₹18,000/month, no increase for the renewal.'),
            ('tenant@mynilam.com', 'Great, thank you!'),
        ], property=props['sunset'])
        make_conversation([landlord, tenant2], [
            ('tenant2@mynilam.com', 'Could I schedule a visit to Green View Villa?'),
            ('landlord@mynilam.com', 'Of course, Saturday 11am works.'),
            ('tenant2@mynilam.com', 'Perfect, see you then.'),
        ], property=props['green_view'])

        Notification.objects.get_or_create(
            recipient=tenant, notification_type='NewMessage', title='Rahul Menon',
            defaults={'body': 'Yes, ₹18,000/month, no increase for the renewal.',
                      'reference_type': 'Conversation', 'reference_id': 1},
        )
        Notification.objects.get_or_create(
            recipient=tenant, notification_type='PaymentDue', title='Rent due soon',
            defaults={'body': 'Your rent of ₹18,000 is due in 5 days.', 'reference_type': 'LeaseContract', 'reference_id': 1},
        )

        Review.objects.get_or_create(
            reviewer=tenant, reviewee_type='Property', reviewee_id=props['sunset'].id,
            defaults={'overall_rating': 4, 'cleanliness': 5, 'communication': 4, 'value_for_money': 4,
                      'location': 5, 'title': 'Great location and responsive landlord',
                      'body': 'Well maintained flat near Infopark. Minor maintenance was handled quickly.',
                      'status': 'Published'},
        )

        Favorite.objects.get_or_create(user=tenant, property=props['green_view'])

        SavedSearch.objects.get_or_create(
            user=tenant, name='2BHK in Kochi under 20k',
            defaults={'search_criteria': {'city': 'Kochi', 'max_price': 20000, 'bedrooms': 2},
                      'alert_enabled': True, 'alert_frequency': 'Daily'},
        )

        Inquiry.objects.get_or_create(
            property=props['green_view'], sender=tenant2, recipient=landlord,
            defaults={'message': 'Is the villa pet-friendly?', 'phone': '9876543210'},
        )
        self.stdout.write('  Communications: 2 conversations + messages, 2 notifications, 1 review, 1 favorite, 1 saved search, 1 inquiry.')

    # ------------------------------------------------------------------
    # Hostel / PG configs with rooms and beds
    # ------------------------------------------------------------------
    def _seed_hostel_configs(self, props):
        hostel_props = {
            'city_hostel': {
                'hostel_name': 'City Nest Hostel — Koramangala',
                'gender_type': 'boys',
                'total_bed_spaces': 80,
                'total_rooms': 25,
                'sharings': ['1', '2', '3'],
                'wifi_enabled': True, 'wifi_speed': '100 Mbps',
                'hot_water': True, 'water_filter': True,
                'mess_food': True, 'laundry_enabled': True,
                'ac_available': True, 'vacant_beds': 28,
                'price_monthly': 7000,
            },
            'palarivattom_pg': {
                'hostel_name': 'Palarivattom PG Deluxe',
                'gender_type': 'unisex',
                'total_bed_spaces': 60,
                'total_rooms': 20,
                'sharings': ['1', '2', '3'],
                'wifi_enabled': True, 'wifi_speed': '50 Mbps',
                'hot_water': True, 'water_filter': True,
                'mess_food': True, 'laundry_enabled': False,
                'ac_available': True, 'vacant_beds': 18,
                'price_monthly': 7500,
            },
            'lakeview': {
                'hostel_name': 'Lakeview PG — Maradu',
                'gender_type': 'unisex',
                'total_bed_spaces': 40,
                'total_rooms': 15,
                'sharings': ['1', '2'],
                'wifi_enabled': True, 'wifi_speed': '50 Mbps',
                'hot_water': True, 'water_filter': True,
                'mess_food': False, 'laundry_enabled': False,
                'ac_available': False, 'vacant_beds': 12,
                'price_monthly': 8500,
            },
        }
        for key, cfg in hostel_props.items():
            prop = props.get(key)
            if not prop:
                continue
            hostel_config, created = HostelConfig.objects.get_or_create(
                property=prop,
                defaults={
                    'hostel_name': cfg['hostel_name'],
                    'total_bed_spaces': cfg['total_bed_spaces'],
                    'total_rooms': cfg['total_rooms'],
                    'bathroom_count': cfg['total_rooms'] // 2,
                    'attached_bathrooms': True,
                    'gender_type': cfg['gender_type'],
                    'sharings': cfg['sharings'],
                    'wifi_enabled': cfg['wifi_enabled'],
                    'wifi_speed': cfg['wifi_speed'],
                    'hot_water': cfg['hot_water'],
                    'water_filter': cfg['water_filter'],
                    'mess_food': cfg['mess_food'],
                    'laundry_enabled': cfg['laundry_enabled'],
                    'ac_available': cfg['ac_available'],
                    'water_source': 'municipal',
                    'vacant_beds': cfg['vacant_beds'],
                    'vacant_rooms': cfg['total_rooms'] // 4,
                    'price_monthly': Decimal(str(cfg['price_monthly'])),
                    'hostel_pricing': [
                        {'share': '1', 'rate': cfg['price_monthly'] * 1.8},
                        {'share': '2', 'rate': cfg['price_monthly'] * 1.3},
                        {'share': '3', 'rate': cfg['price_monthly']},
                    ],
                    'landmark': prop.landmark,
                    'street_address': prop.address_line_1,
                    'parking': 'bike',
                    'preferred_tenant': 'bachelors',
                },
            )

            # Create rooms with beds (only if no rooms exist yet)
            if not hostel_config.rooms.exists():
                sharing_types = cfg['sharings']
                for floor in range(1, 4):
                    for room_num in range(1, 7):
                        stype = sharing_types[room_num % len(sharing_types)]
                        is_ac = room_num % 3 == 0
                        room = HostelRoom.objects.create(
                            hostel_config=hostel_config,
                            room_number=f'{floor}{room_num:02d}',
                            floor_number=floor,
                            sharing_type=stype,
                            monthly_rate=Decimal(str(cfg['price_monthly'])) * (Decimal('1.2') if is_ac else Decimal('1.0')),
                            is_ac=is_ac,
                            has_attached_bathroom=floor > 1,
                        )
                        bed_count = int(stype) if stype.isdigit() else 4
                        for b in range(bed_count):
                            HostelBed.objects.create(
                                room=room,
                                bed_name=f'Bed {chr(65 + b)}',
                                bed_status='Vacant' if b < bed_count - 1 else 'Occupied',
                            )
                self.stdout.write(f'    [HOSTEL] {cfg["hostel_name"]}: {hostel_config.total_rooms} rooms, {cfg["total_bed_spaces"]} beds')
            else:
                self.stdout.write(f'    [SKIP] Hostel config exists: {cfg["hostel_name"]}')

    # ------------------------------------------------------------------
    # Property media (images)
    # ------------------------------------------------------------------
    def _seed_property_media(self, props):
        IMAGES = {
            'sunset': [
                'https://images.unsplash.com/photo-1522708323590-d24dbb6b0267?w=800',
                'https://images.unsplash.com/photo-1502672260266-1c1ef2d93688?w=800',
                'https://images.unsplash.com/photo-1560448204-e02f11c3d0e2?w=800',
            ],
            'green_view': [
                'https://images.unsplash.com/photo-1564013799919-ab600027ffc6?w=800',
                'https://images.unsplash.com/photo-1600596542815-ffad4c1539a9?w=800',
            ],
            'city_hostel': [
                'https://images.unsplash.com/photo-1555854877-bab0e564b8d5?w=800',
                'https://images.unsplash.com/photo-1522771739844-6a9f6d5f14af?w=800',
                'https://images.unsplash.com/photo-1584132967334-10e028bd69f7?w=800',
            ],
            'lakeview': [
                'https://images.unsplash.com/photo-1595526114035-0d45ed16cfbf?w=800',
                'https://images.unsplash.com/photo-1540518614846-7eded433c457?w=800',
            ],
            'orchid': [
                'https://images.unsplash.com/photo-1522708323590-d24dbb6b0267?w=800',
                'https://images.unsplash.com/photo-1560448204-e02f11c3d0e2?w=800',
            ],
            'infopark_studio': [
                'https://images.unsplash.com/photo-1502672260266-1c1ef2d93688?w=800',
            ],
            'edappally_tower': [
                'https://images.unsplash.com/photo-1560448204-e02f11c3d0e2?w=800',
            ],
            'vytilla_share': [
                'https://images.unsplash.com/photo-1522708323590-d24dbb6b0267?w=800',
            ],
            'palarivattom_pg': [
                'https://images.unsplash.com/photo-1595526114035-0d45ed16cfbf?w=800',
                'https://images.unsplash.com/photo-1555854877-bab0e564b8d5?w=800',
            ],
            'fort_kochi_villa': [
                'https://images.unsplash.com/photo-1564013799919-ab600027ffc6?w=800',
                'https://images.unsplash.com/photo-1600585154340-be6161a56a0c?w=800',
            ],
            'kaloor_studio': [
                'https://images.unsplash.com/photo-1502672260266-1c1ef2d93688?w=800',
            ],
            'panampilly_lux': [
                'https://images.unsplash.com/photo-1560448204-e02f11c3d0e2?w=800',
                'https://images.unsplash.com/photo-1600607687939-ce8a6c25118c?w=800',
                'https://images.unsplash.com/photo-1522708323590-d24dbb6b0267?w=800',
            ],
            'thrippunithura_villa': [
                'https://images.unsplash.com/photo-1564013799919-ab600027ffc6?w=800',
                'https://images.unsplash.com/photo-1600596542815-ffad4c1539a9?w=800',
            ],
        }
        count = 0
        for key, images in IMAGES.items():
            prop = props.get(key)
            if not prop:
                continue
            if prop.media.exists():
                continue
            for i, url in enumerate(images):
                PropertyMedia.objects.create(
                    property=prop,
                    media_type='Image',
                    media_url=url,
                    sort_order=i,
                    is_primary=(i == 0),
                )
                count += 1
        self.stdout.write(f'  Property media: {count} images added.')

    # ------------------------------------------------------------------
    # Location-unlock touch-up (idempotent)
    # ------------------------------------------------------------------
    def _touch_locations(self, users, properties):
        # Accept the tenant2 -> Green View Villa inquiry so a normal user can see
        # that property's exact location (exercises can_see_exact_location).
        Inquiry.objects.filter(
            property=properties['green_view'], sender=users['tenant2']
        ).update(inquiry_status='Accepted')

    # ------------------------------------------------------------------
    def _print_summary(self, users):
        self.stdout.write(self.style.SUCCESS('\nDemo data seeded successfully.'))
        self.stdout.write('\nDemo logins (password for all: %s):' % DEMO_PASSWORD)
        self.stdout.write('  landlord@mynilam.com   — landlord (owns 13 properties, mostly Kochi)')
        self.stdout.write('  tenant@mynilam.com     — tenant (leases Sunset Residency 2BHK)')
        self.stdout.write('  tenant2@mynilam.com    — tenant (leases Orchid Heights 3BHK)')
        self.stdout.write('  employee@mynilam.com   — employee (verify listings)')
        self.stdout.write('  admin@mynilam.com      — super_admin (existing)')
        self.stdout.write('\nTip: log in as landlord or admin to see all Kochi markers on the property map.')
