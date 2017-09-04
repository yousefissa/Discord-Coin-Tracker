const bittrexAPI = require('node.bittrex.api');
const discordAPI = require('discord.js');
const authConfig = require('./config.json');
const channelID = authConfig.discord.discordChannelID;
const botPrefix = authConfig.discord.botPrefix;
const discordClient = new discordAPI.Client();

let cryptoChannel;
let bitcoinPrice;

// get this info from your bitrex account settings page
bittrexAPI.options({
    'apikey': authConfig.bittrex.apikey,
    'apiscret': authConfig.bittrex.apiscret
});

discordClient.on('ready', () => {
    console.log('Bot started');
    cryptoChannel = discordClient.channels.get(channelID);
    cryptoChannel.send("Coin monitor is live! Use `q! help` for info. :chart_with_upwards_trend:");
});

discordClient.on('message', message => {
    // check if the message is in the right channel
    if (message.channel.id != channelID) return;
    // don't listen to other bots
    if (message.author.bot) return;
    // check if message starts with prefix
    if (!message.content.startsWith(botPrefix)) return;
    // looks for new lines. they break our bot.
    if (message.content.indexOf("\n") !== -1) {
        return message.reply('Please keep your message on one line!');
    };
    // lets figure out the message content.
    const messageArray = message.content.split(' ');
    // make sure they have something other than the prefix
    if (messageArray.length < 2) {
        return message.reply('Invalid argument count!');
    };
    if (messageArray[1].toLowerCase() == 'help') {
        return message.reply('Simply put the coin that you want to find info about and it\'s market. For example, `q! btc-neo`, `q! eth-btc`, `q! usdt-xrp`.');
    };
    // get bitcoin price
    bittrexAPI.getticker({
        market: 'usdt-btc'
    }, function(data, err) {
        if (err) {
            bitcoinPrice = 'Error :('
        } else {
            bitcoinPrice = '$' + String(data.result.Last)
        }
    });
    // lets get info on the coin!
    bittrexAPI.getticker({
            market: messageArray[1]
        }, function(data, err) {
            if (err) {
                return message.reply('Ran into an error. Probably an unsupported coin.');
            }
            if (!data.success) {
                return message.reply('Ran into an error!');
            }
            cryptoChannel.send({
                embed: {
                    color: 3447003,
                    title: 'Crypto Coin Price',
                    url: `https://bittrex.com/Market/Index?MarketName=${messageArray[1]}`,
                    fields: [{
                            name: 'Bittrex Prices',
                            value: messageArray[1]
                        }, {
                            name: 'Bid',
                            value: String(data.result.Bid)
                        }, {
                            name: 'Ask',
                            value: String(data.result.Ask)
                        }, {
                            name: 'Last',
                            value: String(data.result.Last)
                        }, {
                            name: 'Current BTC Price',
                            value: bitcoinPrice
                        },
                        {
                            name: 'Bittrex Link',
                            value: `https://bittrex.com/Market/Index?MarketName=${messageArray[1]}`
                        }
                    ]
                }
            });
        }
    });
});

discordClient.login(authConfig.discord.discordToken);