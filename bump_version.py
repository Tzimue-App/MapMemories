#!/usr/bin/env python3
"""
bump_version.py — Automated version bumping for the Skite Android project.

Reads the bump type from CHANGELOG.md [Unreleased] section,
calculates the new SemVer version, updates build.gradle.kts and CHANGELOG.md,
then commits, tags, and pushes.

Usage:
    python bump_version.py            # Interactive mode (local dev)
    python bump_version.py --ci       # Non-interactive mode (GitHub Actions)
    python bump_version.py --dry-run  # Preview changes without writing
"""

import re
import subprocess
import sys
import datetime
import os
import argparse
import json

# Force UTF-8 encoding on standard streams to support emojis in Windows terminals
if hasattr(sys.stdout, 'reconfigure'):
    sys.stdout.reconfigure(encoding='utf-8')
if hasattr(sys.stderr, 'reconfigure'):
    sys.stderr.reconfigure(encoding='utf-8')

# ──────────────────────────────────────────────
# Configuration
# ──────────────────────────────────────────────

PACKAGE_JSON = "package.json"
CHANGELOG_FILE = "CHANGELOG.md"
PROJECT_NAME = "RememberMap"

VERSION_BLOCK_PATTERN = re.compile(
    r'## \[(v[\w\.\-]+)\] - (\d{4}-\d{2}-\d{2})\n\n(.*?)\n---',
    re.DOTALL
)

SECTION_HEADERS = ["Features", "Patches", "Bug Fixes", "Deployment & Configuration", "ChangeLog"]


BRANCH_SUFFIX_MAP = {
    "dev": "-a",
    "test": "-b",
}

DEFAULT_UNRELEASED_TEMPLATE = """## [Unreleased]

_Description: Écrire le résumé ici..._

<!--
BUMP_TYPE :
1 = Major (X.0.0)
2 = Minor (0.X.0)
3 = Patch (0.0.X)
-->
Bump: [Numéro]

### Features

### Patches

### Bug Fixes

### Deployment & Configuration

### ChangeLog

---
"""


# ──────────────────────────────────────────────
# Helpers
# ──────────────────────────────────────────────

def run_command(cmd, abort_on_error=True):
    """Runs a shell command and returns stdout. Aborts on error by default."""
    result = subprocess.run(cmd, shell=True, capture_output=True, text=True)
    if result.returncode != 0 and abort_on_error:
        print(f"❌ Command failed: {cmd}")
        print(result.stderr.strip())
        sys.exit(1)
    return result.stdout.strip()


def get_current_branch():
    """Returns the current Git branch name."""
    return run_command("git rev-parse --abbrev-ref HEAD")


def read_file(path):
    """Reads a file and returns its content."""
    with open(path, "r", encoding="utf-8") as f:
        return f.read()


def write_file(path, content):
    """Writes content to a file."""
    with open(path, "w", encoding="utf-8") as f:
        f.write(content)


# ──────────────────────────────────────────────
# Version reading
# ──────────────────────────────────────────────

def get_current_version():
    """Reads version from package.json."""
    try:
        content = read_file(PACKAGE_JSON)
        data = json.loads(content)
        version = data.get("version")
        if not version:
            print(f"❌ Could not find version in {PACKAGE_JSON}")
            sys.exit(1)
        # Ensure it has the 'v' prefix when returned to match calculation expectations
        if version.startswith('v'):
            return version
        return f"v{version}"
    except Exception as e:
        print(f"❌ Error reading {PACKAGE_JSON}: {e}")
        sys.exit(1)


# ──────────────────────────────────────────────
# Bump type extraction from CHANGELOG
# ──────────────────────────────────────────────

def get_bump_type_from_changelog():
    """Extracts the bump type (1-3) from the [Unreleased] section of CHANGELOG.md."""
    content = read_file(CHANGELOG_FILE)

    unreleased_match = re.search(
        r"## \[Unreleased\](.*?)(?=\n## |\n---\s*$|$)", content, re.DOTALL
    )
    if not unreleased_match:
        print("❌ Section [Unreleased] introuvable dans CHANGELOG.md")
        return None

    unreleased_content = unreleased_match.group(1)
    match = re.search(r"bump\s*:\s*\[?(\d)\]?", unreleased_content, re.IGNORECASE)
    if match:
        return int(match.group(1))

    return None


# ──────────────────────────────────────────────
# Version calculation
# ──────────────────────────────────────────────

def parse_base_version(version_str):
    """Extracts the numeric base (X.Y.Z) from a version string like v1.2.3-a."""
    match = re.search(r"v?(\d+)\.(\d+)\.(\d+)", version_str)
    if not match:
        print(f"❌ Format de version non reconnu: {version_str}")
        sys.exit(1)
    return [int(match.group(1)), int(match.group(2)), int(match.group(3))]


def calculate_new_version(current_version, bump_type, branch):
    """
    Calculates the new version based on SemVer, bump type, and branch.

    bump_type:
        1 = Major (X.0.0)
        2 = Minor (0.X.0)
        3 = Patch (0.0.X)

    Branch determines the suffix:
        dev  -> -a (alpha)
        test -> -b (beta)
    """
    parts = parse_base_version(current_version)

    if bump_type == 1:
        parts[0] += 1
        parts[1] = 0
        parts[2] = 0
    elif bump_type == 2:
        parts[1] += 1
        parts[2] = 0
    elif bump_type == 3:
        parts[2] += 1
    else:
        print(f"❌ Type de bump invalide: {bump_type}. Doit être 1, 2 ou 3.")
        sys.exit(1)

    new_base = f"{parts[0]}.{parts[1]}.{parts[2]}"
    suffix = BRANCH_SUFFIX_MAP.get(branch, "")

    return f"v{new_base}{suffix}"


def promote_version_to_beta(current_version):
    """
    Promotes an alpha version to beta (dev → test).
    v1.2.3-a becomes v1.2.3-b. No version number increment.
    """
    parts = parse_base_version(current_version)
    new_base = f"{parts[0]}.{parts[1]}.{parts[2]}"
    return f"v{new_base}-b"


# ──────────────────────────────────────────────
# File updates
# ──────────────────────────────────────────────

def get_stage_name(version):
    """Returns the human-readable stage name."""
    if "-a" in version:
        return "Alpha"
    if "-b" in version:
        return "Beta"
    return "Stable"


def get_status_alert(version):
    """Returns the Markdown alert for the release notes."""
    if "-a" in version:
        return "> [!WARNING]\n> **Statut : Alpha.** Version de développement destinée aux tests d'intégration internes."
    elif "-b" in version:
        return "> [!IMPORTANT]\n> **Statut : Beta.** Version de test stabilisée."
    else:
        return "> [!TIP]\n> **Statut : Stable.** Version prête pour la production."


def update_package_json(new_version):
    """Updates version in package.json."""
    content = read_file(PACKAGE_JSON)
    data = json.loads(content)
    
    # Strip the leading 'v' prefix for package.json (Standard SemVer)
    version_to_write = new_version
    if version_to_write.startswith('v'):
        version_to_write = version_to_write[1:]
        
    data["version"] = version_to_write
    write_file(PACKAGE_JSON, json.dumps(data, indent=2) + "\n")


def update_changelog(new_version):
    """
    Freezes the [Unreleased] section into a dated version block,
    and inserts a fresh [Unreleased] template.
    Returns the cleaned release notes for use in the GitHub release.
    """
    content = read_file(CHANGELOG_FILE)

    # Extract Unreleased section content
    unreleased_regex = r"## \[Unreleased\](.*?)(\n---)"
    match = re.search(unreleased_regex, content, re.DOTALL)
    if not match:
        print("❌ Section [Unreleased] non trouvée pour la mise à jour.")
        sys.exit(1)

    raw_notes = match.group(1).strip()

    # Clean: remove HTML comments, bump directive, description placeholder
    clean_notes = re.sub(r"<!--.*?-->", "", raw_notes, flags=re.DOTALL)
    clean_notes = re.sub(r"bump\s*:\s*\[?(\d|Numéro)\]?", "", clean_notes, flags=re.IGNORECASE)
    clean_notes = re.sub(r"_Description:.*?_", "", clean_notes).strip()

    # Remove empty sections (### Header with nothing below)
    clean_notes = re.sub(r"###\s+\w[^\n]*\n\s*(?=###|\Z)", "", clean_notes).strip()

    today = datetime.date.today().isoformat()
    stage = get_stage_name(new_version)
    status_alert = get_status_alert(new_version)

    # Build new version block
    version_block = f"## [{new_version}] - {today}\n\n"
    version_block += f"# {PROJECT_NAME} - {stage} {new_version}\n\n"
    version_block += f"{status_alert}\n\n"
    if clean_notes:
        version_block += f"{clean_notes}\n\n"
    version_block += "---"

    # Reconstruct: keep everything after the first ---
    after_unreleased = content[match.end():]

    new_changelog = "# Changelog\n\n"
    new_changelog += DEFAULT_UNRELEASED_TEMPLATE + "\n"
    new_changelog += version_block
    new_changelog += after_unreleased

    write_file(CHANGELOG_FILE, new_changelog)
    return clean_notes


def promote_changelog_version(old_version, new_version):
    """
    Sur 'test', on ne consomme pas [Unreleased] (déjà vidé par le bump dev).
    On relabellise le bloc déjà existant de la version alpha promue.
    """
    content = read_file(CHANGELOG_FILE)
    today = datetime.date.today().isoformat()

    escaped_old = re.escape(old_version)
    pattern = rf'## \[{escaped_old}\] - \d{{4}}-\d{{2}}-\d{{2}}'
    replacement = f"## [{new_version}] - {today}"

    new_content, count = re.subn(pattern, replacement, content, count=1)
    if count == 0:
        print(f"⚠️  Bloc CHANGELOG pour {old_version} introuvable — fallback.")
        return update_changelog(new_version)

    # Met aussi à jour le titre et l'alerte de statut (Alpha -> Beta)
    new_content = new_content.replace(
        f"# {PROJECT_NAME} - {get_stage_name(old_version)} {old_version}",
        f"# {PROJECT_NAME} - {get_stage_name(new_version)} {new_version}"
    )
    new_content = new_content.replace(
        get_status_alert(old_version),
        get_status_alert(new_version)
    )

    write_file(CHANGELOG_FILE, new_content)


def parse_sections(block_body):
    """Extrait {nom_section: [lignes]} depuis le corps d'un bloc de version."""
    sections = {}
    matches = re.findall(r'### (.+?)\n(.*?)(?=\n### |\Z)', block_body, re.DOTALL)
    for header, content in matches:
        header = header.strip()
        lines = [l.strip() for l in content.strip().split('\n') if l.strip()]
        if lines:
            sections.setdefault(header, []).extend(lines)
    return sections


def aggregate_changelog_for_beta(old_version, new_version):
    """
    Sur 'test' : agrège tous les blocs Alpha poussés depuis la dernière Beta,
    fusionne leurs sections (Features/Patches/Bug Fixes/...), et insère
    un nouveau bloc Beta synthétique en tête. Les blocs Alpha d'origine
    restent intacts en dessous (historique non détruit).
    """
    content = read_file(CHANGELOG_FILE)
    today = datetime.date.today().isoformat()

    blocks = list(VERSION_BLOCK_PATTERN.finditer(content))
    if not blocks:
        print("⚠️  Aucun bloc de version trouvé — fallback.")
        return promote_changelog_version(old_version, new_version)

    # Collecte les blocs Alpha les plus récents, jusqu'à la dernière Beta rencontrée
    consumed_blocks = []
    for b in blocks:
        if b.group(1).endswith("-b"):
            break
        consumed_blocks.append(b)

    if not consumed_blocks:
        print("⚠️  Pas de nouvelle Alpha à agréger depuis la dernière Beta — fallback.")
        return promote_changelog_version(old_version, new_version)

    # Fusionne les sections, du plus ancien au plus récent (ordre chronologique)
    merged_sections = {}
    for b in reversed(consumed_blocks):
        for header, lines in parse_sections(b.group(3)).items():
            merged_sections.setdefault(header, [])
            for line in lines:
                if line not in merged_sections[header]:
                    merged_sections[header].append(line)

    stage = get_stage_name(new_version)
    status_alert = get_status_alert(new_version)

    body_parts = []
    for header in SECTION_HEADERS:
        if merged_sections.get(header):
            body_parts.append(f"### {header}")
            body_parts.extend(merged_sections[header])
            body_parts.append("")
    notes_body = "\n".join(body_parts).strip()

    version_block = f"## [{new_version}] - {today}\n\n"
    version_block += f"# {PROJECT_NAME} - {stage} {new_version}\n\n"
    version_block += f"{status_alert}\n\n"
    if notes_body:
        version_block += f"{notes_body}\n\n"
    version_block += "---"

    insert_at = consumed_blocks[0].start()
    new_content = content[:insert_at] + version_block + "\n\n" + content[insert_at:]
    write_file(CHANGELOG_FILE, new_content)
    return notes_body


# ──────────────────────────────────────────────
# Git operations
# ──────────────────────────────────────────────

def git_commit_and_tag(new_version):
    """Stages changed files, commits with [bump_version], creates an annotated tag."""
    run_command(f"git add {PACKAGE_JSON} {CHANGELOG_FILE}")
    run_command(f'git commit -m "chore(release): {new_version} [bump_version]"')
    run_command(f'git tag -a {new_version} -m "Release {new_version}"')


def git_push(branch, tag):
    """Pushes the branch and the tag to origin."""
    run_command(f"git push origin {branch}")
    run_command(f"git push origin {tag}")


def back_merge_to_dev():
    """Back-merges the current test branch into dev to avoid conflicts."""
    print("🔄 Back-merge test → dev...")
    run_command("git checkout dev")
    run_command('git merge test -m "chore: back-merge test into dev [bump_version]"')
    run_command("git push origin dev")
    run_command("git checkout test")


# ──────────────────────────────────────────────
# Main
# ──────────────────────────────────────────────

def main():
    parser = argparse.ArgumentParser(description="Bump version for RememberMap web project")
    parser.add_argument("--ci", action="store_true", help="Run in CI mode (non-interactive)")
    parser.add_argument("--dry-run", action="store_true", help="Preview changes without modifying files")
    args = parser.parse_args()

    print(f"🚀 {PROJECT_NAME} — Bump Version Script")
    print("=" * 40)

    # 1. Detect branch
    branch = get_current_branch()
    if branch not in ("dev", "test"):
        if args.dry_run:
            print(f"⚠️  Branche actuelle '{branch}' non supportée pour le déploiement. Simulation sur la branche 'dev'.")
            branch = "dev"
        else:
            print(f"❌ Ce script ne peut être exécuté que sur 'dev' ou 'test'. Branche actuelle: {branch}")
            sys.exit(1)
    print(f"📌 Branche: {branch}")

    # 2. Read current version
    current_version = get_current_version()
    print(f"📦 Version actuelle: {current_version}")

    # 3. Determine new version
    if branch == "test":
        # On test: promote alpha → beta (no version number bump)
        new_version = promote_version_to_beta(current_version)
        print(f"🔄 Promotion Alpha → Beta")
    else:
        # On dev: read bump type from CHANGELOG
        bump_type = get_bump_type_from_changelog()
        if not bump_type:
            print("❌ 'Bump: [Numéro]' valide non trouvé dans la section [Unreleased] du CHANGELOG.md")
            print("   Assurez-vous d'avoir 'Bump: 2' (par exemple) dans la section [Unreleased].")
            sys.exit(1)

        if bump_type not in (1, 2, 3):
            print(f"❌ Type de bump invalide: {bump_type}. Doit être 1, 2 ou 3.")
            sys.exit(1)

        bump_labels = {1: "Major", 2: "Minor", 3: "Patch"}
        print(f"📋 Type de bump: {bump_type} ({bump_labels[bump_type]})")

        new_version = calculate_new_version(current_version, bump_type, branch)

    print(f"🆕 Nouvelle version: {new_version}")

    # 4. Dry-run check
    if args.dry_run:
        print("\n🔍 Mode dry-run — Aucune modification appliquée.")
        return

    # 5. Confirm (interactive mode only)
    if not args.ci:
        confirm = input(f"\n Appliquer {current_version} → {new_version} ? (y/N): ").strip().lower()
        if confirm != "y":
            print("❌ Annulé par l'utilisateur.")
            sys.exit(0)

    # 6. Update files
    print("\n📝 Mise à jour des fichiers...")
    update_package_json(new_version)
    print(f"   ✅ {PACKAGE_JSON}")
    if branch == "test":
        aggregate_changelog_for_beta(current_version, new_version)
    else:
        update_changelog(new_version)
    print(f"   ✅ {CHANGELOG_FILE}")

    # 7. Git commit & tag
    print("\n🏷️  Commit et tag...")
    git_commit_and_tag(new_version)
    print(f"   ✅ Tag {new_version} créé")

    # 8. Push
    print("\n📤 Push vers origin...")
    git_push(branch, new_version)
    print(f"   ✅ Poussé sur {branch}")

    # 9. Back-merge if on test
    if branch == "test":
        back_merge_to_dev()
        print("   ✅ Back-merge test → dev terminé")

    print(f"\n✅ Opération terminée : {new_version}")


if __name__ == "__main__":
    main()