import pandas as pd
import json

# Read Excel file
xl = pd.ExcelFile('rudraram_survey.xlsx')

print("=" * 80)
print("EXCEL FILE ANALYSIS")
print("=" * 80)
print(f"\nAvailable sheets: {xl.sheet_names}\n")

# Read each relevant sheet
sheets_to_read = ['Borewell', 'Sumps', 'OHSR', 'OHTs']

for sheet_name in sheets_to_read:
    if sheet_name in xl.sheet_names:
        print(f"\n{'=' * 80}")
        print(f"SHEET: {sheet_name}")
        print('=' * 80)
        
        df = pd.read_excel('rudraram_survey.xlsx', sheet_name=sheet_name)
        
        print(f"\nTotal Rows: {len(df)}")
        print(f"Total Columns: {len(df.columns)}")
        print(f"\nColumn Names:")
        for i, col in enumerate(df.columns, 1):
            print(f"  {i}. {col}")
        
        print(f"\nData Types:")
        for col in df.columns:
            print(f"  {col}: {df[col].dtype}")
        
        if len(df) > 0:
            print(f"\nSample Record (First Row):")
            for col in df.columns:
                value = df[col].iloc[0]
                print(f"  {col}: {value}")
            
            print(f"\nUnique Values Count:")
            for col in df.columns:
                unique_count = df[col].nunique()
                print(f"  {col}: {unique_count} unique values")

print("\n" + "=" * 80)
print("ANALYSIS COMPLETE")
print("=" * 80)
