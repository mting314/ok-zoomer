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

function addClass(obj) {

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

              delete selectedClass.anchor_tags;
              delete selectedClass.info_tooltip_data;

              // TODO: sendmessage seems to break pretty often. I think there are fixes out there?
              chrome.runtime.sendMessage({
                toAdd: {
                  classInfo: newres.d.svcRes.ResultTiers[0],
                  url: result,
                  password: password
                },
                type: "addClass"
              }, function (response) {
                console.log(response.farewell);
                location.reload();
              });
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
    personalEntry.name = entryRow.cells[1].childNodes[1].wholeText;
  } catch (err) {
    console.log(err);
  }

  try {
    // the personal entry Days is the text node within the anchor tag of the 3rd td of the row
    personalEntry.days = entryRow.cells[2].childNodes[1].childNodes[0].wholeText;
  } catch (err) {
    console.log(err);
  }

  try {
    // the personal entry time is the only child node of the 4th td of the row
    personalEntry.time = entryRow.cells[3].childNodes[0].wholeText;
  } catch (err) {
    console.log(err);
  }

  return personalEntry;
}

function addPersonal(obj) {
  var personalRow = obj.parentNode.parentNode
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
    chrome.runtime.sendMessage({
      toAdd: {
        entryInfo: personalObject,
        url: result,
        password: password
      },
      type: "addPersonal"
    }, function (response) {
      console.log(response.farewell);
      location.reload();
    });
  }
}

function equalEntries(first, second) {
  return (first.name == second.name && first.days == second.days && first.time == second.time);
}

function createZoomLink(url) {
  var zoomLink = document.createElement('a')
  zoomLink.href = url;
  zoomLink.className = "zoom-link";
  zoomLink.target = "_blank";

  var zoomIcon = document.createElement('span');
  zoomIcon.className = "moon-icon-zoom"

  var path1 = document.createElement('span');
  path1.className = "path1"
  var path2 = document.createElement('span');
  path2.className = "path2"
  var path3 = document.createElement('span');
  path3.className = "path3"

  zoomIcon.appendChild(path1);
  zoomIcon.appendChild(path2);
  zoomIcon.appendChild(path3);

  zoomLink.appendChild(zoomIcon)

  return zoomLink;
}

function createAddLink(type) {
  var addLink = document.createElement("a");
  var plusSpan = document.createElement("span")
  plusSpan.className = "icon-plus";
  plusSpan.classList.add("zoomer-plus");
  addLink.appendChild(plusSpan);
  addLink.className = type;
  addLink.href = "#"

  return addLink;
}

(function () {

  // inject links to class planner tables
  var anchors = document.getElementsByTagName("a");

  // TODO: replace this with the jquery method 
  // ctl00_MainContent_planClassListView_courseListView_ctrl2_sectionListView_ctrl1_thisTBody

  // var classLinks = []
  // for (var i = 0; i < anchors.length; i++) {
  //   if (anchors[i].getAttribute('title') && anchors[i].getAttribute('title').includes("Class Detail for")) {
  //     classLinks.push(anchors[i]);
  //   }
  // }


  chrome.storage.sync.get('classes', function (result) {
    var classIndex = 0;
    while ($(`#ctl00_MainContent_planClassListView_courseListView_ctrl${classIndex}_sectionListView_ctrl0_thisRow`).length != 0) {
      var sectionIndex = 0;
      while ($(`#ctl00_MainContent_planClassListView_courseListView_ctrl${classIndex}_sectionListView_ctrl${sectionIndex}_thisRow`).length != 0) {
        var currentClassRow = $(`#ctl00_MainContent_planClassListView_courseListView_ctrl${classIndex}_sectionListView_ctrl${sectionIndex}_thisRow`)[0];
        console.log(currentClassRow);
        var found = false;
        result.classes.forEach(myclass => {
          if (currentClassRow.cells[1].childNodes[1].getAttribute('title').includes(myclass.classInfo.srs_crs_no)) {
            found = true;
            var zoomLink = createZoomLink(myclass.url)
            currentClassRow.cells[6].appendChild(zoomLink);
            return;
          }
        });
        if (!found) {
          var addLink = createAddLink("addclass")
          currentClassRow.cells[6].appendChild(addLink);
        }
        sectionIndex++;
      }
      classIndex += 2; // for some reason the class table counter increments by 2 ¯\_(ツ)_/¯
    }

    var classIndex = 0;
    while ($(`#ctl00_MainContent_enrolledNotPlanList_courseListView_ctrl${classIndex}_sectionListView_ctrl0_thisRow`).length != 0) {
      var sectionIndex = 0;
      while ($(`#ctl00_MainContent_enrolledNotPlanList_courseListView_ctrl${classIndex}_sectionListView_ctrl${sectionIndex}_thisRow`).length != 0) {
        var currentClassRow = $(`#ctl00_MainContent_enrolledNotPlanList_courseListView_ctrl${classIndex}_sectionListView_ctrl${sectionIndex}_thisRow`)[0];
        var found = false;
        result.classes.forEach(myclass => {
          if (currentClassRow.cells[1].childNodes[1].getAttribute('title').includes(myclass.classInfo.srs_crs_no)) {
            found = true;
            var zoomLink = createZoomLink(myclass.url)
            currentClassRow.cells[6].appendChild(zoomLink);
            return;
          }
        });
        if (!found) {
          var addLink = createAddLink("addclass")
          currentClassRow.cells[6].appendChild(addLink);
        }
        sectionIndex++;
      }
      classIndex += 2; // for some reason the class table counter increments by 2 ¯\_(ツ)_/¯
    }



    $('.addclass').on('click', function (e, manual) {
      if (typeof manual === 'undefined' || manual === false) {
        $('a.addclass').not(this).trigger('click', true);
        addClass($(this));
      }
      return false;
    });
  });


  // inject to Personal Entries table
  chrome.storage.sync.get('personal', function (result) {
    var counter = 0;
    while ($(`tr#ctl00_MainContent_personalEntryListView_ctrl${counter}_iItemRow`).length != 0) {
      var personalRow = $(`tr#ctl00_MainContent_personalEntryListView_ctrl${counter}_iItemRow`)[0]

      // check if already in planner
      var found = false;
      result.personal.forEach(personalEntry => {
        if (equalEntries(personalEntry.entryInfo, extractPersonal(personalRow))) {
          found = true;
          var zoomLink = createZoomLink(personalEntry.url)
          personalRow.cells[1].appendChild(zoomLink);
          return;
        }
      });
      if (!found) {
        var addLink = createAddLink("addpersonal")
        personalRow.cells[1].appendChild(addLink);
      }
      counter++;
    }
    $('.addpersonal').on('click', function (e, manual) {
      if (typeof manual === 'undefined' || manual === false) {
        $('a.addpersonal').not(this).trigger('click', true);
        console.log($(this)[0]);
        addPersonal($(this)[0])
      }
      return false;
    });

  });
})();