from app.core.security import hash_password, verify_password


def get_password_hash(password: str) -> str:
    return hash_password(password)


def check_password(plain: str, hashed: str) -> bool:
    return verify_password(plain, hashed)
