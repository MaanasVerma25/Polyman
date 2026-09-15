from fastapi import FastAPI

from app.routers import auth, budget

app = FastAPI(
    title="Budget Estimation Microservice",
    description="A secure microservice API for project budget estimation with JWT authentication.",
    version="1.0.0"
)

app.include_router(auth.router)
app.include_router(budget.router)

@app.get("/", tags=["Health Check"], summary="Root endpoint / Health Check")
async def root():
    return {"message": "Budget Estimation API is running!"}
