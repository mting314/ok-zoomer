function copyTextToClipboard(text) {
	console.log("copying to clipboard:", text)
	chrome.runtime.sendMessage({
		type: 'copy',
		text: text
	});
}

function createClassText(currentClass) {
	var fullName = extractClassName(currentClass, true);

	var classPassword;
	if (currentClass.password) {
		classPassword = currentClass.password;
		copyTextToClipboard(JSON.stringify(classPassword).replace(/\"/g, ""));
	}

	return [fullName, classPassword];
}

function createPasswordText(classPassword) {
	var password = $("<p></p>")
	if (!classPassword) {
		password.append("No password for this Zoom Link!");
	} else {
		passwordText = ["Password is ", classPassword, ". Password has been copied to your clipboard."]

		var node2 = $(`<span><a id="click-password">${passwordText[1]}</a></span>`)

		password.append(passwordText[0], node2, passwordText[2])

		node2.on("click", function () {
			console.log("copying to clipboard:", classPassword)
			navigator.clipboard.writeText(classPassword);
		});
	}
	return password;
}

(function () {
	// TODO: what if same Zoom link for lecture class, and for OH personal entry?
	// Maybe pass a URL parameter to differentiate?
	getAllClasses(function (classList) {
		chrome.storage.sync.get("personal", function (result) {
			var currentURL = window.location.href.substring(0, window.location.href.indexOf('#'));
			const regex = /j\/\d{9,11}/;
			const found = currentURL.match(regex);
			if (found != null) {
				var foundID = found[0].match(/\d/g).join("");
				var currentClass = findElement(classList, 'url', foundID);
				var currentPersonal = findElement(result.personal, 'url', foundID);
			}

			info = createClassText(currentClass) ?? createClassText(currentPersonal);

			// only inject if we actually found a matching class or personal entry
			if (info !== undefined) {
				var helperText = $("<h1></h1>").text(`Joining ${info[0]}`);
				$("._2XjT-0pJ").prepend(createPasswordText(info[1]));
				$("._2XjT-0pJ").prepend(helperText);
			}
		});
	});

})();