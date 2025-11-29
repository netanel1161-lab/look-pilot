import pandas as pd
import json
import os

# הגדרת שמות העמודות בקובץ הממשלתי (מותאם למבנה הנפוץ של Data.gov.il)
# יש לוודא שהשמות תואמים לקובץ שלך
COL_MAKE = 'tozeret_nm'      # שם יצרן (למשל: מאזדה)
COL_MODEL = 'kinuy_mishari'  # כינוי מסחרי (למשל: 3)
COL_COLOR = 'tzeva_rechev'   # צבע (למשל: לבן פנינה)
COL_YEAR = 'shnat_yitzur'    # שנת ייצור

def process_vehicle_data(input_file, output_file):
    print(f"Loading data from {input_file}...")
    
    try:
        # טעינת הקובץ (תומך ב-CSV או Excel)
        if input_file.endswith('.csv'):
            df = pd.read_csv(input_file, encoding='utf-8', low_memory=False)
        else:
            df = pd.read_excel(input_file)
            
        print(f"Loaded {len(df)} records. Processing...")

        # ניקוי בסיסי
        df = df[[COL_MAKE, COL_MODEL, COL_COLOR]].dropna()
        
        # ניקוי טקסט (הסרת רווחים מיותרים)
        df[COL_MAKE] = df[COL_MAKE].astype(str).str.strip()
        df[COL_MODEL] = df[COL_MODEL].astype(str).str.strip()
        df[COL_COLOR] = df[COL_COLOR].astype(str).str.strip()

        # מבנה הנתונים הסופי
        hierarchy = {}

        # מעבר על הנתונים וקיבוץ
        for index, row in df.iterrows():
            make = row[COL_MAKE]
            model = row[COL_MODEL]
            color = row[COL_COLOR]

            if make not in hierarchy:
                hierarchy[make] = {
                    "models": set(),
                    "colors": set()
                }
            
            hierarchy[make]["models"].add(model)
            hierarchy[make]["colors"].add(color)

        # המרה לפורמט JSON ידידותי (רשימות במקום Set)
        final_list = []
        for make, data in hierarchy.items():
            final_list.append({
                "make": make,
                "models": sorted(list(data["models"])),
                "colors": sorted(list(data["colors"]))
            })

        # מיון לפי שם יצרן
        final_list.sort(key=lambda x: x["make"])

        # שמירה לקובץ
        with open(output_file, 'w', encoding='utf-8') as f:
            json.dump(final_list, f, ensure_ascii=False, indent=2)

        print(f"Success! Created {output_file} with {len(final_list)} manufacturers.")

    except Exception as e:
        print(f"Error: {e}")

# דוגמה לשימוש:
# שנה את שם הקובץ לקובץ שברשותך
if __name__ == "__main__":
    # נסה למצוא קובץ CSV בתיקייה
    files = [f for f in os.listdir('.') if f.endswith('.csv')]
    if files:
        process_vehicle_data(files[0], 'vehicle_db_clean.json')
    else:
        print("No CSV file found. Please place the government data CSV in this folder.")