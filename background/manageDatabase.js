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
        chrome.storage.sync.get({
            personal: []
          },
          function (data) {
            console.log(data.personal);
            addPersonal(data.personal, msg.toAdd, function () {});
            createAlarms(msg.toAdd);
            portFromCS.postMessage({
              type: "reload"
            });
          }
        );

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
            personal: []
          },
          function (data) {
            try {
              console.log(data.personal);
              // nothing personnel, kiddo
              var oldPersonal = deletePersonal(data.personal, msg.zoomerID);
              portFromCS.postMessage({
                oldItem: oldPersonal,
                type: "successDeletePersonal"
              });
            } catch (err) {
              portFromCS.postMessage({
                type: "failureDeletePersonal",
                error: err.toString()
              });
            }
          }
        );

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

function addClass(toAdd, callback) {
  chrome.storage.sync.get({
      classIDs: []
    },
    function (data) {

      // this weird setup allows me to add each class as an individual object to the storage
      // importantly, with the zoomerID as the key
      var obj = {};
      obj[toAdd.zoomerID] = toAdd;

      chrome.storage.sync.set(obj, function () {
        console.log("added",  obj, " to class list");
        addClassID(data.classIDs, toAdd.zoomerID); //storing the storage value in a variable and passing to update function
        // createClassAlarm(msg.toAdd);
        createAlarms(toAdd);
        callback();
      });

    }
  );
}

function deleteZoomerItem(zoomerID, callback) {
  IDLookup(zoomerID, function (foundClass, foundIndex) {
    if (foundIndex == -1) {
      chrome.storage.sync.get({
          classIDs: []
        },
        function (data) {
          deleteClass(data.classIDs, parseInt(zoomerID), function (oldClass) {
            callback(oldClass)
          });
        });
    } else {
      chrome.storage.sync.get({
          personal: []
        },
        function (data) {
          var oldPersonal = deletePersonal(data.personal, zoomerID)
          callback(oldPersonal);
        })
    }
  });
}

// takes zoomerID as a int
function deleteClass(array, zoomerID, callback) {
  chrome.storage.sync.get(zoomerID.toString(), function (foundClass) {
    var oldClass = foundClass[zoomerID];
    if (oldClass) {
      // if we found a class with that ID, first remove it from classIDs list

      // then remove the class object itself from storage
      chrome.storage.sync.remove(zoomerID.toString(), function (Items) {
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

function addPersonal(array, toAdd, callback) {
  array.push(toAdd);
  //then call the set to update with modified value
  chrome.storage.sync.set({
    personal: array
  }, function () {
    console.log("added to personal list with new values");
    callback();
  });
}


function deletePersonal(array, zoomerID) {
  var oldPersonal = findElement(array, "zoomerID", zoomerID);
  if (oldPersonal) {
    array.splice(array.indexOf(oldPersonal), 1);
    //then call the set to update with modified value
    chrome.storage.sync.set({
      personal: array
    }, function () {
      deleteAlarm(zoomerID)
      console.log(`removed ${JSON.stringify(oldPersonal)} from personal entries list`);
    });
    return oldPersonal;
  } else {
    throw "could not find personal entry with id: " + zoomerID;
  }
}


function editZoomerItem(zoomerID, updatedObject, callback) {
  IDLookup(zoomerID, function (foundClass, foundIndex) {
    if (foundClass != undefined) {
      if (foundIndex == -1) { // if the found index is -1, it's a class
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
      } else {
        chrome.storage.sync.get({
            personal: []
          },
          function (data) {
            var array = data.personal;
            var oldPersonal = array[foundIndex];
            for (const key in updatedObject) {
              oldPersonal[key] = updatedObject[key];
            }
            array[foundIndex] = oldPersonal;
            //then call the set to update with modified value
            chrome.storage.sync.set({
              personal: array
            }, function () {
              callback(oldPersonal);
            });
          })
      }
    }
  });
}