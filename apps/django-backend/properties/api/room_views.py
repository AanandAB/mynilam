from rest_framework.views import APIView
from rest_framework.response import Response
from rest_framework import status
from rest_framework.permissions import IsAuthenticated
from core.jwt import CustomJWTAuthentication
from properties.models import Property, HostelConfig, HostelRoom, HostelBed
from django.db import transaction

def serialize_bed(bed):
    return {
        "id": str(bed.id),
        "bed_name": bed.bed_name,
        "bed_status": bed.bed_status,
        "assigned_tenant": {
            "id": str(bed.assigned_tenant.id),
            "name": f"{bed.assigned_tenant.first_name} {bed.assigned_tenant.last_name}".strip() or bed.assigned_tenant.email,
            "email": bed.assigned_tenant.email,
        } if bed.assigned_tenant else None,
        "check_in_date": bed.check_in_date.isoformat() if bed.check_in_date else None,
        "check_out_date": bed.check_out_date.isoformat() if bed.check_out_date else None,
    }

def serialize_room(room):
    beds = [serialize_bed(b) for b in room.beds.all().order_by('bed_name')]
    vacant_count = sum(1 for b in beds if b['bed_status'] == 'Vacant')
    occupied_count = sum(1 for b in beds if b['bed_status'] == 'Occupied')
    
    return {
        "id": str(room.id),
        "room_number": room.room_number,
        "floor_number": room.floor_number,
        "sharing_type": room.sharing_type,
        "monthly_rate": float(room.monthly_rate) if room.monthly_rate else None,
        "is_ac": room.is_ac,
        "has_attached_bathroom": room.has_attached_bathroom,
        "notes": room.notes or "",
        "total_beds": len(beds),
        "vacant_beds": vacant_count,
        "occupied_beds": occupied_count,
        "beds": beds,
    }

def sync_hostel_vacancy(hostel_config):
    """
    Recalculates total_bed_spaces, total_rooms, vacant_beds, vacant_rooms, and bathroom_count
    based on actual HostelRoom and HostelBed database entries.
    """
    rooms = hostel_config.rooms.all()
    if not rooms.exists():
        return
        
    total_rooms = rooms.count()
    all_beds = HostelBed.objects.filter(room__hostel_config=hostel_config)
    total_beds = all_beds.count()
    vacant_beds = all_beds.filter(bed_status='Vacant').count()
    
    # A room is considered vacant if it has at least 1 vacant bed
    vacant_rooms = 0
    for r in rooms:
        if r.beds.filter(bed_status='Vacant').exists():
            vacant_rooms += 1

    # Bathroom count: attached bathrooms + 1 if no attached bath
    attached_baths = rooms.filter(has_attached_bathroom=True).count()
    bathroom_count = attached_baths if attached_baths > 0 else total_rooms

    hostel_config.total_rooms = total_rooms
    hostel_config.total_bed_spaces = total_beds
    hostel_config.vacant_beds = vacant_beds
    hostel_config.vacant_rooms = vacant_rooms
    hostel_config.bathroom_count = bathroom_count
    hostel_config.save(update_fields=['total_rooms', 'total_bed_spaces', 'vacant_beds', 'vacant_rooms', 'bathroom_count'])


def auto_seed_rooms_from_config(hostel_config):
    """
    If no rooms exist yet for this hostel_config, convert old aggregate values
    (total_rooms, total_bed_spaces, price_monthly) into physical HostelRoom and HostelBed records.
    """
    if hostel_config.rooms.exists():
        return

    num_rooms = hostel_config.total_rooms if (hostel_config.total_rooms and hostel_config.total_rooms > 0) else 4
    beds_per_room = 2
    if hostel_config.total_bed_spaces and hostel_config.total_rooms and hostel_config.total_rooms > 0:
        calculated = hostel_config.total_bed_spaces // hostel_config.total_rooms
        if calculated in [1, 2, 3, 4, 6]:
            beds_per_room = calculated

    sharing_type = str(beds_per_room) if beds_per_room in [1, 2, 3, 4] else 'dorm'
    bed_labels = ["A", "B", "C", "D", "E", "F"]

    with transaction.atomic():
        rooms_to_create = min(num_rooms, 20) # Cap initial auto-seed to 20 rooms max
        for i in range(rooms_to_create):
            floor = (i // 10) + 1
            room_num = f"{floor}{i % 10 + 1:02d}"
            
            room = HostelRoom.objects.create(
                hostel_config=hostel_config,
                room_number=room_num,
                floor_number=floor,
                sharing_type=sharing_type,
                monthly_rate=hostel_config.price_monthly or 8500,
                is_ac=hostel_config.ac_available,
                has_attached_bathroom=hostel_config.attached_bathrooms,
            )

            for b in range(beds_per_room):
                label = bed_labels[b] if b < len(bed_labels) else f"Bed-{b+1}"
                HostelBed.objects.create(
                    room=room,
                    bed_name=f"Bed {label}",
                    bed_status='Vacant'
                )

        sync_hostel_vacancy(hostel_config)


class HostelRoomListCreateView(APIView):
    authentication_classes = [CustomJWTAuthentication]
    permission_classes = [IsAuthenticated]

    def get(self, request, property_id, *args, **kwargs):
        try:
            property_obj = Property.objects.get(id=property_id)
            if not hasattr(property_obj, 'hostel_config'):
                return Response({"success": False, "error": {"message": "Hostel config not found for this property"}}, status=status.HTTP_404_NOT_FOUND)
                
            hostel_config = property_obj.hostel_config
            if not hostel_config.rooms.exists():
                auto_seed_rooms_from_config(hostel_config)

            rooms = hostel_config.rooms.prefetch_related('beds__assigned_tenant').order_by('floor_number', 'room_number')
            data = [serialize_room(r) for r in rooms]
            
            return Response({
                "success": True,
                "data": data,
                "message": "Hostel rooms retrieved successfully"
            }, status=status.HTTP_200_OK)
        except Exception as e:
            return Response({"success": False, "error": {"message": str(e)}}, status=status.HTTP_400_BAD_REQUEST)

    def post(self, request, property_id, *args, **kwargs):
        try:
            property_obj = Property.objects.get(id=property_id)
            if property_obj.owner != request.user and not request.user.is_staff:
                return Response({"success": False, "error": {"message": "Permission denied"}}, status=status.HTTP_403_FORBIDDEN)
                
            hostel_config = getattr(property_obj, 'hostel_config', None)
            if not hostel_config:
                return Response({"success": False, "error": {"message": "Hostel config not found"}}, status=status.HTTP_404_NOT_FOUND)
                
            room_number = request.data.get("room_number")
            sharing_type = str(request.data.get("sharing_type", "2"))
            floor_number = int(request.data.get("floor_number", 1))
            monthly_rate = request.data.get("monthly_rate")
            is_ac = bool(request.data.get("is_ac", False))
            has_attached_bathroom = bool(request.data.get("has_attached_bathroom", True))

            if not room_number:
                return Response({"success": False, "error": {"message": "room_number is required"}}, status=status.HTTP_400_BAD_REQUEST)

            if HostelRoom.objects.filter(hostel_config=hostel_config, room_number=room_number).exists():
                return Response({"success": False, "error": {"message": f"Room {room_number} already exists"}}, status=status.HTTP_400_BAD_REQUEST)

            bed_count_map = {"1": 1, "2": 2, "3": 3, "4": 4, "dorm": 6}
            num_beds = bed_count_map.get(sharing_type, 2)

            with transaction.atomic():
                room = HostelRoom.objects.create(
                    hostel_config=hostel_config,
                    room_number=room_number,
                    floor_number=floor_number,
                    sharing_type=sharing_type,
                    monthly_rate=monthly_rate,
                    is_ac=is_ac,
                    has_attached_bathroom=has_attached_bathroom,
                )
                
                # Auto-generate beds for this room
                bed_labels = ["A", "B", "C", "D", "E", "F"]
                for i in range(num_beds):
                    label = bed_labels[i] if i < len(bed_labels) else f"Bed-{i+1}"
                    HostelBed.objects.create(
                        room=room,
                        bed_name=f"Bed {label}",
                        bed_status='Vacant'
                    )

                sync_hostel_vacancy(hostel_config)

            return Response({
                "success": True,
                "data": serialize_room(room),
                "message": f"Room {room_number} created with {num_beds} bed spaces"
            }, status=status.HTTP_201_CREATED)

        except Exception as e:
            return Response({"success": False, "error": {"message": str(e)}}, status=status.HTTP_400_BAD_REQUEST)


class HostelBedUpdateView(APIView):
    authentication_classes = [CustomJWTAuthentication]
    permission_classes = [IsAuthenticated]

    def patch(self, request, bed_id, *args, **kwargs):
        try:
            bed = HostelBed.objects.select_related('room__hostel_config__property').get(id=bed_id)
            property_obj = bed.room.hostel_config.property
            
            if property_obj.owner != request.user and not request.user.is_staff:
                return Response({"success": False, "error": {"message": "Permission denied"}}, status=status.HTTP_403_FORBIDDEN)
                
            bed_status = request.data.get("bed_status")
            tenant_id = request.data.get("tenant_id")
            
            if bed_status:
                if bed_status not in ['Vacant', 'Occupied', 'Reserved', 'Maintenance']:
                    return Response({"success": False, "error": {"message": "Invalid bed status"}}, status=status.HTTP_400_BAD_REQUEST)
                bed.bed_status = bed_status
                
            if tenant_id is not None:
                if tenant_id == "":
                    bed.assigned_tenant = None
                    bed.bed_status = 'Vacant'
                else:
                    from django.contrib.auth import get_user_model
                    User = get_user_model()
                    bed.assigned_tenant = User.objects.get(id=tenant_id)
                    bed.bed_status = 'Occupied'

            bed.save()
            sync_hostel_vacancy(bed.room.hostel_config)

            return Response({
                "success": True,
                "data": serialize_bed(bed),
                "message": "Bed updated successfully"
            }, status=status.HTTP_200_OK)

        except HostelBed.DoesNotExist:
            return Response({"success": False, "error": {"message": "Bed not found"}}, status=status.HTTP_404_NOT_FOUND)
        except Exception as e:
            return Response({"success": False, "error": {"message": str(e)}}, status=status.HTTP_400_BAD_REQUEST)


class HostelRoomDetailView(APIView):
    authentication_classes = [CustomJWTAuthentication]
    permission_classes = [IsAuthenticated]

    def patch(self, request, room_id, *args, **kwargs):
        try:
            room = HostelRoom.objects.select_related('hostel_config__property').get(id=room_id)
            property_obj = room.hostel_config.property

            if property_obj.owner != request.user and not request.user.is_staff:
                return Response({"success": False, "error": {"message": "Permission denied"}}, status=status.HTTP_403_FORBIDDEN)

            room_number = request.data.get("room_number")
            floor_number = request.data.get("floor_number")
            sharing_type = request.data.get("sharing_type")
            monthly_rate = request.data.get("monthly_rate")
            is_ac = request.data.get("is_ac")
            has_attached_bathroom = request.data.get("has_attached_bathroom")
            notes = request.data.get("notes")

            if room_number is not None:
                room_number = str(room_number).strip()
                if not room_number:
                    return Response({"success": False, "error": {"message": "room_number cannot be empty"}}, status=status.HTTP_400_BAD_REQUEST)
                if HostelRoom.objects.filter(hostel_config=room.hostel_config, room_number=room_number).exclude(id=room.id).exists():
                    return Response({"success": False, "error": {"message": f"Room number {room_number} already exists"}}, status=status.HTTP_400_BAD_REQUEST)
                room.room_number = room_number

            if floor_number is not None:
                room.floor_number = int(floor_number)

            if monthly_rate is not None:
                room.monthly_rate = monthly_rate

            if is_ac is not None:
                room.is_ac = bool(is_ac)

            if has_attached_bathroom is not None:
                room.has_attached_bathroom = bool(has_attached_bathroom)

            if notes is not None:
                room.notes = notes

            bed_count_map = {"1": 1, "2": 2, "3": 3, "4": 4, "dorm": 6}

            with transaction.atomic():
                if sharing_type is not None and str(sharing_type) != str(room.sharing_type):
                    new_sharing_type = str(sharing_type)
                    target_num_beds = bed_count_map.get(new_sharing_type, 2)
                    existing_beds = list(room.beds.all().order_by('bed_name'))
                    current_count = len(existing_beds)

                    if target_num_beds > current_count:
                        bed_labels = ["A", "B", "C", "D", "E", "F", "G", "H"]
                        for i in range(current_count, target_num_beds):
                            label = bed_labels[i] if i < len(bed_labels) else f"Bed-{i+1}"
                            HostelBed.objects.create(
                                room=room,
                                bed_name=f"Bed {label}",
                                bed_status='Vacant'
                            )
                    elif target_num_beds < current_count:
                        beds_to_remove = existing_beds[target_num_beds:]
                        non_vacant = [b for b in beds_to_remove if b.bed_status != 'Vacant']
                        if non_vacant:
                            return Response({
                                "success": False,
                                "error": {"message": f"Cannot reduce capacity: {len(non_vacant)} bed(s) being removed are currently occupied or reserved. Unassign or move tenants first."}
                            }, status=status.HTTP_400_BAD_REQUEST)

                        for b in beds_to_remove:
                            b.delete()

                    room.sharing_type = new_sharing_type

                room.save()
                sync_hostel_vacancy(room.hostel_config)

            return Response({
                "success": True,
                "data": serialize_room(room),
                "message": f"Room {room.room_number} updated successfully"
            }, status=status.HTTP_200_OK)

        except HostelRoom.DoesNotExist:
            return Response({"success": False, "error": {"message": "Room not found"}}, status=status.HTTP_404_NOT_FOUND)
        except Exception as e:
            return Response({"success": False, "error": {"message": str(e)}}, status=status.HTTP_400_BAD_REQUEST)

    def delete(self, request, room_id, *args, **kwargs):
        try:
            room = HostelRoom.objects.select_related('hostel_config__property').get(id=room_id)
            property_obj = room.hostel_config.property

            if property_obj.owner != request.user and not request.user.is_staff:
                return Response({"success": False, "error": {"message": "Permission denied"}}, status=status.HTTP_403_FORBIDDEN)

            non_vacant = room.beds.exclude(bed_status='Vacant').count()
            if non_vacant > 0:
                return Response({
                    "success": False,
                    "error": {"message": f"Cannot delete Room {room.room_number}: It has {non_vacant} occupied or reserved bed(s). Please unassign tenants first."}
                }, status=status.HTTP_400_BAD_REQUEST)

            hostel_config = room.hostel_config
            with transaction.atomic():
                room.delete()
                sync_hostel_vacancy(hostel_config)

            return Response({
                "success": True,
                "message": "Room deleted successfully"
            }, status=status.HTTP_200_OK)

        except HostelRoom.DoesNotExist:
            return Response({"success": False, "error": {"message": "Room not found"}}, status=status.HTTP_404_NOT_FOUND)
        except Exception as e:
            return Response({"success": False, "error": {"message": str(e)}}, status=status.HTTP_400_BAD_REQUEST)

