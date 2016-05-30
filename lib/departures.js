'use strict'

const stringify = require('./stringify')
const request = require('./request')
const parse = require('./parse')



const defaults = {
	direction: null, // only show departures heading to this station
	// todo: find option for absolute number of results
	duration:  10 // show departures for the next n minutes
}



const departures = (station, opt) => {
	if ('number' !== typeof station) throw new Error('station must be a number.')
	opt = Object.assign({}, defaults, opt || {})
	opt.when = opt.when || new Date()

	return request({
		  cfg: {polyEnc: 'GPA'}
		, meth: 'StationBoard'
		, req: {
        	  type: 'DEP'
			, date: stringify.date(opt.when)
			, time: stringify.time(opt.when)
			, stbLoc: {type: 'S', lid: 'L=' + station}
			, dirLoc: opt.direction
				? {type: 'S', lid: 'L=' + opt.direction} : null
			, dur: opt.duration
	        , getPasslist: false
		}
	})
	.then((data) => {
		// todo: planning period data.fpB, data.fpE
		if (!data.jnyL) return []
		const stations = data.common.locL.map(parse.location)
		const products = data.common.prodL.map(parse.product)
		const remarks  = data.common.remL.map(parse.remark)
		return data.jnyL.map(parse.departure(stations, products, remarks))
	}, (err) => {console.error(err.stack); return err})
}

module.exports = departures