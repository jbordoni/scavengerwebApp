var express = require("express");
var app = express();
var bodyParser = require("body-parser");
var admin = require("firebase-admin");

var serviceAccount = require("./accountkey.json");

admin.initializeApp({
  credential: admin.credential.cert(serviceAccount),
  databaseURL: "https://scavenger-7165d.firebaseio.com"
});

var db = admin.database();
var ref = db.ref("/");
var plantsRef = ref.child("plants");

app.use(bodyParser.urlencoded({extended:true}));

var plantsArr=[];

plantsRef.orderByChild("plantname").on("child_added", function(snapshot, prevChildKey) {
	var plantname = snapshot.val().plantname;
	var url = snapshot.val().imageurl;
	var sciname = snapshot.val().scientificname;
	var plantEntry = {
		name: plantname,
		imageurl: url,
		scientificname: sciname,
		key: snapshot.key
	};
	plantsArr.push(plantEntry);
});


app.get("/", function(req, res){
 	res.render("landing.ejs", {plantsArr: plantsArr});
});

app.get("/newplant", function(req, res){
	res.render("newplant.ejs");
});

app.post("/newplant", function(req, res){
	var name = req.body.plantname;
	var sciname = req.body.sciname;
	var url = req.body.imgurl;
	plantsRef.push({
		plantname: name,
		scientificname: sciname,
		imageurl: url
	});
	res.redirect("/");
});

app.listen(3000, function(){
    console.log("Scavenger server has started");
});

