#!/bin/sh
# Monte le dossier partagé du NAS (NFS) sur /mnt/nas-sauvegardes, de façon permanente.
# Usage : ~/installer_montage_nas.sh            (affiche les partages proposés par le NAS)
#         ~/installer_montage_nas.sh /volume1/sauvegardes-serveur
set -e
NAS=${NAS:-192.168.1.10}   # adresse du NAS (à adapter)
POINT=/mnt/nas-sauvegardes
sudo DEBIAN_FRONTEND=noninteractive apt-get install -y -q nfs-common >/dev/null
echo "Partages NFS proposés par le NAS à ce serveur :"
/sbin/showmount -e "$NAS" || true
[ -n "$1" ] || { echo "Relancez avec le chemin du partage, par exemple : $0 /volume1/sauvegardes-serveur"; exit 0; }
sudo mkdir -p "$POINT"
LIGNE="$NAS:$1 $POINT nfs defaults,_netdev,nofail,x-systemd.automount,x-systemd.mount-timeout=30,soft,timeo=150,retrans=3 0 0"
sudo cp /etc/fstab "$HOME/sauvegardes/fstab_$(date +%Y%m%d-%H%M%S)"
grep -v " $POINT " /etc/fstab | sudo tee /etc/fstab.nouveau >/dev/null
echo "$LIGNE" | sudo tee -a /etc/fstab.nouveau >/dev/null
sudo mv /etc/fstab.nouveau /etc/fstab
sudo systemctl daemon-reload
sudo mount "$POINT"
mountpoint -q "$POINT" && echo "MONTAGE_OK : $NAS:$1 sur $POINT"
mkdir -p "$POINT/lambretta" && touch "$POINT/lambretta/.test-ecriture" && rm "$POINT/lambretta/.test-ecriture" && echo "ECRITURE_OK"
