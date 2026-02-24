from fastapi import APIRouter, HTTPException

from app.schemas.report import RideReportSchema
from app.schemas.ride import RideInputSchema
from app.services.recommendations import build_report
from app.services.weather import WeatherServiceError

router = APIRouter(prefix="/rides", tags=["rides"])


@router.post("/report", response_model=RideReportSchema)
async def create_report(ride_input: RideInputSchema) -> RideReportSchema:
    try:
        report = await build_report(ride_input)
    except WeatherServiceError:
        raise HTTPException(
            status_code=503,
            detail="Weather data is temporarily unavailable. Please try again shortly.",
            headers={"Retry-After": "30"},
        )
    except ValueError as e:
        raise HTTPException(status_code=422, detail=str(e))
    return report
