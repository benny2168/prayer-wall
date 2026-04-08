# 🚀 Portainer Deployment Guide (Docker Hub Method)

This guide walks you through deploying the **MTCD Prayer Wall** to a Synology NAS using **Portainer** and a pre-built image from **Docker Hub**. This is the fastest and most reliable deployment method for Synology hardware.

---

## 1. Prerequisites (Complete these once)

### Prepare Synology Folders
In **File Station**, create the following structure:
- `/volume1/docker/prayer-wall/data/db` (For the database)
- `/volume1/docker/prayer-wall/data/uploads` (For logos and photos)

### Set Folder Permissions
1. Right-click `/volume1/docker/prayer-wall/data` -> **Properties**.
2. Go to **Permission** tab.
3. Click **Create** -> User: `Everyone`, Permission: `Read & Write`. 
4. Check **Apply to this folder, sub-folders and files**. Click **Save**.

---

## 2. Pushing the Image (MAC ONLY)
Run these commands on your Mac after making changes to the code:

```bash
# 1. Login to Docker Hub
docker login

# 2. Build for Synology (Intel/AMD) and push
docker buildx build --platform linux/amd64 -t mtcdtech/prayer-wall:latest --push .
```

---

## 3. Creating the Portainer Stack

1. **Delete** any existing `prayer-wall` stacks in Portainer.
2. Click **Add stack** -> Name: `prayer-wall`.
3. Choose **Repository** build method.
   - **Repository URL**: `https://github.com/benny2168/prayer-wall.git`
   - **Repository Reference**: `refs/heads/main`
   - **Compose path**: `docker-compose.yml`
4. In the **Environment variables** section, add your full `.env` configuration.

### ⚠️ Critical Variables Checklist:
- `DOCKER_USERNAME`: `mtcdtech`
- `DATABASE_URL`: `postgresql://admin:admin123@db:5432/prayerwall?schema=public`
- `DATA_BASE_PATH`: `/volume1/docker/prayer-wall/data`
- `NEXTAUTH_URL`: `https://prayer.server.mtcd.org`
- `SITE_URL`: `https://prayer.server.mtcd.org`
- `SMTP_HOST`: `smtp.azurecomm.net` (and all other SMTP/PCO variables)

5. Click **Deploy the stack**.

---

## 4. Initialize the Database (First-time only)

Once the stack is "Healthy":
1. Click the **prayer-wall-web** container.
2. Click **Console** -> **Connect**.
3. Run the following command to create the database tables:
   ```bash
   npx prisma db push
   ```

---

## 5. Reverse Proxy Configuration

To use your domain name, set this up in **Synology Control Panel** -> **Login Portal** -> **Advanced** -> **Reverse Proxy**:

- **Source**: HTTPS, `prayer.server.mtcd.org`, Port 443
- **Destination**: HTTP, `127.0.0.1`, Port 3001

**Your Prayer Wall is now LIVE!**
