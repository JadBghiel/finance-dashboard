import os
import sys
from logging.config import fileConfig

from sqlalchemy import engine_from_config
from sqlalchemy import pool

from alembic import context

# alembic config object, which provides
# access to the values within the .ini file in use
config = context.config

# interpret the config file for python logging
# this line sets up loggers
if config.config_file_name is not None:
    fileConfig(config.config_file_name)

# START OF CHANGES

# add the "backend" directory to the python path
# allows alembic to find the app module
sys.path.insert(0, os.path.realpath(os.path.join(os.path.dirname(__file__), '..')))

# import base model from the app
from app.core.database import Base

# import all the models here so that base knows
from app.models.category import Category
from app.models.income import Income
from app.models.expense import Expense
from app.models.account import Account

# target metadata that alembic will use to detect changes
target_metadata = Base.metadata

# END OF CHANGES


def run_migrations_offline() -> None:
    """run migrations in offline mode"""
    url = config.get_main_option("sqlalchemy.url")
    context.configure(
        url=url,
        target_metadata=target_metadata,
        literal_binds=True,
        dialect_opts={"paramstyle": "named"},
    )

    with context.begin_transaction():
        context.run_migrations()


def run_migrations_online() -> None:
    """run migrations in online mode"""
    connectable = engine_from_config(
        config.get_section(config.config_ini_section, {}),
        prefix="sqlalchemy.",
        poolclass=pool.NullPool,
    )

    with connectable.connect() as connection:
        context.configure(
            connection=connection, target_metadata=target_metadata
        )

        with context.begin_transaction():
            context.run_migrations()


if context.is_offline_mode():
    run_migrations_offline()
else:
    run_migrations_online()
