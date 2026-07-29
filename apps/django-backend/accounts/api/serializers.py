from rest_framework import serializers
from rest_framework_simplejwt.serializers import TokenObtainPairSerializer
from rest_framework.exceptions import ValidationError
from django.utils import timezone
from django.contrib.auth import get_user_model
import hashlib

from accounts.models import UserSession
from audits.models import AuditLog

User = get_user_model()

class CustomTokenObtainPairSerializer(TokenObtainPairSerializer):
    @classmethod
    def get_token(cls, user):
        token = super().get_token(user)
        # Add custom claims for RBAC
        token['email'] = user.email
        token['roles'] = list(user.user_roles.values_list('role__name', flat=True))
        token['permissions'] = list(
            user.user_roles.values_list('role__role_permissions__permission__name', flat=True)
        )
        return token

    def validate(self, attrs):
        email = attrs.get(self.username_field)
        
        # Look up user first for lockout check and failed attempts tracking
        try:
            user_obj = User.objects.get(email=email)
        except User.DoesNotExist:
            user_obj = None

        if user_obj:
            # Check lockout
            if user_obj.account_locked_until and user_obj.account_locked_until > timezone.now():
                raise ValidationError("Account is locked.")

        # Run standard validation
        try:
            data = super().validate(attrs)
        except Exception as e:
            if user_obj:
                user_obj.failed_login_attempts += 1
                if user_obj.failed_login_attempts >= 5:
                    user_obj.account_locked_until = timezone.now() + timezone.timedelta(minutes=15)
                user_obj.save()

                request = self.context.get('request')
                ip = request.META.get('REMOTE_ADDR') if request else None
                device = request.META.get('HTTP_USER_AGENT') if request else None
                
                # Log failed attempt
                AuditLog.objects.create(
                    user=user_obj,
                    action="UserLoginFailed",
                    entity_type="User",
                    entity_id=user_obj.id,
                    ip_address=ip,
                    user_agent=device
                )
            raise e

        # Successful authentication - reset login attempts
        user = self.user
        if user.failed_login_attempts > 0:
            user.failed_login_attempts = 0
            user.save()

        # Check 2FA
        if user.two_factor_enabled:
            return {
                "mfa_required": True,
                "mfa_token": "temporary_mfa_flow_token"
            }

        request = self.context.get('request')
        ip = request.META.get('REMOTE_ADDR') if request else None
        device = request.META.get('HTTP_USER_AGENT') if request else None
        
        # Hash refresh token
        refresh_token = data.get('refresh', '')
        refresh_hash = hashlib.sha256(refresh_token.encode('utf-8')).hexdigest()
        
        # Create UserSession
        UserSession.objects.create(
            user=user,
            refresh_token_hash=refresh_hash,
            device_info=device,
            ip_address=ip,
            expires_at=timezone.now() + timezone.timedelta(days=7)
        )
        
        # Log successful login
        AuditLog.objects.create(
            user=user,
            action="UserLogin",
            entity_type="User",
            entity_id=user.id,
            ip_address=ip,
            user_agent=device
        )
        
        return data

class UserSignUpSerializer(serializers.ModelSerializer):
    full_name = serializers.CharField(write_only=True)
    class Meta:
        model = User
        fields = ['id', 'email','full_name', 'password', 'phone_number']
        extra_kwargs = {
            'password': {'write_only': True},
            'id': {'read_only': True}
        }

    def create(self, validated_data):
        full_name = validated_data.pop("full_name")
        names = full_name.strip().split()

        validated_data["first_name"] = names[0]
        validated_data["last_name"] = " ".join(names[1:]) if len(names) > 1 else ""

        user = User.objects.create_user(**validated_data)
        return user
