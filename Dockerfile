# Use an official Python runtime as a parent image
FROM python:3.11-slim

# Set the working directory in the container
WORKDIR /app

# Install system dependencies
# cups-client is needed for the 'lp' command
RUN apt-get update && apt-get install -y \
    cups-client \
    && rm -rf /var/lib/apt/lists/*

# Copy the requirements file into the container
COPY requirements.txt .

# Install any needed packages specified in requirements.txt
RUN pip install --no-cache-dir -r requirements.txt

# Copy the rest of the application code into the container
COPY . .

# Expose port 8888 for the FastAPI app
EXPOSE 8888

# Command to run the application using uvicorn
CMD ["uvicorn", "server.src.app:app", "--host", "0.0.0.0", "--port", "8888"]
