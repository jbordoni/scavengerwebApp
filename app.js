
var dbRef = firebase.database().ref();
var plantsRef = firebase.database().ref('plants');
var geoFireRef = firebase.database().ref('plant_location');
var plantNameRef = firebase.database().ref('plantName');
var fbProvider = new firebase.auth.FacebookAuthProvider();

fbProvider.addScope('email');

var storage = firebase.storage();
var storageRef = storage.ref();
var photosRef = storageRef.child("Photos");

var plantsArray = [];

var plantlist = $('#plantlist');
var userplantlist = $("#userplantlist");

var submitButton = document.getElementById("submitPlant");
var updateavail = document.getElementById("updateavail");
var submitSignIn = document.getElementById("submitSignIn");
var submitNewUser = document.getElementById("submitNewUser");
var submitEmailForPassword = document.getElementById("submitEmailForPassword");

var geoFire = new GeoFire(geoFireRef);

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

var searchURL = "https://scavenger-web-app-elasticsearch-jbordoni.c9users.io/search?search=";

newUserArea.style.display = "none";
newPlantArea.style.display = "none";
signInArea.style.display = "none";

 $(document).ready(function(){
    // the "href" attribute of .modal-trigger must specify the modal ID that wants to be triggered
    $('.modal').modal();
 });

$(document).ready(function(){
    $('ul.tabs').tabs();
  });



//USER UPDATES
firebase.auth().onAuthStateChanged(function(user) {
  if (user) {
  	currentUser = user;
    // User is signed in.
    var displayName = user.displayName;
    var email = user.email;
    var emailVerified = user.emailVerified;
    if (emailVerified == false){
    	console.log("user has not verified");
    	user.sendEmailVerification();
    }
    var photoURL = user.photoURL;
    var isAnonymous = user.isAnonymous;
    var uid = user.uid;
    var providerData = user.providerData;
    $("#youtab").removeClass("disabled");
    document.forms["signinform"]["email"].value = "";
    document.forms["signinform"]["password"].value = "";
    document.forms["newuserform"]["email"].value = "";
    document.forms["newuserform"]["password"].value = "";
	signInUserButton.style.display = "none";
	signUpUserButton.style.display = "none";
	$('#signinarea').modal('close');
	$('#newuserarea').modal('close');
    newUserArea.style.display = "none";
	signOutButton.style.display = "";	
	showPlantsButton.style.display = "";
	getUserPlants();
  } else {
    currentUser = null;
    showPlantsButton.style.display = "none";
    signInUserButton.style.display = "";
    signUpUserButton.style.display = "";
    signOutButton.style.display = "none";
    newPlantArea.style.display = "none";
    $("#youtab").addClass("disabled");
    $('ul.tabs').tabs('select_tab', 'listarea');
  }
});

//BUTTON ON/OFF CONTROLLERS
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


function isNumber(n) {
  return !isNaN(parseFloat(n)) && isFinite(n);
}

function removeInvalidClasses(){
	$("#pflatitude").removeClass("invalid");
	$("#pflongitude").removeClass("invalid");
	$("#pfplantname").removeClass("invalid");
	$("#pfsciname").removeClass("invalid");
	$("#pfdesc").removeClass("invalid");
	$("#pffilepath").removeClass("invalid");
}

//ADDING A NEW PLANT
submitButton.addEventListener("click", function(){
	removeInvalidClasses();
	var filesSelected = document.getElementById("fileInput").files;
	var fileToLoad = filesSelected[0];
	var postKey = plantsRef.push().key;
	var latvalue = document.forms["plantform"]["latitude"].value;
	var lngvalue = document.forms["plantform"]["longitude"].value;
	
	//validation
	var correct = true;

	if(document.forms["plantform"]["plantname"].value == ""){
		$("#pfplantname").addClass("invalid");
		correct = false;
	}
	if(document.forms["plantform"]["sciname"].value == ""){
		$("#pfsciname").addClass("invalid");
		correct = false;
	}
	if(document.forms["plantform"]["desc"].value == ""){
		$("#pfdesc").addClass("invalid");
		correct = false;
	}
	if(!isNumber(latvalue)){
		$("#pflatitude").addClass("invalid");
		correct = false;
	}
	if(!isNumber(lngvalue)){
		$("#pflongitude").addClass("invalid");
		correct = false;
	}
	if(fileToLoad == null){
		$("#pffilepath").addClass("invalid");
		correct = false;
	}

	if(!correct){
		return;
	}

	var lat = parseFloat(latvalue);
	var lng = parseFloat(lngvalue);
	var checked = document.forms["plantform"]["edible"].checked;
	if (fileToLoad == null){
  		var plantObject = {
			plantName: document.forms["plantform"]["plantname"].value,
			sciName: document.forms["plantform"]["sciname"].value,
			imgurl: null,
			userId: currentUser.uid,
			edible: checked,
			longitude: lng,
			latitude: lat,
			desc: document.forms["plantform"]["desc"].value
		};
		var update = {};
		update[postKey] = plantObject;
		console.log(plantsRef.update(update));
		geoFire.set(postKey, [parseFloat(lat), parseFloat(lng)]);
		resetPlantArea();

	} else {
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
				edible: checked,
				longitude: lng,
				latitude: lat,
				desc: document.forms["plantform"]["desc"].value
			};

			var update = {};
			update[postKey] = plantObject;
			console.log(plantsRef.update(update));
			geoFire.set(postKey, [parseFloat(lat), parseFloat(lng)]);
			resetPlantArea();
			displayPlants();
			displayUserPlants();
		});
	}
});

function resetPlantArea(){
	$('#newplantarea').modal('close');
	document.forms["plantform"]["plantname"].value = "";
	document.forms["plantform"]["sciname"].value = "";
	document.forms["plantform"]["longitude"].value = "";
	document.forms["plantform"]["latitude"].value = "";
	document.forms["plantform"]["edible"].checked = false;
	document.forms["plantform"]["desc"].value = "";
	document.getElementById("fileInput").value = "";
}


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

//FORGOTTEN PASSWORD
submitEmailForPassword.addEventListener("click", function(){
	console.log("send email button pressed");
	var email = document.forms["forgotpasswordform"]["email"].value;
	firebase.auth().sendPasswordResetEmail(email).then(function() {
	  // Email sent.
	  $('#forgotpasswordarea').modal('close');
	}, function(error) {
	  // An error happened.
	});
	
});

//FACEBOOK LOG IN
$("#fbLogIn").click(function(){
	console.log("Got here");
	firebase.auth().signInWithPopup(fbProvider).then(function(result) {
	  // This gives you a Facebook Access Token. You can use it to access the Facebook API.
	  var token = result.credential.accessToken;
	  // The signed-in user info.
	  var user = result.user;
	  console.log(result);
	  // ...
	}).catch(function(error) {
	  // Handle Errors here.
	  var errorCode = error.code;
	  var errorMessage = error.message;
	  // The email of the user's account used.
	  var email = error.email;
	  // The firebase.auth.AuthCredential type that was used.
	  var credential = error.credential;
	  // ...
	  console.log(error)
	});
});

var newSearch;

var searchResults;

//SEARCH FUNCTIONALITY FOR PLANT LIST
$("#plantlistsearchbutton").click(function(){
	var searchTerm = document.getElementById("plantlistsearch").value;
	console.log("SEARCHING FOR: " + searchTerm);
	newSearch = new XMLHttpRequest();
	newSearch.open('GET', searchURL + searchTerm, true);
	newSearch.onreadystatechange = processSearchRequest;
	newSearch.send();
});

function processSearchRequest(e) {
	if(newSearch.readyState == 4 && newSearch.status == 200){
		var response = JSON.parse(newSearch.responseText);
		console.log(response);
		searchResults = [];
		response.forEach(function(indiv){
			var newElem = indiv._source;
			newElem["plantId"] = indiv._id;
			searchResults.push(newElem);
		});
		updateDistancesAndSort(searchResults);
		displaySearchPlants();
	} else {
		if(newSearch.readyState == 4){
			console.log("Error with search request");
		}
	}
}

function displaySearchPlants(){
	plantlist.html("");
	searchResults.forEach(function(plant){
		var distance = plant.distance;
		if(distance > -1){
			distance = distance.toFixed(2) + " km";
		} else {
			distance = "";
		}
		plantlist.append('<div class="col s12"><div class="card horizontal"><div class="card-image side"><img src="'+ plant.imgurl +'"></div><div class="card-stacked"><div class="card-content"><p><strong>' + plant.plantName +'  </strong><span class="distance">' +  distance + '</span></p><p><i>'+ plant.sciName +'</i></p></div><div class="card-action"><a class="moreinfo" id="'+ plant.plantId +'" href="#detailmodal">Info</a><a lat="' + plant.latitude + '" lng="' + plant.longitude + '" class="centermap">Center Map</a></div></div></div></div>');
		console.log(plant.plantId);
		console.log(plant.plantName);
	});
	addMoreInfoHandler();
	addCenterMapHandler();
}

$("#plantlistcancelsearchbutton").click(function(){
	document.getElementById("plantlistsearch").value = "";
	$("#plantlistcancelsearchbutton").addClass("disabled");
	displayPlants();
});

$("#plantlistsearch").bind('input', function(){
	if($(this).val().length == 0){
		$("#plantlistcancelsearchbutton").addClass("disabled");
	} else {
		$("#plantlistcancelsearchbutton").removeClass("disabled");
	}
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


//UPDATES AND INITIAL INFO PULL
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
			imgurl: data.val().imgurl,
			plantId: data.key,
			distance: getDistanceFromLatLonInKm(parseFloat(currLat), parseFloat(currLong), parseFloat(data.val().latitude), parseFloat(data.val().longitude))
		};
		var position = {lat: plantObject.latitude, lng: plantObject.longitude};
		plantsArray.push(plantObject);
		createMarker(plantObject);
	});
	updateDistancesAndSort(plantsArray);
	displayPlants();
	initialValuesSet = true;
	} else {
		//updateavail.style.visibility = "visible";
	}
});

plantsRef.on('child_added', function(data){
	if(initialValuesSet == true){
		var plantObject = {
			plantName: data.val().plantName,
			sciName: data.val().sciName,
			longitude: data.val().longitude,
			latitude: data.val().latitude,
			desc: data.val().desc,
			userId: data.val().userId,
			imgurl: data.val().imgurl,
			plantId: data.key
		};
		var position = {lat: plantObject.latitude, lng: plantObject.longitude};
		plantsArray.push(plantObject);
		createMarker(plantObject);
		displayPlants();
	}

});

//UPDATE DISTANCES
function updateDistancesAndSort(arrayOfPlants){
	arrayOfPlants.forEach(function(plant){
		plant["distance"] = getDistanceFromLatLonInKm(parseFloat(currLat), parseFloat(currLong), parseFloat(plant.latitude), parseFloat(plant.longitude));
	});
	//sort
	arrayOfPlants.sort(sortByDistance);
}

function sortByDistance(a, b){
	return a.distance - b.distance;
}


//USER PLANTS PULL
var userPlants = [];

function getUserPlants(){
	userPlants = [];
	plantsRef.orderByChild("userId").equalTo(currentUser.uid).once('value', function(snapshot){
		snapshot.forEach(function(userPlant){
			var plantObject = {
				plantName: userPlant.val().plantName,
				sciName: userPlant.val().sciName,
				longitude: userPlant.val().longitude,
				latitude: userPlant.val().latitude,
				desc: userPlant.val().desc,
				userId: userPlant.val().userId,
				imgurl: userPlant.val().imgurl,
				plantId: userPlant.key,
				distance: getDistanceFromLatLonInKm(parseFloat(currLat), parseFloat(currLong), parseFloat(userPlant.val().latitude), parseFloat(userPlant.val().longitude))
			};
			userPlants.push(plantObject);
		});
		updateDistancesAndSort(userPlants);
		displayUserPlants();
	});
}

function displayUserPlants(){
	userplantlist.html("");
	userPlants.forEach(function(plant){
		var distance = plant.distance;
		if(distance > -1){
			distance = distance.toFixed(2) + " km";
		} else {
			distance = "";
		}
		userplantlist.append('<div class="col s12"><div class="card horizontal"><div class="card-image side"><img src="'+ plant.imgurl +'"></div><div class="card-stacked"><div class="card-content"><p><strong>' + plant.plantName +'</strong>  <span class="distance">' +  distance + '</span></p><p><i>'+ plant.sciName +'</i></p></div><div class="card-action"><a class="moreinfo" id="'+ plant.plantId +'" href="#detailmodal">Info</a><a lat="' + plant.latitude + '" lng="' + plant.longitude + '" class="centermap">Center Map</a></div></div></div></div>');
	});
	addMoreInfoHandler();
	addCenterMapHandler();	
}



//AUTOCOMPLETE SETUP
var plantNamesForAutofill = [];
var plantNamesForOtherFill = [];

function loadPlantNames(){
	plantNameRef.once('value', function(snapshot){
		snapshot.forEach(function(data){
			var name = data.val()["Common Name"];
			plantNamesForAutofill[name] = null;
			plantNamesForOtherFill[name] = {isEdible:data.val()["Palatable Human"], sciName: data.val()["Scientific Name"]};
		});
		console.log("completed plant name array");
		$('input.autocomplete').autocomplete({
			data: plantNamesForAutofill,
			limit: 5, // The max amount of results that can be shown at once
			onAutocomplete: function(val) {
			   document.forms["plantform"]["sciname"].value = plantNamesForOtherFill[val]["sciName"];
			   console.log(plantNamesForOtherFill[val]);
			   if(plantNamesForOtherFill[val]["isEdible"]== "Yes"){
			   		document.forms["plantform"]["edible"].checked = true;
			   } else {
			   		document.forms["plantform"]["edible"].checked = false;
			   }
			},
			minLength: 1, // The minimum length of the input for the autocomplete to start
		});
		console.log("autocomplete complete");

	});

	
}

loadPlantNames();




	


function createMarker(plantObject) {
	var position = {lat: parseFloat(plantObject.latitude), lng: parseFloat(plantObject.longitude)};
	var marker = new google.maps.Marker({
		position: position,
		map: map,
		title: plantObject.plantName,
		icon: 'https://chart.apis.google.com/chart?chst=d_map_pin_letter&chld=%E2%80%A2|090',
		id: plantObject.plantId
	});
	marker.addListener('mouseover', function(){
		currInfoWindow.setContent(marker.title);
		currInfoWindow.open(map, marker);
	});
	marker.addListener('mouseout', function(){
		currInfoWindow.close();
	});
	marker.addListener('click', function(){
		$("#detailmodal").modal('open');
		plantsRef.child(marker.id).once('value', function(snapshot){
			$("#detailImage").attr("src", snapshot.val().imgurl);
			$("#detailImageLink").attr("href", snapshot.val().imgurl);
			$("#detailPlantName").text(snapshot.val().plantName);
	 		$("#detailScientificName").text(snapshot.val().sciName);
	 		$("#detailPlantDescription").text(snapshot.val().desc);
	 		if (snapshot.val().edible == true){
	 			$("#detailEdible").text("EDIBLE");
	 		} else {
	 			$("#detailEdible").text("");
	 		}
	 		
		});
	});
}

function displayPlants(){
	plantlist.html("");
	plantsArray.forEach(function(plant){
		var distance = plant.distance;
		if(distance > -1){
			distance = distance.toFixed(2) + " km";
		} else {
			distance = "";
		}


		plantlist.append('<div class="col s12"><div class="card horizontal"><div class="card-image side"><img src="'+ plant.imgurl +'"></div><div class="card-stacked"><div class="card-content"><p><strong>' + plant.plantName +'</strong>   <span class="distance">' +  distance + '</span></p><p><i>'+ plant.sciName +'</i></p></div><div class="card-action"><a class="moreinfo" id="'+ plant.plantId +'" href="#detailmodal">Info</a><a lat="' + plant.latitude + '" lng="' + plant.longitude + '" class="centermap">Center Map</a></div></div></div></div>');
	});
	addMoreInfoHandler();
	addCenterMapHandler();
}



function addMoreInfoHandler(){
	console.log("adding handers");
	$(".moreinfo").click(function(event){
		plantsRef.child(event.target.id).once('value', function(snapshot){
			$("#detailImage").attr("src", snapshot.val().imgurl);
			$("#detailImageLink").attr("href", snapshot.val().imgurl);
			$("#detailPlantName").text(snapshot.val().plantName);
	 		$("#detailScientificName").text(snapshot.val().sciName);
	 		$("#detailPlantDescription").text(snapshot.val().desc);
	 		if (snapshot.val().edible == true){
	 			$("#detailEdible").text("EDIBLE");
	 		} else {
	 			$("#detailEdible").text("");
	 		}
	 		
		});

 	});
}

function addCenterMapHandler(){
	console.log("adding center map handlers");
	$(".centermap").click(function(event){
		var lat = parseFloat($(this).attr("lat"));
		var lng = parseFloat($(this).attr("lng"));
		var pos = {
			lat: lat,
			lng: lng
		};
		map.setCenter(pos);
		map.setZoom(19);
	});
}


var currLat;
var currLong;

function initMap() {
	map = new google.maps.Map(document.getElementById('map'), {
	  center: {lat: 33.753746, lng: -84.386330},
	  zoom: 12
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
            map.setZoom(15);
            document.forms["plantform"]["longitude"].value = pos.lng;
            document.forms["plantform"]["latitude"].value = pos.lat;
            currLat = pos.lat;
            currLong = pos.lng;
            updateDistancesAndSort(plantsArray);
            updateDistancesAndSort(userPlants);
            displayPlants();
            displayUserPlants();
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

//CALCULATE DISTANCES
function getDistanceFromLatLonInKm(lat1,lon1,lat2,lon2) {
  var R = 6371; // Radius of the earth in km
  var dLat = deg2rad(lat2-lat1);  // deg2rad below
  var dLon = deg2rad(lon2-lon1); 
  var a = 
    Math.sin(dLat/2) * Math.sin(dLat/2) +
    Math.cos(deg2rad(lat1)) * Math.cos(deg2rad(lat2)) * 
    Math.sin(dLon/2) * Math.sin(dLon/2)
    ; 
  var c = 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1-a)); 
  var d = R * c; // Distance in km
  return d;
}

function deg2rad(deg) {
  return deg * (Math.PI/180)
}


