ALARM_THRESHOLD = 1.0
DEFAULT_CRITICAL_THRESHOLD = 1.5


def classify(ch4_pct: float, critical_pct: float = DEFAULT_CRITICAL_THRESHOLD) -> tuple[str, str]:
    # 高于报警线但未达危急线仍是报警；达到危急线为危急
    if ch4_pct >= critical_pct:
        return "危急", f"甲烷达到危急线（{critical_pct:g}%）"
    if ch4_pct >= ALARM_THRESHOLD:
        return "报警", "甲烷达到报警线"
    return "正常", "甲烷低于报警线"
