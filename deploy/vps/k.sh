#!/usr/bin/env bash
# Bootstrap: thêm SSH key của Mac và bật SSH. Gõ trong console VPS.
mkdir -p ~/.ssh
grep -q 'IIphjB+KctKWoTsngnuU3VZrasbczl75MPaZBRyNzFyB' ~/.ssh/authorized_keys 2>/dev/null || \
  echo 'ssh-ed25519 AAAAC3NzaC1lZDI1NTE5AAAAIIphjB+KctKWoTsngnuU3VZrasbczl75MPaZBRyNzFyB vast-mac' >> ~/.ssh/authorized_keys
chmod 700 ~/.ssh; chmod 600 ~/.ssh/authorized_keys
command -v sshd >/dev/null || (apt-get update && apt-get install -y openssh-server)
systemctl enable --now ssh
ss -tlnp | grep -i ssh
echo "XONG"
