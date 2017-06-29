const fs = require('fs');
const syncRequest = require('sync-request');
const request = require('request');
const jsdom = require('jsdom');
const { JSDOM } = jsdom;
const { actionGroups } = require('./constants/actionGroups.json');
const { jobs } = require('./constants/jobs.json');

const allowCache = true;

const actionsData = {};
const actionCategories = {};

const skippableActions = [
  'Stellar Detonation',
  'the Balance',
  'The Balance',
  'The Bole',
  'The Arrow',
  'The Spear',
  'The Ewer',
  'The Spire',
  'Lord of Crowns',
  'Lady of Crowns',
  'Fuma Shuriken',
  'Katon',
  'Raiton',
  'Hyoton',
  'Huton',
  'Doton',
  'Suiton',
  'Higanbana',
  'Tenka Goken',
  'Midare Setsugekka',
  'Heated Split Shot',
  'Heated Slug Shot',
  'Heated Clean Shot',
  'Rook Overload',
  'Bishop Overload',
  'Ruin IV',
  'Wyrmwave',
  'Akh Morn',
  'Enchanted Riposte',
  'Enchanted Zwerchhau',
  'Enchanted Redoublement',
  'Enchanted Moulinet'
]

const downloadIcon = (uri, iconType, job, action) => {
  const iconPath = `./icons/${iconType}/${job}_${action}.png`;
  //console.log(`Attempting to download icon ${action}:`);
  // If we already have the icon, don't make another request;
  if (fs.existsSync(iconPath) && allowCache) {
    //console.log(`Icon already downloaded`);
  } else {
    // Otherwise make the request to download the icon
    //console.log('Downloading Icon ', action);
    try {
      request.head(uri, (err, res, body) => {
        request(uri).pipe(fs.createWriteStream(iconPath))
      });
    } catch (e) {
      console.error('unable to download icon: ', e);
    }
  }
}

const findAncestor = (el, cls) => {
  while ((el = el.parentElement) && !el.classList.contains(cls));
  return el;
}

const getImageUrl = (container) => {
  return container.querySelector('.job__skill_icon>img').getAttribute('src');
}

Object.keys(jobs).forEach((jobName) => {
  const job = jobs[jobName];
  //if (jobName !== 'astrologian') return;
  console.log('\n \n--------Getting html content from ', job.html, ' :-------');
  const jobHtml = syncRequest('GET', job.html,
    {
      'headers': {
        'user-agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/58.0.3029.110 Safari/537.36',
        'referrer': 'http://na.finalfantasyxiv.com/jobguide/ninja/'
      },
      'cache': (allowCache) ? 'file' : ''
    }
  ).getBody().toString();
  console.log('------HTML content retrieved for ', jobName, '------\n\n');

  try {

    const { document } = (new JSDOM(`${jobHtml}`)).window;
    const actionRows = document.querySelectorAll('tr[id*="action"]');

    actionRows.forEach((actionRow) => {
      const action = {};
      const category = findAncestor(actionRow, 'job__content__wrapper').querySelector('.job__sub_title').textContent;
      const actionName = actionRow.querySelector('.skill__wrapper > p > strong').textContent;
      console.log(category, actionName);
      const actionCast = (actionRow.querySelector('td.cast')) ? actionRow.querySelector('td.cast').textContent : '';
      const actionRecast = (actionRow.querySelector('td.recast')) ? actionRow.querySelector('td.recast').textContent : '';
      const actionCost = (actionRow.querySelector('td.cost')) ? actionRow.querySelector('td.cost').textContent : '';
      const tooltip = actionRow.querySelector('td.content').innerHTML || '';
      const actionId = actionRow.getAttribute('id');
      const level = (actionRow.querySelector('td.jobClass')) ? actionRow.querySelector('td.jobClass').textContent : '';
      const imageUrl = getImageUrl(actionRow);



      downloadIcon(imageUrl, 'actions', jobName, actionId);


      action.icon = `icons/actions/${jobName}_${actionId}.png`;
      action.name = actionName;
      action.category = category;
      action.cast = actionCast;
      action.cost = actionCost;
      action.level = level;
      action.recast = actionRecast;
      action.tooltip = tooltip;
      action.job = jobName;
      //console.log(action);
      // Only return the action if it's usable
      if (skippableActions.indexOf(actionName) < 0) actionsData[`${jobName}_${category}_${actionId}`] = action;
    })

  } catch (e) {
    console.error('unable to parse job html: ', e);
  }
});

// Try to write the action data to the file system.
try {
  fs.writeFileSync('./output/actions.json', JSON.stringify(actionsData));
} catch (e) {
  console.error('Unable to write action data to file system:', e);
}