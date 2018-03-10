function ViewModel() {
	var that = this;

	this.searchInput = ko.observable();

	this.map;
	this.searchBox;

	this.tempMarker;
	this.largeInfowindow = new google.maps.InfoWindow();
	this.currentPlace;

	this.savedPlaces = ko.observableArray();
	// Add saved places from local storage
	/*var lsPlaces = localStorage.getItem('savedPlaces')
	if (lsPlaces) {
		console.log(lsPlaces);
		this.savedPlaces(lsPlaces);
		console.log(this.savedPlaces());
	};*/
	this.savedPlaces.subscribe(function() {
		// Add all places to filteredPlaces
		that.filterPlaces();
		// Reinitialize the filter
		that.filterString("");
		// Update the markers
		that.updateMarkers();
		// Store itself in localStorage
		//localStorage.setItem("savedPlaces", ko.toJSON(that.savedPlaces()));
	});

	this.filterString = ko.observable("");
	this.filteredPlaces = ko.observableArray();
	this.filterString.subscribe(function() {
		that.filterPlaces();
		that.updateMarkers();
	});

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

	    // When selecting a place suggested by Google...
	    google.maps.event.addListener(that.searchBox, 'places_changed', function () {
	    	that.searchPlace();
	    	// Trigger an input event on the searchBox so KO updates the value
		    //ko.utils.triggerEvent(searchElem, "input");
		});
	};

	this.initMap();
	this.initSearchbox();

	this.searchPlace = function() {
		// Get the place
	    var places = that.searchBox.getPlaces();
	    if (places.length == 0) {
	    	console.log("Couldn't find a place...");
	    	return;
	    };
	    var place = new Place(places[0]);
	    that.zoomOnPlace(place);
	    that.addMarker(place, true);
	};

	this.zoomOnPlace = function(place) {
		// Get the latlng
		var latlng = place.location;
	    
	    // Center the map on it and zoom
	    that.map.setCenter(latlng);
	    that.map.setZoom(17);

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
		content += place.formatted_address;
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
		var bounds = new google.maps.LatLngBounds();
		for (var i = 0; i < that.filteredPlaces().length; i++) {
			var marker = that.filteredPlaces()[i].marker;
			marker.setMap(that.map);
			bounds.extend(marker.position);
		};
		// Extend the boundaries of the map for each marker
        that.map.fitBounds(bounds);
	};

	this.updateMarkers = function() {
		that.hideSavedMarkers();
		that.showFilteredMarkers();
	};

	this.savePlace = function() {
		if (!that.currentPlace) {
			console.log("Error: there is no place to save.");
			return;
		};

		var marker = that.addMarker(that.currentPlace);
		that.savedPlaces.push({'place': that.currentPlace, 'marker': marker});
		that.tempMarker.setMap(null);
		that.searchInput("");
	};

	this.locateSavedPlace = function(place) {
		that.zoomOnPlace(place.place);
        that.populateInfoWindow(place.marker, place.place);
	};

	this.filterPlaces = function() {
		that.filteredPlaces.removeAll();
		for (var i = 0; i < that.savedPlaces().length; i++) {
			var item = that.savedPlaces()[i];
			var filter = that.filterString().toLowerCase();
			var itemName = item.place.name.toLowerCase();
			var itemAddress = item.place.formatted_address.toLowerCase();
			if (itemName.indexOf(filter) >= 0 || itemAddress.indexOf(filter) >= 0) {
		    	that.filteredPlaces.push(item);
		    	console.log(that.filteredPlaces());
		    };
		};
	};

	this.doNothing = function() {
		// This function is just there so we can press submit on a form
		// and not reload the page when we rely on events to do the stuff.
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