from fastapi import FastAPI

app = FastAPI(
    title="SellerShield Agent Placeholder",
    version="0.1.0",
    description="Placeholder agent service until Document 2",
)


@app.get("/healthz")
def healthz() -> dict[str, str]:
    return {"status": "ok"}

