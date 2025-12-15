"""create investments and watchlist tables

Revision ID: ae_add_investments_watchlist
Revises: 151c59b06e5b
Create Date: 2025-10-18 00:00:00.000000
"""
from typing import Sequence, Union

from alembic import op
import sqlalchemy as sa

# revision identifiers used by alembic
revision: str = 'ae_add_investments_watchlist'
down_revision: Union[str, Sequence[str], None] = '151c59b06e5b'
branch_labels = None
depends_on = None


def upgrade() -> None:
    op.create_table(
        'investments',
        sa.Column('id', sa.Integer(), primary_key=True),
        sa.Column('symbol', sa.String(), nullable=False),
        sa.Column('name', sa.String(), nullable=True),
        sa.Column('type', sa.String(), nullable=False),
        sa.Column('quantity', sa.Numeric(20,6), nullable=False, server_default="0"),
        sa.Column('purchase_price', sa.Numeric(20,6), nullable=False, server_default="0"),
        sa.Column('purchase_date', sa.DateTime(), nullable=False),
        sa.Column('current_price', sa.Numeric(20,6), nullable=True),
        sa.Column('currency', sa.String(), nullable=False, server_default="USD"),
        sa.Column('account_id', sa.Integer(), nullable=False),
        sa.Column('notes', sa.Text(), nullable=True),
        sa.ForeignKeyConstraint(['account_id'], ['accounts.id']),
    )
    op.create_index(op.f('ix_investments_symbol'), 'investments', ['symbol'], unique=False)

    op.create_table(
        'watchlist',
        sa.Column('id', sa.Integer(), primary_key=True),
        sa.Column('symbol', sa.String(), nullable=False),
        sa.Column('name', sa.String(), nullable=True),
        sa.Column('type', sa.String(), nullable=False),
        sa.Column('target_price', sa.Numeric(20,6), nullable=True),
        sa.Column('notes', sa.Text(), nullable=True),
    )
    op.create_index(op.f('ix_watchlist_symbol'), 'watchlist', ['symbol'], unique=False)


def downgrade() -> None:
    op.drop_index(op.f('ix_watchlist_symbol'), table_name='watchlist')
    op.drop_table('watchlist')
    op.drop_index(op.f('ix_investments_symbol'), table_name='investments')
    op.drop_table('investments')
