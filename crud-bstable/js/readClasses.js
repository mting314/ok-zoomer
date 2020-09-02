var theTable = document.getElementById("table1");

chrome.storage.sync.get('classes', function (result) {
  const foobar = ['A', 'B', 'C'];


  for (const [index, classObject] of result.classes.entries()) {
    console.log(classObject.classinfo);
    var row = theTable.insertRow();


    var rowIndex = document.createElement('th');
    rowIndex.appendChild(document.createTextNode(index.toString()));
    row.appendChild(rowIndex);

    var className = row.insertCell();
    className.appendChild(document.createTextNode(classObject.classinfo.subj_area_cd));

    // var section = row.insertCell();
    // section.appendChild(document.createTextNode(classObject.classinfo.class_section));

    // var days = row.insertCell();
    // days.appendChild(document.createTextNode(classObject.classinfo.meet_days));

    // var time = row.insertCell();
    // time.appendChild(document.createTextNode(classObject.classinfo.meet_times));

    // var zoomLink = row.insertCell();
    // zoomLink.appendChild(document.createTextNode(classObject.url));
    
    // var password = row.insertCell();
    // password.appendChild(document.createTextNode(classObject.password));
  }

});