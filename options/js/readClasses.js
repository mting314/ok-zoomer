var theTable = new BSTable("table1");

chrome.storage.sync.get('classes', function (result) {
  for (const [index, classObject] of result.classes.entries()) {
    console.log(classObject.classinfo);
    var row = document.createElement('tr');


    var rowIndex = document.createElement('th');
    rowIndex.appendChild(document.createTextNode(index.toString()));
    row.appendChild(rowIndex);

    var className = row.insertCell();
    className.appendChild(document.createTextNode(extractClassName(classObject)));

    var section = row.insertCell();
    section.appendChild(document.createTextNode(classObject.classinfo.class_section));

    var days = row.insertCell();
    days.appendChild(document.createTextNode(classObject.classinfo.meet_days));

    var time = row.insertCell();
    time.appendChild(document.createTextNode(classObject.classinfo.meet_times));

    var zoomLink = row.insertCell();
    zoomLink.appendChild(document.createTextNode(classObject.url));

    var password = row.insertCell();
    var passwordText;
    if(classObject.password) {
      passwordText = document.createTextNode(classObject.password)
    }
    else {
      passwordText = document.createElement("span")
      passwordText.className = "no-password";
      passwordText.appendChild(document.createTextNode("No Password"))
    }
    password.appendChild(document.createTextNode(classObject.password ? classObject.password : "No Password"));

    theTable.table.append(row);
  }
  theTable.init();
});