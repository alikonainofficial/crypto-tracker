const readline = require("readline-sync");
const csv = require("csv-parser");
const fs = require("fs");
const NodeCache = require("node-cache");
var fsStream = {};
var csvStream = {};

const cache = new NodeCache();
const { CURRENCY } = require("./contants");
const {
  getAmountInUSD,
  processData,
  processDataInit,
  isValidDate,
} = require("./utils");

const initStreamConnection = () => {
  fsStream = fs.createReadStream("./transactions.csv");
  csvStream = csv();
};

const initApp = () => {
  initStreamConnection();

  let count = 0;
  let maxLines = 100;

  console.log("\nBuilding cache...");

  // Iterating over first 100 elements of the file to fetch and store token names in cache
  // ideally this should be done on the entire file in case some tokens appear on a line that's after line 100
  // but for simplicity and fast application startup, I'm only iterating over the first 100 rows

  fsStream
    .pipe(csvStream)
    .on("data", (data) => {
      if (count >= maxLines) {
        fsStream.unpipe(csvStream);
        csvStream.end();
        fsStream.destroy();
      } else {
        if (!cache.has(data["token"])) {
          cache.set(data["token"]);
        }
        count++;
      }
    })
    .on("end", () => {
      console.log("****************Cache built successfully!*****************");
      showInstructions();
    });
};

const displayResults = async (dataSet, token = null, timeStamp = null) => {
  if (Object.keys(dataSet).length === 0) {
    let error = "";
    if (token == null && timeStamp == null) {
      error = "Unable to find data.";
    } else if (token == null) {
      error = "Unable to find data for provided date.";
    } else if (timeStamp == null) {
      error = `Unable to find data for ${token}.`;
    } else {
      error = "Unable to find data for provided date and token.";
    }
    console.log(error);
    return;
  }
  for (var data in dataSet) {
    try {
      let rate = await getAmountInUSD(data, CURRENCY);
      dataSet[data]["convertedValue"] = Number(
        Number(dataSet[data]["value"].toFixed(6)) * rate
      ).toFixed(2);
      console.log(
        `You have ${dataSet[data]["value"].toFixed(6)} ${data} = ${
          dataSet[data]["convertedValue"]
        } ${CURRENCY}.`
      );
    } catch (error) {
      console.log(error.message);
    }
  }
};

const showLatestPortfolio = () => {
  initStreamConnection();

  let dataSet = {};

  let count = 0;
  let maxLines = 10000;

  fsStream
    .pipe(csvStream)
    .on("data", (data) => {
      if (count >= maxLines) {
        fsStream.unpipe(csvStream);
        csvStream.end();
        fsStream.destroy();
      } else {
        if (dataSet[data["token"]]) {
          processData(dataSet, data);
        } else {
          processDataInit(dataSet, data);
        }
        count++;
      }
    })
    .on("end", () => {
      displayResults(dataSet);
    });
};

const showTokenBasedLatestPortfolio = (token) => {
  initStreamConnection();

  let dataSet = {};

  let count = 0;
  let maxLines = 10000;

  fsStream
    .pipe(csvStream)
    .on("data", (data) => {
      if (count >= maxLines) {
        fsStream.unpipe(csvStream);
        csvStream.end();
        fsStream.destroy();
      } else {
        if (data["token"] == token) {
          if (dataSet[data["token"]]) {
            processData(dataSet, data);
          } else {
            processDataInit(dataSet, data);
          }
        }
        count++;
      }
    })
    .on("end", () => {
      displayResults(dataSet, token);
    });
};

const showDateBasedPortfolio = (timeStamp) => {
  initStreamConnection();
  let dataSet = {};

  let count = 0;
  let maxLines = 10000;

  let isTimeStampFound = false;

  fsStream
    .pipe(csvStream)
    .on("data", (data) => {
      if (count >= maxLines) {
        fsStream.unpipe(csvStream);
        csvStream.end();
        fsStream.destroy();
      } else {
        if (isTimeStampFound) {
          if (dataSet[data["token"]]) {
            processData(dataSet, data);
          }
        }
        if (
          (!isTimeStampFound || !dataSet[data["token"]]) &&
          data["timestamp"] <= timeStamp
        ) {
          isTimeStampFound = true;
          processDataInit(dataSet, data);
        }
        count++;
      }
    })
    .on("end", () => {
      displayResults(dataSet, null, timeStamp);
    });
};

const showDateAndTokenBasedPortfolio = (token, timeStamp) => {
  initStreamConnection();

  let dataSet = {};

  let count = 0;
  let maxLines = 10000;

  let isTimeStampFound = false;

  fsStream
    .pipe(csvStream)
    .on("data", (data) => {
      if (count >= maxLines) {
        fsStream.unpipe(csvStream);
        csvStream.end();
        fsStream.destroy();
      } else {
        if (isTimeStampFound && data["token"] == token) {
          if (dataSet[data["token"]]) {
            processData(dataSet, data);
          }
        }
        if (
          (!isTimeStampFound || !dataSet[data["token"]]) &&
          data["timestamp"] <= timeStamp &&
          data["token"] == token
        ) {
          isTimeStampFound = true;
          processDataInit(dataSet, data);
        }
        count++;
      }
    })
    .on("end", () => {
      displayResults(dataSet, token, timeStamp);
    });
};

const performAction = (option) => {
  if (option == 1) {
    showLatestPortfolio();
  } else if (option == 2) {
    process.stdout.write("Enter your token: ");
    let token = readline.question();
    //check if token exists in cache
    if (cache.has(token.trim().toUpperCase())) {
      showTokenBasedLatestPortfolio(token.trim().toUpperCase());
    } else {
      console.log("Unable to find the token.");
    }
  } else if (option == 3) {
    process.stdout.write("Enter the date (e.g. 2011-05-20): ");
    let dayEndTimeStamp = new Date(readline.question() + " UTC");
    if (isValidDate(dayEndTimeStamp)) {
      //set the time to exact 23 hour, 59 minutes, 59 seconds for the entered date to get precise data
      dayEndTimeStamp.setUTCHours(23, 59, 59, 999);
      dayEndTimeStamp = Math.floor(dayEndTimeStamp.getTime() / 1000.0);
      showDateBasedPortfolio(dayEndTimeStamp);
    }
  } else if (option == 4) {
    process.stdout.write("Enter the date (e.g. 2011-05-20): ");
    let dayEndTimeStamp = new Date(readline.question() + " UTC");
    if (isValidDate(dayEndTimeStamp)) {
      dayEndTimeStamp.setUTCHours(23, 59, 59, 999);
      dayEndTimeStamp = Math.floor(dayEndTimeStamp.getTime() / 1000.0);
      process.stdout.write("Enter your token: ");
      let token = readline.question();
      if (cache.has(token.trim().toUpperCase())) {
        showDateAndTokenBasedPortfolio(
          token.trim().toUpperCase(),
          dayEndTimeStamp
        );
      } else {
        console.log("Unable to find the token.");
      }
    }
  } else {
    console.log("Invalid option.");
  }
};

const showInstructions = () => {
  var option = -1;
  console.log(
    "\n\n******************Welcome to Cypto Tracker!*********************\nPlease choose one of the following options:\n"
  );

  console.log("\n\nPress 1 to show latest portfolio value per token in USD");
  console.log(
    "Press 2 to show latest portfolio value in USD for your entered token"
  );
  console.log(
    "Press 3 to show portfolio value per token in USD based on your entered date"
  );
  console.log(
    "Press 4 to show portfolio value in USD for your entered token on your entered date"
  );
  console.log("Press any other key to exit");

  process.stdout.write("Enter your choice: ");
  option = readline.question();

  performAction(option);
};

initApp();
