function ViewModel() {
	this.searchInput = ko.observable();

	this.searchPlace = function(place) {
		var bounds = map.getBounds();
        var placesService = new google.maps.places.PlacesService(map);
        placesService.textSearch({
            query: document.getElementById('places-search').value,
            bounds: bounds
        }, function(places, status) {
            if (status === google.maps.places.PlacesServiceStatus.OK) {
                var location = places[0].geometry.location;
			    // Center the map on it and zoom
			    map.setCenter(location);
			    map.setZoom(17);
            }
        });
	};
};

function init() {
	var vm = new ViewModel();
	ko.applyBindings(vm);
};

$(function() {
	init();
});