"""Solidity compiler service using py-solc-x."""

from __future__ import annotations

import re
from typing import Any

try:
    import solcx
    SOLCX_AVAILABLE = True
except ImportError:
    SOLCX_AVAILABLE = False

# Fallback version list if network unavailable
_FALLBACK_VERSIONS = [
    "0.8.24", "0.8.23", "0.8.22", "0.8.21", "0.8.20",
    "0.8.19", "0.8.17", "0.8.0", "0.7.6", "0.6.12",
]


def compile_solidity(
    source_code: str,
    compiler_version: str = "0.8.24",
    optimize: bool = True,
    optimize_runs: int = 200,
) -> tuple[list[dict[str, Any]], list[str], list[str]]:
    """Compile Solidity source code.

    Returns (contracts, errors, warnings).
    """
    if not SOLCX_AVAILABLE:
        return [], ["py-solc-x not installed. Run: pip install py-solc-x"], []

    try:
        install_compiler(compiler_version)
        solcx.set_solc_version(compiler_version)

        output = solcx.compile_source(
            source_code,
            output_values=["abi", "bin", "bin-runtime", "metadata"],
            optimize=optimize,
            optimize_runs=optimize_runs,
        )

        contracts: list[dict[str, Any]] = []
        for key, data in output.items():
            name = key.split(":")[-1] if ":" in key else key
            contracts.append({
                "contract_name": name,
                "abi": data.get("abi", []),
                "bytecode": data.get("bin", ""),
                "deployed_bytecode": data.get("bin-runtime", ""),
            })

        return contracts, [], []

    except Exception as exc:  # solcx.exceptions.SolcError
        raw = str(exc)
        errors: list[str] = []
        warnings: list[str] = []
        for line in raw.splitlines():
            if "Warning:" in line:
                warnings.append(line.strip())
            elif line.strip():
                errors.append(line.strip())
        if not errors and not warnings:
            errors.append(raw)
        return [], errors, warnings


def install_compiler(version: str) -> None:
    """Install solc binary if not already present."""
    if not SOLCX_AVAILABLE:
        return
    installed = [str(v) for v in solcx.get_installed_solc_versions()]
    if version not in installed:
        solcx.install_solc(version)


def get_available_versions() -> list[str]:
    """Return the latest installable solc versions (up to 20)."""
    if not SOLCX_AVAILABLE:
        return _FALLBACK_VERSIONS
    try:
        versions = solcx.get_installable_solc_versions()
        return [str(v) for v in versions[:20]]
    except Exception:
        return _FALLBACK_VERSIONS


def _extract_contract_names(source_code: str) -> list[str]:
    """Regex-extract contract/interface/library names from source."""
    pattern = r"(?:contract|interface|library)\s+(\w+)"
    return re.findall(pattern, source_code)
