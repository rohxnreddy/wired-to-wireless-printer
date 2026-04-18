import os
import subprocess
from fastapi import FastAPI, UploadFile, File, HTTPException, Request, Form
from fastapi.responses import HTMLResponse, JSONResponse
from fastapi.staticfiles import StaticFiles
from fastapi.templating import Jinja2Templates
from fastapi.middleware.cors import CORSMiddleware
import shutil
from PIL import Image

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
async def upload_file(file: UploadFile = File(...), pages: str = Form(None)):
    if not file.filename:
        raise HTTPException(status_code=400, detail="No file uploaded")
    
    # Validate page range format if provided
    if pages:
        import re
        if not re.match(r'^[\d\s\-,]+$', pages):
            raise HTTPException(status_code=400, detail="Invalid page range format")
    
    file_path = os.path.join(UPLOAD_DIR, file.filename)
    temp_pdf_path = None
    
    try:
        # Save file temporarily
        with open(file_path, "wb") as buffer:
            shutil.copyfileobj(file.file, buffer)
            
        # Determine if we should convert image to PDF
        print_path = file_path
        file_ext = os.path.splitext(file.filename)[1].lower()
        is_image = file_ext in ['.jpg', '.jpeg', '.png', '.bmp', '.gif'] or (file.content_type and file.content_type.startswith('image/'))
        
        if is_image:
            try:
                img = Image.open(file_path)
                # Convert to RGB (required for PDF saving if image is RGBA or Palette)
                if img.mode in ("RGBA", "P"):
                    img = img.convert("RGB")
                
                temp_pdf_filename = f"conv_{os.path.splitext(file.filename)[0]}.pdf"
                temp_pdf_path = os.path.join(UPLOAD_DIR, temp_pdf_filename)
                
                # Save as PDF
                img.save(temp_pdf_path, "PDF", resolution=100.0)
                print_path = temp_pdf_path
                print(f"Converted {file.filename} to PDF for printing")
            except Exception as conv_err:
                print(f"Image to PDF conversion failed, falling back to direct print: {conv_err}")
                print_path = file_path

        # Send to printer via CUPS (lp command)
        try:
            # Build the lp command
            cmd = ["lp"]
            if pages and not is_image: # Only apply page range to non-images (images are always 1 page)
                # -P specifies page ranges (e.g., 1-3, 5, 7-10)
                cmd.extend(["-P", pages])
                
            cmd.append(print_path)
            
            result = subprocess.run(cmd, capture_output=True, text=True, check=True)
            print_status = f"Printed successfully: {result.stdout}"
        except subprocess.CalledProcessError as e:
            error_msg = e.stderr.strip()
            if "No pages were selected" in error_msg:
                print_status = "Invalid page range: The document doesn't have those pages."
            elif "sides" in error_msg or "option" in error_msg:
                print_status = f"Printer error: {error_msg}. Your printer might not support two-sided printing."
            else:
                print_status = f"Print failed: {error_msg}"
            
            raise HTTPException(status_code=500, detail=print_status)
        except FileNotFoundError:
            # If 'lp' command is not found
            print_status = "Print simulated (lp command not found)"
            
        return JSONResponse(content={"message": "Process complete", "status": print_status, "filename": file.filename})
        
    except Exception as e:
        raise HTTPException(status_code=500, detail=str(e))
        
    finally:
        # Clean up: delete files after printing
        for path in [file_path, temp_pdf_path]:
            if path and os.path.exists(path):
                try:
                    os.remove(path)
                except OSError:
                    pass
