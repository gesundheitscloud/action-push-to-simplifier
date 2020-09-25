const core = require("@actions/core");
const github = require("@actions/github");
const fetch = require("node-fetch");

const { zipDirs } = require("./src/zip.js");

const DIRECTORIES = core
  .getInput("directories")
  .split(" ")
  .filter((x) => x !== "");

const PROJECT_NAME = core.getInput("project_name");
const API_URL = `https://api.simplifier.net/${PROJECT_NAME}/zip`;

const TOKEN_URL = `https://api.simplifier.net/token`;

const SIMPLIFIER_EMAIL = core.getInput("simplifier_email");
const SIMPLIFIER_PASSWORD = core.getInput("simplifier_password");

function fetchAccessToken(email, password) {
  return fetch(TOKEN_URL, {
    method: "POST",
    body: JSON.stringify({
      Email: email,
      Password: password,
    }),
    headers: {
      "Content-Type": "application/json",
    },
  })
    .then((res) => res.json())
    .then((res) => res.token);
}

async function execute() {
  try {
    return await Promise.all([
      zipDirs(__dirname + "/simplifier.zip", DIRECTORIES),
      fetchAccessToken(SIMPLIFIER_EMAIL, SIMPLIFIER_PASSWORD),
    ])
      .then(async ([{ zipFileStream, fileSizeInBytes }, accessToken]) => {
        const options = {
          method: "PUT",
          body: zipFileStream,
          headers: {
            "content-type": "application/octet-stream",
            "Content-length": fileSizeInBytes,
            Authorization: `Bearer ${accessToken}`,
          },
        };

        return fetch(API_URL, options);
      })
      .then((res) => {
        switch (res.status) {
          case 200:
            console.log(
              `Success, ${DIRECTORIES.toString()} have been uploaded to ${PROJECT_NAME}`
            );
            break;
          default:
            core.setFailed(res.statusText);
            break;
        }
      });
  } catch (error) {
    core.setFailed(error.message);
  }
}

module.exports = execute;
execute();
