# Deploying Portolab

This guide takes an Ubuntu server to Portolab, served over HTTPS at a domain of your own. The server may also run other work, which the guide leaves as it is. Copy each command in the order of the guide. As [decision 0010](decisions/0010-the-server-owner-deploys-from-the-repository.md) explains, Docker Compose runs Portolab in a container that the server builds from this repository, and Caddy serves HTTPS in front of it. A test runs every command of this guide for the server on a fresh Ubuntu server, so the commands stay right.

<!-- The deployment test runs the main guide before its browser tests, then exercises the optional sample commands through those tests, including reset and removal. Before Update Portolab, it gives the live database to user number 1000, as an installation from before decision 0027 has it. Windows commands are text blocks because the maintainer runs them. -->

## What you need

- A server with Ubuntu 24.04 LTS or Ubuntu 26.04 LTS, with at least 2 GB of memory and 20 GB of disk that other work on the server leaves free.
- No account on the server with a number from the range of user numbers that [decision 0027](decisions/0027-the-container-runs-as-a-user-whose-number-no-account-gets.md) keeps for Portolab. Portolab runs in its container as a user with such a number, and an account with the same number could read its database. Ubuntu gives no account such a number, but `useradd --uid` or a directory of accounts, such as LDAP, can.
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

Caddy now gets a certificate for the domain from Let's Encrypt. Open `https://portolab.example.com` with your domain in a browser to check that Portolab answers.

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

The live service keeps its data in one SQLite database, in a volume of Docker. These commands write a script that backs it up into `/var/backups/portolab` and deletes each backup once it is 14 days old. They make systemd run the script every day, and they make the first backup now:

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

Each backup holds the personal data of every person in Portolab, so only root opens the folder. The container never opens it. It passes each backup to the script through its output, and the script writes it into the folder, so no process of the container can read or change an earlier backup. To make a backup at any other time, such as before an update, run `systemctl start portolab-backup`. A second backup on the same day replaces the first once it is complete. When a backup fails, `journalctl --unit portolab-backup` names the reason.

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

An update stops Portolab for a moment while the new version starts, so students who use it then see an error. So update outside the trading sessions of IDX, such as in the evening or at a weekend.

An earlier version of section 8 gave the folder of the backups to the user number 1000, and an earlier image of Portolab ran the server as that user, who owned the database. Ubuntu gives that number to the first account of a person, so that account could read the personal data in both. An installation from that time gives each of them a new owner once, before its next update. These commands print the number of the owner of the folder of the backups, and then the number of the owner of the folder of the database:

```sh
cd /opt/portolab
stat --format %u /var/backups/portolab
docker compose run --rm app stat --format %u /app/data
```

When the first number is 1000, run the commands of section 8 once more. They make root the owner of the folder and write the script again, and they keep the backups that the folder holds. When the second number is 1000, run these commands once. They download the new version, build it, stop Portolab, and give the folder of the database and its files to the user that Portolab runs as now, whose number Ubuntu gives no account, as [decision 0027](decisions/0027-the-container-runs-as-a-user-whose-number-no-account-gets.md) explains. The commands of the update then start Portolab again:

```sh
cd /opt/portolab
git pull
docker compose build
docker compose stop app
docker compose run --rm --user root app chown -R portolab:portolab /app/data
```

These commands back up the database before they download the new version, build it, start it, and reload the Caddyfile. Some installations of Docker keep the image of the previous version, so the last command deletes it. It deletes only images of Portolab, so the images of other work stay:

```sh
cd /opt/portolab
systemctl start portolab-backup
git pull
docker compose up --detach --build --wait
systemctl reload caddy
docker image prune --force --filter label=com.docker.compose.project=portolab
```

Portolab needs data of IDX that the repository adds over time, such as the trading calendar of each year, the auto rejection limits that IDX sets for orders, and the stocks of the LQ45 after each review. When the log says that such data is missing, an update brings it once the repository has it.

Portolab warns before a gap in the data that orders need reaches the students. It looks for two kinds of gap in the coming weeks, and it writes a warning about the first day of each kind to the log when it starts and once a day after that:

- A date without a trading calendar stops every order, and so does a trading day without a rule of IDX, the broker fee, or the final tax on sales.
- A trading day that no recorded period of the LQ45 covers stops every purchase, because students buy only the stocks of the LQ45, as [decision 0015](decisions/0015-students-buy-only-stocks-that-the-measures-can-use.md) explains. Students can still sell.

Each warning names its day and what it lacks. From the end of session II of the last trading day before that day, the orders that the gap stops fail until Portolab records the data. So update Portolab before then, once a [release of Portolab](https://github.com/radenadam/portolab/releases) records the data. When `docker compose logs --since 10m app` shows the warning again right after the update, that release does not record the data yet, so update again once a later release does.

## Personal data

The privacy notice at `https://portolab.example.com/privacy` tells each person what Portolab stores about them, how long it keeps each record, and that you keep the database. Portolab deletes each record by itself when the notice gives the record a time. It keeps every other record, which means the accounts, the classes, the watchlists, and the work of students and lecturers, until you delete it. The membership record also keeps `home_dismissed_at`, which is the cutoff of the newest Home summary that the student closed in that class. It is deleted with the membership. A person can remove an entry of their own watchlist with its star. The daily backups keep a copy of each record until each backup is 14 days old.

The law on personal data protection of Indonesia gives each person the right to see, correct, and delete their data, and to withdraw their agreement to the privacy notice. A person changes their own name, their NIM for each class, and their watchlist in Portolab, and the notice sends every other request to you, such as a copy of all their data or the deletion of their account, so the next sections show how to answer each one.

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
  ".print watchlist" "SELECT * FROM watchlist WHERE user_id IN person" \
  ".print classes" "SELECT * FROM classes WHERE lecturer_id IN person OR id IN (SELECT class_id FROM memberships WHERE id IN places)" \
  ".print memberships" "SELECT * FROM memberships WHERE id IN places" \
  "CREATE TEMP TABLE owned_portfolios AS SELECT id FROM portfolios WHERE membership_id IN places OR demonstration_class_id IN (SELECT id FROM classes WHERE lecturer_id IN person)" \
  ".print portfolios" "SELECT * FROM portfolios WHERE id IN owned_portfolios" \
  ".print holdings" "SELECT * FROM holdings WHERE portfolio_id IN owned_portfolios" \
  ".print orders" "SELECT * FROM orders WHERE portfolio_id IN owned_portfolios" \
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

A person changes their name, and their NIM for each class, on the page of their account, at `https://portolab.example.com/account` with your domain, by the same rule as when they gave it, as decisions [0024](decisions/0024-a-person-changes-their-own-name-on-the-page-of-the-account.md) and [0064](decisions/0064-a-student-gives-an-optional-nim-for-each-class.md) explain. A person who cannot sign in first gets a temporary password, which a student gets from the lecturer of the class, and a lecturer from you with the action `reset-password` of [section 7](#7-create-the-first-lecturer-account).

### Delete the data of a person

When a person asks for the deletion of their data, or withdraws their agreement, run these commands with their username in place of `mahasiswa1`. Deleting an account also deletes its watchlist. The deletion of a lecturer also deletes their classes and all simulated work in them, because a class cannot exist without its lecturer.

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

Portolab fetches delayed prices from Yahoo Finance, as [decision 0001](decisions/0001-delayed-prices-come-from-yahoo-finance.md) explains. When Yahoo fails to answer, Portolab keeps the last prices that it stored and tries again by itself. The class market page names each price that it could not update and the time of the next attempt. A restart does not make Portolab try sooner, because it keeps the time of the next attempt in its database.

The log of Portolab names the reason of each failure:

```sh
cd /opt/portolab
docker compose logs --since 24h app
```

Each line of the log is one event. A failure of Yahoo has the level `warning` or `error`, and its `detail` says what the client of Yahoo reported.

- When the detail names a connection that failed or a time limit, the server cannot reach Yahoo. Check the network of the server with the provider.
- When the detail names too many requests, Yahoo limits the requests from the address of the server. Portolab keeps trying, and the prices return once Yahoo lifts the limit.
- For any other detail, a newer version of Portolab may fix it, so [update Portolab](#update-portolab). When the newest version fails as well, [open an issue](https://github.com/radenadam/portolab/issues/new) with the lines of the log.

## Optional sample class

The sample is for exploration with fictional accounts. [Decision 0050](decisions/0050-a-sample-class-lives-in-a-database-of-its-own.md) sets its isolation and deployment requirements. On Windows, use an Ubuntu WSL installation with Docker and Caddy already configured for the main `app` service of the Compose file. On the VPS, follow the main guide first. Both paths need Caddy 2.9 or later and the repository checkout at `/opt/portolab`. The Linux commands run as root. They keep the main service's data and existing HTTPS sites. The backup script in [section 8](#8-back-up-the-database) names only `app`, so it leaves the sample out.

### Prepare Windows once

On the home network, use Windows 11 22H2 or later with WSL 2.0.9 or later. These steps follow [Microsoft's WSL networking guide](https://learn.microsoft.com/en-us/windows/wsl/networking) and were checked on 16 November 2026. The maintainer runs them. Do not forward a port on the home router.

1. In PowerShell, check WSL and list the installed distributions:

   ```text
   wsl --version
   wsl --list --verbose
   ```

   Use the distribution that holds Portolab. The examples below call it `Ubuntu`, so replace that name when the list gives another one. [Microsoft documents these WSL commands](https://learn.microsoft.com/en-us/windows/wsl/basic-commands).

2. Edit `%UserProfile%\.wslconfig` with a text editor. Keep its other settings and add `networkingMode=mirrored` to its existing `[wsl2]` section, or create the section when it has none:

   ```text
   [wsl2]
   networkingMode=mirrored
   ```

   Save work in every WSL distribution, then run this in PowerShell. The first command stops all distributions and their running Docker containers. [Microsoft's configuration guide](https://learn.microsoft.com/en-us/windows/wsl/wsl-config) requires a restart for the setting to apply:

   ```text
   wsl --shutdown
   wsl --distribution Ubuntu --user root
   ```

   In Ubuntu, run this if Docker and Caddy did not start by themselves:

   ```sh
   systemctl start docker caddy
   ```

   Then continue the Windows steps in a new PowerShell window.

3. **Administrator PowerShell:** identify the home connection and its IPv4 address with [Get-NetIPConfiguration](https://learn.microsoft.com/en-us/powershell/module/nettcpip/get-netipconfiguration). Use its `InterfaceAlias` in place of `Wi-Fi` below. Set only this trusted home connection to Private with [Set-NetConnectionProfile](https://learn.microsoft.com/en-us/powershell/module/netconnection/set-netconnectionprofile):

   ```text
   Get-NetIPConfiguration
   Set-NetConnectionProfile -InterfaceAlias "Wi-Fi" -NetworkCategory Private
   ```

   Record the connection's `IPv4Address`, such as `192.168.1.20`. This is the Windows LAN address that the lecturer opens. Do not use a VPN address or WSL's internal address.

4. **Administrator PowerShell:** allow TCP port 80 into WSL with the rule from [Microsoft's Hyper-V firewall guide](https://learn.microsoft.com/en-us/windows/security/operating-system-security/network-security/windows-firewall/hyper-v-firewall). Limit the rule to the Private profile:

   ```text
   New-NetFirewallHyperVRule -Name "PortolabSampleHTTP" -DisplayName "Portolab sample HTTP" -Direction Inbound -VMCreatorId '{40E0AC32-46A5-438A-A0B2-2B479E8F2E90}' -Protocol TCP -LocalPorts 80 -Profiles Private
   ```

   Run the creation command once. An organization may disallow local firewall rules. In that case, its administrator must allow this port through its policy.

### Start the sample

Run this on either Ubuntu installation. Without the profile, `docker compose up` starts only the live service. Caddy reaches the sample through the loopback port of the host. Never publish the container on `0.0.0.0`, because [decision 0005](decisions/0005-sign-in-is-hand-written-without-email.md) trusts forwarded headers from private addresses.

```sh
cd /opt/portolab
docker compose --profile sample up --detach --build --wait sample
```

### Fill the sample

Run the command of [the sample class](../README.md#sample-class) in that service. It uses the sample database from Compose and refuses one that already holds people or a sample marker:

```sh
cd /opt/portolab
docker compose exec --no-TTY sample node server/sample-class.ts
```

Keep its printed usernames, role passwords, and join code for this exploration. When price preparation fails, its log names the missing data. Retry after that source recovers. Starting the service alone never creates sample accounts.

### Serve the sample on the home network

Use this on WSL. The [import block](https://caddyserver.com/docs/caddyfile/directives/import) adds the private-range restriction to the sample site. These commands write only the sample's site file and add its import once. They preserve the existing HTTPS sites in `/etc/caddy/Caddyfile`:

```sh
cd /opt/portolab
cat > /etc/caddy/portolab-sample.caddy <<'EOF'
import /opt/portolab/sample/Caddyfile http:// {
    @outside not remote_ip private_ranges
    abort @outside
}
EOF
grep -qxF 'import /etc/caddy/portolab-sample.caddy' /etc/caddy/Caddyfile || echo 'import /etc/caddy/portolab-sample.caddy' >> /etc/caddy/Caddyfile
caddy validate --config /etc/caddy/Caddyfile
systemctl reload caddy
```

On another device on the same home network, open `http://192.168.1.20`, with the Windows LAN address from step 3. Include `http://`, because this site uses HTTP. The join address then uses that same host. Opening `localhost` inside WSL can instead show an internal WSL address that the other device cannot reach.

When the page opens on Windows but the other device cannot reach it, check that both devices use the same home network and that the router allows devices to reach each other. Microsoft's mirrored networking instructions require the Hyper-V rule above. A separate Windows Defender rule is needed for the Windows listener in the NAT fallback below.

### Fall back to a Windows port proxy

Use this only when mirrored networking is unavailable or does not work. Change `networkingMode` to `nat` in the same `.wslconfig`, save WSL work, and repeat step 2. Keep the HTTP site above.

**Administrator PowerShell:** run the address command from [Microsoft's NAT instructions](https://learn.microsoft.com/en-us/windows/wsl/networking#accessing-a-wsl-2-distribution-from-your-local-area-network-lan). Use the IPv4 address of this distribution as `connectaddress`, with the Windows LAN address as `listenaddress`. The example WSL address is `172.30.98.229`. The capital `I` matters. Forward to Caddy's port 80, never to a container port:

```text
wsl --distribution Ubuntu hostname -I
netsh interface portproxy add v4tov4 listenport=80 listenaddress=192.168.1.20 connectport=80 connectaddress=172.30.98.229
New-NetFirewallRule -Name "PortolabSampleHTTP" -DisplayName "Portolab sample HTTP" -Direction Inbound -Action Allow -Protocol TCP -LocalPort 80 -LocalAddress 192.168.1.20 -RemoteAddress LocalSubnet -Profile Private
```

The [Windows Defender rule](https://learn.microsoft.com/en-us/powershell/module/netsecurity/new-netfirewallrule) allows only the local subnet on the Private profile. The [port proxy](https://learn.microsoft.com/en-us/windows-server/administration/windows-commands/netsh-interface#portproxy) uses the current addresses of Windows and WSL. When either changes, remove the old proxy entry and the Windows Defender rule with the commands under removal. Then run the fallback commands again with both new addresses. The lecturer still opens the Windows address over HTTP.

### Serve the sample on the VPS

Use this instead of the home network site. Point a separate subdomain at the VPS as in [section 1](#1-point-the-domain-at-the-server), then use it in place of `sample.example.com`. These commands replace only the sample site file. They keep the live site:

```sh
cd /opt/portolab
echo 'import /opt/portolab/sample/Caddyfile sample.example.com' > /etc/caddy/portolab-sample.caddy
grep -qxF 'import /etc/caddy/portolab-sample.caddy' /etc/caddy/Caddyfile || echo 'import /etc/caddy/portolab-sample.caddy' >> /etc/caddy/Caddyfile
caddy validate --config /etc/caddy/Caddyfile
systemctl reload caddy
```

Open `https://sample.example.com` with that subdomain. Caddy obtains its HTTPS certificate as it does for the live site.

### Explore both roles

At the sample address, sign in with the lecturer credentials that the fill command printed. Use a separate browser profile or another device for a printed student account, because each profile keeps one sign-in. These accounts already have their names, passwords, and privacy agreement, so they open the class directly. The frame labels every page as sample data in both languages. A new student can join with the printed code or with the address shown by the join chip of the lecturer's class. Keep these credentials separate from real accounts, and enter no real student data in this disposable database.

### Reset the sample

This discards all work in the sample, including accounts that joined it. It stops only that service, deletes its database and SQLite side files, fills a fresh file, and starts it again. Keep the new credentials that the command prints:

```sh
cd /opt/portolab
docker compose stop sample
docker compose run --rm --no-deps sample sh -c 'rm -f "$DATABASE_PATH" "$DATABASE_PATH-wal" "$DATABASE_PATH-shm"'
docker compose run --rm --no-deps sample node server/sample-class.ts
docker compose --profile sample up --detach --wait sample
```

### Remove the sample

On Ubuntu, these commands remove only the sample container, its volume, and its Caddy site. The volume name follows the project folder `/opt/portolab`. Do not use `docker compose down --volumes`, because that would also remove the live data:

```sh
cd /opt/portolab
docker compose rm --stop --force sample
docker volume rm portolab_sample-data
sed -i '\|^import /etc/caddy/portolab-sample.caddy$|d' /etc/caddy/Caddyfile
rm /etc/caddy/portolab-sample.caddy
caddy validate --config /etc/caddy/Caddyfile
systemctl reload caddy
```

**Administrator PowerShell:** remove the Hyper-V rule when you created it:

```text
Remove-NetFirewallHyperVRule -Name "PortolabSampleHTTP"
```

When you used the NAT fallback, remove its proxy and Windows Defender rule too, with the Windows LAN address that you used when adding the proxy:

```text
netsh interface portproxy delete v4tov4 listenport=80 listenaddress=192.168.1.20
Remove-NetFirewallRule -Name "PortolabSampleHTTP"
```

The Windows network profile and WSL networking mode can stay as they are. Removing the sample changes no other site's network rules.

## Optional company logos

Portolab ships monogram tiles. The owner may supply company logos from a folder outside the checkout, as [decision 0059](decisions/0059-the-owner-supplies-company-logos-outside-the-repository.md) explains. The app serves accepted files itself, so readers never contact the source websites. [The prototype's source list](company-logo-sources.md) records its public addresses and which part of each mark it used. Download and inspect files yourself. The repository includes no trademarks or downloader that runs during startup, a build, or sample creation.

Prepare one file per stock code, with an uppercase name such as `BBCA.png`. Export a static, non-interlaced PNG with 8-bit RGBA pixels at 96 by 96 pixels, with at most 100,000 bytes. In an image editor, crop to the mark that reads at a small size and center it on a white square. For a mark at least 1.6 times wider than tall, leave 3 pixels on each horizontal edge. For a square mark, leave 8 pixels around its longest dimension. Keep the aspect ratio. The app uses the whole prepared tile at each display size and keeps its white ground in both themes.

Keep that folder outside `/opt/portolab`, for example at `/var/lib/portolab/company-logos`. The container user needs permission to traverse its parent folders and read the PNG files. These files are public images, so do not put private files in that folder. Portolab accepts regular files only, ignores other stock codes and formats, and logs a rejected or unreadable file while keeping its monogram. It reads the folder at startup, so restart each service after adding, replacing, or removing a tile.

For a laptop started without Docker, set `COMPANY_LOGOS_PATH` to your external folder before `pnpm start` or `pnpm dev`. Relative paths resolve from the directory where you start the server. When the variable is unset, all tiles keep their monograms. A missing image uses its monogram before JavaScript loads, and a failed image request returns to it after hydration.

### Prepare company logo files

As root, create the public folder and copy each prepared file into it. Replace `/root/logo-input/BBCA.png` with the path of your inspected tile, and keep its stock code as the destination name:

```sh
install --directory --mode=755 /var/lib/portolab/company-logos
install --mode=644 /root/logo-input/BBCA.png /var/lib/portolab/company-logos/BBCA.png
```

### Start with company logos

The optional [Compose override](../compose.logos.yaml) mounts the folder read-only in the live and sample services. These commands write `.env` in `/opt/portolab`, which names the override and the folder, and then start both services with the logos. Compose reads `.env` for every command in `/opt/portolab`, so an update, a backup, a restore, and a reset of the sample keep the logos. Git ignores `.env`, so `git pull` keeps it:

```sh
cd /opt/portolab
printf '%s\n' COMPOSE_FILE=compose.yaml:compose.logos.yaml COMPANY_LOGOS_PATH=/var/lib/portolab/company-logos > .env
docker compose up --detach --build --wait app
docker compose --profile sample up --detach --build --wait sample
```

Run the last command only when you use the sample service. Both services read the same public tiles and keep their own database volumes. When the folder is missing, Docker creates it empty, so every tile keeps its monogram and no backup or update stops. To reload tiles without rebuilding, run `docker compose restart app` and, when the sample runs, `docker compose restart sample`. Then reload open pages so they receive the new list of tiles.

### Stop company logos

These commands delete the `.env` that the commands of the previous section wrote, and then start both services again without the override, so every tile shows its monogram. Run the last command only when you use the sample service:

```sh
cd /opt/portolab
rm .env
docker compose up --detach --wait app
docker compose --profile sample up --detach --wait sample
```
