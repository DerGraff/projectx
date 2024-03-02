
git config --global credential.helper store
sudo apt-get -y install cec-utils

# currentuser=$(whoami)
current_user="pi"
echo "Installing Dirs"

if [ ! -d "/progs" ]; then
    sudo mkdir /progs
    sudo chown -R $currentuser:$currentuser /progs/
fi

if [ ! -d "/progs/nodejs" ]; then
    mkdir /progs/nodejs
fi

if [ ! -d "/progs/nodejs/nodelocal" ]; then
    mkdir /progs/nodejs/nodelocal
fi

if [ ! -d "/progs/quasar" ]; then
    mkdir /progs/quasar
fi

echo "Installing ClientService"
git -C /progs/nodejs/nodelocal clone https://ws-hub.de/node/libs/clientservice.git
git -C /progs/nodejs/nodelocal/clientservice/ pull && npm ci --prefix /progs/nodejs/nodelocal/clientservice
npm link --prefix /progs/nodejs/nodelocal/clientservice


echo "Installing VideoApp"

if [ ! -d "/progs/quasar/videoApp" ]; then
    echo "Cloning ClientLinuxService"
    git -C /progs/quasar/ clone https://ws-hub.de/quasar/videoApp.git
fi

cd /progs/quasar/videoApp && npm ci && quasar build -m electron

echo "Installing ClientLinuxService"
git -C /progs/nodejs/ clone https://ws-hub.de/node/apps/clientlinuxservice.git && cd /progs/nodejs/clientlinuxservice/ && npm install
# sudo ln -s "$NVM_DIR/versions/node/$(nvm version)/lib/node_modules/npm" "/usr/local/bin/npm"
# sudo ln -s "$NVM_DIR/versions/node/$(nvm version)/bin/node" "/usr/local/bin/node"
cd /progs/nodejs/clientlinuxservice/ && sudo node install.js

sudo adduser ws dialout && sudo service clientservice start && sudo systemctl enable clientservice.service
 
git -C /progs/quasar/ clone https://ws-hub.de/quasar/videoApp.git && cd /progs/quasar/videoApp && npm ci && quasar build -m electron

echo "Installing ClientLinuxService"
git -C /progs/nodejs/ clone https://ws-hub.de/node/apps/clientlinuxservice.git && cd /progs/nodejs/clientlinuxservice/ && npm install
# sudo ln -s "$NVM_DIR/versions/node/$(nvm version)/lib/node_modules/npm" "/usr/local/bin/npm"
# sudo ln -s "$NVM_DIR/versions/node/$(nvm version)/bin/node" "/usr/local/bin/node"
cd /progs/nodejs/clientlinuxservice/ && sudo node install.js

sudo adduser ws dialout && sudo service clientservice start && sudo systemctl enable clientservice.service