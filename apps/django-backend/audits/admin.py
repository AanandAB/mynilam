from django.contrib import admin
from .models import AuditLog

@admin.register(AuditLog)
class AuditLogAdmin(admin.ModelAdmin):
    list_display = ('id', 'action', 'entity_type', 'entity_id', 'user', 'created_date')
    list_filter = ('action', 'entity_type', 'created_date')
    search_fields = ('entity_type', 'action')
    raw_id_fields = ('user',)
    
    # Enforce read-only in admin
    def has_add_permission(self, request):
        return False
        
    def has_change_permission(self, request, obj=None):
        return False
        
    def has_delete_permission(self, request, obj=None):
        return False
