
var dbRef = firebase.database().ref();
var plantsRef = firebase.database().ref('plants');

var storage = firebase.storage();
var storageRef = storage.ref();
var photosRef = storageRef.child("Photos");

var plantsArray = [];

var plantlist = document.getElementById("plantlist");

var submitButton = document.getElementById("submitPlant");
var updateavail = document.getElementById("updateavail");
var submitSignIn = document.getElementById("submitSignIn");
var submitNewUser = document.getElementById("submitNewUser");
var currUserLabel = document.getElementById("currUserLabel");

var currInfoWindow;
var currentUser;

var signOutButton = document.getElementById("signOutButton");
var signInUserButton = document.getElementById("signInUserButton");
var signUpUserButton = document.getElementById("signUpUserButton");
var showPlantsButton = document.getElementById("showPlantsButton");

//AREAS
var newPlantArea = document.getElementById("newplantarea");
var signInArea = document.getElementById("signinarea");
var newUserArea = document.getElementById("newuserarea");

newUserArea.style.display = "none";
newPlantArea.style.display = "none";
signInArea.style.display = "none";


//USER UPDATES
firebase.auth().onAuthStateChanged(function(user) {
  if (user) {
  	currentUser = user;
    // User is signed in.
    var displayName = user.displayName;
    var email = user.email;
    var emailVerified = user.emailVerified;
    var photoURL = user.photoURL;
    var isAnonymous = user.isAnonymous;
    var uid = user.uid;
    var providerData = user.providerData;

    currUserLabel.innerHTML = user.email;
	signInUserButton.style.display = "none";
	signUpUserButton.style.display = "none";
	signInArea.style.display = "none";
    newUserArea.style.display = "none";
	signOutButton.style.display = "";	
	showPlantsButton.style.display = "";
	

  } else {
    currentUser = null;
    showPlantsButton.style.display = "none";
    signInUserButton.style.display = "";
    signUpUserButton.style.display = "";
    currUserLabel.innerHTML = "";
    signOutButton.style.display = "none";
    newPlantArea.style.display = "none";
  }
});


signInUserButton.addEventListener("click", function(){
	newPlantArea.style.display = "none";
	signInArea.style.display = "";
	newUserArea.style.display = "none";
});

showPlantsButton.addEventListener("click", function(){
	newPlantArea.style.display = "";
	signInArea.style.display = "none";
	newUserArea.style.display = "none";
});

signUpUserButton.addEventListener("click", function(){
	newUserArea.style.display = "";
	newPlantArea.style.display = "none";
	signInArea.style.display = "none";
});

submitButton.addEventListener("click", function(){
	var filesSelected = document.getElementById("fileInput").files;
	var fileToLoad = filesSelected[0];
	var postKey = plantsRef.push().key;
	var filename = fileToLoad.name;
	var extension = filename.substr(filename.lastIndexOf('.')+1);
	var path = postKey + "." + extension;
	var fileRef = photosRef.child(path);

	fileRef.put(fileToLoad).then(function(snapshot) {
  		console.log('Uploaded a blob or file!');
  		var imgurl = snapshot.downloadURL;
  		var plantObject = {
			plantName: document.forms["plantform"]["plantname"].value,
			sciName: document.forms["plantform"]["sciname"].value,
			imgurl: imgurl,
			userId: currentUser.uid,
			longitude: document.forms["plantform"]["longitude"].value,
			latitude: document.forms["plantform"]["latitude"].value,
			desc: document.forms["plantform"]["desc"].value
		};

		var update = {};
		update[postKey] = plantObject;
		console.log(plantsRef.update(update));
	});


});


//NEW USER SIGN UP
submitNewUser.addEventListener("click", function(){
	var newEmail = document.forms["newuserform"]["email"].value;
	var newPassword = document.forms["newuserform"]["password"].value;
	firebase.auth().createUserWithEmailAndPassword(newEmail, newPassword).catch(function(error) {
	  // Handle Errors here.
	  var errorCode = error.code;
	  var errorMessage = error.message;
	  // ...
	});
});


//EXISTING USER SIGN IN
submitSignIn.addEventListener("click", function(){
	var email = document.forms["signinform"]["email"].value;
	var password = document.forms["signinform"]["password"].value;
	firebase.auth().signInWithEmailAndPassword(email, password).catch(function(error) {
	  // Handle Errors here.
	  var errorCode = error.code;
	  var errorMessage = error.message;
	  // ...
	});
});


//SIGN OUT
signOutButton.addEventListener("click", function(){
	firebase.auth().signOut().then(function(){
		signInUserButton.style.display = "";
		signUpUserButton.style.display = "";
		currUser.innerHTML = "";
		signOutButton.style.display = "none";
	}).catch(function(error){

	});
});

var initialValuesSet = false;

plantsRef.on('value', function(snapshot){
	if(!initialValuesSet){
		snapshot.forEach(function(data){
		var plantObject = {
			plantName: data.val().plantName,
			sciName: data.val().sciName,
			longitude: data.val().longitude,
			latitude: data.val().latitude,
			desc: data.val().desc,
			userId: data.val().userId,
		};
		var position = {lat: parseFloat(plantObject.latitude), lng: parseFloat(plantObject.longitude)}
			plantsArray.push(plantObject);
			createMarker(plantObject);
		});
		displayPlants();
		initialValuesSet = true;
	} else {
		updateavail.style.visibility = "visible";
	}
	
});


function createMarker(plantObject) {
	var position = {lat: parseFloat(plantObject.latitude), lng: parseFloat(plantObject.longitude)};
	var marker = new google.maps.Marker({
		position: position,
		map: map,
		title: plantObject.plantName
	});
	marker.addListener('mouseover', function(){
		currInfoWindow.setContent(marker.title);
		currInfoWindow.open(map, marker);
	});
	marker.addListener('mouseout', function(){
		currInfoWindow.close();
	});
}

function displayPlants(){
	plantsArray.forEach(function(plant){
		var node = document.createElement("li");
		var textnode = document.createTextNode(plant.plantName);
		node.appendChild(textnode);
		plantlist.appendChild(node);
	});
}


var map;

function initMap() {
	map = new google.maps.Map(document.getElementById('map'), {
	  center: {lat: -34.397, lng: 150.644},
	  zoom: 4
	});

	var infoWindow = new google.maps.InfoWindow({map: map});

	currInfoWindow = new google.maps.InfoWindow({map: map});
	currInfoWindow.close();

	if (navigator.geolocation) {
          navigator.geolocation.getCurrentPosition(function(position) {
            var pos = {
              lat: position.coords.latitude,
              lng: position.coords.longitude
            };

            infoWindow.setPosition(pos);
            infoWindow.setContent('Location found.');
            map.setCenter(pos);
            document.forms["plantform"]["longitude"].value = pos.lng;
            document.forms["plantform"]["latitude"].value = pos.lat;
          }, function() {
            handleLocationError(true, infoWindow, map.getCenter());
          });
    } else {
      // Browser doesn't support Geolocation
      handleLocationError(false, infoWindow, map.getCenter());
    }

}

function handleLocationError(browserHasGeolocation, infoWindow, pos) {
        infoWindow.setPosition(pos);
        infoWindow.setContent(browserHasGeolocation ?
                              'Error: The Geolocation service failed.' :
                              'Error: Your browser doesn\'t support geolocation.');
}


