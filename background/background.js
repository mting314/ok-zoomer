'use strict'

async function launch() {
  activateListeners();

  //clear all alarms
  chrome.alarms.clearAll()
  chrome.storage.sync.set({
    leeway: 10
  }, function () {})

  // clear all classes
  await chrome.storage.sync.set({
    classes: []
  });
  // clear all personal entries
  await chrome.storage.sync.set({
    personal: []
  });
  // by default, alarms are turned OFF
  await chrome.storage.sync.set({
    alarms: false
  });

  //   // chrome.declarativeContent.onPageChanged.removeRules(undefined, function() {
  //   //   chrome.declarativeContent.onPageChanged.addRules([{
  //   //     conditions: [new chrome.declarativeContent.PageStateMatcher({
  //   //       pageUrl: {hostEquals: 'developer.chrome.com'},
  //   //     })],
  //   //     actions: [new chrome.declarativeContent.ShowPageAction()]
  //   //   }]);
  //   // });

  // });

}

chrome.runtime.onInstalled.addListener(launch)

function parseDayOfWeek(weekday) {
  var weekdayDict = {
    M: 1,
    T: 2,
    W: 3,
    R: 4,
    F: 5,
    S: 6,
    Q: 7 // Dude what do you want me to do do you have a better letter?
  }
  if (weekday in weekdayDict) {
    return weekdayDict[weekday]
  } else {
    throw 'Invalid day of the week';
  }
}

chrome.runtime.onMessage.addListener(function (message) {
  if (message && message.type == 'copy') {
    var input = document.createElement('textarea');
    document.body.appendChild(input);
    input.value = message.text;
    input.focus();
    input.select();
    document.execCommand('Copy');
    input.remove();
  }
});

chrome.alarms.onAlarm.addListener(function (alarm) {
  chrome.storage.sync.get('alarms', function (alarms) {
    // only create a notification if alarms are turned on
    if (alarms.alarms) {
      chrome.storage.sync.get('classes', function (result) {
        var currentClass = findElement(result.classes, 'zoomerID', alarm.name.replace(/ .*/, ''))
        chrome.notifications.create(alarm.name, {
          type: 'basic',
          iconUrl: '../images/sign_toontown_central.jpg',
          title: extractClassName(currentClass),
          message: 'You have a class',
          eventTime: alarm.scheduledTime,
          buttons: [{
            title: 'Yes, get me there',
            iconUrl: '../images/sign_toontown_central.jpg'
          }, {
            title: 'Get out of my way',
            iconUrl: '../images/dollar_10.jpg'
          }],
          requireInteraction: false,
          silent: false
        }, function (notificationId) {})
      });
    }
  })
});

/* Respond to the user's clicking one of the buttons */
chrome.notifications.onButtonClicked.addListener(function (notifId, btnIdx) {
  chrome.storage.sync.get('classes', function (result) {
    var currentClass = findElement(result.classes, 'zoomerID', notifId.replace(/ .*/, ''))
    if (btnIdx === 0) {
      console.log(currentClass.url)
      // window.open(currentClass['url']);
      chrome.tabs.create({
        url: currentClass.url
      }, function (tab) {
        console.log(tab)
      })
    } else if (btnIdx === 1) {
      saySorry()
    }
  })
})

// chrome.tabs.onUpdated.addListener(function (tabId , changeInfo, tab) {
//   if (changeInfo.status === 'complete') {
//     if (tab.url.includes("ucla.zoom.us")){
//       console.log(tab)
//     }
//   }
// });

/* Add this to also handle the user's manually dismissing the notification */
chrome.notifications.onClosed.addListener(function () {
  saySorry()
})

/* Handle the user's rejection
 * (simple ignore if you just want to hide the notification) */
function saySorry() {}