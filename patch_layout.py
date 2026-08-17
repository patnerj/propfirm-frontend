import sys

layout_file = r"D:\Full Propfirm System for antigravity\propfirm-frontend-v10.7.1\src\app\layout.tsx"
with open(layout_file, 'r', encoding='utf-8') as f:
    content = f.read()

# Import ThemeLoader
if "import { ThemeLoader }" not in content:
    content = content.replace("import { Toaster } from '@/components/ui/sonner'", "import { Toaster } from '@/components/ui/sonner'\nimport { ThemeLoader } from '@/components/theme-loader'")

# Inject ThemeLoader before Toaster
if "<ThemeLoader />" not in content:
    content = content.replace("<Toaster position=\"top-right\" />", "<ThemeLoader />\n        <Toaster position=\"top-right\" />")

with open(layout_file, 'w', encoding='utf-8') as f:
    f.write(content)

print("Success")
