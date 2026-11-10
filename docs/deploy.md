# Deploying Portolab

This guide takes a fresh Ubuntu server to Portolab, served over HTTPS at a domain of your own. Copy each command in the order of the guide. As [decision 0010](decisions/0010-the-server-owner-deploys-from-the-repository.md) explains, Docker Compose runs Portolab in a container that the server builds from this repository, and Caddy serves HTTPS in front of it. A test runs every command of this guide for the server on a fresh Ubuntu server, so the commands stay right.

<!-- The workflow in .github/workflows/deployment.yml runs every block marked sh, in order, as root on a fresh Ubuntu machine, and replaces the examples that it names, such as the domain. A block that runs on the computer of the reader is marked text. -->

## What you need

- A server with a fresh installation of Ubuntu 24.04 LTS or Ubuntu 26.04 LTS, with at least 2 GB of memory and 20 GB of disk.
- The IPv4 address of the server, such as `203.0.113.10`, and the password or the SSH key of its root user, which the provider gives you.
- A domain name for Portolab, such as `portolab.example.com`, whose DNS records you can change. A subdomain of the domain of your university works too, and its IT office can create it.
- A computer with a terminal. Windows, macOS, and Linux all have the command `ssh`.

The server must accept connections on ports 80 and 443, because Caddy uses both to get the certificate for HTTPS and to serve Portolab. When the provider has a firewall in its control panel, allow both ports there.

## 1. Point the domain at the server

In the DNS settings of the domain, add an `A` record for the name of Portolab, such as `portolab`, with the IPv4 address of the server as its value. When the server also has an IPv6 address, add an `AAAA` record with that address as well.

A new record takes a while to reach every network. To check it, run this command on your computer with your domain:

```text
nslookup portolab.example.com
```

The answer names the address of the server once the record works.

## 2. Connect to the server

Run this command on your computer with the address of your server, and sign in with the password or the key of the root user:

```text
ssh root@203.0.113.10
```

When the provider gave you a user other than root, connect as that user, and then become root:

```text
sudo -i
```

Every later command runs as root on the server.

## 3. Install Docker

These commands add the package repository of Docker and install Docker with Compose, as the [installation guide of Docker](https://docs.docker.com/engine/install/ubuntu/) describes:

```sh
apt-get update
apt-get install --yes ca-certificates curl git
install -m 0755 -d /etc/apt/keyrings
curl -fsSL https://download.docker.com/linux/ubuntu/gpg -o /etc/apt/keyrings/docker.asc
chmod a+r /etc/apt/keyrings/docker.asc
cat > /etc/apt/sources.list.d/docker.sources <<EOF
Types: deb
URIs: https://download.docker.com/linux/ubuntu
Suites: $(. /etc/os-release && echo "${UBUNTU_CODENAME:-$VERSION_CODENAME}")
Components: stable
Signed-By: /etc/apt/keyrings/docker.asc
EOF
apt-get update
apt-get install --yes docker-ce docker-ce-cli containerd.io docker-buildx-plugin docker-compose-plugin
```

## 4. Install Caddy

These commands add the package repository of Caddy and install it, as the [installation guide of Caddy](https://caddyserver.com/docs/install#debian-ubuntu-raspbian) describes:

```sh
curl -fsSL https://dl.cloudsmith.io/public/caddy/stable/gpg.key | gpg --batch --yes --dearmor --output /usr/share/keyrings/caddy-stable-archive-keyring.gpg
curl -fsSL https://dl.cloudsmith.io/public/caddy/stable/debian.deb.txt --output /etc/apt/sources.list.d/caddy-stable.list
chmod o+r /usr/share/keyrings/caddy-stable-archive-keyring.gpg /etc/apt/sources.list.d/caddy-stable.list
apt-get update
apt-get install --yes caddy
```

## 5. Start Portolab

These commands download Portolab into `/opt/portolab`, build it, and start it:

```sh
git clone https://github.com/radenadam/portolab.git /opt/portolab
cd /opt/portolab
docker compose up --detach --build --wait
```

The first build takes several minutes. The last command ends once Portolab answers. Portolab then fetches its first prices by itself, and it starts again by itself after a crash or a restart of the server.

## 6. Serve Portolab over HTTPS

Run these commands with your domain in place of `portolab.example.com`:

```sh
echo "import /opt/portolab/Caddyfile portolab.example.com" > /etc/caddy/Caddyfile
systemctl reload caddy
```

Caddy now gets a certificate for the domain from Let's Encrypt. Open `https://portolab.example.com` with your domain in a browser, and the home page of Portolab appears.

When the page does not appear within a few minutes, the log of Caddy names the reason, such as a DNS record that does not lead to the server yet:

```sh
journalctl --unit caddy --since "10 minutes ago" --no-pager
```

## 7. Create the first lecturer account

Nobody signs up as a lecturer, so you create each lecturer account with the account command of [README.md](../README.md#accounts). Run this command with the username of the lecturer in place of `dosen`:

```sh
cd /opt/portolab
docker compose exec app node server/account.ts create-lecturer dosen
```

The command prints a temporary password and says what the lecturer does with it. When a lecturer forgets the password, run the same command with `reset-password` in place of `create-lecturer`.

## 8. Back up the database

Portolab keeps all its data in one SQLite database, in a volume of Docker. These commands write a script that backs it up into `/var/backups/portolab` and deletes each backup once it is 14 days old. They make systemd run the script every day, and they make the first backup now:

```sh
install --directory --owner 1000 --group 1000 --mode 700 /var/backups/portolab
cat > /usr/local/bin/portolab-backup <<'EOF'
#!/bin/sh
set -e
backup="portolab-$(date -I).sqlite"
cd /opt/portolab
# A backup in the journal mode DELETE is one file, which a restore can read from a folder that it cannot change.
docker compose run --rm --volume /var/backups/portolab:/backups app sqlite3 "file:/app/data/portolab.sqlite?mode=rw" ".timeout 10000" ".backup /backups/$backup" ".open /backups/$backup" "PRAGMA journal_mode = DELETE"
find /var/backups/portolab -name "portolab-*.sqlite" -mtime +13 -delete
EOF
chmod +x /usr/local/bin/portolab-backup
cat > /etc/systemd/system/portolab-backup.service <<'EOF'
[Unit]
Description=Back up the database of Portolab
Requires=docker.service
After=docker.service

[Service]
Type=oneshot
ExecStart=/usr/local/bin/portolab-backup
EOF
cat > /etc/systemd/system/portolab-backup.timer <<'EOF'
[Unit]
Description=Back up the database of Portolab every day

[Timer]
OnCalendar=daily
Persistent=true

[Install]
WantedBy=timers.target
EOF
systemctl daemon-reload
systemctl enable --now portolab-backup.timer
systemctl start portolab-backup.service
ls -l /var/backups/portolab
```

The container writes each backup as the user that runs Portolab, whose number is 1000, so that user owns the folder. To make a backup at any other time, such as before an update, run `systemctl start portolab-backup`. A second backup on the same day replaces the first. When a backup fails, `journalctl --unit portolab-backup` names the reason.

A backup on the server is lost with the server. To keep a copy on your computer, run this command on your computer with the address of your server and the date of the backup:

```text
scp root@203.0.113.10:/var/backups/portolab/portolab-2026-11-10.sqlite .
```

A copy holds the personal data of every person in Portolab, so delete it as the server deletes its backups, which the section [Personal data](#personal-data) explains.

## Restore a backup

A restore replaces the whole database with the backup, so every change after the backup is lost. Run these commands with the date of the backup in place of `2026-11-10`. When no backup has that date, the command fails and the database stays as it was.

```sh
cd /opt/portolab
docker compose stop app
docker compose run --rm --volume /var/backups/portolab:/backups:ro app sqlite3 "file:/app/data/portolab.sqlite?mode=rw" ".restore /backups/portolab-2026-11-10.sqlite"
docker compose up --detach --wait
```

## Update Portolab

An update stops Portolab for a moment while the new version starts, so students who use it then see an error. So update outside the trading sessions of IDX, such as in the evening or at a weekend. These commands back up the database, download the new version, build it, start it, reload the Caddyfile, and delete what the build left behind:

```sh
cd /opt/portolab
systemctl start portolab-backup
git pull
docker compose up --detach --build --wait
systemctl reload caddy
docker system prune --force
```

Portolab needs data of IDX that the repository adds over time, such as the trading calendar of each year and the stocks of the LQ45 after each review. When the log says that such data is missing, an update brings it once the repository has it.

## Personal data

The privacy notice at `https://portolab.example.com/privacy` tells each person what Portolab stores about them, how long it keeps each record, and that you keep the database. Portolab deletes each record by itself when the notice gives the record a time. It keeps every other record, which means the accounts, the classes, and the work of the students, until you delete it. The daily backups keep a copy of each record until each backup is 14 days old.

The law on personal data protection of Indonesia gives each person the right to have their data deleted. When a person asks for it, run these commands with their username in place of `mahasiswa1`. The deletion of a lecturer also deletes the classes of the lecturer and the work of every student in them, because a class cannot exist without its lecturer.

```sh
cd /opt/portolab
docker compose exec app sqlite3 "file:/app/data/portolab.sqlite?mode=rw" ".timeout 10000" "PRAGMA foreign_keys = ON" "PRAGMA secure_delete = ON" "DELETE FROM classes WHERE lecturer_id IN (SELECT id FROM users WHERE username = 'mahasiswa1')" "DELETE FROM users WHERE username = 'mahasiswa1'" "SELECT changes()"
```

The command prints 1 when it deleted the account, and 0 when no account has that username.

The backups still hold the records of the person. These commands make a new backup without them and delete every older backup, so no copy remains on the server. A restore can then go back only to the new backup.

```sh
systemctl start portolab-backup
find /var/backups/portolab -name "portolab-*.sqlite" ! -name "portolab-$(date -I).sqlite" -delete
```

Delete the copies on your computer as well.

## When prices stop updating

Portolab fetches delayed prices from Yahoo Finance, as [decision 0001](decisions/0001-delayed-prices-come-from-yahoo-finance.md) explains. When Yahoo fails to answer, Portolab keeps the last prices that it stored and tries again by itself. The prices page names each price that it could not update and the time of the next attempt. A restart does not make Portolab try sooner, because it keeps the time of the next attempt in its database.

The log of Portolab names the reason of each failure:

```sh
cd /opt/portolab
docker compose logs --since 24h app
```

Each line of the log is one event. A failure of Yahoo has the level `warning` or `error`, and its `detail` says what the client of Yahoo reported.

- When the detail names a connection that failed or a time limit, the server cannot reach Yahoo. Check the network of the server with the provider.
- When the detail names too many requests, Yahoo limits the requests from the address of the server. Portolab keeps trying, and the prices return once Yahoo lifts the limit.
- For any other detail, a newer version of Portolab may fix it, so [update Portolab](#update-portolab). When the newest version fails as well, [open an issue](https://github.com/radenadam/portolab/issues/new) with the lines of the log.
