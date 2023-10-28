const express = require('express');
const path = require('path');
const axios = require('axios');
const bodyParser = require('body-parser');
const app = express();
const port = process.env.PORT || 3000;

app.use(bodyParser.json());
app.use(bodyParser.urlencoded({ extended: true }));
app.use(express.static('public'));
app.set('view engine', 'ejs');
app.set('views', path.join(__dirname, 'views')); 

let bearerToken = ''; 

//*********Method to Authenticate the user and get the bearer token*************

app.post('/login', async (req, res) => {
    const { login_id, password } = req.body;
    try {
        const authResponse = await axios.post('https://qa2.sunbasedata.com/sunbase/portal/api/assignment_auth.jsp', {
            login_id,
            password
        });
        bearerToken = authResponse.data.access_token;
        console.log(bearerToken);
        res.redirect('/customer_list');
    } catch (error) {
        console.log(error.message);
        res.status(401).send('Invalid Authorization');
    }
});


// ************Method to Get the list of customers and pass it to customer_list.ejs**************8
app.get('/customer_list', async (req, res) => {
    try {
        const response = await axios.get('https://qa2.sunbasedata.com/sunbase/portal/api/assignment.jsp?cmd=get_customer_list', {
            headers: {
                Authorization: `Bearer ${bearerToken}`
            }
        });

        const customerData = response.data;
        // console.log(customerData);
        res.render('customer_list', { customers: customerData });
    } catch (error) {
        res.status(401).send('Invalid Authorization');
        console.log(error.message);
    }
});

//*****************Method to display the HTML form**************
app.get('/add_customer', (req, res) => {
    res.render('add_customer');
});



// **********Method to Add a new customer*********************
app.post('/add_customer', async (req, res) => {
    const customerData = req.body;
    try {
        const response = await axios.post('https://qa2.sunbasedata.com/sunbase/portal/api/assignment.jsp?cmd=create', customerData, {
            headers: {
                Authorization: `Bearer ${bearerToken}`
            }
        });

        res.redirect('/customer_list');
    } catch (error) {
        res.status(400).send('Failed to create customer');
    }
});


//***************RMethod to Delete a customer*********************
app.post('/delete_customer', async (req, res) => {
    const { uuid } = req.body;

    try {
        const response = await axios.post(`https://qa2.sunbasedata.com/sunbase/portal/api/assignment.jsp?cmd=delete&uuid=${uuid}`, null, {
            headers: {
                Authorization: `Bearer ${bearerToken}`,
            },
        });
        
        if (response.status === 200) {
            res.render('user_deleted');
        } else {
            res.status(500).send('Error: Not deleted');
        }
    } catch (error) {
        res.status(400).send('UUID not found');
    }

    
});


//************Method to modify customer form************

app.get('/modify_customer', (req, res) => {
    const uuid = req.query.uuid; // Get the UUID from the query parameters
    res.render('modify_customer', { customer: { uuid } });
});


app.post('/update_customer', async (req, res) => {
    // console.log("Before the axios post request");
    const { uuid, first_name, last_name, street, address, city, state, email, phone } = req.body;

    // console.log("data while posting " + " " +  uuid, first_name, last_name, street, address, city, state, email, phone );
    try {
        const response = await axios.post(`https://qa2.sunbasedata.com/sunbase/portal/api/assignment.jsp?cmd=update&uuid=${uuid}`, {
            first_name: first_name,
            last_name: last_name,
            street: street,
            address: address,
            city: city,
            state: state,
            email: email,
            phone: phone
        }, {
            headers: {
                Authorization: `Bearer ${bearerToken}`
            }
        });
    
        if (response.status === 200) {
            res.render('user_modified');  //redirecting it ro the messgage page
        } else {
            res.status(500).send('Error: Not updated');
        }
    } catch (error) {
        res.status(500).send('Error: Not updated');
    }
    
});



app.listen(port, () => {
    console.log('App is running');
});
