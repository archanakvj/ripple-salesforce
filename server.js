var express = require("express");

var bodyParser = require('body-parser');
var app =  express();
var includetrans=require('./transaction');


app.use(express.static('public'));


app.use(bodyParser.urlencoded({
   extended: false
}));

app.use(bodyParser.json());

app.use('/transaction', includetrans );
var port = process.env.PORT || 3000;

app.listen(port, function() {
  console.log('Server running on port: %d', port);
});