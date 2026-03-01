# Professional Startup Guide

Follow this sequence to start your full-stack development environment correctly.

## 1. Start the Backend (Laravel)
Open a new terminal and run the following command. This uses the exact path to the PHP executable bundled with Laragon.

```powershell
# Navigate to the backend folder
cd C:\Users\ate\Documents\Projects\TAS28\backend

# Start the server
"C:\laragon\bin\php\php-8.3.30-Win32-vs16-x64\php.exe" artisan serve --port=8081
```
> [!IMPORTANT]
> Keep this terminal open! If you close it, the backend server will stop.

## 2. Start the Frontend (Next.js)
Open a second terminal and run:

```powershell
# Navigate to the TAS folder
cd C:\Users\ate\Documents\Projects\TAS28

# Start the development server
npm run dev
```

## 3. Database Check
The system is currently configured to use **SQLite**. 
- Database file: `C:\Users\ate\Documents\Projects\TAS28\backend\database\database.sqlite`
- You don't need to start a separate database service for SQLite.

---

### Troubleshooting "NetworkError"
If the frontend shows a connection error:
1. Check if the Laravel terminal is still running.
2. Check if there are any red errors in the Laravel terminal.
3. Ensure the URL in `src/lib/api.ts` is `http://127.0.0.1:8081/api`.
