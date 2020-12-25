// moment.tz.add('America/Los_Angeles|PST PDT|80 70|0101|1Lzm0 1zb0 Op0');

function createAlarms(entry) {
  if (entry.classTimes.length === 0) {
    return;
  }
  moment.tz.setDefault("America/Los_Angeles");

  // since classes have a defined start time, and we could be adding a class after the quarter starts,
  // we have to start creating alarms from the LATER of right now, and the day classes start
  // if we start just right now, and its before the quarter starts, start_time < target is not satisfied
  // if we start then, but we're in Week 5, we'll get spammed 15 alarms from alarms being created for
  // week 1,2,3 etc.
  for (let i = 0; i < entry.classTimes.length; i++) {
    let now = moment.max(moment(), moment.unix(entry.timeBoundaries[0]/1000))
    let classTime = entry.classTimes[i].split(":");
    let classDay = parseInt(classTime[0]);
    let dayDifference = (((classDay - now.day()) % 7) + 7) % 7

    let timeToRing = now.add(dayDifference, 'days').hours(classTime[1]).minutes(classTime[2]).seconds(0)

    if (dayDifference === 0) {
      if (moment().diff(timeToRing) > 0) {
        timeToRing.add(1, 'weeks');
      }
    }
    if (entry.remindTime) {
      timeToRing.subtract(entry.remindTime, 'minutes')
    }

    let startTime = moment.unix(entry.timeBoundaries[0]/1000);
    let endTime = moment.unix(entry.timeBoundaries[1]/1000);
    
    // fudge data to test alarms
    // let timeObject = new Date();
    // target = new Date(timeObject.getTime() + 10000);

    console.log([startTime, timeToRing, endTime].join(" | "));

    let createdAlarms = [];
    while (timeToRing.isBetween(startTime, endTime)) {
      createdAlarms.push(entry.zoomerID + " " + extractClassName(entry, true) + " " + new Date(timeToRing.valueOf()));
      chrome.alarms.create(entry.zoomerID + " " + timeToRing.format("LLL"), {
        when: timeToRing.valueOf()
      });
      timeToRing.add(1, 'weeks');
    }
    console.log(`created ${moment().day(classDay).format('dddd')} alarms for ${extractClassName(entry, true)}:`, createdAlarms);

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
    for (let i = 0; i < alarms.length; i++) {
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