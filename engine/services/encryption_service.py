"""Encryption service for secure credential storage.

Uses Fernet symmetric encryption for storing sensitive data like API keys.
Falls back to base64 encoding in dev/test environments without cryptography.
"""

import os
import base64
import subprocess
import sys
from typing import Optional


def _check_cryptography_available() -> bool:
    """Check if cryptography library is fully functional using subprocess."""
    try:
        # Use subprocess to avoid pyo3 panic in main process
        result = subprocess.run(
            [sys.executable, "-c",
             "from cryptography.fernet import Fernet; k=Fernet.generate_key(); print('ok')"],
            capture_output=True,
            text=True,
            timeout=5
        )
        return result.returncode == 0 and 'ok' in result.stdout
    except Exception:
        return False


# Pre-check availability at module load time
CRYPTOGRAPHY_AVAILABLE = _check_cryptography_available()


class EncryptionService:
    """Service for encrypting and decrypting sensitive data."""

    def __init__(self):
        self._fernet: Optional[object] = None
        self._use_fallback = not CRYPTOGRAPHY_AVAILABLE
        self._initialized = False

        if self._use_fallback:
            print("WARNING: cryptography library not available. Using base64 fallback (NOT SECURE FOR PRODUCTION).")

    def _initialize_encryption(self):
        """Initialize the Fernet encryption with the secret key."""
        if self._initialized:
            return

        self._initialized = True

        if self._use_fallback:
            return

        try:
            from cryptography.fernet import Fernet
            from cryptography.hazmat.primitives import hashes
            from cryptography.hazmat.primitives.kdf.pbkdf2 import PBKDF2HMAC

            secret_key = os.environ.get("ENCRYPTION_KEY")

            if not secret_key:
                print("WARNING: ENCRYPTION_KEY not set. Using derived key from SECRET_KEY.")
                secret_key = os.environ.get("SECRET_KEY", "dev-secret-key-change-in-production")

            # Derive a proper 32-byte key using PBKDF2
            salt = b"tiktok-shop-salt"
            kdf = PBKDF2HMAC(
                algorithm=hashes.SHA256(),
                length=32,
                salt=salt,
                iterations=100000,
            )
            key = base64.urlsafe_b64encode(kdf.derive(secret_key.encode()))
            self._fernet = Fernet(key)
        except Exception as e:
            print(f"WARNING: Failed to initialize Fernet: {e}. Using base64 fallback.")
            self._use_fallback = True

    def encrypt(self, plaintext: str) -> str:
        """
        Encrypt a string value.

        Args:
            plaintext: The string to encrypt

        Returns:
            Base64-encoded encrypted string
        """
        if not plaintext:
            return ""

        self._initialize_encryption()

        if self._use_fallback:
            return "b64:" + base64.b64encode(plaintext.encode()).decode()

        if not self._fernet:
            raise ValueError("Encryption not initialized")

        encrypted = self._fernet.encrypt(plaintext.encode())
        return encrypted.decode()

    def decrypt(self, ciphertext: str) -> str:
        """
        Decrypt an encrypted string.

        Args:
            ciphertext: Base64-encoded encrypted string

        Returns:
            The original plaintext string
        """
        if not ciphertext:
            return ""

        # Handle base64 fallback
        if ciphertext.startswith("b64:"):
            return base64.b64decode(ciphertext[4:]).decode()

        self._initialize_encryption()

        if self._use_fallback:
            return ciphertext

        if not self._fernet:
            raise ValueError("Encryption not initialized")

        try:
            decrypted = self._fernet.decrypt(ciphertext.encode())
            return decrypted.decode()
        except Exception as e:
            raise ValueError(f"Failed to decrypt: {e}")

    def encrypt_dict(self, data: dict, keys_to_encrypt: list) -> dict:
        """Encrypt specific keys in a dictionary."""
        result = data.copy()
        for key in keys_to_encrypt:
            if key in result and result[key]:
                result[key] = self.encrypt(str(result[key]))
        return result

    def decrypt_dict(self, data: dict, keys_to_decrypt: list) -> dict:
        """Decrypt specific keys in a dictionary."""
        result = data.copy()
        for key in keys_to_decrypt:
            if key in result and result[key]:
                try:
                    result[key] = self.decrypt(str(result[key]))
                except ValueError:
                    pass
        return result

    @staticmethod
    def generate_key() -> str:
        """Generate a new Fernet key for use as ENCRYPTION_KEY."""
        if CRYPTOGRAPHY_AVAILABLE:
            try:
                from cryptography.fernet import Fernet
                return Fernet.generate_key().decode()
            except Exception:
                pass
        return base64.b64encode(os.urandom(32)).decode()


# Singleton instance
encryption_service = EncryptionService()
