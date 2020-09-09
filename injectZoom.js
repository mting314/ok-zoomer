document.body.style.backgroundColor = "orange";

// https://stackoverflow.com/a/18455088
function copyTextToClipboard(text) {
	//Create a textbox field where we can insert text to. 
	var copyFrom = document.createElement("textarea");

	//Set the text content to be the text you wished to copy.
	copyFrom.textContent = text;

	//Append the textbox field into the body as a child. 
	//"execCommand()" only works when there exists selected text, and the text is inside 
	//document.body (meaning the text is part of a valid rendered HTML element).
	document.body.appendChild(copyFrom);

	//Select all the text!
	copyFrom.select();

	//Execute command
	document.execCommand('copy');

	//(Optional) De-select the text using blur(). 
	copyFrom.blur();

	//Remove the textbox field from the document.body, so no other JavaScript nor 
	//other elements can get access to this.
	document.body.removeChild(copyFrom);
}

function createClassText(currentClass) {
	var className = JSON.stringify(extractClassName(currentClass)).replace(/\"/g, "");

	var classSection = JSON.stringify(currentClass.classInfo.class_section).replace(/\"/g, "");

	var fullName = [className, classSection].join(' ');


	var classPassword;
	if (currentClass.password) {
		classPassword = currentClass.password;
		copyTextToClipboard(JSON.stringify(classPassword).replace(/\"/g, ""));
	}

	return [fullName, classPassword];
}

function createPersonalText(currentPersonal) {
	var fullName = currentPersonal.entryInfo.name;

	var entryPassword;
	if (currentPersonal.password) {
		entryPassword = currentPersonal.password;
		copyTextToClipboard(JSON.stringify(entryPassword).replace(/\"/g, ""));
	}

	return [fullName, entryPassword];
}

function createPasswordText(classPassword) {
	var password = $("<p></p>")
	if (!classPassword) {
		password.append("No password for this Zoom Link!");
	} else {
		passwordText = ["Password is ", classPassword, ". Password has been copied to your clipboard."]

		var node2 = document.createElement("span");
		node2.className = "password";
		passwordAnchor = document.createElement('a')
		passwordAnchor.onclick = function () {
			navigator.clipboard.writeText(classPassword);
		}
		passwordAnchor.appendChild(document.createTextNode(passwordText[1]))
		node2.appendChild(passwordAnchor)

		password.append(passwordText[0], node2, passwordText[2])
	}
	return password;
}

(function () {
	// TODO: what if same Zoom link for lecture class, and for OH personal entry? Maybe pass a URL parameter to differentiate?
	chrome.storage.sync.get("classes", function (result1) {
		chrome.storage.sync.get("personal", function (result2) {

			var currentURL = window.location.href.substring(0, window.location.href.indexOf('#'));
			var currentClass = findElement(result1.classes, 'url', currentURL);
			var currentPersonal = findElement(result2.personal, 'url', currentURL);
			console.log(currentClass, currentPersonal);
			var info;
			if (currentClass) {
				info = createClassText(currentClass)
			} else if (currentPersonal) {
				info = createPersonalText(currentPersonal)
			}

			if (info[1]) {
				$("._2XjT-0pJ").prepend(createPasswordText(info[1]));
			}

			if (info[0]) {
				var helperText = $("<h1></h1>").text(`Joining ${info[0]}`);
				$("._2XjT-0pJ").prepend(helperText);
			}

		});
	});

})();