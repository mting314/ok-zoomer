function findElement(arr, propName, propValue) {
  if(arr.length == 0){
    return undefined;
  }
  for (var i = 0; i < arr.length; i++) {
    if (arr[i][propName] == propValue)
      return arr[i];
  }
}

function validURL(str) {
  var pattern = new RegExp('^(https?:\\/\\/)?' + // protocol
    '((([a-z\\d]([a-z\\d-]*[a-z\\d])*)\\.)+[a-z]{2,}|' + // domain name
    '((\\d{1,3}\\.){3}\\d{1,3}))' + // OR ip (v4) address
    '(\\:\\d+)?(\\/[-a-z\\d%_.~+]*)*' + // port and path
    '(\\?[;&a-z\\d%_.~+=-]*)?' + // query string
    '(\\#[-a-z\\d_]*)?$', 'i'); // fragment locator
  return !!pattern.test(str);
}

var getParams = function (url) {
  var params = {};
  var parser = document.createElement('a');
  parser.href = url;
  var query = parser.search.substring(1);
  var vars = query.split('&');
  for (var i = 0; i < vars.length; i++) {
    var pair = vars[i].split('=');
    params[pair[0]] = decodeURIComponent(pair[1]).replace(/\+/g, " ");
  }
  return params;
};

function createURLfromID(roomID, password) {
  var zoomIDURL = `zoommtg://zoom.us/join?action=join&confno=${roomID}`
  if (password) {
    var URIpassword = encodeURIComponent(password);
    zoomIDURL += password ? `&pwd=${URIpassword}` : "";
  }
  return zoomIDURL;
}

// https://stackoverflow.com/a/40995732 - how to callback after filling an array
function getAllClasses(callback) {
  var classList = [];
  chrome.storage.sync.get("classIDs", function (result) {
    // if there are IDs, start filling list
    if (result.classIDs != undefined && result.classIDs.length != 0) {
      let c = result.classIDs.length; // initialize a counter
      result.classIDs.forEach(element => {
        chrome.storage.sync.get(element.toString(), function (foundClass) {
          classList.push(foundClass[element.toString()]);
          if (!--c) { // all async calls are finished
            callback(classList);
          }
        });
      })
    }
    // else return an empty array
    else {
      callback([]);
    }
  });
}

// TODO: eventually I need to finish highlighting classes in progress in popup
// function classInProgress(classObject) {
//   var now = new Date();
// }

// decides if you have entered a link or zoom room ID
function checkIsLink(url) {
  var cleanURL = url.replace(/\s/g, '');
  if (!isNaN(cleanURL)) { // if is numeric
    if (!(cleanURL.length >= 9 && cleanURL.length <= 11)) {
      throw {
        name: 'LengthError',
        message: "It look like you entered a Zoom Room ID, but this number is not between 9 and 11 digits. Check if you have any typos.",
        shortmsg: "ID needs to be 9-11 digits!",
      };
    } else {
      return [false, cleanURL];
    }
  } else { // looks like it's definitely not a number, so it should be a URL
    // but check that first
    if (validURL(cleanURL)) {
      // we can actually do something a bit fancy here:
      // someone might unknowing put in something like https://ucla.zoom.us/j/5530616769
      // which actually just has the Room ID sitting right there.
      // So we can detect this, and just add as a room id
      const regex = /j\/\d{9,11}/;
      const found = cleanURL.match(regex);
      if (found != null) {
        var foundID = found[0].match(/\d/g).join("");
        return [false, foundID]
      } else {
        return [true, cleanURL];
      }

    } else {
      throw {
        name: 'InputError',
        message: "Sorry, it doesn't look like that was either a Zoom Room ID or a valid URL.",
        shortmsg: "Not a Zoom ID or valid URL",
      };
    }
  }
}

function getCurrentClasses(callback) {
  var classList = [];
  chrome.storage.sync.get("classIDs", function (result) {
    // if there are IDs, start filling list
    if (result.classIDs != undefined && result.classIDs.length != 0) {
      let c = result.classIDs.length; // initialize a counter
      result.classIDs.forEach(element => {
        chrome.storage.sync.get(element.toString(), function (foundClass) {
          if (foundClass.isgoingon()) {
            classList.push(foundClass[element.toString()]);
          }
          if (!--c) { // all async calls are finished
            callback(classList);
          }
        });
      })
    }
    // else return an empty array
    else {
      callback([]);
    }
  });
}

function extractClassName(classObject, includeLectureName) {
  if (classObject.classInfo) {
    var nameArray = [classObject.classInfo.subj_area_cd, classObject.classInfo.disp_catlg_no]
    if (includeLectureName) {
      nameArray.push(classObject.classInfo.class_section)
    }
    return nameArray.join(' ').replace(/\s+/g, ' ').trim()
  } else if (classObject.entryInfo) { // check if is personal entry
    return classObject.entryInfo.name
  } else {
    var nameArray = [classObject.subj_area_cd, classObject.disp_catlg_no]
    if (includeLectureName) {
      nameArray.push(classObject.class_section)
    }
    return nameArray.join(' ').replace(/\s+/g, ' ').trim()
  }
}

function removeTags(str) {
  if ((str === null) || (str === ''))
    return false;
  else
    str = str.toString();

  // Regular expression to identify HTML tags in  
  // the input string. Replacing the identified  
  // HTML tag with a null string. 
  return str.replace(/(<([^>]+)>)/ig, '');
}

function randomID() {
  return Math.round(Date.now() * Math.random());
}

function parseDayOfWeek(weekday) {
  var weekdayDict = {
    U: 0, // I mean I guess...
    M: 1,
    T: 2,
    W: 3,
    R: 4,
    F: 5,
    S: 6,
    0: "Sunday",
    1: "Monday",
    2: "Tuesday",
    3: "Wednesday",
    4: "Thursday",
    5: "Friday",
    6: "Saturday",
  }
  if (weekday in weekdayDict) {
    return weekdayDict[weekday]
  } else {
    throw 'Invalid day of the week';
  }
}

function extractClassTimes(classInfo) {
  var times = []
  var meetTimes = classInfo.meet_items
  if (meetTimes.length != 0) {
    console.log(meetTimes);
    for (var i = 0; i < meetTimes.length; i++) {
      if (meetTimes[i].meet_days.includes("Varies")) {
        continue;
      }
      for (var j = 0; j < meetTimes[i].meet_days.length; j++) {
        var withSeconds = parseDayOfWeek(meetTimes[i].meet_days.charAt(j)) + ":" + meetTimes[i].meet_strt_tm;
        times.push(withSeconds.substr(0, withSeconds.length - 3))
      }
    }
  }
  return times;
}

function extractPersonalTimes(entryInfo) {
  var times = []
  for (var i = 0; i < entryInfo.days.length; i++) {
    var personalStartTime = entryInfo.time.split('-')[0];
    var personalHour, personalMinute;
    personalHour = parseInt(personalStartTime.split(':')[0]) + 12 * (personalStartTime.slice(-2) == "pm")
    // if a class happens on the hour, the time is recorded as 9am (without a :00)
    if (personalStartTime.includes(":")) {
      personalMinute = parseInt(personalStartTime.split(':')[1])
    } else {
      personalMinute = 0;
    }
    times.push(parseDayOfWeek(entryInfo.days.charAt(i)) + ":" + personalHour.toString().padStart(2, '0') + ":" + personalMinute.toString().padStart(2, '0'))
  }
  return times;
}

// this looks kind of ugly. Is there a better way to do this? Also idk why I have to do callback here
// maybe if I actually read what "synchronous" means or something...
// ALSO, important note, it calls back -1 if the ID was a class, and the index of the personal entry if it was a personal entry
function IDLookup(zoomerID, callback) {
  var foundItem;
  getAllClasses(function (classList) {
    foundItem = findElement(classList, "zoomerID", zoomerID)
    if (foundItem != undefined) {
      console.log(foundItem);
      callback(foundItem, -1);
      return;
    } else {
      chrome.storage.sync.get({
          personal: []
        },
        function (data) {
          console.log(data.personal);
          foundItem = findElement(data.personal, "zoomerID", zoomerID)
          if (foundItem != undefined) {
            callback(foundItem, data.personal.indexOf(foundItem));
            return;
          } else {
            callback(undefined);
            return;
          }
        }
      )
    }
  })
}

function changeTimezone(date, ianatz) {

  // suppose the date is 12:00 UTC
  var invdate = new Date(date.toLocaleString('en-US', {
    timeZone: ianatz
  }));

  // then invdate will be 07:00 in Toronto
  // and the diff is 5 hours
  var diff = date.getTime() - invdate.getTime();

  // so 12:00 in Toronto is 17:00 UTC
  return new Date(date.getTime() + diff);

}