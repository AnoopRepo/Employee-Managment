from fastapi import APIRouter, Depends, HTTPException, status
from bson import ObjectId
from typing import List
from app.database import get_database
from app.models.user import UserResponse, UserUpdate
from app.auth import check_admin_role

router = APIRouter(
    prefix="/api/users",
    tags=["User Management"],
    dependencies=[Depends(check_admin_role)]
)

@router.get("", response_model=List[UserResponse])
async def list_users():
    db = get_database()
    cursor = db.users.find()
    users_list = []
    async for doc in cursor:
        doc["id"] = str(doc["_id"])
        users_list.append(doc)
    return users_list

@router.put("/{user_id}", response_model=UserResponse)
async def update_user(user_id: str, user_in: UserUpdate):
    db = get_database()
    
    try:
        user = await db.users.find_one({"_id": ObjectId(user_id)})
        if not user:
            raise HTTPException(
                status_code=status.HTTP_404_NOT_FOUND,
                detail="User not found"
            )
            
        update_data = {k: v for k, v in user_in.dict(exclude_unset=True).items() if v is not None}
        
        if not update_data:
            user["id"] = str(user["_id"])
            return user
            
        await db.users.update_one(
            {"_id": ObjectId(user_id)},
            {"$set": update_data}
        )
        
        # Retrieve the fresh document
        updated_user = await db.users.find_one({"_id": ObjectId(user_id)})
        updated_user["id"] = str(updated_user["_id"])
        return updated_user
        
    except Exception as e:
        if isinstance(e, HTTPException):
            raise e
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail="Invalid user ID format or update error"
        )

@router.delete("/{user_id}", status_code=status.HTTP_204_NO_CONTENT)
async def delete_user(user_id: str):
    db = get_database()
    
    try:
        # First verify if the user exists
        user = await db.users.find_one({"_id": ObjectId(user_id)})
        if not user:
            raise HTTPException(
                status_code=status.HTTP_404_NOT_FOUND,
                detail="User not found"
            )
            
        # Delete user
        await db.users.delete_one({"_id": ObjectId(user_id)})
        
        # Delete all reports associated with this user for consistency
        await db.reports.delete_many({"user_id": user_id})
        
    except Exception as e:
        if isinstance(e, HTTPException):
            raise e
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail="Invalid user ID format or deletion error"
        )
        
    return None
