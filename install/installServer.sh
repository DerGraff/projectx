
current_user=$(whoami)

if [ "$current_user" = "root" ]; then
    sudo apt-get install openhab mosquitto
else
    echo "Please run as root"
fi
    
