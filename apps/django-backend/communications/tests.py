"""
Tests for the real-time chat consumer (WebSocket).

Uses Channels' WebsocketCommunicator to exercise ChatConsumer without a running
server. The channel layer is the in-memory layer (the dev default), so no Redis
is needed. TransactionTestCase (not TestCase) is required so rows created in
setUp are visible to the consumer's async DB thread.
"""
from datetime import timedelta

from channels.testing import WebsocketCommunicator
from channels.routing import URLRouter
from django.contrib.auth import get_user_model
from django.test import TransactionTestCase
from django.utils import timezone
from rest_framework_simplejwt.tokens import RefreshToken

from accounts.models import UserSession
from communications.models import Conversation, ConversationParticipant
from communications.routing import websocket_urlpatterns

User = get_user_model()


def _create_user(email: str, first: str, last: str):
    """Create an active user WITH a live session (required by the consumer's
    fail-closed auth, mirroring core.jwt.CustomJWTAuthentication)."""
    user = User.objects.create_user(
        email=email, password='pass1234', first_name=first, last_name=last
    )
    UserSession.objects.create(
        user=user,
        refresh_token_hash='test-hash',
        expires_at=timezone.now() + timedelta(days=1),
    )
    return user


class ChatConsumerTests(TransactionTestCase):
    def setUp(self):
        self.alice = _create_user('alice@test.com', 'Alice', 'L')
        self.bob = _create_user('bob@test.com', 'Bob', 'B')
        self.stranger = _create_user('stranger@test.com', 'Strange', 'R')

        self.alice_token = str(RefreshToken.for_user(self.alice).access_token)
        self.stranger_token = str(RefreshToken.for_user(self.stranger).access_token)

        self.conversation = Conversation.objects.create()
        ConversationParticipant.objects.create(conversation=self.conversation, user=self.alice)
        ConversationParticipant.objects.create(conversation=self.conversation, user=self.bob)

    def _communicator(self, token):
        path = f"/ws/chat/{self.conversation.id}/"
        if token:
            path += f"?token={token}"
        return WebsocketCommunicator(URLRouter(websocket_urlpatterns), path)

    async def test_rejects_unauthenticated(self):
        communicator = self._communicator(None)
        connected, _ = await communicator.connect()
        self.assertFalse(connected)
        await communicator.disconnect()

    async def test_rejects_non_participant(self):
        communicator = self._communicator(self.stranger_token)
        connected, _ = await communicator.connect()
        self.assertFalse(connected)
        await communicator.disconnect()

    async def test_participant_connects(self):
        communicator = self._communicator(self.alice_token)
        connected, _ = await communicator.connect()
        self.assertTrue(connected)
        await communicator.disconnect()

    async def test_receives_broadcast(self):
        from channels.layers import get_channel_layer

        communicator = self._communicator(self.alice_token)
        connected, _ = await communicator.connect()
        self.assertTrue(connected)

        # Simulate communications.realtime.broadcast_message pushing to the group.
        channel_layer = get_channel_layer()
        await channel_layer.group_send(
            f"chat_{self.conversation.id}",
            {"type": "chat.message", "message": {"id": "1", "body": "hello"}},
        )

        response = await communicator.receive_json_from()
        self.assertEqual(response["body"], "hello")
        await communicator.disconnect()
