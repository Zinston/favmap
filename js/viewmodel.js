function ViewModel() {
	var that = this;

	this.searchInput = ko.observable("");
	this.filterString = ko.observable("");

	this.toast = ko.observable({type: "info", message: ""}); // Accepts types info, error and success
	this.toastType = ko.computed(function() {return that.toast().type});
	this.toastCSS = ko.observable("");

	this.toast.subscribe(function() {
		that.toastCSS('show ' + that.toastType());

	    // After 3 seconds, hide the toast
	    setTimeout(function() {
	    	that.toastCSS();
	    }, 3000);
	})

	this.sidebarCSS = ko.observable("");
	this.topNavbarCSS = ko.observable("");

	this.map;
	this.searchBox;

	this.tempMarker;
	this.largeInfowindow = new google.maps.InfoWindow({maxWidth: 200});
	this.defaultIcon;
	this.favoriteIcon;
	this.homeIcon;

	this.currentPlace;
	this.directionsDisplay;

	this.home = ko.observable();
	this.home.subscribe(function() {
		// Store home's place_id in localStorage
		localStorage.setItem("home", that.home().place.place_id);
	});

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

	// Initialize the map. Called on load (see below).
	this.initMap = function() {
		var styles = [
		    {
		        "featureType": "administrative",
		        "elementType": "labels.text.fill",
		        "stylers": [
		            {
		                "color": "#444444"
		            }
		        ]
		    },
		    {
		        "featureType": "landscape",
		        "elementType": "all",
		        "stylers": [
		            {
		                "color": "#f2f2f2"
		            }
		        ]
		    },
		    {
		        "featureType": "poi",
		        "elementType": "all",
		        "stylers": [
		            {
		                "visibility": "off"
		            }
		        ]
		    },
		    {
		        "featureType": "road",
		        "elementType": "all",
		        "stylers": [
		            {
		                "saturation": -100
		            },
		            {
		                "lightness": 45
		            }
		        ]
		    },
		    {
		        "featureType": "road.highway",
		        "elementType": "all",
		        "stylers": [
		            {
		                "visibility": "simplified"
		            }
		        ]
		    },
		    {
		        "featureType": "road.highway",
		        "elementType": "geometry",
		        "stylers": [
		            {
		                "visibility": "simplified"
		            },
		            {
		                "color": "#ff6a6a"
		            },
		            {
		                "lightness": "0"
		            }
		        ]
		    },
		    {
		        "featureType": "road.highway",
		        "elementType": "geometry.fill",
		        "stylers": [
		            {
		                "color": "#ffc107"
		            }
		        ]
		    },
		    {
		        "featureType": "road.highway",
		        "elementType": "geometry.stroke",
		        "stylers": [
		            {
		                "color": "#ffc107"
		            }
		        ]
		    },
		    {
		        "featureType": "road.highway",
		        "elementType": "labels.text",
		        "stylers": [
		            {
		                "visibility": "on"
		            }
		        ]
		    },
		    {
		        "featureType": "road.highway",
		        "elementType": "labels.icon",
		        "stylers": [
		            {
		                "visibility": "on"
		            }
		        ]
		    },
		    {
		        "featureType": "road.arterial",
		        "elementType": "all",
		        "stylers": [
		            {
		                "visibility": "on"
		            }
		        ]
		    },
		    {
		        "featureType": "road.arterial",
		        "elementType": "geometry.fill",
		        "stylers": [
		            {
		                "color": "#ffc107"
		            },
		            {
		                "lightness": "62"
		            }
		        ]
		    },
		    {
		        "featureType": "road.arterial",
		        "elementType": "labels.icon",
		        "stylers": [
		            {
		                "visibility": "off"
		            }
		        ]
		    },
		    {
		        "featureType": "road.local",
		        "elementType": "geometry.fill",
		        "stylers": [
		            {
		                "lightness": "75"
		            }
		        ]
		    },
		    {
		        "featureType": "transit",
		        "elementType": "all",
		        "stylers": [
		            {
		                "visibility": "off"
		            }
		        ]
		    },
		    {
		        "featureType": "transit.line",
		        "elementType": "all",
		        "stylers": [
		            {
		                "visibility": "on"
		            }
		        ]
		    },
		    {
		        "featureType": "transit.station.bus",
		        "elementType": "all",
		        "stylers": [
		            {
		                "visibility": "on"
		            }
		        ]
		    },
		    {
		        "featureType": "transit.station.rail",
		        "elementType": "all",
		        "stylers": [
		            {
		                "visibility": "on"
		            }
		        ]
		    },
		    {
		        "featureType": "transit.station.rail",
		        "elementType": "labels.icon",
		        "stylers": [
		            {
		                "weight": "0.01"
		            },
		            {
		                "hue": "#ff0028"
		            },
		            {
		                "lightness": "0"
		            }
		        ]
		    },
		    {
		        "featureType": "water",
		        "elementType": "all",
		        "stylers": [
		            {
		                "visibility": "on"
		            },
		            {
		                "color": "#17a2b8"
		            },
		            {
		                "lightness": "25"
		            },
		            {
		                "saturation": "-23"
		            }
		        ]
		    }
		];
		// Constructor creates a new map - only center and zoom are required.
		this.map = new google.maps.Map(document.getElementById('map'), {
			center: {lat: 40.7413549, lng: -73.9980244},
			zoom: 13,
			styles: styles,
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

    this.makePlaceObject = function(place) {
		var placeObject = new Place(place);

		if (!placeObject.photo) {
			placeObject.photo = that.getStreetViewImage(place.formatted_address);
		};

	    that.getFoursquare(placeObject);

	    return placeObject;
    };

	this.searchPlace = function(origin) {
		switch (origin) {
			case 'searchBox':
				that.searchBoxPlace();
				break;
			default:
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
			    		var place = that.makePlaceObject(place);
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
	    	var place = that.makePlaceObject(places[0]);
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

		if (that.tempMarker) {
			that.tempMarker.setMap(null);
		};

		switch (type) {
			case 'favorite':
				var icon = that.favoriteIcon;
				break;
			case 'home':
				var icon = that.homeIcon;
				break;
			default:
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
	        that.tempMarker = marker;
	    };

	    var infowindow = that.addInfoWindow(marker, place);

	    return marker;
	};

	this.addInfoWindow = function(marker, place) {
		that.populateInfoWindow(marker, place);
		marker.addListener('click', function() {
			that.populateInfoWindow(marker, place);
            that.largeInfowindow.open(that.map, this);
            that.animateMarker(marker);
        });
	};

	this.animateMarker = function(marker) {
        marker.setAnimation(google.maps.Animation.BOUNCE);
        // 1 bounce is 725 -> 3 bounces = 2175
		setTimeout(() => marker.setAnimation(null), 2175);
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
		if (place.photo) {
            content += '<br><br><img src="'
            content += place.photo;
            content += '">';
        };

        content += '<br>';

        var isHome = that.home() ? place.place_id == that.home().place.place_id : false;
        var isFavorite = false;
        for (var i = 0; i < that.savedPlaces().length; i++) {
        	isFavorite = place.place_id == that.savedPlaces()[i].place.place_id;
        };

        if (!isHome) {
	        content += '<button id="home-btn-' + place.place_id;
	        content += '" class="btn btn-secondary btn-sm mt-2 mr-2">Home</button>';

	        if (!isFavorite) {
		        content += '<button id="fav-btn-' + place.place_id;
		        content += '" class="btn btn-warning btn-sm mt-2">';
		        content += '<i class="fas fa-star text-white"></i>';
		        content += '</button>';
		    };

        	if (that.home()) {
		        content += '<button id="go-btn-' + place.place_id;
		        content += '" class="btn btn-info btn-sm mt-2 ml-2">Go</button';
		    };
	    } else {
	    	content += '<br><em style="color: #6b7be3; font-weight: bold;">This is your home</em>';
	    };

		content += '</div>';

        // Check to make sure the infowindow is not already opened on this marker.
        if (that.largeInfowindow.marker != marker) {
          	that.largeInfowindow.marker = marker;
        };
      	that.largeInfowindow.setContent(content);
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
		if (that.home() && place != that.home().place) {
			$('#go-btn-' + place.place_id).click(function() {
				if (!that.home()) {
					that.toast({type: "error", message: "Error: Set a home address to get directions..."});
					return;
				};

				that.infowindowAskTravelMode(place);

				$('#bicycling').click(function() {
		    		that.getDirections(that.home().place, place, 'BICYCLING');
		    		that.populateInfoWindow(marker, place);
		    		that.largeInfowindow.setMap(null);
		    	});
		    	$('#driving').click(function() {
		    		that.getDirections(that.home().place, place, 'DRIVING');
		    		that.populateInfoWindow(marker, place);
		    		that.largeInfowindow.setMap(null);
		    	});
		    	$('#transit').click(function() {
		    		that.getDirections(that.home().place, place, 'TRANSIT');
		    		that.populateInfoWindow(marker, place);
		    		that.largeInfowindow.setMap(null);
		    	});
		    	$('#walking').click(function() {
		    		that.getDirections(that.home().place, place, 'WALKING');
		    		that.populateInfoWindow(marker, place);
		    		that.largeInfowindow.setMap(null);
		    	});
			});
		};
    };

    this.infowindowAskTravelMode = function() {
    	var content = '<h5>How do you want to travel?</h5>';
    	content += '<div class="container"><form class="form-control"><div class="form-check">';
    	content += '<input class="form-check-input" type="radio" name="travelMode" id="bicycling" value="BICYCLING">';
    	content += '<label class="form-check-label" for="bicycling">Bicycling</label>';
    	content += '</div>';
    	content += '<div class="form-check">';
    	content += '<input class="form-check-input" type="radio" name="travelMode" id="driving" value="DRIVING">';
    	content += '<label class="form-check-label" for="driving">Driving</label>';
    	content += '</div>';
    	content += '<div class="form-check">';
    	content += '<input class="form-check-input" type="radio" name="travelMode" id="transit" value="TRANSIT">';
    	content += '<label class="form-check-label" for="transit">Transit</label>';
    	content += '</div>';
    	content += '<div class="form-check">';
    	content += '<input class="form-check-input" type="radio" name="travelMode" id="walking" value="WALKING">';
    	content += '<label class="form-check-label" for="walking">Walking</label>';
    	content += '</div>';
    	//content += '<div class="text-center mt-2"><input type="submit" class="btn btn-sm btn-info" value="Go!"></div>';
    	content += '</form></div>';
    	that.largeInfowindow.setContent(content);
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

		var placeToSave = {'place': place, 'marker': marker}
		that.savedPlaces.push(placeToSave);

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
        that.animateMarker(place.marker);
	};

	this.locateHome = function() {
		that.zoomOnPlace(that.home().place);
		that.populateInfoWindow(that.home().marker, that.home().place);
		that.animateMarker(that.home().marker);
	};

	this.deletePlace = function(place) {
		that.savedPlaces.remove(place);
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
		that.filteredPlaces.valueHasMutated();
	};

	this.makeHome = function(place, init) {
		if (that.home()) {
			if (that.home().marker) {
				that.home().marker.setMap(null);
			};
		};
		
		var marker = that.addMarker(place, 'home');
		that.home({place: place, marker: marker});

		if (!init) {
			that.zoomOnPlace(that.currentPlace);
			that.searchInput("");
			that.openSideBar();
		};
	};

	this.openSideBar = function() {
		that.sidebarCSS("active");
		that.topNavbarCSS("push-right");
	};

	// From Udacity course
	this.getDirections = function (origin, destination, travelMode) {
		if (!origin) {
			that.toast({type: 'error', message: 'Set a home address to get directions...'});
			return;
		};

		// If directions are already on the map, remove them first.
		if (that.directionsDisplay) {
			that.directionsDisplay.setMap(null);
		};

		var directionsService = new google.maps.DirectionsService;
        directionsService.route({
			// The origin is the passed in marker's position.
			origin: origin.location,
			// The destination is user entered address.
			destination: destination.location,
			travelMode: google.maps.TravelMode[travelMode]
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
				if (that.tempMarker) {
					that.tempMarker.setMap(null);
				};
          } else {
            console.log('Directions request failed due to ' + status);
            that.toast({type: 'error', message: 'Cannot calculate the way to drive there.'})
          }
        });
	};

	this.getStreetViewImage = function(address) {
		address = encodeURIComponent(address);

		var size = "200x100";
	    var key = "AIzaSyCTwor9YNahCVHkPbpH5Mzz2-NG2NUEGlM"

	    var url = "https://maps.googleapis.com/maps/api/streetview";
	    url += "?size=" + size;
	    url += "&location=" + address;
	    url += "&pitch=0";
	    url += "&key=" + key;

	    return url;
	};

	this.getFoursquare = function(place) {
		that.getFoursquareID(place);
	};

	this.getFoursquareID = function(place) {
		var url = "https://api.foursquare.com/v2/venues/search";
		var ll = place.location.lat() + ',' + place.location.lng();
		var query = place.name;
		var client_id = "CZDTEVWMPXCUBZMIW33QTHOAF0I25I0FNEK54JWBC2NLHUPD";
		var client_secret = "5UMLDZH2VAS54BCJ1XMGTBOP2TKYUYQ1XA3EYEY2PSRAQV0N";
		var version = "20180314";

		url += '?client_id=' + client_id;
		url += '&client_secret=' + client_secret;
		url += '&v=' + version;
		url += '&ll=' + ll;
		url += '&query=' + query;

		$.getJSON(url, function(data) {
			if (data.meta.code == 200) {
				if (data.response.venues.length > 0) {
					var fsid = data.response.venues[0].id;
					that.getFoursquareDetails(place, fsid);
				} else {
					console.log("Couldn't find this place on Foursquare Venues.");
				};
			} else {
				console.log("Error: Foursquare's Search Venues returned an error " + data.meta.code + ".");
			};
		});
	};

	this.getFoursquareDetails = function(place, id) {
		var url = "https://api.foursquare.com/v2/venues/" + id;
		var client_id = "CZDTEVWMPXCUBZMIW33QTHOAF0I25I0FNEK54JWBC2NLHUPD";
		var client_secret = "5UMLDZH2VAS54BCJ1XMGTBOP2TKYUYQ1XA3EYEY2PSRAQV0N";
		var version = "20180314";
		
		url += '?client_id=' + client_id;
		url += '&client_secret=' + client_secret;
		url += '&v=' + version;

		$.getJSON(url, function(data) {
			if (data.meta.code == 200) {
				if (data.response.venue) {
					var venue = data.response.venue;

					place.fs_name = venue.name;
					place.fs_contact = venue.contact;
					place.fs_description = venue.description;
					place.fs_likes = venue.likes;
					place.fs_rating = {rating: venue.rating, color: venue.ratingColor};
				} else {
					console.log("Couldn't find this place on Foursquare Details.");
				};
			} else {
				console.log("Error: Foursquare's Get Details returned an error " + data.meta.code + ".");
			};
		});
	};

	this.init = function() {
		this.initMap();
		this.initSearchbox();
		this.defaultIcon = this.makeMarkerIcon('f75850');
		this.favoriteIcon = this.makeMarkerIcon('ffc107');
		this.homeIcon = this.makeMarkerIcon('6b7be3');

		var bounds = new google.maps.LatLngBounds();
		// Add saved places from local storage
		var lsPlaces = localStorage.getItem('savedPlaces');
		if (lsPlaces) {
			var place_ids = JSON.parse(lsPlaces);
			for (var i = 0; i < place_ids.length; i++) {
				var place_id = place_ids[i];
				that.getPlaceDetails(place_id, function(place) {
					var placeToSave = that.makePlaceObject(place);
					that.savePlace(placeToSave, true);
					that.largeInfowindow.setMap(null);
					bounds.extend(place.geometry.location);
					that.map.fitBounds(bounds);
				});
			};
		};
		// Add home from local storage
		var home = localStorage.getItem('home');
		if (home) {
			that.getPlaceDetails(home, function(place) {
				var placeToSave = that.makePlaceObject(place);
				that.makeHome(placeToSave, true);
				that.largeInfowindow.setMap(null);
				bounds.extend(place.geometry.location);
				that.map.fitBounds(bounds);
			});
		};
	};

	that.init();
};

// This function is called as a callback on loading the Google Maps API
function init() {
	ko.options.deferUpdates = true;
	var vm = new ViewModel();
	ko.applyBindings(vm);
	$('.sidebar-collapse').on('click', function() {
        $('#sidebar').toggleClass('active');
        $('#top-navbar').toggleClass('push-right');
    });
};