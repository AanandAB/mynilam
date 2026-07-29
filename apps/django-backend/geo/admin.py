from django.contrib import admin
from .models import Country, State, District, City, Area, Locality

@admin.register(Country)
class CountryAdmin(admin.ModelAdmin):
    list_display = ('name', 'country_code', 'currency_code', 'phone_code', 'is_active', 'is_deleted')
    search_fields = ('name', 'country_code')

@admin.register(State)
class StateAdmin(admin.ModelAdmin):
    list_display = ('name', 'state_code', 'country', 'is_active', 'is_deleted')
    list_filter = ('country',)
    search_fields = ('name', 'state_code')

@admin.register(District)
class DistrictAdmin(admin.ModelAdmin):
    list_display = ('name', 'state', 'is_active', 'is_deleted')
    list_filter = ('state__country', 'state')
    search_fields = ('name',)

@admin.register(City)
class CityAdmin(admin.ModelAdmin):
    list_display = ('name', 'district', 'latitude', 'longitude', 'is_active', 'is_deleted')
    list_filter = ('district__state__country', 'district__state')
    search_fields = ('name',)

@admin.register(Area)
class AreaAdmin(admin.ModelAdmin):
    list_display = ('name', 'city', 'zip_code', 'is_active', 'is_deleted')
    list_filter = ('city__district__state',)
    search_fields = ('name', 'zip_code')

@admin.register(Locality)
class LocalityAdmin(admin.ModelAdmin):
    list_display = ('name', 'area', 'is_active', 'is_deleted')
    list_filter = ('area__city__district',)
    search_fields = ('name',)
