import secrets
import string
from django.contrib.auth import get_user_model
from django.db import transaction
from accounts.models import Role, UserRole

User = get_user_model()

class AdminCredentialService:
    @staticmethod
    def generate_random_password(length=12):
        alphabet = string.ascii_letters + string.digits + "!@#$%^&*"
        while True:
            password = ''.join(secrets.choice(alphabet) for _ in range(length))
            if (any(c.islower() for c in password)
                and any(c.isupper() for c in password)
                and sum(c.isdigit() for c in password) >= 2):
                break
        return password

    @staticmethod
    @transaction.atomic
    def create_hostel_admin(email, first_name, last_name, phone_number=None):
        """
        Creates a User with the HOSTEL_ADMIN role.
        Generates a secure password and returns it.
        """
        password = AdminCredentialService.generate_random_password()
        
        user = User.objects.create_user(
            email=email,
            password=password,
            first_name=first_name,
            last_name=last_name,
            phone_number=phone_number,
            email_verified=True,
        )
        
        # Ensure hostel_admin role exists
        role, created = Role.objects.get_or_create(
            name='hostel_admin',
            defaults={
                'description': 'Hostel owner/admin',
                'is_system_role': True
            }
        )
        
        UserRole.objects.create(user=user, role=role)
        
        return user, password

