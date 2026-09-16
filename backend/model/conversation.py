"""
Conversation Context Manager
Tracks multi-turn conversations and resolves pronouns/references.
"""

from typing import List, Dict, Any

class ConversationManager:
    def __init__(self):
        self._conversations: Dict[str, List[Dict[str, Any]]] = {}

    def get_history(self, session_id: str) -> List[Dict[str, Any]]:
        return self._conversations.get(session_id, [])

    def add_turn(self, session_id: str, role: str, content: str, tool_name: str = None):
        if session_id not in self._conversations:
            self._conversations[session_id] = []
        turn = {"role": role, "content": content}
        if tool_name:
            turn["tool_name"] = tool_name
        self._conversations[session_id].append(turn)
        # Keep last 20 turns
        if len(self._conversations[session_id]) > 20:
            self._conversations[session_id] = self._conversations[session_id][-20:]

    def clear(self, session_id: str):
        if session_id in self._conversations:
            del self._conversations[session_id]

conversation_manager = ConversationManager()
