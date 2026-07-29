from rest_framework import permissions

class IsSuperAdmin(permissions.BasePermission):
    """
    Allows access only to users with the 'super_admin' role or superusers.
    """
    def has_permission(self, request, view):
        if not request.user or not request.user.is_authenticated:
            return False
            
        if request.user.is_superuser:
            return True
            
        return request.user.user_roles.filter(role__name='super_admin').exists()


class IsHostelAdmin(permissions.BasePermission):
    """
    Allows access only to users with the 'hostel_admin' role or superusers.
    """
    def has_permission(self, request, view):
        if not request.user or not request.user.is_authenticated:
            return False
            
        if request.user.is_superuser:
            return True
            
        return request.user.user_roles.filter(role__name__in=['hostel_admin', 'super_admin']).exists()
