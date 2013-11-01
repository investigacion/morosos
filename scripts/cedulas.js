/*jshint node:true*/

'use strict';

var fs = require('fs');
var tsv = require('dsv').tsv;

var txts = process.argv.slice(3);
var out = process.argv[2];

var cedulas = [];

txts.forEach(function(txt) {
	var contents, fecha;

	contents = fs.readFileSync(txt, {
		encoding: 'utf8'
	});

	fecha = txt.match(/\d{2}\-\d{2}\-\d{4}/)[0];

	// X-XXXX-XXXX para personas físicas
	// X-XXX-XXXXXX para personas jurídicas
	// http://www.pgr.go.cr/scij/Busqueda/Normativa/Normas/nrm_repartidor.asp?param1=NRA&nValor1=1&nValor2=64352&nValor3=74589&nValor5=32&strTipM=FA
	contents.match(/\b\d{10}\b/g).forEach(function(cedula) {
		cedulas.push({
			Fecha: fecha,
			Cédula: cedula,
			Persona: 'jurídica'
		});
	});

	contents.match(/\b\d{9}\b/g).forEach(function(cedula) {
		cedulas.push({
			Fecha: fecha,
			Cédula: cedula,
			Persona: 'física'
		});
	});
});

fs.writeFileSync(out, tsv.format(cedulas) + '\n');
