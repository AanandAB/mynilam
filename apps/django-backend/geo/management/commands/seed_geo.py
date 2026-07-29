import urllib.request
import json
from django.core.management.base import BaseCommand
from geo.models import Country, State, District, City

class Command(BaseCommand):
    help = 'Seeds India and GCC Countries, States, Districts, and Cities'

    def handle(self, *args, **options):
        # 1. Seed India
        self.stdout.write("Fetching India GEO seeding data from GitHub...")
        url = "https://raw.githubusercontent.com/sab99r/Indian-States-And-Districts/master/states-and-districts.json"
        
        try:
            req = urllib.request.Request(
                url, 
                headers={'User-Agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64)'}
            )
            with urllib.request.urlopen(req) as response:
                raw_data = response.read().decode('utf-8')
                data = json.loads(raw_data)
        except Exception as e:
            self.stdout.write(self.style.ERROR(f"Failed to fetch India data: {e}"))
            data = None

        country_count = 0
        state_count = 0
        district_count = 0
        city_count = 0

        if data:
            self.stdout.write("Seeding India country, states, and cities...")
            india, created = Country.objects.get_or_create(
                name="India",
                defaults={"country_code": "IN", "currency_code": "INR", "phone_code": "+91"}
            )
            if created:
                country_count += 1

            states_list = data.get("states", [])
            for state_data in states_list:
                state_name = state_data.get("state")
                state_obj, state_created = State.objects.get_or_create(
                    country=india,
                    name=state_name
                )
                if state_created:
                    state_count += 1

                districts = state_data.get("districts", [])
                for dist_name in districts:
                    dist_obj, dist_created = District.objects.get_or_create(
                        state=state_obj,
                        name=dist_name
                    )
                    if dist_created:
                        district_count += 1

                    city_obj, city_created = City.objects.get_or_create(
                        district=dist_obj,
                        name=dist_name
                    )
                    if city_created:
                        city_count += 1

        # 2. Seed GCC Countries
        self.stdout.write("Seeding GCC Countries, states, and cities...")
        gcc_data = {
            "United Arab Emirates": {
                "code": "AE", "currency": "AED", "phone": "+971",
                "states": {
                    "Abu Dhabi": ["Abu Dhabi", "Al Ain", "Al Dhafra"],
                    "Dubai": ["Dubai", "Hatta"],
                    "Sharjah": ["Sharjah", "Khor Fakkan", "Kalba"],
                    "Ajman": ["Ajman", "Masfout"],
                    "Umm Al Quwain": ["Umm Al Quwain"],
                    "Ras Al Khaimah": ["Ras Al Khaimah"],
                    "Fujairah": ["Fujairah", "Dibba Al-Fujairah"]
                }
            },
            "Saudi Arabia": {
                "code": "SA", "currency": "SAR", "phone": "+966",
                "states": {
                    "Riyadh": ["Riyadh", "Al Kharj", "Ad Diriyah"],
                    "Makkah": ["Mecca", "Jeddah", "Taif"],
                    "Eastern Province": ["Dammam", "Khobar", "Jubail", "Al Ahsa"],
                    "Madinah": ["Medina", "Yanbu"],
                    "Asir": ["Abha", "Khamis Mushait"],
                    "Tabuk": ["Tabuk"]
                }
            },
            "Qatar": {
                "code": "QA", "currency": "QAR", "phone": "+974",
                "states": {
                    "Doha": ["Doha"],
                    "Al Rayyan": ["Al Rayyan"],
                    "Al Wakra": ["Al Wakra"],
                    "Al Khor": ["Al Khor"],
                    "Umm Salal": ["Umm Salal"],
                    "Al Daayen": ["Al Daayen"]
                }
            },
            "Kuwait": {
                "code": "KW", "currency": "KWD", "phone": "+965",
                "states": {
                    "Capital": ["Kuwait City"],
                    "Hawally": ["Hawally", "Salmiya"],
                    "Farwaniya": ["Farwaniya"],
                    "Ahmadi": ["Ahmadi", "Fahaheel"],
                    "Jahra": ["Jahra"]
                }
            },
            "Bahrain": {
                "code": "BH", "currency": "BHD", "phone": "+973",
                "states": {
                    "Capital": ["Manama"],
                    "Muharraq": ["Muharraq"],
                    "Northern": ["Hamad Town"],
                    "Southern": ["Riffa"]
                }
            },
            "Oman": {
                "code": "OM", "currency": "OMR", "phone": "+968",
                "states": {
                    "Muscat": ["Muscat", "Seeb", "Bawshar"],
                    "Dhofar": ["Salalah"],
                    "Al Buraimi": ["Al Buraimi"],
                    "Ad Dakhiliyah": ["Nizwa"],
                    "Al Batinah North": ["Sohar"],
                    "Ash Sharqiyah South": ["Sur"]
                }
            }
        }

        for country_name, details in gcc_data.items():
            country_obj, created = Country.objects.get_or_create(
                name=country_name,
                defaults={
                    "country_code": details["code"],
                    "currency_code": details["currency"],
                    "phone_code": details["phone"]
                }
            )
            if created:
                country_count += 1

            for state_name, cities in details["states"].items():
                state_obj, state_created = State.objects.get_or_create(
                    country=country_obj,
                    name=state_name
                )
                if state_created:
                    state_count += 1

                for city_name in cities:
                    # In GCC dataset we use city name for both district and city models
                    dist_obj, dist_created = District.objects.get_or_create(
                        state=state_obj,
                        name=city_name
                    )
                    if dist_created:
                        district_count += 1

                    city_obj, city_created = City.objects.get_or_create(
                        district=dist_obj,
                        name=city_name
                    )
                    if city_created:
                        city_count += 1

        self.stdout.write(self.style.SUCCESS(
            f"Successfully seeded GEO data:\n"
            f"  Countries: {country_count}\n"
            f"  States: {state_count}\n"
            f"  Districts: {district_count}\n"
            f"  Cities: {city_count}"
        ))
