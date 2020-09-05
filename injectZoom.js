document.body.style.backgroundColor = "orange";


(function () {
	chrome.storage.sync.get("classes", function (result) {

		var currentURL = window.location.href.substring(0, window.location.href.indexOf('#'));
		var currentClass = findElement(result.classes, 'url', currentURL)
		console.log(currentClass);
		
		//var className = JSON.stringify(currentClass.classinfo.subj_area_cd).replace(/\"/g, "")
		var className = JSON.stringify(extractClassName(currentClass)).replace(/\"/g, "")

		var classSection = JSON.stringify(currentClass.classinfo.class_section).replace(/\"/g, "")

		var classPassword, passwordText;
		if (currentClass.password) {
			classPassword = JSON.stringify(currentClass.password).replace(/\"/g, "");
			navigator.clipboard.writeText(classPassword);
		} else {
			classPassword = "No Password!"
		}

		document.getElementsByClassName("_2XjT-0pJ")[0].innerHTML = "<h1>Joining " + [className, classSection].join(' ') + "</h1>" + document.getElementsByClassName("_2XjT-0pJ")[0].innerHTML
		var password = document.createElement('p');

		passwordText = ["Password is ", classPassword, ". Password has been copied to your clipboard."]
		var node1 = document.createTextNode(passwordText[0])

		var node2 = document.createElement("span");
		node2.className = "password";
		passwordAnchor = document.createElement('a')
		passwordAnchor.onclick = function() {
			navigator.clipboard.writeText(classPassword);
		}
		passwordAnchor.appendChild(document.createTextNode(passwordText[1]))
		node2.appendChild(passwordAnchor)

		var node3 = document.createTextNode(passwordText[2])


		password.appendChild(node1)
		password.appendChild(node2)
		password.appendChild(node3)
		console.log(password)
		document.getElementsByTagName("h1")[0].insertAdjacentElement('afterend', password);

	});
	// just place a div at top right
	// var div = document.createElement('div');
	// div.style.position = 'fixed';
	// div.style.top = 0;
	// div.style.right = 0;
	// div.textContent = 'Injected!';
	// document.body.appendChild(div);

})();