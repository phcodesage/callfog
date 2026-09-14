#!/usr/bin/env bash
# Deploy the Callfog backend to an EC2 host (Amazon Linux 2023 with Docker + Compose).
#
#   SSH_KEY=~/path/key.pem ./infra/deploy.sh ec2-user@18.189.241.100 18-189-241-100.sslip.io
#
# Secrets are generated on the server on first deploy and never leave it.
set -euo pipefail

TARGET=${1:?usage: deploy.sh user@host public-hostname}
PUBLIC_HOST=${2:?usage: deploy.sh user@host public-hostname}
ALLOWED_ORIGINS=${ALLOWED_ORIGINS:-https://callfog.pages.dev,http://localhost:3000}
SSH_KEY=${SSH_KEY:-}
REMOTE_DIR=/opt/callfog

ssh_opts=(-o ConnectTimeout=20)
[[ -n "$SSH_KEY" ]] && ssh_opts+=(-i "$SSH_KEY")

cd "$(dirname "$0")"

ssh "${ssh_opts[@]}" "$TARGET" "sudo mkdir -p $REMOTE_DIR && sudo chown \$(id -u):\$(id -g) $REMOTE_DIR"
tar czf - docker-compose.yml Caddyfile livekit.yaml.template token/package.json token/Dockerfile token/server.js \
  | ssh "${ssh_opts[@]}" "$TARGET" "tar xzf - -C $REMOTE_DIR"

ssh "${ssh_opts[@]}" "$TARGET" PUBLIC_HOST="$PUBLIC_HOST" ALLOWED_ORIGINS="$ALLOWED_ORIGINS" bash -s <<'REMOTE'
set -euo pipefail
cd /opt/callfog

if [[ ! -f .env ]]; then
  umask 077
  cat > .env <<EOF
LIVEKIT_API_KEY=API$(openssl rand -hex 8)
LIVEKIT_API_SECRET=$(openssl rand -base64 36 | tr -d '/+=\n')
CREATOR_SECRET=$(openssl rand -base64 36 | tr -d '/+=\n')
EOF
  echo "Generated new secrets in /opt/callfog/.env"
fi

# Non-secret settings are refreshed on every deploy.
sed -i '/^PUBLIC_HOST=/d; /^ALLOWED_ORIGINS=/d' .env
printf 'PUBLIC_HOST=%s\nALLOWED_ORIGINS=%s\n' "$PUBLIC_HOST" "$ALLOWED_ORIGINS" >> .env

old_config_sum=$(sha256sum livekit.yaml 2>/dev/null | cut -d' ' -f1 || true)
sed "s/__PUBLIC_HOST__/$PUBLIC_HOST/g" livekit.yaml.template > livekit.yaml
new_config_sum=$(sha256sum livekit.yaml | cut -d' ' -f1)

sudo docker compose up -d --build --remove-orphans

# livekit.yaml is a bind mount, so Compose doesn't notice content changes. Restarting also
# makes LiveKit rediscover its public IP (e.g. after attaching an Elastic IP).
if [[ "$old_config_sum" != "$new_config_sum" ]]; then
  echo "livekit.yaml changed, restarting LiveKit"
  sudo docker compose restart livekit
fi
sudo docker compose ps
REMOTE

echo "Deployed. Health: https://$PUBLIC_HOST/healthz"
