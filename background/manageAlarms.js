function createSingleAlarm(classObject, classDayChar) {
  chrome.storage.sync.get('leeway', function (result) {
    var now = new Date()
    var classTime = classObject.classInfo.meet_items[0].meet_strt_tm.split(':')
    var classHour = parseInt(classTime[0])
    var classMinute = parseInt(classTime[1])


    var classDay = parseDayOfWeek(classDayChar);
    var dayDifference = (((classDay - now.getDay()) % 7) + 7) % 7

    var timeToRing = now.getTime() + dayDifference * 24 * 60 * 60000
    var target = new Date(timeToRing)

    target.setHours(classHour, classMinute, 0, 0)
    if (dayDifference == 0) {
      if (now.getTime() - target.getTime() > result.leeway * 60 * 1000) {
        target.setDate(target.getDate() + 7)
      }
    }

    var start_time_matches = classObject.classInfo.class_strt_dt.match(/\((.*?)\)/);
    var end_time_matches = classObject.classInfo.class_last_dt.match(/\((.*?)\)/);
    console.log(start_time_matches[1], end_time_matches[1]);

    var start_time, end_time;
    if (start_time_matches && end_time_matches) {
      start_time = new Date(parseInt(start_time_matches[1]));
      end_time = new Date(parseInt(end_time_matches[1]));
      console.log([start_time, target, end_time].join(" | "));
    } else {
      start_time = new Date();
      end_time = new Date();
      end_time.setDate(end_time.getDate() + 7 * 12); // make class artificially end in 12 weeks
    }

    // fudge data to test alarms
    var timeObject = new Date;
    target = new Date(timeObject.getTime() + 10000);
    end_time.setTime(target.getTime() + 30*24*60*60*1000);

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
    createSingleAlarm(classObject, classObject.classInfo.meet_days.charAt(i));
  }
}