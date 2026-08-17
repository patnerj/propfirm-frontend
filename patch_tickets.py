import sys

# Patch types/api.ts
types_file = r"C:\Users\Administrator\Downloads\Full Propfirm System for antigravity\propfirm-frontend-v10.7.1\src\types\api.ts"
with open(types_file, 'r', encoding='utf-8') as f:
    t_content = f.read()

types_to_add = """
export interface TicketMessage {
  id: string | number;
  ticket_id: string | number;
  sender_type: 'user' | 'admin';
  sender_id: string | number;
  message: string;
  created_at: string;
}

export interface Ticket {
  id: string | number;
  user_id: string | number;
  subject: string;
  status: 'open' | 'pending' | 'resolved' | 'closed';
  category: string;
  created_at: string;
  updated_at: string;
  user_email?: string;
  display_name?: string;
  latest_message?: string;
}
"""

if "export interface Ticket" not in t_content:
    t_content += types_to_add
    with open(types_file, 'w', encoding='utf-8') as f:
        f.write(t_content)


# Patch api.ts
api_file = r"C:\Users\Administrator\Downloads\Full Propfirm System for antigravity\propfirm-frontend-v10.7.1\src\lib\api.ts"
with open(api_file, 'r', encoding='utf-8') as f:
    a_content = f.read()

api_to_add_admin = """
  tickets: {
    list: () => fetchApi('/admin/tickets'),
    get: (id: string|number) => fetchApi(`/admin/tickets/${id}`),
    reply: (id: string|number, message: string) => fetchApi(`/admin/tickets/${id}/reply`, { method: 'POST', body: JSON.stringify({ message }) }),
    updateStatus: (id: string|number, status: string) => fetchApi(`/admin/tickets/${id}/status`, { method: 'POST', body: JSON.stringify({ status }) }),
  },"""

api_to_add_user = """
  tickets: {
    list: () => fetchApi('/user/tickets'),
    get: (id: string|number) => fetchApi(`/user/tickets/${id}`),
    create: (data: { subject: string; category: string; message: string }) => fetchApi('/user/tickets', { method: 'POST', body: JSON.stringify(data) }),
    reply: (id: string|number, message: string) => fetchApi(`/user/tickets/${id}/reply`, { method: 'POST', body: JSON.stringify({ message }) }),
  },"""

# Insert admin tickets
if "tickets: {" not in a_content:
    a_content = a_content.replace("admin: {", "admin: {" + api_to_add_admin)
    a_content = a_content.replace("user: {", "user: {" + api_to_add_user)
    with open(api_file, 'w', encoding='utf-8') as f:
        f.write(a_content)

print("Success")
