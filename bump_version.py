#!/usr/bin/env python3
"""
bump_version.py — Automated version bumping for RememberMap monorepo project.

Reads component bump types (Backend Bump / Frontend Bump) from CHANGELOG.md [Unreleased] section,
calculates SemVer for Backend, Frontend, and Root (using the largest bump),
updates root package.json, frontend/package.json, backend/pom.xml, and CHANGELOG.md,
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
FRONTEND_PACKAGE_JSON = os.path.join("frontend", "package.json")
BACKEND_POM = os.path.join("backend", "pom.xml")
CHANGELOG_FILE = "CHANGELOG.md"
PROJECT_NAME = "RememberMap"

VERSION_BLOCK_PATTERN = re.compile(
    r'## \[(v[\w\.\-]+)\] - (\d{4}-\d{2}-\d{2})\n\n(.*?)\n---',
    re.DOTALL
)

SECTION_HEADERS = [
    "Backend",
    "Frontend",
    "Deployment & Configuration",
    "ChangeLog"
]

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
none = Pas de bump
-->
Backend Bump: none
Frontend Bump: none

### Backend
#### Features

#### Patches

#### Bug Fixes


### Frontend
#### Features

#### Patches

#### Bug Fixes


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

def get_root_version():
    """Reads main version from root package.json."""
    try:
        content = read_file(PACKAGE_JSON)
        data = json.loads(content)
        version = data.get("version")
        if not version:
            print(f"❌ Could not find version in {PACKAGE_JSON}")
            sys.exit(1)
        return version if version.startswith('v') else f"v{version}"
    except Exception as e:
        print(f"❌ Error reading {PACKAGE_JSON}: {e}")
        sys.exit(1)


def get_frontend_version():
    """Reads version from frontend/package.json."""
    if not os.path.exists(FRONTEND_PACKAGE_JSON):
        return get_root_version()
    try:
        content = read_file(FRONTEND_PACKAGE_JSON)
        data = json.loads(content)
        version = data.get("version", "0.0.1")
        return version if version.startswith('v') else f"v{version}"
    except Exception as e:
        print(f"⚠️ Error reading {FRONTEND_PACKAGE_JSON}: {e}")
        return get_root_version()


def get_backend_version():
    """Reads version from backend/pom.xml."""
    if not os.path.exists(BACKEND_POM):
        return get_root_version()
    try:
        content = read_file(BACKEND_POM)
        match = re.search(r'<artifactId>remembermap-backend</artifactId>\s*<version>([^<]+)</version>', content)
        if not match:
            match = re.search(r'<version>([^<]+)</version>', content)
        if not match:
            return get_root_version()
        ver = match.group(1).replace("-SNAPSHOT", "")
        return ver if ver.startswith('v') else f"v{ver}"
    except Exception as e:
        print(f"⚠️ Error reading {BACKEND_POM}: {e}")
        return get_root_version()


# ──────────────────────────────────────────────
# Bump type extraction from CHANGELOG
# ──────────────────────────────────────────────

def parse_bump_val(val_str):
    """Parses a bump string value into 1, 2, 3 or None."""
    if not val_str:
        return None
    val_str = val_str.strip().lower()
    if val_str in ("1", "major"):
        return 1
    if val_str in ("2", "minor"):
        return 2
    if val_str in ("3", "patch"):
        return 3
    if val_str in ("none", "null", "0", "pas de bump", "numéro", "numéro"):
        return None
    try:
        val_int = int(val_str)
        if val_int in (1, 2, 3):
            return val_int
    except ValueError:
        pass
    return None


def get_bump_types_from_changelog():
    """
    Extracts (backend_bump, frontend_bump) from the [Unreleased] section of CHANGELOG.md.
    Values are 1 (Major), 2 (Minor), 3 (Patch), or None.
    """
    content = read_file(CHANGELOG_FILE)

    unreleased_match = re.search(
        r"## \[Unreleased\](.*?)(?=\n## |\n---\s*$|$)", content, re.DOTALL
    )
    if not unreleased_match:
        print("❌ Section [Unreleased] introuvable dans CHANGELOG.md")
        return None, None

    unreleased_content = unreleased_match.group(1)

    backend_match = re.search(r"Backend\s*Bump\s*:\s*\[?([0-9a-zA-Z_\-]+)\]?", unreleased_content, re.IGNORECASE)
    frontend_match = re.search(r"Frontend\s*Bump\s*:\s*\[?([0-9a-zA-Z_\-]+)\]?", unreleased_content, re.IGNORECASE)
    legacy_match = re.search(r"^Bump\s*:\s*\[?([0-9a-zA-Z_\-]+)\]?", unreleased_content, re.MULTILINE | re.IGNORECASE)

    backend_bump = parse_bump_val(backend_match.group(1)) if backend_match else None
    frontend_bump = parse_bump_val(frontend_match.group(1)) if frontend_match else None

    # Fallback to single Bump line if component bumps are omitted
    if backend_bump is None and frontend_bump is None and legacy_match:
        legacy_val = parse_bump_val(legacy_match.group(1))
        backend_bump = legacy_val
        frontend_bump = legacy_val

    return backend_bump, frontend_bump


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
    """
    if bump_type is None:
        return current_version

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


def update_package_json(target_path, new_version):
    """Updates version in a target package.json file."""
    if not os.path.exists(target_path):
        return
    content = read_file(target_path)
    data = json.loads(content)

    version_to_write = new_version[1:] if new_version.startswith('v') else new_version
    data["version"] = version_to_write
    write_file(target_path, json.dumps(data, indent=2) + "\n")


def update_backend_pom(new_version):
    """Updates version in backend/pom.xml."""
    if not os.path.exists(BACKEND_POM):
        return
    content = read_file(BACKEND_POM)
    version_to_write = new_version[1:] if new_version.startswith('v') else new_version

    pattern = r'(<artifactId>remembermap-backend</artifactId>\s*<version>)[^<]+(</version>)'
    if re.search(pattern, content):
        new_content = re.sub(pattern, rf'\g<1>{version_to_write}\g<2>', content)
    else:
        new_content = re.sub(r'(<version>)[^<]+(</version>)', rf'\g<1>{version_to_write}\g<2>', content, count=1)

    write_file(BACKEND_POM, new_content)


def update_changelog(new_version):
    """
    Freezes the [Unreleased] section into a dated version block,
    and inserts a fresh [Unreleased] template.
    """
    content = read_file(CHANGELOG_FILE)

    unreleased_regex = r"## \[Unreleased\](.*?)(\n---)"
    match = re.search(unreleased_regex, content, re.DOTALL)
    if not match:
        print("❌ Section [Unreleased] non trouvée pour la mise à jour.")
        sys.exit(1)

    raw_notes = match.group(1).strip()

    # Clean: remove HTML comments, bump directives, description placeholders
    clean_notes = re.sub(r"<!--.*?-->", "", raw_notes, flags=re.DOTALL)
    clean_notes = re.sub(r"(Backend|Frontend)?\s*Bump\s*:\s*\[?[0-9a-zA-Z_\-]+\]?", "", clean_notes, flags=re.IGNORECASE)
    clean_notes = re.sub(r"_Description:.*?_", "", clean_notes).strip()

    # Remove empty subheadings/headers with nothing below them
    clean_notes = re.sub(r"#{3,4}\s+[^\n]+\n\s*(?=#{3,4}|\Z)", "", clean_notes).strip()

    today = datetime.date.today().isoformat()
    stage = get_stage_name(new_version)
    status_alert = get_status_alert(new_version)

    version_block = f"## [{new_version}] - {today}\n\n"
    version_block += f"# {PROJECT_NAME} - {stage} {new_version}\n\n"
    version_block += f"{status_alert}\n\n"
    if clean_notes:
        version_block += f"{clean_notes}\n\n"
    version_block += "---"

    after_unreleased = content[match.end():]

    new_changelog = "# Changelog\n\n"
    new_changelog += DEFAULT_UNRELEASED_TEMPLATE + "\n"
    new_changelog += version_block
    new_changelog += after_unreleased

    write_file(CHANGELOG_FILE, new_changelog)
    return clean_notes


def promote_changelog_version(old_version, new_version):
    """Re-labels existing alpha version block on test branch."""
    content = read_file(CHANGELOG_FILE)
    today = datetime.date.today().isoformat()

    escaped_old = re.escape(old_version)
    pattern = rf'## \[{escaped_old}\] - \d{{4}}-\d{{2}}-\d{{2}}'
    replacement = f"## [{new_version}] - {today}"

    new_content, count = re.subn(pattern, replacement, content, count=1)
    if count == 0:
        return update_changelog(new_version)

    new_content = new_content.replace(
        f"# {PROJECT_NAME} - {get_stage_name(old_version)} {old_version}",
        f"# {PROJECT_NAME} - {get_stage_name(new_version)} {new_version}"
    )
    new_content = new_content.replace(
        get_status_alert(old_version),
        get_status_alert(new_version)
    )

    write_file(CHANGELOG_FILE, new_content)


# ──────────────────────────────────────────────
# Git operations
# ──────────────────────────────────────────────

def git_commit_and_tag(new_version):
    """Stages changed files, commits with [bump_version], creates an annotated tag."""
    files_to_stage = []
    for f in [PACKAGE_JSON, FRONTEND_PACKAGE_JSON, BACKEND_POM, CHANGELOG_FILE]:
        if os.path.exists(f):
            files_to_stage.append(f)

    run_command(f"git add {' '.join(files_to_stage)}")
    run_command(f'git commit -m "chore(release): {new_version} [bump_version]"')
    run_command(f'git tag -a {new_version} -m "Release {new_version}"')


def git_push(branch, tag):
    """Pushes the branch and the tag to origin."""
    run_command(f"git push origin {branch}")
    run_command(f"git push origin {tag}")


def back_merge_to_dev():
    """Back-merges test branch into dev."""
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

    # 2. Read current versions
    current_root_version = get_root_version()
    current_frontend_version = get_frontend_version()
    current_backend_version = get_backend_version()

    print(f"📦 Version actuelle racine:   {current_root_version}")
    print(f"   - Frontend:               {current_frontend_version}")
    print(f"   - Backend:                {current_backend_version}")

    # 3. Determine new versions
    if branch == "test":
        new_root_version = promote_version_to_beta(current_root_version)
        new_frontend_version = promote_version_to_beta(current_frontend_version)
        new_backend_version = promote_version_to_beta(current_backend_version)
        print(f"🔄 Promotion Alpha → Beta")
    else:
        be_bump, fe_bump = get_bump_types_from_changelog()

        if be_bump is None and fe_bump is None:
            print("❌ Au moins un bump (Backend Bump ou Frontend Bump) doit être spécifié dans CHANGELOG.md [Unreleased].")
            print("   Exemple:")
            print("   Backend Bump: 3")
            print("   Frontend Bump: none")
            sys.exit(1)

        bump_labels = {1: "Major", 2: "Minor", 3: "Patch"}
        be_str = f"{be_bump} ({bump_labels[be_bump]})" if be_bump else "None"
        fe_str = f"{fe_bump} ({bump_labels[fe_bump]})" if fe_bump else "None"
        print(f"📋 Bumps demandés -> Backend: {be_str} | Frontend: {fe_str}")

        valid_bumps = [b for b in (be_bump, fe_bump) if b is not None]
        root_bump = min(valid_bumps)  # 1 (Major) > 2 (Minor) > 3 (Patch)

        new_backend_version = calculate_new_version(current_backend_version, be_bump, branch)
        new_frontend_version = calculate_new_version(current_frontend_version, fe_bump, branch)
        new_root_version = calculate_new_version(current_root_version, root_bump, branch)

    print(f"🆕 Nouvelles versions calculées:")
    print(f"   - Racine (Master):        {new_root_version}")
    print(f"   - Frontend:               {new_frontend_version}")
    print(f"   - Backend:                {new_backend_version}")

    # 4. Dry-run check
    if args.dry_run:
        print("\n🔍 Mode dry-run — Aucune modification appliquée.")
        return

    # 5. Confirm (interactive mode only)
    if not args.ci:
        confirm = input(f"\n Appliquer les nouvelles versions ? (y/N): ").strip().lower()
        if confirm != "y":
            print("❌ Annulé par l'utilisateur.")
            sys.exit(0)

    # 6. Update files
    print("\n📝 Mise à jour des fichiers...")
    update_package_json(PACKAGE_JSON, new_root_version)
    print(f"   ✅ {PACKAGE_JSON} -> {new_root_version}")

    if new_frontend_version != current_frontend_version or branch == "test":
        update_package_json(FRONTEND_PACKAGE_JSON, new_frontend_version)
        print(f"   ✅ {FRONTEND_PACKAGE_JSON} -> {new_frontend_version}")

    if new_backend_version != current_backend_version or branch == "test":
        update_backend_pom(new_backend_version)
        print(f"   ✅ {BACKEND_POM} -> {new_backend_version}")

    if branch == "test":
        promote_changelog_version(current_root_version, new_root_version)
    else:
        update_changelog(new_root_version)
    print(f"   ✅ {CHANGELOG_FILE}")

    # 7. Git commit & tag
    print("\n🏷️  Commit et tag...")
    git_commit_and_tag(new_root_version)
    print(f"   ✅ Tag {new_root_version} créé")

    # 8. Push
    print("\n📤 Push vers origin...")
    git_push(branch, new_root_version)
    print(f"   ✅ Poussé sur {branch}")

    # 9. Back-merge if on test
    if branch == "test":
        back_merge_to_dev()
        print("   ✅ Back-merge test → dev terminé")

    print(f"\n✅ Opération terminée : {new_root_version}")


if __name__ == "__main__":
    main()