from fastapi import FastAPI
from fastapi.middleware.cors import CORSMiddleware
from contextlib import asynccontextmanager
from app.database import get_database, close_database
from app.routes import auth, reports, users


@asynccontextmanager
async def lifespan(app: FastAPI):
    # Startup: Initialize MongoDB client
    get_database()
    yield
    # Shutdown: Close database client
    close_database()

app = FastAPI(
    title="Daily Work Reports API",
    description="Secure, authenticated and authorized backend service integrated with MongoDB Atlas.",
    version="1.0.0",
    lifespan=lifespan
)

# CORS Configuration - Bulletproof setup using regex to match any HTTP/HTTPS origin in development
app.add_middleware(
    CORSMiddleware,
    allow_origin_regex="https?://.*",
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

# Root Endpoint
@app.get("/")
def read_root():
    return {"message": "Welcome to Daily Work Reports API!"}

# Register Routers
app.include_router(auth.router)
app.include_router(reports.router)
app.include_router(users.router)
