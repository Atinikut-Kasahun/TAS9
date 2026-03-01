---
description: Start both the Laravel backend and Next.js frontend servers.
---

# Startup Workflow

This workflow automates the process of starting both the backend and frontend servers.

1. Start the Laravel backend server.
// turbo
```powershell
& "C:\laragon\bin\php\php-8.3.30-Win32-vs16-x64\php.exe" backend\artisan serve --port=8081
```

2. Start the Next.js frontend server.
// turbo
```powershell
npm run dev
```

3. Verify both servers are reachable.
- Frontend: http://localhost:3000
- Backend API: http://127.0.0.1:8000/api
