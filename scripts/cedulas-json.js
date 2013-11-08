/*jshint node:true*/

'use strict';

var fs = require('fs');
var tsv = require('dsv').tsv;

var out = process.argv[2];

var cedulas = {};

tsv.parse(fs.readFileSync(process.argv[3], {
	encoding: 'utf8'
})).forEach(function(row) {
	cedulas[row.Cédula] = {
		fecha: row.Fecha,
		persona: row.persona
	};
});

fs.writeFileSync(out, JSON.stringify(cedulas, null, '\t') + '\n');
