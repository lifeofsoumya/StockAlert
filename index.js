const express = require("express");
const puppeteer = require("puppeteer");
const cron = require("node-cron");
const nodemailer = require("nodemailer");
const eHbs = require("nodemailer-express-handlebars");
const path = require("path");
const bodyParser = require('body-parser')
require("dotenv").config();
const mongoose = require('mongoose') // mongo import
const users = require("./models/schema.js");

const app = express();

app.set('views', path.join(__dirname, '/views/')); // important to find views
app.use(bodyParser.urlencoded({extended:false }));
app.use(express.json());
// app.use(express.urlencoded({extended:true}));
app.set('view engine', 'hbs'); // sets hbs as default engine
app.use(express.static("public")); // uses public folder for static files

cron.schedule("30 10,14 * * *", async () => {
  console.log("cron is working");
  scrapeChannel("https://groww.in/markets/top-losers?index=GIDXNIFTY100");
});


// connection to mongoose

mongoose.connect(process.env.MONGO_URI, {useNewUrlParser: true})
.then(()=>{
  console.log("DB Connected")
})
.catch((err)=>{
  console.log(err);
})

app.get('/', (req, res)=>{
    res.render('index')
})


// collecting data from users

app.post ("/", (req, res) =>{
  const userName = req.body.name;
  const userEmail = req.body.email;
  const user = new users({ // storing input in item schema with Item model
    name: userName,
    email: userEmail
});
  user.save((err, doc)=>{
    if(!err){
      res.redirect('./public/subscribed.html')
    }
    else{
      console.log('error is: ' + err)
    }
  });
})

var stockApi;

async function scrapeChannel(url) {
  const browser = await puppeteer.launch();
  const page = await browser.newPage();
  await page.goto(url);

  const [el] = await page.$x(
    "/html/body/div/div/div[2]/div[2]/div/div/div[1]/div/div/table/tbody/tr[1]/td[1]/a"
  );
  const text = await el.getProperty("textContent");
  const stName = await text.jsonValue();

  const [el2] = await page.$x(
    "/html/body/div/div/div[2]/div[2]/div/div/div[1]/div/div/table/tbody/tr[1]/td[3]/text()"
  );
  const priceSrc = await el2.getProperty("textContent");
  const priceVal = await priceSrc.jsonValue();

  const [el3] = await page.$x(
    "/html/body/div/div/div[2]/div[2]/div/div/div[1]/div/div/table/tbody/tr[1]/td[4]"
  );
  const lowSrc = await el3.getProperty("textContent");
  const lowVal = await lowSrc.jsonValue();

  const [el4] = await page.$x(
    "/html/body/div/div/div[2]/div[2]/div/div/div[1]/div/div/table/tbody/tr[1]/td[5]"
  );
  const highSrc = await el4.getProperty("textContent");
  const highVal = await highSrc.jsonValue();

  const [el5] = await page.$x(
    "/html/body/div[1]/div/div[2]/div[2]/div/div/div[1]/div/div/table/tbody/tr[1]/td[3]/div"
  );
  const downBy = await el5.getProperty("textContent");
  const downVal = await downBy.jsonValue();

  let downValMod = downVal.replace(/\(.*?\)/gm, "");
  downValMod = downValMod.replace(/\+/g, "");
  downValMod = downValMod.replace(/\-/g, "");
  priceValMod = priceVal.replace(/\₹/g, "");

  let pTemp = (downValMod / priceValMod) * 100;
  let percentage = parseFloat(pTemp).toFixed(2);

  if (percentage * 100 < 1000) {
    function sendMail() {
      const mailTransporter = nodemailer.createTransport({
        service: "gmail",
        auth: {
          user: process.env.GID,
          pass: process.env.GPW
        },
        tls: {
          rejectUnauthorized: false
        }
      });

      const handlebarOptions = {
        viewEngine: {
          extName: ".handlebars",
          partialsDir: path.resolve("./views"),
          defaultLayout: false
        },
        viewPath: path.resolve("./views"),
        extName: ".handlebars"
      };

      mailTransporter.use("compile", eHbs(handlebarOptions));

      let mailDetails = {
        from: process.env.GID,
        to: process.env.GTO,
        subject: `Your Stock is Down by ${percentage}%`,
        template: "email",
        context: {
          userN: process.env.GNM,
          name: stName,
          pct: percentage,
          pVal: priceVal,
          hVal: highVal,
          lVal: lowVal
        }
      };

      mailTransporter.sendMail(mailDetails, function (err, data) {
        if (err) {
          console.log("Error Occurs " + err);
        } else {
          console.log("Email sent successfully");
        }
      });
    }
    sendMail();
  }

  console.log(percentage);
  console.log(stockApi)

  stockApi = {
    stocksNamee: stName,
    currentPrice: priceVal,
    lowPrice: lowVal,
    highPrice: highVal,
    downBy: downVal
  };
  // console.log(stockApi)
  browser.close();
}

scrapeChannel("https://groww.in/markets/top-losers?index=GIDXNIFTY100");



const port = process.env.PORT || 3000;

app.get("/", (req, res) => {
  res.send(stockApi);
});

app.listen(port, () => {
  console.log(`server started at port ${port}`);
});
