const { default: axios } = require("axios");
const { API_KEY, CURRENT_DATE_STAMP, EPOCH_START } = require("./contants");

//Get conversion rate for passed token and currency
module.exports.getAmountInUSD = async (token, currency) => {
  const url = `https://min-api.cryptocompare.com/data/price?fsym=${token}&tsyms=${currency}`;

  const header = {
    headers: {
      authorization: API_KEY,
    },
  };

  const response = await axios.get(url, header);

  const rate = response.data;

  if (rate["Response"] == "Error") {
    throw new Error(`Unable to get ${currency} rate for ${token}.`);
  }
  return Number(rate[currency]);
};

module.exports.isValidDate = (d) => {
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

//process file data if its token is not appearing for the first time
module.exports.processData = (dataSet, data) => {
  if (data["transaction_type"] == "WITHDRAWAL") {
    dataSet[data["token"]]["value"] =
      Number(dataSet[data["token"]]["value"]) - Number(data["amount"]);
  } else {
    dataSet[data["token"]]["value"] =
      Number(dataSet[data["token"]]["value"]) + Number(data["amount"]);
  }
};

//create data set if a token is appearing for the first time
module.exports.processDataInit = (dataSet, data) => {
  if (data["transaction_type"] == "WITHDRAWAL") {
    dataSet[data["token"]] = {
      value: Number(data["amount"]) * -1,
    };
  } else {
    dataSet[data["token"]] = {
      value: Number(data["amount"]),
    };
  }
};
