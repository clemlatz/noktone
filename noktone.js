
	var appVersion = '0.3';
	
	var base,
		tempo,
		noteDuration,
		wave,
		board_height,
		board_width,
		sheet;
	
	
	var playing = 0;
	var cursor = 1;
	var mousedown = 0;
	var freestyle = 0;
	var started = 0;
	
	var oscillator = new Array();
	
	// Version Check
	window.addEventListener('load', function(e) {
		
	  window.applicationCache.addEventListener('updateready', function(e) {
		if (window.applicationCache.status == window.applicationCache.UPDATEREADY) {
		  // Browser downloaded a new app cache.
		  if (confirm('A new version of this application is available. Load it?')) {
			window.location.reload();
		  }
		} else {
		  // Manifest didn't changed. Nothing new to server.
		}
	  }, false);
		
	}, false);
	
	// Scales
	sc = new Array();
	sc[0] = new Array(2,2,1,2,2,2,1); // Major
	sc[1] = new Array(2,1,2,2,1,2,2); // Minor
	sc[2] = new Array(2,1,2,2,1,3,1); // Minor harmonic
	sc[3] = new Array(2,1,2,2,2,2,1); // Minor melodic
	sc[4] = new Array(2,2,3,2,3); // Pentatonic major
	sc[5] = new Array(3,2,2,3,2); // Pentatonic minor
	sc[6] = new Array(3,2,1,1,3,2); // Blues
	sc[9] = new Array(1,1); // None

	// Audio Context
	var context = new (window.AudioContext || window.webkitAudioContext);
	
	// Play note from oscillator
	function playNote(frequency) {
		
		var i = Math.random(0,10000);
		
		// Create OscillatorNode
		oscillator[i] = context.createOscillator(); // Create sound source
		oscillator[i].type = wave; // Wave form
		oscillator[i].frequency.value = frequency; // Frequency in hertz
		oscillator[i].noteOn(0); // Play oscillator[i] instantly
		setTimeout(function() {
			oscillator[i].noteOff(0);
		}, noteDuration);
	 
		// Connect the Nodes
		oscillator[i].connect(context.destination); // Connect gain to output
	 
	};
	
	// Calculate note from base and interval
	function calcNote(base,interval) {
		return Math.round(base * Math.pow(2,interval/12)*100)/100;
	}
	
	// Get 'max' notes of 'scale' from 'base'
	function getScaleNotes(scale,base,max) {
		interval = 0;
		ni = 0;
		notes = new Array();
		ints = new Array();
		for(n = 0; n < max; n++) {
			note = calcNote(base,interval);
			interval = interval + scale[ni];
			ints[n] = scale[ni];
			notes[n] = note;
			ni++;
			if (ni >= scale.length) ni = 0;
		}
		return notes;
	}
	
	// Draw the board
	function draw() {
		
		board_height = $('#board_height').val();
		board_width = $('#board_width').val();
		
		update();
		
		table = $("table");
		
		table.html('');
		
		for(y = 1; y <= board_height; y++) {
			table.append('<tr id="line'+y+'">');
			
			for(x = 1; x <= board_width; x++) {
				$("#line"+y).append('<td id="cell'+x+'x'+y+'"></td>');
			}
			x = 1;
			
			table.append('</tr>');
		}
		
		// Use preloaded sheet
		if (sheet != undefined) {
			sh = sheet.split('.');
			for (yi = 0; yi < sh.length; yi++) {
				line = '';
				length = board_width;
				while(length--) line += (sh[yi] >> length ) & 1;  
				li = line.split('');
				for(xi = 0; xi < li.length; xi++) {
					if (li[xi] == 1) {
						$('#cell'+(xi+1)+'x'+(yi+1)).addClass('i');
					}
				}
			}
		}
		
		setNotes();
		
		update();
		
		loadEvents();
		
		updateUrl();
		
	}
	
	// Each cell get its note
	function setNotes()
	{
		var notes = getScaleNotes(sc[scale],base,board_height);
		for(y = 1; y <= board_height; y++) {
			for(x = 1; x <= board_width; x++) {
				$('#cell'+x+'x'+y).data('note',notes[board_height-y]).attr('title',notes[board_height-y]).data('x',x).data('y',y).addClass('x'+x+' y'+y);
			}
		}
	}

	
	function play() {
		
		if (playing == 0) {
			playing = 1;
			updateUrl();
		}
		
		if(cursor > board_width) {
			cursor = 1;
			if(freestyle) addRandom();
		}
		
		$('td').removeClass('p p1 p2');
		
		for(y = 0; y < board_height+1; y++) {
			cell = $("#cell"+cursor+"x"+y);
			note = cell.data('note');
			if (cell.hasClass('i')) {
				cell.addClass('p');
				visualEffect(cell);
				playNote(note);
			}
		}
		
		cursor++;
		
		playTO = setTimeout(function() { play(cursor); },noteDuration);
	}
	
	function visualEffect() {
		x = cell.data('x');
		y = cell.data('y');
		$('#cell'+(x+1)+'x'+(y)).addClass('p1');
		$('#cell'+(x)+'x'+(y+1)).addClass('p1');
		$('#cell'+(x-1)+'x'+(y)).addClass('p1');
		$('#cell'+(x)+'x'+(y-1)).addClass('p1');
		$('#cell'+(x+2)+'x'+(y)).addClass('p2');
		$('#cell'+(x)+'x'+(y+2)).addClass('p2');
		$('#cell'+(x-2)+'x'+(y)).addClass('p2');
		$('#cell'+(x)+'x'+(y-2)).addClass('p2');
		$('#cell'+(x+1)+'x'+(y+1)).addClass('p2');
		$('#cell'+(x+1)+'x'+(y-1)).addClass('p2');
		$('#cell'+(x-1)+'x'+(y+1)).addClass('p2');
		$('#cell'+(x-1)+'x'+(y-1)).addClass('p2');
	}
	
	function pause() {
		playing = 0;
		updateUrl();
		clearTimeout(playTO);
	}
	
	function update() {
		
		base = parseInt($('#base').val());
		wave = parseInt($('#wave').val());
		scale = parseInt($('#scale').val());
		if($('#freestyle').is(':checked')) freestyle = 1; else freestyle = 0;
		
		tempo = $('#tempo').val();
		noteDuration = 60 / tempo * 1000 / 4;
		
		setNotes();
		
		updateUrl();
		
	}
	
	function rewind() {
		cursor = 0;
		$('td').removeClass('p p1 p2');
	}
	
	function reset() {
		$('td').removeClass('i p p1 p2');
		updateUrl();
	}
	
	function randomize() {
		reset();
		$('td').each( function(i) {
			console.log(board_height);
			if (Math.floor(Math.random() * (board_height+2)) == 1) {
				$(this).addClass('i');
			}
		});
	}
	
	function addRandom() {
		var xR = Math.floor(Math.random() * (board_width)) + 1;
		var yR = Math.floor(Math.random() * (board_height)) + 1;
		$('.x'+xR).removeClass('i');
		$('#cell'+xR+'x'+yR).addClass('i');
	}
	
	function getParamsFromURL()
	{
		var sPageURL = window.location.search.substring(1);
		var sURLVariables = sPageURL.split('&');
		for (var i = 0; i < sURLVariables.length; i++) 
		{
			var sParam = sURLVariables[i].split('=');
			window[sParam[0]] = sParam[1];
			$('#'+sParam[0]).val(sParam[1]);
			if (sParam[0] == "playing" && sParam[1] == "1") play(0); 
		}
		if (freestyle == 1) $('#freestyle').attr('checked',true);
		update();
	}
	
	function updateUrl() {
		var params = new Array();
		var sheet = '';
		for(y = 1; y <= board_height; y++) {
			var line = '';
			for(x = 1; x <= board_width; x++) {
				var note;
				if($('#cell'+x+'x'+y).hasClass('i') === true) note = '1';
				else note = '0';
				line += note;
			}
			if (sheet != '') sheet += '.';
			sheet += parseInt(line, 2);
		}
		//params['sheet'] = sheet;
		params = {
			sheet: sheet,
			board_height: board_height,
			board_width: board_width,
			base: base,
			tempo: tempo,
			scale: scale,
			wave: wave,
			playing: playing,
			freestyle: freestyle
		}
		var url = 'http://labs.nokto.net/noktone/?'+$.param(params);
		$('#shareUrl').val(url);
		$('#shareUrlFB').attr('href','http://www.facebook.com/sharer/sharer.php?u='+encodeURIComponent(url));
		$('#shareUrlTW').attr('href','http://twitter.com/home?status=noktone%20'+encodeURIComponent(url));
		$('#shareUrlGP').attr('href','https://plus.google.com/share?url='+encodeURIComponent(url));
		//window.history.pushState(null, "noktone", '?'+$.param(params));
	}
	
	function loadEvents() {
		
		$("td").mousedown( function() {
			$(this).toggleClass("i");
			updateUrl();
			if (playing == 0) playNote($(this).data('note'));
		});
		
		$('body').click( function() {
			if(started == 0) {
				playNote(0); // iOS unmute
				if(playing == 0) play(0);
				started = 1;
				setTimeout(function() { $('#infos').show(); }, 2500);
			}
		});
		
		$("#pause.e").click( function() {
			pause();
		}).removeClass('e');
		
		$("#play.e").click( function() {
			if(playing == 0) play(0);
		}).removeClass('e');
		
		$('#update.e').click( function() {
			update();
		}).removeClass('e');
		
		$('#rewind.e').click( function() {
			update();
			rewind();
		}).removeClass('e');
		
		$('#reset.e').click( function() {
			reset();
		}).removeClass('e');
		
		$('#randomize.e').click( function() {
			randomize();
		}).removeClass('e');
		
		$('.option').change( function() {
			update();
		});
		
		$('#draw.e').click( function() {
			draw();
		}).removeClass('e');
		
		$('#showOptions.e').click( function() {
			$('#options').toggle();
		}).removeClass('e');
		
		$('#showShare.e').click( function() {
			$('#share').toggle();
			$('#shareUrl').select();
		}).removeClass('e');
	}
	
	$(function() {
		
		$('#appVersion').html(appVersion);
		
		getParamsFromURL();
		
		draw();
		
		playNote(0);
		
	});
	
	
	
	
	
	
	
	
	
	
	
	
	
	
	
	