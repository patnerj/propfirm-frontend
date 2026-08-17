import sys

# Patch types/api.ts
types_file = r"D:\Full Propfirm System for antigravity\propfirm-frontend-v10.7.1\src\types\api.ts"
with open(types_file, 'r', encoding='utf-8') as f:
    t_content = f.read()

types_to_add = """
export interface ThemeSettings {
  primaryColor: string;
  primaryForeground: string;
  radius: string;
  fontFamily: string;
}
"""

if "export interface ThemeSettings" not in t_content:
    t_content += types_to_add
    with open(types_file, 'w', encoding='utf-8') as f:
        f.write(t_content)


# Patch api.ts
api_file = r"D:\Full Propfirm System for antigravity\propfirm-frontend-v10.7.1\src\lib\api.ts"
with open(api_file, 'r', encoding='utf-8') as f:
    a_content = f.read()

api_to_add_admin = """
  theme: {
    save: (data: Partial<{primaryColor:string, primaryForeground:string, radius:string, fontFamily:string}>) => fetchApi('/admin/theme', { method: 'POST', body: JSON.stringify(data) }),
  },"""

# Insert admin theme endpoint
if "theme: {" not in a_content:
    a_content = a_content.replace("admin: {", "admin: {" + api_to_add_admin)
    with open(api_file, 'w', encoding='utf-8') as f:
        f.write(a_content)

print("Success")
