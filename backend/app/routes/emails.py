from __future__ import annotations

import json
from typing import Any, Literal

from fastapi import APIRouter, HTTPException, Query
from pydantic import BaseModel, Field

from app.database import get_db

router = APIRouter(prefix="/emails", tags=["emails"])


class EmailAttachment(BaseModel):
    filename: str
    size: str | None = None
    download_url: str | None = None


class EmailCreate(BaseModel):
    sender_name: str = Field(min_length=1)
    sender_email: str = Field(min_length=3)
    to_name: str = Field(min_length=1)
    to_email: str = Field(min_length=3)
    subject: str = Field(min_length=1)
    body: str = Field(min_length=1)
    preview: str | None = None
    received_at: str | None = None
    is_read: bool = False
    is_archived: bool = False
    attachments: list[EmailAttachment] = Field(default_factory=list)


class EmailUpdate(BaseModel):
    sender_name: str | None = None
    sender_email: str | None = None
    to_name: str | None = None
    to_email: str | None = None
    subject: str | None = None
    preview: str | None = None
    body: str | None = None
    received_at: str | None = None
    is_read: bool | None = None
    is_archived: bool | None = None
    attachments: list[EmailAttachment] | None = None


def _row_to_email(row: Any) -> dict[str, Any]:
    attachments_raw = row["attachments_json"] if "attachments_json" in row.keys() else "[]"
    try:
        attachments = json.loads(attachments_raw) if attachments_raw else []
    except Exception:
        attachments = []

    return {
        "id": row["id"],
        "sender_name": row["sender_name"],
        "sender_email": row["sender_email"],
        "to_name": row["to_name"],
        "to_email": row["to_email"],
        "subject": row["subject"],
        "preview": row["preview"],
        "body": row["body"],
        "received_at": row["received_at"],
        "is_read": bool(row["is_read"]),
        "is_archived": bool(row["is_archived"]),
        "attachments": attachments,
    }


@router.get("")
def list_emails(
    tab: Literal["all", "unread", "archive"] = Query("all"),
    q: str | None = Query(None, description="Search subject/sender/preview"),
):
    """List emails. Supports tabs (all/unread/archive) and basic search."""
    try:
        where: list[str] = []
        params: list[Any] = []

        if tab == "unread":
            where.append("is_read = 0")
            where.append("is_archived = 0")
        elif tab == "archive":
            where.append("is_archived = 1")
        else:
            where.append("is_archived = 0")

        if q:
            where.append("(subject LIKE ? OR sender_name LIKE ? OR sender_email LIKE ? OR preview LIKE ?)")
            like = f"%{q}%"
            params.extend([like, like, like, like])

        where_sql = " WHERE " + " AND ".join(where) if where else ""

        with get_db() as conn:
            cursor = conn.cursor()
            cursor.execute(
                f"""
                SELECT id, sender_name, sender_email, to_name, to_email,
                       subject, preview, body, received_at, is_read, is_archived, attachments_json
                FROM emails
                {where_sql}
                ORDER BY datetime(received_at) DESC, id DESC
                """,
                tuple(params),
            )
            rows = cursor.fetchall()
            emails = [_row_to_email(row) for row in rows]
            return {"emails": emails}
    except Exception as e:
        raise HTTPException(status_code=500, detail=f"Database error: {str(e)}")


@router.get("/{email_id}")
def get_email(email_id: int):
    """Fetch a single email by id."""
    try:
        with get_db() as conn:
            cursor = conn.cursor()
            cursor.execute(
                """
                SELECT id, sender_name, sender_email, to_name, to_email,
                       subject, preview, body, received_at, is_read, is_archived, attachments_json
                FROM emails
                WHERE id = ?
                """,
                (email_id,),
            )
            row = cursor.fetchone()
            if row is None:
                raise HTTPException(status_code=404, detail="Email not found")
            return _row_to_email(row)
    except HTTPException:
        raise
    except Exception as e:
        raise HTTPException(status_code=500, detail=f"Database error: {str(e)}")


@router.post("", status_code=201)
def create_email(payload: EmailCreate):
    """Create a new email record (no real sending)."""
    try:
        preview = payload.preview
        if not preview:
            preview = payload.body.replace("\n", " ").strip()
            if len(preview) > 120:
                preview = preview[:117] + "..."

        received_at = payload.received_at
        if not received_at:
            # Store an ISO string; ordering uses sqlite datetime(received_at)
            received_at = payload.model_dump().get("received_at") or ""
            if not received_at:
                from datetime import datetime, timezone

                received_at = datetime.now(timezone.utc).replace(microsecond=0).isoformat()

        attachments_json = json.dumps([a.model_dump() for a in payload.attachments])

        with get_db() as conn:
            cursor = conn.cursor()
            cursor.execute(
                """
                INSERT INTO emails (
                    sender_name, sender_email, to_name, to_email,
                    subject, preview, body, received_at,
                    is_read, is_archived, attachments_json
                ) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)
                """,
                (
                    payload.sender_name,
                    payload.sender_email,
                    payload.to_name,
                    payload.to_email,
                    payload.subject,
                    preview,
                    payload.body,
                    received_at,
                    1 if payload.is_read else 0,
                    1 if payload.is_archived else 0,
                    attachments_json,
                ),
            )
            email_id = cursor.lastrowid
            cursor.execute(
                """
                SELECT id, sender_name, sender_email, to_name, to_email,
                       subject, preview, body, received_at, is_read, is_archived, attachments_json
                FROM emails WHERE id = ?
                """,
                (email_id,),
            )
            row = cursor.fetchone()
            return _row_to_email(row)
    except Exception as e:
        raise HTTPException(status_code=500, detail=f"Database error: {str(e)}")


@router.put("/{email_id}")
def update_email(email_id: int, payload: EmailUpdate):
    """Update an email (mark read, archive, etc.)."""
    try:
        updates: list[str] = []
        params: list[Any] = []

        data = payload.model_dump(exclude_unset=True)
        if "attachments" in data:
            data["attachments_json"] = json.dumps([a.model_dump() for a in (payload.attachments or [])])
            data.pop("attachments", None)

        bool_fields = {"is_read", "is_archived"}
        for key, value in data.items():
            if key in bool_fields and value is not None:
                updates.append(f"{key} = ?")
                params.append(1 if value else 0)
            else:
                updates.append(f"{key} = ?")
                params.append(value)

        if not updates:
            return get_email(email_id)

        with get_db() as conn:
            cursor = conn.cursor()
            cursor.execute("SELECT 1 FROM emails WHERE id = ?", (email_id,))
            if cursor.fetchone() is None:
                raise HTTPException(status_code=404, detail="Email not found")

            cursor.execute(
                f"UPDATE emails SET {', '.join(updates)} WHERE id = ?",
                tuple(params + [email_id]),
            )

            cursor.execute(
                """
                SELECT id, sender_name, sender_email, to_name, to_email,
                       subject, preview, body, received_at, is_read, is_archived, attachments_json
                FROM emails WHERE id = ?
                """,
                (email_id,),
            )
            row = cursor.fetchone()
            return _row_to_email(row)
    except HTTPException:
        raise
    except Exception as e:
        raise HTTPException(status_code=500, detail=f"Database error: {str(e)}")


@router.delete("/{email_id}", status_code=204)
def delete_email(email_id: int):
    """Delete an email."""
    try:
        with get_db() as conn:
            cursor = conn.cursor()
            cursor.execute("SELECT 1 FROM emails WHERE id = ?", (email_id,))
            if cursor.fetchone() is None:
                raise HTTPException(status_code=404, detail="Email not found")
            cursor.execute("DELETE FROM emails WHERE id = ?", (email_id,))
            return None
    except HTTPException:
        raise
    except Exception as e:
        raise HTTPException(status_code=500, detail=f"Database error: {str(e)}")
