from fastapi import FastAPI
from fastapi.middleware.cors import CORSMiddleware
from routers import portfolio
from config import settings
from contextlib import asynccontextmanager
import asyncio


@asynccontextmanager
async def lifespan(app: FastAPI):
    try:
        from nse_stocks import get_all_stocks
        loop = asyncio.get_event_loop()
        await loop.run_in_executor(None, get_all_stocks)
        print("Stock list loaded successfully")
    except Exception as e:
        print(f"Stock list preload failed: {e}")
    yield


app = FastAPI(
    title=settings.app_name,
    description="Finvra — Indian Equity Portfolio Analysis Platform",
    version="1.0.0",
    lifespan=lifespan
)

app.add_middleware(
    CORSMiddleware,
    allow_origins=["*"],
    allow_credentials=False,
    allow_methods=["*"],
    allow_headers=["*"],
)

app.include_router(portfolio.router)


@app.get("/")
def root():
    return {
        "status":   "running",
        "app":      settings.app_name,
        "currency": "INR",
        "docs":     "/docs"
    }