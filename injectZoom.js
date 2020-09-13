document.body.style.backgroundColor = "orange";

function copyTextToClipboard(text) {
	console.log("copying to clipboard:", text)
	chrome.runtime.sendMessage({
		type: 'copy',
		text: text
	});
}

function createClassText(currentClass) {
	var className = extractClassName(currentClass);

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

		var node2 = $(`<span><a id="click-password">${passwordText[1]}</a></span>`)
		// var node2 = document.createElement("span");
		// node2.className = "password";
		// passwordAnchor = document.createElement('a')
		// passwordAnchor.onclick = function () {
		// 	navigator.clipboard.writeText(classPassword);
		// }
		// passwordAnchor.appendChild(document.createTextNode(passwordText[1]))
		// node2.appendChild(passwordAnchor)

		password.append(passwordText[0], node2, passwordText[2])

		node2.click(function () {
			console.log("copying to clipboard:", classPassword)
			navigator.clipboard.writeText(classPassword);
		});
	}
	return password;
}

(function () {
	// TODO: what if same Zoom link for lecture class, and for OH personal entry?
	// Maybe pass a URL parameter to differentiate?
	chrome.storage.sync.get("classes", function (result1) {
		chrome.storage.sync.get("personal", function (result2) {

			var currentURL = window.location.href.substring(0, window.location.href.indexOf('#'));
			var currentClass = findElement(result1.classes, 'url', currentURL);
			var currentPersonal = findElement(result2.personal, 'url', currentURL);

			// only inject if we actually found a matching class or personal entry
			if (currentClass || currentPersonal) {
				var info;
				if (currentClass) {
					info = createClassText(currentClass)
				} else if (currentPersonal) {
					info = createPersonalText(currentPersonal)
				}
				// only inject if the class's name is not undefined, i.e. we found a matching class
				var helperText = $("<h1></h1>").text(`Joining ${info[0]}`);
				$("._2XjT-0pJ").prepend(createPasswordText(info[1]));
				$("._2XjT-0pJ").prepend(helperText);
			}
		});
	});

})();