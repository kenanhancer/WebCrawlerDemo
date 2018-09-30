const request = require('request');
const URL = require('url-parse');

const Crawler = function crawler(initialURL) {

  if (typeof initialURL !== "string") {
    throw new Error("The crawler needs a URL string.");
  }

  let pagesToVisit = [];
  let pagesToVisitForLevel = {};
  const pagesVisited = new Set([]);
  let counter = 0;
  const url = new URL(initialURL);
  const hostName = url.hostname;
  const urlList = new Set([]);
  const crawler = this;

  pagesToVisit.push(initialURL);

  pagesToVisitForLevel[initialURL] = 1;


  this.parseHTMLComments = true;
  this.parseScriptTags = true;
  this.allowInitialDomainChange = false;
  this.nestedLimit = 1;


  const mimeTypes = ['.ico','.ics','.jar','.jpeg','.jpg','.js','.json','.mid','.midi','.mpeg','.mpkg','.odp','.ods','.odt','.oga','.ogv','.ogx','.otf','.png','.pdf','.ppt','.pptx','.rar','.rtf','.sh','.svg','.swf','.tar','.tif','.tiff','.ts','.ttf','.txt','.vsd','.wav','.weba','.webm','.webp','.woff','.woff','.xhtml','.xls','.xlsx','.xml','.xul','.zip','.3gp','.3g2','.7z'];

  const discoverRegex = [
    /\s(?:href|src)\s?=\s?(["']).*?\1/ig,
    /\s(?:href|src)\s?=\s?[^"'\s][^\s>]+/ig,
    /\s?url\((["']).*?\1\)/ig,
    /\s?url\([^"'].*?\)/ig,

    // This could easily duplicate matches above, e.g. in the case of
    // href="http://example.com"
    /https?:\/\/[^?\s><'"]+/ig,

    // This might be a bit of a gamble... but get hard-coded
    // strings out of javacript: URLs. They're often popup-image
    // or preview windows, which would otherwise be unavailable to us.
    // Worst case scenario is we make some junky requests.
    /^javascript:\s*[\w$.]+\(['"][^'"\s]+/ig,

    // Find srcset links
    (string) => {
      var result = /\ssrcset\s*=\s*(["'])(.*)\1/.exec(string);
      return Array.isArray(result) ? String(result[2]).split(",").map(function (string) {
        return string.trim().split(/\s+/)[0];
      }) : "";
    },

    // Find resources in <meta> redirects. We need to wrap these RegExp's in
    // functions because we only want to return the first capture group, not
    // the entire match. And we need two RegExp's because the necessary
    // attributes on the <meta> tag can appear in any order
    (string) => {
      var match = string.match(/<meta[^>]*http-equiv\s*=\s*["']?refresh["']?[^>]*content\s*=\s*["'] ?[^"'>]*url=([^"'>]*)["']?[^>]*>/i);
      return Array.isArray(match) ? [match[1]] : undefined;
    },

    (string) => {
      var match = string.match(/<meta[^>]*content\s*=\s*["']?[^"'>]*url=([^"'>]*)["']?[^>]*http-equiv\s*=\s*["']?refresh["']?[^>]*>/i);
      return Array.isArray(match) ? [match[1]] : undefined;
    }
  ];

  function discoverResources(resourceText) {

    if (!crawler.parseHTMLComments) {
      resourceText = resourceText.replace(/<!--([\s\S]+?)-->/g, "");
    }

    if (!crawler.parseScriptTags) {
      resourceText = resourceText.replace(/<script(.*?)>([\s\S]*?)<\/script>/gi, "");
    }

    // scan for URLs
    return discoverRegex.reduce((list, extracter) => {
      var resources;

      if (extracter instanceof Function) {
        resources = extracter(resourceText);
      } else {
        resources = resourceText.match(extracter);
      }

      if (!crawler.allowInitialDomainChange && resources) {
        resources = resources.filter(resource => {
          resource = resource.replace(/src=|href="/gi, "").replace("\"", "");

          return new URL(resource).hostname == hostName;
        });
      }

      return resources ? list.concat(resources) : list;
    }, []);
  }

  function visitPage(url, level, callback) {

    if (level > crawler.nestedLimit) {
      callback();
      return;
    }

    pagesVisited.add(url);

    if (mimeTypes.some(mimeType=> url.endsWith(mimeType))) {
      callback();
      return;
    }

    request(url, function (error, res, body) {

      counter++;

      if (res === undefined || res.statusCode !== 200) {
        callback();
        return;
      }

      const discRes = discoverResources(body);

      if (discRes.length > 0) {

        level++;

        discRes.forEach(element => {
          const initialSize = urlList.size;

          if (urlList.add(element).size != initialSize) {
            pagesToVisitForLevel[element] = level;
            pagesToVisit.push(element);
          }
        });

        level--;

        // pagesToVisit = [...new Set(pagesToVisit.concat(discRes))];
      }

      if (pagesToVisit.length > 0) {

        callback();
      }

    });

  }

  function invoke() {

    if (pagesToVisit.length == 0) {
      return;
    }

    let nextPage = pagesToVisit.shift();

    let pageLevel = pagesToVisitForLevel[nextPage];

    delete pagesToVisitForLevel[nextPage];



    if (pagesVisited.has(nextPage)) {
      // We've already visited this page, so repeat the crawl
      invoke();
    } else {
      // Visit New page
      visitPage(nextPage, pageLevel, invoke);
    }
  }

  Crawler.prototype.start = function (resultCallback) {

    const timerId = setInterval(function () {

      if (pagesVisited.size == counter) {

        clearInterval(timerId);
        if (resultCallback) {
          resultCallback(urlList);
        }
      }
    }, 250);

    invoke();
  }
};

module.exports = Crawler;