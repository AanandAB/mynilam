"""
Celery tasks for the communications domain.

`notify_new_message` runs OUT of the request/response cycle: it creates an
in-app Notification for the recipient(s) of a new chat message (email/push can
be layered on later). It is dispatched from `communications.services.send_message`
inside `transaction.on_commit` so the message row is committed before we notify.
"""
from celery import shared_task
from django.contrib.auth import get_user_model

User = get_user_model()


@shared_task
def notify_new_message(conversation_id: int, sender_id: int, message_body: str) -> None:
    """Create a `NewMessage` in-app notification for every participant except the sender."""
    from communications.models import Conversation, ConversationParticipant, Notification

    try:
        conversation = Conversation.objects.get(id=conversation_id)
        sender = User.objects.get(id=sender_id)
    except (Conversation.DoesNotExist, User.DoesNotExist):
        # The conversation/sender may have been removed between send and task run;
        # a missing row is not an error worth retrying.
        return

    sender_name = f"{sender.first_name} {sender.last_name}".strip() or sender.email
    preview = message_body if len(message_body) <= 200 else f"{message_body[:200]}…"

    recipients = (
        ConversationParticipant.objects
        .filter(conversation=conversation)
        .exclude(user=sender)
        .select_related('user')
    )

    for participant in recipients:
        Notification.objects.create(
            recipient=participant.user,
            notification_type='NewMessage',
            title=sender_name,
            body=preview,
            reference_type='Conversation',
            reference_id=conversation.id,
            delivery_channel='InApp',
        )
