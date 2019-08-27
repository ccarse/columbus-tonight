import puppeteer from 'puppeteer';
import { Event } from '../index';
import moment from 'moment';
import 'datejs';

const url = 'https://www.capa.com/venues/detail/ohio-theatre';

const scrape = async (page: puppeteer.Page) => {
  try {
    await page.goto(url, { waitUntil: 'networkidle2' });
    let events = await page.evaluate(`
      [...document.querySelectorAll('.eventItem')].map(evt => {
        let event;
        try {
          event = {
            venue: 'Ohio Theatre',
            venueURL: 'https://www.capa.com/venues/detail/ohio-theatre',
            title: evt.querySelector('.info .title').innerText,
            url: evt.querySelector('.thumb a').href,
            dateStr: evt.querySelector('.date') && evt.querySelector('.date').innerText.split('–')[0],
            time: null,
            price: null
          };
        } catch (error) {
          console.log(error);
        }
        return (event && event.dateStr && event.title) ? event : null;
      });
    `);
    events = events.filter((el: any) => el !== null);

    console.log(`Returning ${events.length} events`);

    return events.map((e: any) => {
      console.log(Date.parse(e.dateStr));
      return { ...e, date: moment(Date.parse(e.dateStr)).format('YYYY-MM-DD') };
    }) as Event[];
  } catch (error) {
    console.log('Error!');
    console.log(error);
  } finally {
    await page.close();
  }
};

// function getDates(dateStr: string) {
// }

export default scrape;
