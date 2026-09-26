# Move MongoDB from Atlas to the VPS (no downtime)

The backend (`cleaniq-api` in pm2) keeps running the whole time. The only interruption is one
`pm2 restart`, about 2 seconds, the same as every deploy.

Run all commands **on the VPS** (`ssh` in first). Replace anything in `<angle brackets>`.

> ⚠️ **Never start a second copy of the backend** (e.g. `node index.js` on another port) during this.
> The automation engine starts on every connection and would send customers duplicate emails.

---

## Step 0: Check the VPS has room

```bash
lsb_release -a     # Ubuntu version: needed for the install guide
free -h            # RAM: 2 GB+ is comfortable; 1 GB works with the cache limit in step 2
df -h /            # Free disk: want at least 5 GB free
```

## Step 1: See how big the Atlas database is (read-only)

```bash
cd ~/cleaniq && git pull origin main
cd server
node scripts/db/db-size.js
```

Write down the **Database name** it prints. You need it below as `<DBNAME>`.

## Step 2: Install MongoDB on the VPS

Follow MongoDB's official guide for your Ubuntu version (from step 0). Install **MongoDB Community**
plus the **Database Tools** (for `mongodump`/`mongorestore`) and `mongosh`:

- https://www.mongodb.com/docs/manual/tutorial/install-mongodb-on-ubuntu/
- https://www.mongodb.com/docs/database-tools/installation/installation-linux/

Then start it:

```bash
sudo systemctl enable --now mongod
sudo systemctl status mongod     # should say "active (running)"
```

## Step 3: Lock it down

**3a. Create users** (auth is still off at this point):

```bash
mongosh
```
```js
use admin
db.createUser({ user: "admin", pwd: passwordPrompt(), roles: [{ role: "root", db: "admin" }] })

use <DBNAME>
db.createUser({ user: "cleaniq_app", pwd: passwordPrompt(), roles: [{ role: "readWrite", db: "<DBNAME>" }] })
exit
```

Use long random passwords, **letters and numbers only** (symbols like `@ : / ?` break the URI).
Generate one with `openssl rand -hex 24`. Save both in your password manager.

**3b. Edit `/etc/mongod.conf`** (`sudo nano /etc/mongod.conf`) so it contains:

```yaml
net:
  port: 27017
  bindIp: 127.0.0.1        # only this machine can connect; never change to 0.0.0.0

security:
  authorization: enabled

# Only if the VPS has 1–2 GB RAM (keep the existing dbPath line in the storage section):
storage:
  wiredTiger:
    engineConfig:
      cacheSizeGB: 0.25
```

```bash
sudo systemctl restart mongod
sudo ufw status                 # 27017 must NOT appear as allowed
```

**3c. Your new connection string** (call it `VPS_URI`):

```
mongodb://cleaniq_app:<PASSWORD>@127.0.0.1:27017/<DBNAME>?authSource=<DBNAME>
```

## Step 4: Rehearsal copy (any time; nothing changes for the live site)

```bash
export ATLAS_URI='<current MONGODB_URI from server/.env>'
export VPS_URI='mongodb://cleaniq_app:<PASSWORD>@127.0.0.1:27017/<DBNAME>?authSource=<DBNAME>'

time mongodump --uri="$ATLAS_URI" --archive=$HOME/atlas-rehearsal.gz --gzip
time mongorestore --uri="$VPS_URI" --archive=$HOME/atlas-rehearsal.gz --gzip --drop --nsInclude="<DBNAME>.*"

SOURCE_URI="$ATLAS_URI" TARGET_URI="$VPS_URI" node scripts/db/verify-copy.js
```

All ✅ = the copy works. Note how long dump + restore took.
If `mongodump` is refused by Atlas, tell Claude. There's a fallback using `catchup-sync.js`.

## Step 5: The real switch (pick a quiet time, e.g. early morning)

```bash
# 5a. Record the start time: anything written after this gets caught up in step 6
export SINCE=$(date -u +%Y-%m-%dT%H:%M:%SZ); echo $SINCE

# 5b. Fresh copy
mongodump --uri="$ATLAS_URI" --archive=$HOME/atlas-final.gz --gzip
mongorestore --uri="$VPS_URI" --archive=$HOME/atlas-final.gz --gzip --drop --nsInclude="<DBNAME>.*"

# 5c. Keep a copy of the old .env, then point the backend at the VPS database
cp .env .env.atlas-backup
nano .env        # change MONGODB_URI= to the VPS_URI value

# 5d. Check pm2 isn't overriding it with an old value (should print nothing)
pm2 env $(pm2 id cleaniq-api | tr -d '[] ') | grep MONGODB_URI

# 5e. Restart (about 2 seconds)
pm2 restart cleaniq-api --update-env
pm2 logs cleaniq-api --lines 30 --nostream   # look for "✅ Connected to MongoDB"
curl -s http://localhost:<PORT>/api/health
```

## Step 6: Catch up writes that happened during the copy

```bash
SOURCE_URI="$ATLAS_URI" TARGET_URI="$VPS_URI" SINCE="$SINCE" node scripts/db/catchup-sync.js          # preview
SOURCE_URI="$ATLAS_URI" TARGET_URI="$VPS_URI" SINCE="$SINCE" node scripts/db/catchup-sync.js --apply  # copy
```

Then open the admin panel and check recent bookings, customers and messages look right.

## Step 7: Nightly backups (important: Atlas no longer covers you)

```bash
chmod +x ~/cleaniq/server/scripts/db/backup-mongo.sh
mkdir -p ~/mongo-backups
~/cleaniq/server/scripts/db/backup-mongo.sh      # test once
crontab -e
# add:
30 3 * * * ~/cleaniq/server/scripts/db/backup-mongo.sh >> ~/mongo-backups/backup.log 2>&1
```

These backups sit on the same VPS. If the VPS dies, they die too. Copy them off-server
regularly (e.g. download weekly, or set up `rclone` to Google Drive / Backblaze later).

## Rollback (if anything looks wrong)

```bash
cp .env.atlas-backup .env
pm2 restart cleaniq-api --update-env
```

**Leave Atlas untouched for 2 weeks** as a safety net, then you can delete the old cluster.

## Heads-up

The GitHub deploy (`deploy.yml`) only does `git pull` + `pm2 restart`. It never touches `server/.env`,
so future deploys keep the new `MONGODB_URI`.
