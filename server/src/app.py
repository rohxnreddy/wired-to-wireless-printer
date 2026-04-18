import os
import subprocess
from fastapi import FastAPI, UploadFile, File, HTTPException, Request
from fastapi.responses import HTMLResponse, JSONResponse
from fastapi.staticfiles import StaticFiles
from fastapi.templating import Jinja2Templates
from fastapi.middleware.cors import CORSMiddleware
import shutil

app = FastAPI(title="Wired to Wireless Printer")

# Directories
SERVER_SRC_DIR = os.path.dirname(os.path.abspath(__file__))
BASE_DIR = os.path.dirname(os.path.dirname(SERVER_SRC_DIR))
UPLOAD_DIR = os.path.join(SERVER_SRC_DIR, "uploads")
CLIENT_DIR = os.path.join(BASE_DIR, "client")

# Ensure directories exist
os.makedirs(UPLOAD_DIR, exist_ok=True)

app.add_middleware(
    CORSMiddleware,
    allow_origins=["*"],
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

# Mount static files
app.mount("/css", StaticFiles(directory=os.path.join(CLIENT_DIR, "css")), name="css")
app.mount("/js", StaticFiles(directory=os.path.join(CLIENT_DIR, "js")), name="js")

templates = Jinja2Templates(directory=CLIENT_DIR)

@app.get("/", response_class=HTMLResponse)
async def root(request: Request):
    return templates.TemplateResponse(request=request, name="index.html")

@app.post("/upload")
async def upload_file(file: UploadFile = File(...)):
    if not file.filename:
        raise HTTPException(status_code=400, detail="No file uploaded")
    
    file_path = os.path.join(UPLOAD_DIR, file.filename)
    
    try:
        # Save file temporarily
        with open(file_path, "wb") as buffer:
            shutil.copyfileobj(file.file, buffer)
            
        # Send to printer via CUPS (lp command)
        try:
            result = subprocess.run(["lp", file_path], capture_output=True, text=True, check=True)
            print_status = f"Printed successfully: {result.stdout}"
        except subprocess.CalledProcessError as e:
            print_status = f"Print failed: {e.stderr}"
            raise HTTPException(status_code=500, detail=print_status)
        except FileNotFoundError:
            # If 'lp' command is not found (e.g. running on Windows or Mac without CUPS configured)
            print_status = "Print simulated (lp command not found)"
            
        return JSONResponse(content={"message": "File processed successfully", "status": print_status, "filename": file.filename})
        
    except Exception as e:
        raise HTTPException(status_code=500, detail=str(e))
        
    finally:
        # Clean up: delete file after printing
        if os.path.exists(file_path):
            try:
                os.remove(file_path)
            except OSError:
                pass
