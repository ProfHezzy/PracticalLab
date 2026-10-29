from __future__ import annotations

import base64
import hashlib
import hmac
import secrets
import struct
import time
from urllib.parse import quote

TOTP_PERIOD = 30
TOTP_DIGITS = 6
RECOVERY_CODE_COUNT = 8


def generate_totp_secret() -> str:
    return base64.b32encode(secrets.token_bytes(20)).decode("ascii").rstrip("=")


def _secret_key(secret: str) -> bytes:
    padded = secret.upper() + "=" * ((8 - len(secret) % 8) % 8)
    return base64.b32decode(padded)


def totp_code(secret: str, for_time: int | None = None) -> str:
    counter = int(for_time if for_time is not None else time.time()) // TOTP_PERIOD
    message = struct.pack(">Q", counter)
    digest = hmac.new(_secret_key(secret), message, hashlib.sha1).digest()
    offset = digest[-1] & 0x0F
    number = struct.unpack(">I", digest[offset : offset + 4])[0] & 0x7FFFFFFF
    return str(number % (10**TOTP_DIGITS)).zfill(TOTP_DIGITS)


def verify_totp(secret: str, code: str) -> bool:
    offered = (code or "").strip()
    if len(offered) != TOTP_DIGITS or not offered.isdigit() or not secret:
        return False
    now = int(time.time())
    for window in (-1, 0, 1):
        expected = totp_code(secret, now + (window * TOTP_PERIOD))
        if hmac.compare_digest(expected, offered):
            return True
    return False


def otpauth_uri(username: str, secret: str) -> str:
    label = quote(f"PracticalLab Africa:{username}")
    issuer = quote("PracticalLab Africa")
    return (
        f"otpauth://totp/{label}?secret={secret}&issuer={issuer}"
        f"&digits={TOTP_DIGITS}&period={TOTP_PERIOD}"
    )


def generate_recovery_codes() -> list[str]:
    return [secrets.token_hex(4).upper() for _ in range(RECOVERY_CODE_COUNT)]


def hash_recovery_code(code: str) -> str:
    return hashlib.sha256(code.strip().upper().encode("utf-8")).hexdigest()
