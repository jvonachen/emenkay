#!/usr/bin/env node

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

const independent = JSON.parse(fs.readFileSync('independent.json').toString());

// set up a route to redirect http to https
http.get('*', function(req, res) {
    const host = req.headers.host.replace(/:[0-9]+/, '');
    console.log(`req.headers.host: ${req.headers.host}, host: ${host}`);
    const url = `https://${host}:${independent.sport}${req.url}`;
    res.redirect(url);
    console.log(`redirecting to ${url}`);
});

// have it listen on the non-secure port
http.listen(independent.port, independent.fetchDN, function() {
    console.log(`EmEnKay unsecure redirect server listening on port ${independent.port}`);
});
