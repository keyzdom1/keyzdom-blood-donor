from fastapi import FastAPI
from fastapi.middleware.cors import CORSMiddleware
from app.config import get_settings
from app.api import auth, donors, blood_requests, matches, organizations, admin
from app.websocket import router as ws_router

settings = get_settings()

app = FastAPI(
    title=settings.APP_NAME,
    docs_url="/docs",
    redoc_url="/redoc",
)

app.add_middleware(
    CORSMiddleware,
    allow_origins=["http://localhost:3000"],
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

app.include_router(auth.router)
app.include_router(donors.router)
app.include_router(blood_requests.router)
app.include_router(matches.router)
app.include_router(organizations.router)
app.include_router(admin.router)
app.include_router(ws_router)


@app.get("/health")
async def health_check():
    return {"status": "ok"}
