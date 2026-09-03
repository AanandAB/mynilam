from properties.models import Property, PropertyVisit

def create_property(*, user, validated_data: dict):
    from django.utils import timezone
    from properties.models import PropertyType, PropertyMedia
    from geo.models import Country, State, District, City
    from django.db import transaction
    from django.core.files.storage import default_storage
    from django.conf import settings

    # Uploaded media is pulled out of the payload first: files are written to
    # storage and linked via PropertyMedia rows, never stored on the Property row.
    image_files = validated_data.pop('images', None) or []
    video_files = validated_data.pop('videos', None) or []

    # Free-form listing fields have no dedicated column — they live in Property.specs
    # (a JSON document). Pop them here so they don't leak into Property.objects.create.
    SPEC_FIELDS = (
        'total_rooms', 'furniture_list', 'num_beds', 'is_upstairs',
        'water_source', 'power_backup', 'parking', 'gated_community',
        'security_features', 'preferred_tenant', 'preferred_gender',
        'sharing_occupancy', 'food_included', 'wifi_available',
        'ac_available', 'laundry_available',
    )
    specs = {k: validated_data.pop(k) for k in SPEC_FIELDS if k in validated_data}

    city_name = validated_data.get("city", "Kochi").strip()
    state_name = validated_data.get("state", "Kerala").strip()
    
    with transaction.atomic():
        country, _ = Country.objects.get_or_create(
            name="India",
            defaults={"country_code": "IN", "currency_code": "INR"}
        )
        state_obj, _ = State.objects.get_or_create(
            country=country,
            name=state_name
        )
        district_obj, _ = District.objects.get_or_create(
            state=state_obj,
            name=city_name
        )
        city_obj, _ = City.objects.get_or_create(
            district=district_obj,
            name=city_name
        )

        prop_type_name = validated_data.get("property_type", "flat").strip().lower()
        property_type_obj, _ = PropertyType.objects.get_or_create(
            name=prop_type_name.capitalize(),
            defaults={"description": f"{prop_type_name.capitalize()} Type"}
        )

        listing_type = validated_data.get("listing_type", "rent").strip().lower()
        if listing_type == "roommate":
            listing_purpose = "Roommate"
        elif listing_type == "sale":
            listing_purpose = "Sale"
        else:
            listing_purpose = "Rent"

        property_obj = Property.objects.create(
            owner=user,
            property_type=property_type_obj,
            title=validated_data.get("title", "Untitled Property"),
            description=validated_data.get("description"),
            country=country,
            state=state_obj,
            city=city_obj,
            address_line_1=validated_data.get("address", "N/A"),
            zip_code=validated_data.get("zip_code"),
            price=validated_data.get("price", 0),
            currency_code="INR",
            listing_purpose=listing_purpose,
            available_from=timezone.now().date(),
            bedrooms=validated_data.get("bedrooms"),
            bathrooms=validated_data.get("bathrooms"),
            area_sqft=validated_data.get("area_sqft"),
            furnishing_status="Furnished" if validated_data.get("is_furnished") else "Unfurnished",
            listing_status="Active",
            # --- PRD §6 extras ---
            security_deposit=validated_data.get("security_deposit"),
            latitude=validated_data.get("latitude"),
            longitude=validated_data.get("longitude"),
            landmark=validated_data.get("landmark"),
            show_contact_details=bool(validated_data.get("show_contact_details", False)),
            contact_name=validated_data.get("contact_name"),
            contact_phone=validated_data.get("contact_phone"),
            specs=specs,
        )

        # Save uploaded media to storage (FileSystemStorage -> MEDIA_ROOT) and link
        # one PropertyMedia row per file. media_url is stored relative to MEDIA_URL so
        # it stays portable across environments; serialize_property builds the absolute
        # URL at read time.
        for idx, file_obj in enumerate(image_files):
            saved_name = default_storage.save(f"property_media/{file_obj.name}", file_obj)
            PropertyMedia.objects.create(
                property=property_obj,
                media_type='Image',
                media_url=f"{settings.MEDIA_URL}{saved_name}",
                sort_order=idx,
            )
        for idx, file_obj in enumerate(video_files):
            saved_name = default_storage.save(f"property_media/{file_obj.name}", file_obj)
            PropertyMedia.objects.create(
                property=property_obj,
                media_type='Video',
                media_url=f"{settings.MEDIA_URL}{saved_name}",
                sort_order=idx,
            )

    return property_obj
def request_visit(*, user, property_id: int, visit_date: str, visit_time: str, notes: str = None):
    """
    Creates a visit request for a property.
    """
    # Rate limit: max 2 pending visits per user per property
    pending_visits = PropertyVisit.objects.filter(
        visitor=user,
        property_id=property_id,
        visit_status='Requested'
    ).count()
    
    if pending_visits >= 2:
        raise ValueError("You already have too many pending visit requests for this property.")
        
    visit = PropertyVisit.objects.create(
        visitor=user,
        property_id=property_id,
        visit_date=visit_date,
        visit_time=visit_time,
        visitor_notes=notes,
        visit_status='Requested'
    )
    return visit

def update_visit_status(*, user, visit_id: int, new_status: str, notes: str = None):
    """
    Updates the status of a visit request.
    """
    valid_statuses = ['Requested', 'Confirmed', 'Cancelled', 'Completed', 'NoShow']
    if new_status not in valid_statuses:
        raise ValueError(f"Invalid status. Must be one of {valid_statuses}")
        
    visit = PropertyVisit.objects.select_related('property').get(id=visit_id)
    
    # Check permissions
    if visit.visitor == user:
        if new_status not in ['Cancelled']:
            raise PermissionError("Visitors can only cancel visits.")
    elif visit.property.owner == user:
        if new_status not in ['Confirmed', 'Cancelled', 'Completed', 'NoShow']:
            raise PermissionError("Invalid action for owner.")
    else:
        raise PermissionError("You don't have permission to update this visit.")
        
    visit.visit_status = new_status
    if notes:
        if visit.property.owner == user:
            visit.owner_notes = notes
        else:
            visit.visitor_notes = notes
            
    visit.save(update_fields=['visit_status', 'owner_notes', 'visitor_notes'])
    return visit

def update_hostel_config(*, user, property_id: int, **kwargs):
    """
    Creates or updates the hostel configuration for a property.
    Only the property owner or staff can do this.
    """
    from properties.models import HostelConfig
    from audits.models import AuditLog
    from geo.models import Country, State, District, City, Area
    
    property_obj = Property.objects.get(id=property_id)
    
    if property_obj.owner != user and not user.user_roles.filter(role__name='hostel_admin').exists() and not user.is_staff and not user.is_superuser:
        raise PermissionError("You do not have permission to configure this property.")

    address = kwargs.pop("address", None)
    city_name = kwargs.pop("city", None)

    prop_updated = False
    if address and property_obj.address_line_1 != address:
        property_obj.address_line_1 = address
        prop_updated = True
        
    if city_name and (not property_obj.city or property_obj.city.name != city_name):
        country, _ = Country.objects.get_or_create(name="India", defaults={"country_code": "IN", "currency_code": "INR"})
        state_name = kwargs.pop("state", "Unknown")
        state_obj, _ = State.objects.get_or_create(country=country, name=state_name)
        district_obj, _ = District.objects.get_or_create(state=state_obj, name=city_name)
        city_obj, _ = City.objects.get_or_create(district=district_obj, name=city_name)
        property_obj.city = city_obj
        property_obj.state = state_obj
        prop_updated = True
    else:
        # If city isn't changing but state is provided, update state
        state_name = kwargs.pop("state", None)
        if state_name and (not property_obj.state or property_obj.state.name != state_name):
            country, _ = Country.objects.get_or_create(name="India", defaults={"country_code": "IN", "currency_code": "INR"})
            state_obj, _ = State.objects.get_or_create(country=country, name=state_name)
            property_obj.state = state_obj
            prop_updated = True

    area_name = kwargs.pop("area", None)
    if area_name and (not property_obj.area or property_obj.area.name != area_name):
        if property_obj.city:
            area_obj, _ = Area.objects.get_or_create(city=property_obj.city, name=area_name)
            property_obj.area = area_obj
            prop_updated = True

    zip_code = kwargs.pop("zip_code", None)
    if zip_code and property_obj.zip_code != zip_code:
        property_obj.zip_code = zip_code
        prop_updated = True

    latitude = kwargs.pop("latitude", None)
    if latitude is not None and property_obj.latitude != latitude:
        property_obj.latitude = latitude
        prop_updated = True

    longitude = kwargs.pop("longitude", None)
    if longitude is not None and property_obj.longitude != longitude:
        property_obj.longitude = longitude
        prop_updated = True

    hostel_name = kwargs.get("hostel_name")
    if hostel_name and property_obj.title != hostel_name:
        property_obj.title = hostel_name
        prop_updated = True

    description = kwargs.pop("description", None)
    if description and property_obj.description != description:
        property_obj.description = description
        prop_updated = True

    price_monthly = kwargs.get("price_monthly")
    if price_monthly is not None and property_obj.price != price_monthly:
        property_obj.price = price_monthly
        prop_updated = True

    total_rooms = kwargs.get("total_rooms")
    if total_rooms is not None and property_obj.bedrooms != total_rooms:
        property_obj.bedrooms = total_rooms
        prop_updated = True

    bathroom_count = kwargs.get("bathroom_count")
    if bathroom_count is not None and property_obj.bathrooms != bathroom_count:
        property_obj.bathrooms = bathroom_count
        prop_updated = True
        
    if prop_updated:
        property_obj.save(update_fields=['address_line_1', 'city', 'state', 'area', 'zip_code', 'title', 'latitude', 'longitude', 'description', 'price', 'bedrooms', 'bathrooms'])

        
    config, created = HostelConfig.objects.update_or_create(
        property=property_obj,
        defaults=kwargs
    )
    
    AuditLog.objects.create(
        user=user,
        action="UpdateHostelConfig",
        entity_type="HostelConfig",
        entity_id=config.id,
        new_values=kwargs,
        ip_address="0.0.0.0",
        user_agent="System"
    )
    
    return config

def set_hostel_cover_photo(*, user, property_id: int, photo_id: int):
    """
    Sets a specific hostel photo as the cover image.
    """
    from properties.models import HostelPhoto, Property
    from django.db import transaction

    property_obj = Property.objects.get(id=property_id)
    hostel_config = getattr(property_obj, 'hostel_config', None)
    
    if not hostel_config:
        raise ValueError("Hostel configuration not found")

    with transaction.atomic():
        HostelPhoto.objects.filter(hostel_config=hostel_config).update(is_cover=False)
        photo = HostelPhoto.objects.get(id=photo_id, hostel_config=hostel_config)
        photo.is_cover = True
        photo.save(update_fields=['is_cover'])
        
    return photo
