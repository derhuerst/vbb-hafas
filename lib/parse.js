'use strict'

const debug = require('debug')('vbb-hafas')

const parse = require('hafas-client/parse')
const util = require('vbb-util')
const omit = require('lodash.omit')
const parseLineName = require('vbb-parse-line')
const {to12Digit} = require('vbb-translate-ids')
const slugg = require('slugg')
const stations = require('vbb-stations')



const modes = [
	'train',
	'train',
	'train', // see public-transport/friendly-public-transport-format#4
	'bus',
	'ferry',
	'train',
	'train',
	null
]

const modesByClass = []
modesByClass[1] = modes[0]
modesByClass[2] = modes[1]
modesByClass[4] = modes[2] // see public-transport/friendly-public-transport-format#4
modesByClass[8] = modes[3]
modesByClass[16] = modes[4]
modesByClass[32] = modes[5]
modesByClass[64] = modes[6]

const line = (p) => {
	const r = parse.line(p)
	if (!r) {
		debug('null line', p, r)
		return null
	}
	if (r.productCode) {
		r.productCode = parseInt(r.productCode)
		r.product = (util.products.categories[r.productCode] || {}).type || null
		r.mode = modes[r.productCode]
		r.public = true
	} else if (r.class) {
		r.product = (util.products.bitmasks[r.class] || {}).type || null
		r.mode = modesByClass[r.class]
		r.public = true
	}
	if (r.name) {
		r.id = slugg(r.name.trim())

		const l = parseLineName(r.name)
		if (l && l.type) {
			Object.assign(r, omit(l, ['type', '_']))
			if (!r.product) r.product = util.products[l.type].type
		}
	}
	return r
}

const journey = (l, p, r) => {
	const parseJourney = parse.journey('Europe/Berlin', l, p, r)
	const tapped = (j) => {
		if (Array.isArray(j.secL)) {
			for (let part of j.secL) {
				if (!part) continue

				// derhuerst/vbb-rest#19
				if (part.dep && part.dep.dProgType) {
					debug('dep.dProgType', part.dep.dProgType)
				}
				if (part.arr && part.arr.aProgType) {
					debug('arr.aProgType', part.arr.aProgType)
				}
				if (part.jny && part.jny.status) {
					debug('jny.status', part.jny.status)
				}

				// derhuerst/vbb-util#2
				if (part.jny && Array.isArray(part.jny.remL)) {
					for (let _ of part.jny.remL) {
						const remark = {
							remark: r[_.remX],
							fromLoc: l[_.fLocX],
							toLoc: l[_.tLocX],
							fromIndex: _.fIdx,
							toIndex: _.tIdx
						}
						debug('remark', remark)
					}
				}
			}
		}

		// derhuerst/vbb-gtfs#2
		const parsed = parseJourney(j)
		if (parsed && Array.isArray(parsed.parts)) {
			for (let part of parsed.parts) {
				if (part && part.line && part.line.name === 'S') {
					debug('S line', part)
				}
			}
		}

		// derhuerst/vbb-hafas#17
		if (j.trfRes) debug('trfRes', j.trfRes, omit(parsed, ['parts']))

		return parsed
	}
	return tapped
}

const leadingZeros = /^0+/

const location = (l) => {
	const r = parse.location(l)

	if (r.id) {
		r.id = r.id.replace(leadingZeros, '')
		// derhuerst/vbb-hafas#22
		if (r.id.length < 9) debug('<9 digits ID', l, r)
		// derhuerst/vbb-gtfs#6
		if (r.id[0].toUpperCase() === 'M') debug('/^M/ ID', l, r)
		r.id = to12Digit(r.id)
	}
	if ('products' in r) r.products = util.products.parseBitmask(r.products)
	if (r.type === 'station' && !r.coordinates) {
		const [s] = stations(r.id)
		if (s) {
			r.coordinates = {
				latitude: s.coordinates.latitude,
				longitude: s.coordinates.longitude
			}
		}
	}
	return r
}

const nearby = (l) => {
	const r = parse.nearby(l)
	if (r.id) r.id = to12Digit(r.id.replace(leadingZeros, ''))
	if ('products' in r) r.products = util.products.parseBitmask(r.products)
	return r
}

// todo: pt.sDays
// todo: pt.dep.dProgType, pt.arr.dProgType
// todo: what is pt.jny.dirFlg?
// todo: how does pt.freq work?
// tz = timezone, s = stations, ln = lines, r = remarks
const journeyPart = (tz, s, ln, r) => (d) => {
	const result = {
		id: d.jid,
		line: ln[parseInt(d.prodX)],
		direction: d.dirTxt, // todo: parse this
		// todo: isPartCncl, isRchbl, poly
	}

	if (d.stopL) result.passed = d.stopL.map(parse.stopover(tz, s, ln, r, d))
	if (Array.isArray(d.remL)) d.remL.forEach(parse.applyRemark(s, ln, r))

	return result
}

const remark = r => r

module.exports = {line, journey, location, nearby, journeyPart, remark}
