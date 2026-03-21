from werkzeug.security import generate_password_hash, check_password_hash

def hash_password(password: str) -> str:
    return generate_password_hash(password)

def verify_password(password: str, hashed: str) -> bool:
    return check_password_hash(hashed, password)

if __name__ == "__main__":
    password = input("Enter a password to Hash:\n")
    hash = hash_password(password)
    print(hash)
    print(verify_password(password, hash))
    print("If True, your hash is valid, you can enter this into the database, make sure to copy the entire string together")