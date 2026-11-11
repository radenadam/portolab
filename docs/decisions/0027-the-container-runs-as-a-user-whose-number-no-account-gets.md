# 0027. The container runs as a user whose number no account of the server gets

- Status: Accepted
- Date: 2026-11-11

## Context

The image of Node gives its user `node` the number 1000, and the container of Portolab ran the server as that user. Docker runs the process on the server with the same number, and Ubuntu gives that number to the first account of a person. Linux lets a process open `/proc/<pid>/root` of another process when both run with the same user number, as [proc_pid_root(5)](https://man7.org/linux/man-pages/man5/proc_pid_root.5.html) and the access checks of [ptrace(2)](https://man7.org/linux/man-pages/man2/ptrace.2.html) describe, and that link leads to every file that the other process sees. The setting `ptrace_scope` 1 of Ubuntu restricts only a debugger that attaches. AppArmor lets an unconfined process through, as `profile_tracee_perm` in `security/apparmor/task.c` of Linux shows, and the shell of an account runs unconfined. So the first account of a person on a server read the database of Portolab without root, as issue #115 records.

## Decision

- The image creates a user and a group `portolab` with one number of their own. The container runs the server and every command of the deployment guide as that user, and the folder of the database belongs to it.
- The number lies from 60706 to 61183, which Ubuntu and systemd give no account, so the server must give no account a number from that range. Ubuntu gives accounts of persons the numbers from 1000 to 59999 through `adduser` and up to 60000 through `useradd`, and it gives system accounts numbers below 1000, as [adduser.conf(5)](https://manpages.ubuntu.com/manpages/noble/en/man5/adduser.conf.5.html) and [login.defs(5)](https://manpages.ubuntu.com/manpages/noble/en/man5/login.defs.5.html) set them. Each account also gets subordinate numbers from 100000 upwards, which it can use in a namespace of users. systemd gives the numbers from 60001 to 60705 and from 61184 to 65519 to users of its own, and it leaves the numbers from 60706 to 61183 unused, as [its list of ranges](https://systemd.io/UIDS-GIDS/) shows.
- The number stays below 65536, because a Docker that runs rootless or with the option `userns-remap` gives a container the numbers from 0 to 65535 only, as its documentation sets them up. A user with a higher number would have no number on the server there.
- After the deployment test follows the guide, it checks that a process with the numbers of the first account of a person cannot read a file of the database, through the process of the container or through the folder of the volume.

## Alternatives

- **The user `node`.** AppArmor does not stop an unconfined process, as the context explains, and WSL runs without AppArmor.
- **Docker with the option `userns-remap`.** Docker would then run every container with numbers that no account gets. But the option is a setting of the Docker of the server, which may also run other work, and it hides the images and the containers that Docker had before, as [its documentation](https://docs.docker.com/engine/security/userns-remap/) warns. The guide never changes such software.
- **root in the container.** Only root on the server has the number 0. But the [best practices of Docker](https://docs.docker.com/build/building/best-practices/#user) ask a service that can run without privileges to run as another user, and Portolab needs no privilege.

## Consequences

- An installation from before this decision gives its database to the new user once, before its next update, as the [deployment guide](../deploy.md#update-portolab) explains.
- The deployment guide asks for a server without an account in that range, because `useradd --uid` or a directory of accounts, such as LDAP, can give an account any number.
