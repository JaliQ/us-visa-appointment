# What is this?

This is a small puppeteer script that can be used to find and schedule an earlier US consulate appointment for US Visa in Canada and other countries. You **must** have an appointment made manually before using this script.

This might be able to used for other countries by finding the consular ids mentioned below for that specific country.

## Prerequisites

1. Download and install Node.JS LTS 16.14.2 from <https://nodejs.org/en/download/> for whatever OS you are using
2. Open command line/terminal window and type in following
    1. npm install puppeteer --save
    2. npm install minimist --save
    3. npm install axios --save
3. Install Pushbullet app from App Store/Google Play if you would like to have push notifications when a date is found

## Usage

Open command line or terminal window and navigate to the folder usappointment.js. Type in below code with updated arguments from command line arguments section.

**Mac/Linux:**

>node usappointment.js -r 'ca' -d '2022-06-22' -u 'username' -p 'password' -a 359734258 -c 95 -n 'pu5hov3ru53rk3y'

**Windows:**

>node usappointment.js -r "ca" -d "2022-06-22" -u "username" -p "password" -a 359734258 -c 95 -n "pu5hov3ru53rk3y"

## Command line arguments

**-r** Country code (ISO-3166 Alpha-2 code <https://en.wikipedia.org/wiki/List_of_ISO_3166_country_codes>). Canada (ca), United States (us)

**-d** Threshold date to look for earlier appointments. Format: YYYY-MM-DD

**-u** Username

**-p** Password

**-a** Application id. This needs to be grabbed from the url when you navigate to Reschedule Appointment page. Example: <https://ais.usvisa-info.com/en-ca/niv/schedule/>**32943478**/appointment

**-c** Consular id. Halifax 90, Montreal 91, Ottowa 92, Quebec City 93, Toronto 94, Vancouver is 95 for Canada. You can find ids for other consulates from the dropdown values in the appointment page.

**-n** Pushbullet User Key from Pushover Notifications app. Do not provide this argument if you don't want to receive notifications.


## Tips

If you found a way to sign in with a request instead of puppeteer, pls make a pull request.
