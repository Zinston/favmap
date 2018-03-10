var Place = function(place) {
	this.place_id = place.place_id;
	this.name = place.name;
	this.location = place.geometry.location;
	this.formatted_address = place.formatted_address;
	this.icon = place.icon;
};