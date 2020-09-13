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
  // by default, alarms are turned ON
  await chrome.storage.sync.set({
    alarms: true
  });

}

// run the launch function when extension is first installed to set defaults
chrome.runtime.onInstalled.addListener(launch)

// reconnect to listeners every time chrome restarts (like after user closes chrome)
chrome.runtime.onStartup.addListener(activateListeners)

function parseDayOfWeek(weekday) {
  var weekdayDict = {
    M: 1,
    T: 2,
    W: 3,
    R: 4,
    F: 5,
    S: 6,
    U: 7 // I mean I guess...
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
  console.log("alarm detected")
  chrome.storage.sync.get('alarms', function (alarms) {
    // only create a notification if alarms are turned on
    if (alarms.alarms) {
      chrome.storage.sync.get('classes', function (result) {
        var currentClass = findElement(result.classes, 'zoomerID', alarm.name.replace(/ .*/, ''))
        if (currentClass) {
          console.log(currentClass);
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
        }
      });
      chrome.storage.sync.get('personal', function (result) {
        var currentEntry = findElement(result.personal, 'zoomerID', alarm.name.replace(/ .*/, ''))
        console.log(currentEntry);
        if (currentEntry) {
          chrome.notifications.create(alarm.name, {
            type: 'basic',
            iconUrl: '../images/sign_toontown_central.jpg',
            title: currentEntry.entryInfo.name,
            message: 'You have a Personal Entry event',
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
        }
      })
    }
  })
});

/* Respond to the user's clicking one of the buttons */
chrome.notifications.onButtonClicked.addListener(function (notifId, btnIdx) {
  chrome.storage.sync.get('classes', function (result1) {
    chrome.storage.sync.get('personal', function (result2) {
      var currentClass = findElement(result1.classes, 'zoomerID', notifId.replace(/ .*/, ''));
      var currentPersonal = findElement(result2.personal, 'zoomerID', notifId.replace(/ .*/, ''))
      if (btnIdx === 0) {
        // window.open(currentClass['url']);
        if (currentClass) {
          chrome.tabs.create({
            url: currentClass.url
          }, function (tab) {
            console.log(tab)
          })
        } else if (currentPersonal) {
          chrome.tabs.create({
            url: currentPersonal.url
          }, function (tab) {
            console.log(tab)
          })
        }
      } else if (btnIdx === 1) {
        saySorry()
      }
    })
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
function saySorry() {
  console.log("why are you skipping class")
}