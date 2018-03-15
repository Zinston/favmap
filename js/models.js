var Place = function(place) {
	this.place_id = place.place_id;
	this.name = place.name;
	this.location = place.geometry.location;

	this.icon = place.icon;
	this.type = place.types[0].charAt(0).toUpperCase() + place.types[0].slice(1).replace(/_/g, ' ');

	this.formatted_address = place.formatted_address;
	this.international_phone_number = place.international_phone_number;

	if (place.photos) {
		this.photo = place.photos[0].getUrl( {maxHeight: 100, maxWidth: 200} );
	};
	this.price_level = place.price_level;
	this.rating = place.rating;
	this.website = place.website;
	if (place.opening_hours) {
		this.openingHours = place.opening_hours.weekday_text;
	};

	this.fs_name = ko.observable();
	this.fs_contact = ko.observable();
	this.fs_description = ko.observable();
	this.fs_likes = ko.observable();
	this.fs_rating = ko.observable();

	var that = this;
	this.facebookUsername = ko.computed(function() {
		return that.fs_contact() ? (that.fs_contact().facebookUsername ? "http://www.facebook.com/" + that.fs_contact().facebookUsername : null) : null;
	});
	this.twitter = ko.computed(function() {
		return that.fs_contact() ? (that.fs_contact().twitter ? "https://www.twitter.com/" + that.fs_contact().twitter : null) : null;
	});
};