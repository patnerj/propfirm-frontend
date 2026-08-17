import sys

sidebar_file = r"D:\Full Propfirm System for antigravity\propfirm-frontend-v10.7.1\src\components\dashboard\sidebar.tsx"
with open(sidebar_file, 'r', encoding='utf-8') as f:
    content = f.read()

# Import Palette
if "Palette" not in content:
    content = content.replace("Users, CreditCard, Layers, BarChart3, SlidersHorizontal, PanelLeftClose, PanelLeftOpen, Mail, Megaphone, Ticket, Users2, HeartPulse, Rocket, Gauge,", "Users, CreditCard, Layers, BarChart3, SlidersHorizontal, PanelLeftClose, PanelLeftOpen, Mail, Megaphone, Ticket, Users2, HeartPulse, Rocket, Gauge, Palette,")

# Add Theme to ADMIN_NAV before Settings
admin_nav_patch = """  { href: '/dashboard/admin/health',        label: 'System Status', icon: HeartPulse },
  { href: '/dashboard/admin/theme',         label: 'Theme & Branding', icon: Palette },
  { href: '/dashboard/admin/settings',      label: 'Settings',   icon: Settings },"""

content = content.replace("  { href: '/dashboard/admin/health',        label: 'System Status', icon: HeartPulse },\n  { href: '/dashboard/admin/settings',      label: 'Settings',   icon: Settings },", admin_nav_patch)

with open(sidebar_file, 'w', encoding='utf-8') as f:
    f.write(content)

print("Success")
