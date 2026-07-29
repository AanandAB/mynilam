import logging
from django.core.management.base import BaseCommand
from properties.models import PropertyType

logger = logging.getLogger(__name__)

class Command(BaseCommand):
    help = 'Seeds the database with default Property Types'

    def handle(self, *args, **kwargs):
        property_types = [
            "Apartment / Flat",
            "House / Villa",
            "Commercial",
            "Hostel Space",
            "PG / Co-Living",
            "Plot / Land",
            "Commercial Unit",
            "Shared Room",
            "Flat Share"
        ]

        self.stdout.write("Seeding Property Types...")
        
        created_count = 0
        for pt_name in property_types:
            obj, created = PropertyType.objects.get_or_create(name=pt_name)
            if created:
                created_count += 1
                self.stdout.write(self.style.SUCCESS(f'Created Property Type: "{pt_name}"'))
            else:
                self.stdout.write(self.style.WARNING(f'Property Type already exists: "{pt_name}"'))
                
        self.stdout.write(self.style.SUCCESS(f"Finished! Successfully created {created_count} new Property Types."))
