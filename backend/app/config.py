import os
from dotenv import load_dotenv

# Load environment variables from the backend/.env file relative to this file
backend_dir = os.path.dirname(os.path.dirname(os.path.abspath(__file__)))
dotenv_path = os.path.join(backend_dir, ".env")
load_dotenv(dotenv_path=dotenv_path)

class Settings:
    MONGODB_URI: str = os.getenv("MONGODB_URI", "mongodb://localhost:27017")
    JWT_SECRET_KEY: str = os.getenv("JWT_SECRET_KEY", "your-default-jwt-secret-key-make-it-very-long-and-secure")
    JWT_ALGORITHM: str = os.getenv("JWT_ALGORITHM", "HS256")
    ACCESS_TOKEN_EXPIRE_MINUTES: int = int(os.getenv("ACCESS_TOKEN_EXPIRE_MINUTES", "1440"))
    PORT: int = int(os.getenv("PORT", "8000"))

settings = Settings()
