function pathFilename(path) {
	var match = /\/([^\/]+)$/.exec(path);
	if (match) {
		return match[1];
	}
}

function getRandomInt(min, max) {
	// via https://developer.mozilla.org/en/Core_JavaScript_1.5_Reference/Global_Objects/Math/random#Examples
	return Math.floor(Math.random() * (max - min + 1)) + min;
}

function randomChoice(items) {
	return items[getRandomInt(0, items.length-1)];
}

function getUrlVars() {
	var vars = [], hash;
	var hashes = window.location.href.slice(window.location.href.indexOf('?') + 1).split('&');
	for(var i = 0; i < hashes.length; i++) {
		hash = hashes[i].split('=');
		vars.push(hash[0]);
		vars[hash[0]] = hash[1];
	}
	return vars;
}

var xkcd = {
	latest: {"num" : 45},
	last: {"num" : 1},
	cache: {},
	baseQ: '/contest/question/',
	baseA: '/contest/answer/',
	baseR: '/contest/start/',
	baseE: '/contest/stop/',

	get: function(num, success, error) {
		if (num === null) {
			path = '1'; // first question
		} else if (Number(num)) {
			path = String(num);
		} else {
			error(false);
			return false;
		}
		
		if (num in this.cache) {
			this.last = this.cache[num];
			success(this.cache[num]);
		} else {
			return $.ajax({
				url: this.baseQ+path,
				dataType: 'json',
				success: $.proxy(function(data) {
					this.last = this.cache[num] = data;
					success(data);
				}, this),
				error: error});
		}
	}
};

var xkcdDisplay = TerminalShell.commands['question'] = TerminalShell.commands['display'] = function(terminal, path) {

console.log("last prev : " + xkcd.last.num);

	function fail() {
		terminal.print($('<p>').addClass('error').text('display: Unable to show you the question.'));
		terminal.setWorking(false);
	}
	path = Number(path);
	if (typeof(path) === 'number') {
		xkcd.last.num = path;
		if (path > xkcd.latest.num) {
			terminal.print("Time travel mode not enabled.");
			return;
		}
	} else {
		terminal.print($('<p>').addClass('error').text('Cannot display the question. Its not a valid number'));
	}
	terminal.setWorking(true);
	xkcd.get(path, function(data) {
		// Stuff to be dome with question data
		terminal.setWorking(true);
		terminal.print($('<p>').addClass('question').text(data.question));
		if(data.image)
			terminal.print($('<img>').addClass('comic').attr('src', data.image));
		terminal.print($('<ol class="answers"><li>'+ data.options[0] +'</li><li>' +data.options[1] + '</li><li>'+ data.options[2]+'</li><li>'+data.options[3]+'</li></ol>'));
		setTimeout(function(){
			terminal.setWorking(false);
		},1000);
	}, fail);

console.log("last now : " + xkcd.last.num);
}

TerminalShell.commands['next'] = function(terminal) {
	xkcdDisplay(terminal, xkcd.last.num+1);
};

TerminalShell.commands['previous'] =
TerminalShell.commands['prev'] = function(terminal) {
	xkcdDisplay(terminal, xkcd.last.num-1);
};

TerminalShell.commands['first'] = function(terminal) {
	xkcdDisplay(terminal, 1);
};

TerminalShell.commands['latest'] =
TerminalShell.commands['last'] = function(terminal) {
	xkcdDisplay(terminal, xkcd.latest.num);
};

TerminalShell.commands['random'] = function(terminal) {
	xkcdDisplay(terminal, getRandomInt(1, xkcd.latest.num));
};

TerminalShell.commands['answer'] = function(terminal) {
	// answer  (-a|-A|--answer) [A-D] ( (-q|-Q|--question) \d ) ?
	var cmd_args = Array.prototype.slice.call(arguments);
	cmd_args.shift(); // terminal
	console.log(cmd_args);
	var submit = { "question" : -1, "answer" : -1 };
	for( q=0; q < cmd_args.length; q += 1 ) {
		if ( cmd_args[q] === '--question' | cmd_args[q] === '-q' | cmd_args[q] === '-Q')
			submit.question = Number(cmd_args[q+1]);
		if ( cmd_args[q] === '--answer' | cmd_args[q] === '-a' | cmd_args[q] === '-A')
			submit.answer = cmd_args[q+1].toString().toUpperCase();
	}

	if ( submit.question === -1 ) {
		if (typeof(xkcd.last.num) === 'undefined') {
			console.log("undefined");
			submit.question = -1;
		} else
			submit.question = xkcd.last.num;
	}

	if ( submit.answer === -1 )
		terminal.print($('<p>').addClass('error').text('Enter an answer'));
	else if ( submit.answer < 'A' || submit.answer > 'D' )
		terminal.print($('<p>').addClass('error').text('Answer must a an option between A and D '));
	else if ( submit.question > xkcd.latest.num || submit.question < 0 )
		terminal.print($('<p>').addClass('error').text('Answer a question b/w 0 and ' + xkcd.latest.num ));
	else {
		terminal.print($('<p>').addClass('question').text('You answered question ' + submit.question +' with option ' + submit.answer ));
		// Answer submissions if no errors found
		$.get(xkcd.baseA,submit);
	}
};

// The start version before competion start
/*
TerminalShell.commands['start'] = function(terminal) {
	terminal.print($('<p>').addClass('error').text('Not yet ! Please wait till 10:00 PM '));
};
*/
TerminalShell.commands['start'] = function(terminal, tatID) {
	if(!getUrlVars()['auth']) {
		if (tatID === '' | typeof(tatID) === 'undefined' ) {
			terminal.print($('<p>').addClass('error').text('Please enter a valid tathva team ID of the form TOW1234'));
		} else {
			if (/tow\d{4}/i.test(tatID))
				window.location = xkcd.baseR + tatID.toString()
			else
				terminal.print($('<p>').addClass('error').text('Please enter a valid tathva team ID of the form TOW1234'));
		}	
	} else {
			terminal.print($('<p>').addClass('error').text('You have already started. You dont have to do it again'));
	}

};

TerminalShell.commands['sudo'] = function(terminal) {
	var cmd_args = Array.prototype.slice.call(arguments);
	cmd_args.shift(); // terminal
	if (cmd_args.join(' ') == 'make me a sandwich') {
		terminal.print('Okay.');
	} else {
		var cmd_name = cmd_args.shift();
		cmd_args.unshift(terminal);
		cmd_args.push('sudo');
		if (TerminalShell.commands.hasOwnProperty(cmd_name)) {
			this.sudo = true;
			this.commands[cmd_name].apply(this, cmd_args);
			delete this.sudo;
		} else if (!cmd_name) {
			terminal.print('sudo what?');
		} else {
			terminal.print('sudo: '+cmd_name+': command not found');
		}
	}
};

TerminalShell.filters.push(function (terminal, cmd) {
	if (/!!/.test(cmd)) {
		var newCommand = cmd.replace('!!', this.lastCommand);
		terminal.print(newCommand);
		return newCommand;
	} else {
		return cmd;
	}
});

TerminalShell.commands['shutdown'] = TerminalShell.commands['poweroff'] = function(terminal) {
	if (this.sudo) {
		terminal.print('Broadcast message from guest@tathva2011');
		terminal.print();
		terminal.print('The system is going down for maintenance NOW!');
		return $('#screen').fadeOut();
	} else {
		terminal.print('Must be root.');
	}
};

TerminalShell.commands['logout'] =
TerminalShell.commands['exit'] = 
TerminalShell.commands['quit'] = function(terminal) {
	terminal.print('Bye.');
	$('#prompt, #cursor').hide();
	terminal.promptActive = false;
};

TerminalShell.commands['restart'] = TerminalShell.commands['reboot'] = function(terminal) {
	if (this.sudo) {
		TerminalShell.commands['poweroff'](terminal).queue(function(next) {
			window.location.reload();
		});
	} else {
		terminal.print('Must be root.');
	}
};

function linkFile(url) {
	return {type:'dir', enter:function() {
		window.location = url;
	}};
}

Filesystem = {
	'welcome.txt': {type:'file', read:function(terminal) {
		terminal.print($('<h3>').text('Welcome to Tux of War contest console'));
		terminal.print('Use "ls", "cat", and "cd" to navigate the filesystem. Ctrl + L to clear.');
		terminal.print('cat reginfo.txt for registration information.');
		terminal.print('The contest opens at 10pm tonight. You may login upto 10:30 pm to finish the contest in time.');
		terminal.print('cat instruction.txt before participating');
		terminal.print('use start <tathva TuxOfWar team id> to start the contest. e.g. start TOW1234');
		terminal.print($('<h3>').text('The contest will start soon, you will be notified here. Please be patient.'));
	}},
	'datetime.txt': {type:'file', read:function(terminal) {
		terminal.print($('<h3>').text('Date and Time'));
		terminal.print('Monday October 10, 2011.');
		terminal.print('10pm to 11pm.');
	}},
	'prizes.txt': {type:'file', read:function(terminal) {
		terminal.print($('<h3>').text('The best Tux Warriors will be awarded with prizes'));
		terminal.print('First  Rs. 3500/-');
		terminal.print('Second Rs. 2000/-');
		terminal.print('Third  Rs. 1500/-');
	}},
	'rules.txt': {type:'file', read:function(terminal) {
		terminal.print($('<h3>').text('Contest Rules'));
		terminal.print(' - Maximum two participants per team.');
		terminal.print(' - Any number of teams are allowed from a college. However the members of a team must be from the same college.');
		terminal.print(' - There will be a maximum of three rounds.');
		terminal.print(' - The first round will be an online qualifying round from which a maximum of 10 teams will be shortlisted.');
		terminal.print(' - The final 2 rounds will be conducted at NITC campus during Tathva. Consisting of a debugging/sysadmin round (including, but not limited to, common linux hassles/problems, system environment editing, etc.) and a bash scripting round, these will test the participant\'s practical skills in a Linux environment.');
		terminal.print(' - Marks from first round will not be carried over to the other two rounds.');
		terminal.print(' - However marks from Round 2 will be carried over to Round 3 i.e. winning teams will be decided on the basis of performance in the last two rounds.');
		terminal.print(' - The co-ordinator\'s decision shall be final.');
	}},
	'contestdetails.txt': {type:'file', read:function(terminal) {
		terminal.print($('<h3>').text('Contest Details'));
		terminal.print($('<h4>').text('Round 1 - Preliminary'));
		terminal.print(' - This will be an online round.');
		terminal.print(' - Questions will consist of MCQs and one-liners based on UNIX/Linux commands, tools, concepts and philosophy.');
		terminal.print(' - Duration will be 30 minutes.');
		terminal.print(' - This will be an elimination round and only the qualifying teams will appear for next 2 rounds.');
		terminal.print($('<h4>').text('Round 2 - Sysadmin Round'));
		terminal.print(' - This will be an onsite round during Tathva');
		terminal.print(' - Involving practical linux hassles/problems on Debian/Redhat based systems');
		terminal.print(' - One system per team');
		terminal.print(' - Duration will be 90 minutes');
		terminal.print(' - Marks will be given for documentation too');
		terminal.print(' - Boot CD/USB will be available on request');
		terminal.print(' - No Internet access');
		terminal.print($('<h4>').text('Round 3 - Scripting Round'));
		terminal.print(' - This will also be an onsite round during Tathva');
		terminal.print(' - Involving writing bash scripts for general shell usage, administration related tasks, networking, etc.');
		terminal.print(' - One system per team');
		terminal.print(' - Duration 3 hours');
		terminal.print(' - Marks for elegance, covering more input cases, optimization');
		terminal.print($('<p>').html('Final winners will be decided on the basis of performance in last two rounds.'));
	}},
	'reginfo.txt': {type:'file', read:function(terminal) {
		terminal.print($('<h3>').text('Registration Info'));
		terminal.print($('<p>').html(' - Both members of the team have to <a href="http://tathva.org/2011/#!register" target="_blank">register on the Tathva Site</a> to receive individual Tathva IDs. The team captain should use a Google account for registration, this will be required for logging into the contest portal.'));
		terminal.print($('<p>').html(' - Then, the team captain has to register for Tux of War using <a href="http://tathva.org/2011/index.php#!eventregister" target="_blank">Event Registration page</a> at Tathva site specifying the partners tathva ID to obtain a team ID.'));
		terminal.print(' - Only teams with a valid Team ID are allowed to participate in the contest.');
		terminal.print(' - When the first round is started the team captain should use his/her Google account to participate. The other team mate can help him/her, but need not attempt the first round individually.');
	}},
	/*'resources.txt': {type:'file', read:function(terminal) {
		terminal.print($('<h3>').text('Resources.'));
		terminal.print('Links to various tutorials, pages, etc.');
		terminal.print('philosophy - FSF');
		terminal.print('scripting - tldp.org absg');
		terminal.print('some linux tutorials');
	}},*/
	'instructions.txt': {type:'file', read:function(terminal) {
		terminal.print($('<h3>').text('Tux of War contest Instructions'));
		terminal.print('You will get 30 minutes for attempting the questions.');
		terminal.print('There will be total of 45 questions, answer as many as you can.');
		terminal.print('Marking scheme: +4 for correct, -1 for incorrect answer.');
		terminal.print('Decision of co-ordinators will be final.');
		terminal.print($('<br />'));
		terminal.print($('<h3>').text('How to compete:'));
		terminal.print('Do not reload or logout once you start the competition. ');
		terminal.print('Use the following command to use the contest console:');
		terminal.print('start <tathva team id>');
		terminal.print('e.g. start TOW1001');
		terminal.print($('<br />'));
		terminal.print('Once the contest starts to view any question type the command:');
		terminal.print('display <ques_no> OR question <ques_no> ');
		terminal.print('e.g. for question no. 5 type command `question 5`');
		terminal.print('question number must be between 1 and 45');
		terminal.print($('<br />'));
		terminal.print('To answer any question type :');
		terminal.print('answer -q <ques_no> -a <ans_option>');
		terminal.print('e.g. To answer question number 5 with option B type ');
		terminal.print('answer -q 5 -a B');
		terminal.print($('<br />'));
		terminal.print('use next prev to switch between questions');
		terminal.print('and random to go to random question ;-)');
	}},
	'contacts.txt': {type:'file', read:function(terminal) {
		terminal.print($('<h3>').text('Contact Info'));
		terminal.print('Kartik Singhal');
		terminal.print(' Phone: +91 974 688 7377');
		terminal.print(' E-mail: kartik@tathva.org');
		terminal.print('\n');
		terminal.print('Abhishek Gupta');
		terminal.print(' Phone: +91 963 325 0636');
		terminal.print(' Email: abhishek@tathva.org');
	}},
	'credits.txt': {type:'file', read:function(terminal) {
		terminal.print($('<h3>').text('The people behind this'));
		terminal.print('Jaseem Abid');
		terminal.print($("Web : <a href='http://github.com/jaseemabid'> http://github.com/jaseemabid</a>"));
		terminal.print('\n');
		terminal.print('Vipin Nair');
		terminal.print($("Web : <a href='http://github.com/swvist'> http://github.com/swvist</a>"));
		terminal.print('\n');
		terminal.print('Kartik Singhal');
		terminal.print(' Phone: +91 974 688 7377');
		terminal.print(' E-mail: kartik@tathva.org');
		terminal.print('\n');
		terminal.print('Abhishek Gupta');
		terminal.print(' Phone: +91 963 325 0636');
		terminal.print(' Email: abhishek@tathva.org');
		terminal.print('\n');
		terminal.print('Jerrin Shajee George');
		terminal.print(' Phone: +91 9567 428 090');
		terminal.print('\n');
		terminal.print('Probal Mukherjee');
		terminal.print(' Phone: +91 9020 703 783');
		terminal.print(' Email: probal@tathva.org');
	}},
	'license.txt': {type:'file', read:function(terminal) {
		terminal.print($('<p>').html('Client-side logic for Wordpress CLI theme :: <a href="http://thrind.xamai.ca/">R. McFarland, 2006, 2007, 2008</a>'));
		terminal.print($('<p>').html('jQuery rewrite and overhaul :: <a href="http://www.chromakode.com/">Chromakode, 2010</a>'));
		terminal.print();
		$.each([
			'This program is free software; you can redistribute it and/or',
			'modify it under the terms of the GNU General Public License',
			'as published by the Free Software Foundation; either version 2',
			'of the License, or (at your option) any later version.',
			'',
			'This program is distributed in the hope that it will be useful,',
			'but WITHOUT ANY WARRANTY; without even the implied warranty of',
			'MERCHANTABILITY or FITNESS FOR A PARTICULAR PURPOSE.  See the',
			'GNU General Public License for more details.',
			'',
			'You should have received a copy of the GNU General Public License',
			'along with this program; if not, write to the Free Software',
			'Foundation, Inc., 51 Franklin Street, Fifth Floor, Boston, MA  02110-1301, USA.'
		], function(num, line) {
			terminal.print(line);
		});
	}}
};
//Filesystem['blog'] = Filesystem['blag'] = linkFile('http://blag.xkcd.com');

TerminalShell.pwd = Filesystem;

TerminalShell.commands['cd'] = function(terminal, path) {
	if (path in this.pwd) {
		if (this.pwd[path].type == 'dir') {
			this.pwd[path].enter(terminal);
		} else if (this.pwd[path].type == 'file') {
			terminal.print('cd: '+path+': Not a directory');
		}
	} else {
		terminal.print('cd: '+path+': No such file or directory');
	}
};

TerminalShell.commands['dir'] =
TerminalShell.commands['ls'] = function(terminal, path) {
	var name_list = $('<ul>');
	$.each(this.pwd, function(name, obj) {
		if (obj.type == 'dir') {
			name += '/';
		}
		name_list.append($('<li>').text(name));
	});
	terminal.print(name_list);
};

TerminalShell.commands['cat'] = function(terminal, path) {
	if (path in this.pwd) {
		if (this.pwd[path].type == 'file') {
			this.pwd[path].read(terminal);
		} else if (this.pwd[path].type == 'dir') {
			terminal.print('cat: '+path+': Is a directory');
		}
	} else if (pathFilename(path) == 'alt.txt') {
		terminal.setWorking(true);
		num = Number(path.match(/^\d+/));
		xkcd.get(num, function(data) {
			terminal.print(data.alt);
			terminal.setWorking(false);
		}, function() {
			terminal.print($('<p>').addClass('error').text('cat: "'+path+'": No such file or directory.'));
			terminal.setWorking(false);
		});
	} else {
		terminal.print('You\'re a kitty!');
	}
};

TerminalShell.commands['rm'] = function(terminal, flags, path) {
	if (flags && flags[0] != '-') {
		path = flags;
	}
	if (!path) {
		terminal.print('rm: missing operand');
	} else if (path in this.pwd) {
		if (this.pwd[path].type == 'file') {
			delete this.pwd[path];
		} else if (this.pwd[path].type == 'dir') {
			if (/r/.test(flags)) {
				delete this.pwd[path];
			} else {
				terminal.print('rm: cannot remove '+path+': Is a directory');
			}
		}
	} else if (flags == '-rf' && path == '/') {
		if (this.sudo) {
			TerminalShell.commands = {};
		} else {
			terminal.print('rm: cannot remove /: Permission denied');
		}
	}
};

TerminalShell.commands['cheat'] = function(terminal) {
	terminal.print($('<a>').text('*** You did not mean it, did you ? ***').attr('href', 'http://tathva.org/'));
}; 

TerminalShell.commands['apt-get'] = function(terminal, subcmd) {
	if (!this.sudo && (subcmd in {'update':true, 'upgrade':true, 'dist-upgrade':true})) {
		terminal.print('E: Unable to lock the administration directory, are you root?');
	} else {
		if (subcmd == 'update') {
			terminal.print('Reading package lists... Done');
		} else if (subcmd == 'upgrade') {
			if (($.browser.name == 'msie') || ($.browser.name == 'firefox' && $.browser.versionX < 3)) {
				terminal.print($('<p>').append($('<a>').attr('href', 'http://abetterbrowser.org/').text('To complete installation, click here.')));
			} else {
				terminal.print('This looks pretty good to me.');
			}
		} else if (subcmd == 'dist-upgrade') {
			var longNames = {'win':'Windows', 'mac':'OS X', 'linux':'Linux'};
			var name = $.os.name;
			if (name in longNames) {
				name = longNames[name];
			} else {
				name = 'something fancy';
			}
			terminal.print('You are already running '+name+'.');
		} else if (subcmd == 'moo') {
			terminal.print('        (__)');
			terminal.print('        (oo)');
			terminal.print('  /------\\/ ');
			terminal.print(' / |    ||  ');
			terminal.print('*  /\\---/\\  ');
			terminal.print('   ~~   ~~  '); 
			terminal.print('...."Have you mooed today?"...');
		} else if (!subcmd) {
			terminal.print('This APT has Super Cow Powers.');
		} else {
			terminal.print('E: Invalid operation '+subcmd);
		}
	}
};

function oneLiner(terminal, msg, msgmap) {
	if (msgmap.hasOwnProperty(msg)) {
		terminal.print(msgmap[msg]);
		return true;
	} else {
		return false;
	}
}

TerminalShell.commands['man'] = function(terminal, what) {
	pages = {
		'last': 'Man, last night was AWESOME.',
		'help': 'Man, help me out here.',
		'next': 'Request confirmed; you will be reincarnated as a man next.',
		'cat':  'You are now riding a half-man half-cat.'
	};
	if (!oneLiner(terminal, what, pages)) {
		terminal.print('Oh, I\'m sure you can figure it out.');
	}
};

TerminalShell.commands['locate'] = function(terminal, what) {
	keywords = {
		'ninja': 'Ninja can not be found!',
		'keys': 'Have you checked your coat pocket?',
		'joke': 'Joke found on user.',
		'problem': 'Problem exists between keyboard and chair.',
		'raptor': 'BEHIND YOU!!!'
	};
	if (!oneLiner(terminal, what, keywords)) {
		terminal.print('Locate what?');
	}
};

Adventure = {
	rooms: {
		0:{description:'You are at a computer using tathva2011.', exits:{west:1, south:10}},
		1:{description:'Life is peaceful there.', exits:{east:0, west:2}},
		2:{description:'In the open air.', exits:{east:1, west:3}},
		3:{description:'Where the skies are blue.', exits:{east:2, west:4}},
		4:{description:'This is what we\'re gonna do.', exits:{east:3, west:5}},
		5:{description:'Sun in wintertime.', exits:{east:4, west:6}},
		6:{description:'We will do just fine.', exits:{east:5, west:7}},
		7:{description:'Where the skies are blue.', exits:{east:6, west:8}},
		8:{description:'This is what we\'re gonna do.', exits:{east:7}},
		10:{description:'A dark hallway.', exits:{north:0, south:11}, enter:function(terminal) {
				if (!Adventure.status.lamp) {
					terminal.print('You are eaten by a grue.');
					Adventure.status.alive = false;
					Adventure.goTo(terminal, 666);
				}
			}
		},
		11:{description:'Bed. This is where you sleep.', exits:{north:10}},
		666:{description:'You\'re dead!'}
	},
	
	status: {
		alive: true,
		lamp: false
	},
	
	goTo: function(terminal, id) {
		Adventure.location = Adventure.rooms[id];
		Adventure.look(terminal);
		if (Adventure.location.enter) {
			Adventure.location.enter(terminal);
		}
	}
};
Adventure.location = Adventure.rooms[0];

TerminalShell.commands['look'] = Adventure.look = function(terminal) {
	terminal.print(Adventure.location.description);	
	if (Adventure.location.exits) {
		terminal.print();
		
		var possibleDirections = [];
		$.each(Adventure.location.exits, function(name, id) {
			possibleDirections.push(name);
		});
		terminal.print('Exits: '+possibleDirections.join(', '));
	}
};

TerminalShell.commands['go'] = Adventure.go = function(terminal, direction) {
	if (Adventure.location.exits && direction in Adventure.location.exits) {
		Adventure.goTo(terminal, Adventure.location.exits[direction]);
	} else if (!direction) {
		terminal.print('Go where?');
	} else if (direction == 'down') {
		terminal.print("On our first date?");
	} else {
		terminal.print('You cannot go '+direction+'.');
	}
};

TerminalShell.commands['light'] = function(terminal, what) {
	if (what == "lamp") {
		if (!Adventure.status.lamp) {
			terminal.print('You set your lamp ablaze.');
			Adventure.status.lamp = true;
		} else {
			terminal.print('Your lamp is already lit!');
		}
	} else {
		terminal.print('Light what?');
	}
};

TerminalShell.commands['sleep'] = function(terminal, duration) {
	duration = Number(duration);
	if (!duration) {
		duration = 5;
	}
	terminal.setWorking(true);
	terminal.print("You take a nap.");
	$('#screen').fadeOut(1000);
	window.setTimeout(function() {
		terminal.setWorking(false);
		$('#screen').fadeIn();
		terminal.print("You awake refreshed.");
	}, 1000*duration);
};

// No peeking!
TerminalShell.commands['help'] = TerminalShell.commands['halp'] = function(terminal) {
	terminal.print($('<h4>').html('Basic help page: Common commands and usages'));
	terminal.print('');
	terminal.print('"ls" : list files in the current directory');
	terminal.print('"cd \<dir\>" : change directory to the new directory');
	terminal.print('"cd .." : moves to the parent directory');
	terminal.print('"cat \<file\>" : prints out the contents of a file');
	terminal.print('"help" : for this help file');
	terminal.print('');
	terminal.print($('<h4>').html('Basically every other unix command works and we have extras, Like'));
	terminal.print('sudo       su       rm       man        whoami');
	terminal.print('who        wget     light    sleep      locate');	
	terminal.print('shutdown   logout   exit     quit       goto');
	terminal.print('apt-get    cheat     ');
}; 

TerminalShell.fallback = function(terminal, cmd) {
	oneliners = {
		'make me a sandwich': 'What? Make it yourself.',
		'make love': 'I put on my robe and wizard hat.',
		'i read the source code': 'We <3 you',
		'pwd': 'You are in a maze of twisty passages, all alike.',
		'lpr': 'PC LOAD LETTER',
		'hello joshua': 'How about a nice game of Global Thermonuclear War?',
		'xyzzy': 'Nothing happens.',
		'date': 'March 32nd',
		'hello': 'Why hello there!',
		'who': 'Doctor Who?',
		'tathva': 'Yes! What can we do for you ?',
		'su': 'God mode activated. Remember, with great power comes great ... aw, screw it, go have fun.',
		'fuck': 'I have a headache.',
		'whoami': 'You are tux maniac.',
		'nano': 'Seriously? Why don\'t you just use Notepad.exe? Or MS Paint?',
		'top': 'It\'s up there --^',
		'moo':'moo',
		'ping': 'There is another submarine three miles ahead, bearing 225, forty fathoms down.',
		'find': 'What do you want to find? Kitten would be nice.',
		'hello':'Hello.','more':'Oh, yes! More! More!',
		'your gay': 'Keep your hands off it!',
		'hi':'Hi.','echo': 'Echo ... echo ... echo ...',
		'bash': 'You bash your head against the wall. It\'s not very effective.','ssh': 'ssh, this is a library.',
		'uname': 'Illudium Q-36 Explosive Space Modulator',
		'finger': 'Mmmmmm...',
		'kill': 'Terminator deployed to 1984.',
		'use the force luke': 'I believe you mean source.',
		'use the source luke': 'I\'m not luke, you\'re luke!',
		'serenity': 'You can\'t take the sky from me.',
		'enable time travel': 'TARDIS error: Time Lord missing.',
		'ed': 'You are not a diety.'
	};
	oneliners['emacs'] = 'You should really use vim.';
	oneliners['vi'] = oneliners['vim'] = 'You should really use emacs.';
	
	cmd = cmd.toLowerCase();
	if (!oneLiner(terminal, cmd, oneliners)) {
		if (cmd == "asl" || cmd == "a/s/l") {
			terminal.print(randomChoice([
				'2/AMD64/Server Rack',
				'328/M/Transylvania',
				'6/M/Battle School',
				'48/M/The White House',
				'7/F/Rapture',
				'Exactly your age/A gender you\'re attracted to/Far far away.',
				'7,831/F/Lothlórien',
				'42/M/FBI Field Office'
			]));
		} else if  (cmd == "hint") {
			terminal.print(randomChoice([
 				'We offer some really nice polos.',
 				$('<p>').html('This terminal will remain available at <a href="http://tuxofwar2011.appspot.com">tuxofwar2011.appspot.com</a>'),
 				'Use the source, Luke!',
 				'There are cheat codes.'
 			]));
		} else if (cmd == 'time travel') {
			xkcdDisplay(terminal, 630);
		} else if (/:\(\)\s*{\s*:\s*\|\s*:\s*&\s*}\s*;\s*:/.test(cmd)) {
			Terminal.setWorking(true);
		} else {
			return false;
		}
	}
	return true;
};

$(document).ready(function() {
	Terminal.promptActive = false;
	function noData() {
		Terminal.print($('<p>').addClass('error').text('Unable to load startup data. :-('));
		Terminal.promptActive = true;
	}
	$('#screen').bind('cli-load', function(e) {
		Terminal.runCommand('cat welcome.txt');
		/* Read a page's GET URL variables and return them as an associative array. */
		/* Example implementation : var cid = getUrlVars()['id']; */

		if(getUrlVars()['auth']) {
			
		terminal.print('Contest started...'); 
		terminal.print('Do not reload or logout.'); 
		terminal.print('Use the following command to use the contest console:'); 
		terminal.print('To view any question type the command:'); 
		terminal.print('question <ques_no> '); 
		terminal.print('e.g. for question no. 5 type command '); 
		terminal.print('question 5'); 
		terminal.print('question number must be between 1 and 45'); 
		terminal.print('To answer any question type :'); 
		terminal.print('answer -q <ques_no> -a <ans_option>'); 
		terminal.print('e.g. To answer question number 5 with option B type '); 
		terminal.print('answer -q 5 -a B'); 
		terminal.print('use next prev to switch between questions'); 
		terminal.print('and random to go to random question ;-)');


			var dur = 1800, kill = setInterval(function(){
				$("#timer").text(Math.floor((dur/60)) + " minutes " + Math.floor((dur%60)) +" seconds left");
				dur -= 1;
				if (dur === 0) {
					clearTimeout(kill);
					window.location = xkcd.baseE;
				}
			},1000);
		}
	});

});
