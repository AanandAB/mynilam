from django.contrib import admin
from .models import MaintenanceCategory, MaintenanceRequest, MaintenanceRequestMedia

@admin.register(MaintenanceCategory)
class MaintenanceCategoryAdmin(admin.ModelAdmin):
    list_display = ('name', 'is_active', 'is_deleted')

@admin.register(MaintenanceRequest)
class MaintenanceRequestAdmin(admin.ModelAdmin):
    list_display = ('id', 'title', 'property', 'priority', 'status', 'reported_by', 'is_active')
    list_filter = ('status', 'priority', 'category')
    search_fields = ('title',)
    raw_id_fields = ('property', 'lease', 'reported_by', 'assigned_to')

@admin.register(MaintenanceRequestMedia)
class MaintenanceRequestMediaAdmin(admin.ModelAdmin):
    list_display = ('id', 'request', 'media_type', 'sort_order')
    list_filter = ('media_type',)
    raw_id_fields = ('request',)
