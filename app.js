const Crawler = require('./crawler');
const js2xmlparser = require("js2xmlparser");

const args = require('minimist')(process.argv.slice(2));

const url = args.url || 'https://wiprodigital.com';

const nestedLimit = args.nestedLimit || 1;

const outputType = args.output || 'xml';

console.log(`url: ${url}, nestedLimit: ${nestedLimit}`);

const crawler = new Crawler(url);
crawler.nestedLimit = nestedLimit;

crawler.start((resources) => {
  const array = [...resources];

  console.log(`${url} has ${array.length} links.`);

  console.log();

  if (outputType == 'xml') {
    console.log(js2xmlparser.parse("sitemap", array));
  } else {
    console.log(array);
  }
});