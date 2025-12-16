# Use the official Python image from the Docker Hub
FROM python:3.10-slim-buster
# Set the working directory in the container
WORKDIR /app

# Copy the requirements.txt file into the container
COPY requirements.txt .

# Install the Python dependencies
RUN apt-get update && apt-get install -y gcc libpq-dev
RUN pip install -r requirements.txt

# Copy the rest of the application code into the container
COPY . .

# Expose the port that the application will run on
EXPOSE 5555

# Run the application
CMD ["uvicorn", "main:app", "--host", "0.0.0.0", "--port", "5555", "--log-level", "debug"]