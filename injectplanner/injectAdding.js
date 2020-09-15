// I'm keeping a lot of old DOM code in here even after moving lots of stuff to JQuery, I'm just afraid
// that some systems might not support JQuery or whatever and that I'll have to switch back

function getLastWord(words) {
  var n = words.split(" ");
  return n[n.length - 1];

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

function getElementIndex(node) {
  var index = 0;
  while ((node = node.previousElementSibling)) {
    index++;
  }
  return index;
}

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
            var result = prompt("Add this class to the planner?\r\n" + extractClassName(selectedClass) + " " + selectedClass.class_section + "\r\nIf so, optionally enter a Zoom link:", "https://ucla.zoom.us/j/");
            if (result != null) {
              var password;
              if (result === "") {
                password = ""
              } else {
                password = prompt("What is the password for the class: " + extractClassName(selectedClass) + " " + selectedClass.class_section + "\r\nat the link " + result);
              }
              if (password != null) {
                delete selectedClass.anchor_tags;
                delete selectedClass.info_tooltip_data;
                delete selectedClass.meet_location_tooltip;

                // chrome.runtime.sendMessage({
                //   toAdd: {
                //     classInfo: newres.d.svcRes.ResultTiers[0],
                //     url: result,
                //     zoomerID: randomID(),
                //     password: password
                //   },
                //   type: "addClass"
                // }, function (response) {
                //   console.log(response.farewell);
                //   location.reload();
                // });
                var msg = {
                  toAdd: {
                    classInfo: newres.d.svcRes.ResultTiers[0],
                    url: result,
                    zoomerID: randomID(),
                    password: password,
                  },
                  type: "addClass"
                }
                port.postMessage(msg);
                console.log("sending message:", msg);
              }
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
    time: ""
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
  var result = prompt("Add this Personal Entry to the Ok, Zoomer?\r\n" + personalObject.name + "\r\nIf so, optionally enter a Zoom link:", "https://ucla.zoom.us/j/");
  if (result != null) {
    var password;
    if (result === "") {
      password = ""
    } else {
      password = prompt("What is the password for the Personal Entry: " + personalObject.name + "\r\nat the link " + result);
    }
    if (password != null) {
      // chrome.runtime.sendMessage({
      //   toAdd: {
      //     entryInfo: personalObject,
      //     url: result,
      //     zoomerID: randomID(),
      //     password: password
      //   },
      //   type: "addPersonal"
      // }, function (response) {
      //   console.log(response.farewell);
      //   location.reload();
      // });
      var msg = {
        toAdd: {
          entryInfo: personalObject,
          url: result,
          zoomerID: randomID(),
          password: password
        },
        type: "addPersonal"
      }
      port.postMessage(msg);
      console.log("sending message:", msg);
    }
  }
}

function equalEntries(first, second) {
  return (first.name == second.name && first.days == second.days && first.time == second.time);
}

// TODO: As of right now, when changing class info the zoom link on class planner page still remembers
// its old link if you don't refresh. Probably should change? Acutally maybe not, that requires accessing
// the database, which could be worse than just having the link be injected and hard coded in the HTML
function createZoomLink(url) {
  var zoomLink = $(`<a href="${url}" class = "zoom-link" target="_blank"></a>`);

  // var zoomLink = document.createElement('a')
  // zoomLink.href = url;
  // zoomLink.className = "zoom-link";
  // zoomLink.target = "_blank";

  var zoomIcon = $(`<span class="moon-icon-zoom"></span>`);
  // var zoomIcon = document.createElement('span');
  // zoomIcon.className = "moon-icon-zoom"

  // for some reason making that little zoom icon (with the camera) requires three paths, check css
  var pathList = [];
  for (var i = 1; i <= 3; i++) {
    pathList.push($(`<span class="path${i.toString()}"></span>`))
  }

  // zoomIcon.append(pathList);

  // var path1 = document.createElement('span');
  // path1.className = "path1"
  // var path2 = document.createElement('span');
  // path2.className = "path2"
  // var path3 = document.createElement('span');
  // path3.className = "path3"

  // zoomIcon.appendChild(path1);
  // zoomIcon.appendChild(path2);
  // zoomIcon.appendChild(path3);

  zoomLink.append(zoomIcon.append(pathList));

  return zoomLink;
}

function createAddLink(type) {
  var addLink = $(`<a href="#" class="${type}"><span class="icon-plus zoomer-plus"></span></a>`)


  // var addLink = document.createElement("a");
  // var plusSpan = document.createElement("span")
  // plusSpan.className = "icon-plus";
  // plusSpan.classList.add("zoomer-plus");
  // addLink.appendChild(plusSpan);
  // addLink.className = type;
  // addLink.href = "#"

  return addLink;
}

(function () {
  var port = chrome.runtime.connect({
    name: "knockknock"
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
              currentClassRow.find("td:eq(6)").append(createZoomLink(myclass.url));
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
              currentClassRow.find("td:eq(6)").append(createZoomLink(myclass.url));
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
          // personalRow.cells[1].appendChild(zoomLink);
          personalRow.find("td:eq(1)").append(createZoomLink(personalEntry.url))
          return;
        }
      });
      if (!found) {
        // personalRow.cells[1].appendChild(addLink);
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