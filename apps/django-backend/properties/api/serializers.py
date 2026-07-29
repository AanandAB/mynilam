from rest_framework import serializers

class PropertyCreateSerializer(serializers.Serializer):
    title = serializers.CharField(max_length=300)
    description = serializers.CharField(required=False, allow_blank=True, allow_null=True)
    property_type = serializers.CharField(default='flat')
    listing_type = serializers.ChoiceField(choices=['rent', 'sale', 'roommate'], default='rent')
    
    address = serializers.CharField(required=False, allow_blank=True, default='N/A')
    city = serializers.CharField(default='Kochi')
    state = serializers.CharField(default='Kerala')
    zip_code = serializers.CharField(required=False, allow_blank=True, allow_null=True)
    
    price = serializers.FloatField(min_value=0)
    bedrooms = serializers.IntegerField(min_value=0, required=False, allow_null=True)
    bathrooms = serializers.IntegerField(min_value=0, required=False, allow_null=True)
    area_sqft = serializers.FloatField(min_value=0, required=False, allow_null=True)
    
    is_furnished = serializers.BooleanField(default=False)


class HostelConfigUpdateSerializer(serializers.Serializer):
    hostel_name = serializers.CharField(max_length=300, required=False, allow_blank=True, allow_null=True)
    description = serializers.CharField(required=False, allow_blank=True, allow_null=True)
    
    total_bed_spaces = serializers.IntegerField(min_value=0, required=False, allow_null=True)
    total_rooms = serializers.IntegerField(min_value=0, required=False, allow_null=True)
    bathroom_count = serializers.IntegerField(min_value=0, required=False, allow_null=True)
    attached_bathrooms = serializers.BooleanField(required=False, allow_null=True)
    gender_type = serializers.ChoiceField(choices=['boys', 'girls', 'unisex'], required=False, allow_null=True)
    sharings = serializers.ListField(child=serializers.CharField(), required=False, allow_null=True)
    
    wifi_enabled = serializers.BooleanField(required=False, allow_null=True)
    wifi_speed = serializers.CharField(max_length=100, required=False, allow_blank=True, allow_null=True)
    hot_water = serializers.BooleanField(required=False, allow_null=True)
    water_filter = serializers.BooleanField(required=False, allow_null=True)
    mess_food = serializers.BooleanField(required=False, allow_null=True)
    laundry_enabled = serializers.BooleanField(required=False, allow_null=True)
    ac_available = serializers.BooleanField(required=False, allow_null=True)
    water_source = serializers.CharField(max_length=300, required=False, allow_blank=True, allow_null=True)
    
    vacant_beds = serializers.IntegerField(min_value=0, required=False, allow_null=True)
    vacant_rooms = serializers.IntegerField(min_value=0, required=False, allow_null=True)
    vacant_sharings = serializers.ListField(child=serializers.CharField(), required=False, allow_null=True)
    
    price_monthly = serializers.FloatField(min_value=0, required=False, allow_null=True)
    hostel_pricing = serializers.ListField(child=serializers.DictField(), required=False, allow_null=True)
    
    landmark = serializers.CharField(max_length=300, required=False, allow_blank=True, allow_null=True)
    street_address = serializers.CharField(max_length=500, required=False, allow_blank=True, allow_null=True)
    address = serializers.CharField(max_length=300, required=False, allow_blank=True, allow_null=True)
    city = serializers.CharField(max_length=100, required=False, allow_blank=True, allow_null=True)
    state = serializers.CharField(max_length=100, required=False, allow_blank=True, allow_null=True)
    area = serializers.CharField(max_length=100, required=False, allow_blank=True, allow_null=True)
    zip_code = serializers.CharField(max_length=20, required=False, allow_blank=True, allow_null=True)
    latitude = serializers.FloatField(required=False, allow_null=True)
    longitude = serializers.FloatField(required=False, allow_null=True)
    
    parking = serializers.CharField(max_length=50, required=False, allow_blank=True, allow_null=True)
    preferred_tenant = serializers.CharField(max_length=50, required=False, allow_blank=True, allow_null=True)
    is_upstairs = serializers.BooleanField(required=False, allow_null=True)
