from fastapi import APIRouter, Depends, HTTPException, status
from datetime import datetime
from bson import ObjectId
from typing import List
from app.database import get_database
from app.models.report import ReportCreate, ReportResponse
from app.auth import get_current_user, check_admin_role

router = APIRouter(prefix="/api/reports", tags=["Daily Status Reports"])

@router.post("", response_model=ReportResponse, status_code=status.HTTP_201_CREATED)
async def create_report(report_in: ReportCreate, current_user: dict = Depends(get_current_user)):
    db = get_database()
    
    report_dict = report_in.dict()
    report_dict.update({
        "user_id": current_user["id"],
        "created_at": datetime.utcnow()
    })
    
    result = await db.reports.insert_one(report_dict)
    report_dict["id"] = str(result.inserted_id)
    return report_dict

@router.get("", response_model=List[ReportResponse])
async def list_reports(current_user: dict = Depends(get_current_user)):
    db = get_database()
    
    # If admin, fetch all reports
    if current_user.get("role") == "admin":
        cursor = db.reports.find().sort("created_at", -1)
    else:
        # Standard user, fetch only their own reports
        cursor = db.reports.find({"user_id": current_user["id"]}).sort("created_at", -1)
        
    reports = []
    async for doc in cursor:
        doc["id"] = str(doc["_id"])
        reports.append(doc)
        
    return reports

@router.delete("/{report_id}", status_code=status.HTTP_204_NO_CONTENT)
async def delete_report(report_id: str, current_user: dict = Depends(check_admin_role)):
    db = get_database()
    
    try:
        result = await db.reports.delete_one({"_id": ObjectId(report_id)})
        if result.deleted_count == 0:
            raise HTTPException(
                status_code=status.HTTP_404_NOT_FOUND,
                detail="Report not found"
            )
    except Exception as e:
        if isinstance(e, HTTPException):
            raise e
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail="Invalid report ID format"
        )
    return None
