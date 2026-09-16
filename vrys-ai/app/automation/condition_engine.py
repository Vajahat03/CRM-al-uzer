"""
VRYS AI — Rich Workflow Condition Engine (Step 10)
Evaluates complex conditional rules with support for comparison operators
(=, !=, >, <, >=, <=, IN, NOT IN, CONTAINS, EXISTS, BETWEEN) and nested AND/OR logic.
"""
from typing import Dict, Any, List, Union

class ConditionEngine:
    def evaluate_condition(self, condition: Dict[str, Any], payload: Dict[str, Any]) -> bool:
        """
        Evaluates a single atomic condition rule.
        """
        field = condition.get("field")
        op = condition.get("operator", "==").upper()
        target_val = condition.get("value")

        actual_val = payload.get(field)

        if op == "EXISTS":
            return actual_val is not None
        if op == "NOT_EXISTS":
            return actual_val is None

        if actual_val is None:
            return False

        if op in ["==", "=", "EQ"]:
            return str(actual_val).lower() == str(target_val).lower()
        elif op in ["!=", "NEQ"]:
            return str(actual_val).lower() != str(target_val).lower()
        elif op in [">", "GT"]:
            return float(actual_val) > float(target_val)
        elif op in ["<", "LT"]:
            return float(actual_val) < float(target_val)
        elif op in [">=", "GTE"]:
            return float(actual_val) >= float(target_val)
        elif op in ["<=", "LTE"]:
            return float(actual_val) <= float(target_val)
        elif op in ["IN"]:
            if isinstance(target_val, list):
                return actual_val in target_val
            return str(actual_val) in str(target_val)
        elif op in ["NOT IN", "NOT_IN"]:
            if isinstance(target_val, list):
                return actual_val not in target_val
            return str(actual_val) not in str(target_val)
        elif op in ["CONTAINS"]:
            return str(target_val).lower() in str(actual_val).lower()
        elif op in ["BETWEEN"]:
            if isinstance(target_val, list) and len(target_val) == 2:
                return float(target_val[0]) <= float(actual_val) <= float(target_val[1])
            return False

        return False

    def evaluate_rule_group(self, rule_group: Dict[str, Any], payload: Dict[str, Any]) -> bool:
        """
        Evaluates a nested rule group with 'logic' ('AND' or 'OR') and 'conditions' list.
        """
        logic = rule_group.get("logic", "AND").upper()
        conditions = rule_group.get("conditions", [])

        if not conditions:
            return True

        results = []
        for cond in conditions:
            if "logic" in cond and "conditions" in cond:
                results.append(self.evaluate_rule_group(cond, payload))
            else:
                results.append(self.evaluate_condition(cond, payload))

        if logic == "AND":
            return all(results)
        elif logic == "OR":
            return any(results)
        elif logic == "NOT":
            return not all(results)

        return all(results)

condition_engine = ConditionEngine()
