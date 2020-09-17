dateWithTimeZone = (timeZone, year, month, day, hour, minute, second) => {
  let date = new Date(Date.UTC(year, month, day, hour, minute, second));

  let utcDate = new Date(date.toLocaleString('en-US', { timeZone: "UTC" }));
  let tzDate = new Date(date.toLocaleString('en-US', { timeZone: timeZone }));
  let offset = utcDate.getTime() - tzDate.getTime();

  date.setTime( date.getTime() + offset );

  return date;
};

function createSingleClassAlarm(classObject, classDayChar) {
  chrome.storage.sync.get('leeway', function (result) {
    // read in start time and end time
    var therenow = new Date();
    var start_time_matches = classObject.classInfo.class_strt_dt.match(/\((.*?)\)/);
    var end_time_matches = classObject.classInfo.class_last_dt.match(/\((.*?)\)/);

    var start_time, end_time;
    if (start_time_matches && end_time_matches) {
      start_time = new Date(parseInt(start_time_matches[1]));
      end_time = new Date(parseInt(end_time_matches[1]));
    } else {
      start_time = new Date(therenow.toLocaleString('en-US', {
        timeZone: "America/Los_Angeles"
      }));
      end_time = new Date(therenow.toLocaleString('en-US', {
        timeZone: "America/Los_Angeles"
      }));
      end_time.setDate(end_time.getDate() + 7 * 12); // make class artificially end in 12 weeks
    }

    // since classes have a defined start time, and we could be adding a class after the quarter starts,
    // we have to start creating alarms from the LATER of right now, and the day classes start
    // if we start just right now, and its before the quarter starts, start_time < target is not satisfied
    // if we start then, but we're in Week 5, we'll get spammed 15 alarms from alarms being created for
    // week 1,2,3 etc.
    var dates = [new Date(therenow.toLocaleString('en-US', {
      timeZone: "America/Los_Angeles"
    })), start_time]
    var now = new Date(Math.max.apply(null, dates));
    var classTime = classObject.classInfo.meet_items[0].meet_strt_tm.split(':')
    var classHour = parseInt(classTime[0])
    var classMinute = parseInt(classTime[1])


    var classDay = parseDayOfWeek(classDayChar);
    var dayDifference = (((classDay - now.getDay()) % 7) + 7) % 7

    var timeToRing = new Date(now.getTime() + dayDifference * 24 * 60 * 60000)
    // var target = new Date(timeToRing)
    var target = dateWithTimeZone("America/Los_Angeles", timeToRing.getFullYear(), timeToRing.getMonth(), timeToRing.getDate(), classHour, classMinute, 0)


    // target.setHours(classHour, classMinute, 0, 0)
    if (dayDifference == 0) {
      if (therenow.getTime() - target.getTime() > 0) {
        target.setDate(target.getDate() + 7)
      }
    }



    // fudge data to test alarms
    var timeObject = new Date;
    // target = new Date(timeObject.getTime() + 10000);
    // end_time.setTime(target.getTime() + 30 * 24 * 60 * 60 * 1000);
    console.log([start_time, target, end_time].join(" | "));
    while (start_time < target && target < end_time) {
      console.log(classObject.zoomerID + " " + target);
      chrome.alarms.create(classObject.zoomerID + " " + target, {
        when: target.getTime()
      });
      target.setDate(target.getDate() + 7);
    }
  });
}

async function createClassAlarm(classObject) {
  for (var i = 0; i < classObject.classInfo.meet_days.length; i++) {
    createSingleClassAlarm(classObject, classObject.classInfo.meet_days.charAt(i));
  }
}

function createSinglePersonalAlarm(personalEntry, personalDayChar) {
  console.log("creating alarms for", personalEntry.entryInfo.name, personalDayChar)
  chrome.storage.sync.get('leeway', function (result) {
    var thereNow = new Date();
    var now = new Date(thereNow.toLocaleString('en-US', {
      timeZone: "America/Los_Angeles"
    }));
    var personalStartTime = personalEntry.entryInfo.time.split('-')[0];
    var personalHour, personalMinute;
    personalHour = parseInt(personalStartTime.split(':')[0]) + 12 * (personalStartTime.slice(-2) == "pm")
    // if a class happens on the hour, the time is recorded as 9am (without a :00)
    if (personalStartTime.includes(":")) {
      personalMinute = parseInt(personalStartTime.split(':')[1])
    } else {
      personalMinute = 0;
    }

    var personalDay = parseDayOfWeek(personalDayChar);
    var dayDifference = (((personalDay - now.getDay()) % 7) + 7) % 7

    var timeToRing = new Date(now.getTime() + dayDifference * 24 * 60 * 60000)
    var target = dateWithTimeZone("America/Los_Angeles", timeToRing.getFullYear(), timeToRing.getMonth(), timeToRing.getDate(), personalHour, personalMinute, 0)
    console.log(target);

    // target.setHours(personalHour, personalMinute, 0, 0)
    if (dayDifference == 0) {
      if (thereNow.getTime() - target.getTime() > 0) {
        target.setDate(target.getDate() + 7)
      }
    }

    // TODO: find way to get when term ends, and end personal entries then
    end_time = new Date(now.getTime());
    end_time.setDate(end_time.getDate() + 7 * 12); // make class artificially end in 12 weeks

    // // fudge data to test alarms
    // var timeObject = new Date();
    // target = new Date(timeObject.getTime() + 10000);
    console.log([target, end_time].join(" | "));

    while (target < end_time) {
      console.log(personalEntry.zoomerID + " " + target);
      chrome.alarms.create(personalEntry.zoomerID + " " + target, {
        when: target.getTime()
      });
      target.setDate(target.getDate() + 7);
    }
  });
}

async function createPersonalAlarm(personalEntry) {
  for (var i = 0; i < personalEntry.entryInfo.days.length; i++) {
    createSinglePersonalAlarm(personalEntry, personalEntry.entryInfo.days.charAt(i));
  }
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