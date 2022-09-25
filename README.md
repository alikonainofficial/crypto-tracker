# Crypto Tracker


## Overview

![image](https://user-images.githubusercontent.com/62833911/192138166-bc9179d5-c306-4454-b566-9d56bbb04704.png)


Crypto Tracker is a command line application that let's you keep track of your crypto assets.

The application fetches the data from a large csv file and let's you perform following four operations:


1. View the latest portfolio details per token
2. View the latest portfolio details for your entered token
3. View the latest portfolio details per token based on your entered date
4. View the latest portfolio details per token based on your entered date and token

The application fetches realtime currency rate for the token against USD through an external API.
[Cryto Compare API](https://min-api.cryptocompare.com/)


## Pre-requisites

- Install [Node.js](https://nodejs.org/en/) version 8.0.0


### Getting started
- Clone the repository
```
git clone <project_url>
```
- Install dependencies
```
cd <project_name>
npm install
```
- Build and run the project
```
node .\index.js
```


## How to use

1. For viewing overall portfolio details, simply choose option 1 and press Enter.

    ![image](https://user-images.githubusercontent.com/62833911/192138633-831b7bcc-532e-4240-a1bc-1f09ced33d67.png)
2. For viewing portfolio details for a specific token, first choose option 2 and press Enter, and then enter the token and press Enter again.

    ![image](https://user-images.githubusercontent.com/62833911/192138491-e585ee19-e2cf-47a6-a65c-f3f0f57a05ad.png)
3. For viewing portfolio details on a specific date, first choose option 3 and press Enter, and then enter the date 
in the mentioned format `e.g. 2010-05-28` and press Enter again.

    ![image](https://user-images.githubusercontent.com/62833911/192138610-4307e7c3-bbee-4f99-9128-900ee66ff879.png)
