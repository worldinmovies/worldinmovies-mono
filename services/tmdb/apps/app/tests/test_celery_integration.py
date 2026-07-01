"""
Opt-in Celery integration test with real RabbitMQ broker.

Run with:
  RUN_CELERY_INTEGRATION=1 \
    RABBITMQ_URL=localhost \
    MONGO_URL=mongodb://localhost:27017 \
    python manage.py test apps.app.tests.test_celery_integration

Requires: docker-compose.test.yml services (MongoDB + RabbitMQ) running.
Use pnpm test:ci for one-shot infrastructure.
"""

import os
from unittest import TestCase, skipIf

from django.test import override_settings

RUN_INTEGRATION = os.environ.get('RUN_CELERY_INTEGRATION', '0') == '1'


@skipIf(not RUN_INTEGRATION, 'Set RUN_CELERY_INTEGRATION=1 to enable')
@override_settings(CELERY_TASK_ALWAYS_EAGER=False)
class CeleryIntegrationTest(TestCase):
    """Integration tests for Celery tasks with a real RabbitMQ broker."""

    def test_send_simple_task(self):
        """A simple Celery task (ping) can be sent and completes via the broker."""
        from apps.worker.celery_tasks import ping_task
        result = ping_task.delay()
        try:
            output = result.get(timeout=10)
            self.assertEqual(output, 'pong')
        finally:
            result.forget()

    def test_redo_countries_dispatches_via_broker(self):
        """redo_countries task dispatches successfully with a small job."""
        from apps.worker.celery_tasks import redo_countries
        result = redo_countries.delay([])
        try:
            output = result.get(timeout=10)
            self.assertIsNone(output)
        finally:
            result.forget()

    def test_celery_app_is_configured(self):
        """The Celery app is configured with the expected broker URL."""
        from celery import current_app
        broker_url = current_app.conf.broker_url
        self.assertIn('amqp://', broker_url)
        self.assertNotEqual(broker_url, '')
