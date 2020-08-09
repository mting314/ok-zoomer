document.body.style.backgroundColor="orange";

(function() {
	chrome.storage.sync.get("classes", function(result) {
		var currentURL = window.location.href.substring(0, window.location.href.indexOf('#'));
		document.getElementsByClassName("_2XjT-0pJ")[0].innerHTML = "<h1>Joining " + JSON.stringify(findElement(result.classes, 'url', currentURL).name).replace(/\"/g, "") + "</h1>" + document.getElementsByClassName("_2XjT-0pJ")[0].innerHTML
	});
	// just place a div at top right
	// var div = document.createElement('div');
	// div.style.position = 'fixed';
	// div.style.top = 0;
	// div.style.right = 0;
	// div.textContent = 'Injected!';
	// document.body.appendChild(div);

})();