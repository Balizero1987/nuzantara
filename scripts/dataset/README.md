# Dataset Scripts

Scripts for generating, validating, and managing training datasets for NUZANTARA AI models.

## Directory Structure

```
scripts/dataset/
├── generators/      # Dataset generation scripts (4 scripts)
├── validators/      # Dataset validation scripts (4 scripts)  
└── tools/           # Dataset management tools (3 scripts)
```

## Generators (`generators/`)

Scripts for creating training datasets:

- **generate_jakarta_authentic.py** - Generate authentic Jakarta-style conversations (1,500 examples)
- **generate_sundanese_dataset.py** - Generate Sundanese language dataset
- **generate_team_dynamics.py** - Generate team dynamics training data
- **generate_zero_zantara_dataset.py** - Generate Zero Zantara specific dataset

## Validators (`validators/`)

Scripts for validating dataset quality:

- **validate_dataset.py** - General dataset validation
- **validate_javanese.py** - Validate Javanese language dataset
- **validate_team_dynamics.py** - Validate team dynamics data
- **validate_zero_zantara.py** - Validate Zero Zantara dataset

## Tools (`tools/`)

Utility scripts for dataset management:

- **merge_validate_dataset.py** - Merge multiple datasets and validate
- **monitor_all_claude.py** - Monitor progress of all 14 Claude instances during generation
- **integrate_nuzantara_backend.py** - Integrate datasets with NUZANTARA backend

## Usage

### Generate Dataset
```bash
python scripts/dataset/generators/generate_jakarta_authentic.py
```

### Validate Dataset  
```bash
python scripts/dataset/validators/validate_dataset.py
```

### Monitor Generation Progress
```bash
python scripts/dataset/tools/monitor_all_claude.py
```

## Migration Note

**Date Moved**: 2025-11-17 (Phase 2 - Architecture Refactoring)

These scripts were previously at the root level and have been organized into this dedicated directory structure for better maintainability.

**Old Location**: `/` (root)  
**New Location**: `/scripts/dataset/`
