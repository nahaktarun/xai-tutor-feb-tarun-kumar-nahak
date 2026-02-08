"""
Migration: Create emails table
Version: 002
Description: Creates the emails table used by the email client challenge
"""

import json
import os
import sqlite3
import sys
from datetime import datetime, timezone

# Add parent directory to path for imports
sys.path.insert(0, os.path.dirname(os.path.dirname(os.path.abspath(__file__))))

from app.database import DATABASE_PATH


def _now_iso() -> str:
    return datetime.now(timezone.utc).replace(microsecond=0).isoformat()


def upgrade():
    """Apply the migration."""
    conn = sqlite3.connect(DATABASE_PATH)
    cursor = conn.cursor()

    cursor.execute(
        """
        CREATE TABLE IF NOT EXISTS _migrations (
            id INTEGER PRIMARY KEY AUTOINCREMENT,
            name TEXT NOT NULL UNIQUE,
            applied_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
        )
        """
    )

    cursor.execute("SELECT 1 FROM _migrations WHERE name = ?", ("002_create_emails_table",))
    if cursor.fetchone():
        print("Migration 002_create_emails_table already applied. Skipping.")
        conn.close()
        return

    cursor.execute(
        """
        CREATE TABLE IF NOT EXISTS emails (
            id INTEGER PRIMARY KEY AUTOINCREMENT,
            sender_name TEXT NOT NULL,
            sender_email TEXT NOT NULL,
            to_name TEXT NOT NULL,
            to_email TEXT NOT NULL,
            subject TEXT NOT NULL,
            preview TEXT NOT NULL,
            body TEXT NOT NULL,
            received_at TEXT NOT NULL,
            is_read INTEGER NOT NULL DEFAULT 0,
            is_archived INTEGER NOT NULL DEFAULT 0,
            attachments_json TEXT NOT NULL DEFAULT '[]'
        )
        """
    )

    # Seed sample emails used by the UI
    attachments = [
        {
            "filename": "Proposal Partnership.pdf",
            "size": "1.5 MB",
            "download_url": "/static/proposal-partnership.pdf",
        }
    ]

    sample_emails = [
        (
            "Jane Doe",
            "jane.doe@business.com",
            "Richard Brown",
            "richard.brown@company.com",
            "Proposal for Parnership 🎉",
            "Hi John, hope this message finds you well! I'm reaching out to explore a potential partnership...",
            "Hi John,\n\nhope this message finds you well! I'm reaching out to explore a potential partnership between our companies. At Jane Corp, which could complement your offerings at John Organisation Corp.\n\nI've attached a proposal detailing how we envision our collaboration, including key benefits, timelines, and implementation strategies. I believe this partnership could unlock exciting opportunities for both of us!\n\nLet me know your thoughts or a convenient time to discuss this further. I'm happy to schedule a call or meeting at your earliest convenience. Looking forward to hearing from you!\n\nWarm regards,\nJane Doe\n",
            _now_iso(),
            0,
            0,
            json.dumps(attachments),
        ),
        (
            "Michael Lee",
            "michael.lee@cusana.io",
            "Richard Brown",
            "richard.brown@company.com",
            "Follow-Up: Product Demo Feedback",
            "Hi John, Thank you for attending the product demo...",
            "Hi John,\n\nThank you for attending the product demo. I'd love to hear your feedback and answer any questions you might have.\n\nBest,\nMichael\n",
            _now_iso(),
            1,
            0,
            json.dumps([]),
        ),
        (
            "Support Team",
            "support@cusana.io",
            "Richard Brown",
            "richard.brown@company.com",
            "Contract Renewal Due 📌",
            "Dear John, This is a reminder that the contract renewal is due soon...",
            "Dear John,\n\nThis is a reminder that the contract renewal is due soon. Please review the attached renewal terms and let us know if you have any questions.\n\nThanks,\nSupport Team\n",
            _now_iso(),
            0,
            0,
            json.dumps([]),
        ),
        (
            "Sarah Connor",
            "sarah.connor@client.com",
            "Richard Brown",
            "richard.brown@company.com",
            "Meeting Recap: Strategies for 2026",
            "Hi John, Thank you for your insights during yesterday's meeting...",
            "Hi John,\n\nThank you for your insights during yesterday's meeting. Here is a short recap and the action items we discussed.\n\nRegards,\nSarah\n",
            _now_iso(),
            1,
            0,
            json.dumps([]),
        ),
        (
            "Natasha Brown",
            "natasha.brown@kozuki.com",
            "Richard Brown",
            "richard.brown@company.com",
            "Happy Holidays from Kozuki team 🎄",
            "Hi John, As the holidays season approaches, we wanted to wish you...",
            "Hi John,\n\nAs the holiday season approaches, we wanted to wish you and your team a wonderful end of year.\n\nWarmly,\nNatasha\n",
            _now_iso(),
            1,
            1,
            json.dumps([]),
        ),
    ]

    cursor.executemany(
        """
        INSERT INTO emails (
            sender_name,
            sender_email,
            to_name,
            to_email,
            subject,
            preview,
            body,
            received_at,
            is_read,
            is_archived,
            attachments_json
        ) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)
        """,
        sample_emails,
    )

    cursor.execute("INSERT INTO _migrations (name) VALUES (?)", ("002_create_emails_table",))

    conn.commit()
    conn.close()
    print("Migration 002_create_emails_table applied successfully.")


def downgrade():
    """Revert the migration."""
    conn = sqlite3.connect(DATABASE_PATH)
    cursor = conn.cursor()

    cursor.execute("DROP TABLE IF EXISTS emails")
    cursor.execute("DELETE FROM _migrations WHERE name = ?", ("002_create_emails_table",))

    conn.commit()
    conn.close()
    print("Migration 002_create_emails_table reverted successfully.")


if __name__ == "__main__":
    import argparse

    parser = argparse.ArgumentParser(description="Run database migration")
    parser.add_argument("action", choices=["upgrade", "downgrade"], help="Migration action to perform")
    args = parser.parse_args()

    if args.action == "upgrade":
        upgrade()
    elif args.action == "downgrade":
        downgrade()
