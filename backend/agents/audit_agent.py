"""
AuditAgent — AI-powered Solidity smart contract security auditor.

Core audit methodology adapted from github.com/zororaka00/kritisi:
  - Structured severity classification (High / Medium / Low)
  - Business logic + security vulnerability detection
  - JSON-structured output for programmatic consumption
  - Code snippet highlighting for each finding

LLM Backend: NVIDIA NIM (Llama-3.1-Nemotron-Nano-8B) via OpenAI-compatible API.
"""

from agents.base_agent import BaseAgent
from typing import Dict, Any
from openai import OpenAI
import json
import re
import os


# ---------------------------------------------------------------------------
# Kritisi-style structured security audit prompt
# Adapted from: https://github.com/zororaka00/kritisi/blob/main/src/index.js
# ---------------------------------------------------------------------------
KRITISI_SECURITY_PROMPT = """You are an expert Solidity smart contract security auditor. \
Analyze the provided Solidity code for potential issues in business logic and security \
vulnerabilities. Review the code and identify any issues or vulnerabilities, categorizing \
them by severity level as follows:

- **CRITICAL**: Issues that can lead to direct loss of funds, complete contract takeover, \
or irreversible damage. Includes: reentrancy allowing fund drain, unprotected selfdestruct, \
delegatecall to untrusted contracts, tx.origin authentication bypass.

- **High**: Critical issues that could lead to severe security vulnerabilities or major \
functional failures. Includes: reentrancy vulnerabilities, integer overflow/underflow \
(pre-0.8.0), unchecked external calls, access control bypass, frontrunning vulnerabilities.

- **Medium**: Significant issues that may lead to moderate security risks or noticeable \
functional issues. Includes: missing event emissions, centralization risks, \
block.timestamp manipulation, DoS via unbounded loops, missing zero-address checks.

- **Low**: Minor issues that could cause small inefficiencies, minor functional \
inaccuracies, or very low security risks. Includes: gas optimization opportunities, \
naming convention violations, missing NatSpec documentation, unused variables, \
floating pragma version.

For EACH finding, provide:
1. The specific issue description with the affected function/line
2. A concrete fix or improvement suggestion
3. The exact Solidity code snippet that is relevant

Respond ONLY in valid JSON format, structured as follows:

{
    "critical": [
        {
            "issue": "<description of critical issue>",
            "suggestion": "<suggested fix>",
            "code_highlight": "<relevant Solidity code snippet>"
        }
    ],
    "high": [
        {
            "issue": "<description of high-severity issue>",
            "suggestion": "<suggested improvement or fix>",
            "code_highlight": "<relevant Solidity code snippet>"
        }
    ],
    "medium": [
        {
            "issue": "<description of medium-severity issue>",
            "suggestion": "<suggested improvement or fix>",
            "code_highlight": "<relevant Solidity code snippet>"
        }
    ],
    "low": [
        {
            "issue": "<description of low-severity issue>",
            "suggestion": "<suggested improvement or fix>",
            "code_highlight": "<relevant Solidity code snippet>"
        }
    ]
}

If no issues are found for a particular severity level, use an empty array for that \
category. Ensure the `code_highlight` field contains the exact portion of the Solidity \
code that is relevant to the described issue.

IMPORTANT: Return ONLY the JSON object. No markdown fences, no explanations, no extra text."""


# ---------------------------------------------------------------------------
# Multi-phase analysis system prompt (extends kritisi with deeper coverage)
# ---------------------------------------------------------------------------
ANALYSIS_PHASES_PROMPT = """Additionally, perform these analysis phases in order:

**Phase 1 — Structure Scan:**
- Contract inheritance hierarchy
- State variable visibility and mutability
- Function access modifiers (public/external/internal/private)
- Modifier usage and correctness

**Phase 2 — Vulnerability Detection (OWASP Smart Contract Top 10):**
- SWC-107: Reentrancy
- SWC-101: Integer Overflow/Underflow
- SWC-115: Authorization through tx.origin
- SWC-104: Unchecked Call Return Value
- SWC-106: Unprotected Selfdestruct
- SWC-110: Assert Violation
- SWC-112: Delegatecall to Untrusted Callee
- SWC-105: Unprotected Ether Withdrawal
- SWC-116: Block values as proxy for time
- SWC-100: Function Default Visibility

**Phase 3 — Gas Optimization:**
- Storage vs memory usage in loops
- Redundant SLOAD operations
- Packing struct/storage variables
- Using calldata for read-only external function params
- Unchecked blocks for safe arithmetic

**Phase 4 — Compliance & Best Practices:**
- ERC standard compliance (ERC-20, ERC-721, ERC-1155)
- OpenZeppelin pattern adherence
- Event emission for state changes
- NatSpec documentation coverage"""


class AuditAgent(BaseAgent):
    """AI-powered Solidity smart contract security auditor.

    Uses NVIDIA NIM (Llama-3.1-Nemotron) via OpenAI-compatible API.
    Audit methodology adapted from kritisi (github.com/zororaka00/kritisi).
    """

    def __init__(self, agent_id: int):
        super().__init__(agent_id=agent_id, agent_type="audit", name=f"AuditBot #{agent_id}")
        self.client = OpenAI(
            base_url=os.getenv("NVIDIA_BASE_URL", "https://integrate.api.nvidia.com/v1"),
            api_key=os.getenv("NVIDIA_API_KEY", ""),
        )
        self.model = os.getenv("NVIDIA_MODEL", "nvidia/llama-3.1-nemotron-nano-8b-v1")

    async def execute(self, task: dict) -> Dict[str, Any]:
        """Execute a security audit on the provided Solidity code.

        Args:
            task: Dict with at least a 'description' field containing Solidity code.
                  Optional 'title' field for context.

        Returns:
            Dict with 'output' (full report), 'summary' (one-liner), 'quality_estimate' (0-100).
        """
        solidity_code = task.get("description", "")
        title = task.get("title", "Smart contract audit")

        system_prompt = KRITISI_SECURITY_PROMPT + "\n\n" + ANALYSIS_PHASES_PROMPT

        messages = [
            {"role": "system", "content": system_prompt},
            {"role": "user", "content": f"Audit the following Solidity code:\n\n{solidity_code}"},
        ]

        # Call NVIDIA NIM via OpenAI-compatible API (synchronous — safe in asyncio with thread)
        completion = self.client.chat.completions.create(
            model=self.model,
            messages=messages,
            temperature=0.6,
            top_p=0.95,
            max_tokens=4096,
            frequency_penalty=0,
            presence_penalty=0,
            stream=False,
        )

        raw_output = completion.choices[0].message.content

        # Parse the structured JSON findings
        findings = self._parse_findings(raw_output)

        # Build a human-readable markdown report from the structured findings
        report = self._build_report(title, findings, raw_output)

        # Calculate quality estimate based on audit depth
        quality = self._estimate_quality(findings, raw_output)

        # Build summary
        counts = {sev: len(items) for sev, items in findings.items()}
        total = sum(counts.values())
        summary_parts = []
        for sev in ["critical", "high", "medium", "low"]:
            if counts.get(sev, 0) > 0:
                summary_parts.append(f"{counts[sev]} {sev}")
        finding_summary = ", ".join(summary_parts) if summary_parts else "No issues"
        summary = f"Security audit of '{title}' complete. Found {total} issues: {finding_summary}."

        return {
            "output": report,
            "summary": summary,
            "quality_estimate": quality,
        }

    def _parse_findings(self, raw: str) -> Dict[str, list]:
        """Extract JSON findings from the LLM response, handling markdown fences."""
        default = {"critical": [], "high": [], "medium": [], "low": []}

        # Strip markdown code fences if present
        cleaned = raw.strip()
        cleaned = re.sub(r"^```(?:json)?\s*", "", cleaned)
        cleaned = re.sub(r"\s*```$", "", cleaned)

        try:
            parsed = json.loads(cleaned)
            if isinstance(parsed, dict):
                for key in default:
                    if key in parsed and isinstance(parsed[key], list):
                        default[key] = parsed[key]
                return default
        except (json.JSONDecodeError, TypeError):
            pass

        # Fallback: try to find JSON object in the response
        json_match = re.search(r"\{[\s\S]*\}", raw)
        if json_match:
            try:
                parsed = json.loads(json_match.group())
                if isinstance(parsed, dict):
                    for key in default:
                        if key in parsed and isinstance(parsed[key], list):
                            default[key] = parsed[key]
                    return default
            except (json.JSONDecodeError, TypeError):
                pass

        return default

    def _build_report(self, title: str, findings: Dict[str, list], raw: str) -> str:
        """Build a structured markdown audit report from parsed findings."""
        lines = [
            f"# 🔍 Security Audit Report: {title}",
            "",
            "---",
            "",
        ]

        severity_icons = {
            "critical": "🔴 CRITICAL",
            "high": "🟠 HIGH",
            "medium": "🟡 MEDIUM",
            "low": "🔵 LOW",
        }

        total = sum(len(v) for v in findings.values())

        # Summary stats
        lines.append("## 📊 Summary")
        lines.append("")
        lines.append(f"| Severity | Count |")
        lines.append(f"|----------|-------|")
        for sev, icon in severity_icons.items():
            count = len(findings.get(sev, []))
            lines.append(f"| {icon} | {count} |")
        lines.append(f"| **Total** | **{total}** |")
        lines.append("")

        # Detailed findings per severity
        for sev, icon in severity_icons.items():
            items = findings.get(sev, [])
            if not items:
                continue

            lines.append(f"## {icon}")
            lines.append("")

            for i, item in enumerate(items, 1):
                issue = item.get("issue", "No description")
                suggestion = item.get("suggestion", "No suggestion provided")
                code = item.get("code_highlight", "")

                lines.append(f"### {i}. {issue}")
                lines.append("")
                lines.append(f"**Fix:** {suggestion}")
                lines.append("")
                if code:
                    lines.append("```solidity")
                    lines.append(code)
                    lines.append("```")
                    lines.append("")

        # If no structured findings were parsed, include raw output
        if total == 0 and raw.strip():
            lines.append("## 📝 Raw Analysis Output")
            lines.append("")
            lines.append(raw)
            lines.append("")

        lines.append("---")
        lines.append("*Audit performed by AuditBot (AgentHive) using Llama-3.1-Nemotron via NVIDIA NIM*")
        lines.append("*Methodology adapted from [kritisi](https://github.com/zororaka00/kritisi)*")

        return "\n".join(lines)

    def _estimate_quality(self, findings: Dict[str, list], raw: str) -> int:
        """Estimate output quality (0-100) based on audit depth and completeness."""
        quality = 60  # Base score

        total_findings = sum(len(v) for v in findings.values())

        # More findings → deeper analysis
        quality += min(total_findings * 3, 15)

        # Response length indicates thoroughness
        quality += min(len(raw) // 200, 10)

        # Bonus for finding critical/high issues (harder to detect)
        if findings.get("critical"):
            quality += 5
        if findings.get("high"):
            quality += 5

        # Bonus for code_highlight coverage (shows specific analysis)
        highlighted = sum(
            1 for sev in findings.values()
            for item in sev
            if item.get("code_highlight", "").strip()
        )
        quality += min(highlighted * 2, 10)

        return min(quality, 95)
