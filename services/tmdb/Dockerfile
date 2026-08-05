FROM python:3-alpine@sha256:26730869004e2b9c4b9ad09cab8625e81d256d1ce97e72df5520e806b1709f92 AS base

FROM base AS builder

RUN mkdir /install
WORKDIR /install

RUN \
 apk update && \
 apk add --no-cache tzdata  && \
 apk add --no-cache --virtual .build-deps gcc libffi-dev g++ snappy-dev krb5-pkinit krb5-dev krb5

COPY services/tmdb/requirements.txt .

RUN pip install --prefix=/install --no-cache-dir -r requirements.txt && \
    apk --purge del .build-deps

FROM base

ENV ENVIRONMENT=docker
ENV PYTHONUNBUFFERED=1
ENV TZ=Europe/Stockholm
ENV PIP_DISABLE_PIP_VERSION_CHECK=1
ENV PYTHONDONTWRITEBYTECODE=1

COPY --from=builder /install /usr/local
RUN apk --no-cache add libpq curl && adduser -D -u 1000 appuser

COPY services/tmdb/ /app/services/tmdb/

WORKDIR /app/services/tmdb

# Create SQLite database file with proper permissions
# Also make the parent dir writable by appuser so SQLite can create journal/WAL files
RUN touch db.sqlite3 && chown appuser:appuser db.sqlite3 && chown appuser:appuser /app/services/tmdb/

USER appuser

ENTRYPOINT ["/bin/sh", "-c", "python manage.py migrate --noinput && python manage.py crontab add && crond & exec \"$@\"", "sh"]
CMD ["hypercorn", "--config=gunicorn.config.py", "settings.asgi:application"]
