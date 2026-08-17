import sys

types_file = r"D:\Full Propfirm System for antigravity\propfirm-frontend-v10.7.1\src\types\api.ts"
with open(types_file, 'r', encoding='utf-8') as f:
    content = f.read()

# Add hero fields to ThemeSettings
if "heroTitle?: string;" not in content:
    content = content.replace(
        "fontFamily: string;", 
        "fontFamily: string;\n  heroTitle?: string;\n  heroHighlight?: string;\n  heroSubtitle?: string;\n  heroBadge?: string;"
    )
    with open(types_file, 'w', encoding='utf-8') as f:
        f.write(content)

print("Success")
