from typing import Dict, Type
from .base import BaseAgent
from .architect import ArchitectAgent
from .sde import SDEAgent
from .lawyer import LawyerAgent
from .auditor import AuditorAgent
from .accountant import AccountantAgent

BUILTIN_AGENTS: Dict[str, BaseAgent] = {
    "architect": ArchitectAgent(),
    "sde": SDEAgent(),
    "lawyer": LawyerAgent(),
    "auditor": AuditorAgent(),
    "accountant": AccountantAgent(),
}

def get_agent_for_role(role: str) -> BaseAgent:
    if role in BUILTIN_AGENTS:
        return BUILTIN_AGENTS[role]
    # Default to generic BaseAgent for dynamic/custom subagents
    return BaseAgent(
        role=role,
        name=role.capitalize(),
        system_prompt=f"You are a specialized agent for {role}."
    )
