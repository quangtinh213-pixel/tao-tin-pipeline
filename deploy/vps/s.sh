#!/usr/bin/env bash
# Bootstrap: thêm SSH key của Mac và bật SSH. Gõ trong console VPS.
mkdir -p ~/.ssh
grep -q 'IIphjB+KctKWoTsngnuU3VZrasbczl75MPaZBRyNzFyB' ~/.ssh/authorized_keys 2>/dev/null || \
  echo 'ssh-ed25519 AAAAC3NzaC1lZDI1NTE5AAAAIIphjB+KctKWoTsngnuU3VZrasbczl75MPaZBRyNzFyB vast-mac' >> ~/.ssh/authorized_keys
chmod 700 ~/.ssh; chmod 600 ~/.ssh/authorized_keys
command -v sshd >/dev/null || (apt-get update && apt-get install -y openssh-server)
# Sửa lỗi hay gặp trên VPS mới: thiếu host key, thiếu /run/sshd
ssh-keygen -A
mkdir -p /run/sshd && chmod 755 /run/sshd
echo "--- kiem tra cau hinh:"
/usr/sbin/sshd -t && echo "cau hinh OK"
systemctl daemon-reload
systemctl enable ssh >/dev/null 2>&1
systemctl restart ssh.socket 2>/dev/null
systemctl restart ssh
sleep 1
echo "--- trang thai:"
systemctl is-active ssh
journalctl -u ssh -n 8 --no-pager | cut -c1-150
ss -tlnp | grep -i ssh
echo "XONG"
