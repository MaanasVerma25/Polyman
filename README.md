# Secure Budget Estimation Microservice

This project implements a secure microservice API for budget estimation, featuring JWT authentication and MIT license compliance.

## Features

*   **JWT Authentication**: Secure user registration, login, and token-based access to protected endpoints.
*   **Budget Estimation**: An API endpoint to estimate project budgets based on various parameters.
*   **FastAPI**: Built with FastAPI for high performance and automatic interactive API documentation (Swagger UI).
*   **Containerization**: Dockerfile for easy deployment.
*   **Automated Tests**: Comprehensive test suite using `pytest`.
*   **MIT License**: Open-source friendly licensing.

## Project Structure

```
.
├── app/
│   ├── core/               # Configuration, security utilities
│   ├── models/             # Pydantic models for data structures
│   ├── schemas/            # Pydantic schemas for request/response validation
│   ├── services/           # Business logic services
│   ├── routers/            # API endpoint definitions
│   └── main.py             # Main FastAPI application entry point
├── tests/                  # Automated test suite
├── Dockerfile              # Docker container definition
├── requirements.txt        # Python dependencies
├── README.md               # Project documentation
└── LICENSE                 # MIT License file
```

## Setup and Installation

### Prerequisites

*   Python 3.9+
*   pip (Python package installer)
*   Docker (optional, for containerized deployment)

### Local Development

1.  **Clone the repository:**
    ```bash
    git clone <repository-url>
    cd <repository-name>
    ```

2.  **Create a virtual environment and activate it:**
    ```bash
    python -m venv venv
    source venv/bin/activate  # On Windows: .\venv\Scripts\activate
    ```

3.  **Install dependencies:**
    ```bash
    pip install -r requirements.txt
    ```

4.  **Run the application:**
    ```bash
    uvicorn app.main:app --reload --host 0.0.0.0 --port 8000
    ```
    The API will be available at `http://localhost:8000`.
    Access the interactive API documentation (Swagger UI) at `http://localhost:8000/docs`.

### Docker Deployment

1.  **Build the Docker image:**
    ```bash
    docker build -t budget-api .
    ```

2.  **Run the Docker container:**
    ```bash
    docker run -p 8000:8000 budget-api
    ```
    The API will be available at `http://localhost:8000`.

## API Endpoints

### Authentication

*   **`POST /auth/register`**
    *   Registers a new user.
    *   **Request Body**: `{"username": "string", "password": "string"}`
    *   **Response**: `{"message": "User registered successfully"}`

*   **`POST /auth/token`**
    *   Authenticates a user and returns a JWT access token.
    *   **Request Body (Form Data)**: `username=string&password=string`
    *   **Response**: `{"access_token": "string", "token_type": "bearer"}`

### Budget Estimation

*   **`POST /budget/estimate`**
    *   **Requires Authentication (Bearer Token)**.
    *   Estimates a project budget based on provided details.
    *   **Request Body**: `{"project_scope": "small" | "medium" | "large", "complexity": "low" | "medium" | "high", "duration_months": 1, "team_size": 1}`
    *   **Response**: `{"estimated_budget": 12345.67}`

## Running Tests

To run the automated test suite:

```bash
pytest
```

## License

This project is licensed under the MIT License - see the [LICENSE](LICENSE) file for details.
