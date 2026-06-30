#!/usr/bin/env python3
import os
import sys


if 'test' in sys.argv or 'behave' in sys.argv:
    os.environ["ENVIRONMENT"] = "test"

    # Pre-set MONGO_URL means external infra (e.g. docker-compose.test.yml)
    # is available — skip testcontainers to avoid slow container spin-up.
    if 'MONGO_URL' not in os.environ:
        from testcontainers.mongodb import MongoDbContainer

        mongo_container = MongoDbContainer("mongo:8", dbname="test")
        mongo_container.start()
        os.environ['MONGO_URL'] = mongo_container.get_connection_url()


if __name__ == "__main__":
    os.environ.setdefault("DJANGO_SETTINGS_MODULE", "settings.settings")
    try:
        from django.core.management import execute_from_command_line
    except ImportError:
        # The above import may fail for some other reason. Ensure that the
        # issue is really that Django is missing to avoid masking other
        # exceptions on Python 2.
        try:
            import django
        except ImportError:
            raise ImportError(
                "Couldn't import Django. Are you sure it's installed and "
                "available on your PYTHONPATH environment variable? Did you "
                "forget to activate a virtual environment?"
            )
        raise
    execute_from_command_line(sys.argv)
