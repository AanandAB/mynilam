from django.contrib import admin
from .models import User, Role, UserRole, Permission, RolePermission, UserSession, OTPVerification, SocialAccount

@admin.register(User)
class UserAdmin(admin.ModelAdmin):
    list_display = ('email', 'first_name', 'last_name', 'is_active', 'is_staff', 'is_deleted')
    search_fields = ('email', 'first_name', 'last_name')
    list_filter = ('is_active', 'is_staff', 'is_deleted')
    
@admin.register(Role)
class RoleAdmin(admin.ModelAdmin):
    list_display = ('name', 'is_system_role', 'is_active', 'is_deleted')
    search_fields = ('name',)

@admin.register(UserRole)
class UserRoleAdmin(admin.ModelAdmin):
    list_display = ('user', 'role', 'is_active', 'is_deleted')
    list_filter = ('role', 'is_active')

@admin.register(Permission)
class PermissionAdmin(admin.ModelAdmin):
    list_display = ('name', 'module', 'is_active', 'is_deleted')
    list_filter = ('module', 'is_active')

@admin.register(RolePermission)
class RolePermissionAdmin(admin.ModelAdmin):
    list_display = ('role', 'permission', 'is_active', 'is_deleted')
    list_filter = ('role',)

@admin.register(UserSession)
class UserSessionAdmin(admin.ModelAdmin):
    list_display = ('user', 'ip_address', 'expires_at', 'is_revoked')
    list_filter = ('is_revoked',)
    search_fields = ('user__email', 'ip_address')

@admin.register(OTPVerification)
class OTPVerificationAdmin(admin.ModelAdmin):
    list_display = ('user', 'purpose', 'expires_at', 'is_used', 'attempt_count')
    list_filter = ('purpose', 'is_used')

@admin.register(SocialAccount)
class SocialAccountAdmin(admin.ModelAdmin):
    list_display = ('user', 'provider', 'provider_user_id', 'is_active')
    list_filter = ('provider', 'is_active')
