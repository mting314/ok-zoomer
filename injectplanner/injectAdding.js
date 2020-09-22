function getLastWord(words) {
  var n = words.split(" ");
  return n[n.length - 1];

}

function getElementIndex(node) {
  var index = 0;
  while ((node = node.previousElementSibling)) {
    index++;
  }
  return index;
}


function inputHandling(name) {
  var inputObj = {
    url: "",
    password: "",
    isLink: true,
  }
  var result = prompt("Add this class to the planner?\r\n" + name + "\r\nIf so, optionally enter a Zoom link OR Zoom Room ID:", "0123456789 OR https://ucla.zoom.us/j/");
  if (result == null) { // if cancelled, return undefined
    return;
  }
  var urlData;
  if (result != "") { // if clicked OK, but didn't enter URL, return the empty inputObj
    urlData = checkIsLink(result);
    if (urlData == undefined) {
      return;
    }
    inputObj.url = urlData[1];
    inputObj.isLink = urlData[0];
    var password = prompt("What is the password for the class: " + name + "\r\nat the link " + result);
    if (password != null) {
      inputObj.password = password;
    }
  }
  return inputObj;
}

function extractTimeBoundaries(classInfo) {
  if (classInfo.class_strt_dt != undefined) {
    var start_time_matches = classInfo.class_strt_dt.match(/\((.*?)\)/);
    var end_time_matches = classInfo.class_last_dt.match(/\((.*?)\)/);
  }

  var start_time, end_time;
  if (start_time_matches && end_time_matches) {
    start_time = parseInt(start_time_matches[1]);
    end_time = parseInt(end_time_matches[1]);
  } else {
    var now = new Date();
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
  var classLink = obj.parent().parent().children()[1]
  var classParams = getParams(classLink.childNodes[1].href)
  var paramData = {
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
    searchKey: "sorry,Ican't"
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
            try {
              var inputObj = inputHandling(extractClassName(selectedClass, true));
            } catch (err) {
              if (err.name == 'LengthError' || err.name == 'InputError') {
                alert(err.message);
                return;
              } else {
                throw err; // let others bubble up
              }
            }
            if (inputObj != undefined) {
              var msg = {
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
              port.postMessage(msg);
              // try {
              //   port.postMessage(msg);
              // } catch (err) {

              //   console.log(err);
              //   if (err.message == "Attempting to use a disconnected port object") {
              //     var newport = chrome.runtime.connect({
              //       name: "knockknock"
              //     });
              //     // reload page after background listener executed port's command
              //     newport.onMessage.addListener(function (msg) {
              //       if (msg.type == "reload") {
              //         location.reload();
              //       }
              //     });

              //   }
              //   if (chrome.runtime.lastError) {
              //     alert("oof");
              //   }
              // }
              console.log("sending message:", msg);
            }
          }
        });
      }
    }
  });

}

function extractPersonal(entryRow) {
  var personalEntry = {
    name: "",
    days: "",
    time: "",
  };
  // the personal entry description/name is the 2nd child node of the 2nd td of the row
  try {
    //personalEntry.name = entryRow.cells[1].childNodes[1].wholeText;
    personalEntry.name = entryRow.find("td:eq(1)").text()
  } catch (err) {
    console.log(err);
  }

  try {
    // the personal entry Days is the text node within the anchor tag of the 3rd td of the row
    // personalEntry.days = entryRow.cells[2].childNodes[1].childNodes[0].wholeText;
    personalEntry.days = entryRow.find("td:eq(2) a").text()
  } catch (err) {
    console.log(err);
  }

  try {
    // the personal entry time is the only child node of the 4th td of the row
    // personalEntry.time = entryRow.cells[3].childNodes[0].wholeText;
    personalEntry.time = entryRow.find("td:eq(3)").text()

  } catch (err) {
    console.log(err);
  }
  console.log(personalEntry);
  return personalEntry;
}

function addPersonal(port, obj) {
  var personalRow = obj.parent().parent();
  var personalObject = extractPersonal(personalRow);
  console.log(personalObject);
  try {
    var inputObj = inputHandling(personalObject.name);
  } catch (err) {
    if (err.name == 'LengthError' || err.name == 'InputError') {
      alert(err.message);
      return;
    } else {
      throw err; // let others bubble up
    }
  }
  if (inputObj != undefined) {
    var msg = {
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

    port.postMessage(msg);
    // try {
    //   port.postMessage(msg);
    // } catch (err) {
    //   console.log(err);
    //   chrome.runtime.sendMessage({
    //     type: 'wakeup',
    //   }, function (response) {
    //     if (response.command == "retry") {
    //       port.postMessage(msg);
    //     }
    //   });
    // }

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
  var zoomLink;
  if (zoomerItem.isLink) {
    zoomLink = $(`<a href="${zoomerItem.url}" class = "zoom-link" target="_blank"></a>`);
  } else {
    zoomLink = $(`<a href="${createURLfromID(zoomerItem.url, zoomerItem.password)}" class = "zoom-link" target="_blank"></a>`);
  }


  var zoomIcon = $(`<span class="moon-icon-zoom"></span>`);

  // for some reason making that little zoom icon (with the camera) requires three paths, check css
  var pathList = [];
  for (var i = 1; i <= 3; i++) {
    pathList.push($(`<span class="path${i.toString()}"></span>`))
  }

  zoomLink.append(zoomIcon.append(pathList));

  return zoomLink;
}

function createAddLink(type) {
  var addLink = $(`<a href="#" class="${type}"><span class="icon-plus zoomer-plus"></span></a>`)
  return addLink;
}

(function () {
  var port = chrome.runtime.connect({
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
    var classIndex = 0;
    while ($(`#ctl00_MainContent_planClassListView_courseListView_ctrl${classIndex}_sectionListView_ctrl0_thisRow`).length != 0) {
      var sectionIndex = 0;
      while ($(`#ctl00_MainContent_planClassListView_courseListView_ctrl${classIndex}_sectionListView_ctrl${sectionIndex}_thisRow`).length != 0) {
        var currentClassRow = $(`#ctl00_MainContent_planClassListView_courseListView_ctrl${classIndex}_sectionListView_ctrl${sectionIndex}_thisRow`).first();
        var found = false;
        if (classList != undefined) {
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
    var classIndex = 0;
    while ($(`#ctl00_MainContent_enrolledNotPlanList_courseListView_ctrl${classIndex}_sectionListView_ctrl0_thisRow`).length != 0) {
      var sectionIndex = 0;
      while ($(`#ctl00_MainContent_enrolledNotPlanList_courseListView_ctrl${classIndex}_sectionListView_ctrl${sectionIndex}_thisRow`).length != 0) {
        var currentClassRow = $(`#ctl00_MainContent_enrolledNotPlanList_courseListView_ctrl${classIndex}_sectionListView_ctrl${sectionIndex}_thisRow`).first();
        var found = false;
        if (classList != undefined) {
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
  chrome.storage.sync.get('personal', function (result) {
    var counter = 0;
    while ($(`tr#ctl00_MainContent_personalEntryListView_ctrl${counter}_iItemRow`).length != 0) {
      var personalRow = $(`tr#ctl00_MainContent_personalEntryListView_ctrl${counter}_iItemRow`).first()

      // check if already in planner
      var found = false;
      result.personal.forEach(personalEntry => {
        if (equalEntries(personalEntry.entryInfo, extractPersonal(personalRow))) {
          found = true;
          personalRow.find("td:eq(1)").append(createZoomLink(personalEntry))
          return;
        }
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