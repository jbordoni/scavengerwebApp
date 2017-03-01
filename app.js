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
var usersRef = ref.child("users");

app.use(bodyParser.urlencoded({extended:true}));

var plantsArr = [];
var usersArr = [];

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

usersRef.orderByChild("username").on("child_added", function(snapshot, prevChildKey) {
	var userEntry = {
		username: snapshot.val().username
	};
	usersArr.push(userEntry);
});

app.get("/", function(req, res){
 	res.render("landing.ejs", {plantsArr: plantsArr});
});


//JSON ENDPOINT FOR ALL PLANT DATA
app.get("/json", function(req,res){
	res.send(JSON.stringify(plantsArr));
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

app.get("/plant/:id", function(req, res){
	var requestedId = req.params.id;
	var specificRef = plantsRef.child(requestedId);
	specificRef.once("value", function(snapshot){
		res.render("plant.ejs", {plantInfo: snapshot.val()});
	});
});


//JSON ENDPOINT FOR SPECIFIC PLANT ID
app.get("/plant/:id/json", function(req, res){
	var specificRef = plantsRef.child(req.params.id);
	specificRef.once("value", function(snapshot){
		res.send(snapshot.val());
	});
});

app.get("/newuser", function(req, res){
	res.render("newuser.ejs");
});

app.post("/newuser", function(req,res){
	var username = req.body.username;
	var password = req.body.password;
	usersRef.push({
		username: username,
		password: password
	});
	res.redirect("/users");
});

app.get("/users", function(req, res){
	res.render("users.ejs", {usersArr: usersArr});
});

//JSON ENDPOINT FOR USER DATA
app.get("/users/json", function(req,res){
	res.send(JSON.stringify(usersArr));
});

app.listen(3000, function(){
    console.log("Scavenger server has started");
});

