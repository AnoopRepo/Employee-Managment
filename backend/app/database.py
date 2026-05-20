from motor.motor_asyncio import AsyncIOMotorClient
from app.config import settings
import logging
import socket

logger = logging.getLogger("uvicorn.error")

def is_mongo_port_open(uri: str) -> bool:
    try:
        if "localhost" in uri or "127.0.0.1" in uri:
            port = 27017
            if ":" in uri:
                parts = uri.split(":")
                if len(parts) >= 3:
                    port_str = parts[-1].split("/")[0].split("?")[0]
                    if port_str.isdigit():
                        port = int(port_str)
            s = socket.create_connection(("localhost", port), timeout=1.0)
            s.close()
            return True
        return True
    except Exception:
        return False

class Database:
    client: AsyncIOMotorClient = None
    db = None

db_helper = Database()

def get_database():
    if db_helper.db is None:
        is_placeholder = "cluster.xxxx.mongodb.net" in settings.MONGODB_URI or "<username>" in settings.MONGODB_URI
        port_open = True
        if not is_placeholder and ("localhost" in settings.MONGODB_URI or "127.0.0.1" in settings.MONGODB_URI):
            port_open = is_mongo_port_open(settings.MONGODB_URI)

        if is_placeholder or not port_open:
            reason = "URI is placeholder" if is_placeholder else "local port is closed/offline"
            logger.warning(f"⚠️ MongoDB connection unavailable ({reason}). Falling back to Local Mock JSON Database!")
            from app.mock_db import MockDatabase
            db_helper.db = MockDatabase()
        else:
            try:
                db_helper.client = AsyncIOMotorClient(settings.MONGODB_URI)
                # Retrieve default database from URI, default to 'daily_work_reports' if not specified
                db_helper.db = db_helper.client.get_default_database(default="daily_work_reports")
                logger.info("Successfully connected to MongoDB!")
            except Exception as e:
                logger.error(f"Error connecting to MongoDB: {e}. Falling back to Local Mock JSON Database!")
                from app.mock_db import MockDatabase
                db_helper.db = MockDatabase()
    return db_helper.db

def close_database():
    if db_helper.client is not None:
        db_helper.client.close()
        logger.info("Closed MongoDB connection.")
