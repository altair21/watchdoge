# watchdoge

[![](https://travis-ci.org/altair21/watchdoge.svg?branch=master)](https://travis-ci.org/altair21/watchdoge)
[![npm version](https://img.shields.io/npm/v/watchdoge.svg)](https://www.npmjs.com/package/watchdoge)
[![](https://img.shields.io/npm/l/watchdoge.svg)](https://github.com/altair21/watchdoge/blob/master/LICENSE)

A simple CLI tool watching command line execute result for you.

![](https://ws1.sinaimg.cn/large/9ce43335gy1femb4iywslj20go0go0tr.jpg)

After configuring your email address, you can just run any command wrapped with `watchdoge`, and you will receive email when terminal has output. 

*You need Node.js enviroment to use this tool.*

## Installation

1. Install Node.js
2. `npm install -g watchdoge`

## Usage

1. `watchdoge config email xxx@xx.xx`
2. `watchdoge config password xxxx`
3. `watchdoge config service qq`. As Gmail has so many authorization to access, watchdoge only support `qq` email and `163` email by now. **default `service` is `qq`**.
4. `watchdoge config mode all`. 
  - Property `mode` has 3 valid value:
    - `end`(**default**): you will only receive one email with entire output when command execute finish.
    - `all`: you will receive email with output everytime terminal has stdout or stderr, and one email when command execute finish.
    - `error`: you will receive email with output everytime terminal has stderr, and one email when command execute finish.
5. you can run any command wrapped with `watchdoge`, for example `watchdoge ls`, `watchdoge ping -c 10 www.bing.com`.

## Further

- All your config is store in `~/.watchdogerc`, it is a JSON format file. You can edit this file by yourself, just keep JSON format.
- `qq` email and `163` email is preset, you can add other email by configuring `host` with email server address, `port` with email **ssl** protocol port, `service` with `none`, for example Gmail:
    - `watchdoge config service none`
    - `watchdoge config host smtp.gmail.com`
    - `watchdoge config port 465`

## LICENSE

[MIT LICENSE](https://github.com/altair21/watchdoge/blob/master/LICENSE)

