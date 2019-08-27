import puppeteer from 'puppeteer';
import { Event } from '../index';
import moment from 'moment';
import 'datejs';

const url = 'https://www.capa.com/venues/detail/palace-theatre';

const scrape = async (page: puppeteer.Page) => {
  try {
    await page.goto(url, { waitUntil: 'networkidle2' });
    let events = await page.evaluate(`
      [...document.querySelectorAll('.eventItem')].map(evt => {
        let event;
        try {
          event = {
            venue: 'Palace Theatre',
            venueURL: 'https://www.capa.com/venues/detail/palace-theatre',
            title: evt.querySelector('.info .title').innerText,
            url: evt.querySelector('.thumb a').href,
            dateStr: evt.querySelector('.date .m-date__singleDate') && evt.querySelector('.date .m-date__singleDate').innerText,
            time: null,
            price: null
          };
        } catch (error) {
          console.log(error);
        }
        return (event && event.date && event.title) ? null : event;
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
