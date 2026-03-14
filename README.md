# Nutri-Paw

A website with a backend designed for applications to track and monitor pet food and medication intake.

## Setup

Follow these steps to get the project running on your local machine:

1. **Install NVM for Windows** Download and run the installer: [nvm-setup.exe](https://github.com/coreybutler/nvm-windows/releases/download/1.2.2/nvm-setup.exe).

2. **Install Node.js** Open your Command Prompt (`cmd`) and run the following commands to install and use the latest version of Node.js:
    ```bash
    nvm install latest
    nvm use <installed_version_number>
   
3.  **Install Dependencies and Start the Server** Open a new Command Prompt inside the project directory and run:
    ```bash
    npm install
    node server.js

4. **Verify the Application** Once running, you should see the following message in your terminal:

**Nutripaw app listening on port 3000**

You can access the main application at: http://localhost:3000

To verify the backend is working and see dummy data, try visiting: http://localhost:3000/api/getSampleData