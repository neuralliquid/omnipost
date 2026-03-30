#!/usr/bin/env bash
# Validate marketing skills against the Agent Skills Specification
# Checks SKILL.md frontmatter, naming, descriptions, and structure
# Exit code 0 = all valid, 1 = errors found

set -euo pipefail

SKILLS_DIR="$(dirname "$0")/skills"
ERRORS=0
WARNINGS=0

# Colors
RED='\033[0;31m'
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
NC='\033[0m'

echo "Validating marketing skills in ${SKILLS_DIR}..."
echo ""

# Check skills directory exists
if [ ! -d "$SKILLS_DIR" ]; then
  echo -e "${RED}Error: Skills directory not found at ${SKILLS_DIR}${NC}"
  exit 1
fi

# Count skills
SKILL_COUNT=0

for skill_dir in "$SKILLS_DIR"/*/; do
  [ -d "$skill_dir" ] || continue
  SKILL_COUNT=$((SKILL_COUNT + 1))
  dir_name=$(basename "$skill_dir")
  skill_file="${skill_dir}SKILL.md"

  # Check SKILL.md exists
  if [ ! -f "$skill_file" ]; then
    echo -e "${RED}  [FAIL] ${dir_name}: SKILL.md not found${NC}"
    ERRORS=$((ERRORS + 1))
    continue
  fi

  # Check name format: lowercase alphanumeric with hyphens, 1-64 chars
  if ! echo "$dir_name" | grep -qE '^[a-z][a-z0-9-]{0,62}[a-z0-9]$'; then
    echo -e "${RED}  [FAIL] ${dir_name}: Invalid directory name format${NC}"
    ERRORS=$((ERRORS + 1))
  fi

  # Check for consecutive hyphens
  if echo "$dir_name" | grep -q '\-\-'; then
    echo -e "${RED}  [FAIL] ${dir_name}: Contains consecutive hyphens${NC}"
    ERRORS=$((ERRORS + 1))
  fi

  # Check YAML frontmatter exists
  if ! head -1 "$skill_file" | grep -q '^---$'; then
    echo -e "${RED}  [FAIL] ${dir_name}: Missing YAML frontmatter${NC}"
    ERRORS=$((ERRORS + 1))
    continue
  fi

  # Extract frontmatter
  frontmatter=$(sed -n '/^---$/,/^---$/p' "$skill_file" | sed '1d;$d')

  # Check name field exists and matches directory
  fm_name=$(echo "$frontmatter" | grep '^name:' | sed 's/^name: *//' | tr -d '"' | tr -d "'")
  if [ -z "$fm_name" ]; then
    echo -e "${RED}  [FAIL] ${dir_name}: Missing 'name' in frontmatter${NC}"
    ERRORS=$((ERRORS + 1))
  elif [ "$fm_name" != "$dir_name" ]; then
    echo -e "${RED}  [FAIL] ${dir_name}: Frontmatter name '${fm_name}' does not match directory${NC}"
    ERRORS=$((ERRORS + 1))
  fi

  # Check description field exists (handles both inline and multiline YAML)
  fm_desc=$(echo "$frontmatter" | grep '^description:' | sed 's/^description: *//')
  # For multiline descriptions (using > or |), grab the full block
  if [ -z "$fm_desc" ] || [ "$fm_desc" = ">" ] || [ "$fm_desc" = "|" ]; then
    fm_desc_full=$(echo "$frontmatter" | sed -n '/^description:/,/^[a-z]/p' | tail -n +2 | head -5)
    if [ -n "$fm_desc_full" ]; then
      fm_desc="$fm_desc_full"
    fi
  fi
  if [ -z "$fm_desc" ]; then
    echo -e "${RED}  [FAIL] ${dir_name}: Missing 'description' in frontmatter${NC}"
    ERRORS=$((ERRORS + 1))
  else
    # Check description length (rough check)
    desc_len=${#fm_desc}
    if [ "$desc_len" -gt 1024 ]; then
      echo -e "${RED}  [FAIL] ${dir_name}: Description exceeds 1024 characters${NC}"
      ERRORS=$((ERRORS + 1))
    fi

    # Warn if no trigger phrases (case-insensitive, checks full description block)
    if ! echo "$fm_desc" | grep -qiE '(when|use|help|mention|improve|optimize|create|analyze|design|plan|set up|conduct|write)'; then
      echo -e "${YELLOW}  [WARN] ${dir_name}: Description lacks trigger phrases${NC}"
      WARNINGS=$((WARNINGS + 1))
    fi
  fi

  # Check file length
  line_count=$(wc -l < "$skill_file")
  if [ "$line_count" -gt 500 ]; then
    echo -e "${YELLOW}  [WARN] ${dir_name}: SKILL.md exceeds 500 lines (${line_count} lines)${NC}"
    WARNINGS=$((WARNINGS + 1))
  fi

  echo -e "${GREEN}  [PASS] ${dir_name}${NC}"
done

echo ""
echo "==============================="
echo "Skills validated: ${SKILL_COUNT}"
echo -e "Passed: ${GREEN}$((SKILL_COUNT - ERRORS))${NC}"
echo -e "Errors: ${RED}${ERRORS}${NC}"
echo -e "Warnings: ${YELLOW}${WARNINGS}${NC}"
echo "==============================="

if [ "$ERRORS" -gt 0 ]; then
  echo -e "${RED}Validation failed with ${ERRORS} error(s)${NC}"
  exit 1
fi

echo -e "${GREEN}All skills validated successfully${NC}"
exit 0
