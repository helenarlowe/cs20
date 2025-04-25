const http = require('http');
const url = require('url');
const MongoClient = require('mongodb').MongoClient;

var port = process.env.PORT || 3000;
// const port = 8080; //local

const Mongourl = "mongodb+srv://helenalowe:QL7kXoJNpWcNUfoP@cluster0.esoruhi.mongodb.net/?retryWrites=true&w=majority&tls=true";

console.log("App starting");

http.createServer(function (req, res) {
    res.writeHead(200, { 'Content-Type': 'text/html' });

    const urlObj = url.parse(req.url, true);
    const path = urlObj.pathname;

    if (path === "/") {
        // View 1: Home form
        res.write("<h1>Welcome to the Stock Search App</h1>");
        res.write("<form method='get' action='/process'>");
        // text input field that allows the user to enter a stock ticker symbol OR a company name
        res.write("Search for: <input type='text' name='query' required><br><br>");
        // radio buttons so that the user can indicate if they are entering the ticker symbol or a company name
        res.write("<input type='radio' name='type' value='ticker' checked> Ticker<br>");
        res.write("<input type='radio' name='type' value='company'> Company Name<br><br>");
        res.write("<input type='submit' value='Search'>");
        res.write("</form>");
        res.end();

    } else if (path === "/process") {
        handleProcessRequest(req, res, urlObj.query).catch(err => {
            console.error("Unexpected error:", err);
            res.end();
        });
    }
}).listen(port);

async function handleProcessRequest(req, res, queryParams) { // used w3schools mongodb node.js async function docs
    // get the form data
    const query = queryParams.query;
    const type = queryParams.type;

    if (!query || !type) {
        //if data not all filled out
        res.end();
        return;
    }

    const client = new MongoClient(Mongourl);
    await client.connect();
    const db = client.db("Stock");
    const collection = db.collection("PublicCompanies");

    let searchFilter;
    // determine whether searching by company name or ticker symbol
    if (type === "ticker") {
        searchFilter = { stockTicker: query.toUpperCase() };
    } else {
        searchFilter = { companyName: query};
    }

    // find corresponding data in the database that matches the search
    const items = await collection.find(searchFilter).toArray();

    if (items.length === 0) {
        res.write("<h2>No matching companies found.</h2>");
    } else {
        res.write("<h2>Matching Companies:</h2><ul>");
        for (let item of items) {
            // display name, stock ticker, and stock price for all companies that match the search in the console
            console.log("Company: " + item.companyName + ", Ticker: " + item.stockTicker + ", Price: $" + item.stockPrice);
            
            // display results on webpage
            res.write("<li><strong>" + item.companyName + "</strong> (" +
                item.stockTicker + ") - $" + item.stockPrice + "</li>");
        }
        res.write("</ul>");
    }

    res.end();
    await client.close(); 
    console.log("Connection closed");
}