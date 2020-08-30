document.body.style.backgroundColor = "orange";

// javascript: (function () {
// 	function l(u, i) {
// 		var d = document;
// 		if (!d.getElementById(i)) {
// 			var s = d.createElement('script');
// 			s.src = u;
// 			s.id = i;
// 			d.body.appendChild(s);
// 		}
// 	}
// 	l('//code.jquery.com/jquery-3.2.1.min.js', 'jquery')
// })();


(function () {
	chrome.storage.sync.get("classes", function (result) {

		var currentURL = window.location.href.substring(0, window.location.href.indexOf('#'));
		var currentClass = findElement(result.classes, 'url', currentURL)
		console.log(currentClass);
		var className = JSON.stringify(currentClass.name).replace(/\"/g, "")
		var classType = JSON.stringify(currentClass.type).replace(/\"/g, "")

		var classPassword;
		if (currentClass.password) {
			classPassword = JSON.stringify(currentClass.password).replace(/\"/g, "")
		} else {
			classPassword = "No Password!"
		}

		document.getElementsByClassName("_2XjT-0pJ")[0].innerHTML = "<h1>Joining " + [className, classType].join(' ') + "</h1>" + document.getElementsByClassName("_2XjT-0pJ")[0].innerHTML
		var password = document.createElement('p');

		var passwordText = ["Password is ", classPassword, ". Password has been copied to your clipboard."]
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

		navigator.clipboard.writeText(classPassword);

	});
	// just place a div at top right
	// var div = document.createElement('div');
	// div.style.position = 'fixed';
	// div.style.top = 0;
	// div.style.right = 0;
	// div.textContent = 'Injected!';
	// document.body.appendChild(div);

})();