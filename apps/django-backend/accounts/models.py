from django.db import models
from django.contrib.auth.models import AbstractBaseUser, BaseUserManager
from core.models import CommonModel


class CustomUserManager(BaseUserManager):
    def create_user(self, email, password=None, **extra_fields):
        if not email:
            raise ValueError('The Email field must be set')
        email = self.normalize_email(email).lower()
        user = self.model(email=email, **extra_fields)
        user.set_password(password)
        user.save(using=self._db)
        return user

    def create_superuser(self, email, password=None, **extra_fields):
        extra_fields.setdefault('is_staff', True)
        extra_fields.setdefault('is_superuser', True)
        return self.create_user(email, password, **extra_fields)


class User(CommonModel, AbstractBaseUser):
    email = models.EmailField(max_length=254, unique=True)
    first_name = models.CharField(max_length=100)
    last_name = models.CharField(max_length=100)
    
    # Required for Django admin access
    is_staff = models.BooleanField(default=False)
    is_superuser = models.BooleanField(default=False)
    
    # Custom fields from Schema 3
    phone_number = models.CharField(max_length=20, null=True, blank=True)
    profile_image_url = models.URLField(max_length=500, null=True, blank=True)
    date_of_birth = models.DateField(null=True, blank=True)
    nationality_country = models.ForeignKey('geo.Country', on_delete=models.SET_NULL, null=True, blank=True)
    preferred_language = models.CharField(max_length=5, default='en')
    email_verified = models.BooleanField(default=False)
    phone_verified = models.BooleanField(default=False)
    
    # Security/Lockout
    failed_login_attempts = models.IntegerField(default=0)
    account_locked_until = models.DateTimeField(null=True, blank=True)
    
    # 2FA
    two_factor_enabled = models.BooleanField(default=False)
    two_factor_secret = models.CharField(max_length=500, null=True, blank=True)
    
    objects = CustomUserManager()
    
    USERNAME_FIELD = 'email'
    REQUIRED_FIELDS = ['first_name', 'last_name']
    
    def __str__(self):
        return self.email
        
    def has_perm(self, perm, obj=None):
        return self.is_superuser
        
    def has_module_perms(self, app_label):
        return self.is_superuser


class Role(CommonModel):
    name = models.CharField(max_length=50, unique=True)
    description = models.CharField(max_length=300, null=True, blank=True)
    is_system_role = models.BooleanField(default=False)

    def __str__(self):
        return self.name


class UserRole(CommonModel):
    user = models.ForeignKey(User, on_delete=models.CASCADE, related_name='user_roles')
    role = models.ForeignKey(Role, on_delete=models.CASCADE, related_name='role_users')
    assigned_date = models.DateTimeField(auto_now_add=True)

    class Meta:
        unique_together = ('user', 'role')

    def __str__(self):
        return f"{self.user.email} - {self.role.name}"


class Permission(CommonModel):
    name = models.CharField(max_length=100, unique=True)
    description = models.CharField(max_length=300, null=True, blank=True)
    module = models.CharField(max_length=50)

    def __str__(self):
        return self.name


class RolePermission(CommonModel):
    role = models.ForeignKey(Role, on_delete=models.CASCADE, related_name='role_permissions')
    permission = models.ForeignKey(Permission, on_delete=models.CASCADE, related_name='permission_roles')

    class Meta:
        unique_together = ('role', 'permission')

    def __str__(self):
        return f"{self.role.name} - {self.permission.name}"


class UserSession(CommonModel):
    user = models.ForeignKey(User, on_delete=models.CASCADE)
    refresh_token_hash = models.CharField(max_length=500)
    device_info = models.CharField(max_length=500, null=True, blank=True)
    ip_address = models.GenericIPAddressField(null=True, blank=True)
    expires_at = models.DateTimeField()
    is_revoked = models.BooleanField(default=False)

    def __str__(self):
        return f"Session {self.id} for {self.user.email}"


class OTPVerification(CommonModel):
    PURPOSE_CHOICES = [
        ('EmailVerification', 'EmailVerification'),
        ('PhoneVerification', 'PhoneVerification'),
        ('PasswordReset', 'PasswordReset'),
        ('TwoFactorAuth', 'TwoFactorAuth'),
    ]
    user = models.ForeignKey(User, on_delete=models.CASCADE)
    otp_code = models.CharField(max_length=10)
    purpose = models.CharField(max_length=30, choices=PURPOSE_CHOICES)
    expires_at = models.DateTimeField()
    is_used = models.BooleanField(default=False)
    attempt_count = models.IntegerField(default=0)

    def __str__(self):
        return f"OTP for {self.user.email} - {self.purpose}"


class SocialAccount(CommonModel):
    PROVIDER_CHOICES = [
        ('Google', 'Google'),
        ('Facebook', 'Facebook'),
        ('Apple', 'Apple'),
    ]
    user = models.ForeignKey(User, on_delete=models.CASCADE)
    provider = models.CharField(max_length=20, choices=PROVIDER_CHOICES)
    provider_user_id = models.CharField(max_length=200)
    provider_email = models.EmailField(max_length=254, null=True, blank=True)
    access_token = models.CharField(max_length=2000, null=True, blank=True)
    refresh_token = models.CharField(max_length=2000, null=True, blank=True)
    token_expires_at = models.DateTimeField(null=True, blank=True)

    class Meta:
        unique_together = ('provider', 'provider_user_id')

    def __str__(self):
        return f"{self.provider} - {self.user.email}"
