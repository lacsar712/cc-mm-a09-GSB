ALARM_LINE = 1.0
DEFAULT_CRITICAL_LINE = 1.5


def classify(ch4_pct: float, critical_line: float = DEFAULT_CRITICAL_LINE) -> tuple[str, str]:
    if ch4_pct >= critical_line:
        return "危急", "甲烷达到危急线"
    if ch4_pct >= ALARM_LINE:
        return "报警", "甲烷达到报警线"
    return "正常", "甲烷低于报警线"
