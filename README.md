# Wired to Wireless Printer

A self-hosted, lightweight web server that turns any wired printer (connected via CUPS) into a "wireless" printer accessible via a web browser. Designed to be accessed via a QR code for quick and easy mobile printing.

## Features

- **Mobile Friendly**: Sleek, neon-green themed web interface designed for mobile browsers.
- **PDF Support**: Upload and print PDF documents with ease.
- **Image Printing**: Supports JPG, PNG, and other image formats (automatically converts them to PDF for reliable printing).
- **Page Selection**: Choose specific pages or ranges (e.g., `1-3, 5, 7-10`) for PDF documents.
- **Auto-Cleanup**: Uploaded files are automatically deleted after the print job is sent to the printer.
- **Fast & Efficient**: Built with FastAPI for high performance.

## Tech Stack

- **Backend**: Python, [FastAPI](https://fastapi.tiangolo.com/)
- **Frontend**: Vanilla HTML5, CSS3, JavaScript
- **Image Processing**: [Pillow (PIL)](https://python-pillow.org/)
- **Printing Engine**: [CUPS](https://www.cups.org/) (`lp` command)

## Getting Started

### Prerequisites

- A Linux-based system (Raspberry Pi, old laptop, etc.) with CUPS installed and a printer configured.
- Python 3.8 or higher.

### Installation & Setup

1. **Clone the repository**:
   ```bash
   git clone https://github.com/rohxnreddy/wired-to-wireless-printer.git
   cd wired-to-wireless-printer
   ```

2. **Run the start script**:
   The `start.sh` script will automatically create a virtual environment, install dependencies, and start the server in the background.
   ```bash
   chmod +x start.sh
   ./start.sh
   ```

3. **Check logs**:
   If you need to troubleshoot, you can view the server logs:
   ```bash
   tail -f logs/server.log
   ```

### Accessing the Printer

Once the server is running, it will be accessible at `http://<your-ip>:8888`. 

**Tip:** Generate a QR code pointing to this URL and stick it on your printer for easy access!

## Stopping the Server

To stop the background server, use the provided script:
```bash
chmod +x stop.sh
./stop.sh
```