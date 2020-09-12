function activateListeners() {
  chrome.runtime.onConnect.addListener(function (port) {
    // console.assert(port.name == "knockknock");
    port.onMessage.addListener(function (msg) {
      var executed = false;
      console.log(msg);
      if (msg.type === "deleteClass") {
        chrome.storage.sync.get({
            classes: []
          },
          function (data) {
            console.log(data.classes);
            deleteClass(data.classes, msg.index); //storing the storage value in a variable and passing to update function
            executed = true;
          }
        );
      } else if (msg.type === "deletePersonal") {
        chrome.storage.sync.get({
            personal: []
          },
          function (data) {
            console.log(data.personal);
            // nothing personnel, kiddo
            deletePersonal(data.personal, msg.index);
            executed = true;
          }
        );
      } else if (msg.type === "editClass") {
        chrome.storage.sync.get({
            classes: []
          },
          function (data) {
            console.log(data.classes);
            editClass(data.classes, msg.index, msg.newObject);
            executed = true;
          }
        );
      } else if (msg.type === "editPersonal") {
        chrome.storage.sync.get({
            personal: []
          },
          function (data) {
            console.log(data.personal);
            editPersonal(data.personal, msg.index, msg.newObject);
            executed = true;
          }
        );
      }
      // if any command was executed, reload the page you're at
      if (executed) {
        port.postMessage({
          type: "reload"
        });
      }
    });

  });
};

// listen for addition requests
chrome.runtime.onMessage.addListener(
  function (request, sender, sendResponse) {
    console.log(sender.tab ?
      "from a content script:" + sender.tab.url :
      "from the extension");
    console.log(request.type, JSON.stringify(request.toAdd));
    if (request.type === "addClass") {
      chrome.storage.sync.get({
          classes: []
        },
        function (data) {
          console.log(data.classes);
          addClass(data.classes, request.toAdd); //storing the storage value in a variable and passing to update function
          createClassAlarm(request.toAdd);
        }
      );
    } else if (request.type === "addPersonal") {
      chrome.storage.sync.get({
          personal: []
        },
        function (data) {
          console.log(data.personal);
          addPersonal(data.personal, request.toAdd);
        }
      );
    }

    sendResponse({
      farewell: "finished processing addition request"
    });
  });
  
// --------------------------------------------------
// -- helper functions for adding or editing items in the class or personal entry arrays
// --------------------------------------------------

function addClass(array, toAdd) {
  array.push(toAdd);
  //then call the set to update with modified value
  chrome.storage.sync.set({
    classes: array
  }, function () {
    console.log("added to class list with new values");
  });
}

function editClass(array, index, newObject) {
  var oldClass = array[index];
  array[index] = newObject;
  //then call the set to update with modified value
  chrome.storage.sync.set({
    classes: array
  }, function () {
    console.log(`changed ${oldClass} to ${newObject}`);
  });
}

function deleteClass(array, index) {
  var oldClass = array[index];
  array.splice(index, 1);
  //then call the set to update with modified value
  chrome.storage.sync.set({
    classes: array
  }, function () {
    console.log(`removed ${JSON.stringify(oldClass)} from classes list`);
  });
}

function addPersonal(array, toAdd) {
  array.push(toAdd);
  //then call the set to update with modified value
  chrome.storage.sync.set({
    personal: array
  }, function () {
    console.log("added to personal list with new values");
  });
}

function editPersonal(array, index, newObject) {
  var oldPersonal = array[index];
  array[index] = newObject;
  //then call the set to update with modified value
  chrome.storage.sync.set({
    personal: array
  }, function () {
    console.log(`changed ${oldPersonal} to ${newObject}`);
  });
}

function deletePersonal(array, index) {
  var oldPersonal = array[index];
  array.splice(index, 1)
  //then call the set to update with modified value
  chrome.storage.sync.set({
    personal: array
  }, function () {
    console.log(`removed ${oldPersonal} from personal entries list`);
  });
}