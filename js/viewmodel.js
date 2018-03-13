function ViewModel() {
	var that = this;

	this.searchInput = ko.observable("");
	this.filterString = ko.observable("");
	this.toast = ko.observable({type: "info", message: ""}); // Accepts types info, error and success

	this.toast.subscribe(function() {
		$('#toast').toggleClass(that.toast().type);
		$('#toast').toggleClass('show');

	    // After 3 seconds, remove the show class from DIV
	    setTimeout(function() {
	    	$('#toast').toggleClass('show');
	    	$('#toast').toggleClass(that.toast().type);
	    }, 3000);
	})

	this.map;
	this.searchBox;

	this.tempMarker;
	this.largeInfowindow = new google.maps.InfoWindow({maxWidth: 200});
	this.defaultIcon;
	this.favoriteIcon;
	this.homeIcon;

	this.currentPlace;
	this.home = ko.observable();
	this.directionsDisplay;

	this.savedPlaces = ko.observableArray();
	
	this.savedPlaces.subscribe(function() {
		// Add all places to filteredPlaces
		that.filterPlaces();
		// Reinitialize the filter
		that.filterString("");
		// Update the markers
		that.updateMarkers();

		// Store saved place_id's in localStorage
		var savedPlaceIds = [];
		for (var i = 0; i < that.savedPlaces().length; i++) {
			savedPlaceIds.push(that.savedPlaces()[i].place.place_id);
		};
		localStorage.setItem("savedPlaces", ko.toJSON(savedPlaceIds));
	});

	this.filteredPlaces = ko.observableArray();
	this.filterString.subscribe(function() {
		that.filterPlaces();
		that.updateMarkers();
	});

	/* INITIALIZATION */

	// Initialize the map. Called on load (see below).
	this.initMap = function() {
		// Constructor creates a new map - only center and zoom are required.
		this.map = new google.maps.Map(document.getElementById('map'), {
			center: {lat: 40.7413549, lng: -73.9980244},
			zoom: 13,
	        disableDefaultUI: true,
	        maxZoom: 17
		});
	};

	// Initialize the searchbox. Called on load (see below).
	this.initSearchbox = function() {
		// Create a searchbox in order to execute a places search
		var searchElem = document.getElementById('places-search');
	    this.searchBox = new google.maps.places.SearchBox(searchElem);

	    // Bias the SearchBox results towards current map's viewport.
	    that.map.addListener('bounds_changed', function() {
	    	that.searchBox.setBounds(that.map.getBounds());
	    });

	    // Listen for the event fired when the user selects a prediction and retrieve
        // more details for that place.
	    google.maps.event.addListener(that.searchBox, 'places_changed', function () {
	    	// Trigger an input event on the searchBox so KO updates the value
		    ko.utils.triggerEvent(searchElem, "input");
		    // Search the place
	    	that.searchPlace('searchBox');
		});
	};

	// From Udacity course.
	// This function takes in a COLOR, and then creates a new marker
    // icon of that color. The icon will be 21 px wide by 34 high, have an origin
    // of 0, 0 and be anchored at 10, 34).
    this.makeMarkerIcon = function(markerColor) {
    	var markerImage = new google.maps.MarkerImage(
          	'http://chart.googleapis.com/chart?chst=d_map_spin&chld=1.15|0|' + markerColor +
          	'|40|_|%E2%80%A2',
          	new google.maps.Size(21, 34),
          	new google.maps.Point(0, 0),
          	new google.maps.Point(10, 34),
          	new google.maps.Size(21,34)
        );
        return markerImage;
    };

	this.initMap();
	this.initSearchbox();
	this.defaultIcon = this.makeMarkerIcon('f75850');
	this.favoriteIcon = this.makeMarkerIcon('ffc107');
	this.homeIcon = this.makeMarkerIcon('6b7be3');

	/* END INITIALIZATION */

	this.searchPlace = function(origin) {
		if (origin == "searchBox") {
			that.searchBoxPlace();
		} else {
			that.searchTextPlace();
		};
	};

	this.searchTextPlace = function() {
		var bounds = that.map.getBounds();
        var placesService = new google.maps.places.PlacesService(that.map);
        
        placesService.textSearch({
          	query: that.searchInput(),
          	bounds: bounds
        }, function(places, status) {
          	if (status === google.maps.places.PlacesServiceStatus.OK) {
            	if (places.length == 0) {
			    	that.toast({type: "error", message: "Error: Couldn't find a place."});
			    } else {
			    	that.getPlaceDetails(places[0].place_id, function(place) {
			    		var place = new Place(place);
					    that.zoomOnPlace(place);
					    that.addMarker(place);
			    	});
			    };
          	} else {
          		var message = "Error: Couldn't get the info from Google... ";
          		message += "Test your Internet connexion and try again.";
          		that.toast({type: "error", message: message});
          	};
        });

		that.searchInput("");
	};

	this.searchBoxPlace = function() {
		var places = that.searchBox.getPlaces();
        
        if (places.length == 0) {
	    	that.toast({type: "error", message: "Error: Couldn't find a place."});
	    } else {
	    	var place = new Place(places[0]);
		    that.zoomOnPlace(place);
		    that.addMarker(place);
	    };

		that.searchInput("");
	};

	this.getPlaceDetails = function(place_id, callback) {
		var placesService = new google.maps.places.PlacesService(that.map);

		placesService.getDetails({
        	placeId: place_id
        }, function(place, status) {
          	if (status === google.maps.places.PlacesServiceStatus.OK) {
            	callback(place);
            } else {
            	var message = "Error: Couldn't get the info from Google... ";
          		message += "Test your Internet connexion and try again.";
          		that.toast({type: "error", message: message});
            };
        });
	};

	this.zoomOnPlace = function(place) {
		// Get the latlng
		var latlng = place.location;
	    
	    // Center the map on it and zoom
	    that.map.setCenter(latlng);
	    that.map.setZoom(17);
	    that.map.panBy(0, -150); // offset for the infowindow

	    // Set currentPlace to this place
	    that.currentPlace = place;
	};

	// Adds a marker to the map. If temp is true, the marker is temporary.
	this.addMarker = function(place, type) {
		var latlng = place.location;
		var formatted_address = place.formatted_address;

		if (type == 'favorite') {
			var icon = that.favoriteIcon;
		} else if (type == 'home') {
			var icon = that.homeIcon;
		} else {
			var icon = that.defaultIcon;
			var temp = true;
		};

		var marker = new google.maps.Marker({
			position: latlng,
			map: that.map,
			title: place.name,
            animation: google.maps.Animation.DROP,
            icon: icon
        });

		if (temp) {
	        that.updateTempMarker(marker);
	    };

	    var infowindow = that.addInfoWindow(marker, place);

	    return marker;
	};

	this.addInfoWindow = function(marker, place) {
		that.populateInfoWindow(marker, place);

		marker.addListener('click', function() {
            that.largeInfowindow.open(that.map, this);
        });
	};

	this.populateInfoWindow = function(marker, place) {
		var content = '<div class="infowindow">';
		content += '<h5 class="infowindow-header">';
		content += '<img width="20px" height="20px" src="';
		content += place.icon + '" class="float-left">';
		if (place.website) {
			content += '<a href="' + place.website + '" target="_blank">';
			content += place.name + '</a></h5>';
		} else {
			content += place.name + '</h5>';
		};
		content += '<p class="infowindow-subtitle">';
		if (place.price_level) {
			content += '<span class="float-left">';
			for (var i = 0; i < place.price_level; i++) {
				content += '<i class="fa fa-dollar-sign"></i>';
			};
			content += '</span>';
		};
		content += place.type + '</p>';
		content += place.formatted_address;
		if (place.photos) {
            content += '<br><br><img src="'
            content += place.photos[0].getUrl( {maxHeight: 100, maxWidth: 200} )
            content += '">';
        };
        content += '<br><button id="home-btn-' + place.place_id;
        content += '" class="btn btn-secondary btn-sm mt-2 mr-2">Home</button>';

        content += '<button id="fav-btn-' + place.place_id;
        content += '" class="btn btn-warning btn-sm mt-2">';
        content += '<i class="fas fa-star text-white"></i>';
        content += '</button>';

        content += '<button id="go-btn-' + place.place_id;
        content += '" class="btn btn-info btn-sm mt-2 ml-2">Go</button';

		content += '</div>';

        // Check to make sure the infowindow is not already opened on this marker.
        if (that.largeInfowindow.marker != marker) {
          	that.largeInfowindow.marker = marker;
          	that.largeInfowindow.setContent(content);
        };
        that.largeInfowindow.open(that.map, marker);

      	// Make sure the marker property is cleared if the infowindow is closed.
      	that.largeInfowindow.addListener('closeclick',function(){
        	that.largeInfowindow.setMarker = null;
      	});

      	// Add listeners on the buttons, now the infowindow is in the DOM
      	$('#home-btn-' + place.place_id).click(function() {
			that.makeHome(place);
		});
		$('#fav-btn-' + place.place_id).click(function() {
			that.savePlace(place);
		});
		$('#go-btn-' + place.place_id).click(function() {
			if (!that.home()) {
				that.toast({type: "error", message: "Error: Set a home address to get directions..."});
				return;
			};
			that.getDirections(that.home().place, place);
		});
    };

	this.updateTempMarker = function(marker) {
		// Remove previous tempMarker
		if (that.tempMarker) {
			that.tempMarker.setMap(null);
		};
		that.tempMarker = marker;
	};

	this.hideSavedMarkers = function() {
		for (var i = 0; i < that.savedPlaces().length; i++) {
			that.savedPlaces()[i].marker.setMap(null);
		};
	};

	this.showFilteredMarkers = function() {
		if (that.filteredPlaces().length > 0) {
			var bounds = new google.maps.LatLngBounds();
			for (var i = 0; i < that.filteredPlaces().length; i++) {
				var marker = that.filteredPlaces()[i].marker;
				marker.setMap(that.map);
				bounds.extend(marker.position);
			};
			// If the user set a home address, extend the boundaries
			// of the map to show it too.
			if (that.home()) {
				if (that.home().marker) {
					bounds.extend(that.home().marker.position);
				};
			};
			// Extend the boundaries of the map for each marker
	        that.map.fitBounds(bounds);
	    };
	};

	this.updateMarkers = function() {
		that.hideSavedMarkers();
		that.showFilteredMarkers();
	};

	// if init is true it means we're adding places
	// from localStorage
	this.savePlace = function(place, init) {
		if (!place.name) {
			if (!that.currentPlace) {
				that.toast({type: "error", message: "Error: there is no place to save."});
				return;
			};

			var place = that.currentPlace;
		};

		var marker = that.addMarker(place, 'favorite');
		that.savedPlaces.push({'place': place, 'marker': marker});
		if (that.tempMarker) {
			that.tempMarker.setMap(null);
		};
		that.zoomOnPlace(place);

		if (!init) {
			that.searchInput("");
			that.toast({type: "success", message: place.name + " was saved as a favorite."});
			that.openSideBar();
		};
	};

	this.locateSavedPlace = function(place) {
		that.zoomOnPlace(place.place);
        that.populateInfoWindow(place.marker, place.place);
	};

	this.locateHome = function() {
		that.zoomOnPlace(that.home().place);
		that.populateInfoWindow(that.home().marker, that.home().place);
	};

	this.filterPlaces = function() {
		that.filteredPlaces.removeAll();
		for (var i = 0; i < that.savedPlaces().length; i++) {
			var item = that.savedPlaces()[i];
			var filter = that.filterString().toLowerCase();
			var itemName = item.place.name.toLowerCase();
			var itemAddress = item.place.formatted_address.toLowerCase();
			var itemType = item.place.type.toLowerCase() || "";
			var itemPhone = item.place.international_phone_number || "";
			if (itemName.indexOf(filter) >= 0 || itemAddress.indexOf(filter) >= 0 || itemType.indexOf(filter) >= 0 || itemPhone.indexOf(filter) >= 0) {
		    	that.filteredPlaces.push(item);
		    };
		};
	};

	this.makeHome = function(place) {
		if (that.home()) {
			if (that.home().marker) {
				that.home().marker.setMap(null);
			};
		};
		
		var marker = that.addMarker(place, 'home');
		that.home({place: place, marker: marker});

		that.zoomOnPlace(that.currentPlace);
		that.searchInput("");
		that.openSideBar();
	};

	this.openSideBar = function() {
		$('#sidebar').addClass('active');
        $('#top-navbar').addClass('push-right');
	};

	// From Udacity course
	this.getDirections = function (origin, destination) {
		if (!origin) {
			that.toast({type: 'error', message: 'Set a home address to get directions...'});
			return;
		};

		// If directions are already on the map, remove them first.
		if (that.directionsDisplay) {
			that.directionsDisplay.setMap(null);
		};

		var directionsService = new google.maps.DirectionsService;
        // Get mode again from the user entered value.
        var mode = 'DRIVING';
        directionsService.route({
			// The origin is the passed in marker's position.
			origin: origin.location,
			// The destination is user entered address.
			destination: destination.location,
			travelMode: google.maps.TravelMode[mode]
        }, function(response, status) {
			if (status === google.maps.DirectionsStatus.OK) {
				that.directionsDisplay = new google.maps.DirectionsRenderer({
					map: that.map,
					directions: response,
					draggable: true,
					polylineOptions: {
						strokeColor: '#138496'
					}
				});
				that.tempMarker.setMap(null);
          } else {
            console.log('Directions request failed due to ' + status);
            that.toast({type: 'error', message: 'Cannot calculate the way to drive there.'})
          }
        });
	};

	// Add saved places from local storage
	var lsPlaces = localStorage.getItem('savedPlaces')
	if (lsPlaces) {
		var place_ids = JSON.parse(lsPlaces);
		console.log(place_ids);
		for (var i = 0; i < place_ids.length; i++) {
			var place_id = place_ids[i];
			that.getPlaceDetails(place_id, function(place) {
				console.log(place);
				that.savePlace(new Place(place), true);
				that.largeInfowindow.setMap(null);
			});
		};
	};
};

// This function is called as a callback on loading the Google Maps API
function init() {
	var vm = new ViewModel();
	ko.applyBindings(vm);
	$('.sidebar-collapse').on('click', function() {
        $('#sidebar').toggleClass('active');
        $('#top-navbar').toggleClass('push-right');
    });
};