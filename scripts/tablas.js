/*jshint node:true*/

'use strict';

var fs = require('fs');

(function() {
	var files = process.argv.slice(2);
	var job, tablas = [];

	job = function(fileName) {
		fileName = fileName.trim();
		if (!fileName) {
			return;
		}

		extractFile(fileName, function(err, tables) {
			if (err) {
				throw new Error('Error while extracting: ' + err);
			}

			tablas.push.apply(tablas, tables);
			fileName = files.pop();
			if (fileName) {
				job(fileName);
				return;
			}

			console.log('Records extracted: ' + tablas.reduce(function(p, c) {
				return p + c.filas.length;
			}, 0) + '.');

			fs.writeFile(__dirname + '/../data/json/tablas.json', JSON.stringify(tablas, null, '\t'), function(err) {
				if (err) {
					throw err;
				}
			});
		});
	};

	job(files.pop());
}());

function extractFile(fileName, cb) {
	fs.readFile(fileName, {
		encoding: 'utf8'
	}, function(err, data) {
		if (err) {
			return cb(err);
		}

		console.log('Extracting tables from "' + fileName + '"...');

		cb(null, extractTables(data));
	});
}

function extractTables(data) {
	var parts, i, l, name, date, rows, tables = [];

	parts = data.slice(data.search(/.+\s+Fecha de corte:/)).split(/(.+)\s+Fecha de corte: ([\d\/]+)/);
	parts.shift();

	for (i = 0, l = parts.length; i < l; i = i + 3) {
		name = extractName(parts[i]);
		date = extractDate(parts[i + 1]);
		rows = extractRows(parts[i + 2]);

		console.log('Extracted table for ' + date.getFullYear() + '-' + (date.getMonth() + 1) + ' with ' + rows.length + ' rows.');

		tables.push({
			filas: rows,
			fecha: date,
			titulo: name
		});
	}

	return tables;
}

function extractName(part) {
	return part.trim();
}

function extractDate(part) {
	var month, parts = part.trim(part).split('/');

	month = parseInt(parts[1], 10) - 1;

	return new Date(parts[2], month, parts[0]);
}

function extractRows(part) {
	var i, l, lines, line, match, mode, cedula, fine, rows;

	rows = [];
	lines = part.split('\n');

	if (/Monto\n/.test(part)) {
		mode = 3;

	// Others have no fine amount field.
	} else if (/Impuesto o sanción\n/.test(part)) {
		mode = 2;

	// Older files (e.g. Jan 2011) have no fine and reason fields.
	} else if (/Cédula\n/.test(part)) {
		mode = 1;
	} else {
		throw new Error('Unhandled table type.');
	}

	for (i = 0, l = lines.length; i < l; i++) {
		line = lines[i];

		switch (mode) {
		case 1:
			match = line.match(/ (\d{9,10})$/);
			if (!match) {
				continue;
			}

			cedula = match[1];
			fine = null;
			break;

		case 2:
			match = line.match(/ (\d{9,10}) /);
			if (!match) {
				continue;
			}

			cedula = match[1];
			fine = null;

			break;

		case 3:
			match = line.match(/ (\d{9,10}) (?!S\.A\.)/);
			if (!match) {
				continue;
			}

			cedula = match[1];

			match = line.match(/\s+[A-ZÉÓÚÍ,\s]+([\d,]+)$/);
			if (!match) {

				// Try the next line.
				// If the previous fields were too long, the row might have wrapped from the reason onwards.
				i++;
				line = lines[i];
				match = line.match(/^\s+[A-ZÉÓÚÍ,\s]+([\d,]+)$/);

				if (!match) {
					throw new Error('Expecting fine on line ' + i + ', found: "' + line + '".');
				}
			}

			fine = parseInt(match[1].replace(/,/g, ''), 10);

			break;
		}

		rows.push({
			cedula: cedula,
			multa: fine
		});
	}

	return rows;
}
