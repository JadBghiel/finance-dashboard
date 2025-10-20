import os
import sys
from logging.config import fileConfig

from sqlalchemy import engine_from_config
from sqlalchemy import pool

from alembic import context

# this is the Alembic Config object, which provides
# access to the values within the .ini file in use.
config = context.config

# interpret the config file for Python logging.
# this line sets up loggers basically.
if config.config_file_name is not None:
    fileConfig(config.config_file_name)

# START OF CHANGES

# add the "backend" directory to the python path
# allows alembic to find your app module
sys.path.insert(0, os.path.realpath(os.path.join(os.path.dirname(__file__), '..')))

# import your Base model from your application
from app.core.database import Base

# import all of your models here so that Base knows about them
from app.models.category import Category
from app.models.income import Income
from app.models.expense import Expense
from app.models.account import Account

# target metadata that alembic will use to detect changes
target_metadata = Base.metadata

# END OF CHANGES


def run_migrations_offline() -> None:
    """Run migrations in 'offline' mode."""
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
    """Run migrations in 'online' mode."""
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
