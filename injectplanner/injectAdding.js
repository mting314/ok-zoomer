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

  if (obj.parent().parent().parent().index() === 1) {
    paramData.class_prim_act_fl = 'y'
  }

  // var paramData = "{'term_cd':'" + classParams.term_cd + "','subj_area_cd':'" + classParams.subj_area_cd + "','crs_catlg_no':'" + classParams.crs_catlg_no + "'}"
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
            var result = prompt("Add this class to the planner?\r\n" + selectedClass.subj_area_cd + " " + selectedClass.class_section + "\r\nIf so, optionally enter a Zoom link:", "https://ucla.zoom.us/j/");
            if (result != null) {
              delete selectedClass.anchor_tags;
              delete selectedClass.info_tooltip_data;
              chrome.runtime.sendMessage({
                toAdd: {
                  classinfo: newres.d.svcRes.ResultTiers[0],
                  url: result
                }
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

(function () {


  var anchors = document.getElementsByTagName("a");

  var classLinks = []
  for (var i = 0; i < anchors.length; i++) {
    if (anchors[i].getAttribute('title') && anchors[i].getAttribute('title').includes("Class Detail for")) {
      classLinks.push(anchors[i]);
    }
  }
  console.log(classLinks);


  chrome.storage.sync.get('classes', function (result) {
    classLinks.forEach(link => {
      var found = false;
      result.classes.forEach(myclass => {
        if (link.getAttribute('title').includes(myclass.classinfo.srs_crs_no)) {
          found = true;
          var zoomLink = document.createElement('a')
          zoomLink.href = myclass.url;


          var warningSpan = document.createElement('span');
          warningSpan.className = "icon-heart"

          zoomLink.appendChild(warningSpan)
          link.parentNode.parentNode.childNodes[13].appendChild(zoomLink);
          return;
        }
      });
      if (!found) {
        var addLink = document.createElement("a");
        addLink.appendChild(document.createTextNode("Add to Ok, Zoomer?"))
        addLink.className = "addclass";
        link.parentNode.parentNode.childNodes[13].appendChild(addLink);
      }
    });

    $('.addclass').on('click', function (e, manual) {
      if (typeof manual === 'undefined' || manual === false) {
        $('a.addclass').not(this).trigger('click', true);
        console.log('Triggered', this.textContent.trim());
        // console.log($(this).parent().parent().children()[1]);
        addClass($(this));
      }
    });
  });
})();