// Copyright 2018 The Chromium Authors. All rights reserved.
// Use of this source code is governed by a BSD-style license that can be
// found in the LICENSE file.

'use strict';

let page = document.getElementById('buttonDiv');
const kButtonColors = ['#3aa757', '#e8453c', '#f9bb2d', '#4688f1'];

function constructOptions(kButtonColors) {
  // for (const [index, element] of kButtonColors.entries()) {
  //   let button = document.createElement('button');
  //   button.style.backgroundColor = element;
  //   button.textContent = (index*5).toString();
  //   button.addEventListener('click', function() {
  //     chrome.storage.sync.set({leeway: index*5}, function() {
  //       console.log('minutes is ' + index*5);
  //     })
  //   });
  //   page.appendChild(button);
  // }




}


//constructOptions(kButtonColors);

function buildTable(classList) {
  var classTable = document.createElement("table");
  document.body.appendChild(classTable);

  classList.forEach(element => {
    var classRow = classTable.insertRow()

    var name = document.createElement("TD");
    name.appendChild(document.createTextNode([element.classinfo.subj_area_cd, element.classinfo.disp_catlg_no].join(' ').replace(/\s+/g, ' ').trim()));
    classRow.appendChild(name);

    var section = document.createElement("TD");
    section.appendChild(document.createTextNode(element.classinfo.class_section));
    classRow.appendChild(section);

    var days = document.createElement("TD");
    days.appendChild(document.createTextNode(element.classinfo.meet_days));
    classRow.appendChild(days);

    var instructorCell = document.createElement("TD");
    element.classinfo.instr_items.forEach(instructor => {
      instructorCell.appendChild(document.createTextNode(instructor.instr_nm));
      var br = document.createElement("br");
      instructorCell.appendChild(br);
    })
    classRow.appendChild(instructorCell);

    var zoomURL = document.createElement("TD");
    zoomURL.appendChild(document.createTextNode(element.url));
    classRow.appendChild(zoomURL);
  });
}

chrome.storage.sync.get({
    classes: []
  },
  function (data) {
    console.log(data);
    buildTable(data.classes);
  }
);