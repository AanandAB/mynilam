from django.urls import path
from communications.api.views import (
    FavoriteListView, FavoriteToggleView,
    InquiryListView, InquiryCreateView, InquiryAcceptView,
    PropertyReviewListView, ReviewCreateView,
    ConversationListView, ConversationDetailView,
    SendMessageView, StartConversationView
)

urlpatterns = [
    path('favorites/', FavoriteListView.as_view(), name='favorite-list'),
    path('favorites/toggle/', FavoriteToggleView.as_view(), name='favorite-toggle'),
    
    path('inquiries/', InquiryListView.as_view(), name='inquiry-list'),
    path('inquiries/create/', InquiryCreateView.as_view(), name='inquiry-create'),
    path('inquiries/<int:pk>/accept/', InquiryAcceptView.as_view(), name='inquiry-accept'),
    
    path('reviews/', PropertyReviewListView.as_view(), name='review-list'),
    path('reviews/create/', ReviewCreateView.as_view(), name='review-create'),
    
    path('messages/', ConversationListView.as_view(), name='conversation-list'),
    path('messages/<int:conv_id>/', ConversationDetailView.as_view(), name='conversation-detail'),
    path('messages/<int:conv_id>/send/', SendMessageView.as_view(), name='message-send'),
    path('messages/start/', StartConversationView.as_view(), name='conversation-start'),
]
 