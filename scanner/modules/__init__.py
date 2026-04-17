# scanner/modules/__init__.py
# All vulnerability check modules are imported here for clean access.

from . import xss
from . import sqli
from . import headers
from . import ssl_check
from . import csrf
from . import auth
from . import error_disclosure
from . import secrets
from . import ecommerce

__all__ = [
    "xss",
    "sqli",
    "headers",
    "ssl_check",
    "csrf",
    "auth",
    "error_disclosure",
    "secrets",
    "ecommerce",
]