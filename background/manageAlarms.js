function createAlarms(entry) {
  if (entry.classTimes.length == 0) {
    return;
  }
  // since classes have a defined start time, and we could be adding a class after the quarter starts,
  // we have to start creating alarms from the LATER of right now, and the day classes start
  // if we start just right now, and its before the quarter starts, start_time < target is not satisfied
  // if we start then, but we're in Week 5, we'll get spammed 15 alarms from alarms being created for
  // week 1,2,3 etc.
  var dates = [new Date(), new Date(entry.timeBoundaries[0])]
  var now = new Date(Math.max.apply(null, dates));

  for (var i = 0; i < entry.classTimes.length; i++) {
    var classTime = entry.classTimes[i].split(":");
    var classDay = parseInt(classTime[0]);
    var dayDifference = (((classDay - now.getDay()) % 7) + 7) % 7

    var timeToRing = now.getTime() + dayDifference * 24 * 60 * 60000
    var target = new Date(timeToRing);
    target.setHours(parseInt(classTime[1]), parseInt(classTime[2]), 0, 0)

    if (dayDifference == 0) {
      if (thereNow.getTime() - target.getTime() > 0) {
        target.setDate(target.getDate() + 7)
      }
    }
    if (entry.remindTime) {
      target.setTime(target.getTime() - 60000 * entry.remindTime)
    }

    var startTime = new Date(entry.timeBoundaries[0]);
    var endTime = new Date(entry.timeBoundaries[1]);
    
    // fudge data to test alarms
    // var timeObject = new Date();
    // target = new Date(timeObject.getTime() + 10000);

    console.log([startTime, target, endTime].join(" | "));
    while (startTime < target && target < endTime) {
      console.log(entry.zoomerID + " " + target);
      chrome.alarms.create(entry.zoomerID + " " + target, {
        when: target.getTime()
      });
      target.setDate(target.getDate() + 7);
    }
  }
}

function editAlarms(zoomerID) {
  deleteAlarm(zoomerID);
  IDLookup(zoomerID, function (foundClass) {
    createAlarms(foundClass);
  })
}

function deleteAlarm(zoomerID) {
  chrome.alarms.getAll(function (alarms) {
    for (var i = 0; i < alarms.length; i++) {
      if (alarms[i].name.includes(zoomerID)) {
        chrome.alarms.clear(alarms[i].name, function (wasCleared) {
          if (wasCleared) {
            console.log("an alarm was deleted")
          }
        });
      }
    }
  })
}