#!/bin/bash

# Step 1: Install Chocolatey (if not installed)
if ! command -v choco &> /dev/null
then
    echo "Chocolatey not found. Installing..."
    powershell -Command "Set-ExecutionPolicy Bypass -Scope Process -Force; [System.Net.ServicePointManager]::SecurityProtocol = [System.Net.ServicePointManager]::SecurityProtocol -bor 3072; iex ((New-Object System.Net.WebClient).DownloadString('https://community.chocolatey.org/install.ps1'))"
    echo "Chocolatey installed. Restart your terminal and rerun the script."
    exit 1
fi

# Step 2: Install Node.js and npm
echo "Installing Node.js..."
choco install nodejs -y

# Step 3: Add npm to PATH (optional, should be automatic)
echo "Setting PATH for npm..."
export PATH="$PATH:/c/Program Files/nodejs:/c/Users/$USER/AppData/Roaming/npm"

# Step 4: Verify installation
echo "Checking installed versions..."
node -v
npm -v

echo "Node.js and npm installation completed!"
