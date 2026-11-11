#!/bin/sh
# Ferme au réseau les ports de Supabase (54320-54329) : seul le serveur lui-même (nginx) y accède.
# Règles réappliquées à chaque démarrage de Docker (service supabase-pare-feu). Ferme aussi rpcbind (port 111).
set -e
sudo tee /usr/local/sbin/supabase-pare-feu >/dev/null <<"EOF"
#!/bin/sh
# Bloque l accès réseau aux ports Supabase ; idempotent.
IF=$(ip route show default | awk "{print \$5; exit}")
PORTS=54320:54329
regle() { "$1" -C "$2" $3 2>/dev/null || "$1" -I "$2" 1 $3; }
# Trafic redirigé par Docker vers les conteneurs (chaîne prévue pour les règles de l administrateur)
regle iptables DOCKER-USER "-i $IF -p tcp -m conntrack --ctorigdstport $PORTS --ctdir ORIGINAL -j DROP"
# Accès direct au relais de Docker (IPv4 et IPv6)
regle iptables INPUT "-i $IF -p tcp --dport $PORTS -j DROP"
regle ip6tables INPUT "-i $IF -p tcp --dport $PORTS -j DROP"
echo "pare-feu Supabase actif sur $IF (ports $PORTS)"
EOF
sudo chmod 755 /usr/local/sbin/supabase-pare-feu
sudo tee /etc/systemd/system/supabase-pare-feu.service >/dev/null <<"EOF"
[Unit]
Description=Ferme au reseau les ports Supabase (54320-54329)
After=docker.service network-online.target
Wants=network-online.target
PartOf=docker.service

[Service]
Type=oneshot
RemainAfterExit=yes
ExecStart=/usr/local/sbin/supabase-pare-feu

[Install]
WantedBy=multi-user.target docker.service
EOF
sudo systemctl daemon-reload
sudo systemctl enable --now supabase-pare-feu.service
sudo systemctl restart supabase-pare-feu.service
echo "--- règles en place :"; sudo iptables -S DOCKER-USER | grep 5432; sudo iptables -S INPUT | grep 5432; sudo ip6tables -S INPUT | grep 5432
echo "--- rpcbind (inutile pour NFS 4.1)"
sudo systemctl disable --now rpcbind.socket rpcbind.service 2>&1 | tail -1 || true
sudo systemctl mask rpcbind.socket rpcbind.service >/dev/null 2>&1 || true
ls /mnt/nas-sauvegardes/lambretta >/dev/null && echo "NAS toujours accessible"
echo "PARE_FEU_OK"
