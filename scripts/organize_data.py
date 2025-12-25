#!/usr/bin/env python3
"""
Script para organizar os dados de tração do PLA.

Estrutura de saída:
data/organized/
├── A00/                    # Variante de impressão
│   ├── metadata.json       # Metadados da variante (parâmetros de impressão)
│   ├── test_1/
│   │   ├── raw.txt         # Dados brutos da máquina
│   │   └── processed.csv   # Dados processados do xlsx
│   ├── test_2/
│   ...
├── A01/
...

Código das variantes (AXY):
- X: Parâmetro de camada (layer height ou infill)
- Y: Parâmetro secundário

Cada teste contém:
- Tempo (s)
- Deformação/Alongamento (mm)
- Força (N)
- Tensão (MPa)
"""

import os
import json
import shutil
import pandas as pd
from pathlib import Path

# Diretórios
BASE_DIR = Path('/Users/ltcloud/Documents/ramberg-osgood/data')
TXT_DIR = BASE_DIR / 'txt'
XLSX_DIR = BASE_DIR / 'xlsx'
OUTPUT_DIR = BASE_DIR / 'organized'

# Lista de variantes
VARIANTS = ['A00', 'A01', 'A02', 'A10', 'A11', 'A12', 'A20', 'A21', 'A22']

# Descrição dos parâmetros (baseado na nomenclatura típica de impressão 3D)
# AXY onde X e Y são índices de parâmetros
PARAMS_DESCRIPTION = {
    'A00': {'layer_height': 'baixo', 'infill': 'baixo', 'description': 'Configuração base'},
    'A01': {'layer_height': 'baixo', 'infill': 'médio', 'description': 'Layer baixo, Infill médio'},
    'A02': {'layer_height': 'baixo', 'infill': 'alto', 'description': 'Layer baixo, Infill alto'},
    'A10': {'layer_height': 'médio', 'infill': 'baixo', 'description': 'Layer médio, Infill baixo'},
    'A11': {'layer_height': 'médio', 'infill': 'médio', 'description': 'Layer médio, Infill médio'},
    'A12': {'layer_height': 'médio', 'infill': 'alto', 'description': 'Layer médio, Infill alto'},
    'A20': {'layer_height': 'alto', 'infill': 'baixo', 'description': 'Layer alto, Infill baixo'},
    'A21': {'layer_height': 'alto', 'infill': 'médio', 'description': 'Layer alto, Infill médio'},
    'A22': {'layer_height': 'alto', 'infill': 'alto', 'description': 'Layer alto, Infill alto'},
}


def get_xlsx_sheets(variant: str) -> dict:
    """Retorna as sheets disponíveis para uma variante."""
    xlsx_path = XLSX_DIR / f'Dados - {variant}.xlsx'
    if not xlsx_path.exists():
        return {}

    xl = pd.ExcelFile(xlsx_path)
    sheets = {}
    for sheet_name in xl.sheet_names:
        if sheet_name != 'grafico' and sheet_name.startswith(variant):
            # Extrai o número do teste (ex: A01-3 -> 3)
            test_num = int(sheet_name.split('-')[1])
            sheets[test_num] = sheet_name
    return sheets


def get_txt_files(variant: str) -> dict:
    """Retorna os arquivos txt disponíveis para uma variante."""
    txt_files = {}
    for i in range(1, 6):
        txt_path = TXT_DIR / f'{variant}-{i}.txt'
        if txt_path.exists():
            txt_files[i] = txt_path
    return txt_files


def process_xlsx_sheet(xlsx_path: Path, sheet_name: str) -> pd.DataFrame:
    """Processa uma sheet do xlsx e retorna DataFrame limpo."""
    df = pd.read_excel(xlsx_path, sheet_name=sheet_name)

    # Colunas principais que queremos
    column_mapping = {
        'Tempo(s)': 'tempo_s',
        'Tempo (s)': 'tempo_s',
        'Alongamento (mm/mm)': 'alongamento_mm_mm',
        'Deformação (mm/mm)2': 'deformacao_mm_mm',
        'Deformação(mm)': 'deformacao_mm',
        'Força (N)': 'forca_n',
        'Força(N)': 'forca_n',
        'Tensão (Pa)': 'tensao_pa',
        'Tensão (MPa)': 'tensao_mpa',
    }

    # Renomeia colunas
    df_clean = df.copy()
    for old_col, new_col in column_mapping.items():
        if old_col in df_clean.columns:
            df_clean = df_clean.rename(columns={old_col: new_col})

    # Remove colunas desnecessárias
    cols_to_keep = ['tempo_s', 'alongamento_mm_mm', 'deformacao_mm_mm', 'deformacao_mm',
                    'forca_n', 'tensao_pa', 'tensao_mpa']
    cols_existing = [c for c in cols_to_keep if c in df_clean.columns]
    df_clean = df_clean[cols_existing]

    # Remove linhas com NaN em todas as colunas principais
    df_clean = df_clean.dropna(how='all')

    return df_clean


def extract_specimen_info(xlsx_path: Path, sheet_name: str) -> dict:
    """Extrai informações do corpo de prova (dimensões)."""
    df = pd.read_excel(xlsx_path, sheet_name=sheet_name)

    info = {}

    # Procura dimensões nas primeiras linhas
    if 'Comprimento' in df.columns and len(df) > 0:
        info['comprimento_mm'] = df['Comprimento'].iloc[0] if pd.notna(df['Comprimento'].iloc[0]) else None
    if 'Largura' in df.columns and len(df) > 0:
        info['largura_mm'] = df['Largura'].iloc[0] if pd.notna(df['Largura'].iloc[0]) else None
    if 'Espessura' in df.columns and len(df) > 0:
        info['espessura_mm'] = df['Espessura'].iloc[0] if pd.notna(df['Espessura'].iloc[0]) else None

    # Calcula área se possível
    if info.get('largura_mm') and info.get('espessura_mm'):
        info['area_mm2'] = info['largura_mm'] * info['espessura_mm']

    return info


def organize_variant(variant: str):
    """Organiza todos os dados de uma variante."""
    print(f"\nProcessando variante: {variant}")

    variant_dir = OUTPUT_DIR / variant
    variant_dir.mkdir(parents=True, exist_ok=True)

    xlsx_sheets = get_xlsx_sheets(variant)
    txt_files = get_txt_files(variant)

    print(f"  XLSX sheets: {list(xlsx_sheets.keys())}")
    print(f"  TXT files: {list(txt_files.keys())}")

    # Metadados da variante
    metadata = {
        'variant': variant,
        'params': PARAMS_DESCRIPTION.get(variant, {}),
        'tests': {},
        'available_tests': sorted(set(xlsx_sheets.keys()) | set(txt_files.keys()))
    }

    xlsx_path = XLSX_DIR / f'Dados - {variant}.xlsx'

    # Processa cada teste
    for test_num in metadata['available_tests']:
        test_dir = variant_dir / f'test_{test_num}'
        test_dir.mkdir(exist_ok=True)

        test_info = {
            'test_number': test_num,
            'has_raw_txt': test_num in txt_files,
            'has_processed_xlsx': test_num in xlsx_sheets,
        }

        # Copia arquivo txt bruto
        if test_num in txt_files:
            shutil.copy2(txt_files[test_num], test_dir / 'raw.txt')

        # Processa e salva dados do xlsx
        if test_num in xlsx_sheets:
            sheet_name = xlsx_sheets[test_num]

            # Dados processados
            df_processed = process_xlsx_sheet(xlsx_path, sheet_name)
            df_processed.to_csv(test_dir / 'processed.csv', index=False)

            # Informações do corpo de prova
            specimen_info = extract_specimen_info(xlsx_path, sheet_name)
            test_info['specimen'] = specimen_info

            # Estatísticas básicas
            if 'forca_n' in df_processed.columns:
                test_info['max_force_n'] = float(df_processed['forca_n'].max())
            if 'tensao_mpa' in df_processed.columns:
                test_info['max_stress_mpa'] = float(df_processed['tensao_mpa'].max())

        metadata['tests'][str(test_num)] = test_info

    # Salva metadados
    with open(variant_dir / 'metadata.json', 'w', encoding='utf-8') as f:
        json.dump(metadata, f, indent=2, ensure_ascii=False)

    print(f"  ✓ Organizado: {len(metadata['tests'])} testes")
    return metadata


def create_summary():
    """Cria resumo geral de todos os dados."""
    summary = {
        'total_variants': len(VARIANTS),
        'variants': {}
    }

    for variant in VARIANTS:
        metadata_path = OUTPUT_DIR / variant / 'metadata.json'
        if metadata_path.exists():
            with open(metadata_path, 'r', encoding='utf-8') as f:
                metadata = json.load(f)
            summary['variants'][variant] = {
                'params': metadata['params'],
                'num_tests': len(metadata['tests']),
                'available_tests': metadata['available_tests']
            }

    # Salva resumo
    with open(OUTPUT_DIR / 'summary.json', 'w', encoding='utf-8') as f:
        json.dump(summary, f, indent=2, ensure_ascii=False)

    return summary


def main():
    print("=" * 60)
    print("Organizando dados de tração do PLA")
    print("=" * 60)

    # Cria diretório de saída
    OUTPUT_DIR.mkdir(parents=True, exist_ok=True)

    # Processa cada variante
    for variant in VARIANTS:
        organize_variant(variant)

    # Cria resumo
    summary = create_summary()

    print("\n" + "=" * 60)
    print("RESUMO")
    print("=" * 60)
    for variant, info in summary['variants'].items():
        print(f"{variant}: {info['num_tests']} testes - {info['params'].get('description', 'N/A')}")

    print(f"\nDados organizados em: {OUTPUT_DIR}")
    print("Estrutura criada:")
    print("  - metadata.json: metadados de cada variante")
    print("  - test_N/raw.txt: dados brutos da máquina")
    print("  - test_N/processed.csv: dados processados")


if __name__ == '__main__':
    main()
