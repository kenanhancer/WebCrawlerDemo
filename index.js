const Crawler = require('./crawler');

// const url = 'http://kenanhancer.com/'
const url = 'https://wiprodigital.com'

const crawler = new Crawler(url);
crawler.nestedLimit = 2;


crawler.start((resources) => {
  const array = [...resources];

  console.log(`${url} has ${array.length} links.`);

  console.log();

  console.log(array);
});