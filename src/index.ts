import fs from 'fs';
import childProcess from 'child_process';
import moment from 'moment';
import puppeteer from 'puppeteer';

interface Show {
  venue: string;
  venueURL: string;
  title: string;
  url: string;
  date: string; //YYYY-MM-DD
  time: string;
  price: number;
}

interface Venue {
  venue: string;
  venueURL: string;
  tonight: Show[];
  soon: Show[];
}

function log(level: any, msg: any) {
  process.stderr.write('[' + new Date() + '] ' + '[' + level + '] ' + msg + '\n');
  fs.appendFileSync(__dirname + '/log.txt', '[' + new Date() + '] ' + '[' + level + '] ' + msg + '\n');
}

(async () => {
  log('info', 'fetching sources');

  const browser = await puppeteer.launch();

  await fs.readdir(__dirname + '/sources', async function(err, fileNames) {
    const queue: Promise<Show[]>[] = [];
    for (const fileName of fileNames) {
      const page = await browser.newPage();
      const fn = require(__dirname + '/sources/' + fileName);
      queue.push(fn.default(page));
    }

    const results = await Promise.all(queue);
    await browser.close();
    let shows: Show[] = [];
    results &&
      results.forEach(function(venue) {
        shows = shows.concat(venue);
      });

    log('info', 'found ' + shows.length + ' total shows');

    shows.sort(function(a, b) {
      if (a.date > b.date) return 1;
      else return -1;
    });

    const today = new Date();
    const year = today.getFullYear().toString();
    let month = (today.getMonth() + 1).toString();
    if (month.length === 1) month = '0' + month;
    let day = today.getDate().toString();
    if (day.length === 1) day = '0' + day;
    const oneWeek = moment(year + '-' + month + '-' + day)
      .add(8, 'days')
      .format('YYYY-MM-DD');

    const venueHash: { [s: string]: Venue } = {};
    shows.forEach(function(show) {
      if (!venueHash[show.venue])
        venueHash[show.venue] = {
          venue: show.venue,
          venueURL: show.venueURL,
          tonight: [],
          soon: [],
        };
      if (show.date === year + '-' + month + '-' + day) venueHash[show.venue].tonight.push(show);
      else if (show.date > year + '-' + month + '-' + day && show.date <= oneWeek) venueHash[show.venue].soon.push(show);
    });
    const venues = Object.keys(venueHash).map(function(key) {
      return venueHash[key];
    });

    let html = '';
    html += '<div class="navhead">TONIGHT';
    html += '<span class="date">' + moment().format('M/D') + '</span>';
    html += '</div>';

    html += '<div id="tonight">';

    venues.forEach(function(venue) {
      if (venue.tonight.length > 0) html += '<h3><a class="venue-link" href="' + venue.venueURL + '">' + venue.venue + '</a></h3>';
      venue.tonight.forEach(function(show: Show, i) {
        if (i > 0) html += '<hr>';
        html += '<div class="show">';
        html += '<h4><a class="show-link" href="' + show.url + '">' + show.title + '</a></h4>';
        if (show.time) html += '<div class="info">' + show.time + '</div>';
        if (show.price) html += '<div class="info">' + show.price + '</div>';
        html += '</div>';
      });
    });

    html += '</div>';

    html += '<div class="navhead">NEXT WEEK';
    html +=
      '<span class="date">' +
      moment()
        .add(1, 'day')
        .format('M/D') +
      '-' +
      moment()
        .add(8, 'days')
        .format('M/D') +
      '</span>';
    html += '</div>';

    html += '<div id="soon">';

    venues.forEach(function(venue) {
      if (venue.soon.length > 0) html += '<h3><a class="venue-link" href="' + venue.venueURL + '">' + venue.venue + '</a></h3>';
      venue.soon.forEach(function(show, i) {
        if (i > 0) html += '<hr>';
        html += '<div class="show">';
        html += '<h4><a class="show-link" href="' + show.url + '">' + show.title + '</a></h4>';
        html += '<div class="info">' + show.date.split('-')[1] + '/' + show.date.split('-')[2] + '/' + show.date.split('-')[0] + '</div>';
        html += '<div class="info">' + show.time + '</div>';
        if (show.price) html += '<div class="info">' + show.price + '</div>';
        html += '</div>';
      });
    });

    html += '</div>';

    let template = fs.readFileSync(__dirname + '/template.html', 'utf8');
    template = template.split('{{content}}').join(html);

    fs.writeFileSync(__dirname + '/index.html', template);

    log('info', 'wrote page');

    childProcess.exec('cd ' + __dirname + ';git add .; git commit -m "refresh"; git push origin gh-pages;', function() {
      log('info', 'pushed to github');
    });
  });
})();
