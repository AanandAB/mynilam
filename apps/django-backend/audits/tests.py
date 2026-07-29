from django.test import TestCase
from django.core.exceptions import ValidationError
from audits.models import AuditLog

class AuditLogImmutabilityTests(TestCase):
    def setUp(self):
        self.audit = AuditLog.objects.create(
            action="Create",
            entity_type="Property",
            entity_id=1,
            new_values={"title": "New House"}
        )

    def test_create_audit_log_succeeds(self):
        """Test that a new audit log record can be created successfully."""
        self.assertEqual(self.audit.action, "Create")
        self.assertIsNotNone(self.audit.row_guid)

    def test_update_audit_log_fails(self):
        """Test that updating an existing audit log raises ValidationError."""
        self.audit.action = "Update"
        with self.assertRaises(ValidationError) as context:
            self.audit.save()
        self.assertEqual(str(context.exception.messages[0]), "Audit logs are immutable and cannot be updated.")

    def test_delete_audit_log_fails(self):
        """Test that deleting an audit log raises ValidationError."""
        with self.assertRaises(ValidationError) as context:
            self.audit.delete()
        self.assertEqual(str(context.exception.messages[0]), "Audit logs are immutable and cannot be deleted.")

