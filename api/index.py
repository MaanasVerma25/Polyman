import sys
import importlib.util
from pathlib import Path

# Ensure backend directory is on sys.path for app.* imports.
backend_dir = Path(__file__).resolve().parent.parent / "backend"
if str(backend_dir) not in sys.path:
    sys.path.insert(0, str(backend_dir))

# The repository also contains a separate root-level `app` package. Load the
# Polyman backend package explicitly so `main.py` resolves backend modules.
backend_app = backend_dir / "app"
sys.modules.pop("app", None)
app_spec = importlib.util.spec_from_file_location(
    "app",
    backend_app / "__init__.py",
    submodule_search_locations=[str(backend_app)],
)
if app_spec and app_spec.loader:
    backend_app_module = importlib.util.module_from_spec(app_spec)
    sys.modules["app"] = backend_app_module
    app_spec.loader.exec_module(backend_app_module)

from main import app
