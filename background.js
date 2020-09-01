'use strict'

const url = chrome.runtime.getURL('data.json')

function addClass(array, toAdd) {
  array.push(toAdd);
  //then call the set to update with modified value
  chrome.storage.sync.set({
    classes: array
  }, function () {
    console.log("added to class list with new values");
  });
}

function addPersonal(array, toAdd) {
  array.push(toAdd);
  //then call the set to update with modified value
  chrome.storage.sync.set({
    personal: array
  }, function () {
    console.log("added to personal list with new values");
  });
}

async function launch() {
  chrome.runtime.onMessage.addListener(
    function (request, sender, sendResponse) {
      console.log(sender.tab ?
        "from a content script:" + sender.tab.url :
        "from the extension");
      console.log(JSON.stringify(request.toAdd));
      if (request.type === "class") {
        chrome.storage.sync.get({
            classes: [] //put defaultvalues if any
          },
          function (data) {
            console.log(data.classes);
            addClass(data.classes, request.toAdd); //storing the storage value in a variable and passing to update function
          }
        );
      } else if (request.type === "personal") {
        chrome.storage.sync.get({
            personal: [] //put defaultvalues if any
          },
          function (data) {
            console.log(data.personal);
            addPersonal(data.personal, request.toAdd); //storing the storage value in a variable and passing to update function
          }
        );
      }

      sendResponse({
        farewell: "goodbye"
      });
    });

  chrome.runtime.onMessage.addListener(
    function (request, sender, sendResponse) {
      console.log(sender.tab ?
        "from a content script:" + sender.tab.url :
        "from the extension");
      console.log(JSON.stringify(request.toAdd));

      chrome.storage.sync.get({
          classes: [] //put defaultvalues if any
        },
        function (data) {
          console.log(data.classes);
          addClass(data.classes, request.toAdd); //storing the storage value in a variable and passing to update function
        }
      );

      sendResponse({
        farewell: "goodbye"
      });
    });


  const response = await fetch('data.json');
  const json = await response.json();
  chrome.alarms.clearAll()
  chrome.storage.sync.set({
    leeway: 10
  }, function () {})

  // const data = await fetch(url)
  await chrome.storage.sync.set({
    classes: await json.classes
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
      console.log([classObject.subj_area_cd, classObject.disp_catlg_no, classDayChar, target].join(' ').replace(/\s+/g, ' ').trim())
      chrome.alarms.create([classObject.subj_area_cd, classObject.disp_catlg_no, classDayChar].join(' ').replace(/\s+/g, ' ').trim(), {
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