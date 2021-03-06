$(function () {

  $('#cleardb').on("click", function () {
    // this is sort of a nuclear option, but hey it works and I'm lazy

    chrome.storage.sync.clear(function () {
      chrome.runtime.sendMessage({
        type: 'speedchat',
      });
      // start arrays off empty to avoid undefined issues later
      chrome.storage.sync.set({
        classIDs: []
      });
      chrome.storage.sync.set({
        personalEntryIDs: []
      });

      // by default, alarms are turned ON
      chrome.storage.sync.set({
        alarms: true
      });
      window.close('', '_parent', '');
    })
  })

  // Display classes
  getAllClasses(function (classList) {
    getAllPersonalEntries(function (data) {
        let totalList = classList.concat(data)
        if (totalList.length != 0) {
          $("#absence").css('display', 'none');
          totalList.forEach((element) => {
            console.log(element);
            addClassDisplay(element);
            //$('#classlist').text(`${key}: ${classes[key]}`);
          });
        } else {
          $("#absence").css('display', 'flex');
        }
      })
  })

  // Dark Mode [load]- defaulted to true
  chrome.storage.sync.get({
    'darkOn': true
  }, function (style) {
    let darkOn = style.darkOn;
    if (darkOn) {
      // $('#lightswitch').prop('checked', true);
      $('body, #nav, .table, .modal-content, footer').addClass("darkmode");
    }
    chrome.storage.sync.set({
      'darkOn': darkOn
    }, function () {
      console.log('Darkmode started ' + darkOn);
    })


  })

  $('#cleardb').on("click", function () {
    // this is sort of a nuclear option, but hey it works and I'm lazy

    chrome.storage.sync.clear(function () {
      chrome.runtime.sendMessage({
        type: 'speedchat',
      });
      // start arrays off empty to avoid undefined issues later
      chrome.storage.sync.set({
        classIDs: []
      });
      chrome.storage.sync.set({
        personalEntryIDs: []
      });

      // by default, alarms are turned ON
      chrome.storage.sync.set({
        alarms: true
      });
      window.close('', '_parent', '');
    })
  })

  // Delete Class 
  $("#classlist").on("click", ".del", function () {
    let classRow = $(this).parent();
    console.log(classRow);
    $('#deletemodal').prop('name', classRow.attr('id'));
    $('#deletemodal > .modal-header > .modal-title').html('Deleting ' + classRow.find('.namediv').text());
    IDLookup(classRow.attr('id'), function (foundClass) {
      $('#deletemodal').find("#deletedName").text(extractClassName(foundClass, true));
      $('#deletemodal').find("#deletedURL").text(foundClass.url)
      $('#deletemodal').find("#deletedPassword").text((foundClass.password == "") ? "N/A" : foundClass.password)
    });

    $('#deletemodal').closest('.modal').modal('toggle');

  })

  $("#deleteClass").on("click", function () {
    let zoomerID = $('#deletemodal').prop('name');
    deleteZoomerItem(zoomerID, function (oldItem) {
      let $alertBox = $("#change-alert")
      $alertBox.addClass("alert-success");
      $alertBox.text(`${extractClassName(oldItem, true)} was successfully removed from Ok, Zoomer.`)
      $alertBox.fadeTo(5000, 500).slideUp(500, function () {
        $alertBox.slideUp(500);
      });
      // visual update
      $("#" + zoomerID).remove();
      $('#deleteModal').closest('.modal').modal('toggle');
    });
  })

  // Join class
  $("#classlist").on("click", ".join", function () {
    let zoomerID = $(this).parent().parent().attr("id");
    IDLookup(zoomerID, function (foundClass) {
      if (foundClass.isLink) {
        if (foundClass.url != "") {
          window.open(foundClass.url);
        }
      } else {
        window.open(createURLfromID(foundClass.url, foundClass.password, foundClass.username))
      }
    });


  })

  // Enter key procs submit

  $('#classURL, #className').keypress(function (e) {
    if (e.keyCode == 13)
      $('#enterClassURL').trigger("click");
  });

  // Submit class id
  $('#enterClassURL').on("click", function () {

      // Reset error message
      $('#error-message').text('');
      let urlData;
      try {
        urlData = checkIsLink($('#classURL').val());
      } catch (err) {
        if (err.name == 'LengthError' || err.name == 'InputError') {
          $('#error-message').text(err.shortmsg);
          return;
        } else {
          throw err; // let others bubble up
        }
      }

      let entryInfo = {
        name: $("#className").val() === "" ? "Zoom Meeting" : $("#className").val(),
        days: "",
        time: "",
      };
      let now = new Date();
      let start_time = new Date(now.toLocaleString('en-US', {
        timeZone: "America/Los_Angeles"
      })).getTime();
      let end_time = new Date(start_time);
      end_time.setDate(end_time.getDate() + 7 * 12); // make personal entry artificially end in 12 weeks
      end_time = end_time.getTime();

      let newPersonal = {
        entryInfo: entryInfo,
        customName: entryInfo.name,
        timeBoundaries: [start_time, end_time],
        classTimes: [],
        password: "",
        url: urlData[1],
        zoomerID: randomID(),
        sendNotifications: true,
        remindTime: 0,
        isLink: urlData[0],
      };

      // database update
      addPersonal(newPersonal, function () {
        // visual update
        $("#absence").css('display', 'none');
        addClassDisplay(newPersonal);
        $('#addModal').modal('hide');

        // reset form fields back to default dance
        $('#classURL').val('');
        $('#className').val('');
      });

  })

  $("#classlist").on("keypress", ".namedisplay", function (e) {
    if (e.which == '13') {
      // blur the textbox
      $(this).children()[0].blur();
    }
  });

  $("#classlist").on("focusout", ".namedisplay", function () {
    let zoomerID = $(this).parent()[0].id;
    let updatedName = $(this).text();
    saveName(zoomerID, updatedName);
  });

  // Toggle the edit menu
  $('#classlist').on("click", ".edit", function () {
    let parentId = $(this).parent()[0].id; // class [classrow] id
    let previousId = $('#editmodal').prop('name');
    console.log('previous: ' + previousId + ", now: " + parentId);
    // prevent unnecessary reloading
    if (parentId !== previousId) {
      // previous items: set filled values to default values
      $('#scheduledtimes').empty();
      $('#password').attr("value", "");
      $('#savetimemsg').text('');
      $('#savepassmsg').text('');
      $('#remindtoggle').prop('checked', false);

      // Render the edit menu 
      $('#editmodal').prop('name', parentId); // content block

      console.log('Currently editing #' + $('#editmodal').prop('name'));
      // chrome.storage.sync.get({'classList': {}}, function(classes) {
      //     let meeting = classes.classList[parentId];
      IDLookup(parentId, function (foundClass) {

        $('#remindinput').val(foundClass.remindTime);
        $('#remindtime').hide();
        if (foundClass.sendNotifications) {
          $('#remindtoggle').prop('checked', true);
          $('#remindtime').show();
          $('#remindinput').select();
          $('#remindinput').blur();
        }

        $('#nameinput').attr("value", foundClass.username ?? '')

        if (foundClass.password) {
          $('#password').attr("spellcheck", false);
          $('#password').attr("value", foundClass.password);
          // the following is included so thxe label rides above 
          $('#password').select();
          $('#password').blur();
        }

        if (foundClass.username) {
          $('#nameinput').attr("spellcheck", false);
          $('#nameinput').attr("value", foundClass.username);
          // the following is included so thxe label rides above 
          $('#nameinput').select();
          $('#nameinput').blur();
        }
        $('#editpasscontainer').css('display', 'block');
        $('#exportcontainer').css('display', 'block');

        if (foundClass.isLink) {
          $('#editmodal > .modal-header > .modal-title').html('Editing Link <br><span style="font-size:small">' + parentId + '</span>');
        } else {
          $('#editmodal > .modal-header > .modal-title').text('Editing #' + parentId);
        }

      })
      renderSchedule(parentId);
    }
    $('#editmodal').closest('.modal').modal('toggle');
  })

  function renderSchedule(zoomerID) {
    $('#scheduledtimes').empty();
    IDLookup(zoomerID, function (foundClass) {
      if (foundClass.classTimes.length != 0) {
        $('#schedulemsg').text(" - Click to Delete");
        for (let i = 0; i < foundClass.classTimes.length; i++) {
          let timeElement = document.createElement("li");
          timeElement.className = "classtime clickable list-group-item";
          timeElement.setAttribute("data-id", i);
          let fTime = formatTime(foundClass.classTimes[i].split(":"));
          timeElement.innerText = fTime;
          $("#scheduledtimes")[0].appendChild(timeElement);
        }
      } else {
        $('#schedulemsg').text(" - None Yet!")
      }
    })
  }

  $('#remindtoggle').change(function () {
    let editedId = $('#editmodal').prop('name');
    console.log($(this).attr('checked'))
    if ($(this).is(':checked')) {
      editZoomerItem(editedId, {
        "sendNotifications": true
      }, function () {
        console.log(editedId + " now has notifications set to true");
        $('#remindtime').show();
      })
    } else {
      editZoomerItem(editedId, {
        "sendNotifications": false
      }, function () {
        console.log(editedId + " now has notifications set to false");
        $('#remindtime').hide();
      })
    }
  });

  $('#remindinput').change(function () {
    let editedId = $('#editmodal').prop('name');
    IDLookup(editedId, function (foundClass) {
      if ($('#remindinput').val() < 1) {
        $('#remindinput').val(5);
      }
      editZoomerItem(editedId, {
        'remindTime': $('#remindinput').val(),
      }, function () {
        editAlarms(editedId);
        console.log(editedId + " now has remind time set to " + $('#remindinput').val());
      })
    })
  })

  $('#nameinput').change(function () {
    let editedId = $('#editmodal').prop('name');
    IDLookup(editedId, function (foundClass) {
      editZoomerItem(editedId, {
        'username': $('#nameinput').val(),
      }, function () {
        // editAlarms(editedId);
        // unlike changing remind times, we obviously don't have to change anything about the alarms
        // if you're using a different name
        console.log(editedId + " now has remind time set to " + $('#nameinput').val());
      })
    })
  })

  // remove a classtime
  $('#editmodal').on('click', '.classtime', function (event) {
    let clickedIndex = $(this).data("id");
    let parentId = $('#editmodal').prop('name');
    IDLookup(parentId, function (foundClass) {
      // database update
      foundClass.classTimes.splice(clickedIndex, 1);
      editZoomerItem(parentId, {
        classTimes: foundClass.classTimes
      }, function () {
        editAlarms(parentId);
        renderSchedule(parentId);
      });
    })
  });

  // add a classtime
  $('#savetime').on("click", function () {
    let editedId = $('#editmodal').prop('name');
    let day = $("#dayselect option:selected").val(); // -1 if invalid
    let time = $("#schedule").val(); // blank string if invalid
    if (day != -1 && time) {
      IDLookup(editedId, function (foundClass) {
        let fTime = day + ":" + time;
        // only add if not already included
        if (!foundClass.classTimes.includes(fTime)) {
          let updatedTimes = foundClass.classTimes;
          // db update
          updatedTimes.push(fTime);
          editZoomerItem(editedId, {
            classTimes: updatedTimes
          }, function () {
            editAlarms(editedId);
            $("#savetimemsg").css("color", "#1E90FF");
            $("#savetimemsg").text("Saved time!");
            renderSchedule(editedId);
          });
        } else {
          $("#savetimemsg").css("color", "red");
          $("#savetimemsg").text("Already exists!");
        }
      })
    } else {
      $("#savetimemsg").css("color", "red");
      $("#savetimemsg").text("Invalid time!");
    }
  })

  // save password
  $('#savepass').on("click", function () {
    let updatedPassword = $('#password').val();
    let zoomerID = $('#editmodal').prop('name');
    editZoomerItem(zoomerID, {
      "password": updatedPassword
    }, function () {
      $("#savepassmsg").css("color", "#1E90FF");
      $("#savepassmsg").text("Saved password!")
    })
  })

  $('#export').on("click", function () {
    let zoomerID = $('#editmodal').prop('name');
    IDLookup(zoomerID, function (foundClass) {
      let exportClass = foundClass;
      // delete exportClass.zoomerID;
      delete exportClass.customName;

      exportZoomerItem(exportClass);
      $("#exportmsg").css("color", "#1E90FF");
      $("#exportmsg").text("Exported to JSON")
    })
  })

  chrome.storage.sync.get({
      speedchat: []
    },
    function (data) {
      $('#speedchat').text(`"${data.speedchat}"`);
    })

  // setup import (single) class button
  $("#fakeImp").on("click", function () {
    $('#importOrig').trigger("click")
  })

  $('#importOrig').change(importFun)


  // setup export all classes button
  $("#exportAll").on("click", function () {
    let entriesList = [];
    getAllClasses(function (classList) {
      getAllPersonalEntries(function (personalEntries) {
        // Add each class to entriesList
        entriesList = entriesList.concat(classList)
        // And then all personal entries
        entriesList = entriesList.concat(personalEntries)
        if (entriesList.length === 0) {
          // warn user that they have no classes or entries
          let $alertBox = $("#change-alert")
          $alertBox.addClass("alert-danger");
          $alertBox.text("You don't have any classes or entries to export!")
          $alertBox.fadeTo(5000, 500).slideUp(500, function () {
            $alertBox.slideUp(500);
          });
        } else {
          exportZoomerItem(entriesList, multiple = true);
        }

      })
    })
  });

  $("#change-alert").hide();
})


// IMPORT AND EXPORT FUNCTIONS

// import

function importFun() {
  let files = this.files;
  let importedClassIDs = [];
  let importedPersonalIDs = [];
  let idRegex = /_[CP]([\d]*?)\./;
  // when exporting classes, we made sure to end the filename with the zoomer ID.
  // take advantage of that to 

  for (var i = 0; i < files.length; i++) {
    let file = files[i];
    let matches = file.name.match(idRegex);
    if (matches !== null) {
      if (matches[0].includes('C')) {
        importedClassIDs.push(matches[1])
      } else {
        importedPersonalIDs.push(matches[1])
      }
    }
  }

  for (var i = 0; i < files.length; i++) {
    let reader = new FileReader();
    let file = files[i];
    let matches = file.name.match(idRegex);

    if (matches !== null) { // it's a class (ends with _123456789.json)
      reader.onload = function (e) {
        // get file content  
        let bin = e.target.result;
        parseClassEntry(JSON.parse(bin));
        // readFile(index + 1)
      }

    }
    reader.readAsText(file);

  }


  $("#absence").css('display', 'none');

  $("#importOrig").val(''); //make sure to clear input value after every import

  chrome.storage.sync.get(['classIDs'], function (result) {
    console.log('Value currently is ' + result.classIDs);

    let new_array = result.classIDs.concat(importedClassIDs);
    // new_array.push(_myImportedDataArray[index].zoomerID);

    chrome.storage.sync.set({
      classIDs: new_array
    }, function () {
      console.log(`added ${new_array} to class IDs`);
    });
  });

  chrome.storage.sync.get(['personalEntryIDs'], function (result) {
    console.log('Value currently is ' + result.personalEntryIDs);

    let new_array = result.personalEntryIDs.concat(importedPersonalIDs);
    // new_array.push(_myImportedDataArray[index].zoomerID);

    chrome.storage.sync.set({
      personalEntryIDs: new_array
    }, function () {
      console.log(`added ${new_array} to class IDs`);
    });
  });

}

function parseClassEntry(_myImportedClass) {

  addItemOnly(_myImportedClass, function () {
    // visual update
    addClassDisplay(_myImportedClass);

    $("#absence").css('display', 'none');
  });

}


function exportZoomerItem(zoomerItem, multiple = false) {

  if (multiple) {
    var zip = new JSZip();
    for (index in zoomerItem) {
      zoomerItem[index].zoomerID = randomID();
      zip.file(`${extractClassName(zoomerItem[index], true)}_${zoomerItem[index].classInfo !== undefined ? "C" : "P"}${zoomerItem[index].zoomerID}.json`, JSON.stringify(zoomerItem[index], null, 4))
    }
    zip.generateAsync({
        type: "blob"
      })
      .then(function (content) {
        // see FileSaver.js
        saveAs(content, "zoomerItems.zip");
      });
  } else {

    zoomerItem.zoomerID = randomID();
    let _myArray = JSON.stringify(zoomerItem, null, 4); //indentation in json format, human readable
    
    let vLink = document.createElement('a'),
      vBlob = new Blob([_myArray], {
        type: "octet/stream"
      }),
      vName = multiple ? "zoomerItems.json" : `${extractClassName(zoomerItem, true)}_${zoomerItem.zoomerID}.json`,
      vUrl = window.URL.createObjectURL(vBlob);
    vLink.setAttribute('href', vUrl);
    vLink.setAttribute('download', vName);
    vLink.click();
  }
}

function formatTime(time) {
  let day = parseDayOfWeek(time[0]);
  let hour = time[1] % 12 ? time[1] % 12 : 12;
  let min = time[2];
  let meridiem = parseInt(time[1] / 12) ? "PM" : "AM";
  return `${day} @ ${hour}:${min} ${meridiem}`;
}

function saveName(zoomerID, updatedName) {
  editZoomerItem(zoomerID, {
    customName: updatedName
  }, function () {
    console.log("Saving Name:", zoomerID, updatedName)
  })
}

function addClassDisplay(classObject) {
  // Create div for the class: composed of button and breaks
  let classRow = $(`<tr class="class d-flex align-items-center" id="${classObject.zoomerID}"></tr>`)

  let classDescriptor = $(`<td class= "col-5 text-truncate text-center namedisplay"></td>`)

  let nameDiv = $(`<div class="namediv" style="text-align: center"></div>`).text((classObject.customName !== undefined) ? classObject.customName : extractClassName(classObject, true))
  nameDiv.attr('contenteditable', 'true');
  nameDiv.attr('spellcheck', 'false');


  let classButton = $(`<button class="btn btn-primary btn-block join" style="display: flex;align-items: center;justify-content: center;">${(classObject.url == "") ? "No Link" : classObject.url}</button>`)
  // classButton.attr("data-content", classObject.url);

  let temp = $(`<td class="col-5"></td>`).append(classButton);
  classButton = temp;
  let button = $(`<td class="col-1 clickable"></td>`)

  classDescriptor.append(nameDiv);
  classRow.append(classDescriptor, classButton, button.clone().addClass("del").append(`<i class="fa fa-trash"></i>`), button.clone().addClass("edit").append(`<i class="fa fa-cog"></i>`));
  $("#classlist").append(classRow);
}