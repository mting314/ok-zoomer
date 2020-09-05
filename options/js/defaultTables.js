// // Basic example
// var example1 = new BSTable("table1");
// example1.init();

// Example with a add new row button & only some columns editable & removed actions column label
var example2 = new BSTable("table2", {
  editableColumns: "0,1,2",
  $addButton: $('#table2-new-row-button'),
  onEdit: function () {
    console.log("EDITED");
  },
  advanced: {
    columnLabel: ''
  }
});
example2.init();



function dynamicTableValuesExample() {
  // Generate new values for the table and show how BSTable updates
  let names = ['Matt', 'John', 'Billy', 'Erica', 'Sammy', 'Tom', 'Tate', 'Emily', 'Mike', 'Bob'];
  let numberOfRows = Math.floor(Math.random() * 10);

  document.getElementById("table3-body").innerHTML = ''; // Clear current table
  for (let i = 0; i < numberOfRows; i++) {
    let randomNameIndex = Math.floor(Math.random() * 10);

    let row = document.createElement("tr");
    row.innerHTML = `<th scope="row">` + i + `</th><td>Value</td><td>` + names[randomNameIndex] +
      `</td><td>@twitter</td>`;
    document.getElementById("table3-body").append(row);
  }

  example3.refresh();
}