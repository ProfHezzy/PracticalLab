from __future__ import annotations

import re
from typing import Any
from urllib.parse import urlsplit

SCHEMA_VERSION = "1.1"
RUNTIME_VERSION = "1.0.0"
APPARATUS_TYPES = {
    "beaker",
    "funnel",
    "filter-paper",
    "receiving-flask",
    "mixture",
    "heat-source",
}


def validate_experiment_definition(value: Any) -> list[str]:
    """Validate the runtime contract at the trust boundary without third-party code."""
    if not isinstance(value, dict):
        return ["Definition must be a JSON object."]

    errors: list[str] = []
    required = {
        "schemaVersion",
        "runtimeVersion",
        "id",
        "title",
        "subject",
        "version",
        "apparatus",
        "steps",
        "rules",
        "outcomes",
        "scoring",
        "safeFailure",
        "narration",
        "captions",
        "assets",
    }
    if set(value) != required:
        errors.append("Definition fields do not match the supported schema.")
    if value.get("schemaVersion") != SCHEMA_VERSION:
        errors.append("Unsupported experiment schema version.")
    if value.get("runtimeVersion") != RUNTIME_VERSION:
        errors.append("Unsupported experiment runtime version.")
    if not isinstance(value.get("id"), str) or not re.fullmatch(
        r"[a-z0-9][a-z0-9-]{1,79}", value.get("id", "")
    ):
        errors.append("Invalid experiment id.")
    for field, maximum in (("title", 200), ("subject", 80)):
        if (
            not isinstance(value.get(field), str)
            or not value[field].strip()
            or len(value[field]) > maximum
        ):
            errors.append(f"Invalid {field}.")
    if type(value.get("version")) is not int or value["version"] < 1:
        errors.append("Version must be a positive integer.")

    apparatus = value.get("apparatus")
    if not isinstance(apparatus, list) or not 1 <= len(apparatus) <= 32:
        errors.append("Add between 1 and 32 apparatus items.")
        apparatus = []
    apparatus_ids: set[str] = set()
    apparatus_kinds: set[str] = set()
    for item in apparatus:
        if not isinstance(item, dict) or set(item) != {"id", "type", "label"}:
            errors.append("Each apparatus item needs exactly an id, type and label.")
            continue
        if not isinstance(item["id"], str) or not re.fullmatch(r"[a-z][a-z0-9-]{0,63}", item["id"]):
            errors.append("Invalid apparatus id.")
        elif item["id"] in apparatus_ids:
            errors.append("Apparatus ids must be unique.")
        else:
            apparatus_ids.add(item["id"])
        if not isinstance(item["type"], str) or item["type"] not in APPARATUS_TYPES:
            errors.append("Unsupported apparatus type.")
        else:
            apparatus_kinds.add(item["type"])
        if (
            not isinstance(item["label"], str)
            or not item["label"].strip()
            or len(item["label"]) > 80
        ):
            errors.append("Apparatus labels must contain 1 to 80 characters.")

    outcomes = value.get("outcomes")
    if not isinstance(outcomes, list) or not 1 <= len(outcomes) <= 20:
        errors.append("Add between 1 and 20 outcomes.")
        outcomes = []
    outcome_ids: set[str] = set()
    for outcome in outcomes:
        if not isinstance(outcome, dict) or set(outcome) != {"id", "title", "description"}:
            errors.append("Each outcome needs an id, title and description.")
            continue
        if not isinstance(outcome["id"], str) or not outcome["id"] or outcome["id"] in outcome_ids:
            errors.append("Outcome ids must be unique and non-empty.")
        else:
            outcome_ids.add(outcome["id"])
        if any(
            not isinstance(outcome[key], str) or not outcome[key].strip()
            for key in ("title", "description")
        ):
            errors.append("Outcome titles and descriptions are required.")

    rules = value.get("rules")
    if not isinstance(rules, list) or not 1 <= len(rules) <= 80:
        errors.append("Add between 1 and 80 rules.")
        rules = []
    rule_ids: set[str] = set()
    for rule in rules:
        if (
            not isinstance(rule, dict)
            or set(rule) - {"id", "action", "outcomeId", "feedback"}
            or not {"id", "action", "feedback"} <= set(rule)
        ):
            errors.append("Each rule needs an id, supported action and feedback.")
            continue
        if not isinstance(rule["id"], str) or not rule["id"] or rule["id"] in rule_ids:
            errors.append("Rule ids must be unique and non-empty.")
        else:
            rule_ids.add(rule["id"])
        if not isinstance(rule["feedback"], str) or not rule["feedback"].strip():
            errors.append("Rule feedback is required.")
        action = rule["action"]
        if not _valid_action(action):
            errors.append("Rule action is malformed or unsupported.")
        elif action["type"] == "fit" and not {"filter-paper", "funnel"} <= apparatus_kinds:
            errors.append("Fit rules must reference apparatus in the experiment.")
        elif action["type"] == "place" and action["apparatus"] not in apparatus_kinds:
            errors.append("Place rules must reference apparatus in the experiment.")
        if "outcomeId" in rule and (
            not isinstance(rule["outcomeId"], str) or rule["outcomeId"] not in outcome_ids
        ):
            errors.append("Rules must reference an existing outcome.")

    narration = _validate_cues(value.get("narration"), "narration", errors)
    captions = _validate_cues(value.get("captions"), "captions", errors)
    if not captions:
        errors.append("Captions are required for every experiment narration.")
    if captions - narration:
        errors.append("Caption cue ids must match narration cue ids.")

    steps = value.get("steps")
    if not isinstance(steps, list) or not 1 <= len(steps) <= 40:
        errors.append("Add between 1 and 40 steps.")
        steps = []
    step_ids: set[str] = set()
    for step in steps:
        if not isinstance(step, dict) or set(step) != {
            "id",
            "instruction",
            "ruleId",
            "narrationCueId",
        }:
            errors.append("Each step needs an id, instruction, rule and narration cue.")
            continue
        if (
            not isinstance(step["id"], str)
            or not re.fullmatch(r"[a-z][a-z0-9-]{0,63}", step["id"])
            or step["id"] in step_ids
        ):
            errors.append("Step ids must be unique lowercase identifiers.")
        else:
            step_ids.add(step["id"])
        if (
            not isinstance(step["instruction"], str)
            or not step["instruction"].strip()
            or len(step["instruction"]) > 240
        ):
            errors.append("Step instructions must contain 1 to 240 characters.")
        if not isinstance(step["ruleId"], str) or step["ruleId"] not in rule_ids:
            errors.append("Steps must reference an existing rule.")
        if not isinstance(step["narrationCueId"], str) or step["narrationCueId"] not in narration:
            errors.append("Steps must reference an existing narration cue.")

    scoring = value.get("scoring")
    if (
        not isinstance(scoring, dict)
        or set(scoring) != {"maxScore", "hooks"}
        or type(scoring.get("maxScore")) is not int
        or not 0 <= scoring["maxScore"] <= 1000
        or not isinstance(scoring.get("hooks"), list)
    ):
        errors.append("Scoring configuration is invalid.")
    else:
        points = 0
        for hook in scoring["hooks"]:
            if (
                not isinstance(hook, dict)
                or set(hook) != {"id", "event", "points"}
                or hook.get("event") != "correct_step"
                or type(hook.get("points")) is not int
                or not 0 <= hook["points"] <= 1000
            ):
                errors.append("Scoring hooks are invalid.")
                break
            points = max(points, hook["points"])
        if points * len(steps) > scoring["maxScore"]:
            errors.append("Maximum score is lower than the possible step score.")

    safe_failure = value.get("safeFailure")
    if (
        not isinstance(safe_failure, dict)
        or set(safe_failure) != {"message", "guidance"}
        or any(
            not isinstance(safe_failure.get(key), str) or not safe_failure[key].strip()
            for key in ("message", "guidance")
        )
    ):
        errors.append("Safe-failure feedback and guidance are required.")

    assets = value.get("assets")
    if not isinstance(assets, list) or len(assets) > 32:
        errors.append("Assets must be a list with at most 32 entries.")
    else:
        total_size = 0
        asset_ids: set[str] = set()
        for asset in assets:
            if (
                not isinstance(asset, dict)
                or set(asset) != {"id", "kind", "url", "altText", "sizeBytes"}
                or not isinstance(asset.get("kind"), str)
                or asset.get("kind") not in {"image", "audio", "video"}
            ):
                errors.append("Asset metadata is invalid.")
                continue
            if not isinstance(asset["id"], str) or not asset["id"] or asset["id"] in asset_ids:
                errors.append("Asset ids must be unique and non-empty.")
            else:
                asset_ids.add(asset["id"])
            if not isinstance(asset["url"], str) or not _safe_asset_url(asset["url"]):
                errors.append("Asset URL must be HTTPS or a same-origin relative URL.")
            if not isinstance(asset["altText"], str) or len(asset["altText"]) > 300:
                errors.append("Asset alt text is invalid.")
            if type(asset["sizeBytes"]) is not int or not 0 <= asset["sizeBytes"] <= 1_572_864:
                errors.append("Asset exceeds the 1.5 MB experiment budget.")
            else:
                total_size += asset["sizeBytes"]
        if total_size > 1_572_864:
            errors.append("Combined assets exceed the 1.5 MB experiment budget.")

    return list(dict.fromkeys(errors))


def _valid_action(action: Any) -> bool:
    if not isinstance(action, dict):
        return False
    if action.get("type") == "fit":
        return (
            set(action) == {"type", "apparatus", "target"}
            and action.get("apparatus") == "filter-paper"
            and action.get("target") == "funnel"
        )
    if action.get("type") == "place":
        return (
            set(action) == {"type", "apparatus", "slot"}
            and isinstance(action.get("apparatus"), str)
            and action["apparatus"] in APPARATUS_TYPES
            and isinstance(action.get("slot"), str)
            and bool(action["slot"])
        )
    if action.get("type") == "pour":
        return (
            set(action) == {"type", "from", "to"}
            and isinstance(action.get("from"), str)
            and bool(action["from"])
            and isinstance(action.get("to"), str)
            and bool(action["to"])
        )
    return False


def _validate_cues(value: Any, name: str, errors: list[str]) -> set[str]:
    if not isinstance(value, list) or not 1 <= len(value) <= 80:
        errors.append(f"Add between 1 and 80 {name} cues.")
        return set()
    ids: set[str] = set()
    for cue in value:
        if not isinstance(cue, dict) or set(cue) != {"id", "text", "startMs", "endMs"}:
            errors.append(f"Each {name} cue needs an id, text and time range.")
            continue
        if not isinstance(cue["id"], str) or not cue["id"] or cue["id"] in ids:
            errors.append(f"{name.capitalize()} cue ids must be unique and non-empty.")
        else:
            ids.add(cue["id"])
        if (
            not isinstance(cue["text"], str)
            or not cue["text"].strip()
            or type(cue["startMs"]) is not int
            or type(cue["endMs"]) is not int
            or cue["startMs"] < 0
            or cue["endMs"] <= cue["startMs"]
        ):
            errors.append(f"Each {name} cue needs text and a valid time range.")
    return ids


def _safe_asset_url(value: str) -> bool:
    parsed = urlsplit(value)
    if parsed.scheme == "https":
        return bool(parsed.netloc) and not parsed.username and not parsed.password
    return (
        not parsed.scheme
        and not parsed.netloc
        and value.startswith("/")
        and not value.startswith("//")
    )
