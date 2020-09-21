'use strict'

async function launch() {
  // start by clearing everything
  chrome.storage.sync.clear()
  activateListeners();
  speedchatOfTheDay();

  //clear all alarms
  chrome.alarms.clearAll()

  // clear all personal entries
  await chrome.storage.sync.set({
    personal: []
  });
  // by default, alarms are turned ON
  await chrome.storage.sync.set({
    alarms: true
  });

}

function pickRandomQuestion(json) {
  var now = new Date()
  var myrng = new Math.seedrandom(now.getFullYear().toString() + now.getMonth().toString() + now.getDate().toString());
  var obj_keys = Object.keys(json);
  var ran_key = obj_keys[Math.floor(myrng() * obj_keys.length)];
  return json[ran_key];
}

function speedchatOfTheDay() {
  $.getJSON(chrome.runtime.getURL('speedchat.json')).done(function (data) {
    chrome.storage.sync.set({
      speedchat: pickRandomQuestion(data)
    });
  })
}

// const url = chrome.runtime.getURL('speedchat.json');

// run the launch function when extension is first installed to set defaults
chrome.runtime.onInstalled.addListener(launch)

// reconnect to listeners every time chrome restarts (like after user closes chrome)
// chrome.runtime.onStartup.addListener(activateListeners)
chrome.windows.onCreated.addListener(function () {
  chrome.windows.getAll(function (windows) {
    if (windows.length == 1) {
      activateListeners();
      speedchatOfTheDay();
    }
  });
});

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
  IDLookup(alarm.name.replace(/ .*/, ''), function (foundItem) {
    if (foundItem.sendNotifications) {
      console.log(foundItem);
      chrome.notifications.create(alarm.name, {
        type: 'basic',
        iconUrl: '../images/get_started128.png',
        title: extractClassName(foundItem, true),
        message: 'You have an event',
        eventTime: alarm.scheduledTime,
        buttons: [{
          title: 'Yes, get me there',
          iconUrl: '../images/icons8-zoom-240.png'
        }, {
          title: 'Get out of my way',
          iconUrl: '../images/Drake-meme.jpg'
        }],
        requireInteraction: true,
        silent: false
      }, function (notificationId) {})
    }
  });
});

/* Respond to the user's clicking one of the buttons */
chrome.notifications.onButtonClicked.addListener(function (notifId, btnIdx) {
  if (btnIdx === 0) {
    IDLookup(notifId.replace(/ .*/, ''), function (foundClass) {
      if (foundClass) {
        if (!foundClass.isLink) {
          chrome.tabs.create({
            url: createURLfromID(foundClass.url, foundClass.password)
          }, function (tab) {
            console.log(tab)
          })
        } else {
          chrome.tabs.create({
            url: foundClass.url
          }, function (tab) {
            console.log(tab)
          })
        }
      }
    })
  } else if (btnIdx === 1) {
    saySorry()
  }

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