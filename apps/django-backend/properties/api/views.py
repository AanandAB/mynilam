import hashlib
from django.utils import timezone
from rest_framework.views import APIView
from rest_framework.response import Response
from rest_framework import status
from rest_framework.permissions import IsAuthenticated

from core.jwt import CustomJWTAuthentication
from properties.models import Property, PropertyType, PropertyMedia, HostelConfig, HostelPhoto
from properties.selectors import can_see_exact_location
from geo.models import Country, State, District, City
from rest_framework.parsers import MultiPartParser, FormParser
import os

def serialize_hostel_photo(photo_obj, request=None):
    url = photo_obj.image.url if photo_obj.image else (photo_obj.image_url or '')
    if url and not url.startswith('http'):
        if request:
            url = request.build_absolute_uri(url)
        else:
            from django.conf import settings
            base_url = getattr(settings, 'BACKEND_BASE_URL', None)
            if not base_url:
                base_url = 'http://localhost:8001'
            url = f"{base_url.rstrip('/')}{url}"
            
    return {
        "id": photo_obj.id,
        "hostelId": photo_obj.hostel_config.property_id,
        "imageUrl": url,
        "category": photo_obj.category,
        "isCover": photo_obj.is_cover,
        "createdAt": photo_obj.created_at.isoformat() if hasattr(photo_obj, 'created_at') else "",
    }

def serialize_property(property_obj, user=None, request=None):
    raw_images = list(property_obj.media.filter(media_type='Image').order_by('sort_order').values_list('media_url', flat=True))
    images = []
    for img_url in raw_images:
        if img_url and not img_url.startswith('http'):
            if request:
                images.append(request.build_absolute_uri(img_url))
            else:
                from django.conf import settings
                base_url = getattr(settings, 'BACKEND_BASE_URL', 'http://localhost:8001')
                images.append(f"{base_url.rstrip('/')}{img_url}")
        else:
            images.append(img_url)

    hostel_config = getattr(property_obj, 'hostel_config', None)
    hostel_photos = []
    cover_image_url = None

    if hostel_config:
        photos_qs = hostel_config.photos.all().order_by('-is_cover', '-created_at')
        for hp in photos_qs:
            serialized_hp = serialize_hostel_photo(hp, request=request)
            hostel_photos.append(serialized_hp)
            if hp.is_cover and not cover_image_url:
                cover_image_url = serialized_hp["imageUrl"]

    if hostel_photos:
        photo_urls = [hp["imageUrl"] for hp in hostel_photos]
        if cover_image_url and cover_image_url in photo_urls:
            photo_urls.remove(cover_image_url)
            photo_urls.insert(0, cover_image_url)
        images = photo_urls + images

    if not images:
        images = ['https://images.unsplash.com/photo-1560448204-e02f11c3d0e2?w=800']

    videos = list(property_obj.media.filter(media_type='Video').order_by('sort_order').values_list('media_url', flat=True))

    owner = property_obj.owner
    owner_data = {
        "id": str(owner.id),
        "email": owner.email,
        "full_name": f"{owner.first_name} {owner.last_name}".strip(),
        "role": "normal"
    }
    
    can_see_location = False
    if user and user.is_authenticated:
        can_see_location = can_see_exact_location(user, property_obj)
        
    landmark = hostel_config.landmark if hostel_config else None
    street_address = hostel_config.street_address if hostel_config else None

    room_options = []
    available_sharing_types = []
    starting_price = float(property_obj.price)

    if hostel_config:
        if hostel_config.price_monthly:
            starting_price = float(hostel_config.price_monthly)

        SHARING_LABEL_MAP = {
            '1': 'Single Occupancy',
            '2': 'Double Sharing',
            '3': 'Triple Sharing',
            '4': 'Quad Sharing',
            'dorm': 'Dormitory Bed Space',
        }
        SHARING_SHORT_MAP = {
            '1': 'Single',
            '2': 'Double',
            '3': 'Triple',
            '4': 'Quad',
            'dorm': 'Dormitory',
        }

        # Check if actual HostelRoom models exist
        db_rooms = list(hostel_config.rooms.all().prefetch_related('beds'))
        if db_rooms:
            groups = {}
            for room in db_rooms:
                key = (str(room.sharing_type), room.is_ac)
                if key not in groups:
                    groups[key] = []
                groups[key].append(room)

            opt_idx = 1
            for (stype, is_ac), rooms_in_group in groups.items():
                rates = [float(r.monthly_rate) for r in rooms_in_group if r.monthly_rate is not None]
                min_rate = min(rates) if rates else starting_price
                
                total_beds = 0
                vacant_beds = 0
                attached_bath = False
                for room in rooms_in_group:
                    if room.has_attached_bathroom:
                        attached_bath = True
                    beds = list(room.beds.all())
                    if beds:
                        total_beds += len(beds)
                        vacant_beds += sum(1 for b in beds if b.bed_status == 'Vacant')
                    else:
                        # Fallback capacity estimate if bed objects aren't populated
                        cap = int(stype) if stype.isdigit() else 4
                        total_beds += cap
                        vacant_beds += cap

                sharing_label = SHARING_LABEL_MAP.get(stype, f"{stype} Sharing")
                if is_ac:
                    sharing_label += " (AC)"
                else:
                    sharing_label += " (Non-AC)"

                short_label = SHARING_SHORT_MAP.get(stype, stype.capitalize())
                if short_label not in available_sharing_types:
                    available_sharing_types.append(short_label)

                status_str = 'available' if vacant_beds > 1 else ('last_beds' if vacant_beds == 1 else 'fully_booked')

                # Estimate deposit as 1.5x monthly rate or round number
                sec_deposit = round(min_rate * 1.5, -2)

                room_options.append({
                    "id": f"opt-{opt_idx}",
                    "sharing_type": stype,
                    "sharing_label": sharing_label,
                    "is_ac": is_ac,
                    "has_attached_bathroom": attached_bath,
                    "monthly_rate": min_rate,
                    "security_deposit": sec_deposit,
                    "total_beds": total_beds,
                    "vacant_beds": vacant_beds,
                    "food_included": hostel_config.mess_food,
                    "status": status_str
                })
                opt_idx += 1
        else:
            # Fallback if HostelRoom rows are not created yet
            sharings_list = hostel_config.sharings if isinstance(hostel_config.sharings, list) and hostel_config.sharings else ['1', '2', '3', 'dorm']
            pricing_map = {}
            if isinstance(hostel_config.hostel_pricing, list):
                for p in hostel_config.hostel_pricing:
                    if isinstance(p, dict) and 'sharing' in p and 'rate' in p:
                        pricing_map[str(p['sharing'])] = float(p['rate'])

            opt_idx = 1
            for stype in sharings_list:
                stype_str = str(stype)
                rate = pricing_map.get(stype_str, starting_price)
                short_label = SHARING_SHORT_MAP.get(stype_str, stype_str.capitalize())
                if short_label not in available_sharing_types:
                    available_sharing_types.append(short_label)

                # Non-AC option
                room_options.append({
                    "id": f"opt-{opt_idx}",
                    "sharing_type": stype_str,
                    "sharing_label": f"{SHARING_LABEL_MAP.get(stype_str, stype_str)} (Non-AC)",
                    "is_ac": False,
                    "has_attached_bathroom": hostel_config.attached_bathrooms or False,
                    "monthly_rate": rate,
                    "security_deposit": round(rate * 1.5, -2),
                    "total_beds": hostel_config.total_bed_spaces or 10,
                    "vacant_beds": hostel_config.vacant_beds if hostel_config.vacant_beds is not None else 4,
                    "food_included": hostel_config.mess_food,
                    "status": "available"
                })
                opt_idx += 1

                # AC option if AC is available
                if hostel_config.ac_available:
                    ac_rate = round(rate * 1.25, -2)
                    room_options.append({
                        "id": f"opt-{opt_idx}",
                        "sharing_type": stype_str,
                        "sharing_label": f"{SHARING_LABEL_MAP.get(stype_str, stype_str)} (AC)",
                        "is_ac": True,
                        "has_attached_bathroom": hostel_config.attached_bathrooms or False,
                        "monthly_rate": ac_rate,
                        "security_deposit": round(ac_rate * 1.5, -2),
                        "total_beds": hostel_config.total_bed_spaces or 10,
                        "vacant_beds": max(1, (hostel_config.vacant_beds or 4) - 1),
                        "food_included": hostel_config.mess_food,
                        "status": "available"
                    })
                    opt_idx += 1

        if room_options:
            all_rates = [ro["monthly_rate"] for ro in room_options if ro["monthly_rate"]]
            if all_rates:
                starting_price = min(all_rates)

    # Free-form spec fields stored as JSON on the row — read once here so the
    # response can fall back to sensible defaults for older rows that predate `specs`.
    specs = property_obj.specs if isinstance(property_obj.specs, dict) else {}

    return {
        "id": str(property_obj.id),
        "title": property_obj.title,
        "description": property_obj.description,
        "price": float(hostel_config.price_monthly) if hostel_config and hostel_config.price_monthly else float(property_obj.price),
        "starting_price": starting_price,
        "available_sharing_types": available_sharing_types,
        "room_options": room_options,
        "property_type": property_obj.property_type.name.lower() if property_obj.property_type else "flat",
        "listing_type": property_obj.listing_purpose.lower(),
        "bedrooms": property_obj.bedrooms,
        "bathrooms": hostel_config.bathroom_count if hostel_config else property_obj.bathrooms,
        "area_sqft": float(property_obj.area_sqft) if property_obj.area_sqft else None,
        "landmark": property_obj.landmark or (hostel_config.landmark if hostel_config else None),
        "street_address": hostel_config.street_address if hostel_config else None,
        "security_deposit": float(property_obj.security_deposit) if property_obj.security_deposit else None,
        "show_contact_details": bool(property_obj.show_contact_details),
        "contact_name": property_obj.contact_name,
        "contact_phone": property_obj.contact_phone,
        "city": property_obj.city.name if property_obj.city else None,
        "state": property_obj.state.name if property_obj.state else None,
        "area": property_obj.area.name if property_obj.area else None,
        "zip_code": property_obj.zip_code if hasattr(property_obj, 'zip_code') else None,
        "address": property_obj.address_line_1,
        "latitude": float(property_obj.latitude) if property_obj.latitude else None,
        "longitude": float(property_obj.longitude) if property_obj.longitude else None,
        "location_unlocked": can_see_location,
        "images": images,
        "cover_image": cover_image_url or (images[0] if images else None),
        "hostel_photos": hostel_photos,
        "videos": videos,
        "status": 'published' if (property_obj.verification_status == 'Verified' and property_obj.listing_status == 'Active') else 'rejected' if property_obj.verification_status == 'Rejected' else 'pending' if property_obj.verification_status == 'Pending' else 'draft',
        "is_published": property_obj.verification_status == 'Verified' and property_obj.listing_status == 'Active',
        "user_id": str(owner.id),
        "user": owner_data,
        "total_rooms": specs.get('total_rooms') or (hostel_config.total_rooms if hostel_config else property_obj.bedrooms),
        "is_furnished": property_obj.furnishing_status == 'Furnished',
        "furniture_list": specs.get('furniture_list') or [],
        "num_beds": specs.get('num_beds') or (hostel_config.total_bed_spaces if hostel_config else 1),
        "is_upstairs": specs.get('is_upstairs', False),
        "water_source": specs.get('water_source') or (hostel_config.water_source if hostel_config and hostel_config.water_source else "municipal"),
        "power_backup": specs.get('power_backup') or "none",
        "parking": specs.get('parking') or "none",
        "gated_community": specs.get('gated_community', False),
        "security_features": specs.get('security_features') or [],
        "preferred_tenant": specs.get('preferred_tenant') or "any",
        "preferred_gender": specs.get('preferred_gender') or (('male' if hostel_config.gender_type == 'boys' else 'female' if hostel_config.gender_type == 'girls' else 'any') if hostel_config else "any"),
        "sharing_occupancy": specs.get('sharing_occupancy') or (str(hostel_config.sharings[0]) if hostel_config and isinstance(hostel_config.sharings, list) and len(hostel_config.sharings) > 0 else None),
        "food_included": specs.get('food_included', hostel_config.mess_food if hostel_config else False),
        "wifi_available": specs.get('wifi_available', hostel_config.wifi_enabled if hostel_config else False),
        "ac_available": specs.get('ac_available', hostel_config.ac_available if hostel_config else False),
        "laundry_available": specs.get('laundry_available', hostel_config.laundry_enabled if hostel_config else False),
        "created_at": property_obj.created_at.isoformat() if hasattr(property_obj, 'created_at') else "",
        "updated_at": property_obj.updated_at.isoformat() if hasattr(property_obj, 'updated_at') else "",
    }


class PropertyListView(APIView):
    authentication_classes = [CustomJWTAuthentication]
    permission_classes = []

    def get(self, request, *args, **kwargs):
        from properties.selectors import get_properties_list
        from django.db.models import Q
        from datetime import timedelta
        from django.utils import timezone
        queryset = get_properties_list()

        # --- Omni search: title / description / landmark / address / city / area ---
        search = request.query_params.get('search') or request.query_params.get('q')
        if search:
            queryset = queryset.filter(
                Q(title__icontains=search)
                | Q(description__icontains=search)
                | Q(landmark__icontains=search)
                | Q(address_line_1__icontains=search)
                | Q(city__name__icontains=search)
                | Q(area__name__icontains=search)
            )

        city = request.query_params.get('city')
        if city:
            queryset = queryset.filter(city__name__icontains=city)

        state = request.query_params.get('state')
        if state:
            queryset = queryset.filter(state__name__icontains=state)

        min_price = request.query_params.get('min_price')
        if min_price:
            queryset = queryset.filter(price__gte=min_price)

        max_price = request.query_params.get('max_price')
        if max_price:
            queryset = queryset.filter(price__lte=max_price)

        prop_type = request.query_params.get('property_type')
        if prop_type:
            queryset = queryset.filter(property_type__name__iexact=prop_type)

        listing_type = request.query_params.get('listing_type')
        if listing_type:
            lt_lower = listing_type.lower()
            if lt_lower == "rent":
                purpose = "Rent"
            elif lt_lower == "roommate":
                purpose = "Roommate"
            else:
                purpose = "Sale"
            queryset = queryset.filter(listing_purpose=purpose)

        user_id = request.query_params.get('user_id')
        if user_id:
            if user_id == 'me':
                if request.user and request.user.is_authenticated:
                    queryset = queryset.filter(owner=request.user)
                else:
                    queryset = queryset.none()
            else:
                queryset = queryset.filter(owner_id=user_id)

        is_published = request.query_params.get('is_published')
        if is_published is not None:
            if is_published.lower() == 'false':
                queryset = queryset.filter(verification_status='Pending')
            elif is_published.lower() == 'true':
                queryset = queryset.filter(verification_status='Verified')

        # --- BHK configuration: ?bhk=1,2,3 (multi-select) or ?bedrooms=2 (single) ---
        bhk = request.query_params.get('bhk') or request.query_params.get('bedrooms')
        if bhk:
            bhk_values = [int(x) for x in bhk.split(',') if x.strip().isdigit()]
            if bhk_values:
                queryset = queryset.filter(bedrooms__in=bhk_values)

        # --- Bathrooms (multi-select): ?bathrooms=1,2 ---
        bathrooms = request.query_params.get('bathrooms')
        if bathrooms:
            bath_values = [int(x) for x in bathrooms.split(',') if x.strip().isdigit()]
            if bath_values:
                queryset = queryset.filter(bathrooms__in=bath_values)

        # --- Furnishing status (multi-select): ?furnishing=Furnished,Semi-Furnished ---
        furnishing = request.query_params.get('furnishing')
        if furnishing:
            furn_values = [v.strip() for v in furnishing.split(',') if v.strip()]
            if furn_values:
                queryset = queryset.filter(furnishing_status__in=furn_values)

        # --- Built-up area range: ?min_area=&max_area= ---
        min_area = request.query_params.get('min_area')
        if min_area:
            queryset = queryset.filter(area_sqft__gte=min_area)
        max_area = request.query_params.get('max_area')
        if max_area:
            queryset = queryset.filter(area_sqft__lte=max_area)

        # --- Verified properties only (physically audited): ?verified=true ---
        verified = request.query_params.get('verified')
        if verified and verified.lower() in ('true', '1', 'yes'):
            queryset = queryset.filter(verification_status='Verified')

        # --- Tenant preference (stored in specs JSON): ?tenant_type=family|bachelors ---
        tenant_type = request.query_params.get('tenant_type')
        if tenant_type:
            queryset = queryset.filter(specs__preferred_tenant=tenant_type)

        # --- Preferred gender (specs JSON): ?gender= or ?preferred_gender= ---
        gender = request.query_params.get('gender') or request.query_params.get('preferred_gender')
        if gender:
            queryset = queryset.filter(specs__preferred_gender=gender)

        # --- Freshness: ?added_within=1|7|30 (days) ---
        added_within = request.query_params.get('added_within')
        if added_within and added_within.isdigit():
            cutoff = timezone.now() - timedelta(days=int(added_within))
            queryset = queryset.filter(created_at__gte=cutoff)

        # --- Availability timeline: ?availability=immediate|15|30|30+ ---
        availability = request.query_params.get('availability')
        if availability:
            today = timezone.now().date()
            if availability == 'immediate':
                queryset = queryset.filter(available_from__lte=today)
            elif availability == '15':
                queryset = queryset.filter(available_from__lte=today + timedelta(days=15))
            elif availability == '30':
                queryset = queryset.filter(available_from__lte=today + timedelta(days=30))
            elif availability == '30+':
                queryset = queryset.filter(available_from__gt=today + timedelta(days=30))

        # --- Sorting (default = relevance, i.e. selector's -created_at order) ---
        sort = request.query_params.get('sort')
        if sort == 'price_asc':
            queryset = queryset.order_by('price')
        elif sort == 'price_desc':
            queryset = queryset.order_by('-price')
        elif sort == 'newest':
            queryset = queryset.order_by('-created_at')
        elif sort == 'popular':
            queryset = queryset.order_by('-view_count')

        # Pagination
        page = int(request.query_params.get('page', 1))
        page_size = int(request.query_params.get('page_size', 12))
        
        total = queryset.count()
        start = (page - 1) * page_size
        end = start + page_size
        
        paginated_queryset = queryset[start:end]
        serialized_data = [serialize_property(p, request.user, request=request) for p in paginated_queryset]
        
        total_pages = (total + page_size - 1) // page_size
        
        return Response({
            "success": True,
            "data": serialized_data,
            "pagination": {
                "page": page,
                "pageSize": page_size,
                "total": total,
                "totalPages": total_pages,
                "hasNext": page < total_pages,
                "hasPrevious": page > 1
            }
        }, status=status.HTTP_200_OK)

    def post(self, request, *args, **kwargs):
        if not request.user or not request.user.is_authenticated:
            return Response({
                "success": False, 
                "error": {"message": "Authentication credentials were not provided."}
            }, status=status.HTTP_401_UNAUTHORIZED)

        from properties.api.serializers import PropertyCreateSerializer
        from properties.services import create_property
        
        serializer = PropertyCreateSerializer(data=request.data)
        if not serializer.is_valid():
            return Response({
                "success": False,
                "error": {"message": "Invalid data", "details": serializer.errors}
            }, status=status.HTTP_400_BAD_REQUEST)
            
        try:
            property_obj = create_property(user=request.user, validated_data=serializer.validated_data)
        except Exception as e:
            return Response({
                "success": False,
                "error": {"message": str(e)}
            }, status=status.HTTP_500_INTERNAL_SERVER_ERROR)

        return Response({
            "success": True,
            "data": serialize_property(property_obj, user=request.user, request=request),
            "message": "Property listed successfully."
        }, status=status.HTTP_201_CREATED)

class PropertyDetailView(APIView):
    authentication_classes = [CustomJWTAuthentication]
    permission_classes = []

    def get(self, request, pk, *args, **kwargs):
        try:
            property_obj = Property.objects.get(id=pk)
            return Response({
                "success": True,
                "data": serialize_property(property_obj, request.user, request=request)
            }, status=status.HTTP_200_OK)
        except Property.DoesNotExist:
            return Response({
                "success": False, 
                "error": {"message": "Property not found"}
            }, status=status.HTTP_404_NOT_FOUND)

    def delete(self, request, pk, *args, **kwargs):
        if not request.user or not request.user.is_authenticated:
            return Response({
                "success": False, 
                "error": {"message": "Authentication credentials were not provided."}
            }, status=status.HTTP_401_UNAUTHORIZED)
            
        try:
            property_obj = Property.objects.get(id=pk)
            if property_obj.owner != request.user and not request.user.is_superuser:
                return Response({
                    "success": False, 
                    "error": {"message": "You do not have permission to delete this property."}
                }, status=status.HTTP_403_FORBIDDEN)
                
            property_obj.delete()
            return Response({
                "success": True,
                "message": "Property deleted successfully."
            }, status=status.HTTP_200_OK)
        except Property.DoesNotExist:
            return Response({
                "success": False, 
                "error": {"message": "Property not found"}
            }, status=status.HTTP_404_NOT_FOUND)

class PropertyPostAdsView(PropertyListView):
    pass

def serialize_visit(visit):
    return {
        "id": str(visit.id),
        "property": {
            "id": str(visit.property.id),
            "title": visit.property.title,
            "city": visit.property.city.name if visit.property.city else "",
        },
        "visitor": {
            "id": str(visit.visitor.id),
            "name": f"{visit.visitor.first_name} {visit.visitor.last_name}".strip(),
            "phone": visit.visitor.phone_number,
        },
        "visit_date": visit.visit_date.isoformat(),
        "visit_time": visit.visit_time.isoformat(),
        "status": visit.visit_status,
        "visitor_notes": visit.visitor_notes,
        "owner_notes": visit.owner_notes,
        "created_at": visit.created_at.isoformat() if hasattr(visit, 'created_at') else "",
    }

class VisitRequestView(APIView):
    authentication_classes = [CustomJWTAuthentication]
    permission_classes = [IsAuthenticated]

    def post(self, request, *args, **kwargs):
        from properties.services import request_visit
        
        property_id = request.data.get("property_id")
        visit_date = request.data.get("visit_date")
        visit_time = request.data.get("visit_time")
        notes = request.data.get("notes")
        
        if not property_id or not visit_date or not visit_time:
            return Response({
                "success": False,
                "error": {"message": "property_id, visit_date, and visit_time are required"}
            }, status=status.HTTP_400_BAD_REQUEST)
            
        try:
            visit = request_visit(
                user=request.user,
                property_id=property_id,
                visit_date=visit_date,
                visit_time=visit_time,
                notes=notes
            )
            
            return Response({
                "success": True,
                "data": serialize_visit(visit),
                "message": "Visit requested successfully"
            }, status=status.HTTP_201_CREATED)
            
        except ValueError as e:
            return Response({
                "success": False,
                "error": {"message": str(e)}
            }, status=status.HTTP_400_BAD_REQUEST)
        except Exception as e:
            return Response({
                "success": False,
                "error": {"message": str(e)}
            }, status=status.HTTP_500_INTERNAL_SERVER_ERROR)

class VisitListView(APIView):
    authentication_classes = [CustomJWTAuthentication]
    permission_classes = [IsAuthenticated]

    def get(self, request, *args, **kwargs):
        from properties.selectors import get_user_visits, get_property_visit_requests
        
        role = request.query_params.get("role", "visitor")
        
        if role == "owner":
            visits = get_property_visit_requests(owner_user=request.user)
        else:
            visits = get_user_visits(user=request.user)
            
        data = [serialize_visit(v) for v in visits]
        
        return Response({
            "success": True,
            "data": data,
            "message": "Visits retrieved successfully"
        }, status=status.HTTP_200_OK)

class VisitStatusUpdateView(APIView):
    authentication_classes = [CustomJWTAuthentication]
    permission_classes = [IsAuthenticated]

    def patch(self, request, pk, *args, **kwargs):
        from properties.services import update_visit_status
        
        status_val = request.data.get("status")
        notes = request.data.get("notes")
        
        if not status_val:
            return Response({
                "success": False,
                "error": {"message": "status is required"}
            }, status=status.HTTP_400_BAD_REQUEST)
            
        try:
            visit = update_visit_status(
                user=request.user,
                visit_id=pk,
                new_status=status_val,
                notes=notes
            )
            
            return Response({
                "success": True,
                "data": serialize_visit(visit),
                "message": "Visit status updated successfully"
            }, status=status.HTTP_200_OK)
            
        except PermissionError as e:
            return Response({
                "success": False,
                "error": {"message": str(e)}
            }, status=status.HTTP_403_FORBIDDEN)
        except ValueError as e:
            return Response({
                "success": False,
                "error": {"message": str(e)}
            }, status=status.HTTP_400_BAD_REQUEST)
        except Exception as e:
            return Response({
                "success": False,
                "error": {"message": str(e)}
            }, status=status.HTTP_500_INTERNAL_SERVER_ERROR)

def serialize_hostel_config(config):
    if not config:
        return None
    return {
        "hostelName": config.hostel_name,
        "totalBedSpaces": config.total_bed_spaces,
        "totalRooms": config.total_rooms,
        "bathroomCount": config.bathroom_count,
        "attachedBathrooms": config.attached_bathrooms,
        "genderType": config.gender_type,
        "sharings": config.sharings,
        "wifiEnabled": config.wifi_enabled,
        "wifiSpeed": config.wifi_speed,
        "hotWater": config.hot_water,
        "waterFilter": config.water_filter,
        "messFood": config.mess_food,
        "laundryEnabled": config.laundry_enabled,
        "acAvailable": config.ac_available,
        "waterSource": config.water_source,
        "vacantBeds": config.vacant_beds,
        "vacantRooms": config.vacant_rooms,
        "vacantSharings": config.vacant_sharings,
        "priceMonthly": config.price_monthly,
        "hostelPricing": config.hostel_pricing,
        "landmark": config.landmark,
        "streetAddress": config.street_address,
        "parking": config.parking,
        "preferredTenant": config.preferred_tenant,
        "isUpstairs": config.is_upstairs,
        "city": config.property.city.name if config.property.city else None,
        "state": config.property.state.name if config.property.state else None,
        "area": config.property.area.name if config.property.area else None,
        "zipCode": config.property.zip_code if hasattr(config.property, 'zip_code') else None,
        "address": config.property.address_line_1,
        "latitude": config.property.latitude,
        "longitude": config.property.longitude,
        "description": config.property.description,
    }

class HostelConfigDetailView(APIView):
    authentication_classes = [CustomJWTAuthentication]
    permission_classes = []

    def get(self, request, property_id, *args, **kwargs):
        from properties.selectors import get_hostel_config
        config = get_hostel_config(property_id=property_id)
        
        if not config:
            return Response({
                "success": False,
                "error": {"message": "Hostel config not found"}
            }, status=status.HTTP_404_NOT_FOUND)
            
        return Response({
            "success": True,
            "data": serialize_hostel_config(config)
        }, status=status.HTTP_200_OK)

class HostelConfigUpdateView(APIView):
    authentication_classes = [CustomJWTAuthentication]
    permission_classes = [IsAuthenticated]

    def put(self, request, property_id, *args, **kwargs):
        from properties.services import update_hostel_config
        from properties.api.serializers import HostelConfigUpdateSerializer
        
        data = request.data
        mapped_data = {
            "hostel_name": data.get("hostelName"),
            "total_bed_spaces": data.get("totalBedSpaces"),
            "total_rooms": data.get("totalRooms"),
            "bathroom_count": data.get("bathroomCount"),
            "attached_bathrooms": data.get("attachedBathrooms"),
            "gender_type": data.get("genderType"),
            "sharings": data.get("sharings", []),
            "wifi_enabled": data.get("wifiEnabled"),
            "wifi_speed": data.get("wifiSpeed"),
            "hot_water": data.get("hotWater"),
            "water_filter": data.get("waterFilter"),
            "mess_food": data.get("messFood"),
            "laundry_enabled": data.get("laundryEnabled"),
            "ac_available": data.get("acAvailable"),
            "water_source": data.get("waterSource"),
            "vacant_beds": data.get("vacantBeds"),
            "vacant_rooms": data.get("vacantRooms"),
            "vacant_sharings": data.get("vacantSharings", []),
            "price_monthly": data.get("priceMonthly"),
            "hostel_pricing": data.get("hostelPricing", []),
            "landmark": data.get("landmark"),
            "street_address": data.get("streetAddress"),
            "address": data.get("address"),
            "city": data.get("city"),
            "state": data.get("state"),
            "area": data.get("area"),
            "zip_code": data.get("zipCode"),
            "latitude": data.get("latitude"),
            "longitude": data.get("longitude"),
            "description": data.get("description"),
            "parking": data.get("parking"),
            "preferred_tenant": data.get("preferredTenant"),
            "is_upstairs": data.get("isUpstairs"),
        }
        
        # Remove keys that were not present in the original request to allow partial updates
        # Wait, since data.get() returns None if missing, we need to check if key in data
        camel_to_snake = {
            "hostelName": "hostel_name", "totalBedSpaces": "total_bed_spaces", "totalRooms": "total_rooms",
            "bathroomCount": "bathroom_count", "attachedBathrooms": "attached_bathrooms", "genderType": "gender_type",
            "sharings": "sharings", "wifiEnabled": "wifi_enabled", "wifiSpeed": "wifi_speed",
            "hotWater": "hot_water", "waterFilter": "water_filter", "messFood": "mess_food",
            "laundryEnabled": "laundry_enabled", "acAvailable": "ac_available", "waterSource": "water_source",
            "vacantBeds": "vacant_beds", "vacantRooms": "vacant_rooms", "vacantSharings": "vacant_sharings",
            "priceMonthly": "price_monthly", "hostelPricing": "hostel_pricing", "landmark": "landmark",
            "streetAddress": "street_address", "address": "address", "city": "city", "state": "state",
            "area": "area", "zipCode": "zip_code", "latitude": "latitude", "longitude": "longitude",
            "description": "description", "parking": "parking", "preferredTenant": "preferred_tenant",
            "isUpstairs": "is_upstairs"
        }
        
        final_data = {}
        for camel, snake in camel_to_snake.items():
            if camel in data:
                final_data[snake] = data[camel]
                
        serializer = HostelConfigUpdateSerializer(data=final_data, partial=True)
        if not serializer.is_valid():
            return Response({
                "success": False,
                "error": {"message": "Invalid data", "details": serializer.errors}
            }, status=status.HTTP_400_BAD_REQUEST)
        
        try:
            config = update_hostel_config(
                user=request.user,
                property_id=property_id,
                **serializer.validated_data
            )
            
            return Response({
                "success": True,
                "data": serialize_hostel_config(config),
                "message": "Hostel config updated successfully"
            }, status=status.HTTP_200_OK)
            
        except PermissionError as e:
            return Response({
                "success": False,
                "error": {"message": str(e)}
            }, status=status.HTTP_403_FORBIDDEN)
        except Exception as e:
            return Response({
                "success": False,
                "error": {"message": str(e)}
            }, status=status.HTTP_400_BAD_REQUEST)

class PropertyVerifyView(APIView):
    authentication_classes = [CustomJWTAuthentication]
    permission_classes = [IsAuthenticated]

    def patch(self, request, pk, *args, **kwargs):
        user_role = request.user.user_roles.first()
        if not user_role or user_role.role.name.lower() not in ['employee', 'super_admin']:
            return Response({"success": False, "error": {"message": "Unauthorized"}}, status=status.HTTP_403_FORBIDDEN)
            
        try:
            property_obj = Property.objects.get(id=pk)
            property_obj.listing_status = 'Active'
            property_obj.verification_status = 'Verified'
            property_obj.save()
            
            # Since serialize_property uses "is_published", "status", we assume Active=published
            # if that logic isn't mapped, we can just return success true for now.
            return Response({
                "success": True,
                "data": serialize_property(property_obj, request.user, request=request),
                "message": "Property verified successfully"
            }, status=status.HTTP_200_OK)
        except Property.DoesNotExist:
            return Response({"success": False, "error": {"message": "Property not found"}}, status=status.HTTP_404_NOT_FOUND)

class PropertyLocationView(APIView):
    authentication_classes = [CustomJWTAuthentication]
    permission_classes = [IsAuthenticated]

    def get(self, request, pk, *args, **kwargs):
        try:
            property_obj = Property.objects.get(id=pk)
            if not can_see_exact_location(request.user, property_obj):
                return Response({
                    "success": False,
                    "error": {"message": "You do not have permission to view the exact location of this property. Wait for the owner to accept your inquiry."}
                }, status=status.HTTP_403_FORBIDDEN)
                
            return Response({
                "success": True,
                "data": {
                    "latitude": float(property_obj.latitude) if property_obj.latitude else None,
                    "longitude": float(property_obj.longitude) if property_obj.longitude else None,
                    "address_line_1": property_obj.address_line_1,
                    "google_maps_url": f"https://www.google.com/maps/search/?api=1&query={property_obj.latitude},{property_obj.longitude}" if property_obj.latitude and property_obj.longitude else None
                }
            }, status=status.HTTP_200_OK)
        except Property.DoesNotExist:
            return Response({"success": False, "error": {"message": "Property not found"}}, status=status.HTTP_404_NOT_FOUND)

from accounts.api.permissions import IsSuperAdmin
from accounts.api.services.admin_credential_service import AdminCredentialService
from properties.models import HostelConfig

class HostelCreateView(APIView):
    authentication_classes = [CustomJWTAuthentication]
    permission_classes = [IsSuperAdmin]

    def get(self, request, *args, **kwargs):
        from properties.models import Property
        hostels = Property.objects.filter(property_type__name__iexact='Hostel').select_related('owner', 'hostel_config', 'city')
        
        data = []
        for h in hostels:
            config = getattr(h, 'hostel_config', None)
            data.append({
                "id": str(h.id),
                "title": h.title,
                "address": h.address_line_1,
                "city": h.city.name if h.city else "",
                "created_at": h.created_at.isoformat() if hasattr(h, 'created_at') else "",
                "admin": {
                    "email": h.owner.email if h.owner else "",
                    "name": f"{h.owner.first_name} {h.owner.last_name}".strip() if h.owner else "",
                },
                "total_bed_spaces": config.total_bed_spaces if config else 0,
                "vacant_beds": config.vacant_beds if config else 0,
            })
            
        return Response({
            "success": True,
            "data": data
        }, status=status.HTTP_200_OK)

    def post(self, request, *args, **kwargs):
        # Expected fields
        email = request.data.get('email')
        first_name = request.data.get('first_name')
        last_name = request.data.get('last_name')
        hostel_name = request.data.get('hostel_name')
        
        if not all([email, first_name, last_name, hostel_name]):
            return Response({'error': 'email, first_name, last_name, and hostel_name are required.'}, status=status.HTTP_400_BAD_REQUEST)

        # Create user + credentials
        try:
            user, password = AdminCredentialService.create_hostel_admin(
                email=email,
                first_name=first_name,
                last_name=last_name
            )
        except Exception as e:
            if "UNIQUE constraint failed" in str(e) or "accounts_user.email" in str(e):
                return Response({'error': 'A user with this email already exists.'}, status=status.HTTP_400_BAD_REQUEST)
            return Response({'error': f'Failed to create hostel admin: {str(e)}'}, status=status.HTTP_400_BAD_REQUEST)

        # Fetch or create PropertyType
        from properties.models import PropertyType
        property_type_obj, _ = PropertyType.objects.get_or_create(name='Hostel')

        # Dummy geo details
        from geo.models import Country, State, District, City
        import datetime
        country, _ = Country.objects.get_or_create(name='Unknown', country_code='UN')
        state, _ = State.objects.get_or_create(name='Unknown', country=country)
        district, _ = District.objects.get_or_create(name='Unknown', state=state)
        city, _ = City.objects.get_or_create(name='Unknown', district=district)

        # Create the Property
        property_obj = Property.objects.create(
            owner=user,
            title=hostel_name,
            property_type=property_type_obj,
            listing_purpose='Rent',
            listing_status='Active',
            verification_status='Verified',
            country=country,
            state=state,
            city=city,
            address_line_1='To be updated',
            price=0,
            currency_code='USD',
            available_from=datetime.date.today()
        )

        # Create the HostelConfig
        HostelConfig.objects.create(
            property=property_obj,
            hostel_name=hostel_name,
            total_bed_spaces=0,
            total_rooms=0,
            bathroom_count=0
        )

        return Response({
            'message': 'Hostel and admin created successfully.',
            'hostel_id': property_obj.id,
            'admin_credentials': {
                'email': email,
                'password': password
            }
        }, status=status.HTTP_201_CREATED)


class HostelPhotoListView(APIView):
    authentication_classes = [CustomJWTAuthentication]
    permission_classes = []

    def get(self, request, property_id, *args, **kwargs):
        try:
            property_obj = Property.objects.get(id=property_id)
        except Property.DoesNotExist:
            return Response({"success": False, "error": {"message": "Property not found"}}, status=status.HTTP_404_NOT_FOUND)

        hostel_config = getattr(property_obj, 'hostel_config', None)
        if not hostel_config:
            return Response({"success": False, "error": {"message": "Hostel configuration not found"}}, status=status.HTTP_404_NOT_FOUND)

        photos = hostel_config.photos.all().order_by('-is_cover', '-created_at')
        serialized = [serialize_hostel_photo(p, request=request) for p in photos]

        return Response({
            "success": True,
            "data": serialized
        }, status=status.HTTP_200_OK)


class HostelPhotoUploadView(APIView):
    authentication_classes = [CustomJWTAuthentication]
    permission_classes = [IsAuthenticated]
    parser_classes = [MultiPartParser, FormParser]

    def post(self, request, property_id, *args, **kwargs):
        try:
            property_obj = Property.objects.get(id=property_id)
        except Property.DoesNotExist:
            return Response({"success": False, "error": {"message": "Property not found"}}, status=status.HTTP_404_NOT_FOUND)

        if property_obj.owner != request.user and not request.user.user_roles.filter(role__name='hostel_admin').exists() and not request.user.is_staff and not request.user.is_superuser:
            return Response({"success": False, "error": {"message": "You do not have permission to upload photos for this hostel."}}, status=status.HTTP_403_FORBIDDEN)

        hostel_config, _ = HostelConfig.objects.get_or_create(
            property=property_obj,
            defaults={"hostel_name": property_obj.title}
        )

        category = request.data.get('category', 'COMMON_AREA').upper()
        valid_categories = ['COVER', 'ENTRANCE', 'ROOM', 'BATHROOM', 'DINING', 'COMMON_AREA']
        if category not in valid_categories:
            category = 'COMMON_AREA'

        is_cover_param = request.data.get('is_cover', 'false')
        is_cover = str(is_cover_param).lower() in ['true', '1'] or category == 'COVER'
        if category == 'COVER':
            is_cover = True

        files = request.FILES.getlist('images') or request.FILES.getlist('image') or request.FILES.getlist('file')
        if not files and 'file' in request.FILES:
            files = [request.FILES['file']]
        elif not files and 'image' in request.FILES:
            files = [request.FILES['image']]

        if not files:
            return Response({"success": False, "error": {"message": "No image files provided."}}, status=status.HTTP_400_BAD_REQUEST)

        allowed_extensions = ['.jpg', '.jpeg', '.png', '.webp']
        max_size = 5 * 1024 * 1024  # 5MB

        created_photos = []
        for file_obj in files:
            ext = os.path.splitext(file_obj.name)[1].lower()
            if ext not in allowed_extensions:
                return Response({
                    "success": False,
                    "error": {"message": f"Invalid image format '{ext}'. Allowed formats: JPG, PNG, WebP."}
                }, status=status.HTTP_400_BAD_REQUEST)

            if file_obj.size > max_size:
                return Response({
                    "success": False,
                    "error": {"message": f"File '{file_obj.name}' exceeds the maximum allowed size of 5MB."}
                }, status=status.HTTP_400_BAD_REQUEST)

            if is_cover:
                HostelPhoto.objects.filter(hostel_config=hostel_config).update(is_cover=False)

            photo = HostelPhoto.objects.create(
                hostel_config=hostel_config,
                image=file_obj,
                category=category,
                is_cover=is_cover
            )
            created_photos.append(photo)

            if is_cover:
                is_cover = False  # Only first uploaded image in batch gets cover flag if multiple uploaded

        serialized = [serialize_hostel_photo(p, request=request) for p in created_photos]
        return Response({
            "success": True,
            "data": serialized,
            "message": "Photos uploaded successfully."
        }, status=status.HTTP_201_CREATED)


class HostelPhotoCoverView(APIView):
    authentication_classes = [CustomJWTAuthentication]
    permission_classes = [IsAuthenticated]

    def put(self, request, property_id, photo_id, *args, **kwargs):
        try:
            property_obj = Property.objects.get(id=property_id)
        except Property.DoesNotExist:
            return Response({"success": False, "error": {"message": "Property not found"}}, status=status.HTTP_404_NOT_FOUND)

        if property_obj.owner != request.user and not request.user.user_roles.filter(role__name='hostel_admin').exists() and not request.user.is_staff and not request.user.is_superuser:
            return Response({"success": False, "error": {"message": "You do not have permission to update photos for this hostel."}}, status=status.HTTP_403_FORBIDDEN)

        hostel_config = getattr(property_obj, 'hostel_config', None)
        if not hostel_config:
            return Response({"success": False, "error": {"message": "Hostel configuration not found"}}, status=status.HTTP_404_NOT_FOUND)

        try:
            photo = HostelPhoto.objects.get(id=photo_id, hostel_config=hostel_config)
        except HostelPhoto.DoesNotExist:
            return Response({"success": False, "error": {"message": "Photo not found"}}, status=status.HTTP_404_NOT_FOUND)

        from properties.services import set_hostel_cover_photo
        
        photo = set_hostel_cover_photo(
            user=request.user,
            property_id=property_id,
            photo_id=photo_id
        )

        return Response({
            "success": True,
            "data": serialize_hostel_photo(photo, request=request),
            "message": "Cover photo updated successfully"
        }, status=status.HTTP_200_OK)


class HostelPhotoDeleteView(APIView):
    authentication_classes = [CustomJWTAuthentication]
    permission_classes = [IsAuthenticated]

    def delete(self, request, property_id, photo_id, *args, **kwargs):
        try:
            property_obj = Property.objects.get(id=property_id)
        except Property.DoesNotExist:
            return Response({"success": False, "error": {"message": "Property not found"}}, status=status.HTTP_404_NOT_FOUND)

        if property_obj.owner != request.user and not request.user.user_roles.filter(role__name='hostel_admin').exists() and not request.user.is_staff and not request.user.is_superuser:
            return Response({"success": False, "error": {"message": "You do not have permission to delete photos for this hostel."}}, status=status.HTTP_403_FORBIDDEN)

        hostel_config = getattr(property_obj, 'hostel_config', None)
        if not hostel_config:
            return Response({"success": False, "error": {"message": "Hostel configuration not found"}}, status=status.HTTP_404_NOT_FOUND)

        try:
            photo = HostelPhoto.objects.get(id=photo_id, hostel_config=hostel_config)
        except HostelPhoto.DoesNotExist:
            return Response({"success": False, "error": {"message": "Photo not found"}}, status=status.HTTP_404_NOT_FOUND)

        photo.delete()

        return Response({
            "success": True,
            "message": "Photo deleted successfully."
        }, status=status.HTTP_200_OK)
