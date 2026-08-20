"""Seed the default MaintenanceCategory rows (idempotent).

Usage:
    .venv/Scripts/python.exe manage.py seed_maintenance_categories

Creates any missing categories and never deletes existing ones, so it is safe to
run repeatedly. A fresh install should run this once so the "Raise a request"
form has categories to pick from.
"""
from django.core.management.base import BaseCommand

from maintenance.models import MaintenanceCategory


DEFAULT_CATEGORIES = [
    ("Plumbing", "Leaks, blocked drains, taps, water heaters, toilets"),
    ("Electrical", "Wiring, switches, sockets, fans, lights, power trips"),
    ("Appliance", "AC, fridge, washing machine, geyser, kitchen appliances"),
    ("Structural", "Cracks, doors, windows, locks, flooring, roofing"),
    ("Painting", "Wall paint, damp/peeling, touch-ups"),
    ("Pest Control", "Insects, rodents, termites, fumigation"),
    ("Cleaning", "Common areas, deep cleaning, waste disposal"),
    ("Security", "CCTV, door locks, intercom, gate access"),
    ("Furniture", "Beds, wardrobes, sofas, tables, fixtures"),
    ("Internet / Network", "Wi-Fi, router, broadband, signal issues"),
    ("Other", "Anything not covered above"),
]


class Command(BaseCommand):
    help = "Seed default maintenance categories (creates missing ones, never deletes)."

    def handle(self, *args, **options):
        created = 0
        for name, description in DEFAULT_CATEGORIES:
            _, was_created = MaintenanceCategory.objects.get_or_create(
                name=name,
                defaults={"description": description},
            )
            if was_created:
                created += 1

        self.stdout.write(self.style.SUCCESS(
            f"Seeded {created} new maintenance categories "
            f"(total now {MaintenanceCategory.objects.count()})."
        ))
