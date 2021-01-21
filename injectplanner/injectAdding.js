const millisInDay = 24 * 60 * 60 * 1000;

// Returns true if two arrays have nonempty intersection, false otherwise
function hasIntersection(array1, array2){
  return array1.filter(value => array2.includes(value)).length !== 0;
}

function getLastWord(words) {
  let n = words.split(" ");
  return n[n.length - 1];

}

function getElementIndex(node) {
  let index = 0;
  while ((node = node.previousElementSibling)) {
    index++;
  }
  return index;
}


function inputHandling(name) {
  let inputObj = {
    url: "",
    password: "",
    isLink: true,
  }
  let result = prompt("Add this class to the planner?\r\n" + name + "\r\nIf so, optionally enter a Zoom link OR Zoom Room ID:", "0123456789 OR https://ucla.zoom.us/j/");
  if (result === null) { // if cancelled, return undefined
    return;
  }
  let urlData;
  if (result != "") { // if clicked OK, but didn't enter URL, return the empty inputObj
    urlData = checkIsLink(result);
    if (urlData === undefined) {
      return;
    }
    inputObj.url = urlData[1];
    inputObj.isLink = urlData[0];
    let password = prompt("What is the password for the class: " + name + "\r\nat the link " + result);
    if (password != null) {
      inputObj.password = password;
    }
  }
  return inputObj;
}

function extractTimeBoundaries(classInfo) {
  let start_time, end_time;
  let start_time_matches, end_time_matches;

  if (classInfo.class_strt_dt != undefined) {
    start_time_matches = classInfo.class_strt_dt.match(/\((.*?)\)/);
    end_time_matches = classInfo.class_last_dt.match(/\((.*?)\)/);
  }

  if (typeof start_time_matches !== "undefined" && typeof end_time_matches !== "undefined") {
    start_time = parseInt(start_time_matches[1]);
    // TODO (?): There's a really strange thing for Winter 2021 at least where the "class_last_dt" is marked
    // as the midnight of the last *Friday*, which actually cuts off that last Friday of classes
    // I have no idea when this might happen again so I think it might just be safe to always add 24 hours
    end_time = parseInt(end_time_matches[1]) + millisInDay;
    // I'm also a bit uncomfortable now adding 24 hours like this just because I'm afraid of weird DST stuff potentially
    // and I trust moment a lot more, but it doesn't seem worth it to store these boundaries as moment
    // objects either, so I think this'll do.
  } else {
    let now = new Date();
    start_time = new Date(now.toLocaleString('en-US', {
      timeZone: "America/Los_Angeles"
    })).getTime();
    end_time = new Date(start_time);
    end_time.setDate(end_time.getDate() + 7 * 12); // make personal entry artificially end in 12 weeks
    end_time = end_time.getTime();
  }
  return [start_time, end_time]
}

// TODO: sometimes, after restarting computer or something, I get "trying to use disconnected port" error.
// To counteract this, I can "listen" for this error somehow, and run a function in background to reopen
// the port?
function addClass(port, obj) {
  let classLink = obj.parent().parent().children()[1]
  let classParams = getParams(classLink.childNodes[1].href)
  let paramData = {
    search_by_typ_cd: 'classidnumber',
    term_cd: `${classParams.term_cd}`,
    ses_grp_cd: '%',
    subj_area_cd: `${classParams.subj_area_cd}`,
    crs_catlg_no: `${classParams.crs_catlg_no}`,
    class_no: `${classParams.class_no}`,
    class_id: `${classParams.class_id}`,
    class_units: '%',
    instr_nm: '%',
    act_enrl_seq_num: '%',
    active_enrl_fl: 'n',
    class_prim_act_fl: 'n',
    id: 'kRnfwF2eOadis08vDX5eZCmwt+Cd17YQA+uPMRwtPEg=',
    searchKey: "sorry,Ican't",
    honors_type_cd: "%",
  }
  // check if this row is the "first" in a class's individual table
  // essentially, this checks if a class is a "primary" one, i.e. a 
  // lecture parenting a discussion. We need to set this flag because 
  // it affects whether our query returns the parent (lecture) section
  // or the child (discussion) section
  if (obj.parent().parent().parent().index() === 1) {
    paramData.class_prim_act_fl = 'y'
  }

  $.ajax({
    type: "POST",
    url: "/ClassPlanner/ClassSearch.asmx/getTierData",
    data: JSON.stringify(paramData),
    contentType: "application/json; charset=utf-8",
    dataType: "json",
    success: function (res) {
      if (res.d.errorMessage) {
        // start retry

        paramData.searchKey = getLastWord(res.d.errorMessage);

        $.ajax({
          type: "POST",
          url: "/ClassPlanner/ClassSearch.asmx/getTierData",
          data: JSON.stringify(paramData),
          contentType: "application/json; charset=utf-8",
          dataType: "json",
          success: function (newres) {
            selectedClass = newres.d.svcRes.ResultTiers[0];
            // remove extraneous stuff from database query
            delete selectedClass.anchor_tags;
            delete selectedClass.info_tooltip_data;
            delete selectedClass.meet_location_tooltip;

            console.log(selectedClass);

            let inputObj;
            try {
              inputObj = inputHandling(extractClassName(selectedClass, true));
            } catch (err) {
              if (err.name == 'LengthError' || err.name == 'InputError') {
                alert(err.message);
                return;
              } else {
                throw err; // let others bubble up
              }
            }
            if (inputObj !== undefined) {
              let msg = {
                toAdd: {
                  classInfo: newres.d.svcRes.ResultTiers[0],
                  classTimes: extractClassTimes(newres.d.svcRes.ResultTiers[0]),
                  timeBoundaries: extractTimeBoundaries(newres.d.svcRes.ResultTiers[0]),
                  url: inputObj.url,
                  sendNotifications: true,
                  zoomerID: randomID(),
                  password: inputObj.password,
                  isLink: inputObj.isLink,
                },
                type: "addClass"
              }
              try {
                port.postMessage(msg);
              } catch (err) {

                if (err.message == "Attempting to use a disconnected port object") {
                  let newport = chrome.runtime.connect({
                    name: "benis"
                  });
                  // reload page after background listener executed port's command
                  newport.onMessage.addListener(function (msg) {
                    if (msg.type == "reload") {
                      location.reload();
                    }
                  });
                  newport.postMessage(msg);
                }
              }

              console.log("sending message:", msg);
            }
          }
        });
      }
    }
  });

}

function extractPersonal(entryRow) {
  let personalEntry = {
    name: "",
    days: "",
    time: "",
  };
  // the personal entry description/name is the 2nd child node of the 2nd td of the row
  try {
    personalEntry.name = entryRow.find("td:eq(1)").text()
  } catch (err) {
    console.log(err);
  }

  try {
    // the personal entry Days is the text node within the anchor tag of the 3rd td of the row
    personalEntry.days = entryRow.find("td:eq(2) a").text()
  } catch (err) {
    console.log(err);
  }

  try {
    // the personal entry time is the only child node of the 4th td of the row
    personalEntry.time = entryRow.find("td:eq(3)").text()

  } catch (err) {
    console.log(err);
  }
  return personalEntry;
}

function addPersonal(port, obj) {
  let personalRow = obj.parent().parent();
  let personalObject = extractPersonal(personalRow);
  console.log(personalObject);
  let inputObj;
  try {
    inputObj = inputHandling(personalObject.name);
  } catch (err) {
    if (err.name == 'LengthError' || err.name == 'InputError') {
      alert(err.message);
      return;
    } else {
      throw err; // let others bubble up
    }
  }
  if (inputObj !== undefined) {
    let msg = {
      toAdd: {
        entryInfo: personalObject,
        classTimes: extractPersonalTimes(personalObject),
        timeBoundaries: extractTimeBoundaries(personalObject),
        url: inputObj.url,
        zoomerID: randomID(),
        password: inputObj.password,
        isLink: inputObj.isLink,
        sendNotifications: true,
      },
      type: "addPersonal"
    }


    //   port.postMessage(msg);

    try {
      port.postMessage(msg);
    } catch (err) {

      if (err.message == "Attempting to use a disconnected port object") {
        let newport = chrome.runtime.connect({
          name: "benis"
        });
        // reload page after background listener executed port's command
        newport.onMessage.addListener(function (msg) {
          if (msg.type == "reload") {
            location.reload();
          }
        });
        newport.postMessage(msg);
      }
    }

    console.log("sending message:", msg);
  }
}

function equalEntries(first, second) {
  return (first.name == second.name && first.days == second.days && first.time == second.time);
}

// TODO: As of right now, when changing class info the zoom link on class planner page still remembers
// its old link if you don't refresh. Probably should change? Acutally maybe not, that requires accessing
// the database, which could be worse than just having the link be injected and hard coded in the HTML
function createZoomLink(zoomerItem) {
  let zoomLink;
  if (zoomerItem.isLink) {
    zoomLink = $(`<a href="${zoomerItem.url}" class = "zoom-link" target="_blank"></a>`);
  } else {
    zoomLink = $(`<a href="${createURLfromID(zoomerItem.url, zoomerItem.password, zoomerItem.username)}" class = "zoom-link" target="_blank"></a>`);
  }


  let zoomIcon = $(`<span class="moon-icon-zoom"></span>`);

  // for some reason making that little zoom icon (with the camera) requires three paths, check css
  let pathList = [];
  for (let i = 1; i <= 3; i++) {
    pathList.push($(`<span class="path${i.toString()}"></span>`))
  }

  zoomLink.append(zoomIcon.append(pathList));

  return zoomLink;
}

function createAddLink(type) {
  let addLink = $(`<a href="#" class="${type}"><span class="icon-plus zoomer-plus"></span></a>`)
  return addLink;
}

(function () {
  let port = chrome.runtime.connect({
    name: "knockknock"
  });
  chrome.runtime.sendMessage({
    type: 'wakeup',
  });
  // reload page after background listener executed port's command
  port.onMessage.addListener(function (msg) {
    if (msg.type == "reload") {
      location.reload();
    }
  });
  // inject links to class planner tables
  getAllClasses(function (classList) {
    let classIndex = 0;
    while ($(`#ctl00_MainContent_planClassListView_courseListView_ctrl${classIndex}_sectionListView_ctrl0_thisRow`).length != 0) {
      let sectionIndex = 0;
      while ($(`#ctl00_MainContent_planClassListView_courseListView_ctrl${classIndex}_sectionListView_ctrl${sectionIndex}_thisRow`).length != 0) {
        let currentClassRow = $(`#ctl00_MainContent_planClassListView_courseListView_ctrl${classIndex}_sectionListView_ctrl${sectionIndex}_thisRow`).first();
        let found = false;
        if (classList !== undefined) {
          classList.forEach(myclass => {
            if (currentClassRow.find("td:eq(1) a").attr('title').includes(myclass.classInfo.srs_crs_no)) {
              found = true;
              currentClassRow.find("td:eq(6)").append(createZoomLink(myclass));
              return;
            }
          });
        }
        if (!found) {
          currentClassRow.find("td:eq(6)").append(createAddLink("addclass"));
        }
        sectionIndex++;
      }
      classIndex += 2; // for some reason the class table counter increments by 2 ¯\_(ツ)_/¯
    }

    // inject links to tables for classes in study list but not in plan
    while ($(`#ctl00_MainContent_enrolledNotPlanList_courseListView_ctrl${classIndex}_sectionListView_ctrl0_thisRow`).length != 0) {
      let sectionIndex = 0;
      while ($(`#ctl00_MainContent_enrolledNotPlanList_courseListView_ctrl${classIndex}_sectionListView_ctrl${sectionIndex}_thisRow`).length != 0) {
        let currentClassRow = $(`#ctl00_MainContent_enrolledNotPlanList_courseListView_ctrl${classIndex}_sectionListView_ctrl${sectionIndex}_thisRow`).first();
        let found = false;
        if (classList !== undefined) {
          classList.forEach(myclass => {
            if (currentClassRow.find("td:eq(1) a").attr('title').includes(myclass.classInfo.srs_crs_no)) {
              found = true;
              currentClassRow.find("td:eq(6)").append(createZoomLink(myclass));
              return;
            }
          });
        }
        if (!found) {
          currentClassRow.find("td:eq(6)").append(createAddLink("addclass"));
        }
        sectionIndex++;
      }
      classIndex += 2; // for some reason the class table counter increments by 2 ¯\_(ツ)_/¯
    }


    $('.addclass').on('click', function (e, manual) {
      if (typeof manual === 'undefined' || manual === false) {
        $('a.addclass').not(this).trigger('click', true);
        addClass(port, $(this));
      }
      return false;
    });
  });


  // inject to Personal Entries table
  getAllPersonalEntries(function(result) {
    let counter = 0;
    while ($(`tr#ctl00_MainContent_personalEntryListView_ctrl${counter}_iItemRow`).length != 0) {
      let personalRow = $(`tr#ctl00_MainContent_personalEntryListView_ctrl${counter}_iItemRow`).first()

      // check if already in planner
      let found = false;
      // First, check if there is an OZ personal entry that is EXACTLY identitical to the dates/times listed in one personal entry in the class planner
      // This prioritizes when you have a dedicated OZ entry for that row

      // BTW, OZEntry means "Ok Zoomer Entry", the entry stored in the Chrome Extension sync storage
      result.forEach(OZEntry => {
        currentEntry = extractPersonal(personalRow)
        if (equalEntries(OZEntry.entryInfo, currentEntry) || (OZEntry.entryInfo.name === currentEntry.name && hasIntersection(OZEntry.classTimes, extractPersonalTimes(currentEntry)))   ) {
          found = true;
          personalRow.find("td:eq(1)").append(createZoomLink(OZEntry))
          return;
        }
      // TODO: Check if only 1 day and time match, dont need the entire days+times set to match
      // It'll help for when you need 2 personal entries for 2 separate office hours that don't happen at the same time each day

      });
      if (!found) {
        personalRow.find("td:eq(1)").append(createAddLink("addpersonal"))
      }
      counter++;
    }
    $('.addpersonal').on('click', function (e, manual) {
      if (typeof manual === 'undefined' || manual === false) {
        $('a.addpersonal').not(this).trigger('click', true);
        console.log($(this)[0]);
        addPersonal(port, $(this))
      }
      return false;
    });

  });
})();