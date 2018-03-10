var Place = function(place) {
	this.place_id = place.place_id;
	this.name = place.name;
	this.location = place.geometry.location;
	this.formatted_address = place.formatted_address;
	this.html_address = place.adr_address;
	this.icon = place.icon;
	this.type = place.types[0].charAt(0).toUpperCase() + place.types[0].slice(1).replace(/_/g, ' ');
};