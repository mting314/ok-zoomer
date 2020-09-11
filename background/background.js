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
    Q: 7
  }
  if (weekday in weekdayDict) {
    return weekdayDict[weekday]
  } else {
    throw 'Invalid day of the week';
  }
}

function createSingleAlarm(classObject, classDayChar) {
  chrome.storage.sync.get('leeway', function (result) {
    var now = new Date()
    var classTime = classObject.meet_items[0].meet_strt_tm.split(':')
    var classHour = parseInt(classTime[0])
    var classMinute = parseInt(classTime[1])


    var classDay = parseDayOfWeek(classDayChar);
    var dayDifference = (((classDay - now.getDay()) % 7) + 7) % 7

    var timeToRing = now.getTime() + dayDifference * 24 * 60 * 60000
    var target = new Date(timeToRing)

    target.setHours(classHour, classMinute, 0)
    if (dayDifference == 0) {
      if (now.getTime() - target.getTime() > result.leeway * 60 * 1000) {
        target.setDate(target.getDate() + 7)
      }
    }
    var count = 0;
    while (count < 12) {
      console.log([extractClassName(classObject), classDayChar, target].join(' '))
      chrome.alarms.create(extractClassName(classObject) + " " + classDayChar, {
        when: target.getTime()
      });
      target.setDate(target.getDate() + 7);
      count++;
    }
  });
}

async function createClassAlarm(classObject) {
  for (var i = 0; i < classObject.meet_days.length; i++) {
    createSingleAlarm(classObject, classObject.meet_days.charAt(i));
  }
}

chrome.alarms.onAlarm.addListener(function (alarm) {
  chrome.notifications.create(alarm.name.slice(0, -2), {
    type: 'basic',
    iconUrl: 'images/sign_toontown_central.jpg',
    title: alarm.name.slice(0, -2),
    message: 'You have a class',
    buttons: [{
      title: 'Yes, get me there',
      iconUrl: 'images/sign_toontown_central.jpg'
    }, {
      title: 'Get out of my way',
      iconUrl: 'images/dollar_10.jpg'
    }]
  }, function (notificationId) {})
})

/* Respond to the user's clicking one of the buttons */
chrome.notifications.onButtonClicked.addListener(function (notifId, btnIdx) {
  chrome.storage.sync.get('classes', function (result) {
    var currentClass = findElement(result.classes, 'name', notifId)
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