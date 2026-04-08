# Portainer Deployment Guide for Synology

This guide explains how to deploy the **Prayer Wall** ecosystem to your Synology NAS using Portainer's **Repository** build method. This method ensures your deployment stays in sync with your GitHub code while maintaining persistent data (database and uploads) on your Synology's hard drive.

---

## 1. Prepare Synology Folders & Permissions

Before starting the Portainer stack, you must create the folders that will store your persistent data.

1.  Open **File Station** on your Synology.
2.  Navigate to your `docker` shared folder.
3.  Create the following structure:
    *   `/volume1/docker/prayer-wall/`
    *   `/volume1/docker/prayer-wall/data/`
    *   `/volume1/docker/prayer-wall/data/db` (Stores the Postgres database)
    *   `/volume1/docker/prayer-wall/data/uploads` (Stores organization logos & banners)

### Set Permissions
1.  Right-click the `prayer-wall` folder -> **Properties** -> **Permission**.
2.  Click **Create** -> Select **Everyone**.
3.  Check both **Read** and **Write** permissions.
4.  Check **Apply to this folder, sub-folders, and files** and click **Save**.

---

## 2. Create the Stack in Portainer

1.  Login to **Portainer** -> **Stacks** -> **Add stack**.
2.  **Name**: `prayer-wall`
3.  **Build method**: Select **Repository**.
4.  **Repository URL**: `https://github.com/benny2168/prayer-wall.git`
5.  **Repository Reference**: `refs/heads/main`
6.  **Compose path**: `docker-compose.yml`

---

## 3. Configure Environment Variables

Crucial: Your `.env` file is NOT pushed to GitHub for security. You must manually add your local values into Portainer's **Environment variables** section:

> [!TIP]
> Use **Advanced mode** in Portainer to paste your entire local `.env` file at once.

### Required Variables Checklist:
| Variable | Value / Description |
| :--- | :--- |
| `DATABASE_URL` | `postgresql://admin:admin123@db:5432/prayerwall?schema=public` |
| `DATA_BASE_PATH` | `/volume1/docker/prayer-wall/data` |
| `NEXTAUTH_URL` | Your public URL (e.g., `http://192.168.1.100:3001`) |
| `SITE_URL` | Must match `NEXTAUTH_URL` (for email links) |
| `NEXTAUTH_SECRET` | Your unique 32+ character security string |
| `LOCAL_ADMIN_EMAIL` | The email that will automatically receive **GLOBAL ADMIN** rights |
| `PCO_CLIENT_ID` | Your Planning Center Application Client ID |
| `PCO_CLIENT_SECRET` | Your Planning Center Application Client Secret |
| `SMTP_HOST` | e.g. `smtp.gmail.com` |
| `SMTP_USER` | Your email address |
| `SMTP_PASSWORD` | Your email password or App Password |

---

## 4. Initialize the Database

The application requires its database schema to be synchronized on the first run.

1.  Once the stack is deployed and the **Containers** are running, go to the **Containers** list in Portainer.
2.  Click the **Console** (`>_`) icon for the `prayer-wall-web` container.
3.  Click **Connect**.
4.  Type the following command and press Enter:
    ```bash
    npx prisma db push
    ```
5.  Verification: You should see "🚀 Your database is now in sync with your Prisma schema."

---

## 5. Deployment Verification
1.  Open your browser to the `NEXTAUTH_URL` you specified.
2.  Login with the email matching `LOCAL_ADMIN_EMAIL`.
3.  Navigate to `/admin`.
4.  Go to the **Organizations** tab and create your first organization!

---

## Maintenance & Updates
*   **Updates**: To pull the latest code from GitHub, go to your Portainer **Stack** -> **Editor** -> scroll down and click **Pull and redeploy**.
*   **Backups**: You can back up your entire system by simply copying the `/volume1/docker/prayer-wall/data` folder to another location or using Synology's Hyper Backup.
