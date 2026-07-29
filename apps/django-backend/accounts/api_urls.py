from django.urls import path
from accounts.api.views import (
    CustomTokenObtainPairView,
    CustomTokenRefreshView,
    CustomLogoutView,
    SignupUser,
    UpdateProfileView,
    UserListView,
    EmployeeCreateView,
    UserDeleteView,
)

urlpatterns = [
    path('login/', CustomTokenObtainPairView.as_view(), name='token_obtain_pair'),
    path('token/refresh/', CustomTokenRefreshView.as_view(), name='token_refresh'),
    path('refresh/', CustomTokenRefreshView.as_view(), name='token_refresh_alt'),
    path('logout/', CustomLogoutView.as_view(), name='token_logout'),
    path('register/', SignupUser.as_view(), name='signup'),
    path('profile/', UpdateProfileView.as_view(), name='update_profile'),
    
    # User Management Endpoints
    path('users/', UserListView.as_view(), name='user_list'),
    path('users/employee/', EmployeeCreateView.as_view(), name='create_employee'),
    path('users/<int:user_id>/', UserDeleteView.as_view(), name='delete_user'),
]