from fastapi import FastAPI
from fastapi.middleware.cors import CORSMiddleware

# Chat API
from app.api.routes import router as chat_router

# Collection API
from app.api.collection_routes import router as collection_router

# Admin API
from app.api.admin_routes import router as admin_router


app = FastAPI(
    title="Museum AI Assistant",
    version="1.0.0",
    description="Backend AI Assistant Museum Sri Baduga"
)

# ======================================================
# CORS
# ======================================================

app.add_middleware(
    CORSMiddleware,
    allow_origins=["*"],      # Testing
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

# ======================================================
# ROUTES
# ======================================================

app.include_router(chat_router)

app.include_router(collection_router)

app.include_router(admin_router)

# ======================================================
# ROOT
# ======================================================

@app.get("/")
def root():

    return {

        "status": "success",

        "message": "Museum AI Assistant Backend Running 🚀"

    }