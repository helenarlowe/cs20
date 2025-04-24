var http = require('http');
var url = require('url');
const MongoClient = require('mongodb').MongoClient;

var port = process.env.PORT || 3000;
const mongoURI = "mongodb+srv://helenalowe:QL7kXoJNpWcNUfoP@cluster0.esoruhi.mongodb.net/?retryWrites=true&w=majority";

const client = new MongoClient(mongoURI);

console.log("App starting");

http.createServer(function (req, res) {
    const urlObj = url.parse(req.url, true);
    const path = urlObj.pathname;

    res.writeHead(200, { 'Content-Type': 'text/html' });

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

    } else if (urlObj.pathname === "/process") {
        // get the form data
        const query = urlObj.query.query;
        const type = urlObj.query.type;

        if (!query || !type) {
            res.write("<h2>Error: Missing form data.</h2>");
            res.end();
            return;
        }

        MongoClient.connect(mongoURI, function (err, db) {
            if (err) {
                console.log("Connection error: " + err);
                res.write("<h2>Database connection failed.</h2>");
                res.end();
                return;
            }

            const dbo = db.db("Stock");
            const coll = dbo.collection("PublicCompanies");

            var searchFilter;
            // determine whether searching by company name or ticker symbol
            if (type === "ticker") {
                searchFilter = { stockTicker: query.toUpperCase() };
            } else {
                searchFilter = { companyName: { $regex: query, $options: "i" } };
            }
            // find corresponding data in the database that matches the search
            coll.find(searchFilter).toArray(function (err, items) {
                if (err) {
                    console.log("Query error: " + err);
                    res.write("<h2>Error fetching data.</h2>");
                    res.end();
                } else {
                    // display name, stock ticker, and stock price for all companies that match the search in the console
                    for (var i = 0; i < items.length; i++) {
                        console.log("Company: " + items[i].companyName +
                                    ", Ticker: " + items[i].stockTicker +
                                    ", Price: $" + items[i].stockPrice);
                    }

                    // display results on webpage for extra credit
                    if (items.length === 0) {
                        res.write("<h2>No matching companies found.</h2>");
                    } else {
                        res.write("<h2>Matching Companies:</h2><ul>");
                        for (var i = 0; i < items.length; i++) {
                            res.write("<li><strong>" + items[i].companyName + "</strong> (" +
                                items[i].stockTicker + ") - $" + items[i].stockPrice + "</li>");
                        }
                        res.write("</ul>");
                    }
                    res.end();
                }
                db.close();
            });
        });
    }
});