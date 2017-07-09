const rss = require('rssspider');
const fs  = require('fs');
const cron= require('cron').CronJob;
const moment = require('moment');
const _   = require('lodash');
const cheerio = require('cheerio');
const DATAPATH= __dirname + '/data';

var dataPool = [];
var workPool = [];

var tasks = [
	{
		name: 'reddit',
		url : 'https://www.reddit.com/r/gif/.rss',
		cron: '00 */5 * * * *',
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
		cron: '00 */5 * * * *',
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
		cron: '00 */5 * * * *',
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

function initialize() {
	if (!fs.existsSync(DATAPATH)) fs.mkdirSync(DATAPATH);
	// add crawl task
	_.each(tasks, function (task) {
		var job = new cron({
			cronTime: task.cron,
			onTick: cronTick(task),
			start: task.enable || false,
			timeZone: 'Asia/Shanghai'
		});
		workPool.push(job);
	});

	var dumpJob = new cron({
		cronTime: '59 59 23 * * *',
		onTick: storeToFile,
		start: true,
		timeZone: 'Asia/Shanghai'
	});
}
// job handler
function cronTick(task) {
	rss.fetchRss(task.url, ['title', 'description']).then(task.formater).then(cache);
}
// cache temp data to dataPool
function cache(data) {
	dataPool = _.union(dataPool, data)
}

function storeToFile() {
	var today = moment().format('YYYYMMDD');
	var file  = `${DATAPATH}/${today}.json`;
	fs.writeFileSync(file, JSON.stringify(dataPool));
	dataPool = [];
}

initialize();
