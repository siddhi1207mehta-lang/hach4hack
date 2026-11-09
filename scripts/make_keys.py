import sys
from pathlib import Path
from cryptography.hazmat.primitives import serialization
from cryptography.hazmat.primitives.asymmetric import rsa

def make_keys() -> None:
    repo_root = Path(__file__).resolve().parent.parent
    keys_dir = repo_root / "store-api" / "keys"
    keys_dir.mkdir(parents=True, exist_ok=True)

    priv_path = keys_dir / "jwt_private.pem"
    pub_path = keys_dir / "jwt_public.pem"

    if priv_path.exists() or pub_path.exists():
        print(f"Refusing to overwrite existing keys in {keys_dir}")
        return

    private_key = rsa.generate_private_key(
        public_exponent=65537,
        key_size=2048,
    )
    public_key = private_key.public_key()

    priv_pem = private_key.private_bytes(
        encoding=serialization.Encoding.PEM,
        format=serialization.PrivateFormat.PKCS8,
        encryption_algorithm=serialization.NoEncryption(),
    )

    pub_pem = public_key.public_bytes(
        encoding=serialization.Encoding.PEM,
        format=serialization.PublicFormat.SubjectPublicKeyInfo,
    )

    priv_path.write_bytes(priv_pem)
    pub_path.write_bytes(pub_pem)

    print(f"Created RS256 key pair in {keys_dir}")

if __name__ == "__main__":
    make_keys()

