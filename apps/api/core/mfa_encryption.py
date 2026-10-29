from __future__ import annotations

import base64
import hashlib

from cryptography.fernet import Fernet, InvalidToken
from django.conf import settings


def _fernet() -> Fernet:
    configured = settings.STAFF_MFA_ENCRYPTION_KEY
    if configured:
        return Fernet(configured.encode())
    # Development fallback only. Production settings require a dedicated Fernet key.
    key = base64.urlsafe_b64encode(hashlib.sha256(settings.SECRET_KEY.encode()).digest())
    return Fernet(key)


def encrypt_secret(secret: str) -> str:
    return _fernet().encrypt(secret.encode()).decode()


def decrypt_secret(ciphertext: str) -> str:
    try:
        return _fernet().decrypt(ciphertext.encode()).decode()
    except (InvalidToken, ValueError) as exc:
        raise ValueError("Staff MFA secret cannot be decrypted with the configured key.") from exc
