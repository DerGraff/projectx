
current_user=$(whoami)

if [ "$current_user" = "root" ]; then
    echo "Please run this script as a non-root user"
    exit 1
else
     if ! command -v nvm &> /dev/null; then
        wget -qO- https://raw.githubusercontent.com/nvm-sh/nvm/v0.39.7/install.sh | bash
        export NVM_DIR="$HOME/.nvm"
        [ -s "$NVM_DIR/nvm.sh" ] && \. "$NVM_DIR/nvm.sh"  # This loads nvm
        [ -s "$NVM_DIR/bash_completion" ] && \. "$NVM_DIR/bash_completion"  # This loads nvm bash_completion
        sudo ln -s "$NVM_DIR/versions/node/$(nvm version)/bin/node" "/usr/local/bin/node"
    fi

    if [[ "$(node -v)" != "v18.17.1" ]]; then
        nvm install v18.17.1
    fi

    sudo apt-get -y install cec-utils

    if [ ! -d "/progs" ]; then
        sudo mkdir /progs
    fi

    if [ ! -d "/progs/nodejs" ]; then
        sudo mkdir /progs/nodejs
    fi

    if [ ! -d "/progs/nodejs/nodelocal" ]; then
        sudo mkdir /progs/nodejs/nodelocal
    fi

    if [ ! -d "/progs/quasar" ]; then
        sudo mkdir /progs/quasar
    fi

    sudo chown -R $current_user:$current_user /progs/

    npm install -g @quasar/cli
fi


