extend =		require('extend');
url =			require('url');

products =		require('../products');
locations =		require('../locations');





var locations = module.exports = {



	client: null,
	locations: locations,



	init: function (client) {
		if (!client) throw new Error('Missing `client`.');
		this.client = client;

		return this;
	},



	_searchDefaults: {
		results:	10,
		stations:	true,
		addresses:	true,
		pois:		true,
		products: {
			suburban:	true,
			subway:		true,
			tram:		true,
			bus:		true,
			ferry:		true,
			express:	false,
			regional:	true
		}
	},

	// returns a promise
	search: function (query, options) {
		if (!query) throw new Error('Missing `query` parameter.');

		options = extend(true, {}, this._searchDefaults, options || {});

		params = {
			input:		query,
			maxNo:		options.results,
			type: this.locations.typesToString({
				station:	options.stations,
				address:	options.addresses,
				poi:		options.pois
			}),
			products:	products.typesToNumber(options.products)
		};

		return this.client._request('location.name', params)
		.then(this._searchOnSuccess, console.error)
		.then(console.log);
	},

	_searchOnSuccess: function (data) {
		var results = [];
		var i, length, location;
		if (data.StopLocation)
			for (i = 0, length = data.StopLocation.length; i < length; i++) {
				location = data.StopLocation[i];
				results.push({
					id:			location.extId,
					type:		'station',
					name:		location.name,
					latitude:	location.lat,
					longitude:	location.lon,
					products:	products.numberToTypes(location.products)
					// todo: notes
				});
			}

		if (data.CoordLocation)
			for (i = 0, length = data.CoordLocation.length; i < length; i++) {
				location = data.StopLocation[i];
				results.push({
					type:		locations[location.type] ? locations[location.type].type : 'unknown',
					name:		location.name,
					latitude:	location.lat,
					longitude:	location.lon
				});
			}

		return results;
	}



};