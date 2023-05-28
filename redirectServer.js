// set up plain http server
const express = require('express');
const fs = require('fs');

const http = express();

// To prevent theft of cookies over HTTP
const session = require('cookie-session');
http.use(
    session({
        secret: "some secret",
        httpOnly: true,  // Don't let browser javascript access cookies.
        secure: true, // Only use cookies over https.
    })
);

// set up a route to redirect http to https
http.get('*', function(req, res) {
    res.redirect('https://' + req.headers.host + req.url);
    console.log('redirecting');
})

// have it listen on the non-secure port
const independent = JSON.parse(fs.readFileSync('independent.json').toString());
http.listen(independent.port, independent.fetchDN, function() {
    console.log(`EmEnKay unsecure redirect server listening on port ${independent.port}`);
});
