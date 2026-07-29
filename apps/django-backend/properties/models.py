from django.db import models
from django.conf import settings
from core.models import CommonModel


class PropertyType(CommonModel):
    name = models.CharField(max_length=100, unique=True)
    description = models.CharField(max_length=500, null=True, blank=True)

    def __str__(self):
        return self.name


class AmenityCategory(CommonModel):
    name = models.CharField(max_length=100, unique=True)

    def __str__(self):
        return self.name


class Amenity(CommonModel):
    category = models.ForeignKey(AmenityCategory, on_delete=models.CASCADE, related_name='amenities')
    name = models.CharField(max_length=100, unique=True)
    icon_url = models.URLField(max_length=500, null=True, blank=True)

    def __str__(self):
        return self.name


class Property(CommonModel):
    FURNISHING_CHOICES = [
        ('Furnished', 'Furnished'),
        ('Semi-Furnished', 'Semi-Furnished'),
        ('Unfurnished', 'Unfurnished')
    ]
    RENT_FREQUENCY_CHOICES = [
        ('Daily', 'Daily'),
        ('Weekly', 'Weekly'),
        ('Monthly', 'Monthly'),
        ('Quarterly', 'Quarterly'),
        ('Yearly', 'Yearly')
    ]
    LISTING_STATUS_CHOICES = [
        ('Draft', 'Draft'),
        ('Active', 'Active'),
        ('Pending', 'Pending'),
        ('Rented', 'Rented'),
        ('Sold', 'Sold'),
        ('Expired', 'Expired'),
        ('Suspended', 'Suspended')
    ]
    VERIFICATION_STATUS_CHOICES = [
        ('Pending', 'Pending'),
        ('Verified', 'Verified'),
        ('Rejected', 'Rejected')
    ]
    LISTING_PURPOSE_CHOICES = [
        ('Rent', 'Rent'),
        ('Sale', 'Sale')
    ]

    owner = models.ForeignKey(settings.AUTH_USER_MODEL, on_delete=models.CASCADE, related_name='properties')
    property_type = models.ForeignKey(PropertyType, on_delete=models.RESTRICT)
    title = models.CharField(max_length=300)
    description = models.TextField(null=True, blank=True)
    
    country = models.ForeignKey('geo.Country', on_delete=models.RESTRICT)
    state = models.ForeignKey('geo.State', on_delete=models.RESTRICT)
    district = models.ForeignKey('geo.District', on_delete=models.RESTRICT, null=True, blank=True)
    city = models.ForeignKey('geo.City', on_delete=models.RESTRICT)
    area = models.ForeignKey('geo.Area', on_delete=models.RESTRICT, null=True, blank=True)
    locality = models.ForeignKey('geo.Locality', on_delete=models.RESTRICT, null=True, blank=True)
    
    address_line_1 = models.CharField(max_length=300)
    address_line_2 = models.CharField(max_length=300, null=True, blank=True)
    building_name = models.CharField(max_length=200, null=True, blank=True)
    floor_number = models.CharField(max_length=20, null=True, blank=True)
    unit_number = models.CharField(max_length=50, null=True, blank=True)
    zip_code = models.CharField(max_length=20, null=True, blank=True)
    latitude = models.DecimalField(max_digits=10, decimal_places=8, null=True, blank=True)
    longitude = models.DecimalField(max_digits=11, decimal_places=8, null=True, blank=True)
    
    bedrooms = models.PositiveSmallIntegerField(null=True, blank=True)
    bathrooms = models.PositiveSmallIntegerField(null=True, blank=True)
    area_sqft = models.DecimalField(max_digits=10, decimal_places=2, null=True, blank=True)
    furnishing_status = models.CharField(max_length=20, choices=FURNISHING_CHOICES, default='Unfurnished')
    
    listing_purpose = models.CharField(max_length=10, choices=LISTING_PURPOSE_CHOICES, default='Rent')
    price = models.DecimalField(max_digits=14, decimal_places=2)
    currency_code = models.CharField(max_length=3)
    rent_frequency = models.CharField(max_length=20, choices=RENT_FREQUENCY_CHOICES, null=True, blank=True)
    security_deposit = models.DecimalField(max_digits=14, decimal_places=2, null=True, blank=True)
    
    available_from = models.DateField()
    min_lease_duration_months = models.IntegerField(null=True, blank=True)
    max_lease_duration_months = models.IntegerField(null=True, blank=True)
    
    listing_status = models.CharField(max_length=20, choices=LISTING_STATUS_CHOICES, default='Draft')
    is_featured = models.BooleanField(default=False)
    verification_status = models.CharField(max_length=20, choices=VERIFICATION_STATUS_CHOICES, default='Pending')
    view_count = models.IntegerField(default=0)

    class Meta:
        indexes = [
            models.Index(fields=['city', 'area']),
            models.Index(fields=['listing_status', 'available_from']),
            models.Index(fields=['owner']),
            models.Index(fields=['latitude', 'longitude']),
        ]

    def __str__(self):
        return self.title


class PropertyAmenity(CommonModel):
    property = models.ForeignKey(Property, on_delete=models.CASCADE, related_name='property_amenities')
    amenity = models.ForeignKey(Amenity, on_delete=models.CASCADE, related_name='amenity_properties')

    class Meta:
        unique_together = ('property', 'amenity')

    def __str__(self):
        return f"{self.property.title} - {self.amenity.name}"


class PropertyMedia(CommonModel):
    MEDIA_TYPE_CHOICES = [
        ('Image', 'Image'),
        ('Video', 'Video'),
        ('360Tour', '360Tour'),
        ('FloorPlan', 'FloorPlan')
    ]
    property = models.ForeignKey(Property, on_delete=models.CASCADE, related_name='media')
    media_type = models.CharField(max_length=20, choices=MEDIA_TYPE_CHOICES)
    media_url = models.URLField(max_length=1000)
    thumbnail_url = models.URLField(max_length=1000, null=True, blank=True)
    caption = models.CharField(max_length=300, null=True, blank=True)
    sort_order = models.IntegerField(default=0)
    is_primary = models.BooleanField(default=False)
    file_size_kb = models.IntegerField(null=True, blank=True)

    def __str__(self):
        return f"{self.media_type} for {self.property.title}"


class PropertyDocument(CommonModel):
    DOC_TYPE_CHOICES = [
        ('TitleDeed', 'TitleDeed'),
        ('NOC', 'NOC'),
        ('Ejari', 'Ejari'),
        ('RERA', 'RERA'),
        ('Insurance', 'Insurance'),
        ('Other', 'Other')
    ]
    property = models.ForeignKey(Property, on_delete=models.CASCADE, related_name='documents')
    document_type = models.CharField(max_length=50, choices=DOC_TYPE_CHOICES)
    document_url = models.URLField(max_length=1000)
    document_name = models.CharField(max_length=200)
    expiry_date = models.DateField(null=True, blank=True)
    verification_status = models.CharField(
        max_length=20,
        choices=[('Pending', 'Pending'), ('Verified', 'Verified'), ('Rejected', 'Rejected')],
        default='Pending'
    )

    def __str__(self):
        return f"{self.document_type} - {self.property.title}"


class PropertyRule(CommonModel):
    RULE_TYPE_CHOICES = [
        ('PetPolicy', 'PetPolicy'),
        ('SmokingPolicy', 'SmokingPolicy'),
        ('NoisePolicy', 'NoisePolicy'),
        ('GuestPolicy', 'GuestPolicy'),
        ('ParkingPolicy', 'ParkingPolicy'),
        ('Other', 'Other')
    ]
    property = models.ForeignKey(Property, on_delete=models.CASCADE, related_name='rules')
    rule_type = models.CharField(max_length=50, choices=RULE_TYPE_CHOICES)
    rule_value = models.CharField(max_length=500)

    def __str__(self):
        return f"{self.rule_type} - {self.property.title}"


class PropertyVisit(CommonModel):
    STATUS_CHOICES = [
        ('Requested', 'Requested'),
        ('Confirmed', 'Confirmed'),
        ('Cancelled', 'Cancelled'),
        ('Completed', 'Completed'),
        ('NoShow', 'NoShow'),
    ]
    property = models.ForeignKey(Property, on_delete=models.CASCADE, related_name='visits')
    visitor = models.ForeignKey(settings.AUTH_USER_MODEL, on_delete=models.CASCADE, related_name='visit_requests')
    visit_date = models.DateField()
    visit_time = models.TimeField()
    visit_status = models.CharField(max_length=20, choices=STATUS_CHOICES, default='Requested')
    visitor_notes = models.TextField(null=True, blank=True)
    owner_notes = models.TextField(null=True, blank=True)

    class Meta:
        indexes = [
            models.Index(fields=['property', 'visit_date']),
            models.Index(fields=['visitor', 'visit_status']),
        ]

class HostelConfig(CommonModel):
    GENDER_ALLOWED_CHOICES = [
        ('boys', 'Boys Only'),
        ('girls', 'Girls Only'),
        ('unisex', 'Unisex / Co-Living'),
    ]
    property = models.OneToOneField(Property, on_delete=models.CASCADE, related_name='hostel_config')
    
    # Capacity & Layout
    hostel_name = models.CharField(max_length=300, null=True, blank=True)
    total_bed_spaces = models.IntegerField(default=120)
    total_rooms = models.IntegerField(default=40)
    bathroom_count = models.IntegerField(default=20)
    common_bathroom_count = models.IntegerField(default=0)
    attached_bathrooms = models.BooleanField(default=True)
    gender_type = models.CharField(max_length=20, choices=GENDER_ALLOWED_CHOICES, default='unisex')
    sharings = models.JSONField(default=list, blank=True) # e.g. ['1', '2', '3']
    
    # Utilities & Facilities
    wifi_enabled = models.BooleanField(default=True)
    wifi_speed = models.CharField(max_length=100, null=True, blank=True, default='100 Mbps')
    hot_water = models.BooleanField(default=True)
    water_filter = models.BooleanField(default=True)
    mess_food = models.BooleanField(default=True)
    laundry_enabled = models.BooleanField(default=True)
    ac_available = models.BooleanField(default=True)
    water_source = models.CharField(max_length=300, null=True, blank=True)
    
    # Geolocation & Vacancy
    vacant_beds = models.IntegerField(default=0)
    vacant_rooms = models.IntegerField(default=0)
    vacant_sharings = models.JSONField(default=list, blank=True) # e.g. ['2', '3']
    
    # Location Details
    landmark = models.CharField(max_length=300, null=True, blank=True)
    street_address = models.CharField(max_length=500, null=True, blank=True)
    
    # Pricing
    price_monthly = models.DecimalField(max_digits=10, decimal_places=2, null=True, blank=True)
    hostel_pricing = models.JSONField(default=list, blank=True) # e.g. [{"share": 1, "price": 1200}]

    # Additional Hostel Rules & Property Fields
    parking = models.CharField(max_length=50, null=True, blank=True) # 'none', 'bike', 'car-open', 'car-covered'
    preferred_tenant = models.CharField(max_length=50, null=True, blank=True) # 'any', 'bachelors', 'family'
    is_upstairs = models.BooleanField(default=False)

    def __str__(self):
        return f"Hostel Config - {self.hostel_name or self.property.title}"


class HostelPhoto(CommonModel):
    CATEGORY_CHOICES = [
        ('COVER', 'Cover Image'),
        ('ENTRANCE', 'Hostel Entrance'),
        ('ROOM', 'Rooms'),
        ('BATHROOM', 'Bathrooms'),
        ('DINING', 'Dining Area'),
        ('COMMON_AREA', 'Common Area'),
    ]

    hostel_config = models.ForeignKey(HostelConfig, on_delete=models.CASCADE, related_name='photos')
    image = models.ImageField(upload_to='hostel_photos/')
    image_url = models.URLField(max_length=1000, null=True, blank=True)
    category = models.CharField(max_length=20, choices=CATEGORY_CHOICES, default='COMMON_AREA')
    is_cover = models.BooleanField(default=False)

    class Meta:
        indexes = [
            models.Index(fields=['hostel_config', 'category']),
            models.Index(fields=['hostel_config', 'is_cover']),
        ]

    def __str__(self):
        return f"{self.category} photo for {self.hostel_config.hostel_name or self.hostel_config.property.title}"


class HostelRoom(CommonModel):
    SHARING_CHOICES = [
        ('1', 'Single Occupancy'),
        ('2', 'Double Sharing'),
        ('3', 'Triple Sharing'),
        ('4', 'Quad Sharing'),
        ('dorm', 'Dormitory Bed Space'),
    ]

    hostel_config = models.ForeignKey(HostelConfig, on_delete=models.CASCADE, related_name='rooms')
    room_number = models.CharField(max_length=50) # e.g. "101", "G-02"
    floor_number = models.IntegerField(default=1)
    sharing_type = models.CharField(max_length=20, choices=SHARING_CHOICES, default='2')
    monthly_rate = models.DecimalField(max_digits=10, decimal_places=2, null=True, blank=True)
    is_ac = models.BooleanField(default=False)
    has_attached_bathroom = models.BooleanField(default=True)
    notes = models.CharField(max_length=300, null=True, blank=True)

    class Meta:
        unique_together = ('hostel_config', 'room_number')

    def __str__(self):
        return f"Room {self.room_number} ({self.hostel_config.hostel_name or 'Hostel'})"


class HostelBed(CommonModel):
    STATUS_CHOICES = [
        ('Vacant', 'Vacant'),
        ('Occupied', 'Occupied'),
        ('Reserved', 'Reserved'),
        ('Maintenance', 'Maintenance'),
    ]

    room = models.ForeignKey(HostelRoom, on_delete=models.CASCADE, related_name='beds')
    bed_name = models.CharField(max_length=50) # e.g. "Bed A", "Lower Bunk 1"
    bed_status = models.CharField(max_length=20, choices=STATUS_CHOICES, default='Vacant')
    assigned_tenant = models.ForeignKey(
        settings.AUTH_USER_MODEL, 
        on_delete=models.SET_NULL, 
        null=True, 
        blank=True, 
        related_name='assigned_hostel_beds'
    )
    check_in_date = models.DateField(null=True, blank=True)
    check_out_date = models.DateField(null=True, blank=True)

    class Meta:
        unique_together = ('room', 'bed_name')

    def __str__(self):
        return f"{self.bed_name} in Room {self.room.room_number} ({self.bed_status})"

