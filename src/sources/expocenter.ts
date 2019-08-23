import puppeteer from 'puppeteer';
import { Event } from '../index';
import moment from 'moment';
import 'datejs';

const url = 'https://ohioexpocenter.com/events/list/';

const scrape = async (page: puppeteer.Page) => {
  try {
    await page.goto(url, { waitUntil: 'networkidle2' });
    const events : Event[] = await page.evaluate(`
      [...document.querySelectorAll('.type-tribe_events')].map(evt => {
        const event = {
          venue: 'Ohio Expo Center',
          venueURL: 'https://ohioexpocenter.com',
          title: evt.querySelector('.tribe-events-list-event-title').innerText,
          url: evt.querySelector('.tribe-events-list-event-title a').href,
          date: evt.querySelector('.tribe-event-date-start').innerText,
          time: null,
          price: null
        };
        evt.querySelector('.tribe-events-list-event-description').innerText.split(" ").forEach(word => {
          if (word.indexOf("$") !== -1) event.price = word;
          else if (word.toLowerCase().indexOf("free") !== -1) event.price = "FREE";
        });

        return (event.date && event.title) ? null : event;
      });
    `);
    console.log(`Returning ${events.length} events`);
    return formatDate(events);
  } catch (error) {
    console.log('Error!');
    console.log(error);
  } finally {
    await page.close();
  }
};

export default scrape;

function formatDate(events: Event[]) {
  return events.map((evt: Event) => {
    const evtDt = moment(evt.date).format('YYYY-MM-DD');
    console.log(Date.parse(evtDt));
    return { ...evt, date: evtDt };
  });
}

