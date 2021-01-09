var portfromCS;

function activateListeners() {
  console.log("activating listeners");
  chrome.runtime.onConnect.addListener(port => {
    portFromCS = port;
    console.log('connected ', port);
    portFromCS.onMessage.addListener(function (msg) {
      console.log(msg);
      // listen for addition requests
      if (msg.type === "addClass") {
        addClass(msg.toAdd, function () {
          portFromCS.postMessage({
            type: "reload"
          });
        })
      } else if (msg.type === "addPersonal") {

        addPersonal(msg.toAdd, function () {});
        createAlarms(msg.toAdd);
        portFromCS.postMessage({
          type: "reload"
        });

        // listen for deletion requests
      } else if (msg.type === "deleteClass") {
        chrome.storage.sync.get({
            classIDs: []
          },
          function (data) {
            try {
              console.log(data.classIDs);
              deleteClass(data.classIDs, msg.zoomerID, function (oldClass) { //storing the storage value in a variable and passing to update function
                portFromCS.postMessage({
                  oldClass: oldClass,
                  type: "successDeleteClass"
                });
              });
            } catch (err) {
              portFromCS.postMessage({
                type: "failureDeleteClass",
                error: err.toString()
              });
            }
          });
      } else if (msg.type === "deletePersonal") {
        chrome.storage.sync.get({
            personalEntryIDs: []
          },
          function (data) {
            try {
              console.log(data.personal);
              // nothing personnel, kiddo
              // var oldPersonal = deletePersonal(data.personal, msg.zoomerID);
              var oldPersonal = deleteClass(data.personalEntryIDs, msg.zoomerID, function (oldClass) { //storing the storage value in a variable and passing to update function
                portFromCS.postMessage({
                  oldClass: oldClass,
                  type: "successDeleteClass"
                });
              });
            } catch (err) {
              portFromCS.postMessage({
                type: "failureDeleteClass",
                error: err.toString()
              });
            }
          });

        // listen for edit requests
      } else if (msg.type === "editItem") {
        try {
          editZoomerItem(msg.zoomerID, msg.editingObj, function (oldItem) {
            portFromCS.postMessage({
              oldItem: oldItem,
              type: "successEditClass"
            });
          });

        } catch (err) {
          portFromCS.postMessage({
            type: "failureEditClass",
            error: err.toString()
          });
        }
      }
    });
  });
}



// --------------------------------------------------
// -- helper functions for adding or editing items in the class or personal entry arrays
// --------------------------------------------------


function addClassID(array, toAdd) {
  array.push(toAdd);
  //then call the set to update with modified value
  chrome.storage.sync.set({
    classIDs: array
  }, function () {
    console.log(`added ${toAdd} to class IDs`);
  });
}

async function addClass(toAdd, callback) {
  await chrome.storage.sync.get({
      classIDs: []
    },
    function (data) {

      // this weird setup allows me to add each class as an individual object to the storage
      // importantly, with the zoomerID as the key
      var obj = {};
      obj[toAdd.zoomerID] = toAdd;

      chrome.storage.sync.set(obj, function () {
        console.log("added", obj, " to class list");
        addClassID(data.classIDs, toAdd.zoomerID); //storing the storage value in a variable and passing to update function
        createAlarms(toAdd);
        callback();
      });

    }
  );
}


// same as addClass, but don't update IDs
function addItemOnly(toAdd, callback) {
  // this weird setup allows me to add each class/PE as an individual object to the storage
  // importantly, with the zoomerID as the key
  var obj = {};
  obj[toAdd.zoomerID] = toAdd;

  chrome.storage.sync.set(obj, function () {
    console.log("added", obj, " to class list");
    createAlarms(toAdd);
    callback();
  });
}

// Extra functions explicitly for adding multiple classes at once
async function addClassIDs(array, toAdd) {
  new_array = array.concat(toAdd);
  //then call the set to update with modified value
  await chrome.storage.sync.set({
    classIDs: new_array
  }, function () {
    console.log(`added ${toAdd} to class IDs`);
  });
}

function deleteZoomerItem(zoomerID, callback) {
  IDLookup(zoomerID, function (foundClass, foundIndex) {
    if (foundIndex == -1) {
      chrome.storage.sync.get({
          classIDs: []
        },
        function (data) {
          deleteClass(data.classIDs, zoomerID, function (oldClass) {
            callback(oldClass)
          });
        });
    } else if (foundIndex === -2) {
      chrome.storage.sync.get({
          personalEntryIDs: []
        },
        function (data) {
          deleteClass(data.personalEntryIDs, zoomerID, function (oldClass) {
            callback(oldClass)
          });
        })
    }
  });
}

// takes zoomerID as a string
function deleteClass(array, zoomerID, callback) {
  chrome.storage.sync.get(zoomerID, function (foundClass) {
    var oldClass = foundClass[zoomerID];
    if (oldClass) {
      // if we found a class with that ID, first remove it from classIDs list

      // then remove the class object itself from storage
      chrome.storage.sync.remove(zoomerID, function (Items) {
        console.log(`removed class from storage`);
      });
      // this should always happen, but just to check: if that id is in the list of classIDs,
      // remove it
      if (array.includes(zoomerID)) {
        array.splice(array.indexOf(zoomerID), 1);
        chrome.storage.sync.set({
          classIDs: array
        }, function () {
          deleteAlarm(zoomerID);
          console.log(`removed ${zoomerID} from classIDs list`);
        });
      }
      callback(oldClass);
    } else {
      throw "could not find class with id: " + zoomerID;
    }
  });
}


async function addPersonalEntryID(array, toAdd) {
  new_array = array.concat(toAdd);
  //then call the set to update with modified value
  await chrome.storage.sync.set({
    personalEntryIDs: new_array
  }, function () {
    console.log(`added ${toAdd} to PE IDs`);
  });
}

function addPersonal(toAdd, callback) {
  chrome.storage.sync.get({
      personalEntryIDs: []
    },
    function (data) {

      // this weird setup allows me to add each class as an individual object to the storage
      // importantly, with the zoomerID as the key
      var obj = {};
      obj[toAdd.zoomerID] = toAdd;

      chrome.storage.sync.set(obj, function () {
        console.log("added", obj, " to PE list");
        addPersonalEntryID(data.personalEntryIDs, toAdd.zoomerID); //storing the storage value in a variable and passing to update function
        callback();
      });

    }
  );
}




function editZoomerItem(zoomerID, updatedObject, callback) {
  IDLookup(zoomerID, function (foundClass) {
    if (foundClass !== undefined) {

      var updatedClass = foundClass;
      for (const key in updatedObject) {
        updatedClass[key] = updatedObject[key];
      }
      var obj = {};
      obj[zoomerID] = updatedClass;
      //then call the set to update with modified value
      chrome.storage.sync.set(obj, function () {
        console.log(`updating to ${updatedClass}`);
        callback(foundClass);
      });

    }
  });
}