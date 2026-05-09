"""Local Sanad helpers — Ed25519 + QR rendering.

These mirror the AI core's cryptographic primitives so the backend can:

* Render QR images that link to the public provenance page (used by
  the GET ``/sanad/{id}/qr`` route).
* Optionally verify signatures locally for paths that don't want to
  round-trip to the AI core.

The canonical signer is still the AI core (see
``app.api.endpoints.sanad`` for the ``/keys``, ``/sign``, ``/verify``
proxies). These services exist for read-side / utility use.
"""

from . import crypto, qr_engine

__all__ = ["crypto", "qr_engine"]
