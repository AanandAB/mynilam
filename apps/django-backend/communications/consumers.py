"""
ChatConsumer — real-time WebSocket endpoint for a conversation.

Architecture (REST writes / WS reads):
- Messages are still CREATED through the REST endpoint (POST /messages/<id>/send/).
- That service broadcasts the new message to a Channels group via the channel
  layer (see `communications.realtime`).
- This consumer's only job is to authenticate the user, join the group for the
  conversation, and forward `chat.message` group events to the browser in real
  time. It never writes to the database itself.

Auth: browsers can't set Authorization headers on WebSockets, so the access
token is passed as a `?token=` query param and decoded here with SimpleJWT. The
same fail-closed checks as `core.jwt.CustomJWTAuthentication` are applied
(active, not deleted, has a live session) so a logged-out user can't keep
receiving messages.
"""
from urllib.parse import parse_qs

from channels.generic.websocket import AsyncJsonWebsocketConsumer
from channels.db import database_sync_to_async
from rest_framework_simplejwt.tokens import AccessToken
from rest_framework_simplejwt.exceptions import TokenError

from accounts.models import UserSession
from communications.models import ConversationParticipant


class ChatConsumer(AsyncJsonWebsocketConsumer):
    """A single authenticated user's connection to one conversation's group."""

    async def connect(self):
        # conversation_id comes from the URL route; group name is deterministic
        # so the REST broadcast (communications.realtime) targets the same group.
        self.conversation_id = self.scope['url_route']['kwargs']['conversation_id']
        self.group_name = f"chat_{self.conversation_id}"

        self.user = await self._authenticate()
        if self.user is None:
            await self.close(code=4001)  # 4001 = unauthenticated
            return

        if not await self._is_participant():
            await self.close(code=4003)  # 4003 = forbidden (not a participant)
            return

        # Join the room so group_send from the REST path reaches this socket.
        await self.channel_layer.group_add(self.group_name, self.channel_name)
        await self.accept()

    async def disconnect(self, close_code):
        # Leave the group cleanly; group_discard is safe even if add never ran.
        if hasattr(self, 'group_name'):
            await self.channel_layer.group_discard(self.group_name, self.channel_name)

    async def receive_json(self, content, **kwargs):
        # Receive-only consumer: messages are sent via REST. Keep this as a
        # hook point for future typing-indicator / read-receipt events.
        pass

    async def chat_message(self, event):
        """Forward a `chat.message` group event to the browser as JSON."""
        await self.send_json(event['message'])

    # ------------------------------------------------------------------
    # DB / JWT helpers (sync code wrapped for the async consumer)
    # ------------------------------------------------------------------

    @database_sync_to_async
    def _authenticate(self):
        """Decode the `?token=` query param into a User, or return None."""
        from django.contrib.auth import get_user_model
        User = get_user_model()

        qs = parse_qs(self.scope.get('query_string', b'').decode())
        token = (qs.get('token') or [None])[0]
        if not token:
            return None

        try:
            validated = AccessToken(token)
            user = User.objects.get(id=validated['user_id'])
        except (TokenError, KeyError, User.DoesNotExist):
            return None

        # Fail closed — mirror core.jwt.CustomJWTAuthentication.
        if not user.is_active or user.is_deleted:
            return None
        if not UserSession.objects.filter(user=user, is_revoked=False).exists():
            return None
        return user

    @database_sync_to_async
    def _is_participant(self) -> bool:
        return ConversationParticipant.objects.filter(
            conversation_id=self.conversation_id, user=self.user
        ).exists()
