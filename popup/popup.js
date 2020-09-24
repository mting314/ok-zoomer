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
        personal: []
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
    chrome.storage.sync.get({
        personal: []
      },
      function (data) {
        var totalList = classList.concat(data.personal)
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
    var darkOn = style.darkOn;
    if (darkOn) {
      $('#lightswitch').prop('checked', true);
      $('body, #nav, .table, .modal-content, footer').addClass("darkmode");
    }
    chrome.storage.sync.set({
      'darkOn': darkOn
    }, function () {
      console.log('Darkmode started ' + darkOn);
    })


  })

  // Dark Mode [toggle]
  $('#lightswitch').on("click", function () {
    chrome.storage.sync.get({
      'darkOn': true
    }, function (style) {
      var darkOn = !style.darkOn;
      chrome.storage.sync.set({
        'darkOn': darkOn
      });
    })
    $('body, #nav, .modal-content, .table, footer').toggleClass("darkmode");
  });


  // Delete Class 
  $("#classlist").on("click", ".del", function () {
    var classRow = $(this).parent();
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
    var zoomerID = $('#deletemodal').prop('name');
    deleteZoomerItem(zoomerID, function (oldItem) {
      var $alertBox = $("#change-alert")
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
    var zoomerID = $(this).parent().parent().attr("id");
    IDLookup(zoomerID, function (foundClass) {
      if (foundClass.isLink) {
        if (foundClass.url != "") {
          window.open(foundClass.url);
        }
      } else {
        window.open(createURLfromID(foundClass.url, foundClass.password))
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
    chrome.storage.sync.get({
      'personal': {}
    }, function (data) {
      // Reset error message
      $('#error-message').text('');
      var urlData;
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

      var entryInfo = {
        name: $("#className").val() == "" ? "Zoom Meeting" : $("#className").val(),
        days: "",
        time: "",
      };
      var now = new Date();
      var start_time = new Date(now.toLocaleString('en-US', {
        timeZone: "America/Los_Angeles"
      })).getTime();
      var end_time = new Date(start_time);
      end_time.setDate(end_time.getDate() + 7 * 12); // make personal entry artificially end in 12 weeks
      end_time = end_time.getTime();

      var newPersonal = {
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
      addPersonal(data.personal, newPersonal, function () {
        // visual update
        $("#absence").css('display', 'none');
        addClassDisplay(newPersonal);
        $('#addModal').modal('hide');

        // reset form fields back to default dance
        $('#classURL').val('');
        $('#className').val('');
      });
    })
  })

  $("#classlist").on("keypress", ".namedisplay", function (e) {
    if (e.which == '13') {
      // blur the textbox
      $(this).children()[0].blur();
    }
  });

  $("#classlist").on("focusout", ".namedisplay", function () {
    var zoomerID = $(this).parent()[0].id;
    var updatedName = $(this).text();
    saveName(zoomerID, updatedName);
  });

  // Toggle the edit menu
  $('#classlist').on("click", ".edit", function () {
    var parentId = $(this).parent()[0].id; // class [classrow] id
    var previousId = $('#editmodal').prop('name');
    console.log('previous: ' + previousId + ", now: " + parentId);
    // prevent unnecessary reloading
    if (parentId != previousId) {
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
      //     var meeting = classes.classList[parentId];
      IDLookup(parentId, function (foundClass) {

        $('#remindinput').val(foundClass.remindTime);
        $('#remindtime').hide();
        if (foundClass.sendNotifications) {
          $('#remindtoggle').prop('checked', true);
          $('#remindtime').show();
          $('#remindinput').select();
          $('#remindinput').blur();
        }

        if (foundClass.password) {
          $('#password').attr("spellcheck", false);
          $('#password').attr("value", foundClass.password);
          // the following is included so thxe label rides above 
          $('#password').select();
          $('#password').blur();
        }
        $('#editpasscontainer').css('display', 'block');
        $('#exportcontainer').css('display', 'block');

        if (foundClass.isLink) {
          $('#editmodal').children(".modal-header").children(".modal-title").html('Editing Link <br><span style="font-size:small">' + parentId + '</span>');
        } else {
          $('#editmodal').children(".modal-header").children(".modal-title").text('Editing #' + parentId);
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
        for (var i = 0; i < foundClass.classTimes.length; i++) {
          var timeElement = document.createElement("li");
          timeElement.className = "classtime clickable list-group-item";
          timeElement.setAttribute("data-id", i);
          var fTime = formatTime(foundClass.classTimes[i].split(":"));
          timeElement.innerText = fTime;
          $("#scheduledtimes")[0].appendChild(timeElement);
        }
      } else {
        $('#schedulemsg').text(" - None Yet!")
      }
    })
  }

  $('#remindtoggle').change(function () {
    var editedId = $('#editmodal').prop('name');
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
    var editedId = $('#editmodal').prop('name');
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

  // remove a classtime
  $('#editmodal').on('click', '.classtime', function (event) {
    var clickedIndex = $(this).data("id");
    var parentId = $('#editmodal').prop('name');
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
    var editedId = $('#editmodal').prop('name');
    var day = $("#dayselect option:selected").val(); // -1 if invalid
    var time = $("#schedule").val(); // blank string if invalid
    if (day != -1 && time) {
      IDLookup(editedId, function (foundClass) {
        var fTime = day + ":" + time;
        // only add if not already included
        if (!foundClass.classTimes.includes(fTime)) {
          var updatedTimes = foundClass.classTimes;
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
    var updatedPassword = $('#password').val();
    var zoomerID = $('#editmodal').prop('name');
    editZoomerItem(zoomerID, {
      "password": updatedPassword
    }, function () {
      $("#savepassmsg").css("color", "#1E90FF");
      $("#savepassmsg").text("Saved password!")
    })
  })

  $('#export').on("click", function () {
    var zoomerID = $('#editmodal').prop('name');
    IDLookup(zoomerID, function (foundClass) {
      var exportClass = foundClass;
      delete exportClass.zoomerID;
      delete exportClass.customName;

      var _myArray = JSON.stringify(foundClass, null, 4); //indentation in json format, human readable

      var vLink = document.createElement('a'),
        vBlob = new Blob([_myArray], {
          type: "octet/stream"
        }),
        vName = `${extractClassName(foundClass)}.json`,
        vUrl = window.URL.createObjectURL(vBlob);
      vLink.setAttribute('href', vUrl);
      vLink.setAttribute('download', vName);
      vLink.click();
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
  $("#fakeImp").on("click", function () {
    $('#importOrig').trigger("click")
  })

  $('#importOrig').change(importFun)

  $("#change-alert").hide();
})

function importFun(e) {
  var files = e.target.files,
    reader = new FileReader();
  reader.onload = _imp;
  reader.readAsText(files[0]);
}

function _imp() {
  var _myImportedData = JSON.parse(this.result);
  _myImportedData.zoomerID = randomID();
  console.log(_myImportedData);
  addClass(_myImportedData, function () {
    $("#absence").css('display', 'none');
    addClassDisplay(_myImportedData);
    $("#importOrig").val(''); //make sure to clear input value after every import
  })
}

function formatTime(time) {
  var day = parseDayOfWeek(time[0]);
  var hour = time[1] % 12 ? time[1] % 12 : 12;
  var min = time[2];
  var meridiem = parseInt(time[1] / 12) ? "PM" : "AM";
  return day + " @ " + hour + ":" + min + " " + meridiem;
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
  var classRow = $(`<tr class="class d-flex align-items-center" id="${classObject.zoomerID}"></tr>`)

  var classDescriptor = $(`<td class= "col-5 text-truncate text-center namedisplay"></td>`)

  var nameDiv = $(`<div class="namediv" style="text-align: center"></div>`).text((classObject.customName != undefined) ? classObject.customName : extractClassName(classObject, true))
  nameDiv.attr('contenteditable', 'true');
  nameDiv.attr('spellcheck', 'false');


  var classButton = $(`<button class="btn btn-primary btn-block join" style="display: flex;align-items: center;justify-content: center;">${(classObject.url == "") ? "No Link" : classObject.url}</button>`)
  // classButton.attr("data-content", classObject.url);

  var temp = $(`<td class="col-5"></td>`).append(classButton);
  classButton = temp;
  var button = $(`<td class="col-1 clickable"></td>`)

  classDescriptor.append(nameDiv);
  classRow.append(classDescriptor, classButton, button.clone().addClass("del").append(`<i class="fa fa-trash"></i>`), button.clone().addClass("edit").append(`<i class="fa fa-cog"></i>`));
  $("#classlist").append(classRow);
}