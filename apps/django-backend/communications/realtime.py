"""
Realtime helpers for the communications domain.

The REST API creates messages; these helpers push them to connected browsers via
the Channels channel layer. `ChatConsumer` (communications/consumers.py) joins a
group named `chat_<conversation_id>` and listens for `chat.message` events, so
`broadcast_message` here targets exactly the people viewing that conversation.
"""
from asgiref.sync import async_to_sync
from channels.layers import get_channel_layer


def _message_payload(message) -> dict:
    """Build the JSON shape for a chat message.

    Kept identical to `serialize_message` in `communications/api/views.py` so the
    frontend can treat a WebSocket-delivered message the same as one fetched over
    REST (same keys: id / body / sender_id / sender / created_at).
    """
    sender_name = f"{message.sender.first_name} {message.sender.last_name}".strip()
    if not sender_name:
        sender_name = message.sender.email
    return {
        "id": str(message.id),
        "body": message.body,
        "sender_id": str(message.sender_id),
        "sender": {
            "id": str(message.sender.id),
            "full_name": sender_name,
            "name": sender_name,
            "email": message.sender.email,
        },
        "created_at": message.created_at.isoformat() if message.created_at else "",
    }


def broadcast_message(message) -> None:
    """Push a newly created message to every socket in the conversation's group.

    Called from `communications.services.send_message` inside `transaction.on_commit`
    so the message row is persisted before clients are told about it.
    """
    channel_layer = get_channel_layer()
    if channel_layer is None:
        # No channel layer configured — nothing to push to (shouldn't happen with
        # the CHANNEL_LAYERS setting present, but fail soft rather than crash).
        return

    group_name = f"chat_{message.conversation_id}"
    async_to_sync(channel_layer.group_send)(
        group_name,
        {"type": "chat.message", "message": _message_payload(message)},
    )
