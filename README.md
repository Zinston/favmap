# Favmap
Make a list of favorite places on a world map, filter through them, get info on them, and get directions to them.

[Try it here!](http://developer.antoineguenet.com/favmap/)

## Installation
* Clone this repository: `git clone https://github.com/Zinston/favmap.git`
* Open `index.html` in your favorite browser

## Usage
* Type the name of a place in the search bar.
* Either press return or select one of Google's suggestions: a marker appears on the map, with an open infowindow.
	* Click HOME to set this place as your home: a sidebar opens with your home in blue. Click on the home icon next to it to see your home on the map again.
	* Click the star icon to set this place as one of your favorites: a sidebar opens with your list of favorite places. Click on their name to see more information on them (from Google and Foursquare). Click on their icon to see them on the map.
	* Click the GO button (only if you've set a home already): four travel mode options are displayed in the infowindow. Pick one of them. The directions from your home to that location appear on the map.

## Notes
* Your favorite places and your home are stored in your browser via localStorage.
* The name of the place on the infowindow is a link to the place's website if one was found by Google.
* You can change your home address but not remove it entirely. Once you have a home, you have a home.
* No animals were hurt in the making of this app.

## Contributing
Ideas, contributions and improvements are more than welcome. When adding a feature, please create a separate topic branch and first look at the Issues to find out if someone else is working on it already.

## License
_Favmap_ is released under the [Apache License 2.0](/LICENSE).