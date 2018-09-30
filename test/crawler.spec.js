const assert = require('assert');
const Crawler = require('../crawler');

describe('Basic Web Crawler Test', () => {
    it('should return a not duplicated list', () =>{

        const url = 'https://wiprodigital.com'

        const crawler = new Crawler(url);
        crawler.nestedLimit = 1;

        crawler.start((resources) => {
            const array = [...resources];

            const unique = array.filter((v, i, a) => array.indexOf(v) === i)

            assert.equal(array.length, unique.length);
        });

    });

    it('should return a two nested level visited page list', () => {

        const url = 'https://wiprodigital.com'

        const crawler = new Crawler(url);
        crawler.nestedLimit = 2;

        crawler.start((resources) => {
            const array = [...resources];

            const unique = array.filter((v, i, a) => array.indexOf(v) === i)

            assert.equal(array.length, unique.length);
        });

    });
});