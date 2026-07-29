from django.test import TestCase
from django.contrib.auth import get_user_model
from accounts.models import Role, Permission, UserRole, RolePermission

User = get_user_model()

class CustomUserTests(TestCase):
    def test_create_user(self):
        """Test creating a regular user through the manager."""
        user = User.objects.create_user(
            email="testuser@example.com",
            password="securepassword123",
            first_name="Test",
            last_name="User"
        )
        self.assertEqual(user.email, "testuser@example.com")
        self.assertTrue(user.check_password("securepassword123"))
        self.assertFalse(user.is_staff)
        self.assertFalse(user.is_superuser)

    def test_create_superuser(self):
        """Test creating a superuser through the manager."""
        superuser = User.objects.create_superuser(
            email="adminuser@example.com",
            password="adminpassword123",
            first_name="Admin",
            last_name="User"
        )
        self.assertEqual(superuser.email, "adminuser@example.com")
        self.assertTrue(superuser.check_password("adminpassword123"))
        self.assertTrue(superuser.is_staff)
        self.assertTrue(superuser.is_superuser)

    def test_create_user_raises_value_error_without_email(self):
        """Test that user creation raises ValueError if email is not provided."""
        with self.assertRaises(ValueError):
            User.objects.create_user(
                email="",
                password="password",
                first_name="Test",
                last_name="User"
            )

class CustomRBACTests(TestCase):
    def setUp(self):
        self.user = User.objects.create_user(
            email="rbacuser@example.com",
            password="password",
            first_name="RBAC",
            last_name="User"
        )
        self.role = Role.objects.create(name="Landlord", description="Can manage properties")
        self.permission = Permission.objects.create(name="create_property", description="Can create a property", module="properties")

    def test_assign_role_to_user(self):
        """Test assigning a custom role to a user."""
        user_role = UserRole.objects.create(user=self.user, role=self.role)
        self.assertEqual(self.user.user_roles.count(), 1)
        self.assertEqual(self.user.user_roles.first().role, self.role)

    def test_assign_permission_to_role(self):
        """Test assigning a custom permission to a role."""
        role_perm = RolePermission.objects.create(role=self.role, permission=self.permission)
        self.assertEqual(self.role.role_permissions.count(), 1)
        self.assertEqual(self.role.role_permissions.first().permission, self.permission)


from rest_framework.test import APITestCase
from rest_framework_simplejwt.tokens import AccessToken
from django.urls import reverse
from django.utils import timezone
from django.conf import settings
from accounts.models import UserSession
from audits.models import AuditLog

class CustomJWTAuthTests(APITestCase):
    def setUp(self):
        self.user = User.objects.create_user(
            email="authuser@example.com",
            password="secretpassword123",
            first_name="Auth",
            last_name="User"
        )
        self.role = Role.objects.create(name="Tenant")
        self.permission = Permission.objects.create(name="view_lease", module="leases")
        RolePermission.objects.create(role=self.role, permission=self.permission)
        UserRole.objects.create(user=self.user, role=self.role)

        self.login_url = reverse('token_obtain_pair')
        self.refresh_url = reverse('token_refresh')
        self.logout_url = reverse('token_logout')

    def test_successful_login(self):
        """Test login returns access token, sets cookie, creates a session and audit log."""
        response = self.client.post(self.login_url, {
            "email": "authuser@example.com",
            "password": "secretpassword123"
        })
        self.assertEqual(response.status_code, 200)
        self.assertIn("access", response.data)
        self.assertNotIn("refresh", response.data)

        # Check cookie is set
        self.assertIn(settings.REFRESH_COOKIE_NAME, response.cookies)
        cookie = response.cookies[settings.REFRESH_COOKIE_NAME]
        self.assertTrue(cookie['httponly'])
        self.assertEqual(cookie['path'], settings.REFRESH_COOKIE_PATH)

        # Check session created
        self.assertEqual(UserSession.objects.filter(user=self.user).count(), 1)
        
        # Check audit log created
        self.assertEqual(AuditLog.objects.filter(user=self.user, action="UserLogin").count(), 1)

    def test_failed_login(self):
        """Test failed login increments counter and logs audit failure."""
        response = self.client.post(self.login_url, {
            "email": "authuser@example.com",
            "password": "wrongpassword"
        })
        self.assertEqual(response.status_code, 401)
        
        # Check lockout counter incremented
        self.user.refresh_from_db()
        self.assertEqual(self.user.failed_login_attempts, 1)

        # Check audit log failure
        self.assertEqual(AuditLog.objects.filter(user=self.user, action="UserLoginFailed").count(), 1)

    def test_account_lockout(self):
        """Test account lockout occurs after 5 failed attempts."""
        for _ in range(5):
            self.client.post(self.login_url, {
                "email": "authuser@example.com",
                "password": "wrongpassword"
            })

        self.user.refresh_from_db()
        self.assertIsNotNone(self.user.account_locked_until)
        self.assertTrue(self.user.account_locked_until > timezone.now())

        # Attempt with correct password while locked
        response = self.client.post(self.login_url, {
            "email": "authuser@example.com",
            "password": "secretpassword123"
        })
        self.assertEqual(response.status_code, 400)
        self.assertIn("Account is locked.", str(response.data))

    def test_jwt_claims(self):
        """Test custom JWT access token contains RBAC claims."""
        response = self.client.post(self.login_url, {
            "email": "authuser@example.com",
            "password": "secretpassword123"
        })
        access_token_str = response.data["access"]
        token = AccessToken(access_token_str)
        
        self.assertEqual(token["email"], "authuser@example.com")
        self.assertIn("Tenant", token["roles"])
        self.assertIn("view_lease", token["permissions"])

    def test_token_refresh(self):
        """Test refresh token obtains new access token via HttpOnly cookie."""
        login_res = self.client.post(self.login_url, {
            "email": "authuser@example.com",
            "password": "secretpassword123"
        })
        self.assertIn(settings.REFRESH_COOKIE_NAME, login_res.cookies)
        refresh_cookie_val = login_res.cookies[settings.REFRESH_COOKIE_NAME].value

        # Make request and supply the cookie
        self.client.cookies[settings.REFRESH_COOKIE_NAME] = refresh_cookie_val
        response = self.client.post(self.refresh_url)
        
        self.assertEqual(response.status_code, 200)
        self.assertIn("access", response.data)
        self.assertNotIn("refresh", response.data)
        
        # Verify that rotated refresh token is set back in cookies
        self.assertIn(settings.REFRESH_COOKIE_NAME, response.cookies)
        new_refresh_cookie_val = response.cookies[settings.REFRESH_COOKIE_NAME].value
        self.assertNotEqual(refresh_cookie_val, new_refresh_cookie_val)

    def test_logout(self):
        """Test logging out revokes session and clears cookie."""
        login_res = self.client.post(self.login_url, {
            "email": "authuser@example.com",
            "password": "secretpassword123"
        })
        access_token = login_res.data["access"]
        refresh_cookie_val = login_res.cookies[settings.REFRESH_COOKIE_NAME].value

        # Set cookies and credentials
        self.client.cookies[settings.REFRESH_COOKIE_NAME] = refresh_cookie_val
        self.client.credentials(HTTP_AUTHORIZATION=f'Bearer {access_token}')

        response = self.client.post(self.logout_url)
        self.assertEqual(response.status_code, 200)
        self.assertEqual(response.data["detail"], "Successfully logged out.")

        # Check session is marked as revoked in database
        self.assertEqual(UserSession.objects.filter(user=self.user, is_revoked=True).count(), 1)

        # Check audit log created
        self.assertEqual(AuditLog.objects.filter(user=self.user, action="UserLogout").count(), 1)

        # Check cookie is deleted (max-age is set to delete or expires is in past)
        logout_cookie = response.cookies[settings.REFRESH_COOKIE_NAME]
        self.assertEqual(logout_cookie.value, '')

    def test_session_revocation_fail_close(self):
        """Test authentication fails if all sessions are revoked."""
        login_res = self.client.post(self.login_url, {
            "email": "authuser@example.com",
            "password": "secretpassword123"
        })
        access_token = login_res.data["access"]

        # Revoke the session
        UserSession.objects.filter(user=self.user).update(is_revoked=True)

        # Make an authenticated request
        self.client.credentials(HTTP_AUTHORIZATION=f'Bearer {access_token}')
        from core.jwt import CustomJWTAuthentication
        from rest_framework.exceptions import AuthenticationFailed
        
        class DummyRequest:
            def __init__(self, token):
                self.META = {'HTTP_AUTHORIZATION': f'Bearer {token}'}

        auth = CustomJWTAuthentication()
        request = DummyRequest(access_token)
        
        with self.assertRaises(AuthenticationFailed) as context:
            auth.authenticate(request)
        self.assertEqual(str(context.exception), "Session is revoked or expired.")

    def test_signup_and_login(self):
        """Test that registering a new user actually saves them and permits logging in."""
        signup_url = reverse('signup')
        signup_data = {
            "email": "newuser@example.com",
            "password": "newsecurepassword123",
            "full_name": "New User",
            "phone_number": "+1234567890"
        }
        
        # Sign up
        signup_response = self.client.post(signup_url, signup_data)
        self.assertEqual(signup_response.status_code, 201)
        self.assertEqual(signup_response.data["message"], "User created successfully.")
        self.assertEqual(signup_response.data["user"]["email"], "newuser@example.com")
        
        # Verify user exists in database
        self.assertTrue(User.objects.filter(email="newuser@example.com").exists())
        
        # Log in with the newly created credentials
        login_response = self.client.post(self.login_url, {
            "email": "newuser@example.com",
            "password": "newsecurepassword123"
        })
        self.assertEqual(login_response.status_code, 200)
        self.assertIn("access", login_response.data)



