document.body.style.backgroundColor = "orange";

(function () {
	const regex = /.+?(?=<)/


	chrome.storage.sync.get("classes", function (result) {
		var benis = document.getElementsByClassName('planneritembox')
		var classNames = [];
		for (var i = 0; i < result.classes.length; i++) {
			console.log(result.classes[i].name);
			classNames.push(result.classes[i].name);
		}
		console.log(benis);
		for (var i = 0; i < benis.length; i++) {
			console.log(benis[i]);
			if (classNames.includes(benis[i].innerHTML.match(regex)[0].toUpperCase())) {
				var matchedClass = benis[i].innerHTML.match(regex)[0].toUpperCase()
				console.log("Found a match: " + benis[i].innerHTML.match(regex)[0]);
				// TODO: Don't use innerHTML!
				var link = document.createElement("a")
				link.href = 'https://www.google.com/';
				var newtext = document.createTextNode("click here!");
				link.appendChild(newtext);
				benis[i].appendChild(link); 
				console.log(benis[i].innerHTML);
				//benis[i].innerHTML = benis[i].innerHTML.replace(regex, findElement(result.classes, 'name', matchedClass)['time'])
			}
		}

	});
})();


// just place a div at top right
// var div = document.createElement('div');
// div.style.position = 'fixed';
// div.style.top = 0;
// div.style.right = 0;
// div.textContent = 'Injected!';
// document.body.appendChild(div);