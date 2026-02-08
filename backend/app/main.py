import os

from fastapi import FastAPI
from fastapi.middleware.cors import CORSMiddleware
from fastapi.staticfiles import StaticFiles

from app.routes import emails_router, health_router, items_router

app = FastAPI(title="Backend Exercise API", version="1.0.0")

app.add_middleware(
    CORSMiddleware,
    allow_origins=os.getenv("CORS_ALLOW_ORIGINS", "*").split(","),
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

# Serve attachments (and any other static exercise assets)
attachments_dir = os.getenv("ATTACHMENTS_PATH", "data/attachments")
if os.path.isdir(attachments_dir):
    app.mount("/static", StaticFiles(directory=attachments_dir), name="static")

# Register routers
app.include_router(health_router)
app.include_router(items_router)
app.include_router(emails_router)


if __name__ == "__main__":
    import uvicorn
    uvicorn.run(app, host="0.0.0.0", port=8000)
