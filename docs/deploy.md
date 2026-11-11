# Deploying Portolab

This guide takes an Ubuntu server to Portolab, served over HTTPS at a domain of your own. The server may also run other work, which the guide leaves as it is. Copy each command in the order of the guide. As [decision 0010](decisions/0010-the-server-owner-deploys-from-the-repository.md) explains, Docker Compose runs Portolab in a container that the server builds from this repository, and Caddy serves HTTPS in front of it. A test runs every command of this guide for the server on a fresh Ubuntu server, so the commands stay right.

<!-- The workflow in .github/workflows/deployment.yml runs every block marked sh, in order, as root on a fresh Ubuntu machine, and replaces the examples that it names, such as the domain. A block that runs on the computer of the reader is marked text. -->

## What you need

- A server with Ubuntu 24.04 LTS or Ubuntu 26.04 LTS, with at least 2 GB of memory and 20 GB of disk that other work on the server leaves free.
- The IPv4 address of the server, such as `203.0.113.10`, and the password or the SSH key of its root user, which the provider gives you.
- A domain name for Portolab, such as `portolab.example.com`, whose DNS records you can change. A subdomain of the domain of your university works too, and its IT office can create it.
- A computer with a terminal. Windows, macOS, and Linux all have the command `ssh`.

The server must accept connections on ports 80 and 443, because Caddy uses both to get the certificate for HTTPS and to serve Portolab. When the provider has a firewall in its control panel, allow both ports there. Portolab itself uses port 3000, which only the server can reach, and section 2 checks that no other program uses these three ports.

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

These commands install the tools that the guide uses, and they leave a tool that the server already has as it is. The last command lists each program that already waits for connections on one of the ports that Portolab needs:

```sh
apt-get update
apt-get install --yes --no-upgrade ca-certificates curl git gpg
ss -tlnp 'sport = :80 or sport = :443 or sport = :3000'
```

The list names each program in quotes after `users:`. On a fresh server, it shows only its line of headings. When it names `caddy`, Caddy already serves other sites on the server, so skip section 4 and add Portolab to those sites as section 6 explains. When it names any other program, that program keeps Portolab from working, so install Portolab on another server.

## 3. Install Docker

Portolab runs in Docker with Compose. When the server already has Docker, such as for other work, `docker --version` prints its version. Then do not run the commands at the end of this section, because they would update that Docker or conflict with it, as the [installation guide of Docker](https://docs.docker.com/engine/install/ubuntu/) explains. Docker stops every container while it updates, unless it was set up to keep them running.

On such a server, `docker compose version` prints the version of Compose. When it fails, that Docker lacks Compose, so install Compose as the [installation guide of Compose](https://docs.docker.com/compose/install/linux/) describes. Compose is a command of its own, so its installation stops no container.

On a server without Docker, these commands add the package repository of Docker and install Docker with Compose, as the installation guide of Docker describes:

```sh
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

When section 2 found Caddy on the server, skip this section, because Portolab shares that Caddy with the other sites.

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

The first build takes several minutes. When it stops with an error, such as a download that ran out of time, run the last command again. Docker reuses the steps that succeeded, so the build continues from the step that failed. The last command ends once Portolab answers. Portolab then fetches its first prices by itself, and it starts again by itself after a crash or a restart of the server.

## 6. Serve Portolab over HTTPS

Run these commands with your domain in place of `portolab.example.com`. The first command replaces the example site that Caddy comes with, so that Caddy serves Portolab:

```sh
echo "import /opt/portolab/Caddyfile portolab.example.com" > /etc/caddy/Caddyfile
systemctl reload caddy
```

When section 2 found Caddy on the server, the file `/etc/caddy/Caddyfile` holds its other sites, so write `>>` in place of `>` in the first command. The command then adds Portolab at the end of the file and keeps those sites.

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
install --directory --owner root --group root --mode 700 /var/backups/portolab
cat > /usr/local/bin/portolab-backup <<'EOF'
#!/bin/sh
set -e
backup="/var/backups/portolab/portolab-$(date -I).sqlite"
unfinished=/var/backups/portolab/unfinished.sqlite
# A backup that fails replaces no earlier backup and leaves no part of itself.
trap 'rm -f "$unfinished"' EXIT
cd /opt/portolab
# Only root opens the folder of the backups, so the container passes the backup on through its output.
docker compose run --rm --no-TTY app sh -c 'sqlite3 "file:/app/data/portolab.sqlite?mode=rw" ".timeout 10000" ".backup /tmp/portolab.sqlite" && cat /tmp/portolab.sqlite' > "$unfinished"
mv "$unfinished" "$backup"
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

Each backup holds the personal data of every person in Portolab, so only root opens the folder. The container runs Portolab as the user number 1000, and an account of the server can have that number as well, so the folder cannot belong to that user. Instead, the container passes each backup to the script through its output, and the script writes it into the folder. To make a backup at any other time, such as before an update, run `systemctl start portolab-backup`. A second backup on the same day replaces the first once it is complete. When a backup fails, `journalctl --unit portolab-backup` names the reason.

A backup on the server is lost with the server. To keep a copy on your computer, run this command on your computer with the address of your server and the date of the backup:

```text
scp root@203.0.113.10:/var/backups/portolab/portolab-2026-11-10.sqlite .
```

A copy holds the personal data of every person in Portolab, so delete it as the server deletes its backups, which the section [Personal data](#personal-data) explains.

## Restore a backup

A restore replaces the whole database with the backup, so every change after the backup is lost. Run these commands with the date of the backup in place of `2026-11-10`. The container cannot open the folder of the backups, so the third command passes the backup to it through its input. When no backup has that date, the command fails and the database stays as it was.

```sh
cd /opt/portolab
docker compose stop app
docker compose run --rm --no-TTY app sh -c 'cat > /tmp/portolab.sqlite && sqlite3 "file:/app/data/portolab.sqlite?mode=rw" ".restore /tmp/portolab.sqlite"' < /var/backups/portolab/portolab-2026-11-10.sqlite
docker compose up --detach --wait
```

## Update Portolab

An update stops Portolab for a moment while the new version starts, so students who use it then see an error. So update outside the trading sessions of IDX, such as in the evening or at a weekend. These commands back up the database, download the new version, build it, start it, and reload the Caddyfile. Some installations of Docker keep the image of the previous version, so the last command deletes it. It deletes only images of Portolab, so the images of other work stay:

```sh
cd /opt/portolab
systemctl start portolab-backup
git pull
docker compose up --detach --build --wait
systemctl reload caddy
docker image prune --force --filter label=com.docker.compose.project=portolab
```

An earlier version of section 8 made the user number 1000 the owner of the folder of the backups, so an account of the server with that number could read every backup. This command prints the number of the owner of the folder:

```sh
stat --format %u /var/backups/portolab
```

It prints 0 for root. When it prints 1000, run the commands of section 8 once more. They make root the owner of the folder and write the script again, and they keep the backups that the folder holds.

Portolab needs data of IDX that the repository adds over time, such as the trading calendar of each year, the auto rejection limits that IDX sets for orders, and the stocks of the LQ45 after each review. When the log says that such data is missing, an update brings it once the repository has it.

Portolab warns before a gap in the data that orders need reaches the students. It looks for two kinds of gap in the coming weeks, and it writes a warning about the first day of each kind to the log when it starts and once a day after that:

- A date without a trading calendar stops every order, and so does a trading day without a rule of IDX, the broker fee, or the final tax on sales.
- A trading day that no recorded period of the LQ45 covers stops every purchase, because students buy only the stocks of the LQ45, as [decision 0015](decisions/0015-students-buy-only-stocks-that-the-measures-can-use.md) explains. Students can still sell.

Each warning names its day and what it lacks. From the end of session II of the last trading day before that day, the orders that the gap stops fail until Portolab records the data. So update Portolab before then, once a [release of Portolab](https://github.com/radenadam/portolab/releases) records the data. When `docker compose logs --since 10m app` shows the warning again right after the update, that release does not record the data yet, so update again once a later release does.

## Personal data

The privacy notice at `https://portolab.example.com/privacy` tells each person what Portolab stores about them, how long it keeps each record, and that you keep the database. Portolab deletes each record by itself when the notice gives the record a time. It keeps every other record, which means the accounts, the classes, and the work of the students, until you delete it. The daily backups keep a copy of each record until each backup is 14 days old.

The law on personal data protection of Indonesia gives each person the right to see, correct, and delete their data, and to withdraw their agreement to the privacy notice. A person changes their own name in Portolab, and the notice sends every other request to you, so the next sections show how to answer each one.

### See the data of a person

A person sees their name, their username, their role, and the time of their agreement on the page of their account, and their work on the pages of each class. When a person asks for a copy of all their data, run these commands with their username in place of `mahasiswa1`. They write every record about the person from the database, as Portolab stores it, into the file `portolab-mahasiswa1.txt` in the home folder of root. The file names each table before its records, and it leaves out the hashes of the password and of the sessions, because a copy outside the server must not help anyone sign in as the person.

<!-- The option --no-TTY keeps the line ends that sqlite3 writes. Without it, Docker gives the command a terminal, which ends each line of the file with a carriage return as well. -->

```sh
cd /opt/portolab
docker compose exec --no-TTY app sqlite3 "file:/app/data/portolab.sqlite?mode=rw" ".timeout 10000" ".mode json" \
  "CREATE TEMP TABLE person AS SELECT id FROM users WHERE username = 'mahasiswa1'" \
  "CREATE TEMP TABLE places AS SELECT id FROM memberships WHERE student_id IN person" \
  ".print users" "SELECT id, username, name, role, must_change_password, consented_at FROM users WHERE id IN person" \
  ".print sessions" "SELECT id, user_id, last_used_at FROM sessions WHERE user_id IN person" \
  ".print classes" "SELECT * FROM classes WHERE lecturer_id IN person OR id IN (SELECT class_id FROM memberships WHERE id IN places)" \
  ".print memberships" "SELECT * FROM memberships WHERE id IN places" \
  ".print portfolios" "SELECT * FROM portfolios WHERE membership_id IN places" \
  ".print holdings" "SELECT * FROM holdings WHERE membership_id IN places" \
  ".print orders" "SELECT * FROM orders WHERE membership_id IN places" \
  > ~/portolab-mahasiswa1.txt
```

When no account has that username, the file holds only the names of the tables.

To copy the file to your computer, run this command on your computer with the address of your server. Then send the copy to the person.

```text
scp root@203.0.113.10:portolab-mahasiswa1.txt .
```

The file holds the personal data of the person, so delete it from the server once you have the copy, and delete the copy on your computer once you sent it:

```sh
rm ~/portolab-mahasiswa1.txt
```

### Correct the data of a person

A person changes their name on the page of their account, at `https://portolab.example.com/account` with your domain, by the same rule as when they gave it. A person who cannot sign in first gets a temporary password, which a student gets from the lecturer of the class, and a lecturer from you with the action `reset-password` of [section 7](#7-create-the-first-lecturer-account). Portolab corrects no other record, as [decision 0024](decisions/0024-a-person-changes-their-own-name-on-the-page-of-the-account.md) explains.

### Delete the data of a person

When a person asks for the deletion of their data, or withdraws their agreement, run these commands with their username in place of `mahasiswa1`. The deletion of a lecturer also deletes the classes of the lecturer and the work of every student in them, because a class cannot exist without its lecturer.

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
