"""
ASGI config for Project — Django Channels entrypoint.

Daphne (the ASGI server) reads this module via settings.ASGI_APPLICATION. The
`ProtocolTypeRouter` hands HTTP(S) to the regular Django ASGI app (REST, admin,
static) and WebSocket connections to our chat consumer's URL routes.

NOTE: WebSocket auth is JWT-based and happens inside the consumer itself (browsers
can't set Authorization headers on a WS handshake), so no session AuthMiddleware
is layered here. See `communications/consumers.py`.
"""
import os

from django.core.asgi import get_asgi_application

os.environ.setdefault('DJANGO_SETTINGS_MODULE', 'Project.settings')

# Initialize Django BEFORE importing the routing module — routing imports app
# code (consumers) that relies on the app registry being ready.
django_asgi_app = get_asgi_application()

from channels.routing import ProtocolTypeRouter, URLRouter  # noqa: E402
import communications.routing  # noqa: E402

application = ProtocolTypeRouter({
    "http": django_asgi_app,
    "websocket": URLRouter(communications.routing.websocket_urlpatterns),
})
