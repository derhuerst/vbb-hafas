'use strict'

const a = require('assert')
const stations = require('vbb-stations-autocomplete')
const {isValidId} = require('../lib/helpers')
const floor = require('floordate')
const isRoughlyEqual = require('is-roughly-equal')



const findStation = (name) => stations(name, 1, false, false)[0]

const assertValidCoordinates = (t, c) => {
	t.ok(c)
	t.strictEqual(typeof c.latitude, 'number')
	t.strictEqual(typeof c.longitude, 'number')
}

const assertValidStation = (t, s, onlyLongIds = true) => {
	t.strictEqual(s.type, 'station')
	t.ok(isValidId(s.id))
	if (onlyLongIds) t.strictEqual(s.id.length, 12)
	t.strictEqual(typeof s.name, 'string')
	t.strictEqual(s.name.indexOf('(Berlin)'), -1)
	t.ok(findStation(s.name))
	assertValidCoordinates(t, s.coordinates)
}

const assertValidFrameStation = (t, s) => {
	t.strictEqual(s.type, 'station')
	t.ok(isValidId(s.id))
	t.strictEqual(typeof s.name, 'string')
	t.strictEqual(s.name.indexOf('(Berlin)'), -1)
	if (s.coordinates) assertValidCoordinates(t, s.coordinates)
}

const assertValidPoi = (t, p) => {
	t.strictEqual(p.type, 'poi')
	t.ok(isValidId(p.id))
	t.strictEqual(typeof p.name, 'string')
	assertValidCoordinates(t, p.coordinates)
}

const assertValidAddress = (t, addr) => {
	t.strictEqual(addr.type, 'address')
	t.strictEqual(typeof addr.name, 'string')
	assertValidCoordinates(t, addr.coordinates)
}

const assertValidLocation = (t, l, onlyLongIds = true) => {
	if (l.type === 'station') assertValidStation(t, l, onlyLongIds)
	else if (l.type === 'poi') assertValidPoi(t, l)
	else if (l.type === 'address') assertValidAddress(t, l)
	else t.ifError(new Error('invalid location type'))
}

const assertValidPassed = (t, p) => {
	assertValidStation(t, p.station)
	if (p.arrival) assertValidWhen(t, p.arrival)
	if (p.departure) assertValidWhen(t, p.departure)
}

const isValidMode = (m) =>
	   m === 'walking'
	|| m === 'train'
	|| m === 'bus'
	|| m === 'ferry'

const assertValidLine = (t, l) => {
	t.strictEqual(l.type, 'line')
	t.strictEqual(typeof l.id, 'string')
	t.ok(l.id)
	t.strictEqual(typeof l.name, 'string')
	t.ok(isValidMode(l.mode))
	t.strictEqual(typeof l.public, 'boolean')
	t.strictEqual(typeof l.product, 'string')
	if (l.nr) t.strictEqual(typeof l.nr, 'number')
	t.strictEqual(typeof l.metro, 'boolean')
	t.strictEqual(typeof l.express, 'boolean')
	t.strictEqual(typeof l.night, 'boolean')
}



const minute = 60 * 1000
const hour = 60 * minute
const day = 24 * hour
const week = 7 * day
// next Monday
const when = new Date(+floor(new Date(), 'week') + week + 10 * hour)

const assertValidWhen = (t, w, tolerance = 2 * hour) => {
	t.equal(typeof w, 'string')
	const ts = +new Date(w)
	t.ok(!Number.isNaN(ts))
	t.ok(isRoughlyEqual(tolerance, +when, ts))
}



const assertValidTicket = (t, ti) => {
	t.strictEqual(typeof ti.name, 'string')
	t.ok(ti.name.length > 0)
	if (ti.price !== null) {
		t.strictEqual(typeof ti.price, 'number')
		t.ok(ti.price > 0)
	}
	if (ti.amount !== null) {
		t.strictEqual(typeof ti.amount, 'number')
		t.ok(ti.amount > 0)
	}

	if ('bike' in ti) t.strictEqual(typeof ti.bike, 'boolean')
	if ('shortTrip' in ti) t.strictEqual(typeof ti.shortTrip, 'boolean')
	if ('group' in ti) t.strictEqual(typeof ti.group, 'boolean')
	if ('fullDay' in ti) t.strictEqual(typeof ti.fullDay, 'boolean')

	if (ti.tariff !== null) {
		t.strictEqual(typeof ti.tariff, 'string')
		t.ok(ti.tariff.length > 0)
	}
	if (ti.coverage !== null) {
		t.strictEqual(typeof ti.coverage, 'string')
		t.ok(ti.coverage.length > 0)
	}
	if (ti.variant !== null) {
		t.strictEqual(typeof ti.variant, 'string')
		t.ok(ti.variant.length > 0)
	}
}



module.exports = {
	assertValidStation, assertValidFrameStation,
	assertValidPoi,
	assertValidAddress,
	assertValidLocation,
	assertValidPassed,
	isValidMode,
	assertValidLine,
	minute, hour, when,
	assertValidWhen,
	assertValidTicket
}
