FROM python:3.12-slim

ENV PYTHONDONTWRITEBYTECODE=1 \
    PYTHONUNBUFFERED=1

WORKDIR /workspace
COPY apps/api/requirements.txt /workspace/apps/api/requirements.txt
RUN python -m pip install --no-cache-dir -r apps/api/requirements.txt
COPY apps/api /workspace/apps/api
EXPOSE 8000
CMD ["python", "apps/api/manage.py", "runserver", "0.0.0.0:8000"]
