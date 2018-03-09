var map;

function initMap() {
	// Constructor creates a new map - only center and zoom are required.
	map = new google.maps.Map(document.getElementById('map'), {
		center: {lat: 40.7413549, lng: -73.9980244},
		zoom: 13,
        disableDefaultUI: true
	});

	// Create a searchbox in order to execute a places search
	var searchInput = document.getElementById('places-search');
    var searchBox = new google.maps.places.SearchBox(searchInput);
    // Bias the SearchBox results towards current map's viewport.
    map.addListener('bounds_changed', function() {
      searchBox.setBounds(map.getBounds());
    });

    // When selecting a place suggested by Google...
    google.maps.event.addListener(searchBox, 'places_changed', function () {
    	// Trigger an input event on the searchBox so KO updates the value
	    ko.utils.triggerEvent(searchInput, "input");
	    // Get the place
	    var places = searchBox.getPlaces();
	    if (!places[0]) {
	    	alert("Couldn't find this place.");
	    	return;
	    };
	    var location = places[0].geometry.location;
	    // Center the map on it and zoom
	    map.setCenter(location);
	    map.setZoom(17);
	});
};