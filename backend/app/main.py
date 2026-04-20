from fastapi import FastAPI
from fastapi.middleware.cors import CORSMiddleware
from fastapi.staticfiles import StaticFiles
from fastapi.responses import FileResponse
from pathlib import Path

from app.api.routes import api_router
from app.api.ws import ws_router

from fastapi.exceptions import RequestValidationError
from starlette.exceptions import HTTPException as StarletteHTTPException


app = FastAPI(title="imposter")


origins = [
    "http://localhost:5173",  # Vite dev server
    "http://192.168.68.112:5173",
    "http://192.168.68.112:8000",
    "http://192.168.184.13:5173",
    "http://192.168.185.235:5173",
    "http://192.168.188.83:5173"
]

app.add_middleware(
    CORSMiddleware,
    allow_origins=origins,
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

# API routes (altijd op /api prefix)
app.include_router(api_router, prefix="/api")
app.include_router(ws_router, prefix="/ws")
# Uploads folder

# # Exception handlers
# app.add_exception_handler(GameError, game_error_handler)
# app.add_exception_handler(StarletteHTTPException, http_exception_handler)
# app.add_exception_handler(RequestValidationError, validation_exception_handler)

# Health check endpoints
@app.get("/api")
async def root():
    return {"message": "Game API is running"}

@app.get("/api/health")
async def health_check():
    return {"status": "healthy", "environment": "lol"}


frontend_dist = Path(__file__).parent.parent.parent / "frontend" / "dist"

if frontend_dist.exists():
    # Serve statische bestanden (JS, CSS, images, etc.)
    app.mount("/assets", StaticFiles(directory=str(frontend_dist / "assets")), name="assets")
    
    # Serve index.html voor alle andere routes (voor client-side routing)
    @app.get("/{full_path:path}")
    async def serve_frontend(full_path: str):
        """
        Serve de frontend. Als het bestand bestaat, serve het.
        Anders serve index.html (voor React Router, Vue Router, etc.)
        """
        # Check of het een specifiek bestand is
        file_path = frontend_dist / full_path
        if file_path.is_file():
            return FileResponse(file_path)
        
        # Anders serve index.html (voor SPA routing)
        index_path = frontend_dist / "index.html"
        if index_path.exists():
            return FileResponse(index_path)
        
        return {"error": "Frontend not built. Run 'npm run build' in frontend folder."}
else:
    @app.get("/")
    async def no_frontend():
        return {
            "error": "Frontend not found",
            "message": "Run 'npm run build' in the frontend directory first",
            "path_checked": str(frontend_dist)
        }
        
        

def get_local_ip():
    import socket
    
    s = socket.socket(socket.AF_INET, socket.SOCK_DGRAM)
    try:
        s.connect(("8.8.8.8", 80))
        ip = s.getsockname()[0]
    finally:
        s.close()
    return ip

@app.on_event("startup")
async def startup_event():
    ip = get_local_ip()
    print(f"➡ Local:   http://localhost:8000")
    print(f"➡ Network: http://{ip}:8000")