"""Command-line interface — primarily for the end-to-end demo."""

from __future__ import annotations

import asyncio

import typer
from rich.console import Console
from rich.panel import Panel

from . import __version__

app = typer.Typer(
    add_completion=False,
    no_args_is_help=True,
    help="Hunarmand AI core CLI.",
)
console = Console()


@app.command()
def version() -> None:
    """Print the version."""

    console.print(f"hunarmand-ai {__version__}")


@app.command()
def serve(
    host: str = typer.Option("0.0.0.0", "--host"),
    port: int = typer.Option(8000, "--port"),
    reload: bool = typer.Option(False, "--reload"),
) -> None:
    """Run the FastAPI service via uvicorn."""

    import uvicorn

    uvicorn.run(
        "hunarmand_ai.main:app", host=host, port=port, reload=reload, log_level="info"
    )


@app.command(name="migrate")
def migrate() -> None:
    """Create all tables (development convenience)."""

    from .db import create_all_tables

    asyncio.run(create_all_tables())
    console.print("[green]Database tables created (or already present).[/green]")


@app.command(name="demo")
def demo(
    fixture: str = typer.Option(
        "fixtures/demo_session.json",
        "--fixture",
        "-f",
        help="Path to a demo session fixture (see fixtures/ in this repo).",
    ),
    use_llm: bool = typer.Option(
        False,
        "--use-llm",
        help=(
            "Run the AI Interview Engine and Craft DNA extractor against the live LLM "
            "(requires OPENAI_API_KEY). Without --use-llm, the demo runs the offline "
            "pieces only (chunker, signer, verifier) which is enough to demonstrate "
            "the cryptographic Sanad chain end-to-end."
        ),
    ),
) -> None:
    """Run the end-to-end Vault → Sanad demo."""

    from .demo import run_demo

    asyncio.run(run_demo(fixture_path=fixture, use_llm=use_llm))
    console.print(Panel.fit("[bold green]Demo complete.[/bold green]"))


if __name__ == "__main__":
    app()
