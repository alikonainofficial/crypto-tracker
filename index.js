const readline = require("readline-sync");
const csv = require("csv-parser");
const fs = require("fs");
const axios = require("axios");
const NodeCache = require("node-cache");
var fsStream = {};
var csvStream = {};

const cache = new NodeCache();
const { CURRENCY, CURRENT_DATE_STAMP, EPOCH_START } = require("./contants");

const initStreamConnection = () => {
  fsStream = fs.createReadStream("./transactions.csv");
  csvStream = csv();
};

const initCache = () => {
  initStreamConnection();

  let count = 0;
  let maxLines = 100;

  console.log("Building cache...");

  // Iterating over first 100 elements of the file to fetch and store token names in cache
  // this should be done on the entire file, in case some tokens appear on line number after 100
  // but for simplicity and fast application startup, i'm only iterating over the first 100 rows

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
      console.log("Cache built successfully!");
      showInstructions();
    });
};

const getAmountInUSD = async (token, currency) => {
  const url = `https://min-api.cryptocompare.com/data/price?fsym=${token}&tsyms=${currency}`;

  const header = {
    headers: {
      authorization:
        "Apikey e71a75c954e3c9e01a76d276b4a80548a1733b4d5d4e4c134d42e2aed9b45000",
    },
  };

  const response = await axios.get(url, header);

  const rate = response.data;

  if (rate["Response"] == "Error") {
    throw new Error(`Unable to get ${currency} rate for ${token}.`);
  }
  return Number(rate[currency]);
};

const isValidDate = (d) => {
  if (d instanceof Date && !isNaN(d)) {
    d.setUTCHours(23, 59, 59, 999);
    d = Math.floor(d.getTime() / 1000.0);
    if (d >= EPOCH_START && d <= CURRENT_DATE_STAMP) {
      return true;
    } else {
      console.log(
        "Date should not go past January 1st, 1970 and it should not go beyond current date."
      );
      return false;
    }
  } else {
    console.log("Please enter a valid date.");
    return false;
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
          if (data["transaction_type"] == "WITHDRAWAL") {
            dataSet[data["token"]]["value"] =
              Number(dataSet[data["token"]]["value"]) - Number(data["amount"]);
          } else {
            dataSet[data["token"]]["value"] =
              Number(dataSet[data["token"]]["value"]) + Number(data["amount"]);
          }
        } else {
          if (data["transaction_type"] == "WITHDRAWAL") {
            dataSet[data["token"]] = {
              value: Number(data["amount"]) * -1,
            };
          } else {
            dataSet[data["token"]] = {
              value: Number(data["amount"]),
            };
          }
        }
        count++;
      }
    })
    .on("end", async () => {
      for (var data in dataSet) {
        try {
          let rate = await getAmountInUSD(data, CURRENCY);
          dataSet[data]["value"] = Number(
            Number(dataSet[data]["value"].toFixed(6)) * rate
          ).toFixed(2);
          console.log(
            `You have ${dataSet[data]["value"]} ${CURRENCY} worth of ${data}.`
          );
        } catch (error) {
          console.log(error.message);
        }
      }
    });
};

const showTokenBasedLatestPortfolio = (token) => {
  initStreamConnection();

  let dataSet = {};

  let count = 0;
  let maxLines = 100;

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
            if (data["transaction_type"] == "WITHDRAWAL") {
              dataSet[data["token"]]["value"] =
                Number(dataSet[data["token"]]["value"]) -
                Number(data["amount"]);
            } else {
              dataSet[data["token"]]["value"] =
                Number(dataSet[data["token"]]["value"]) +
                Number(data["amount"]);
            }
          } else {
            if (data["transaction_type"] == "WITHDRAWAL") {
              dataSet[data["token"]] = {
                value: Number(data["amount"]) * -1,
              };
            } else {
              dataSet[data["token"]] = {
                value: Number(data["amount"]),
              };
            }
          }
        }

        count++;
      }
    })
    .on("end", async () => {
      if (Object.keys(dataSet).length === 0) {
        console.log(`Unable to find data for ${token}.`);
        return;
      }
      for (var data in dataSet) {
        try {
          let rate = await getAmountInUSD(data, CURRENCY);
          dataSet[data]["value"] = Number(
            Number(dataSet[data]["value"].toFixed(6)) * rate
          ).toFixed(2);
          console.log(
            `You have ${dataSet[data]["value"]} ${CURRENCY} worth of ${data}.`
          );
        } catch (error) {
          console.log(error.message);
        }
      }
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
      // if (count >= maxLines) {
      //   fsStream.unpipe(csvStream);
      //   csvStream.end();
      //   fsStream.destroy();
      // } else {
      if (isTimeStampFound) {
        if (dataSet[data["token"]]) {
          if (data["transaction_type"] == "WITHDRAWAL") {
            dataSet[data["token"]]["value"] =
              Number(dataSet[data["token"]]["value"]) - Number(data["amount"]);
          } else {
            dataSet[data["token"]]["value"] =
              Number(dataSet[data["token"]]["value"]) + Number(data["amount"]);
          }
        }
      }
      if (
        (!isTimeStampFound || !dataSet[data["token"]]) &&
        data["timestamp"] <= timeStamp
      ) {
        console.log(
          `*****${isTimeStampFound}, ${dataSet[data["token"]]}, ${
            data["timestamp"] <= timeStamp
          }.*****`
        );
        isTimeStampFound = true;
        if (data["transaction_type"] == "WITHDRAWAL") {
          dataSet[data["token"]] = {
            value: Number(data["amount"]) * -1,
          };
        } else {
          dataSet[data["token"]] = {
            value: Number(data["amount"]),
          };
        }
      }
      //   count++;
      // }
    })
    .on("end", async () => {
      if (Object.keys(dataSet).length === 0) {
        console.log(`Unable to find data for provided date.`);
        return;
      }
      for (var data in dataSet) {
        try {
          let rate = await getAmountInUSD(data, CURRENCY);
          console.log(`${data} value is ${dataSet[data]["value"].toFixed(6)}`);
          dataSet[data]["value"] = Number(
            Number(dataSet[data]["value"].toFixed(6)) * rate
          ).toFixed(2);
          console.log(
            `You have ${dataSet[data]["value"]} ${CURRENCY} worth of ${data}.`
          );
        } catch (error) {
          console.log(error.message);
        }
      }
    });
};

const showDateAndTokenBasedPortfolio = (token, timeStamp) => {
  initStreamConnection();


  
  console.log(4);
};

const showInstructions = () => {
  var option = -1;
  console.log(
    "\n\n******************Welcome to Cypto Tracker!*********************\nPlease choose one of the following options:\n"
  );

  do {
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

    if (option == 1) {
      showLatestPortfolio();
      break;
    } else if (option == 2) {
      process.stdout.write("Enter your token: ");
      let token = readline.question();
      if (cache.has(token.trim().toUpperCase())) {
        showTokenBasedLatestPortfolio(token.trim().toUpperCase());
      } else {
        console.log("Unable to find the token.");
      }
      break;
    } else if (option == 3) {
      process.stdout.write("Enter the date (e.g. 2011-05-20): ");
      let dayEndTimeStamp = new Date(readline.question() + " UTC");
      if (isValidDate(dayEndTimeStamp)) {
        dayEndTimeStamp.setUTCHours(23, 59, 59, 999);
        dayEndTimeStamp = Math.floor(dayEndTimeStamp.getTime() / 1000.0);
        showDateBasedPortfolio(dayEndTimeStamp);
      }
      break;
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
            dayEndTimeStamp,
            token.trim().toUpperCase()
          );
        } else {
          console.log("Unable to find the token.");
        }
      }
      break;
    } else {
      break;
    }
  } while (option == 1 || option == 2 || option == 3 || option == 4);
};

initCache();
