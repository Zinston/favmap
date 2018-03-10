function ViewModel() {
	var that = this;

	this.searchInput = ko.observable();

	this.map;
	this.searchBox;
	this.tempMarker;
	this.largeInfowindow = new google.maps.InfoWindow();
	this.currentPlace;
	this.savedPlaces = ko.observableArray();

	// Initialize the map. Called on load (see below).
	this.initMap = function() {
		// Constructor creates a new map - only center and zoom are required.
		map = new google.maps.Map(document.getElementById('map'), {
			center: {lat: 40.7413549, lng: -73.9980244},
			zoom: 13,
	        disableDefaultUI: true
		});

		return map;
	};

	// Initialize the searchbox. Called on load (see below).
	this.initSearchbox = function() {
		// Create a searchbox in order to execute a places search
		var searchElem = document.getElementById('places-search');
	    var searchBox = new google.maps.places.SearchBox(searchElem);

	    // Bias the SearchBox results towards current map's viewport.
	    that.map.addListener('bounds_changed', function() {
	    	searchBox.setBounds(map.getBounds());
	    });

	    // When selecting a place suggested by Google...
	    google.maps.event.addListener(searchBox, 'places_changed', function () {
	    	// Trigger an input event on the searchBox so KO updates the value
		    ko.utils.triggerEvent(searchElem, "input");
		    // Get the place
		    var places = searchBox.getPlaces();
		    if (!places[0]) {
		    	that.searchPlace(that.searchInput());
		    	return;
		    };
		    console.log(places[0]);
		    var place = new Place(places[0]);
		    that.zoomOnPlace(place);
		    that.addMarker(place, true);
		});

		return searchBox;
	};

	this.map = this.initMap();
	this.searchBox = this.initSearchbox();

	this.searchPlace = function() {
		var bounds = that.map.getBounds();
        var placesService = new google.maps.places.PlacesService(map);

        placesService.textSearch({
            query: that.searchInput(),
            bounds: bounds
        }, function(places, status) {
            if (status === google.maps.places.PlacesServiceStatus.OK) {
                var place = new Place(places[0]);
			    that.zoomOnPlace(place);
			    that.addMarker(place, true);
            } else {
            	console.log(status);
            };
        });
	};

	this.zoomOnPlace = function(place) {
		// Get the latlng
		var latlng = place.location;
	    
	    // Center the map on it and zoom
	    map.setCenter(latlng);
	    map.setZoom(17);

	    // Set currentPlace to this place
	    that.currentPlace = place;
	};

	// Adds a marker to the map. If temp is True, the marker is temporary.
	this.addMarker = function(place, temp) {
		var latlng = place.location;
		var formatted_address = place.formatted_address;

		var marker = new google.maps.Marker({
			position: latlng,
			map: that.map,
			title: place.name
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
		var content = '<h5>' + place.name + '</h5>';
		content += '<em>' + place.type + '</em><br><br>';
		content += place.html_address;
        // Check to make sure the infowindow is not already opened on this marker.
        if (that.largeInfowindow.marker != marker) {
          	that.largeInfowindow.marker = marker;
          	that.largeInfowindow.setContent(content);
          	that.largeInfowindow.open(that.map, marker);
          	// Make sure the marker property is cleared if the infowindow is closed.
          	that.largeInfowindow.addListener('closeclick',function(){
            	that.largeInfowindow.setMarker = null;
          	});
        };
    };

	this.updateTempMarker = function(marker) {
		// Remove previous tempMarker
		if (that.tempMarker) {
			that.tempMarker.setMap(null);
		};
		that.tempMarker = marker;
	};

	this.savePlace = function() {
		if (!that.currentPlace) {
			console.log("Error: there is no place to save.");
			return;
		};

		var marker = that.addMarker(that.currentPlace);
		that.savedPlaces.push({'place': that.currentPlace, 'marker': marker});
	};

	this.locateSavedPlace = function(place) {
		that.zoomOnPlace(place.place);
        that.populateInfoWindow(place.marker, place.place);
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