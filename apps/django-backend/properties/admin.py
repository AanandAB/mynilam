from django.contrib import admin
from .models import (
    PropertyType, AmenityCategory, Amenity, Property,
    PropertyAmenity, PropertyMedia, PropertyDocument, PropertyRule
)

@admin.register(PropertyType)
class PropertyTypeAdmin(admin.ModelAdmin):
    list_display = ('name', 'is_active', 'is_deleted')

@admin.register(AmenityCategory)
class AmenityCategoryAdmin(admin.ModelAdmin):
    list_display = ('name', 'is_active', 'is_deleted')

@admin.register(Amenity)
class AmenityAdmin(admin.ModelAdmin):
    list_display = ('name', 'category', 'is_active', 'is_deleted')
    list_filter = ('category',)

@admin.register(Property)
class PropertyAdmin(admin.ModelAdmin):
    list_display = ('title', 'property_type', 'city', 'price', 'listing_purpose', 'listing_status', 'is_active')
    list_filter = ('listing_status', 'listing_purpose', 'verification_status', 'property_type', 'furnishing_status')
    search_fields = ('title', 'address_line_1', 'zip_code')
    raw_id_fields = ('owner', 'country', 'state', 'district', 'city', 'area', 'locality')

@admin.register(PropertyAmenity)
class PropertyAmenityAdmin(admin.ModelAdmin):
    list_display = ('property', 'amenity', 'is_active')
    raw_id_fields = ('property',)

@admin.register(PropertyMedia)
class PropertyMediaAdmin(admin.ModelAdmin):
    list_display = ('property', 'media_type', 'is_primary', 'sort_order')
    list_filter = ('media_type', 'is_primary')
    raw_id_fields = ('property',)

@admin.register(PropertyDocument)
class PropertyDocumentAdmin(admin.ModelAdmin):
    list_display = ('property', 'document_type', 'document_name', 'verification_status')
    list_filter = ('document_type', 'verification_status')
    raw_id_fields = ('property',)

@admin.register(PropertyRule)
class PropertyRuleAdmin(admin.ModelAdmin):
    list_display = ('property', 'rule_type', 'rule_value')
    list_filter = ('rule_type',)
    raw_id_fields = ('property',)
