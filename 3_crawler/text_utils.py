"""Text processing utilities"""

import re
import unicodedata
from config import TITLE_KEYWORDS


def normalize_text(s: str) -> str:
    """Lowercase, remove diacritics, remove punctuation (keeps letters/numbers/space)."""
    if not s:
        return ""
    s = s.strip().lower()
    # remove leading numbering like "1. " or "1) "
    s = re.sub(r"^\d+\s*[\.\)]\s*", "", s)
    # normalize unicode and remove combining marks (diacritics)
    s = unicodedata.normalize("NFD", s)
    s = "".join(ch for ch in s if not unicodedata.combining(ch))
    # keep letters and numbers and spaces
    s = re.sub(r"[^a-z0-9\s]", " ", s)
    s = re.sub(r"\s+", " ", s).strip()
    return s


# Pre-normalize keyword lists
NORMALIZED_KEYWORDS = {
    header: [normalize_text(k) for k in keywords]
    for header, keywords in TITLE_KEYWORDS.items()
}
