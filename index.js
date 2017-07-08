const rss = require('rssspider');
const cron= require('cron').CronJob;
const _   = require('lodash');
const cheerio = require('cheerio');

var tasks = [
	{
		name: 'reddit',
		url : 'https://www.reddit.com/r/gif/.rss',
		cron: '00 * * * * *',
		formater: function (records) {
			var data = [];
			_.each(records, function (record) {
				var $ = cheerio.load(record.description);
				var link = $('a[href*=".gif"]').attr('href');
				var thumb = $('img').attr('src');
				if (link) {
					data.push({title: record.title, link: link, thumb: thumb});
				}
			});
			return Promise.resolve(data);
		},
		enable: true
	},
	{
		name: '4gifs',
		url : 'http://tumblr.forgifs.com/rss',
		cron: '00 * * * * *',
		formater: function (records) {
			var data = [];
			_.each(records, function (record) {
				var $ = cheerio.load(record.description);
				var link = $('img').attr('src');
				if (link) {
					data.push({title: record.title, link: link, thumb: ''});
				}
			});
			return Promise.resolve(data);
		},
		enable: true
	},
	{
		name: '9gag',
		url : 'http://9gag-rss.com/api/rss/get?code=9GAGGIF&format=2',
		cron: '00 * * * * *',
		formater: function (records) {
			var data = [];
			_.each(records, function (record) {
				var $ = cheerio.load(record.description);
				var link = $('source[src*=".mp4"]').attr('src');
				var thumb= $('video').attr('poster');
				if (link) {
					data.push({title: record.title, link: link, thumb: thumb});
				}
			});
			return Promise.resolve(data);
		},
		enable: true
	},
];

var workPool = [];

function initialize() {
	_.each(tasks, function (task) {
		var job = new cron({
			cronTime: task.cron,
			onTick: cronTick(task),
			start: task.enable || false,
			timeZone: 'Asia/Shanghai'
		});
		workPool.push(job);
	});
}

function cronTick(task) {
	rss.fetchRss(task.url, ['title', 'description']).then(task.formater).then(save);
}

function save(data) {
	console.log(data);
}

initialize();
