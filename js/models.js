var Place = function(place) {
	this.location = place.geometry.location;
	this.formatted_address = place.formatted_address;
};