import json
from rest_framework.views import APIView
from rest_framework.response import Response
from rest_framework import status
from rest_framework.permissions import IsAuthenticated

from core.jwt import CustomJWTAuthentication
from properties.api.views import serialize_property
from communications.services import toggle_favorite
from communications.selectors import get_user_favorites

class FavoriteListView(APIView):
    authentication_classes = [CustomJWTAuthentication]
    permission_classes = [IsAuthenticated]

    def get(self, request, *args, **kwargs):
        favorites = get_user_favorites(user=request.user)
        
        # Serialize the properties
        data = [serialize_property(fav.property, user=request.user, request=request) for fav in favorites]
        
        return Response({
            "success": True,
            "data": data,
            "message": "Favorites retrieved successfully",
            "pagination": {
                "total": len(data),
                "page": 1,
                "limit": max(len(data), 1),
                "total_pages": 1
            }
        }, status=status.HTTP_200_OK)


class FavoriteToggleView(APIView):
    authentication_classes = [CustomJWTAuthentication]
    permission_classes = [IsAuthenticated]

    def post(self, request, *args, **kwargs):
        property_id = request.data.get("property_id")
        
        if not property_id:
            return Response({
                "success": False,
                "error": {"message": "property_id is required"}
            }, status=status.HTTP_400_BAD_REQUEST)
            
        try:
            is_favorited = toggle_favorite(user=request.user, property_id=property_id)
            
            return Response({
                "success": True,
                "data": {
                    "is_favorited": is_favorited,
                    "property_id": property_id
                },
                "message": "Favorite added" if is_favorited else "Favorite removed"
            }, status=status.HTTP_200_OK)
            
        except Exception as e:
            return Response({
                "success": False,
                "error": {"message": str(e)}
            }, status=status.HTTP_400_BAD_REQUEST)

def serialize_inquiry(inquiry):
    sender_name = f"{inquiry.sender.first_name} {inquiry.sender.last_name}".strip() if (inquiry.sender.first_name or inquiry.sender.last_name) else inquiry.sender.email
    recipient_name = f"{inquiry.recipient.first_name} {inquiry.recipient.last_name}".strip() if (inquiry.recipient.first_name or inquiry.recipient.last_name) else inquiry.recipient.email

    return {
        "id": str(inquiry.id),
        "property": {
            "id": str(inquiry.property.id),
            "title": inquiry.property.title,
            "city": inquiry.property.city.name if inquiry.property.city else "",
        },
        "sender": {
            "id": str(inquiry.sender.id),
            "full_name": sender_name,
            "name": sender_name,
            "email": inquiry.sender.email,
        },
        "recipient": {
            "id": str(inquiry.recipient.id),
            "full_name": recipient_name,
            "name": recipient_name,
            "email": inquiry.recipient.email,
        },
        "message": inquiry.message,
        "phone": inquiry.phone,
        "phone_number": inquiry.phone,
        "status": inquiry.inquiry_status.lower() if inquiry.inquiry_status else "pending",
        "created_at": inquiry.created_at.isoformat() if hasattr(inquiry, 'created_at') and inquiry.created_at else "",
        "updated_at": inquiry.updated_at.isoformat() if hasattr(inquiry, 'updated_at') and inquiry.updated_at else "",
    }


class InquiryCreateView(APIView):
    authentication_classes = [CustomJWTAuthentication]
    permission_classes = [IsAuthenticated]

    def post(self, request, *args, **kwargs):
        from communications.services import create_inquiry
        
        property_id = request.data.get("property_id")
        message = request.data.get("message")
        phone = request.data.get("phone")
        
        if not property_id or not message:
            return Response({
                "success": False,
                "error": {"message": "property_id and message are required"}
            }, status=status.HTTP_400_BAD_REQUEST)
            
        try:
            inquiry = create_inquiry(
                user=request.user, 
                property_id=property_id, 
                message=message, 
                phone=phone
            )
            
            return Response({
                "success": True,
                "data": serialize_inquiry(inquiry),
                "message": "Inquiry sent successfully"
            }, status=status.HTTP_201_CREATED)
            
        except ValueError as e:
            return Response({
                "success": False,
                "error": {"message": str(e)}
            }, status=status.HTTP_400_BAD_REQUEST)
        except Exception as e:
            return Response({
                "success": False,
                "error": {"message": "An error occurred while creating the inquiry"}
            }, status=status.HTTP_500_INTERNAL_SERVER_ERROR)


class InquiryListView(APIView):
    authentication_classes = [CustomJWTAuthentication]
    permission_classes = [IsAuthenticated]

    def get(self, request, *args, **kwargs):
        from communications.selectors import get_sent_inquiries, get_received_inquiries
        
        inquiry_type = request.query_params.get("type", "sent")
        
        if inquiry_type == "received":
            inquiries = get_received_inquiries(user=request.user)
        else:
            inquiries = get_sent_inquiries(user=request.user)
            
        data = [serialize_inquiry(inq) for inq in inquiries]
        
        return Response({
            "success": True,
            "data": data,
            "message": "Inquiries retrieved successfully",
            "pagination": {
                "total": len(data),
                "page": 1,
                "limit": max(len(data), 1),
                "total_pages": 1
            }
        }, status=status.HTTP_200_OK)

class InquiryAcceptView(APIView):
    authentication_classes = [CustomJWTAuthentication]
    permission_classes = [IsAuthenticated]

    def patch(self, request, pk, *args, **kwargs):
        from communications.services import accept_inquiry
        
        try:
            inquiry = accept_inquiry(user=request.user, inquiry_id=pk)
            return Response({
                "success": True,
                "data": serialize_inquiry(inquiry),
                "message": "Inquiry accepted successfully"
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
                "error": {"message": "An error occurred while accepting the inquiry"}
            }, status=status.HTTP_500_INTERNAL_SERVER_ERROR)

def serialize_review(review):
    return {
        "id": str(review.id),
        "reviewer": {
            "id": str(review.reviewer.id),
            "name": f"{review.reviewer.first_name} {review.reviewer.last_name}".strip(),
            "avatar_url": review.reviewer.profile_image_url,
        },
        "overall_rating": review.overall_rating,
        "title": review.title,
        "body": review.body,
        "status": review.status,
        "created_at": review.created_at.isoformat() if hasattr(review, 'created_at') else "",
    }

class PropertyReviewListView(APIView):
    authentication_classes = [CustomJWTAuthentication]
    permission_classes = []

    def get(self, request, *args, **kwargs):
        from communications.selectors import get_property_reviews, get_property_rating_summary
        
        property_id = request.query_params.get("property_id")
        if not property_id:
            return Response({
                "success": False,
                "error": {"message": "property_id is required"}
            }, status=status.HTTP_400_BAD_REQUEST)
            
        reviews = get_property_reviews(property_id=property_id)
        stats = get_property_rating_summary(property_id=property_id)
        
        data = [serialize_review(r) for r in reviews]
        
        return Response({
            "success": True,
            "data": data,
            "meta": {
                "stats": stats
            },
            "message": "Reviews retrieved successfully",
        }, status=status.HTTP_200_OK)


class ReviewCreateView(APIView):
    authentication_classes = [CustomJWTAuthentication]
    permission_classes = [IsAuthenticated]

    def post(self, request, *args, **kwargs):
        from communications.services import create_review
        
        property_id = request.data.get("property_id")
        overall_rating = request.data.get("overall_rating")
        title = request.data.get("title")
        body = request.data.get("body")
        
        if not property_id or not overall_rating:
            return Response({
                "success": False,
                "error": {"message": "property_id and overall_rating are required"}
            }, status=status.HTTP_400_BAD_REQUEST)
            
        try:
            review = create_review(
                user=request.user,
                property_id=property_id,
                overall_rating=int(overall_rating),
                title=title,
                body=body
            )
            
            return Response({
                "success": True,
                "data": serialize_review(review),
                "message": "Review submitted successfully"
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


def serialize_conversation(conv, user):
    # Find the other participant
    other_participant = next((p for p in conv.participants.all() if p.user_id != user.id), None)
    other_name = f"{other_participant.user.first_name} {other_participant.user.last_name}".strip() if (other_participant and (other_participant.user.first_name or other_participant.user.last_name)) else (other_participant.user.email if other_participant else "Unknown")
    
    return {
        "id": str(conv.id),
        "property_id": str(conv.property_id) if conv.property_id else None,
        "subject": conv.subject,
        "last_message_at": conv.last_message_at.isoformat() if conv.last_message_at else "",
        "other_user": {
            "id": str(other_participant.user.id) if other_participant else None,
            "full_name": other_name,
            "name": other_name,
            "email": other_participant.user.email if other_participant else "",
        } if other_participant else None,
        "unread_count": 0,
        "last_message_preview": getattr(conv, 'last_message_body', None) or "",
    }

def serialize_message(msg):
    sender_name = f"{msg.sender.first_name} {msg.sender.last_name}".strip() if (msg.sender.first_name or msg.sender.last_name) else msg.sender.email
    return {
        "id": str(msg.id),
        "body": msg.body,
        "sender_id": str(msg.sender_id),
        "sender": {
            "id": str(msg.sender.id),
            "full_name": sender_name,
            "name": sender_name,
            "email": msg.sender.email,
        },
        "created_at": msg.created_at.isoformat() if hasattr(msg, 'created_at') else "",
    }


class ConversationListView(APIView):
    authentication_classes = [CustomJWTAuthentication]
    permission_classes = [IsAuthenticated]

    def get(self, request, *args, **kwargs):
        from communications.selectors import get_user_conversations
        conversations = get_user_conversations(user=request.user)
        data = [serialize_conversation(c, request.user) for c in conversations]
        
        return Response({
            "success": True,
            "data": data,
            "message": "Conversations retrieved successfully"
        }, status=status.HTTP_200_OK)


class ConversationDetailView(APIView):
    authentication_classes = [CustomJWTAuthentication]
    permission_classes = [IsAuthenticated]

    def get(self, request, conv_id, *args, **kwargs):
        from communications.selectors import get_conversation_messages
        
        try:
            messages = get_conversation_messages(conversation_id=conv_id, user=request.user)
            data = [serialize_message(m) for m in messages]
            
            return Response({
                "success": True,
                "data": data,
                "message": "Messages retrieved successfully"
            }, status=status.HTTP_200_OK)
        except PermissionError as e:
            return Response({
                "success": False,
                "error": {"message": str(e)}
            }, status=status.HTTP_403_FORBIDDEN)


class StartConversationView(APIView):
    authentication_classes = [CustomJWTAuthentication]
    permission_classes = [IsAuthenticated]

    def post(self, request, *args, **kwargs):
        from communications.services import get_or_create_conversation, send_message
        
        recipient_id = request.data.get("recipient_id")
        property_id = request.data.get("property_id")
        message = request.data.get("message")
        
        if not recipient_id or not message:
            return Response({
                "success": False,
                "error": {"message": "recipient_id and message are required"}
            }, status=status.HTTP_400_BAD_REQUEST)
            
        try:
            conv = get_or_create_conversation(
                user=request.user,
                other_user_id=recipient_id,
                property_id=property_id
            )
            
            msg = send_message(
                user=request.user,
                conversation_id=conv.id,
                body=message
            )
            
            return Response({
                "success": True,
                "data": {
                    "conversation_id": str(conv.id),
                    "message": serialize_message(msg)
                },
                "message": "Message sent successfully"
            }, status=status.HTTP_201_CREATED)
            
        except Exception as e:
            return Response({
                "success": False,
                "error": {"message": str(e)}
            }, status=status.HTTP_400_BAD_REQUEST)


class SendMessageView(APIView):
    authentication_classes = [CustomJWTAuthentication]
    permission_classes = [IsAuthenticated]

    def post(self, request, conv_id, *args, **kwargs):
        from communications.services import send_message
        
        message = request.data.get("message")
        if not message:
            return Response({
                "success": False,
                "error": {"message": "message is required"}
            }, status=status.HTTP_400_BAD_REQUEST)
            
        try:
            msg = send_message(
                user=request.user,
                conversation_id=conv_id,
                body=message
            )
            
            return Response({
                "success": True,
                "data": serialize_message(msg),
                "message": "Message sent successfully"
            }, status=status.HTTP_201_CREATED)
            
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
