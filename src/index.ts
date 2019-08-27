import fs from 'fs';
import moment from 'moment';
import puppeteer from 'puppeteer';
import { log } from './log';

export interface Event {
  venue: string;
  venueURL: string;
  title: string;
  url: string;
  date: string; //YYYY-MM-DD
  time?: string | null;
  price?: number | null;
}

interface Venue {
  venue: string;
  venueURL: string;
  tonight: Event[];
  soon: Event[];
}

(async () => {
  log('info', 'fetching sources');

  const browser = await puppeteer.launch({args: [
    // Required for Docker version of Puppeteer
    '--no-sandbox',
    '--disable-setuid-sandbox',
    // This will write shared memory files into /tmp instead of /dev/shm,
    // because Docker’s default for /dev/shm is 64MB
    '--disable-dev-shm-usage'
  ]});

  await fs.readdir(`${__dirname}/sources`, async function(err, sourceFileNames) {
    const events: Event[] = await pullFromSources(sourceFileNames, browser);
    sortByDate(events);
    log('info', `found ${events.length} total shows`);

    const venues: Venue[] = processIntoVenues(events);

    generatePage(venues);
    log('info', 'wrote page');
  });
})();

function generatePage(venues: Venue[]) {
  const html = generateHtml(venues);
  let template = fs.readFileSync(`${__dirname}/template.html`, 'utf8');
  template = template.split('{{content}}').join(html);
  fs.writeFileSync(`${__dirname}/../dist/index.html`, template);
}

async function pullFromSources(sourceFileNames: string[], browser: puppeteer.Browser) {
  const eventLists = await scrapeSources(sourceFileNames, browser);
  let events: Event[] = [];
  eventLists &&
    eventLists.forEach(function(eventList) {
      events = events.concat(eventList);
    });
  return events;
}

async function scrapeSources(sourceFileNames: string[], browser: puppeteer.Browser) {
  const queue: Promise<Event[]>[] = [];
  for (const fileName of sourceFileNames) {
    const page = await browser.newPage();
    const src = require(`${__dirname}/sources/${fileName}`);
    queue.push(src.default(page));
  }
  const eventLists = await Promise.all(queue);
  await browser.close();
  return eventLists;
}

function processIntoVenues(events: Event[]) {
  const todayText = GetTodaysDateText();
  const twoMonthsFromToday = moment(todayText)
    .add(2, 'months')
    .format('YYYY-MM-DD');
  const venueHash: {
    [s: string]: Venue;
  } = {};
  events.forEach(function(event) {
    if (!venueHash[event.venue])
      venueHash[event.venue] = {
        venue: event.venue,
        venueURL: event.venueURL,
        tonight: [],
        soon: [],
      };
    if (event.date === todayText) venueHash[event.venue].tonight.push(event);
    else if (event.date > todayText && event.date <= twoMonthsFromToday) venueHash[event.venue].soon.push(event);
  });
  const venues = Object.keys(venueHash).map(function(key) {
    return venueHash[key];
  });
  return venues;
}

function GetTodaysDateText() {
  const today = new Date();
  const year = today.getFullYear().toString();
  let month = (today.getMonth() + 1).toString();
  if (month.length === 1) month = `0${month}`;
  let day = today.getDate().toString();
  if (day.length === 1) day = `0${day}`;
  const todayText = `${year}-${month}-${day}`;
  return todayText;
}

function sortByDate(events: Event[]) {
  events.sort(function(a, b) {
    if (a.date > b.date) return 1;
    else return -1;
  });
}

function generateHtml(venues: Venue[]) {
  let html = '<div class="navhead">TONIGHT';
  html += '<span class="date">' + moment().format('M/D') + '</span>';
  html += '</div>';
  html += '<div id="tonight">';
  venues.forEach(function(venue) {
    if (venue.tonight.length > 0) html += '<h3><a class="venue-link" href="' + venue.venueURL + '">' + venue.venue + '</a></h3>';
    venue.tonight.forEach(function(event: Event, i) {
      if (i > 0) html += '<hr>';
      html += '<div class="show">';
      html += '<h4><a class="show-link" href="' + event.url + '">' + event.title + '</a></h4>';
      if (event.time) html += '<div class="info">' + event.time + '</div>';
      if (event.price) html += '<div class="info">' + event.price + '</div>';
      html += '</div>';
    });
  });
  html += '</div>';
  html += '<div class="navhead">UPCOMING';
  // html +=
  //   '<span class="date">' +
  //   moment()
  //     .add(1, 'day')
  //     .format('M/D') +
  //   '-' +
  //   moment()
  //     .add(2, 'months')
  //     .format('M/D') +
  //   '</span>';
  html += '</div>';
  html += '<div id="soon">';
  venues.forEach(function(venue) {
    if (venue.soon.length > 0) html += '<h3><a class="venue-link" href="' + venue.venueURL + '">' + venue.venue + '</a></h3>';
    venue.soon.forEach(function(event, i) {
      if (i > 0) html += '<hr>';
      html += '<div class="show">';
      html += '<h4><a class="show-link" href="' + event.url + '">' + event.title + '</a></h4>';
      html += '<div class="info">' + event.date.split('-')[1] + '/' + event.date.split('-')[2] + '/' + event.date.split('-')[0] + '</div>';
      if (event.time) html += '<div class="info">' + event.time + '</div>';
      if (event.price) html += '<div class="info">' + event.price + '</div>';
      html += '</div>';
    });
  });
  html += '</div>';
  return html;
}
