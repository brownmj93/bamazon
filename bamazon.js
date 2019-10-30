var mysql = require("mysql");
var inquirer = require("inquirer");

var totalCost = 0;
var stock_quantity = 0;
var quantity = 0;
var product_id = 0;
var item_price = 0;

// create the connection information for the sql database
var connection = mysql.createConnection({
    host: "localhost",
    port: '3306',
    user: 'root',
    password: 'Manduur01*',
    database: "bamazon"
});

// connect to the mysql server and sql database
connection.connect(function (err) {
    if (err) throw err;
    // run the start function after the connection is made to prompt the user
    startMenu();
});

function startMenu() {
    inquirer
        .prompt({
            name: "menuOption",
            type: "list",
            message: "What would you like to do? ",
            choices: ["Buy Product", "Checkout", "EXIT"]
        })
        .then(function (answer) {
            if (answer.menuOption === "Buy Product") {
                buyProduct();
            }
            else if (answer.menuOption === "Checkout") {
                checkout();
            }
            else {
                connection.end();
            }
        });
}

function buyProduct() {
    connection.query("select * from products", function (err, res) {
        if (err) throw err;

        //Display products
        var options = [];
        for (var i = 0; i < res.length; i++) {
            var description = res[i].product_name + " $" + res[i].price;
            options.push(description);
        }
        inquirer
            .prompt([
                {
                    name: "selectProduct",
                    type: "rawlist",
                    choices: options,
                    message: "What would you like to buy? "
                },
                {
                    name: "quantity",
                    type: "number",
                    message: "How many would you like to buy? "
                }
            ])
            .then(function (answer) {
                //Check to see if quantity entered is available
                quantity = parseInt(answer.quantity);
                product_id = (options.indexOf(answer.selectProduct)) + 1;
               
                //Loop through the table to find the product & to check for quantity
                for (var j = 0; j < res.length; j++) {
                    if (res[j].item_id === product_id) {
                        stock_quantity = res[j].stock_quantity;
                        item_price = res[j].price;
                        if (quantity <= res[j].stock_quantity) {
                            updateDB();
                            console.log("It's been added to your cart!");
                            buyMoreProduct();
                        }
                        else {
                            //Let user know how many are in stock
                            inquirer
                            .prompt([
                                {
                                    name:"availableQuantity",                                
                                    message: "We have "+ res[j].stock_quantity + " in stock. How many would you like to buy? ",
                                    validate: function(value) {
                                        if (isNaN(value) === false && parseInt(value) > 0 && parseInt(value) <= stock_quantity) {
                                            return true;
                                        }
                                        return "Please choose a different quantity";
                                    }
                                }
                            ])
                            .then(function(answer2) {
                                quantity = parseInt(answer2.availableQuantity);
                                updateDB();
                                console.log("It's been added to your cart!");
                                buyMoreProduct();
                            })
                        }
                    }
                }
            })

    })
}

function updateDB() {
    connection.query("update products set ? where ?", 
    [
        {
            stock_quantity: stock_quantity-quantity
        },
        {
            item_id: product_id
        }
    ],
    function (error) {
        if (error) throw err;
    }
    );

    totalCost += quantity * item_price;
}

function buyMoreProduct() {
    inquirer
    .prompt({
        name: "yesOrNo",
        type:  "list",
        message: "Would you like to buy more products? ",
        choices: ["Yes", "No"]
    })
    .then(function(answer) {
        if (answer.yesOrNo === "Yes") {
            buyProduct();
        }
        else {
            startMenu();
        }
    });
}

function checkout() {
    console.log("Your total price is $"+totalCost+". Thank you for shopping with BAMAZON!");
    connection.end();
}