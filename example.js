'use strict'

const hafas = require('.')

hafas.journeys('900000003201', '900000024101', {results: 1, tickets: true})
// hafas.departures('900000013102', {duration: 1})
// hafas.locations('Alexanderplatz', {results: 2})
// hafas.nearby(52.5137344, 13.4744798, {distance: 60})
// hafas.radar(52.52411, 13.41002, 52.51942, 13.41709, {results: 10})
.then((data) => {
	console.log(require('util').inspect(data, {depth: null}))
}, console.error)
