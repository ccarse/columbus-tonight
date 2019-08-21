import puppeteer from 'puppeteer';

const url = 'https://ohioexpocenter.com/events/list/';

const scrape = async (page: puppeteer.Page) => {
  try {
    await page.goto(url, { waitUntil: 'networkidle2' });
    const events = await page.evaluate(`[...document.querySelectorAll('.tribe-events-list-event-title')].map(x => x.innerText)`);
    console.log(`Returning ${events.length} events`);
    return events.map((e: string) => {
      return {
        venue: 'Ohio Expo Center',
        venueURL: 'https://ohioexpocenter.com',
        title: e,
        url: 'https://ohioexpocenter.com',
        date: '2019-08-27', //YYYY-MM-DD
        time: '12:00',
        price: 0,
      };
    });
  } catch (error) {
    console.log('Error!');
    console.log(error);
  } finally {
    await page.close();
  }
};

export default scrape;
