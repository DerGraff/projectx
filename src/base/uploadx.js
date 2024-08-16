const fs = require('fs-extra');
const path = require('path');

const os = require('os');
const { on } = require('events');
var platform = os.platform();
const Jsftp = require('jsftp');
const Client = require('ssh2-sftp-client');
const { constants } = require('buffer');

require('events').EventEmitter.prototype._maxListeners = 500;
require('events').defaultMaxListeners = 500;

process.on('warning', function (err) {
  if ('MaxListenersExceededWarning' == err.name) {
    console.log('o kurwa');
    // write to log function
    process.exit(1); // its up to you what then in my case script was hang

  }
});


function uploadDirectoryToFtp(src, dest) {
  var ftpConfigData = {
    "ftp": {
      "mode": "ftp",
      "ftpBaseDir": "/var/www/html/builds/pio",
      "cred": {
        "host": "192.168.0.222",
        "port": 21,
        // "user": "pi",
        // "password": "Wurst3000",
        "user": "ws",
        "password": "wsmagic123",
        "secure": false
      }
    }
  }
  ftpConfigData = ftpConfigData.ftp;

  example2(ftpConfigData, src, dest, () => {
    console.log("FTP Upload finished");
  }
  );
}

function getFtpConfigData() {
  var ftpConfigData = {
    "ftp": {
      "mode": "ftp",
      "ftpBaseDir": "/var/www/html/builds/pio",
      "cred": {
        "host": "192.168.0.222",
        "port": 21,
        "user": "ws",
        "password": "wsmagic123",
        // "user": "pi",
        // "password": "Wurst3000",
        "secure": false
      }
    }
  }
  ftpConfigData = ftpConfigData.ftp;
  return ftpConfigData;
}


function syncVideoDirectoryToFtp(src, dest) {
  var ftpConfigData = getFtpConfigData();

  syncVideos(ftpConfigData, src, dest, () => {
    console.log("FTP Upload finished");

  }
  );
}


function syncDirectory(sftp, localDir, remoteDir, onFinish = null, delayedFiles = []) {
  return fs.promises.readdir(localDir, { withFileTypes: true })
    .then(entries => {
      const immediateFiles = entries.filter(entry => !delayedFiles.includes(entry.name));
      const delayedFilesEntries = entries.filter(entry => delayedFiles.includes(entry.name));

      const uploadFile = (entry) => {
        const localPath = path.join(localDir, entry.name);
        let remotePath = path.join(remoteDir, entry.name);
        remotePath = remotePath.replace(/\\/g, '/'); // Replace backslashes with forward slashes

        if (entry.isDirectory()) {
          return sftp.mkdir(remotePath, true)
            .then(() => syncDirectory(sftp, localPath, remotePath, onFinish, delayedFiles)) // Recursively call syncDirectory for subdirectories
            .catch(err => {
              console.error('Error creating directory: ', err);
            });
        } else {
          return sftp.stat(remotePath)
            .then(remoteStat => {
              return fs.promises.stat(localPath)
                .then(localStat => {
                  if (localStat.mtime > remoteStat.mtime) {
                    return sftp.put(localPath, remotePath);
                  }
                });
            })
            .catch(() => {
              // If the file doesn't exist on the remote server, upload it
              return sftp.put(localPath, remotePath);
            });
        }
      };

      const immediatePromises = immediateFiles.reduce((promiseChain, entry) => {
        return promiseChain.then(() => uploadFile(entry));
      }, Promise.resolve()); // Start with a resolved promise

      return immediatePromises.then(() => {
        const delayedPromises = delayedFilesEntries.reduce((promiseChain, entry) => {
          return promiseChain.then(() => uploadFile(entry));
        }, Promise.resolve()); // Start with a resolved promise

        return delayedPromises;
      });
    })
    .then(() => {
      if (onFinish) {
        onFinish();
      }
    });
}

function onFinishCallback() {
  console.log("FTP Upload finished Callback");
}

function uploadDirectory(sftp, localDir, remoteDir, onFinish = null, delayedFiles = []) {
  return fs.promises.readdir(localDir, { withFileTypes: true })
    .then(entries => {
      const immediateFiles = entries.filter(entry => !delayedFiles.includes(entry.name));
      const delayedFilesEntries = entries.filter(entry => delayedFiles.includes(entry.name));

      const uploadFile = (entry) => {
        const localPath = path.join(localDir, entry.name);
        let remotePath = path.join(remoteDir, entry.name);
        remotePath = remotePath.replace(/\\/g, '/'); // Replace backslashes with forward slashes

        if (entry.isDirectory()) {
          return sftp.mkdir(remotePath, true)
            .then(() => uploadDirectory(sftp, localPath, remotePath, onFinish, delayedFiles)) // Recursively call uploadDirectory for subdirectories
            .catch(err => {
              console.error('Error creating directory: ', err);
            });
        } else {
          return sftp.put(localPath, remotePath);
        }
      };

      const immediatePromises = immediateFiles.reduce((promiseChain, entry) => {
        return promiseChain.then(() => uploadFile(entry));
      }, Promise.resolve()); // Start with a resolved promise

      return immediatePromises.then(() => {
        console.log("Delayed Files: " + delayedFilesEntries.length);
        const delayedPromises = delayedFilesEntries.reduce((promiseChain, entry) => {
          return promiseChain.then(() => uploadFile(entry));
        }, Promise.resolve()); // Start with a resolved promise

        return delayedPromises;
      });
    })
    .then(() => {
      if (onFinish) {
        console.log("FTP Upload finished");
        onFinish();
      }
    });
}

function syncVideos(ftpConfigData, sourceDirectory, targetDirectory, onFinish) {
  const { cred, ftpBaseDir } = ftpConfigData;

  const sftp = new Client();

  sftp.connect({
    host: cred.host,
    username: cred.user,
    password: cred.password
  })
    .then(() => uploadDirectory(sftp, sourceDirectory, "/var/www/html/" + targetDirectory, onFinishCallback, []))
    .then(() => {
      sftp.end();

      onFinish();
    })
    .catch(err => {
      console.error(err);
    });
}

function example2(ftpConfigData, sourceDirectory, targetDirectory, onFinish) {
  const { cred, ftpBaseDir } = ftpConfigData;

  const sftp = new Client();
  console.log("Copy to -> /var/www/html/" + targetDirectory + " from " + sourceDirectory)
  sftp.connect({
    host: cred.host,
    username: cred.user,
    password: cred.password
  })
    .then(() => uploadDirectory(sftp, sourceDirectory, "/var/www/html/" + targetDirectory, onFinishCallback, ["latest.yml"]))
    .then(() => {
      sftp.end();

      onFinish();
    })
    .catch(err => {
      console.error(err);
    });
}

function example(ftpConfigData, sourceDirectory, targetDirectory, onFinish) {
  const { cred, ftpBaseDir } = ftpConfigData;
  console.log("Start FTP Upload");
  console.log("FTP Base Dir: " + ftpBaseDir);
  console.log("FTP Source Dir:" + sourceDirectory);
  console.log("FTP Target Dir: " + targetDirectory);

  const ftp = new Jsftp({
    host: cred.host,
    port: cred.port,
    user: cred.user,
    pass: cred.password
  });



  console.log("Credentials: " + cred.host + ":" + cred.port + " " + cred.user + ":" + cred.password)

  fs.readdir(sourceDirectory, (err, files) => {
    if (err) {
      console.error("Error reading source directory:");
      console.error(err);
      onFinish();
      return;
    }

    let uploadCount = 0;
    for (let file of files) {
      let localFilePath = path.join(sourceDirectory, file);
      let remoteFilePath = "/var/www/html/" + path.join(targetDirectory, file);

      ftp.put(localFilePath, remoteFilePath, (err) => {
        if (err) {
          console.error(`Error uploading ${file}:`);
          console.error(err);
        } else {
          console.log(`${file} uploaded successfully!`);
        }

        uploadCount++;
        if (uploadCount === files.length) {
          onFinish();
        }
      });
    }
  });
}

function copyToAppsDirectroy(projectInfoData, exclude = []) {
  var dirName = projectInfoData.project.dirName;
  var targetName = projectInfoData.project.target;
  var productName = projectInfoData.project.name;
  // console.log("DirName: " + dirName + " TargetName: " + targetName + " ProductName: " + productName)
  const sourcePath = path.join(dirName, 'dist', 'electron', "Packaged");

  if (targetName == "" || productName == "") {
    console.log("copyToAppsDirectroy: No Target or Product Name");
    return;
  }

  var targetPath = "C:\\build\\quasar\\apps\\"

  if (platform === 'win32') {
    targetPath = "C:\\build\\quasar\\apps\\" + targetName + "\\" + productName
  }
  else {
    targetPath = "/build/quasar/apps/" + targetName + "/" + productName
  }



  copyToDirectroy(sourcePath, targetPath, false, exclude);

  if (projectInfoData.is.quasar) {
    targetPath = targetPath + "/latest"
    copyToDirectroy(sourcePath, targetPath, true, [...exclude, "win-unpacked"]);
  }
}

function compareVersions(version1, version2) {
  const v1 = version1.split('.').map(Number);
  const v2 = version2.split('.').map(Number);
  
  for (let i = 0; i < v1.length; i++) {
    if (v1[i] > v2[i]) {
      return 1;
    } else if (v1[i] < v2[i]) {
      return -1;
    }
  }

  return 0;
}

function copyToAppsDirectroyPio(projectInfoData, exclude = []) {
  var dirName = projectInfoData.project.dirName;
  var targetName = projectInfoData.project.target;
  var productName = projectInfoData.project.productName;
  console.log("DirName: " + dirName + " TargetName: " + targetName + " ProductName: " + productName)
  var buildPath = path.join(dirName, '.pio', 'build');

  for (var dir of fs.readdirSync(buildPath)) {
    //if is dir
    if (fs.lstatSync(path.join(buildPath, dir)).isDirectory()) {
      console.log("Dir: " + dir)
      var targetName2 = dir;
      var latestVersion = "0.0.0";
      var targetPath = "C:\\build\\pio\\apps\\" + productName + "\\" + targetName2;

      const latestJsonPath = path.join(targetPath, 'latest.json');

      if (!fs.existsSync(latestJsonPath)) {
        const initialJson = {
          builds: {
            latest: ''
          },
          latest: '',
        };
        fs.writeFileSync(latestJsonPath, JSON.stringify(initialJson, null, 2));
      }

      const latestJson = JSON.parse(fs.readFileSync(latestJsonPath, 'utf8'));

      if(!latestJson.builds) {
        latestJson.builds = {};
      }

      if(!latestJson.latest) {
        latestJson.latest = '0.0.0';
      }

      console.log("Latest Version: " + latestJson.latest, latestJson);


      fs.readdirSync(path.join(buildPath, dir)).forEach((file) => {
        if (file.includes("firmware")) {
          var extType = path.extname(file);
          //example fileName firmware_002.00078.00106.bin
          var version = file.split("_")[1].split(".")[0];
          var fullVersion = file.split("_")[1].split(".")[0] + "." + file.split("_")[1].split(".")[1] + "." + file.split("_")[1].split(".")[2].split(".")[0]; 7
          if(compareVersions(fullVersion, latestVersion) > 0) {
            latestVersion = fullVersion;
          }
          

          if (!latestJson.builds.hasOwnProperty(file)) {
            latestJson.builds[file] = version;
          }
          var sourcePath = path.join(buildPath, dir, file);
          if (extType == ".bin") {
            console.log("Source: " + sourcePath + " Target: " + targetPath + " Version: " + version + " FullVersion: " + fullVersion + " Ext: " + extType);
            if (!fs.existsSync(targetPath)) {
              console.log("Create Directory: " + targetPath);
              fs.mkdirSync(targetPath, { recursive: true });
            }

            fs.copyFileSync(sourcePath, targetPath + "\\" + file);
          }
          // copyToDirectroy(sourcePath, targetPath, false, exclude);
        }
        // console.log("File: " + file);

      });
      console.log("Latest Version: " + latestVersion);
      if (latestVersion != "0.0.0") {
        var sourcePath = path.join(buildPath, dir, "firmware_" + latestVersion + ".bin");
        var targetPath = "C:\\build\\pio\\apps\\" + productName + "\\" + targetName2 ;
        console.log("Source: " + sourcePath + " Target: " + targetPath + " Version: " + latestVersion);
        if (!fs.existsSync(targetPath)) {
          fs.mkdirSync(targetPath, { recursive: true });
        }
        fs.copyFileSync(sourcePath, targetPath + "\\latest.bin");
      }



      const binFiles = fs.readdirSync(targetPath).filter(file => file.endsWith('.bin'));

      if(compareVersions(latestJson.latest, latestVersion) < 0) {
        latestJson.latest = latestVersion;
      }

      fs.writeFileSync(latestJsonPath, JSON.stringify(latestJson, null, 2));
    }
  }


  if (targetName == "" || productName == "") {
    console.log("copyToAppsDirectroy: No Target or Product Name");
    return;
  }

  return;
  copyToDirectroy(sourcePath, targetPath, false, exclude);

  if (projectInfoData.is.quasar) {
    targetPath = targetPath + "/latest"
    copyToDirectroy(sourcePath, targetPath, true, [...exclude, "win-unpacked"]);
  }

}

function copyToDirectroy(sourcePath, targetPath, clear = false, exclude = []) {
  console.log("After build Copy from " + sourcePath + " to " + targetPath + "");

  if (clear) {
    fs.removeSync(targetPath);
  }

  fs.ensureDirSync(targetPath); // Create target directory if it doesn't exist

  if (exclude.length > 0) {
    // console.log("Exclude: " + exclude)
    fs.copySync(sourcePath, targetPath, {
      filter: (src, dest) => {
        // console.log("src: " + src + " dest: " + dest + "base: " + path.basename(src) + " exclude: " + JSON.stringify(exclude) + " " + !exclude.includes(path.basename(src)));
        return !exclude.includes(path.basename(src))
      }
    }); // Copy the directory recursively without the exclude files
  }
  else {
    fs.copySync(sourcePath, targetPath); // Copy the directory recursively
  }


  console.log("Copy completed successfully.");
}

module.exports = { uploadDirectoryToFtp, copyToAppsDirectroy, copyToAppsDirectroyPio };