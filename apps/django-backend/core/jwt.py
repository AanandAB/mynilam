from rest_framework_simplejwt.authentication import JWTAuthentication
from rest_framework.exceptions import AuthenticationFailed
from accounts.models import UserSession

class CustomJWTAuthentication(JWTAuthentication):
    def authenticate(self, request):
        header = self.get_header(request)
        if header is None:
            return None
            
        raw_token = self.get_raw_token(header)
        if raw_token is None:
            return None
            
        validated_token = self.get_validated_token(raw_token)
        user = self.get_user(validated_token)
        
        # Fail close if user is deleted or inactive
        if not user.is_active or user.is_deleted:
            raise AuthenticationFailed("User account is inactive or deleted.")

        # Fail close if user has no active sessions
        active_sessions = UserSession.objects.filter(user=user, is_revoked=False)
        if not active_sessions.exists():
            raise AuthenticationFailed("Session is revoked or expired.")
            
        return user, validated_token
