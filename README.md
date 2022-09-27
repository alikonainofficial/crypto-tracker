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


## Design Decisions

### Separation of Concerns
1. In order to keep each method scope limited to performing only one specific task, I divided big complex tasks into various smaller methods.
2. This also helped in reducing code redundancy significantly.
3. The project contains two types of method:
    - The `Helpers` that perform utility operations such as user input validations, etc. 
    - The `Mains` that are responsible for core functionalities specific to the application.
4. To differentiate between these two, I moved utility methods to a separate file `utils.js` in order to further cleanup the overall code.
5. This also helped in improving the overall code readability.

### Performance Improvement
1. During application startup, I build a `cache` that iterates through the first 100 rows of the csv file and stores all token names in it.
2. I have made the assumption here, that by row 100, all token names should have appeared at least once in the file. Ideally this should be 
   done on the entire file in case some tokens appear on a line that's after line no. 100, but for simplicity and fast application startup, 
   I'm only iterating over the first 100 rows.
3. This could have also been done through the use of a global variable, but `Node cache` also offers the ability to refresh its list after a
   given interval of time. Cache can also be used throughout any module of the entire project, which is difficult to achieve using a global
   variable that has a limited scope and cannot be refreshed automatically after a given time.
4. The use of cache improves performance when user inputs a token name. We can simply lookup the provided token name in the cache,
   in constant time `O(1)` and check if the token exists in the file, instead of iterating through the file everytime the user inputs the 
   token.
   
### Best Practices
1. I made a `constants.js` file to store all the contants used throughout the project and this made the overall project adhere to the best used
   practices. 
2. These constants also include the currency code `e.g. USD`, so if you decide to get the data for `EUR`, you can simply change the value of
   `CURRENCY` constant and the application will start provided the converted values for `EUR` currency. 


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

    ![image](https://user-images.githubusercontent.com/62833911/192340787-2b16871a-8669-4237-96c1-bb287e3b5f2b.png)
2. For viewing portfolio details for a specific token, first choose option 2 and press Enter, and then enter the token and press Enter again.

    ![image](https://user-images.githubusercontent.com/62833911/192340902-bf4c4b5e-1dd6-4676-b4e0-73da6d667eaf.png)
3. For viewing portfolio details on a specific date, first choose option 3 and press Enter, and then enter the date 
in the mentioned format `e.g. 2010-05-28` and press Enter again.

    ![image](https://user-images.githubusercontent.com/62833911/192341073-8d271d90-b54a-4d81-8869-dcb2ad6e0e6f.png)
4. For viewing portfolio details on a specific date for a specific token, first choose option 4 and press Enter, and then enter the date 
in the mentioned format `e.g. 2010-05-28` and press Enter again, finally enter the token and press Enter one more time.

    ![image](https://user-images.githubusercontent.com/62833911/192341516-9ad4a343-5e1b-4ce1-a8fd-6f59c67f1819.png)

