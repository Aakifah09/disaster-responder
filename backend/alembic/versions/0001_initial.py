"""Initial database schema

Revision ID: 0001_initial
Revises: None
Create Date: 2026-05-05 00:00:00.000000
"""

from alembic import op
import sqlalchemy as sa

# revision identifiers, used by Alembic.
revision = '0001_initial'
down_revision = None
branch_labels = None
depends_on = None


def upgrade():
    op.execute(
        """
        CREATE TABLE IF NOT EXISTS incidents (
            id INTEGER NOT NULL PRIMARY KEY,
            raw_report TEXT NOT NULL,
            location VARCHAR,
            severity VARCHAR,
            disaster_type VARCHAR,
            casualties_estimate INTEGER,
            resources_needed TEXT,
            dispatch_instruction TEXT,
            status VARCHAR,
            deployment_time INTEGER,
            lat FLOAT,
            lng FLOAT,
            created_at DATETIME
        )
        """
    )
    op.execute(
        """
        CREATE TABLE IF NOT EXISTS dispatch_logs (
            id INTEGER NOT NULL PRIMARY KEY,
            incident_id INTEGER NOT NULL,
            message TEXT NOT NULL,
            created_at DATETIME
        )
        """
    )
    op.execute("DROP TABLE IF EXISTS incident_images")


def downgrade():
    op.execute("DROP TABLE IF EXISTS dispatch_logs")
    op.execute("DROP TABLE IF EXISTS incidents")
