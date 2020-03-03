require('dotenv').config({ path: __dirname + '../../.env' })
const express = require('express')()
const http = require('http').createServer(express)
const bodyParser = require('body-parser')
const compression = require('compression')

//Express config
express.use(compression())
express.use(bodyParser.json())
express.use(bodyParser.urlencoded({ extended: true }))
express.use('/', require('./services/reactRenderer'))
express.use('/api/', require('./services/operations'))

express.use(require('express').static('public'))

http.listen(3000, () => console.log('Webhook server is listening, port 3000'))

