var express = require("express");
var app = express();
var bodyParser = require("body-parser");

app.use(bodyParser.urlencoded({extended:true}));


app.get("/", function(req, res){
   res.render("landing.ejs"); 
});

app.get("/newplant", function(req, res){
	res.render("newplant.ejs");
});

app.post("/newplant", function(req, res){
	var name = req.body.plantname;
	var sciname = req.body.sciname;
	var url = req.body.imgurl;
	res.send(name + sciname + url);
});

app.listen(3000, function(){
    console.log("Scavenger server has started");
});

