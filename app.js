const puppeteer = require('puppeteer');
const express = require('express');
const cron = require('node-cron');
const bodyParser = require('body-parser')

// const { title } = require('process');

const app = express()

app.use(bodyParser.json());


cron.schedule('* * * * *', async () => {
    console.log('cron working')
    await scrapeChannel('https://groww.in/markets/top-losers?index=GIDXNIFTY100')
}); 


var stockApi

async function scrapeChannel(url) { // init function with to be scraped url argument

    const browser = await puppeteer.launch();      // launch puppeteer
    const page = await browser.newPage();       // generate a headless browser
    await page.goto(url);      // open argument passed url

    // 1. saving simple heading and img src using xpath

    const [el] = await page.$x('/html/body/div/div/div[2]/div[2]/div/div/div[1]/div/div/table/tbody/tr[1]/td[1]/a');        // select specific element on the url fetched page with 'xpath' & assign it to el
    const text = await el.getProperty('textContent');       // choose type of data needed
    const name = await text.jsonValue();    // extract the data type

    const [el2] = await page.$x('/html/body/div[1]/div/div[2]/div[2]/div/div/div[1]/div/div/table/tbody/tr[1]/td[3]/text()');
    const priceSrc = await el2.getProperty('textContent');
    const priceVal = await priceSrc.jsonValue();

    const [el3] = await page.$x('/html/body/div[1]/div/div[2]/div[2]/div/div/div[1]/div/div/table/tbody/tr[1]/td[5]');
    const highSrc = await el3.getProperty('textContent');
    const highVal = await highSrc.jsonValue();

    const [el4] = await page.$x('/html/body/div/div/div[2]/div[2]/div/div/div[1]/div/div/table/tbody/tr[1]/td[4]');
    const lowSrc = await el4.getProperty('textContent');
    const lowVal = await lowSrc.jsonValue();

    const [el5] = await page.$x('/html/body/div/div/div[2]/div[2]/div/div/div[1]/div/div/table/tbody/tr[1]/td[3]/div');
    const downBy = await el5.getProperty('textContent');
    const downVal = await downBy.jsonValue();



    // page.evaluate(() => {
    //     let allTitles = document.querySelectorAll('.mtp438CompanyName');
    // console.log("queryselect")

    //     allTitles.forEach(
    //         title.push(allTitles)
    //     )
    // })



    // page.evaluate(() => {
    //     let allPrices = document.querySelectorAll('.fw500');
    //     allPrices.forEach(
    //         currentPrice.push(allPrices)
    //     )
    // })

    
    stockApi = {
        stocksName : name,
        currentPrice: priceVal,
        lowPrice: lowVal,
        highPrice : highVal,
        downB : downVal
    }
    console.log(stockApi)
    browser.close();    // close the temporary headless browser    
}

scrapeChannel('https://groww.in/markets/top-losers?index=GIDXNIFTY100')


// for (var i=0;i<title.length; i++){
//     for( var j=0; j < currentPrice.length; j++){
//         stockApi.push(
//             'stockName: title[i]',
//             'stockPrice: currentPrice[i]'
//         )
//     }
// }

app.get('/', (req, res)=>{
        res.send(stockApi)
})


const port = process.env.PORT || 3000

app.listen(port, () => {
    console.log(`server started at port ${port}`)
})
