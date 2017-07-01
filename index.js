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

const downloadIcon = (uri, iconType, job, category, action) => {
  const iconPath = `./icons/${iconType}/${job}_${category}_${action}.png`;
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
    const actionRows = document.querySelectorAll('tbody.job__tbody>tr');

    actionRows.forEach((actionRow) => {
      const action = {};
      const category = findAncestor(actionRow, 'job__content__wrapper').querySelector('.job__sub_title').textContent;
      const actionName = actionRow.querySelector('.skill__wrapper > p > strong').textContent;
      //console.log(category, actionName);
      const actionCast = (actionRow.querySelector('td.cast')) ? actionRow.querySelector('td.cast').textContent : '';
      const actionRecast = (actionRow.querySelector('td.recast')) ? actionRow.querySelector('td.recast').textContent : '';
      const actionCost = (actionRow.querySelector('td.cost')) ? actionRow.querySelector('td.cost').textContent : '';
      const tooltip = actionRow.querySelector('td.content').innerHTML || '';
      let actionId;
      if (category.indexOf('Trait') > -1) return;
      // If it has an ID, great...otherwise we need to generate one...we'll just use the action name as ID
      if (actionRow.getAttribute('id')) {
        actionId = actionRow.getAttribute('id');
      } else {
        actionId = actionName;
      }
      const level = (actionRow.querySelector('td.jobClass')) ? actionRow.querySelector('td.jobClass').textContent : '';
      const imageUrl = getImageUrl(actionRow);

      downloadIcon(imageUrl, 'actions', jobName, category, actionId);

      action.icon = `icons/actions/${jobName}_${category}_${actionId}.png`;
      action.name = actionName;
      action.category = category;
      action.cast = actionCast;
      action.cost = actionCost;
      action.level = level;
      action.recast = actionRecast;
      action.tooltip = tooltip;
      action.job = jobName;

      if (skippableActions.indexOf(actionName) < 0) actionsData[`${jobName}_${category}_${actionId}`] = action;
    })

  } catch (e) {
    console.error('unable to parse job html: ', e);
  }
});

// Generate General Actions for each job
Object.keys(jobs).forEach((jobName) => {

  actionsData[`${jobName}_sprint`] = {
    icon: 'icons/generalActions/sprint.png',
    name: 'Sprint',
    category: 'General Actions',
    tooltip: 'Run around faster.',
    job: jobName
  };
  actionsData[`${jobName}_limit_break`] = {
    icon: 'icons/generalActions/limit.png',
    name: 'Limit Break',
    category: 'General Actions',
    tooltip: 'Go all out.',
    job: jobName
  };
  actionsData[`${jobName}_mount`] = {
    icon: 'icons/generalActions/mount.png',
    name: 'Mount Up',
    category: 'General Actions',
    tooltip: 'Summon a mount.',
    job: jobName
  };
  actionsData[`${jobName}_return`] = {
    icon: 'icons/generalActions/return.png',
    name: 'Return',
    category: 'General Actions',
    tooltip: 'Use your hearthstone.',
    job: jobName
  };
  actionsData[`${jobName}_teleport`] = {
    icon: 'icons/generalActions/teleport.png',
    name: 'Teleport',
    category: 'General Actions',
    tooltip: 'Open up the teleport menu.',
    job: jobName
  };

  actionsData[`${jobName}_potion`] = {
    icon: 'icons/generalActions/item.png',
    name: 'Potion',
    category: 'General Actions',
    tooltip: 'This is a placeholder for a potion.',
    job: jobName
  };

  // Add pet management
  if (jobName === 'summoner' || jobName === 'scholar') {
    actionsData[`${jobName}_away`] = {
      icon: 'icons/petManagement/away.png',
      name: 'Away',
      category: 'Pet Management',
      tooltip: 'Order pet to leave the battlefield',
      job: jobName
    };
    actionsData[`${jobName}_heel`] = {
      icon: 'icons/petManagement/heel.png',
      name: 'Heel',
      category: 'Pet Management',
      tooltip: 'Order pet to follow behind you.',
      job: jobName
    };
    actionsData[`${jobName}_place`] = {
      icon: 'icons/petManagement/place.png',
      name: 'Place',
      category: 'Pet Management',
      tooltip: 'Order pet to move to a specific location.',
      job: jobName
    };
    actionsData[`${jobName}_stay`] = {
      icon: 'icons/petManagement/stay.png',
      name: 'Stay',
      category: 'Pet Management',
      tooltip: 'Order pet to remain where it is.',
      job: jobName
    };
    actionsData[`${jobName}_guard`] = {
      icon: 'icons/petManagement/guard.png',
      name: 'Guard',
      category: 'Pet Management',
      tooltip: 'Order pet to refrain from attacking until you attack or are attacked.',
      job: jobName
    };
    actionsData[`${jobName}_steady`] = {
      icon: 'icons/petManagement/steady.png',
      name: 'Steady',
      category: 'Pet Management',
      tooltip: 'Order pet to refrain from attacking until ordered to do so.',
      job: jobName
    };
    actionsData[`${jobName}_sic`] = {
      icon: 'icons/petManagement/sic.png',
      name: 'Sic',
      category: 'Pet Management',
      tooltip: 'Order pet to attack.',
      job: jobName
    };
    actionsData[`${jobName}_obey`] = {
      icon: 'icons/petManagement/steady.png',
      name: 'Obey',
      category: 'Pet Management',
      tooltip: 'Order pet to attack, but refrain from using certain actions until ordered to do so.',
      job: jobName
    };
  }

  switch (jobName) {
    case 'paladin':
    case 'warrior':
    case 'dark_knight':
      actionsData[`${jobName}_adrenaline_rush`] = {
        icon: 'icons/adrenalineRush/aegis_boon.png',
        name: 'Aegis Boon',
        category: 'Adrenaline Rush',
        tooltip: 'Temporarily reduces damage taken by all party members by 50%.',
        job: jobName
      }
      break;
    case 'white_mage':
    case 'scholar':
    case 'astrologian':
      actionsData[`${jobName}_adrenaline_rush`] = {
        icon: 'icons/adrenalineRush/empyrean_rain.png',
        name: 'Empyrean Rain',
        category: 'Adrenaline Rush',
        tooltip: 'Restores 50% of own HP and the HP of all nearby party members, as well as cure all status effects.',
        job: jobName
      }
      break;
    case 'monk':
    case 'dragoon':
    case 'ninja':
    case 'samurai':
      actionsData[`${jobName}_adrenaline_rush`] = {
        icon: 'icons/adrenalineRush/raw_destruction.png',
        name: 'Raw Destruction',
        category: 'Adrenaline Rush',
        tooltip: 'Delivers an attack to a single target.',
        job: jobName
      }
      break;
    case 'bard':
    case 'machinist':
      actionsData[`${jobName}_adrenaline_rush`] = {
        icon: 'icons/adrenalineRush/terminal_velocity.png',
        name: 'Terminal Velocity',
        category: 'Adrenaline Rush',
        tooltip: 'Deals unaspected damage to all enemies in a straight line in front of the caster.',
        job: jobName
      }
      break;
    case 'black_mage':
    case 'summoner':
    case 'red_mage':
      actionsData[`${jobName}_adrenaline_rush`] = {
        icon: 'icons/adrenalineRush/cometeor.png',
        name: 'Cometeor',
        category: 'Deals unaspected damage to all enemies near point of impact.',
        tooltip: 'Temporarily reduces damage taken by all party members by 50%.',
        job: jobName
      }
      break;
    default:
  }
});

// Try to write the action data to the file system.
try {
  fs.writeFileSync('./output/actions.json', JSON.stringify(actionsData));
} catch (e) {
  console.error('Unable to write action data to file system:', e);
}